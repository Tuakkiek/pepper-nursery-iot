import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

enum MetricState {
  normal,
  uncalibrated,
  error,
  missing,
}

class MetricCard extends StatelessWidget {
  final String title;
  final String? displayValue;
  final String unit;
  final MetricState state;
  final String statusText;
  final IconData icon;
  final String? subtitle;

  const MetricCard({
    super.key,
    required this.title,
    required this.displayValue,
    required this.unit,
    required this.state,
    required this.statusText,
    required this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    Color badgeBg;
    Color badgeTextColor;
    Border? border;

    switch (state) {
      case MetricState.normal:
        badgeBg = AppColors.tealSoft;
        badgeTextColor = AppColors.navy;
        border = Border.all(color: AppColors.border, width: 1);
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
        border = Border.all(color: AppColors.border, width: 1);
        break;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: border,
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tiêu đề + icon
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              Icon(icon, size: 20, color: AppColors.teal),
            ],
          ),
          const SizedBox(height: 12),

          // Giá trị lớn + Đơn vị (tabular numbers)
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                displayValue ?? '—',
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
              if (displayValue != null && unit.isNotEmpty) ...[
                const SizedBox(width: 4),
                Text(
                  unit,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 10),

          // Nhãn trạng thái
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: badgeBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              statusText,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: badgeTextColor,
              ),
            ),
          ),

          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(
              subtitle!,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

