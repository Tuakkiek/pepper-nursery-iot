import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:pepper_nursery_mobile/services/api_service.dart';

import 'helpers/fake_backend.dart';

void main() {
  late FakeBackend backend;
  setUp(() => backend = FakeBackend());
  tearDown(() => backend.controller.dispose());

  test('register uses backend, saves token and starts with no device or telemetry calls', () async {
    await backend.controller.restore();
    await backend.controller.authenticate(
      username: 'gardener',
      password: 'secret123',
      fullName: 'Người trồng ớt',
    );
    expect(jsonDecode(backend.requests.first.body), {
      'username': 'gardener',
      'password': 'secret123',
      'full_name': 'Người trồng ớt',
    });
    expect(backend.store.token, 'test-token');
    expect(backend.controller.devices, isEmpty);
    expect(backend.controller.activeId, isNull);
    expect(backend.requests.any((r) => r.url.path.contains('readings')), false);
  });
  test(
    'claim multiple devices, select, rename, unlink active and final device',
    () async {
      await backend.login();
      await backend.controller.claim(' A ', ' Ban công ');
      await backend.controller.claim('B', 'Khay B');
      expect(backend.controller.devices.length, 2);
      expect(backend.controller.activeId, 'A');
      await backend.controller.select('B');
      await Future<void>.delayed(Duration.zero);
      expect(backend.controller.latest?.deviceId, 'B');
      await backend.controller.rename('B', 'Khay ớt mới');
      expect(backend.controller.activeDevice?.name, 'Khay ớt mới');
      await backend.controller.remove('B');
      expect(backend.controller.activeId, 'A');
      await backend.controller.remove('A');
      expect(backend.controller.devices, isEmpty);
      expect(backend.controller.latest, isNull);
      expect(backend.controller.activeId, isNull);
    },
  );
  test('unknown and already owned device preserve the current list', () async {
    await backend.login();
    for (final code in ['device_not_found', 'device_already_claimed']) {
      backend.claimError = code;
      await expectLater(
        backend.controller.claim('X', ''),
        throwsA(isA<ApiException>().having((e) => e.code, 'code', code)),
      );
      expect(backend.controller.devices, isEmpty);
      expect(backend.controller.busy, false);
    }
  });
  test(
    'restores saved session through /auth/me before loading devices',
    () async {
      backend.store.token = 'test-token';
      backend.add('A');
      await backend.controller.restore();
      expect(backend.requests.first.url.path, '/api/v1/auth/me');
      expect(backend.controller.user?.username, 'gardener');
      expect(backend.controller.activeId, 'A');
    },
  );
  test('401 clears token, user, devices, readings and saved session', () async {
    backend.add('A');
    await backend.login();
    backend.expired = true;
    await backend.controller.refreshReading();
    expect(backend.controller.authenticated, false);
    expect(backend.controller.latest, isNull);
    expect(backend.controller.devices, isEmpty);
    expect(backend.store.token, isNull);
    expect(backend.controller.sessionMessage, contains('hết hạn'));
  });
  test(
    'delayed old device response cannot overwrite the newly selected device',
    () async {
      backend.add('A');
      backend.add('B');
      await backend.login();
      final delayed = Completer<http.Response>();
      backend.pending['/devices/A/readings/latest'] = delayed;
      final oldRequest = backend.controller.refreshReading();
      await backend.controller.select('B');
      await Future<void>.delayed(Duration.zero);
      delayed.complete(backend.json(backend.latest('A')));
      await oldRequest;
      expect(backend.controller.latest?.deviceId, 'B');
    },
  );
  test(
    'delayed telemetry cannot repopulate the session after logout',
    () async {
      backend.add('A');
      await backend.login();
      final delayed = Completer<http.Response>();
      backend.pending['/devices/A/readings/latest'] = delayed;
      final request = backend.controller.refreshReading();
      await backend.controller.logout();
      delayed.complete(backend.json(backend.latest('A')));
      await request;
      expect(backend.controller.latest, isNull);
      expect(backend.controller.authenticated, false);
    },
  );
  test('unlink succeeds even if refreshing list fails; removed device stays hidden', () async {
    backend.add('A');
    await backend.login();
    backend.devicesStatus = 500;
    await backend.controller.remove('A');
    expect(backend.controller.devices, isEmpty);
    expect(backend.controller.latest, isNull);
    expect(backend.controller.deviceError, isNotNull);
  });
  test('old list response cannot resurrect an unlinked device', () async {
    backend.add('A');
    await backend.login();
    final delayed = Completer<http.Response>();
    backend.pending['/user/devices'] = delayed;
    final oldResponse = backend.json({
      'devices': List.of(backend.devices),
      'active_device_id': 'A',
    });
    final refreshing = backend.controller.refreshDevices();
    await backend.controller.remove('A');
    delayed.complete(oldResponse);
    await refreshing;
    expect(backend.controller.devices, isEmpty);
    expect(backend.controller.activeId, isNull);
  });
  test('network errors do not show cached telemetry as current', () async {
    backend.add('A');
    await backend.login();
    backend.latestStatus = 500;
    await backend.controller.refreshReading();
    expect(backend.controller.latest, isNull);
    expect(backend.controller.readingError, isNotNull);
  });
  test('HTML error and timeout have readable messages', () async {
    final html = ApiService(
      client: MockClient(
        (_) async => http.Response('<html>Bad gateway</html>', 502),
      ),
    );
    await expectLater(
      html.login('a', 'b'),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          contains('máy chủ'),
        ),
      ),
    );
    html.dispose();
    final slow = ApiService(
      timeout: const Duration(milliseconds: 1),
      client: MockClient((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 5));
        return http.Response('{}', 200);
      }),
    );
    await expectLater(
      slow.login('a', 'b'),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'timeout')),
    );
    slow.dispose();
  });
}
