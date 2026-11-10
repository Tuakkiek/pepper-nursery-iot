import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../controllers/app_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../widgets/care_advice_card.dart';
import '../widgets/feedback_card.dart';
import '../widgets/metric_card.dart';
import 'devices_screen.dart';

class DashboardScreen extends StatelessWidget {
  final AppController controller;
  final VoidCallback onManage;
  const DashboardScreen({
    super.key,
    required this.controller,
    required this.onManage,
  });

  Future<void> _select(BuildContext context, String? id) async {
    if (id == null) return;
    try {
      await controller.select(id);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  String _time(DateTime time) {
    final local = time.toLocal();
    final offset = local.timeZoneOffset;
    final hours = offset.inHours.abs().toString().padLeft(2, '0');
    final minutes = (offset.inMinutes.abs() % 60).toString().padLeft(2, '0');
    return '${DateFormat('HH:mm:ss · dd/MM/yyyy').format(local)} (UTC${offset.isNegative ? '-' : '+'}$hours:$minutes)';
  }

  @override
  Widget build(BuildContext context) {
    final c = controller, data = controller.latest;
    final reading = data?.reading;
    return RefreshIndicator(
      onRefresh: () async {
        await c.refreshDevices();
        await c.refreshReading();
      },
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          Text('Xin chào, ${c.user!.fullName}', style: AppTypography.caption),
          const SizedBox(height: 8),
          const Text('Theo dõi vườn ươm', style: AppTypography.pageTitle),
          const SizedBox(height: 24),
          if (c.loadingDevices || c.busy) const LinearProgressIndicator(),
          if (c.deviceError != null) ...[
            FeedbackCard(message: c.deviceError!, onRetry: c.refreshDevices),
            const SizedBox(height: 16),
          ],
          if (c.devices.isEmpty &&
              !c.loadingDevices &&
              c.deviceError == null) ...[
            const EmptyDevices(),
            ElevatedButton.icon(
              onPressed: c.busy ? null : () => showDeviceForm(context, c),
              icon: const Icon(Icons.add),
              label: const Text('Thêm thiết bị đầu tiên'),
            ),
          ],
          if (c.devices.isNotEmpty) ...[
            DropdownButtonFormField<String>(
              key: ValueKey(c.activeId),
              initialValue: c.activeId,
              isExpanded: true,
              decoration: const InputDecoration(labelText: 'Thiết bị đang xem'),
              items: c.devices
                  .map(
                    (d) => DropdownMenuItem(
                      value: d.id,
                      child: Text(
                        '${d.name} · ${d.id}',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: c.busy || c.loadingDevices
                  ? null
                  : (id) => _select(context, id),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: onManage,
                icon: const Icon(Icons.settings_outlined, size: 18),
                label: const Text('Quản lý thiết bị'),
              ),
            ),
            if (c.activeId == null)
              const FeedbackCard(
                message: 'Chọn một thiết bị để xem số đo.',
                isError: false,
              )
            else if (c.readingError != null)
              FeedbackCard(message: c.readingError!, onRetry: c.refreshReading)
            else if (data == null)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: CircularProgressIndicator(
                    semanticsLabel: 'Đang tải số đo',
                  ),
                ),
              )
            else ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: data.isStale == false
                      ? AppColors.tealSoft
                      : AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          reading == null ? Icons.sensors_off : Icons.schedule,
                          color: AppColors.navy,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            reading == null
                                ? 'Chưa có dữ liệu'
                                : data.isStale == true
                                ? 'Dữ liệu cũ'
                                : data.isStale == null
                                ? 'Chưa xác định độ mới'
                                : 'Đang cập nhật',
                            style: AppTypography.body,
                          ),
                        ),
                      ],
                    ),
                    if (reading?.recordedAt != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Đo lúc: ${_time(reading!.recordedAt!)}',
                        style: AppTypography.caption,
                      ),
                    ],
                    if (data.receivedAt != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        'Nhận lúc: ${_time(data.receivedAt!)}',
                        style: AppTypography.caption,
                      ),
                    ],
                    if (reading != null && reading.recordedAt == null) ...[
                      const SizedBox(height: 8),
                      const Text(
                        'Thiết bị chưa xác định thời điểm đo.',
                        style: AppTypography.caption,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (reading == null)
                const FeedbackCard(
                  message: 'Thiết bị đã được liên kết. Bật nguồn và kết nối Wi-Fi để bắt đầu nhận số đo.',
                  isError: false,
                )
              else ...[
                const Text('Số đo mới nhất', style: AppTypography.sectionTitle),
                const SizedBox(height: 12),
                ..._metrics(
                  reading,
                  data,
                ).expand((card) => [card, const SizedBox(height: 12)]),
                const SizedBox(height: 12),
                CareAdviceCard(latestData: data),
              ],
            ],
          ],
        ],
      ),
    );
  }

  List<Widget> _metrics(ReadingData reading, LatestReadingResponse data) {
    final status = reading.sensorStatus;
    final timestamp = reading.recordedAt != null
        ? 'Đo lúc: ${_time(reading.recordedAt!)}'
        : data.receivedAt != null
        ? 'Nhận lúc: ${_time(data.receivedAt!)}'
        : 'Chưa có thời điểm đo';
    Widget metric(
      String title,
      double? value,
      String unit,
      String sensor,
      IconData icon, {
      int? raw,
    }) {
      final uncalibrated = sensor == 'not_calibrated';
      final ok = sensor == 'ok';
      final missing = ok && value == null || sensor == 'unknown';
      return MetricCard(
        title: title,
        displayValue: uncalibrated
            ? raw?.toString()
            : ok
            ? value?.toStringAsFixed(1).replaceAll('.', ',')
            : null,
        unit: uncalibrated ? '' : unit,
        state: uncalibrated
            ? MetricState.uncalibrated
            : missing
            ? MetricState.missing
            : ok
            ? MetricState.normal
            : MetricState.error,
        statusText: uncalibrated
            ? 'Chưa hiệu chuẩn'
            : missing
            ? 'Chưa có dữ liệu'
            : !ok
            ? 'Lỗi cảm biến'
            : data.isStale == true
            ? 'Dữ liệu cũ'
            : data.isStale == null
            ? 'Chưa xác định độ mới'
            : 'Đang cập nhật',
        subtitle: uncalibrated ? 'Số đọc thô ADC' : null,
        icon: icon,
        timestamp: timestamp,
      );
    }

    return [
      metric(
        'Nhiệt độ không khí',
        reading.airTemperatureC,
        '°C',
        status.dht22,
        Icons.thermostat,
      ),
      metric(
        'Độ ẩm không khí',
        reading.airHumidityPct,
        '%',
        status.dht22,
        Icons.water_drop_outlined,
      ),
      metric(
        'Nhiệt độ đất',
        reading.soilTemperatureC,
        '°C',
        status.ds18b20,
        Icons.terrain_outlined,
      ),
      metric(
        'Độ ẩm đất',
        reading.soilMoisturePct,
        '%',
        status.hd38,
        Icons.grass,
        raw: reading.soilMoistureRaw,
      ),
      metric(
        'TDS nước tưới',
        reading.waterTdsPpm,
        'ppm',
        status.tds,
        Icons.opacity,
        raw: reading.waterTdsAdcRaw,
      ),
      metric(
        'pH nước tưới',
        reading.waterPh,
        '',
        status.ph4502c,
        Icons.science_outlined,
        raw: reading.waterPhAdcRaw,
      ),
    ];
  }
}
