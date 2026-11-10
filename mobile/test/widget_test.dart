import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/main.dart';

import 'helpers/fake_backend.dart';

void main() {
  testWidgets(
    'registration -> empty account -> claim -> readings -> unlink -> logout',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);
      final backend = FakeBackend();
      addTearDown(backend.controller.dispose);
      await tester.pumpWidget(PepperNurseryApp(controller: backend.controller));
      await tester.pumpAndSettle();
      expect(find.text('Chào mừng trở lại'), findsOneWidget);
      expect(find.text('Tổng quan'), findsNothing);
      await tester.tap(find.text('Chưa có tài khoản? Đăng ký'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Họ và tên'),
        'Người trồng ớt',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tên đăng nhập'),
        'gardener',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Mật khẩu'),
        'secret123',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Nhập lại mật khẩu'),
        'secret123',
      );
      await tester.ensureVisible(find.text('Tạo tài khoản'));
      await tester.tap(find.text('Tạo tài khoản'));
      await tester.pumpAndSettle();
      expect(find.text('Chưa có thiết bị nào'), findsOneWidget);
      await tester.tap(find.text('Thêm thiết bị đầu tiên'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Device ID'),
        'A',
      );
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Tên gợi nhớ (không bắt buộc)'),
        'Khay ban công',
      );
      await tester.ensureVisible(find.text('Thêm vào tài khoản'));
      await tester.tap(find.text('Thêm vào tài khoản'));
      await tester.pumpAndSettle();
      expect(find.text('27,4'), findsOneWidget);
      expect(find.text('Số đo mới nhất'), findsOneWidget);
      await tester.tap(find.text('Lịch sử'));
      await tester.pumpAndSettle();
      expect(find.text('Chưa có bản ghi lịch sử nào'), findsOneWidget);
      await tester.tap(find.text('Thiết bị'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Tùy chọn Khay ban công'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Gỡ khỏi tài khoản'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Giữ lại'));
      await tester.pumpAndSettle();
      expect(backend.controller.devices.length, 1);
      await tester.tap(find.byTooltip('Tùy chọn Khay ban công'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Gỡ khỏi tài khoản'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Gỡ thiết bị'));
      await tester.pumpAndSettle();
      expect(find.text('Chưa có thiết bị nào'), findsOneWidget);
      await tester.tap(find.byTooltip('Tài khoản'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Đăng xuất'));
      await tester.pumpAndSettle();
      expect(find.text('Chào mừng trở lại'), findsOneWidget);
      expect(backend.store.token, isNull);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets(
    'claim conflict stays in form, preserves input and offers retry',
    (tester) async {
      final backend = FakeBackend();
      backend.store.token = 'test-token';
      backend.claimError = 'device_already_claimed';
      addTearDown(backend.controller.dispose);
      await tester.pumpWidget(PepperNurseryApp(controller: backend.controller));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Thêm thiết bị đầu tiên'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.widgetWithText(TextFormField, 'Device ID'),
        'TAKEN',
      );
      await tester.tap(find.text('Thêm vào tài khoản'));
      await tester.pumpAndSettle();
      expect(
        find.textContaining('Thiết bị đã thuộc tài khoản khác'),
        findsOneWidget,
      );
      expect(find.text('TAKEN'), findsOneWidget);
      expect(backend.controller.devices, isEmpty);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('small screen with large text does not overflow', (tester) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1;
    tester.platformDispatcher.textScaleFactorTestValue = 1.6;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
    final backend = FakeBackend();
    addTearDown(backend.controller.dispose);
    await tester.pumpWidget(PepperNurseryApp(controller: backend.controller));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    backend.add('A');
    await backend.controller.authenticate(
      username: 'gardener',
      password: 'secret123',
    );
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Thiết bị'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Lịch sử'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    backend.controller.setForeground(false);
  });
}
