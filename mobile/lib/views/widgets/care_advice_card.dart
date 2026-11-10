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
    final advice = latestData?.adviceMessage;

    // Kiểm tra xem dữ liệu có thiếu, lỗi hoặc cũ không
    final hasSensorError = reading != null &&
        (reading.sensorStatus.dht22 != 'ok' ||
            reading.sensorStatus.ds18b20 != 'ok' ||
            (reading.sensorStatus.hd38 != 'ok' && reading.sensorStatus.hd38 != 'not_calibrated') ||
            (reading.sensorStatus.tds != 'ok' && reading.sensorStatus.tds != 'not_calibrated') ||
            (reading.sensorStatus.ph4502c != 'ok' && reading.sensorStatus.ph4502c != 'not_calibrated'));

    final isDataIncompleteOrStale =
        reading == null || isStale == true || hasSensorError;

    // Nếu dữ liệu thiếu/lỗi/cũ: hiển thị theo hợp đồng G0 và Design System
    if (isDataIncompleteOrStale) {
      return Container(
        decoration: BoxDecoration(
          color: AppColors.coralSoft,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.coral, width: 1.0),
        ),
        padding: const EdgeInsets.all(AppSpacing.space4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(Icons.info_outline, color: AppColors.coralStrong, size: 22),
            const SizedBox(width: AppSpacing.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Trạng thái nhận định vườn ươm',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.coralStrong,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.space1),
                  Text(
                    reading == null
                        ? 'Chưa có dữ liệu cảm biến để phân tích.'
                        : (isStale == true
                            ? 'Không đủ dữ liệu để đưa ra nhận định (Dữ liệu đã cũ).'
                            : 'Không đủ dữ liệu để đưa ra nhận định do một số cảm biến gặp lỗi kỹ thuật.'),
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

    // Nếu có lời khuyên chăm sóc được backend trả về
    if (advice != null && advice.isNotEmpty) {
      final isDangerOrWarning = latestData?.adviceStatus == 'danger' ||
          latestData?.adviceStatus == 'warning' ||
          latestData?.adviceStatus == 'insufficient_data';
      final suggestedAction = latestData?.suggestedAction;
      final hasDistinctAction = suggestedAction != null &&
          suggestedAction.isNotEmpty &&
          !advice.contains(suggestedAction);

      return Container(
        decoration: BoxDecoration(
          color: isDangerOrWarning ? AppColors.coralSoft : AppColors.tealSoft,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(
            color: isDangerOrWarning ? AppColors.coral : AppColors.teal,
            width: 1.0,
          ),
        ),
        padding: const EdgeInsets.all(AppSpacing.space4),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              isDangerOrWarning ? Icons.warning_amber_rounded : Icons.eco,
              color: isDangerOrWarning ? AppColors.coralStrong : AppColors.navy,
              size: 22,
            ),
            const SizedBox(width: AppSpacing.space3),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isDangerOrWarning
                        ? 'Cảnh báo chăm sóc từ Backend'
                        : 'Khuyến nghị chăm sóc (Đã duyệt)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDangerOrWarning
                          ? AppColors.coralStrong
                          : AppColors.navy,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.space1),
                  Text(
                    advice,
                    style: const TextStyle(
                      fontSize: 13,
                      height: 18 / 13,
                      color: AppColors.navy,
                    ),
                  ),
                  if (hasDistinctAction) ...[
                    const SizedBox(height: AppSpacing.space1),
                    Text(
                      'Hành động gợi ý: $suggestedAction',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        height: 17 / 12,
                        color: AppColors.navy,
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

    // Nếu chưa có lời khuyên (đang chờ duyệt theo quy tắc MThuy G0)
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border, width: 1.0),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: const Row(
        children: [
          Icon(Icons.shield_outlined, color: AppColors.teal, size: 20),
          SizedBox(width: AppSpacing.space3),
          Expanded(
            child: Text(
              'Các chỉ số sinh trưởng đang ở mức bình thường. Chưa có cảnh báo.',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

