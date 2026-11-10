import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

enum MetricState {
  normal,        // Mới, hợp lệ: teal.soft / brand.teal, text navy
  uncalibrated,  // Chưa hiệu chuẩn: teal.soft / viền brand.teal, text navy
  error,         // Lỗi cảm biến: coral.soft / brand.coral, text coral.strong
  missing,       // Chưa có dữ liệu: surface / viền border, text textSecondary
}

class MetricCard extends StatelessWidget {
  final String title;
  final String? displayValue;
  final String unit;
  final MetricState state;
  final String statusText;
  final IconData icon;
  final String? subtitle;
  final String? timestamp;
  final VoidCallback? onTap;

  const MetricCard({
    super.key,
    required this.title,
    required this.displayValue,
    required this.unit,
    required this.state,
    required this.statusText,
    required this.icon,
    this.subtitle,
    this.timestamp,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color badgeBg;
    Color badgeTextColor;
    Border border;

    switch (state) {
      case MetricState.normal:
        badgeBg = AppColors.tealSoft;
        badgeTextColor = AppColors.navy;
        border = Border.all(color: AppColors.border, width: 1.0);
        break;
      case MetricState.uncalibrated:
        badgeBg = AppColors.tealSoft;
        badgeTextColor = AppColors.navy;
        border = Border.all(color: AppColors.teal, width: 1.5);
        break;
      case MetricState.error:
        badgeBg = AppColors.coralSoft;
        badgeTextColor = AppColors.coralStrong;
        border = Border.all(color: AppColors.coral, width: 1.5);
        break;
      case MetricState.missing:
        badgeBg = AppColors.cream;
        badgeTextColor = AppColors.textSecondary;
        border = Border.all(color: AppColors.border, width: 1.0);
        break;
    }

    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadius.card),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: border,
          ),
          padding: const EdgeInsets.all(AppSpacing.space4),
          child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Tên số đo + icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    height: 20 / 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.tealSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: AppColors.navy),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space3),

          // 2. Giá trị lớn + Đơn vị (tabular figures)
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                displayValue ?? '—',
                style: AppTypography.metricValue,
              ),
              if (displayValue != null && unit.isNotEmpty) ...[
                const SizedBox(width: AppSpacing.space1),
                Text(
                  unit,
                  style: const TextStyle(
                    fontSize: 16,
                    height: 24 / 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.space2),

          // 3. Nhãn trạng thái
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statusText,
                  style: AppTypography.badge.copyWith(color: badgeTextColor),
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(width: AppSpacing.space2),
                Expanded(
                  child: Text(
                    subtitle!,
                    style: AppTypography.caption.copyWith(fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),

          // 4. Thời điểm đo / cập nhật
          if (timestamp != null) ...[
            const SizedBox(height: AppSpacing.space2),
            Text(
              timestamp!,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
        ),
      ),
    );
  }
}
