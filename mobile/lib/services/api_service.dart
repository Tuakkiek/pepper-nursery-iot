import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../models/auth_user.dart';
import '../models/care_rule.dart';
import '../models/sensor_reading.dart';
import '../models/user_device.dart';

enum DataSourceMode { fixture, live }

enum FixtureScenario {
  normal('latest-normal.json', 'Bình thường (Đủ 5 cảm biến)'),
  partialError('latest-partial-error.json', 'Lỗi một phần cảm biến (DHT22, TDS)'),
  uncalibrated('latest-uncalibrated.json', 'Chưa hiệu chuẩn (HD-38, TDS, pH)'),
  stale('latest-stale.json', 'Dữ liệu cũ (Mất liên lạc > 5 phút)'),
  empty('latest-empty.json', 'Chưa có bản ghi nào'),
  serverError('server-error.json', 'Lỗi máy chủ (500)');

  final String filename;
  final String label;
  const FixtureScenario(this.filename, this.label);
}

class ApiService extends ChangeNotifier {
  static const String defaultCloudUrl = 'https://pepper-nursery-iot.onrender.com';
  static const String defaultLocalUrl = 'http://localhost:8000';
  static const String defaultAndroidEmulatorUrl = 'http://10.0.2.2:8000';
  static const String defaultDeviceId = '1';
  static const int defaultRefreshIntervalSeconds = 5;

  static const Duration _healthTimeout = Duration(seconds: 15);
  static const Duration _apiTimeout = Duration(seconds: 20);
  static const Duration _syncTimeout = Duration(seconds: 25);

  DataSourceMode _mode = DataSourceMode.live; // Mặc định kết nối backend thật
  FixtureScenario _currentScenario = FixtureScenario.normal;
  late String _baseUrl;
  String _deviceId = defaultDeviceId;
  String? _activeDeviceName;

  // Auth state
  String? _token;
  AuthUser? _currentUser;
  final Map<String, ({String password, AuthUser user})> _fixtureUsers = {
    'admin': (
      password: 'admin123',
      user: const AuthUser(
        id: 1,
        username: 'admin',
        role: 'admin',
        fullName: 'Quản trị viên Vườn ươm',
        selectedDeviceId: '1',
      ),
    ),
    'user': (
      password: 'user123',
      user: const AuthUser(
        id: 2,
        username: 'user',
        role: 'user',
        fullName: 'Kỹ thuật viên Vườn ươm',
        selectedDeviceId: '1',
      ),
    ),
  };
  final List<UserDevice> _fixtureDevices = [
    const UserDevice(
      deviceId: '1',
      name: 'Trạm vườn ươm Khay A',
      description: 'Cảm biến ESP32 (Fixture)',
      isActive: true,
      isOnline: true,
    ),
  ];

  // Backend connection status
  bool _isBackendOnline = false;
  String? _lastHealthTimestamp;

  // Auto-refresh state (cập nhật tự động mỗi 5s)
  Timer? _autoRefreshTimer;
  bool _autoRefresh = true;
  int _refreshIntervalSeconds = defaultRefreshIntervalSeconds;
  bool _isAutoRefreshing = false;
  LatestReadingResponse? _latestReading;
  DateTime? _lastRefreshedAt;
  String? _autoRefreshError;

  ApiService() {
    _baseUrl = _getDefaultBaseUrl();
  }

  static String _getDefaultBaseUrl() {
    return defaultCloudUrl;
  }

  DataSourceMode get mode => _mode;
  FixtureScenario get currentScenario => _currentScenario;
  String get baseUrl => _baseUrl;
  String get deviceId => _deviceId;
  String? get activeDeviceName => _activeDeviceName;
  String? get token => _token;
  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null && _currentUser != null;
  bool get isBackendOnline => _isBackendOnline;
  String? get lastHealthTimestamp => _lastHealthTimestamp;

  bool get autoRefresh => _autoRefresh;
  int get refreshIntervalSeconds => _refreshIntervalSeconds;
  bool get isAutoRefreshing => _isAutoRefreshing;
  LatestReadingResponse? get latestReading => _latestReading;
  DateTime? get lastRefreshedAt => _lastRefreshedAt;
  String? get autoRefreshError => _autoRefreshError;

  String get sourceKey =>
      '${_mode.name}|$_baseUrl|$_deviceId|${_currentScenario.name}|${_token ?? ''}';
  String get rulesSourceKey => '${_mode.name}|$_baseUrl|${_token ?? ''}';

  void _invalidateReadingCache() {
    _latestReading = null;
    _lastRefreshedAt = null;
    _autoRefreshError = null;
  }

  set autoRefresh(bool val) {
    if (_autoRefresh != val) {
      _autoRefresh = val;
      if (_autoRefresh) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
      notifyListeners();
    }
  }

  set refreshIntervalSeconds(int val) {
    if (_refreshIntervalSeconds != val && val >= 1) {
      _refreshIntervalSeconds = val;
      if (_autoRefresh) {
        startAutoRefresh();
      }
      notifyListeners();
    }
  }

  /// Khởi động timer tự động làm mới số đo (mặc định mỗi 5 giây)
  void startAutoRefresh() {
    _autoRefreshTimer?.cancel();
    if (!_autoRefresh) return;
    _autoRefreshTimer = Timer.periodic(
      Duration(seconds: _refreshIntervalSeconds),
      (_) => pollLatestReading(),
    );
  }

  /// Tạm dừng timer tự động làm mới
  void stopAutoRefresh() {
    _autoRefreshTimer?.cancel();
    _autoRefreshTimer = null;
  }

  /// Gọi ngầm để cập nhật số đo mới nhất mà không gây gián đoạn giao diện
  Future<LatestReadingResponse?> pollLatestReading() async {
    if (_isAutoRefreshing) return _latestReading;
    _isAutoRefreshing = true;
    try {
      return await fetchLatestReading();
    } catch (e) {
      _autoRefreshError = e.toString().replaceFirst('Exception: ', '');
      notifyListeners();
      return _latestReading;
    } finally {
      _isAutoRefreshing = false;
    }
  }

  set mode(DataSourceMode val) {
    if (_mode != val) {
      _mode = val;
      _activeDeviceName = _mode == DataSourceMode.fixture
          ? _lookupFixtureDeviceName(_deviceId)
          : null;
      _invalidateReadingCache();
      notifyListeners();
    }
  }

  set currentScenario(FixtureScenario val) {
    if (_currentScenario != val) {
      _currentScenario = val;
      _invalidateReadingCache();
      notifyListeners();
    }
  }

  set baseUrl(String val) {
    final clean = val.trim().replaceAll(RegExp(r'/+$'), '');
    if (clean.isNotEmpty && _baseUrl != clean) {
      _baseUrl = clean;
      _invalidateReadingCache();
      notifyListeners();
    }
  }

  set deviceId(String val) {
    final clean = val.trim();
    final nextId = clean.isEmpty ? defaultDeviceId : clean;
    if (_deviceId != nextId) {
      _deviceId = nextId;
      _activeDeviceName = _mode == DataSourceMode.fixture
          ? _lookupFixtureDeviceName(nextId)
          : null;
      _invalidateReadingCache();
      notifyListeners();
    }
  }

  String? _lookupFixtureDeviceName(String id) {
    for (final d in _fixtureDevices) {
      if (d.deviceId == id) return d.name;
    }
    return null;
  }

  Map<String, String> _getHeaders({bool includeContentType = true}) {
    final headers = <String, String>{
      'Accept': 'application/json',
    };
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  /// 1. Kiểm tra trạng thái máy chủ Backend (GET /api/v1/health)
  Future<bool> checkHealth() async {
    if (_mode == DataSourceMode.fixture) {
      _isBackendOnline = true;
      return true;
    }

    try {
      final uri = Uri.parse('$_baseUrl/api/v1/health');
      final response = await http.get(uri).timeout(_healthTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _isBackendOnline = data['status'] == 'ok';
        _lastHealthTimestamp = data['timestamp'] as String?;
        notifyListeners();
        return _isBackendOnline;
      } else {
        _isBackendOnline = false;
        notifyListeners();
        return false;
      }
    } catch (_) {
      _isBackendOnline = false;
      notifyListeners();
      return false;
    }
  }

  /// 2. Lấy số đo mới nhất (GET /api/v1/devices/{device_id}/readings/latest)
  Future<LatestReadingResponse> fetchLatestReading() async {
    final result = _mode == DataSourceMode.fixture
        ? await _loadFixture(_currentScenario.filename)
        : await _fetchFromApi();
    _latestReading = result;
    final fetchedName = result.deviceName?.trim();
    if (fetchedName != null && fetchedName.isNotEmpty) {
      if (_mode == DataSourceMode.live || _activeDeviceName == null) {
        _activeDeviceName = fetchedName;
      }
    }
    _lastRefreshedAt = DateTime.now();
    _autoRefreshError = null;
    if (_mode == DataSourceMode.live) {
      _isBackendOnline = true;
    }
    notifyListeners();
    return result;
  }

  Future<LatestReadingResponse> _loadFixture(String filename) async {
    final assetPath = 'assets/fixtures/$filename';
    final jsonStr = await rootBundle.loadString(assetPath);
    final data = jsonDecode(jsonStr);

    if (filename == 'server-error.json') {
      final msg = data['error']?['message'] ?? 'Lỗi kết nối máy chủ';
      throw Exception(msg);
    }

    return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
  }

  Future<LatestReadingResponse> _fetchFromApi() async {
    final encodedId = Uri.encodeComponent(_deviceId);
    final uri = Uri.parse('$_baseUrl/api/v1/devices/$encodedId/readings/latest');

    final http.Response response;
    try {
      response = await http
          .get(uri, headers: _getHeaders(includeContentType: false))
          .timeout(_apiTimeout);
    } catch (e) {
      _isBackendOnline = false;
      _autoRefreshError = e.toString().replaceFirst('Exception: ', '');
      rethrow;
    }

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      _autoRefreshError = null;
      final data = jsonDecode(response.body);
      return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
    } else if (response.statusCode == 404) {
      // Backend phản hồi hợp lệ nhưng mã thiết bị không tồn tại
      _isBackendOnline = true;
      final msg = 'Thiết bị không tồn tại ($_deviceId)';
      _autoRefreshError = msg;
      throw Exception(msg);
    } else {
      _isBackendOnline = false;
      final msg = _extractErrorMessage(response, 'Lỗi máy chủ');
      _autoRefreshError = msg;
      throw Exception(msg);
    }
  }

  /// 3. Lấy lịch sử số đo (GET /api/v1/devices/{device_id}/readings?limit=20)
  Future<List<HistoryItem>> fetchHistory({int limit = 20}) async {
    if (_mode == DataSourceMode.fixture) {
      final jsonStr = await rootBundle.loadString('assets/fixtures/history.json');
      final data = jsonDecode(jsonStr);
      final historyResponse = HistoryResponse.fromJson(data as Map<String, dynamic>);
      return historyResponse.readings;
    } else {
      final encodedId = Uri.encodeComponent(_deviceId);
      final uri = Uri.parse('$_baseUrl/api/v1/devices/$encodedId/readings?limit=$limit');

      final http.Response response;
      try {
        response = await http
            .get(uri, headers: _getHeaders(includeContentType: false))
            .timeout(_apiTimeout);
      } catch (_) {
        _isBackendOnline = false;
        rethrow;
      }

      if (response.statusCode == 200) {
        _isBackendOnline = true;
        final data = jsonDecode(response.body);
        final historyResponse = HistoryResponse.fromJson(data as Map<String, dynamic>);
        return historyResponse.readings;
      } else {
        throw Exception(_extractErrorMessage(response, 'Không tải được lịch sử'));
      }
    }
  }

  static String _formatYmd(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  static String _formatHms(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  /// 3b. Lọc chi tiết số đo theo ngày và mốc thời gian (GET /api/v1/devices/{device_id}/readings/range)
  /// Tự động quy đổi khoảng thời gian local sang UTC để khớp với MySQL DATETIME trên Backend.
  Future<RangeReadingsResponse> fetchRangeReadings({
    required DateTime startLocal,
    required DateTime endLocal,
    String order = 'desc',
    int page = 1,
    int pageSize = 10,
  }) async {
    final startUtc = startLocal.toUtc();
    final endUtc = endLocal.toUtc();
    final safeOrder = order == 'asc' ? 'asc' : 'desc';
    final safePage = page < 1 ? 1 : page;
    final safePageSize = pageSize.clamp(1, 100);

    final startDateStr = _formatYmd(startUtc);
    final endDateStr = _formatYmd(endUtc);
    final startTimeStr = _formatHms(startUtc);
    final endTimeStr = _formatHms(endUtc);

    if (_mode == DataSourceMode.fixture) {
      final jsonStr = await rootBundle.loadString('assets/fixtures/history.json');
      final data = jsonDecode(jsonStr) as Map<String, dynamic>;
      final historyResponse = HistoryResponse.fromJson(data);
      final filtered = historyResponse.readings.where((item) {
        final ts = (item.reading.recordedAt ?? item.receivedAt)?.toUtc();
        if (ts == null) return false;
        return !ts.isBefore(startUtc) && !ts.isAfter(endUtc);
      }).toList()
        ..sort((a, b) {
          final ta = (a.reading.recordedAt ?? a.receivedAt) ?? DateTime.fromMillisecondsSinceEpoch(0);
          final tb = (b.reading.recordedAt ?? b.receivedAt) ?? DateTime.fromMillisecondsSinceEpoch(0);
          return safeOrder == 'asc' ? ta.compareTo(tb) : tb.compareTo(ta);
        });

      final total = filtered.length;
      final totalPages = total == 0 ? 1 : ((total + safePageSize - 1) ~/ safePageSize);
      final startIndex = (safePage - 1) * safePageSize;
      final pageItems = startIndex < total
          ? filtered.sublist(startIndex, (startIndex + safePageSize).clamp(0, total))
          : <HistoryItem>[];

      return RangeReadingsResponse(
        deviceId: _deviceId,
        startDate: startDateStr,
        endDate: endDateStr,
        total: total,
        page: safePage,
        pageSize: safePageSize,
        totalPages: totalPages,
        readings: pageItems,
      );
    }

    final encodedId = Uri.encodeComponent(_deviceId);
    final uri = Uri.parse('$_baseUrl/api/v1/devices/$encodedId/readings/range').replace(
      queryParameters: {
        'start_date': startDateStr,
        'end_date': endDateStr,
        'start_time': startTimeStr,
        'end_time': endTimeStr,
        'tz': 'UTC',
        'order': safeOrder,
        'page': safePage.toString(),
        'page_size': safePageSize.toString(),
      },
    );

    final http.Response response;
    try {
      response = await http
          .get(uri, headers: _getHeaders(includeContentType: false))
          .timeout(_apiTimeout);
    } catch (_) {
      _isBackendOnline = false;
      rethrow;
    }

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return RangeReadingsResponse.fromJson(data);
    } else {
      throw Exception(_extractErrorMessage(response, 'Không tải được dữ liệu theo khoảng thời gian'));
    }
  }

  /// 4. Lấy danh sách quy tắc chăm sóc từ Backend (GET /api/v1/rules)
  Future<List<CareRule>> fetchCareRules() async {
    if (_mode == DataSourceMode.fixture) {
      // Dữ liệu mẫu quy tắc khi offline
      return const [
        CareRule(
          ruleCode: 'RULE_AIR_TEMP_OPTIMAL',
          name: 'Nhiệt độ không khí vườn ươm',
          description: 'Giữ nhiệt độ phù hợp cho cây ớt con phát triển rễ và mầm lá',
          parameter: 'air_temperature_c',
          operator: 'between',
          thresholdMin: 25.0,
          thresholdMax: 30.0,
          severity: 'info',
          actionAdvice: 'Duy trì thông gió tự nhiên, bật quạt làm mát nếu nhiệt độ vượt quá 30°C.',
        ),
        CareRule(
          ruleCode: 'RULE_AIR_HUM_HIGH',
          name: 'Độ ẩm không khí cao',
          description: 'Phòng ngừa nấm mốc và thối mầm ớt con',
          parameter: 'air_humidity_pct',
          operator: '>',
          thresholdMin: 85.0,
          severity: 'warning',
          actionAdvice: 'Tăng cường lưu thông khí, giảm tần suất phun sương để ngừa nấm bệnh.',
        ),
        CareRule(
          ruleCode: 'RULE_WATER_PH_SAFE',
          name: 'pH dung dịch nước tưới',
          description: 'Hấp thu vi lượng cho rễ cây con',
          parameter: 'water_ph',
          operator: 'between',
          thresholdMin: 6.0,
          thresholdMax: 6.8,
          severity: 'info',
          actionAdvice: 'Độ chua dung dịch đạt chuẩn. Không cần điều chỉnh hóa chất tăng/giảm pH.',
        ),
      ];
    }

    final uri = Uri.parse('$_baseUrl/api/v1/rules');
    final response = await http
        .get(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      final data = jsonDecode(response.body);
      final list = (data['rules'] as List<dynamic>?) ?? [];
      return list.map((item) => CareRule.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception(_extractErrorMessage(response, 'Không tải được danh sách quy tắc'));
    }
  }

  String _extractErrorMessage(http.Response response, String fallback) {
    try {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        final error = data['error'];
        if (error is Map<String, dynamic>) {
          final code = error['code'] as String?;
          if (code == 'invalid_credentials') {
            return 'Tên đăng nhập hoặc mật khẩu không đúng.';
          }
          if (code == 'username_exists') {
            return 'Tên đăng nhập này đã tồn tại.';
          }
          if (code == 'device_already_claimed') {
            return 'Thiết bị này đã được liên kết với một tài khoản khác.';
          }
          if (code == 'unauthorized') {
            return 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.';
          }
          final msg = error['message'] as String?;
          if (msg != null && msg.isNotEmpty) return msg;
        }
        final msg = data['message'] as String?;
        if (msg != null && msg.isNotEmpty) return msg;
      }
    } catch (_) {
      // Phản hồi không phải JSON (ví dụ HTML lỗi gateway)
    }
    return '$fallback (${response.statusCode})';
  }

  void _applyAuthenticatedSession(
    String? token,
    AuthUser user, {
    String? linkedDeviceName,
  }) {
    _token = token;
    _currentUser = user;
    _isBackendOnline = true;
    final linkedDevice = user.selectedDeviceId;
    if (linkedDevice != null && linkedDevice.trim().isNotEmpty) {
      final cleanLinked = linkedDevice.trim();
      if (_deviceId != cleanLinked) {
        _deviceId = cleanLinked;
      }
      final cleanName = linkedDeviceName?.trim();
      _activeDeviceName = _mode == DataSourceMode.fixture
          ? _lookupFixtureDeviceName(cleanLinked)
          : (cleanName != null && cleanName.isNotEmpty ? cleanName : null);
    } else if (_mode == DataSourceMode.live) {
      final cleanName = linkedDeviceName?.trim();
      if (cleanName != null && cleanName.isNotEmpty) {
        _activeDeviceName = cleanName;
      }
    }
    _invalidateReadingCache();
    notifyListeners();
  }

  /// 5. Đăng nhập người dùng (POST /api/v1/auth/login)
  Future<AuthUser> login(String username, String password) async {
    final cleanUsername = username.trim();

    if (_mode == DataSourceMode.fixture) {
      final account = _fixtureUsers[cleanUsername];
      if (account != null && account.password == password) {
        _token = 'fixture-mock-token-xyz';
        _currentUser = account.user;
        _activeDeviceName = _lookupFixtureDeviceName(_deviceId);
        _invalidateReadingCache();
        notifyListeners();
        return _currentUser!;
      } else {
        throw Exception('Sai tên đăng nhập hoặc mật khẩu (Thử: admin / admin123)');
      }
    }

    final uri = Uri.parse('$_baseUrl/api/v1/auth/login');
    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: jsonEncode({'username': cleanUsername, 'password': password}),
        )
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final token = data['token'] as String?;
      final userMap = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userMap);
      final devName = (userMap['device'] as Map<String, dynamic>?)?['name'] as String?;
      _applyAuthenticatedSession(token, user, linkedDeviceName: devName);
      return user;
    } else {
      throw Exception(_extractErrorMessage(response, 'Đăng nhập thất bại'));
    }
  }

  /// 5b. Đăng ký tài khoản mới (POST /api/v1/auth/register)
  Future<AuthUser> register({
    required String fullName,
    required String username,
    required String password,
  }) async {
    final cleanFullName = fullName.trim();
    final cleanUsername = username.trim();

    if (_mode == DataSourceMode.fixture) {
      if (_fixtureUsers.containsKey(cleanUsername)) {
        throw Exception('Tên đăng nhập này đã tồn tại.');
      }
      final newUser = AuthUser(
        id: _fixtureUsers.length + 1,
        username: cleanUsername,
        role: 'user',
        fullName: cleanFullName,
      );
      _fixtureUsers[cleanUsername] = (password: password, user: newUser);
      _token = 'fixture-mock-token-xyz';
      _currentUser = newUser;
      _invalidateReadingCache();
      notifyListeners();
      return newUser;
    }

    final uri = Uri.parse('$_baseUrl/api/v1/auth/register');
    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: jsonEncode({
            'username': cleanUsername,
            'password': password,
            'full_name': cleanFullName,
            'role': 'user',
          }),
        )
        .timeout(_apiTimeout);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final token = data['token'] as String?;
      final userMap = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userMap);
      final devName = (userMap['device'] as Map<String, dynamic>?)?['name'] as String?;
      _applyAuthenticatedSession(token, user, linkedDeviceName: devName);
      return user;
    } else {
      throw Exception(_extractErrorMessage(response, 'Đăng ký thất bại'));
    }
  }

  /// 6. Đăng xuất
  void logout() {
    _token = null;
    _currentUser = null;
    _deviceId = defaultDeviceId;
    _activeDeviceName = _mode == DataSourceMode.fixture
        ? _lookupFixtureDeviceName(defaultDeviceId)
        : null;
    _invalidateReadingCache();
    notifyListeners();
  }

  /// 6b. Lấy thông tin hồ sơ tài khoản hiện tại (GET /api/v1/auth/me)
  Future<AuthUser?> fetchCurrentUser() async {
    if (!isAuthenticated) return null;
    if (_mode == DataSourceMode.fixture) return _currentUser;

    final uri = Uri.parse('$_baseUrl/api/v1/auth/me');
    final response = await http
        .get(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final userMap = data['user'] as Map<String, dynamic>;
      final user = AuthUser.fromJson(userMap);
      final devName = ((userMap['device'] as Map<String, dynamic>?)?['name'] as String?)?.trim();
      _currentUser = user;
      final linked = user.selectedDeviceId?.trim();
      if (linked != null && linked.isNotEmpty && _deviceId != linked) {
        _deviceId = linked;
        _activeDeviceName = (devName != null && devName.isNotEmpty) ? devName : null;
        _invalidateReadingCache();
      } else if (devName != null && devName.isNotEmpty) {
        _activeDeviceName = devName;
      }
      notifyListeners();
      return user;
    } else {
      throw Exception(_extractErrorMessage(response, 'Không tải được thông tin tài khoản'));
    }
  }

  /// 6c-0. Lấy toàn bộ danh sách thiết bị trên hệ thống (GET /api/v1/devices)
  Future<List<UserDevice>> fetchAllDevices({String? search}) async {
    if (_mode == DataSourceMode.fixture) {
      final matched = _lookupFixtureDeviceName(_deviceId);
      if (matched != null) {
        _activeDeviceName = matched;
      }
      final q = search?.trim().toLowerCase() ?? '';
      return _fixtureDevices
          .where((d) {
            if (q.isEmpty) return true;
            return d.deviceId.toLowerCase().contains(q) ||
                d.name.toLowerCase().contains(q) ||
                (d.description?.toLowerCase().contains(q) ?? false);
          })
          .map((d) => d.copyWith(isActive: d.deviceId == _deviceId))
          .toList();
    }

    final cleanSearch = search?.trim();
    final uri = Uri.parse('$_baseUrl/api/v1/devices').replace(
      queryParameters: (cleanSearch != null && cleanSearch.isNotEmpty)
          ? {'search': cleanSearch}
          : null,
    );
    final response = await http
        .get(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final list = (data['devices'] as List<dynamic>?) ?? [];
      final devices = list
          .map((item) {
            final parsed = UserDevice.fromJson(item as Map<String, dynamic>);
            return parsed.copyWith(isActive: parsed.deviceId == _deviceId);
          })
          .toList();
      for (final d in devices) {
        if (d.deviceId == _deviceId && d.name.trim().isNotEmpty) {
          _activeDeviceName = d.name.trim();
          break;
        }
      }
      return devices;
    } else {
      throw Exception(
        _extractErrorMessage(response, 'Không tải được danh sách thiết bị'),
      );
    }
  }

  /// 6c-1. Lấy chi tiết thiết bị hiện tại (GET /api/v1/devices/:device_id)
  Future<UserDevice?> fetchCurrentDeviceDetail() async {
    if (_mode == DataSourceMode.fixture) {
      for (final d in _fixtureDevices) {
        if (d.deviceId == _deviceId) {
          _activeDeviceName = d.name;
          return d.copyWith(isActive: true);
        }
      }
      return UserDevice(
        deviceId: _deviceId,
        name: _activeDeviceName ?? 'Trạm $_deviceId',
        isActive: true,
        isOnline: true,
      );
    }

    final encodedId = Uri.encodeComponent(_deviceId);
    final uri = Uri.parse('$_baseUrl/api/v1/devices/$encodedId');
    final response = await http
        .get(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final deviceJson = data['device'] as Map<String, dynamic>? ?? {};
      final parsed = UserDevice.fromJson({
        ...deviceJson,
        'is_online': data['is_online'] ?? false,
        'is_active': true,
      });
      if (parsed.name.trim().isNotEmpty) {
        _activeDeviceName = parsed.name.trim();
        notifyListeners();
      }
      return parsed;
    } else if (response.statusCode == 404) {
      return null;
    } else {
      throw Exception(
        _extractErrorMessage(response, 'Không tải được thông tin thiết bị'),
      );
    }
  }

  /// 6c. Danh sách thiết bị thuộc tài khoản (GET /api/v1/user/devices)
  Future<List<UserDevice>> fetchUserDevices() async {
    if (!isAuthenticated) return const [];
    if (_mode == DataSourceMode.fixture) {
      final matched = _lookupFixtureDeviceName(_deviceId);
      if (matched != null) {
        _activeDeviceName = matched;
      }
      return _fixtureDevices
          .map((d) => d.copyWith(isActive: d.deviceId == _deviceId))
          .toList();
    }

    final uri = Uri.parse('$_baseUrl/api/v1/user/devices');
    final response = await http
        .get(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final activeId = data['active_device_id']?.toString();
      if (activeId != null && activeId.isNotEmpty && _currentUser != null) {
        _currentUser = _currentUser!.copyWith(selectedDeviceId: activeId);
      }
      final list = (data['devices'] as List<dynamic>?) ?? [];
      final devices = list
          .map((item) => UserDevice.fromJson(item as Map<String, dynamic>))
          .toList();
      for (final d in devices) {
        if (d.deviceId == _deviceId && d.name.trim().isNotEmpty) {
          _activeDeviceName = d.name.trim();
          break;
        }
      }
      return devices;
    } else {
      throw Exception(_extractErrorMessage(response, 'Không tải được danh sách thiết bị'));
    }
  }

  /// 6d. Thêm thiết bị vào tài khoản (POST /api/v1/user/devices)
  Future<UserDevice> claimUserDevice(
    String deviceId, {
    String? customName,
  }) async {
    final cleanId = deviceId.trim();
    if (cleanId.isEmpty) {
      throw Exception('Vui lòng nhập mã thiết bị.');
    }
    final cleanName = customName?.trim();

    if (_mode == DataSourceMode.fixture) {
      if (_fixtureDevices.any((d) => d.deviceId == cleanId)) {
        throw Exception('Thiết bị này đã có trong tài khoản của bạn.');
      }
      final created = UserDevice(
        deviceId: cleanId,
        name: (cleanName != null && cleanName.isNotEmpty) ? cleanName : 'Trạm $cleanId',
        description: 'Thiết bị mô phỏng (Fixture)',
        isActive: _fixtureDevices.isEmpty,
        isOnline: true,
      );
      _fixtureDevices.add(created);
      if (created.deviceId == _deviceId) {
        _activeDeviceName = created.name;
      }
      notifyListeners();
      return created;
    }

    final uri = Uri.parse('$_baseUrl/api/v1/user/devices');
    final response = await http
        .post(
          uri,
          headers: _getHeaders(),
          body: jsonEncode({
            'device_id': cleanId,
            if (cleanName != null && cleanName.isNotEmpty) 'custom_name': cleanName,
          }),
        )
        .timeout(_apiTimeout);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final deviceJson = data['device'] as Map<String, dynamic>? ?? {};
      final created = UserDevice.fromJson(deviceJson);
      if (_currentUser != null && (_currentUser!.selectedDeviceId?.isEmpty ?? true)) {
        _currentUser = _currentUser!.copyWith(selectedDeviceId: created.deviceId);
        _deviceId = created.deviceId;
        _activeDeviceName = created.name;
        _invalidateReadingCache();
      } else if (_deviceId == created.deviceId) {
        _activeDeviceName = created.name;
      }
      notifyListeners();
      return created;
    } else {
      throw Exception(_extractErrorMessage(response, 'Không thể thêm thiết bị'));
    }
  }

  /// 6d-2. Thêm thiết bị mới (hỗ trợ cả tài khoản đăng nhập và chế độ Khách)
  Future<UserDevice> addDevice({
    required String deviceId,
    required String name,
    String? description,
    bool activate = true,
  }) async {
    final cleanId = deviceId.trim();
    if (cleanId.isEmpty) {
      throw Exception('Vui lòng nhập mã thiết bị (Device ID).');
    }
    final cleanName = name.trim().isEmpty ? 'Trạm $cleanId' : name.trim();
    final cleanDesc = description?.trim();

    if (_mode == DataSourceMode.fixture) {
      if (_fixtureDevices.any((d) => d.deviceId == cleanId)) {
        throw Exception('Mã thiết bị "$cleanId" đã tồn tại.');
      }
      if (activate) {
        for (var i = 0; i < _fixtureDevices.length; i++) {
          _fixtureDevices[i] = _fixtureDevices[i].copyWith(isActive: false);
        }
      }
      final created = UserDevice(
        deviceId: cleanId,
        name: cleanName,
        description: (cleanDesc != null && cleanDesc.isNotEmpty)
            ? cleanDesc
            : 'Thiết bị mô phỏng (Fixture)',
        isActive: activate || _fixtureDevices.isEmpty,
        isOnline: true,
      );
      _fixtureDevices.add(created);
      if (activate || _fixtureDevices.length == 1) {
        _deviceId = cleanId;
        _activeDeviceName = cleanName;
        if (_currentUser != null) {
          _currentUser = _currentUser!.copyWith(selectedDeviceId: cleanId);
        }
        _invalidateReadingCache();
      }
      notifyListeners();
      return created;
    }

    if (isAuthenticated) {
      final created = await claimUserDevice(cleanId, customName: cleanName);
      if (activate && _deviceId != created.deviceId) {
        await selectActiveDevice(
          created.deviceId,
          deviceName: created.name,
          isOwned: true,
        );
      } else if (activate) {
        _activeDeviceName = created.name;
        notifyListeners();
      }
      return created;
    }

    final uri = Uri.parse('$_baseUrl/api/v1/devices');
    final response = await http
        .post(
          uri,
          headers: _getHeaders(),
          body: jsonEncode({
            'device_id': cleanId,
            'name': cleanName,
            if (cleanDesc != null && cleanDesc.isNotEmpty) 'description': cleanDesc,
          }),
        )
        .timeout(_apiTimeout);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final deviceJson = data['device'] as Map<String, dynamic>? ?? {};
      final created = UserDevice.fromJson({
        ...deviceJson,
        'is_active': activate,
      });
      if (activate) {
        _deviceId = created.deviceId;
        _activeDeviceName = created.name;
        _invalidateReadingCache();
      }
      notifyListeners();
      return created;
    } else {
      throw Exception(_extractErrorMessage(response, 'Không thể thêm thiết bị mới'));
    }
  }

  /// 6e. Đổi tên hiển thị thiết bị (PATCH /api/v1/user/devices/:device_id)
  Future<void> renameUserDevice(String deviceId, String newName) async {
    await renameDevice(deviceId, newName);
  }

  /// 6e-2. Đặt tên / đổi tên thiết bị (PATCH /user/devices/:id khi sở hữu hoặc POST /devices ở chế độ Khách)
  Future<UserDevice> renameDevice(
    String deviceId,
    String newName, {
    String? description,
    bool claimIfNeeded = false,
  }) async {
    final cleanId = deviceId.trim();
    final cleanName = newName.trim();
    if (cleanId.isEmpty) {
      throw Exception('Mã thiết bị không hợp lệ.');
    }
    if (cleanName.isEmpty) {
      throw Exception('Tên hiển thị không được để trống.');
    }

    if (_mode == DataSourceMode.fixture) {
      final idx = _fixtureDevices.indexWhere((d) => d.deviceId == cleanId);
      final UserDevice updated;
      if (idx == -1) {
        updated = UserDevice(
          deviceId: cleanId,
          name: cleanName,
          description: description,
          isActive: _deviceId == cleanId,
          isOnline: true,
        );
        _fixtureDevices.add(updated);
      } else {
        updated = _fixtureDevices[idx].copyWith(name: cleanName);
        _fixtureDevices[idx] = updated;
      }
      if (_deviceId == cleanId) {
        _activeDeviceName = cleanName;
      }
      notifyListeners();
      return updated;
    }

    if (isAuthenticated) {
      final encodedId = Uri.encodeComponent(cleanId);
      final uri = Uri.parse('$_baseUrl/api/v1/user/devices/$encodedId');
      final response = await http
          .patch(
            uri,
            headers: _getHeaders(),
            body: jsonEncode({'name': cleanName}),
          )
          .timeout(_apiTimeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final deviceJson = data['device'] as Map<String, dynamic>?;
        final updated = deviceJson != null
            ? UserDevice.fromJson({
                ...deviceJson,
                'description': ?description,
                'is_active': cleanId == _deviceId,
              })
            : UserDevice(
                deviceId: cleanId,
                name: cleanName,
                description: description,
                isActive: cleanId == _deviceId,
              );
        if (_deviceId == cleanId) {
          _activeDeviceName = cleanName;
        }
        notifyListeners();
        return updated;
      }

      if ((response.statusCode == 403 || response.statusCode == 404) &&
          claimIfNeeded) {
        return claimUserDevice(cleanId, customName: cleanName);
      }

      throw Exception(_extractErrorMessage(response, 'Đổi tên thiết bị thất bại'));
    }

    final uri = Uri.parse('$_baseUrl/api/v1/devices');
    final response = await http
        .post(
          uri,
          headers: _getHeaders(),
          body: jsonEncode({
            'device_id': cleanId,
            'name': cleanName,
            if (description != null && description.trim().isNotEmpty)
              'description': description.trim(),
          }),
        )
        .timeout(_apiTimeout);

    if (response.statusCode == 201 || response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final deviceJson = data['device'] as Map<String, dynamic>? ?? {};
      final updated = UserDevice.fromJson({
        ...deviceJson,
        'is_active': cleanId == _deviceId,
      });
      if (_deviceId == cleanId) {
        _activeDeviceName = updated.name;
      }
      notifyListeners();
      return updated;
    } else {
      throw Exception(_extractErrorMessage(response, 'Đổi tên thiết bị thất bại'));
    }
  }

  /// 6f. Gỡ thiết bị khỏi tài khoản (DELETE /api/v1/user/devices/:device_id)
  Future<void> removeUserDevice(String deviceId) async {
    if (_mode == DataSourceMode.fixture) {
      _fixtureDevices.removeWhere((d) => d.deviceId == deviceId);
      if (_deviceId == deviceId) {
        _deviceId = _fixtureDevices.isNotEmpty
            ? _fixtureDevices.first.deviceId
            : defaultDeviceId;
        _activeDeviceName = _lookupFixtureDeviceName(_deviceId);
        _invalidateReadingCache();
      }
      notifyListeners();
      return;
    }

    final encodedId = Uri.encodeComponent(deviceId);
    final uri = Uri.parse('$_baseUrl/api/v1/user/devices/$encodedId');
    final response = await http
        .delete(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final nextActive = data['active_device_id']?.toString();
      if (_deviceId == deviceId) {
        _deviceId = (nextActive != null && nextActive.isNotEmpty)
            ? nextActive
            : defaultDeviceId;
        _activeDeviceName = null;
        _invalidateReadingCache();
      }
      if (_currentUser != null) {
        _currentUser = _currentUser!.copyWith(
          selectedDeviceId: nextActive ?? defaultDeviceId,
        );
      }
      notifyListeners();
    } else {
      throw Exception(_extractErrorMessage(response, 'Gỡ thiết bị thất bại'));
    }
  }

  /// 6f-2. Xóa thiết bị (DELETE /api/v1/devices/:device_id; fallback gỡ khỏi tài khoản nếu server cũ chưa có route)
  Future<void> deleteDevice(
    String deviceId, {
    bool isOwned = false,
  }) async {
    final cleanId = deviceId.trim();
    if (cleanId.isEmpty) {
      throw Exception('Mã thiết bị không hợp lệ.');
    }

    if (_mode == DataSourceMode.fixture) {
      final existed = _fixtureDevices.any((d) => d.deviceId == cleanId);
      if (!existed) {
        throw Exception('Thiết bị không tồn tại.');
      }
      _fixtureDevices.removeWhere((d) => d.deviceId == cleanId);
      if (_deviceId == cleanId) {
        _deviceId = _fixtureDevices.isNotEmpty
            ? _fixtureDevices.first.deviceId
            : defaultDeviceId;
        _activeDeviceName = _lookupFixtureDeviceName(_deviceId);
        _invalidateReadingCache();
      }
      if (_currentUser != null && _currentUser!.selectedDeviceId == cleanId) {
        _currentUser = _currentUser!.copyWith(
          selectedDeviceId:
              _fixtureDevices.isNotEmpty ? _fixtureDevices.first.deviceId : null,
        );
      }
      notifyListeners();
      return;
    }

    final encodedId = Uri.encodeComponent(cleanId);
    final uri = Uri.parse('$_baseUrl/api/v1/devices/$encodedId');
    final response = await http
        .delete(uri, headers: _getHeaders(includeContentType: false))
        .timeout(_apiTimeout);

    if (response.statusCode == 200) {
      if (_deviceId == cleanId) {
        String nextId = defaultDeviceId;
        String? nextName;
        try {
          final remaining = await fetchAllDevices();
          if (remaining.isNotEmpty) {
            nextId = remaining.first.deviceId;
            nextName = remaining.first.name;
          }
        } catch (_) {
          // Giữ fallback defaultDeviceId nếu không tải lại được danh sách
        }
        _deviceId = nextId;
        _activeDeviceName = nextName;
        _invalidateReadingCache();
      }
      if (_currentUser != null && _currentUser!.selectedDeviceId == cleanId) {
        _currentUser = _currentUser!.copyWith(selectedDeviceId: _deviceId);
      }
      notifyListeners();
      return;
    }

    if (response.statusCode == 404) {
      String? errorCode;
      try {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) {
          final err = data['error'];
          if (err is Map<String, dynamic>) {
            errorCode = err['code'] as String?;
          }
        }
      } catch (_) {}

      if (errorCode == 'route_not_found') {
        if (isAuthenticated && isOwned) {
          await removeUserDevice(cleanId);
          return;
        }
        throw Exception(
          'Server backend hiện tại chưa có API xóa thiết bị. Vui lòng cập nhật/deploy backend mới nhất.',
        );
      }
    }

    throw Exception(_extractErrorMessage(response, 'Xóa thiết bị thất bại'));
  }

  /// 6g. Đặt thiết bị đang theo dõi mặc định (PUT /api/v1/user/devices/:device_id/active)
  Future<void> setActiveUserDevice(String deviceId) async {
    await selectActiveDevice(deviceId, isOwned: true);
  }

  /// 6g-2. Chuyển thiết bị đang theo dõi hiện tại (hỗ trợ cả tài khoản & Khách)
  Future<void> selectActiveDevice(
    String deviceId, {
    String? deviceName,
    bool isOwned = false,
  }) async {
    final cleanId = deviceId.trim();
    if (cleanId.isEmpty) {
      throw Exception('Mã thiết bị không hợp lệ.');
    }

    if (_mode == DataSourceMode.fixture) {
      for (var i = 0; i < _fixtureDevices.length; i++) {
        _fixtureDevices[i] = _fixtureDevices[i].copyWith(
          isActive: _fixtureDevices[i].deviceId == cleanId,
        );
      }
      final changed = _deviceId != cleanId;
      _deviceId = cleanId;
      _activeDeviceName = deviceName?.trim().isNotEmpty == true
          ? deviceName!.trim()
          : _lookupFixtureDeviceName(cleanId);
      if (_currentUser != null) {
        _currentUser = _currentUser!.copyWith(selectedDeviceId: cleanId);
      }
      if (changed) {
        _invalidateReadingCache();
      }
      notifyListeners();
      return;
    }

    if (isAuthenticated && isOwned) {
      final encodedId = Uri.encodeComponent(cleanId);
      final uri = Uri.parse('$_baseUrl/api/v1/user/devices/$encodedId/active');
      final response = await http
          .put(uri, headers: _getHeaders())
          .timeout(_apiTimeout);

      if (response.statusCode == 200) {
        final changed = _deviceId != cleanId;
        _deviceId = cleanId;
        if (deviceName != null && deviceName.trim().isNotEmpty) {
          _activeDeviceName = deviceName.trim();
        } else if (changed) {
          _activeDeviceName = null;
        }
        if (_currentUser != null) {
          _currentUser = _currentUser!.copyWith(selectedDeviceId: cleanId);
        }
        if (changed) {
          _invalidateReadingCache();
        }
        notifyListeners();
        return;
      } else if (response.statusCode != 403 && response.statusCode != 404) {
        throw Exception(_extractErrorMessage(response, 'Không thể chuyển thiết bị'));
      }
    }

    final changed = _deviceId != cleanId;
    _deviceId = cleanId;
    if (deviceName != null && deviceName.trim().isNotEmpty) {
      _activeDeviceName = deviceName.trim();
    } else if (changed) {
      _activeDeviceName = null;
    }
    if (changed) {
      _invalidateReadingCache();
    }
    notifyListeners();
  }

  /// 7. Kích hoạt đồng bộ Sensor Data Bridge thủ công (POST /api/v1/sync/bridge)
  Future<Map<String, dynamic>> triggerBridgeSync() async {
    if (_mode == DataSourceMode.fixture) {
      return {
        'status': 'ok',
        'message': 'Đồng bộ mô phỏng (Fixture)',
        'fetched': 10,
        'created': 2,
        'duplicates': 8,
      };
    }

    final bridgeUri = Uri.parse('$_baseUrl/api/v1/sync/bridge');
    var response = await http
        .post(bridgeUri, headers: _getHeaders())
        .timeout(_syncTimeout);

    if (response.statusCode == 404) {
      final legacyUri = Uri.parse('$_baseUrl/api/v1/sync/thingspeak');
      response = await http
          .post(legacyUri, headers: _getHeaders())
          .timeout(_syncTimeout);
    }

    if (response.statusCode == 200) {
      final result = jsonDecode(response.body) as Map<String, dynamic>;
      await pollLatestReading();
      return result;
    } else {
      throw Exception(_extractErrorMessage(response, 'Đồng bộ Sensor Data Bridge lỗi'));
    }
  }

  /// Alias tương thích ngược cho các lời gọi cũ
  Future<Map<String, dynamic>> triggerThingSpeakSync() => triggerBridgeSync();

  @override
  void dispose() {
    stopAutoRefresh();
    super.dispose();
  }
}
