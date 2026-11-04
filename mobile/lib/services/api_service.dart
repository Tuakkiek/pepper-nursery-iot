import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import '../models/sensor_reading.dart';

enum DataSourceMode { fixture, live }

enum FixtureScenario {
  normal('latest-normal.json', 'Bình thường (Đủ 5 cảm biến)'),
  partialError('latest-partial-error.json', 'Lỗi một phần cảm biến'),
  uncalibrated('latest-uncalibrated.json', 'Chưa hiệu chuẩn (HD-38, TDS, pH)'),
  stale('latest-stale.json', 'Dữ liệu cũ (Mất liên lạc)'),
  empty('latest-empty.json', 'Chưa có dữ liệu'),
  serverError('server-error.json', 'Lỗi máy chủ');

  final String filename;
  final String label;
  const FixtureScenario(this.filename, this.label);
}

class ApiService {
  DataSourceMode mode = DataSourceMode.fixture;
  FixtureScenario currentScenario = FixtureScenario.normal;
  String baseUrl = 'http://10.0.2.2:3000'; // Default Android emulator backend URL

  Future<LatestReadingResponse> fetchLatestReading(String deviceId) async {
    if (mode == DataSourceMode.fixture) {
      return _loadFixture(currentScenario.filename);
    } else {
      return _fetchFromApi(deviceId);
    }
  }

  Future<LatestReadingResponse> _loadFixture(String filename) async {
    final assetPath = 'assets/fixtures/$filename';
    final jsonStr = await rootBundle.loadString(assetPath);
    final data = jsonDecode(jsonStr);

    if (filename == 'server-error.json') {
      throw Exception(data['error']?['message'] ?? 'Lỗi kết nối máy chủ');
    }

    return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
  }

  Future<LatestReadingResponse> _fetchFromApi(String deviceId) async {
    final uri = Uri.parse('$baseUrl/api/devices/$deviceId/latest');
    final response = await http.get(uri).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return LatestReadingResponse.fromJson(data as Map<String, dynamic>);
    } else {
      throw Exception('Không tải được dữ liệu: mã lỗi ${response.statusCode}');
    }
  }

  Future<List<ReadingData>> fetchHistory(String deviceId) async {
    if (mode == DataSourceMode.fixture) {
      final jsonStr = await rootBundle.loadString('assets/fixtures/history.json');
      final data = jsonDecode(jsonStr);
      final list = (data['readings'] as List<dynamic>?) ?? [];
      return list
          .map((item) => ReadingData.fromJson(item as Map<String, dynamic>))
          .toList();
    } else {
      final uri = Uri.parse('$baseUrl/api/devices/$deviceId/history');
      final response = await http.get(uri).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data['readings'] as List<dynamic>?) ?? [];
        return list
            .map((item) => ReadingData.fromJson(item as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Không tải được lịch sử: ${response.statusCode}');
      }
    }
  }
}

