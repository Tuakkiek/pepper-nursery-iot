import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/main.dart';

void main() {
  testWidgets('Pepper nursery app navigation and screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const PepperNurseryApp());

    // Kiểm tra AppBar và các tab điều hướng
    expect(find.text('Vườn Ươm Ớt Con'), findsOneWidget);
    expect(find.text('Tổng quan'), findsOneWidget);
    expect(find.text('Lịch sử'), findsOneWidget);
    expect(find.text('Chăm sóc'), findsOneWidget);

    // Chuyển sang tab Lịch sử
    await tester.tap(find.text('Lịch sử'));
    await tester.pumpAndSettle();
    expect(find.text('Lịch Sử Số Đo'), findsOneWidget);

    // Chuyển sang tab Chăm sóc
    await tester.tap(find.text('Chăm sóc'));
    await tester.pumpAndSettle();
    expect(find.text('Quy Tắc Chăm Sóc'), findsOneWidget);
  });
}
