import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class FeedbackCard extends StatelessWidget {
  final String message;
  final bool isError;
  final VoidCallback? onRetry;
  const FeedbackCard({
    super.key,
    required this.message,
    this.isError = true,
    this.onRetry,
  });
  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isError ? AppColors.coralSoft : AppColors.tealSoft,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isError ? Icons.error_outline : Icons.info_outline,
                color: isError ? AppColors.coralStrong : AppColors.navy,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: AppTypography.body.copyWith(
                    color: isError ? AppColors.coralStrong : AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Thử lại')),
          ],
        ],
      ),
    ),
  );
}
