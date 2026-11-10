import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/sensor_reading.dart';
import '../models/user_device.dart';

class ApiException implements Exception {
  final String code;
  final String message;
  final int? statusCode;
  const ApiException(this.code, this.message, [this.statusCode]);
  @override
  String toString() => message;
}

/// Only the project backend is contacted. No bridge keys or sample fallback.
class ApiService {
  static const defaultCloudUrl = 'https://pepper-nursery-iot.onrender.com';
  final http.Client _client;
  final String baseUrl;
  final Duration timeout;
  String? token;
  Future<void> Function()? onUnauthorized;

  ApiService({
    http.Client? client,
    String? baseUrl,
    this.timeout = const Duration(seconds: 30),
  }) : _client = client ?? http.Client(),
       baseUrl =
           (baseUrl ??
                   const String.fromEnvironment(
                     'API_BASE_URL',
                     defaultValue: defaultCloudUrl,
                   ))
               .replaceFirst(RegExp(r'/+$'), '')
               .replaceFirst(RegExp(r'/api/v1$'), '');

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = true,
  }) async {
    final requestToken = token;
    if (authenticated && requestToken == null) {
      throw const ApiException('unauthorized', 'Vui lòng đăng nhập.');
    }
    try {
      final request = http.Request(method, Uri.parse('$baseUrl/api/v1$path'));
      request.headers.addAll({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (authenticated) 'Authorization': 'Bearer $requestToken',
      });
      if (body != null) request.body = jsonEncode(body);
      final response = await (() async => http.Response.fromStream(
        await _client.send(request),
      ))().timeout(timeout);
      Map<String, dynamic>? data;
      try {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        if (decoded is Map<String, dynamic>) data = decoded;
      } on FormatException {
        /* HTML proxy errors are handled below. */
      }
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (data == null) {
          throw const ApiException(
            'invalid_response',
            'Phản hồi máy chủ không hợp lệ. Vui lòng thử lại.',
          );
        }
        return data;
      }
      final error = data?['error'];
      final code = error is Map
          ? error['code']?.toString() ?? 'server_error'
          : 'server_error';
      if (authenticated &&
          response.statusCode == 401 &&
          requestToken == token) {
        await onUnauthorized?.call();
      }
      throw ApiException(
        code,
        _message(code, response.statusCode),
        response.statusCode,
      );
    } on TimeoutException {
      throw const ApiException(
        'timeout',
        'Máy chủ phản hồi chậm. Vui lòng thử lại.',
      );
    } on http.ClientException {
      throw const ApiException(
        'network',
        'Không kết nối được máy chủ. Kiểm tra Internet rồi thử lại.',
      );
    }
  }

  static String _message(String code, int status) => switch (code) {
    'invalid_credentials' => 'Tên đăng nhập hoặc mật khẩu chưa đúng.',
    'username_exists' => 'Tên đăng nhập đã được sử dụng.',
    'invalid_registration_data' =>
      'Kiểm tra thông tin đăng ký và độ dài mật khẩu.',
    'device_already_claimed' =>
      'Thiết bị đã thuộc tài khoản khác. Hãy gỡ liên kết ở tài khoản cũ trước.',
    'device_not_found' || 'invalid_device' =>
      'Không tìm thấy thiết bị. Kiểm tra device ID trong hộp sản phẩm.',
    'no_active_device' => 'Hãy thêm hoặc chọn một thiết bị để xem số đo.',
    'missing_device_id' => 'Vui lòng nhập device ID hợp lệ (tối đa 64 ký tự).',
    'missing_name' => 'Tên thiết bị phải có từ 1 đến 128 ký tự.',
    _ when status == 401 =>
      'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    _ when status == 403 => 'Bạn không có quyền truy cập thiết bị này.',
    _ => 'Không tải được dữ liệu từ máy chủ. Vui lòng thử lại.',
  };

  Future<Map<String, dynamic>> login(String username, String password) =>
      request(
        'POST',
        '/auth/login',
        authenticated: false,
        body: {'username': username.trim(), 'password': password},
      );
  Future<Map<String, dynamic>> register(
    String fullName,
    String username,
    String password,
  ) => request(
    'POST',
    '/auth/register',
    authenticated: false,
    body: {
      'full_name': fullName.trim(),
      'username': username.trim(),
      'password': password,
    },
  );
  Future<DeviceCollection> fetchDevices() async =>
      DeviceCollection.fromJson(await request('GET', '/user/devices'));
  Future<void> claimDevice(String id, String name) async {
    await request(
      'POST',
      '/user/devices',
      body: {
        'device_id': id.trim(),
        if (name.trim().isNotEmpty) 'custom_name': name.trim(),
      },
    );
  }

  Future<void> renameDevice(String id, String name) async {
    await request(
      'PATCH',
      '/user/devices/${Uri.encodeComponent(id)}',
      body: {'name': name.trim()},
    );
  }

  Future<void> removeDevice(String id) async {
    await request('DELETE', '/user/devices/${Uri.encodeComponent(id)}');
  }

  Future<void> selectDevice(String id) async {
    await request('PUT', '/user/devices/${Uri.encodeComponent(id)}/active');
  }

  Future<LatestReadingResponse> fetchLatestReading(String deviceId) async =>
      LatestReadingResponse.fromJson(
        await request(
          'GET',
          '/devices/${Uri.encodeComponent(deviceId)}/readings/latest',
        ),
      );
  Future<List<HistoryItem>> fetchHistory(
    String deviceId, {
    int limit = 20,
  }) async => HistoryResponse.fromJson(
    await request(
      'GET',
      '/devices/${Uri.encodeComponent(deviceId)}/readings?limit=$limit',
    ),
  ).readings;
  void dispose() => _client.close();
}
