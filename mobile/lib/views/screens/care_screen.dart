import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';

class CareScreen extends StatelessWidget {
  final ApiService apiService;
  final LatestReadingResponse? latestData;

  const CareScreen({
    super.key,
    required this.apiService,
    required this.latestData,
  });

  @override
  Widget build(BuildContext context) {
    final reading = latestData?.reading;
    final isStale = latestData?.isStale;
    final advice = latestData?.adviceMessage;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quy Tắc Chăm Sóc'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.space4),
        children: [
          // Banner hiện trạng theo hợp đồng
          if (latestData == null || reading == null) ...[
            _buildInfoCard(
              title: 'Chưa có dữ liệu cảm biến',
              message: 'Không đủ dữ liệu để đưa ra nhận định hoặc khuyến nghị tưới/chăm sóc.',
              isWarning: true,
            ),
          ] else if (isStale == true) ...[
            _buildInfoCard(
              title: 'Cảnh báo dữ liệu cũ',
              message: 'Thiết bị mất liên lạc quá 5 phút. Quy tắc chăm sóc không áp dụng cho số đo đã cũ.',
              isWarning: true,
            ),
          ] else if (advice != null && advice.isNotEmpty) ...[
            _buildInfoCard(
              title: 'Khuyến nghị hiện tại từ Backend',
              message: advice,
              isWarning: false,
            ),
          ] else ...[
            _buildInfoCard(
              title: 'Trạng thái bình thường',
              message: 'Các chỉ số nằm trong ngưỡng cho phép của vườn ươm ớt con giai đoạn phát triển mầm.',
              isWarning: false,
            ),
          ],

          const SizedBox(height: AppSpacing.space6),
          const Text(
            'Tiêu chuẩn chăm sóc ớt con (Tham khảo G0)',
            style: AppTypography.sectionTitle,
          ),
          const SizedBox(height: AppSpacing.space3),

          _buildGuideItem(
            icon: Icons.thermostat,
            title: 'Nhiệt độ không khí & đất',
            content: 'Nhiệt độ tối ưu cho cây ớt con phát triển từ 25.0°C đến 30.0°C. Nhiệt độ đất lý tưởng là 24.0°C - 28.0°C.',
          ),
          const SizedBox(height: AppSpacing.space3),

          _buildGuideItem(
            icon: Icons.water_drop,
            title: 'Độ ẩm không khí & đất (HD-38)',
            content: 'Độ ẩm không khí duy trì 65% - 80%. Độ ẩm đất chỉ áp dụng sau khi module HD-38 được hiệu chuẩn chuẩn xác.',
          ),
          const SizedBox(height: AppSpacing.space3),

          _buildGuideItem(
            icon: Icons.science,
            title: 'Dung dịch dinh dưỡng (TDS & pH)',
            content: 'pH nước tưới tối ưu từ 6.0 đến 6.8. TDS từ 500 đến 800 ppm. Phép đo là của mẫu nước/dung dịch tưới, không phải độ phì của đất.',
          ),

          const SizedBox(height: AppSpacing.space6),
          Container(
            padding: const EdgeInsets.all(AppSpacing.space4),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.border),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Quy ước phân quyền nội dung (G0)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                SizedBox(height: AppSpacing.space2),
                Text(
                  '• Nội dung quy tắc và cảnh báo do MThuy phụ trách và backend tính toán.\n'
                  '• Frontend hiển thị trung thực kết quả API, không tự ý suy đoán hoặc gán ngưỡng tự tạo.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 18 / 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String message,
    required bool isWarning,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isWarning ? AppColors.coralSoft : AppColors.tealSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: isWarning ? AppColors.coral : AppColors.teal,
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isWarning ? Icons.warning_amber_rounded : Icons.check_circle_outline,
            color: isWarning ? AppColors.coralStrong : AppColors.navy,
            size: 24,
          ),
          const SizedBox(width: AppSpacing.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isWarning ? AppColors.coralStrong : AppColors.navy,
                  ),
                ),
                const SizedBox(height: AppSpacing.space1),
                Text(
                  message,
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

  Widget _buildGuideItem({
    required IconData icon,
    required String title,
    required String content,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.tealSoft,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: AppColors.navy, size: 20),
          ),
          const SizedBox(width: AppSpacing.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                const SizedBox(height: AppSpacing.space1),
                Text(
                  content,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 18 / 13,
                    color: AppColors.textSecondary,
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

