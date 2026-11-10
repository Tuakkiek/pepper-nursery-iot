import 'package:flutter/material.dart';

/// Design tokens theo mục 2, 4, 8 của Design_System_Web_Mobile.md
class AppColors {
  // 1. Màu gốc từ ảnh tham chiếu (Mục 2)
  static const Color coral = Color(0xFFF7444E);      // brand.coral: Điểm nhấn, dấu cảnh báo
  static const Color cream = Color(0xFFF7F8F3);      // brand.cream: Nền ứng dụng
  static const Color teal = Color(0xFF78BCC4);       // brand.teal: Thông tin bình thường, điểm nhấn biểu đồ
  static const Color navy = Color(0xFF002C3E);       // brand.navy: Chữ chính, nút chính, thanh điều hướng

  // 2. Màu bổ trợ (Mục 2)
  static const Color surface = Color(0xFFFFFFFF);    // surface: Thẻ số đo, biểu đồ, hộp thoại
  static const Color textSecondary = Color(0xFF4B6570); // text.secondary: Nhãn phụ, chú thích, thời gian
  static const Color border = Color(0xFFD5E1E0);     // border: Viền thẻ, ô nhập, đường chia
  static const Color tealSoft = Color(0xFFE7F3F3);   // teal.soft: Nền trạng thái bình thường/thông tin
  static const Color coralSoft = Color(0xFFFFE9EA);  // coral.soft: Nền cảnh báo/lỗi
  static const Color coralStrong = Color(0xFFB62430);// coral.strong: Chữ cảnh báo/lỗi và nút nguy cơ cao

  // Aliases theo đúng tên token mobile ở mục 8
  static const Color colorCoral = coral;
  static const Color colorCream = cream;
  static const Color colorTeal = teal;
  static const Color colorNavy = navy;
  static const Color colorSurface = surface;
  static const Color colorTextSecondary = textSecondary;
  static const Color colorBorder = border;
  static const Color colorTealSoft = tealSoft;
  static const Color colorCoralSoft = coralSoft;
  static const Color colorCoralStrong = coralStrong;
}

/// Token khoảng cách theo mục 4 của Design_System_Web_Mobile.md
class AppSpacing {
  static const double space1 = 4.0;   // Giữa biểu tượng và nhãn rất gần
  static const double space2 = 8.0;   // Giữa nhãn và giá trị, các mục nhỏ
  static const double space3 = 12.0;  // Nội dung cùng nhóm
  static const double space4 = 16.0;  // Đệm thẻ mobile, khoảng cách thông dụng
  static const double space6 = 24.0;  // Khoảng cách giữa nhóm
  static const double space8 = 32.0;  // Khoảng cách giữa các khu vực lớn
  static const double space12 = 48.0; // Đầu/cuối trang khi có không gian
}

/// Token bán kính bo góc theo mục 4 của Design_System_Web_Mobile.md
class AppRadius {
  static const double control = 12.0; // Ô nhập, nút
  static const double card = 16.0;    // Thẻ số đo
  static const double dialog = 20.0;  // Hộp thoại, modal
}

/// Cấp chữ Mobile theo mục 3 của Design_System_Web_Mobile.md
class AppTypography {
  // Tiêu đề trang: 24 px / 32 px, đậm 700
  static const TextStyle pageTitle = TextStyle(
    fontSize: 24,
    height: 32 / 24,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
  );

  // Tiêu đề mục: 20 px / 28 px, đậm 600
  static const TextStyle sectionTitle = TextStyle(
    fontSize: 20,
    height: 28 / 20,
    fontWeight: FontWeight.w600,
    color: AppColors.navy,
  );

  // Giá trị số đo: 28 px / 36 px, đậm 700 (tabular figures)
  static const TextStyle metricValue = TextStyle(
    fontSize: 28,
    height: 36 / 28,
    fontWeight: FontWeight.w700,
    color: AppColors.navy,
    fontFeatures: [FontFeature.tabularFigures()],
  );

  // Nội dung: 16 px / 24 px, thường 400
  static const TextStyle body = TextStyle(
    fontSize: 16,
    height: 24 / 16,
    fontWeight: FontWeight.w400,
    color: AppColors.navy,
  );

  // Nhãn và chú thích: 14 px / 20 px, vừa 500
  static const TextStyle caption = TextStyle(
    fontSize: 14,
    height: 20 / 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textSecondary,
  );

  // Nhãn nhỏ (Badge): 12 px / 16 px, đậm vừa 600
  static const TextStyle badge = TextStyle(
    fontSize: 12,
    height: 16 / 12,
    fontWeight: FontWeight.w600,
  );
}
