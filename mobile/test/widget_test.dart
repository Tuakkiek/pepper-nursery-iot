import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/main.dart';

void main() {
  testWidgets('Pepper nursery app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const PepperNurseryApp());
    expect(find.text('Vườn Ươm Ớt Con'), findsOneWidget);
    expect(find.text('Tổng quan'), findsOneWidget);
    expect(find.text('Lịch sử'), findsOneWidget);
  });
}
