import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';

class DeviceStatusCard extends StatelessWidget {
  final LatestReadingResponse? latestData;
  final String configuredDeviceId;
  final String? configuredDeviceName;
  final bool isFixtureMode;
  final bool isBridgeMode;
  final bool isBackendOnline;
  final bool autoRefreshEnabled;
  final int refreshIntervalSeconds;
  final String? syncError;
  final VoidCallback? onManageDevice;

  const DeviceStatusCard({
    super.key,
    required this.latestData,
    this.configuredDeviceId = '1',
    this.configuredDeviceName,
    required this.isFixtureMode,
    this.isBridgeMode = false,
    this.isBackendOnline = false,
    this.autoRefreshEnabled = true,
    this.refreshIntervalSeconds = 5,
    this.syncError,
    this.onManageDevice,
  });

  String _formatTime(DateTime? dt) {
    if (dt == null) return 'Chưa có';
    return DateFormat('HH:mm:ss dd/MM/yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final reading = latestData?.reading;
    final isStale = latestData?.isStale;
    final deviceId = configuredDeviceId.trim().isNotEmpty
        ? configuredDeviceId.trim()
        : ((latestData?.deviceId.isNotEmpty ?? false)
            ? latestData!.deviceId
            : '1');
    final preferredName = configuredDeviceName?.trim();
    final responseName = latestData?.deviceName?.trim();
    final rawName = (preferredName != null && preferredName.isNotEmpty)
        ? preferredName
        : (responseName ?? '');
    final displayDeviceTitle = (rawName.isNotEmpty && rawName != deviceId)
        ? rawName
        : 'Trạm $deviceId';

    Color cardBg;
    Color borderColor;
    Color iconColor;
    IconData statusIcon;
    String statusTitle;
    String statusSub;

    if (latestData == null) {
      cardBg = AppColors.cream;
      borderColor = AppColors.border;
      iconColor = AppColors.textSecondary;
      statusIcon = Icons.sensors_off_outlined;
      statusTitle = 'Chưa kết nối thiết bị';
      statusSub = 'Đang kiểm tra kết nối với $deviceId...';
    } else if (reading == null) {
      cardBg = AppColors.surface;
      borderColor = AppColors.border;
      iconColor = AppColors.textSecondary;
      statusIcon = Icons.help_outline;
      statusTitle = 'Thiết bị chưa có dữ liệu';
      statusSub = 'Chưa có bản ghi nào được gửi từ thiết bị';
    } else if (isStale == true) {
      cardBg = AppColors.coralSoft;
      borderColor = AppColors.coral;
      iconColor = AppColors.coralStrong;
      statusIcon = Icons.warning_amber_rounded;
      statusTitle = 'Dữ liệu cũ (Mất liên lạc > 5 phút)';
      statusSub = 'Lần cập nhật cuối: ${_formatTime(latestData?.receivedAt)}';
    } else if (isStale == null && reading.recordedAt == null) {
      cardBg = AppColors.tealSoft;
      borderColor = AppColors.teal;
      iconColor = AppColors.navy;
      statusIcon = Icons.access_time;
      statusTitle = 'Chưa xác định độ mới';
      statusSub = 'Đồng hồ ESP32 chưa tin cậy • Nhận: ${_formatTime(latestData?.receivedAt)}';
    } else {
      cardBg = AppColors.tealSoft;
      borderColor = AppColors.teal;
      iconColor = AppColors.navy;
      statusIcon = Icons.check_circle_outline;
      statusTitle = 'Đang cập nhật (Mới)';
      statusSub = 'Đo lúc: ${_formatTime(reading.recordedAt)} • Nhận: ${_formatTime(latestData?.receivedAt)}';
    }

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: borderColor, width: 1.2),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(statusIcon, color: iconColor, size: 24),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(
                          displayDeviceTitle,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.cream,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            'ID: $deviceId',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.navy,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            isFixtureMode
                                ? 'Dữ liệu mẫu'
                                : (isBridgeMode
                                    ? '● Sensor Bridge'
                                    : (isBackendOnline ? '● Backend Live' : '○ Mất kết nối API')),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: isFixtureMode
                                  ? AppColors.textSecondary
                                  : (isBridgeMode
                                      ? const Color(0xFF856404)
                                      : (isBackendOnline ? const Color(0xFF155724) : AppColors.coralStrong)),
                            ),
                          ),
                        ),
                        if (autoRefreshEnabled)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.tealSoft,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.autorenew, size: 10, color: AppColors.navy),
                                const SizedBox(width: 2),
                                Text(
                                  '${refreshIntervalSeconds}s',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.navy,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      statusTitle,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isStale == true ? AppColors.coralStrong : AppColors.navy,
                      ),
                    ),
                  ],
                ),
              ),
              if (onManageDevice != null) ...[
                const SizedBox(width: AppSpacing.space1),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.navy,
                    backgroundColor: AppColors.surface,
                    side: const BorderSide(color: AppColors.border),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    minimumSize: const Size(0, 34),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  icon: const Icon(Icons.developer_board, size: 16),
                  label: const Text(
                    'Thiết bị',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  onPressed: onManageDevice,
                ),
              ],
            ],
          ),
          const SizedBox(height: AppSpacing.space2),
          Text(
            statusSub,
            style: TextStyle(
              fontSize: 12,
              color: isStale == true ? AppColors.coralStrong : AppColors.textSecondary,
            ),
          ),
          if (syncError != null && syncError!.isNotEmpty && !isFixtureMode) ...[
            const SizedBox(height: AppSpacing.space1),
            Text(
              'Không thể làm mới từ server (đang giữ bản gần nhất): $syncError',
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.coralStrong,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
