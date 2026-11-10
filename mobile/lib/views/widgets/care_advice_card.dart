import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import 'feedback_card.dart';

class CareAdviceCard extends StatelessWidget {
  final LatestReadingResponse? latestData;
  const CareAdviceCard({super.key, required this.latestData});
  @override
  Widget build(BuildContext context) {
    final data = latestData;
    final message = data?.adviceMessage;
    if (data?.reading == null ||
        data?.isStale != false ||
        message == null ||
        message.isEmpty) {
      return const FeedbackCard(
        message: 'Không đủ dữ liệu để đưa ra nhận định chăm sóc.',
        isError: false,
      );
    }
    final warning = [
      'danger',
      'warning',
      'attention',
    ].contains(data?.adviceStatus);
    return Card(
      color: warning ? AppColors.coralSoft : AppColors.tealSoft,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              warning ? 'Chăm sóc · Cần chú ý' : 'Nhận định chăm sóc',
              style: AppTypography.sectionTitle.copyWith(
                color: warning ? AppColors.coralStrong : AppColors.navy,
              ),
            ),
            const SizedBox(height: 8),
            Text(message, style: AppTypography.body),
          ],
        ),
      ),
    );
  }
}
