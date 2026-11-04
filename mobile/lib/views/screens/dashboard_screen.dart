import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';
import '../widgets/metric_card.dart';

class DashboardScreen extends StatefulWidget {
  final ApiService apiService;

  const DashboardScreen({super.key, required this.apiService});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final String deviceId = 'esp32-nursery-01';
  LatestReadingResponse? _latestData;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await widget.apiService.fetchLatestReading(deviceId);
      setState(() {
        _latestData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _formatTime(DateTime? dt) {
    if (dt == null) return '—';
    return DateFormat('HH:mm:ss dd/MM/yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vườn Ươm Ớt Con'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới',
            onPressed: _isLoading ? null : _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Thanh chuyển đổi dữ liệu thử nghiệm (Fixture Demo cho Phase 1)
            _buildFixtureSelector(),
            const SizedBox(height: 16),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32.0),
                  child: CircularProgressIndicator(color: AppColors.navy),
                ),
              )
            else if (_errorMessage != null)
              _buildErrorBanner(_errorMessage!)
            else if (_latestData != null)
              _buildDashboardContent(_latestData!)
            else
              const Center(child: Text('Chưa có dữ liệu')),
          ],
        ),
      ),
    );
  }

  Widget _buildFixtureSelector() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Kịch bản thử nghiệm (Phase 1 Fixtures):',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 6),
          DropdownButton<FixtureScenario>(
            value: widget.apiService.currentScenario,
            isExpanded: true,
            underline: const SizedBox(),
            items: FixtureScenario.values.map((scenario) {
              return DropdownMenuItem(
                value: scenario,
                child: Text(
                  scenario.label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.navy,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }).toList(),
            onChanged: (scenario) {
              if (scenario != null) {
                setState(() {
                  widget.apiService.currentScenario = scenario;
                });
                _loadData();
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.coralSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.coral),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: AppColors.coralStrong, size: 36),
          const SizedBox(height: 8),
          const Text(
            'Không tải được dữ liệu',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.coralStrong,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.navy),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.navy,
              foregroundColor: Colors.white,
            ),
            onPressed: _loadData,
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardContent(LatestReadingResponse data) {
    final reading = data.reading;
    final isStale = data.isStale == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Thông tin thiết bị & Cảnh báo cũ
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isStale ? AppColors.coralSoft : AppColors.tealSoft,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isStale ? AppColors.coral : AppColors.teal,
            ),
          ),
          child: Row(
            children: [
              Icon(
                isStale ? Icons.warning_amber_rounded : Icons.sensors,
                color: isStale ? AppColors.coralStrong : AppColors.navy,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thiết bị: ${data.deviceId}',
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: AppColors.navy,
                      ),
                    ),
                    Text(
                      isStale
                          ? 'Dữ liệu cũ • Cập nhật cuối: ${_formatTime(data.receivedAt)}'
                          : 'Đang cập nhật • Nhận lúc: ${_formatTime(data.receivedAt)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: isStale ? AppColors.coralStrong : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        if (reading == null)
          Container(
            padding: const EdgeInsets.all(24),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: const Text(
              'Chưa có dữ liệu số đo cho thiết bị này',
              style: TextStyle(
                fontSize: 15,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          )
        else ...[
          const Text(
            'Số đo mới nhất',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(height: 12),

          // Lưới các thẻ số đo
          _buildMetricCards(reading),
          const SizedBox(height: 16),

          // Lời khuyên / Cảnh báo nếu có
          if (data.advice != null && data.advice!.isNotEmpty) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.tealSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.teal),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.eco, color: AppColors.navy),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Khuyến nghị chăm sóc',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.navy,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          data.advice!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.navy,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ],
    );
  }

  Widget _buildMetricCards(ReadingData reading) {
    final status = reading.sensorStatus;

    return Column(
      children: [
        // 1. Nhiệt độ không khí (DHT22)
        MetricCard(
          title: 'Nhiệt độ không khí',
          displayValue: reading.airTemperatureC?.toStringAsFixed(1),
          unit: '°C',
          state: status.dht22 == 'ok'
              ? MetricState.normal
              : MetricState.error,
          statusText: status.dht22 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.thermostat,
          subtitle: 'Cảm biến DHT22',
        ),
        const SizedBox(height: 10),

        // 2. Độ ẩm không khí (DHT22)
        MetricCard(
          title: 'Độ ẩm không khí',
          displayValue: reading.airHumidityPct?.toStringAsFixed(1),
          unit: '%',
          state: status.dht22 == 'ok'
              ? MetricState.normal
              : MetricState.error,
          statusText: status.dht22 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.water_drop,
          subtitle: 'Cảm biến DHT22',
        ),
        const SizedBox(height: 10),

        // 3. Nhiệt độ đất (DS18B20)
        MetricCard(
          title: 'Nhiệt độ đất',
          displayValue: reading.soilTemperatureC?.toStringAsFixed(1),
          unit: '°C',
          state: status.ds18b20 == 'ok'
              ? MetricState.normal
              : MetricState.error,
          statusText: status.ds18b20 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.terrain,
          subtitle: 'Cảm biến DS18B20',
        ),
        const SizedBox(height: 10),

        // 4. Độ ẩm đất (HD-38)
        _buildHd38Card(reading, status.hd38),
        const SizedBox(height: 10),

        // 5. TDS mẫu nước
        _buildTdsCard(reading, status.tds),
        const SizedBox(height: 10),

        // 6. pH mẫu nước
        _buildPhCard(reading, status.ph4502c),
      ],
    );
  }

  Widget _buildHd38Card(ReadingData reading, String status) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'Độ ẩm đất (HD-38)',
        displayValue: reading.soilMoistureRaw?.toString(),
        unit: '', // Không gắn % khi chưa hiệu chuẩn
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.grass,
        subtitle: 'Số đọc thô ADC',
      );
    }

    final isOk = status == 'ok';
    return MetricCard(
      title: 'Độ ẩm đất',
      displayValue: reading.soilMoisturePct?.toStringAsFixed(1),
      unit: '%',
      state: isOk ? MetricState.normal : MetricState.error,
      statusText: isOk ? 'Bình thường' : 'Lỗi cảm biến',
      icon: Icons.grass,
      subtitle: 'Cảm biến HD-38',
    );
  }

  Widget _buildTdsCard(ReadingData reading, String status) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'TDS mẫu nước/dung dịch',
        displayValue: reading.waterTdsAdcRaw?.toString(),
        unit: '', // Không gắn ppm khi chưa hiệu chuẩn
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.opacity,
        subtitle: 'Số đọc thô ADC',
      );
    }

    final isOk = status == 'ok';
    return MetricCard(
      title: 'TDS mẫu nước/dung dịch',
      displayValue: reading.waterTdsPpm?.toStringAsFixed(1),
      unit: 'ppm',
      state: isOk ? MetricState.normal : MetricState.error,
      statusText: isOk ? 'Bình thường' : 'Lỗi cảm biến',
      icon: Icons.opacity,
      subtitle: 'Cảm biến TDS Meter V1.0',
    );
  }

  Widget _buildPhCard(ReadingData reading, String status) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'pH mẫu nước/dung dịch',
        displayValue: reading.waterPhAdcRaw?.toString(),
        unit: '', // Không gắn pH khi chưa hiệu chuẩn
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.science,
        subtitle: 'Số đọc thô ADC',
      );
    }

    final isOk = status == 'ok';
    return MetricCard(
      title: 'pH mẫu nước/dung dịch',
      displayValue: reading.waterPh?.toStringAsFixed(1),
      unit: 'pH',
      state: isOk ? MetricState.normal : MetricState.error,
      statusText: isOk ? 'Bình thường' : 'Lỗi cảm biến',
      icon: Icons.science,
      subtitle: 'Cảm biến PH-4502C',
    );
  }
}
