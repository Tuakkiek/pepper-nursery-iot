import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/auth_user.dart';
import '../models/sensor_reading.dart';
import '../models/user_device.dart';
import '../services/api_service.dart';
import '../services/session_store.dart';

class AppController extends ChangeNotifier {
  final ApiService api;
  final SessionStore sessions;
  final Duration refreshInterval;
  AuthUser? user;
  List<UserDevice> devices = [];
  String? activeId;
  LatestReadingResponse? latest;
  bool restoring = true,
      loadingDevices = false,
      busy = false,
      loadingReading = false;
  String? startupError, deviceError, readingError, sessionMessage;
  Timer? _timer;
  bool _alive = true, _foreground = true;
  int _session = 0, _selection = 0, _deviceRequest = 0;

  AppController({
    required this.api,
    required this.sessions,
    this.refreshInterval = const Duration(seconds: 10),
  }) {
    api.onUnauthorized = () => logout(expired: true);
  }
  bool get authenticated => user != null;
  UserDevice? get activeDevice {
    for (final device in devices) {
      if (device.id == activeId) return device;
    }
    return null;
  }

  void _notify() {
    if (_alive) notifyListeners();
  }

  Future<void> restore() async {
    final session = _session;
    restoring = true;
    startupError = null;
    _notify();
    try {
      final stored = await sessions.read();
      if (!_alive || session != _session) return;
      api.token = stored;
      if (api.token != null) {
        final data = await api.request('GET', '/auth/me');
        if (!_alive || session != _session) return;
        final restoredUser = AuthUser.fromJson(
          data['user'] as Map<String, dynamic>,
        );
        if (restoredUser.isAdmin) {
          api.token = null;
          await sessions.clear();
          sessionMessage = 'Ứng dụng này dành cho tài khoản người dùng cá nhân.';
        } else {
          user = restoredUser;
          await refreshDevices();
        }
      }
    } catch (error) {
      if (session == _session) startupError = error.toString();
    } finally {
      restoring = false;
      _notify();
    }
  }

  Future<void> authenticate({
    required String username,
    required String password,
    String? fullName,
  }) async {
    if (busy) return;
    final session = _session;
    busy = true;
    sessionMessage = null;
    _notify();
    try {
      final data = fullName == null
          ? await api.login(username, password)
          : await api.register(fullName, username, password);
      if (!_alive || session != _session) return;
      final authenticatedUser = AuthUser.fromJson(
        data['user'] as Map<String, dynamic>,
      );
      if (authenticatedUser.isAdmin) {
        api.token = null;
        throw const ApiException(
          'admin_account_not_supported',
          'Ứng dụng này dành cho tài khoản người dùng cá nhân.',
        );
      }
      final token = data['token'] as String;
      await sessions.write(token);
      if (!_alive || session != _session) return;
      _session++;
      api.token = token;
      user = authenticatedUser;
      devices = [];
      activeId = null;
      latest = null;
      deviceError = null;
      startupError = null;
      await refreshDevices(afterMutation: true);
    } finally {
      busy = false;
      _notify();
    }
  }

  Future<void> logout({bool expired = false}) async {
    _session++;
    _selection++;
    _deviceRequest++;
    final session = _session;
    _timer?.cancel();
    api.token = null;
    user = null;
    devices = [];
    activeId = null;
    latest = null;
    loadingReading = false;
    loadingDevices = false;
    busy = true;
    deviceError = null;
    readingError = null;
    startupError = null;
    sessionMessage = expired
        ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
        : null;
    _notify();
    try {
      await sessions.clear();
    } catch (_) {
      sessionMessage =
          'Không thể xóa phiên đã lưu trên thiết bị. Vui lòng thử lại.';
      _notify();
    } finally {
      if (session == _session) {
        busy = false;
        _notify();
      }
    }
  }

  Future<void> refreshDevices({bool afterMutation = false}) async {
    if (!authenticated || loadingDevices || (busy && !afterMutation)) return;
    final session = _session;
    final request = ++_deviceRequest;
    loadingDevices = true;
    deviceError = null;
    _notify();
    try {
      final collection = await api.fetchDevices();
      if (!_alive || session != _session || request != _deviceRequest) return;
      devices = collection.devices;
      final next = devices.any((d) => d.id == collection.activeId)
          ? collection.activeId
          : null;
      if (next != activeId) _clearReading();
      activeId = next;
      _startTimer();
      unawaited(refreshReading());
    } catch (error) {
      if (session == _session && request == _deviceRequest) {
        deviceError = error.toString();
      }
    } finally {
      if (session == _session && request == _deviceRequest) {
        loadingDevices = false;
        _notify();
      }
    }
  }

  Future<void> _mutate(
    Future<void> Function() action, {
    bool clearSelection = false,
    VoidCallback? onSuccess,
  }) async {
    if (busy) return;
    final session = _session;
    _deviceRequest++;
    loadingDevices = false;
    busy = true;
    _notify();
    try {
      await action();
      if (!_alive || session != _session) return;
      if (clearSelection) {
        _clearReading();
        activeId = null;
      }
      onSuccess?.call();
      await refreshDevices(afterMutation: true);
    } finally {
      if (session == _session) {
        busy = false;
        _notify();
      }
    }
  }

  Future<void> claim(String id, String name) =>
      _mutate(() => api.claimDevice(id, name));
  Future<void> rename(String id, String name) =>
      _mutate(() => api.renameDevice(id, name));
  Future<void> remove(String id) => _mutate(
    () => api.removeDevice(id),
    clearSelection: id == activeId,
    onSuccess: () =>
        devices = devices.where((device) => device.id != id).toList(),
  );
  Future<void> select(String id) => _mutate(
    () => api.selectDevice(id),
    clearSelection: true,
    onSuccess: () => activeId = id,
  );

  void _clearReading() {
    _selection++;
    latest = null;
    readingError = null;
    loadingReading = false;
    _timer?.cancel();
  }

  Future<void> refreshReading() async {
    if (!authenticated || activeId == null || loadingReading) return;
    final session = _session, selection = _selection;
    final deviceId = activeId!;
    loadingReading = true;
    _notify();
    try {
      final data = await api.fetchLatestReading(deviceId);
      if (!_alive || session != _session || selection != _selection) return;
      if (data.deviceId != deviceId) {
        throw const ApiException(
          'device_mismatch',
          'Máy chủ trả số đo của thiết bị khác. Vui lòng thử lại.',
        );
      }
      latest = data;
      readingError = null;
    } catch (error) {
      if (session == _session && selection == _selection) {
        latest = null;
        readingError = error.toString();
      }
    } finally {
      if (session == _session && selection == _selection) {
        loadingReading = false;
        _notify();
      }
    }
  }

  void setForeground(bool value) {
    _foreground = value;
    _startTimer();
    if (value) {
      unawaited(refreshDevices());
    }
  }

  void _startTimer() {
    _timer?.cancel();
    if (_foreground && authenticated && activeId != null) {
      _timer = Timer.periodic(refreshInterval, (_) => refreshReading());
    }
  }

  @override
  void dispose() {
    _alive = false;
    _session++;
    _selection++;
    _timer?.cancel();
    api.dispose();
    super.dispose();
  }
}
