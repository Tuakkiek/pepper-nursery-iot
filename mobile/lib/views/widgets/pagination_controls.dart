import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class PaginationControls extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final bool isLoading;
  final ValueChanged<int> onPageChanged;

  const PaginationControls({
    super.key,
    required this.currentPage,
    required this.totalPages,
    this.isLoading = false,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) return const SizedBox.shrink();

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(0, 40),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          icon: const Icon(Icons.chevron_left, size: 18),
          onPressed: currentPage > 1 && !isLoading
              ? () => onPageChanged(currentPage - 1)
              : null,
          label: const Text('Trang trước', style: TextStyle(fontSize: 13)),
        ),
        Flexible(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Text(
              'Trang $currentPage / $totalPages',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.navy,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(0, 40),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          icon: const Icon(Icons.chevron_right, size: 18),
          onPressed: currentPage < totalPages && !isLoading
              ? () => onPageChanged(currentPage + 1)
              : null,
          label: const Text('Trang sau', style: TextStyle(fontSize: 13)),
        ),
      ],
    );
  }
}

