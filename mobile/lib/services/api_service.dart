import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
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
  DataSourceMode _mode = DataSourceMode.fixture;
  FixtureScenario _currentScenario = FixtureScenario.normal;
  String _baseUrl = 'http://10.0.2.2:3000'; // Mặc định emulator Android
  String _deviceId = 'esp32-nursery-01';

  DataSourceMode get mode => _mode;
  FixtureScenario get currentScenario => _currentScenario;
  String get baseUrl => _baseUrl;
  String get deviceId => _deviceId;

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
    if (_baseUrl != val) {
      _baseUrl = val;
      notifyListeners();
    }
  }

  set deviceId(String val) {
    if (_deviceId != val) {
      _deviceId = val;
      notifyListeners();
    }
  }

  /// Lấy số đo mới nhất theo endpoint GET /api/v1/devices/{device_id}/readings/latest
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
    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
    } else if (response.statusCode == 404) {
      throw Exception('Thiết bị không tồn tại ($_deviceId)');
    } else {
      throw Exception('Lỗi máy chủ: mã phản hồi ${response.statusCode}');
    }
  }

  /// Lấy danh sách lịch sử theo endpoint GET /api/v1/devices/{device_id}/readings?limit=20
  Future<List<HistoryItem>> fetchHistory({int limit = 20}) async {
    if (_mode == DataSourceMode.fixture) {
      final jsonStr = await rootBundle.loadString('assets/fixtures/history.json');
      final data = jsonDecode(jsonStr);
      final historyResponse = HistoryResponse.fromJson(data as Map<String, dynamic>);
      return historyResponse.readings;
    } else {
      final uri = Uri.parse('$_baseUrl/api/v1/devices/$_deviceId/readings?limit=$limit');
      final response = await http.get(uri).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final historyResponse = HistoryResponse.fromJson(data as Map<String, dynamic>);
        return historyResponse.readings;
      } else {
        throw Exception('Không tải được lịch sử: ${response.statusCode}');
      }
    }
  }
}
