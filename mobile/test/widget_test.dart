import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/main.dart';
import 'package:pepper_nursery_mobile/services/api_service.dart';

Future<void> _settleWithAsyncAssets(WidgetTester tester) async {
  // Cho phép Future đọc asset từ rootBundle hoàn tất trước khi pumpAndSettle
  await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100)));
  await tester.pumpAndSettle();
}

void main() {
  setUp(() {
    rootBundle.clear();
  });
  testWidgets('Guest navigation and main tabs smoke test', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    await tester.pumpWidget(PepperNurseryApp(apiService: apiService));

    // Màn hình khởi đầu là Đăng nhập
    expect(find.text('Vườn Ươm Ớt Con'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Đăng nhập'), findsOneWidget);
    expect(find.text('Đăng ký ngay'), findsOneWidget);

    // Tiếp tục không cần đăng nhập (Chế độ Khách)
    final guestButton = find.text('Tiếp tục không cần đăng nhập');
    await tester.ensureVisible(guestButton);
    await tester.tap(guestButton);
    await _settleWithAsyncAssets(tester);

    // Kiểm tra AppBar và các tab điều hướng
    expect(find.text('Vườn Ươm Ớt Con'), findsOneWidget);
    expect(find.text('Tổng quan'), findsOneWidget);
    expect(find.text('Lịch sử'), findsOneWidget);
    expect(find.text('Chăm sóc'), findsOneWidget);
    expect(find.text('Tài khoản'), findsOneWidget);
    expect(find.text('Chế độ Khách (Chưa đăng nhập)'), findsOneWidget);

    // Chuyển sang tab Lịch sử
    await tester.tap(find.text('Lịch sử'));
    await _settleWithAsyncAssets(tester);
    expect(find.text('Lịch Sử Số Đo'), findsOneWidget);

    // Chuyển sang tab Chăm sóc
    await tester.tap(find.text('Chăm sóc'));
    await _settleWithAsyncAssets(tester);
    expect(find.text('Quy Tắc Chăm Sóc'), findsOneWidget);

    // Chuyển sang tab Tài khoản (trạng thái Khách)
    await tester.tap(find.text('Tài khoản'));
    await _settleWithAsyncAssets(tester);
    expect(find.text('Tài Khoản'), findsOneWidget);
    expect(find.text('Đăng nhập tài khoản'), findsOneWidget);
    expect(find.text('Đăng ký tài khoản mới'), findsOneWidget);

    // Quay lại tab Tổng quan và mở lại màn hình Đăng nhập
    await tester.tap(find.text('Tổng quan'));
    await _settleWithAsyncAssets(tester);
    await tester.tap(find.widgetWithText(TextButton, 'Đăng nhập'));
    await _settleWithAsyncAssets(tester);
    expect(find.text('Chưa có tài khoản?'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });

  testWidgets('Login and Register screens flow with validation and fixture auth', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    await tester.pumpWidget(PepperNurseryApp(apiService: apiService));

    // 1. Kiểm tra validate form Đăng nhập khi bỏ trống
    final loginBtn = find.widgetWithText(ElevatedButton, 'Đăng nhập');
    await tester.ensureVisible(loginBtn);
    await tester.tap(loginBtn);
    await tester.pump();
    expect(find.text('Vui lòng nhập tên đăng nhập'), findsOneWidget);
    expect(find.text('Vui lòng nhập mật khẩu'), findsOneWidget);

    // 2. Chuyển sang màn hình Đăng ký
    final registerLink = find.text('Đăng ký ngay');
    await tester.ensureVisible(registerLink);
    await tester.tap(registerLink);
    await _settleWithAsyncAssets(tester);
    expect(find.text('Tạo tài khoản mới'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Đăng ký'), findsOneWidget);

    // 3. Kiểm tra validate form Đăng ký khi bỏ trống / mật khẩu không khớp
    await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Đăng ký'));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng ký'));
    await tester.pump();
    expect(find.text('Vui lòng nhập họ và tên'), findsOneWidget);
    expect(find.text('Tên đăng nhập phải có ít nhất 3 ký tự'), findsOneWidget);
    expect(find.text('Mật khẩu phải có ít nhất 6 ký tự'), findsOneWidget);

    // 4. Điền thông tin hợp lệ và đăng ký tài khoản mới
    final fields = find.byType(TextFormField);
    await tester.enterText(fields.at(0), 'Nguyễn Văn Ớt');
    await tester.enterText(fields.at(1), 'vuonot01');
    await tester.enterText(fields.at(2), 'secret123');
    await tester.enterText(fields.at(3), 'secret123');

    await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Đăng ký'));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng ký'));
    await _settleWithAsyncAssets(tester);

    // 5. Sau khi đăng ký thành công, vào màn hình chính với tên người dùng mới
    expect(apiService.isAuthenticated, isTrue);
    expect(find.text('Nguyễn Văn Ớt (USER)'), findsOneWidget);

    // 6. Đăng xuất quay về màn hình Đăng nhập và thử đăng nhập bằng nút điền nhanh admin
    await tester.tap(find.widgetWithText(TextButton, 'Đăng xuất'));
    await _settleWithAsyncAssets(tester);
    expect(apiService.isAuthenticated, isFalse);
    expect(find.widgetWithText(ElevatedButton, 'Đăng nhập'), findsOneWidget);

    final adminChip = find.widgetWithText(ActionChip, 'admin');
    await tester.ensureVisible(adminChip);
    await tester.tap(adminChip);
    await tester.pump();
    await tester.ensureVisible(find.widgetWithText(ElevatedButton, 'Đăng nhập'));
    await tester.tap(find.widgetWithText(ElevatedButton, 'Đăng nhập'));
    await _settleWithAsyncAssets(tester);

    expect(apiService.isAuthenticated, isTrue);
    expect(find.text('Quản trị viên Vườn ươm (ADMIN)'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });

  testWidgets('Dashboard refreshes immediately when switching fixture scenario', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    await tester.pumpWidget(PepperNurseryApp(apiService: apiService, skipAuthGate: true));
    await _settleWithAsyncAssets(tester);

    // Dữ liệu ban đầu của kịch bản Normal hiển thị đúng độ chính xác
    expect(find.text('27.10'), findsOneWidget);
    expect(find.text('6.40'), findsOneWidget);

    // Chuyển kịch bản sang Uncalibrated -> cache cũ phải bị xóa và hiển thị raw ADC ngay
    apiService.currentScenario = FixtureScenario.uncalibrated;
    await _settleWithAsyncAssets(tester);

    expect(find.text('Chưa hiệu chuẩn'), findsNWidgets(3));
    expect(find.text('1800'), findsOneWidget);
    expect(find.text('1560'), findsOneWidget);
    expect(find.text('1930'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });

  testWidgets('Account tab shows authenticated profile and manages fixture devices', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    await apiService.login('admin', 'admin123');
    await tester.pumpWidget(PepperNurseryApp(apiService: apiService));
    await _settleWithAsyncAssets(tester);

    // Chuyển sang tab Tài khoản
    await tester.tap(find.text('Tài khoản'));
    await _settleWithAsyncAssets(tester);

    expect(find.text('Tài Khoản'), findsOneWidget);
    expect(find.text('Quản trị viên Vườn ươm'), findsOneWidget);
    expect(find.text('@admin'), findsOneWidget);
    expect(find.text('Thiết bị của tài khoản'), findsOneWidget);
    expect(find.text('Trạm vườn ươm Khay A'), findsOneWidget);
    expect(find.text('Thiết bị trên hệ thống'), findsNothing);
    expect(find.widgetWithText(TextButton, 'Xóa'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Đăng xuất tài khoản'),
      200,
      scrollable: find.byType(Scrollable).last,
    );
    expect(find.text('Đăng xuất tài khoản'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });

  testWidgets('Open ReadingDetailsScreen from History and filter fields', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    await tester.pumpWidget(PepperNurseryApp(apiService: apiService, skipAuthGate: true));
    await _settleWithAsyncAssets(tester);

    // Chuyển sang tab Lịch sử và kiểm tra tất cả 6 chip chọn cảm biến hiển thị đủ trên màn hình
    await tester.tap(find.text('Lịch sử'));
    await _settleWithAsyncAssets(tester);
    expect(find.widgetWithText(ChoiceChip, 'Nhiệt độ khí (°C)'), findsOneWidget);
    expect(find.widgetWithText(ChoiceChip, 'Độ ẩm khí (%)'), findsOneWidget);
    expect(find.widgetWithText(ChoiceChip, 'Nhiệt độ đất (°C)'), findsOneWidget);
    expect(find.widgetWithText(ChoiceChip, 'Độ ẩm đất (%)'), findsOneWidget);
    expect(find.widgetWithText(ChoiceChip, 'TDS mẫu nước (ppm)'), findsOneWidget);
    expect(find.widgetWithText(ChoiceChip, 'pH mẫu nước (pH)'), findsOneWidget);

    // Chuyển qua một cảm biến ở hàng dưới (pH mẫu nước) để xác nhận chọn được
    await tester.tap(find.widgetWithText(ChoiceChip, 'pH mẫu nước (pH)'));
    await tester.pumpAndSettle();
    expect(find.text('pH mẫu nước (pH)'), findsWidgets);

    final detailsBtn = find.text('Xem chi tiết & lọc theo ngày, mốc giờ');
    await tester.ensureVisible(detailsBtn);
    await tester.tap(detailsBtn);
    await tester.pumpAndSettle();

    // Popup chọn bộ lọc xuất hiện trước khi vào màn hình chi tiết
    expect(find.text('Chọn bộ lọc xem chi tiết'), findsOneWidget);
    expect(find.text('Ngày bắt đầu'), findsOneWidget);
    expect(find.text('Ngày kết thúc'), findsOneWidget);
    expect(find.text('Giờ bắt đầu'), findsOneWidget);
    expect(find.text('Giờ kết thúc'), findsOneWidget);

    // Chọn trường pH mẫu nước ngay trong popup
    final popupPhChip = find.descendant(
      of: find.byType(Dialog),
      matching: find.widgetWithText(ChoiceChip, 'pH mẫu nước (pH)'),
    );
    await tester.ensureVisible(popupPhChip);
    await tester.tap(popupPhChip);
    await tester.pumpAndSettle();

    // Bấm nút Xem chi tiết để chuyển vào màn hình kết quả
    final viewBtn = find.widgetWithText(ElevatedButton, 'Xem chi tiết');
    await tester.ensureVisible(viewBtn);
    await tester.tap(viewBtn);
    await _settleWithAsyncAssets(tester);

    expect(find.text('Chi Tiết Số Đo'), findsOneWidget);
    expect(find.text('Đổi bộ lọc'), findsOneWidget);
    expect(find.text('Tìm thấy 2 bản ghi phù hợp'), findsOneWidget);
    expect(find.textContaining('Min 6.40'), findsOneWidget);

    // Đảm bảo không hiển thị log sample_id, badge v0.1 • ID và phần Nhận:
    expect(find.textContaining('Mẫu:'), findsNothing);
    expect(find.textContaining('v0.1'), findsNothing);
    expect(find.textContaining('Nhận:'), findsNothing);
    expect(find.text('Chưa hiệu chuẩn'), findsOneWidget);

    await tester.drag(find.byType(ListView), const Offset(0, -300));
    await tester.pumpAndSettle();
    expect(find.text('6.40 pH'), findsOneWidget);
    expect(find.text('Bình thường'), findsOneWidget);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });

  testWidgets('Backend settings button removed & device manager loads ID, adds and renames devices', (WidgetTester tester) async {
    final apiService = ApiService()
      ..mode = DataSourceMode.fixture
      ..autoRefresh = false;

    // 1. LoginScreen không còn nút cài đặt backend
    await tester.pumpWidget(PepperNurseryApp(apiService: apiService));
    expect(find.byIcon(Icons.tune), findsNothing);

    final guestButton = find.text('Tiếp tục không cần đăng nhập');
    await tester.ensureVisible(guestButton);
    await tester.tap(guestButton);
    await _settleWithAsyncAssets(tester);

    // 2. Dashboard không còn nút cài đặt backend, hiển thị ID thiết bị và nút Thiết bị
    expect(find.byIcon(Icons.tune), findsNothing);
    expect(find.text('Cài đặt kết nối backend'), findsNothing);
    expect(find.text('ID: 1'), findsOneWidget);
    expect(find.widgetWithText(OutlinedButton, 'Thiết bị'), findsOneWidget);

    // 3. Mở popup Quản lý thiết bị từ thẻ DeviceStatusCard
    await tester.tap(find.widgetWithText(OutlinedButton, 'Thiết bị'));
    await _settleWithAsyncAssets(tester);

    expect(find.text('Quản lý thiết bị'), findsOneWidget);
    expect(find.text('THIẾT BỊ HIỆN TẠI'), findsOneWidget);
    expect(find.text('Trạm vườn ươm Khay A'), findsWidgets);

    // 4. Thêm thiết bị mới và đặt tên
    await tester.tap(find.widgetWithText(ElevatedButton, 'Thêm thiết bị mới'));
    await tester.pumpAndSettle();

    expect(find.text('Thêm thiết bị mới'), findsWidgets);
    final addFields = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextFormField),
    );
    await tester.enterText(addFields.at(0), 'khay-02');
    await tester.enterText(addFields.at(1), 'Vườn ươm Khay B');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Thêm thiết bị'));
    await _settleWithAsyncAssets(tester);

    expect(apiService.deviceId, 'khay-02');
    expect(apiService.activeDeviceName, 'Vườn ươm Khay B');
    expect(find.text('ID: khay-02'), findsWidgets);
    expect(find.text('Vườn ươm Khay B'), findsWidgets);

    // 5. Đổi tên thiết bị hiện tại trên banner
    await tester.tap(find.widgetWithText(OutlinedButton, 'Đổi tên'));
    await tester.pumpAndSettle();

    expect(find.text('Đặt tên thiết bị'), findsOneWidget);
    final renameField = find.descendant(
      of: find.byType(AlertDialog),
      matching: find.byType(TextFormField),
    );
    await tester.enterText(renameField, 'Khay B Đã Đặt Tên');
    await tester.tap(find.widgetWithText(ElevatedButton, 'Lưu tên'));
    await _settleWithAsyncAssets(tester);

    expect(apiService.activeDeviceName, 'Khay B Đã Đặt Tên');
    expect(find.text('Khay B Đã Đặt Tên'), findsWidgets);

    // Đóng bottom sheet và kiểm tra Dashboard hiển thị ID và tên mới
    Navigator.of(tester.element(find.text('Quản lý thiết bị'))).pop();
    await _settleWithAsyncAssets(tester);
    expect(find.text('ID: khay-02'), findsOneWidget);
    expect(find.text('Khay B Đã Đặt Tên'), findsOneWidget);

    // 6. Chuyển sang tab Tài khoản (Khách): có cả nút Thêm, Đặt tên và Xóa thiết bị
    await tester.tap(find.text('Tài khoản'));
    await _settleWithAsyncAssets(tester);
    expect(find.byIcon(Icons.tune), findsNothing);
    expect(find.text('Mở cài đặt kết nối & dữ liệu'), findsNothing);
    expect(find.text('ID thiết bị hiện tại: khay-02'), findsOneWidget);

    // Xóa thiết bị khay-02 trên tab Tài khoản
    final deleteButtons = find.widgetWithText(TextButton, 'Xóa');
    expect(deleteButtons, findsNWidgets(2));
    await tester.scrollUntilVisible(
      deleteButtons.last,
      200,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.pumpAndSettle();
    await tester.tap(deleteButtons.last);
    await tester.pumpAndSettle();

    expect(find.text('Xóa thiết bị'), findsNWidgets(2)); // Title + nút xác nhận
    await tester.tap(find.widgetWithText(ElevatedButton, 'Xóa thiết bị'));
    await _settleWithAsyncAssets(tester);

    expect(apiService.deviceId, '1');
    expect(find.text('ID thiết bị hiện tại: 1'), findsOneWidget);
    expect(find.text('ID: khay-02'), findsNothing);

    await tester.pumpWidget(const SizedBox.shrink());
    apiService.dispose();
  });
}
