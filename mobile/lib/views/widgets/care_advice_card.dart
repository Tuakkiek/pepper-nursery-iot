import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';

class CareAdviceCard extends StatelessWidget {
  final LatestReadingResponse? latestData;

  const CareAdviceCard({super.key, required this.latestData});

  @override
  Widget build(BuildContext context) {
    final reading = latestData?.reading;
    final isStale = latestData?.isStale;
    final advice = latestData?.advice;

    // 1. Chưa có dữ liệu cảm biến
    if (reading == null) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border, width: 1.0),
        ),
        padding: const EdgeInsets.all(AppSpacing.space4),
        child: const Row(
          children: [
            Icon(Icons.info_outline, color: AppColors.textSecondary, size: 22),
            SizedBox(width: AppSpacing.space3),
            Expanded(
              child: Text(
                'Chưa có dữ liệu cảm biến để phân tích.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
            ),
          ],
        ),
      );
    }

    // 2. Dữ liệu cũ (is_stale: true) -> Vàng hổ phách (Warning) theo mục 5.2
    if (isStale == true) {
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFFFFF3CD),
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: const Color(0xFFFFEEBA), width: 1.2),
        ),
        padding: const EdgeInsets.all(AppSpacing.space4),
        child: const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.warning_amber_rounded, color: Color(0xFF856404), size: 22),
            SizedBox(width: AppSpacing.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Cảnh báo dữ liệu cũ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF856404),
                    ),
                  ),
                  SizedBox(height: AppSpacing.space1),
                  Text(
                    'Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 18 / 13,
                      color: Color(0xFF856404),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // 3. Có lời khuyên từ Backend hoặc đánh giá cục bộ
    if (advice != null) {
      if (advice.status == 'danger') {
        // Đỏ san hô (Danger)
        return Container(
          decoration: BoxDecoration(
            color: AppColors.coralSoft,
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: AppColors.coral, width: 1.2),
          ),
          padding: const EdgeInsets.all(AppSpacing.space4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.error_outline, color: AppColors.coralStrong, size: 22),
              const SizedBox(width: AppSpacing.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Khuyến nghị chăm sóc khẩn cấp (Nguy hiểm)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.coralStrong,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.space1),
                    Text(
                      advice.message,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 18 / 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.navy,
                      ),
                    ),
                    if (advice.suggestedAction != null && advice.suggestedAction!.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.space2),
                      Container(
                        padding: const EdgeInsets.all(AppSpacing.space2),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(200),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: AppColors.coral.withAlpha(128)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.touch_app_outlined, size: 16, color: AppColors.coralStrong),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                'Hành động đề xuất: ${advice.suggestedAction}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.coralStrong,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      } else if (advice.status == 'warning') {
        // Vàng cam (Warning)
        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFFF3CD),
            borderRadius: BorderRadius.circular(AppRadius.card),
            border: Border.all(color: const Color(0xFFFFEEBA), width: 1.2),
          ),
          padding: const EdgeInsets.all(AppSpacing.space4),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFF856404), size: 22),
              const SizedBox(width: AppSpacing.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Khuyến nghị chăm sóc (Cảnh báo)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF856404),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.space1),
                    Text(
                      advice.message,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 18 / 13,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF856404),
                      ),
                    ),
                    if (advice.suggestedAction != null && advice.suggestedAction!.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.space2),
                      Text(
                        'Hành động: ${advice.suggestedAction}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF856404),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      }
    }

    // 4. Trạng thái bình thường hoặc optimal (Xanh mạ / Teal)
    return Container(
      decoration: BoxDecoration(
        color: AppColors.tealSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.teal, width: 1.0),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.eco, color: AppColors.navy, size: 22),
          const SizedBox(width: AppSpacing.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Trạng thái sinh trưởng',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                const SizedBox(height: AppSpacing.space1),
                Text(
                  advice?.message.isNotEmpty == true
                      ? advice!.message
                      : 'Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng.',
                  style: const TextStyle(
                    fontSize: 13,
                    height: 18 / 13,
                    color: AppColors.navy,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

