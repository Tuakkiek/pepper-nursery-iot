import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pepper_nursery_mobile/controllers/app_controller.dart';
import 'package:pepper_nursery_mobile/services/api_service.dart';
import 'package:pepper_nursery_mobile/services/session_store.dart';

class MemorySessionStore implements SessionStore {
  String? token;
  @override
  Future<String?> read() async => token;
  @override
  Future<void> write(String value) async {
    token = value;
  }

  @override
  Future<void> clear() async {
    token = null;
  }
}

class FakeBackend {
  final requests = <http.Request>[];
  final devices = <Map<String, dynamic>>[];
  final pending = <String, Completer<http.Response>>{};
  String? active;
  int? latestStatus, devicesStatus;
  String? claimError;
  bool expired = false;
  final store = MemorySessionStore();
  late final api = ApiService(
    client: MockClient(handle),
    baseUrl: 'https://example.test/api/v1/',
  );
  late final controller = AppController(api: api, sessions: store);
  Map<String, dynamic> get user => {
    'id': 1,
    'username': 'gardener',
    'full_name': 'Người trồng ớt',
    'role': 'user',
  };
  void add(String id, {String? name}) {
    devices.add({
      'device_id': id,
      'name': name ?? 'Khay $id',
      'is_online': true,
      'latest_reading': {},
    });
    active ??= id;
  }

  http.Response json(Object body, [int code = 200]) => http.Response(
    jsonEncode(body),
    code,
    headers: {'content-type': 'application/json; charset=utf-8'},
  );
  Map<String, dynamic> latest(String id) => {
    'device_id': id,
    'is_stale': false,
    'received_at': '2026-11-11T03:00:00Z',
    'advice': null,
    'reading': {
      'device_id': id,
      'sample_id': 'sample-$id',
      'recorded_at': '2026-11-11T03:00:00Z',
      'air_temperature_c': 27.4,
      'air_humidity_pct': 68,
      'soil_temperature_c': 26,
      'soil_moisture_pct': 0,
      'water_ph': 6.4,
      'water_tds_ppm': 580,
      'sensor_status': {
        'dht22': 'ok',
        'ds18b20': 'ok',
        'hd38': 'ok',
        'tds': 'ok',
        'ph4502c': 'ok',
      },
    },
  };
  Future<http.Response> handle(http.Request request) async {
    requests.add(request);
    final path = request.url.path.replaceFirst('/api/v1', '');
    if (pending.containsKey(path)) return pending.remove(path)!.future;
    if (path == '/auth/login' || path == '/auth/register') {
      return json({
        'token': 'test-token',
        'user': user,
      }, path.endsWith('register') ? 201 : 200);
    }
    if (expired) {
      return json({
        'error': {'code': 'invalid_token'},
      }, 401);
    }
    if (request.headers['Authorization'] != 'Bearer test-token') {
      return json({
        'error': {'code': 'unauthorized'},
      }, 401);
    }
    if (path == '/auth/me') return json({'user': user});
    if (path == '/user/devices' && request.method == 'GET') {
      if (devicesStatus != null) {
        return json({
          'error': {'code': 'server_error'},
        }, devicesStatus!);
      }
      return json({'devices': devices, 'active_device_id': active});
    }
    if (path == '/user/devices' && request.method == 'POST') {
      if (claimError != null) {
        return json({
          'error': {'code': claimError},
        }, claimError == 'device_not_found' ? 404 : 409);
      }
      final body = jsonDecode(request.body);
      add(body['device_id'], name: body['custom_name']);
      return json({'status': 'ok'}, 201);
    }
    if (path.startsWith('/user/devices/')) {
      final id = Uri.decodeComponent(path.split('/')[3]);
      if (request.method == 'DELETE') {
        devices.removeWhere((d) => d['device_id'] == id);
        if (active == id) {
          active = devices.isEmpty ? null : devices.first['device_id'];
        }
      }
      if (request.method == 'PUT') active = id;
      if (request.method == 'PATCH') {
        devices.firstWhere((d) => d['device_id'] == id)['name'] = jsonDecode(
          request.body,
        )['name'];
      }
      return json({'status': 'ok'});
    }
    if (path.endsWith('/readings/latest')) {
      if (latestStatus != null) {
        return json({
          'error': {'code': 'server_error'},
        }, latestStatus!);
      }
      return json(latest(Uri.decodeComponent(path.split('/')[2])));
    }
    if (path.endsWith('/readings')) {
      return json({'device_id': path.split('/')[2], 'readings': []});
    }
    throw StateError('Unexpected request: ${request.method} $path');
  }

  Future<void> login() async {
    await controller.restore();
    await controller.authenticate(username: 'gardener', password: 'secret123');
    await Future<void>.delayed(Duration.zero);
  }
}
