import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../models/auth_user.dart';
import '../models/care_rule.dart';
import '../models/sensor_reading.dart';

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
  DataSourceMode _mode = DataSourceMode.live; // Mặc định kết nối backend thật
  FixtureScenario _currentScenario = FixtureScenario.normal;
  late String _baseUrl;
  String _deviceId = 'esp32-nursery-01';

  // Auth state
  String? _token;
  AuthUser? _currentUser;

  // Backend connection status
  bool _isBackendOnline = false;
  String? _lastHealthTimestamp;

  ApiService() {
    _baseUrl = _getDefaultBaseUrl();
  }

  static String _getDefaultBaseUrl() {
    if (kIsWeb) {
      return 'http://localhost:8000';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8000';
      }
    } catch (_) {}
    return 'http://localhost:8000';
  }

  DataSourceMode get mode => _mode;
  FixtureScenario get currentScenario => _currentScenario;
  String get baseUrl => _baseUrl;
  String get deviceId => _deviceId;
  String? get token => _token;
  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _token != null && _currentUser != null;
  bool get isBackendOnline => _isBackendOnline;
  String? get lastHealthTimestamp => _lastHealthTimestamp;

  set mode(DataSourceMode val) {
    if (_mode != val) {
      _mode = val;
      notifyListeners();
    }
  }

  set currentScenario(FixtureScenario val) {
    if (_currentScenario != val) {
      _currentScenario = val;
      notifyListeners();
    }
  }

  set baseUrl(String val) {
    final clean = val.trim().replaceAll(RegExp(r'/+$'), '');
    if (_baseUrl != clean) {
      _baseUrl = clean;
      notifyListeners();
    }
  }

  set deviceId(String val) {
    if (_deviceId != val) {
      _deviceId = val.trim();
      notifyListeners();
    }
  }

  Map<String, String> _getHeaders() {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  /// 1. Kiểm tra trạng thái máy chủ Backend (GET /api/v1/health)
  Future<bool> checkHealth() async {
    try {
      final uri = Uri.parse('$_baseUrl/api/v1/health');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _isBackendOnline = data['status'] == 'ok';
        _lastHealthTimestamp = data['timestamp'];
        notifyListeners();
        return true;
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
    if (_mode == DataSourceMode.fixture) {
      return _loadFixture(_currentScenario.filename);
    } else {
      return _fetchFromApi();
    }
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
    final uri = Uri.parse('$_baseUrl/api/v1/devices/$_deviceId/readings/latest');
    try {
      final response = await http
          .get(uri, headers: _getHeaders())
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        _isBackendOnline = true;
        final data = jsonDecode(response.body);
        return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
      } else if (response.statusCode == 404) {
        _isBackendOnline = true;
        throw Exception('Thiết bị không tồn tại ($_deviceId)');
      } else {
        throw Exception('Lỗi máy chủ: mã phản hồi ${response.statusCode}');
      }
    } catch (e) {
      _isBackendOnline = false;
      rethrow;
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
      final uri = Uri.parse('$_baseUrl/api/v1/devices/$_deviceId/readings?limit=$limit');
      try {
        final response = await http
            .get(uri, headers: _getHeaders())
            .timeout(const Duration(seconds: 8));

        if (response.statusCode == 200) {
          _isBackendOnline = true;
          final data = jsonDecode(response.body);
          final historyResponse = HistoryResponse.fromJson(data as Map<String, dynamic>);
          return historyResponse.readings;
        } else {
          throw Exception('Không tải được lịch sử: ${response.statusCode}');
        }
      } catch (e) {
        _isBackendOnline = false;
        rethrow;
      }
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
        .get(uri, headers: _getHeaders())
        .timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      _isBackendOnline = true;
      final data = jsonDecode(response.body);
      final list = (data['rules'] as List<dynamic>?) ?? [];
      return list.map((item) => CareRule.fromJson(item as Map<String, dynamic>)).toList();
    } else {
      throw Exception('Không tải được danh sách quy tắc (${response.statusCode})');
    }
  }

  /// 5. Đăng nhập người dùng (POST /api/v1/auth/login)
  Future<AuthUser> login(String username, String password) async {
    final uri = Uri.parse('$_baseUrl/api/v1/auth/login');
    final response = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'username': username, 'password': password}),
        )
        .timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _token = data['token'] as String?;
      _currentUser = AuthUser.fromJson(data['user'] as Map<String, dynamic>);
      notifyListeners();
      return _currentUser!;
    } else {
      final data = jsonDecode(response.body);
      final msg = data['error']?['message'] ?? 'Đăng nhập thất bại (${response.statusCode})';
      throw Exception(msg);
    }
  }

  /// 6. Đăng xuất
  void logout() {
    _token = null;
    _currentUser = null;
    notifyListeners();
  }

  /// 7. Kích hoạt đồng bộ ThingSpeak thủ công (POST /api/v1/sync/thingspeak)
  Future<Map<String, dynamic>> triggerThingSpeakSync() async {
    final uri = Uri.parse('$_baseUrl/api/v1/sync/thingspeak');
    final response = await http
        .post(uri, headers: _getHeaders())
        .timeout(const Duration(seconds: 12));

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      final data = jsonDecode(response.body);
      final msg = data['error']?['message'] ?? 'Đồng bộ ThingSpeak lỗi';
      throw Exception(msg);
    }
  }
}
