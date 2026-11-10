import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/main.dart';

import 'helpers/fake_backend.dart';

// Optional local QA artifacts; fonts and screenshots stay outside source control.
void main() {
  const fontPath = String.fromEnvironment('QA_FONT_PATH');
  testWidgets('render mobile screens for visual review', (tester) async {
    final loader = FontLoader('Roboto')
      ..addFont(
        Future.value(ByteData.sublistView(File(fontPath).readAsBytesSync())),
      );
    await loader.load();
    final fallback = FontLoader('Ahem')
      ..addFont(
        Future.value(ByteData.sublistView(File(fontPath).readAsBytesSync())),
      );
    await fallback.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
    await icons.load();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final backend = FakeBackend();
    addTearDown(backend.controller.dispose);
    final boundary = GlobalKey();
    await tester.pumpWidget(
      RepaintBoundary(
        key: boundary,
        child: PepperNurseryApp(controller: backend.controller),
      ),
    );
    await tester.pumpAndSettle();
    Future<void> capture(String name) async {
      await tester.runAsync(() async {
        final image =
            await (boundary.currentContext!.findRenderObject()
                    as RenderRepaintBoundary)
                .toImage();
        final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
        final file = File('build/qa/$name.png');
        await file.parent.create(recursive: true);
        await file.writeAsBytes(bytes!.buffer.asUint8List());
        image.dispose();
      });
    }

    await capture('login');
    await tester.tap(find.text('Chưa có tài khoản? Đăng ký'));
    await tester.pumpAndSettle();
    await capture('register');
    await backend.controller.authenticate(
      username: 'gardener',
      password: 'secret123',
    );
    await tester.pumpAndSettle();
    await capture('empty');
    await tester.tap(find.text('Thêm thiết bị đầu tiên'));
    await tester.pumpAndSettle();
    await capture('claim');
    await tester.tap(find.text('Hủy'));
    await tester.pumpAndSettle();
    backend.add('A', name: 'Khay ớt ban công');
    await backend.controller.refreshDevices();
    await tester.pumpAndSettle();
    await capture('dashboard');
    await tester.tap(find.text('Thiết bị'));
    await tester.pumpAndSettle();
    await capture('devices');
    backend.controller.setForeground(false);
    expect(tester.takeException(), isNull);
  }, skip: fontPath.isEmpty);
}
