import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';
import '../widgets/care_advice_card.dart';
import '../widgets/device_status_card.dart';
import '../widgets/metric_card.dart';
import 'settings_sheet.dart';

class DashboardScreen extends StatefulWidget {
  final ApiService apiService;

  const DashboardScreen({super.key, required this.apiService});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  LatestReadingResponse? _latestData;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final data = await widget.apiService.fetchLatestReading();
      if (!mounted) return;
      setState(() {
        _latestData = data;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  void _openSettings() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => SettingsSheet(apiService: widget.apiService),
    );
  }

  String _formatTime(DateTime? dt) {
    if (dt == null) return '—';
    return DateFormat('HH:mm:ss dd/MM/yyyy').format(dt.toLocal());
  }

  @override
  Widget build(BuildContext context) {
    final isFixture = widget.apiService.mode == DataSourceMode.fixture;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Vườn Ươm Ớt Con'),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            tooltip: 'Cài đặt kết nối backend',
            onPressed: _openSettings,
          ),
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
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.space4,
            vertical: AppSpacing.space3,
          ),
          children: [
            // Thanh chuyển kịch bản nhanh cho Phase 1 (khi ở chế độ Fixture)
            if (isFixture) ...[
              _buildQuickScenarioSelector(),
              const SizedBox(height: AppSpacing.space3),
            ],

            // Thẻ trạng thái thiết bị & độ mới dữ liệu
            DeviceStatusCard(
              latestData: _latestData,
              isFixtureMode: isFixture,
              isBackendOnline: widget.apiService.isBackendOnline,
              onConfigure: _openSettings,
            ),
            const SizedBox(height: AppSpacing.space3),

            // Thẻ nhận định & khuyến nghị chăm sóc
            CareAdviceCard(latestData: _latestData),
            const SizedBox(height: AppSpacing.space4),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40.0),
                  child: CircularProgressIndicator(color: AppColors.navy),
                ),
              )
            else if (_errorMessage != null)
              _buildErrorBanner(_errorMessage!)
            else if (_latestData?.reading != null)
              _buildMetricsList(_latestData!.reading!)
            else
              _buildEmptyState(),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickScenarioSelector() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Kịch bản kiểm thử G0 (Phase 1):',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.tealSoft,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Fixture G0',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space1),
          DropdownButtonHideUnderline(
            child: DropdownButton<FixtureScenario>(
              value: widget.apiService.currentScenario,
              isExpanded: true,
              icon: const Icon(Icons.arrow_drop_down, color: AppColors.navy),
              items: FixtureScenario.values.map((s) {
                return DropdownMenuItem(
                  value: s,
                  child: Text(
                    s.label,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.navy,
                    ),
                  ),
                );
              }).toList(),
              onChanged: (scenario) {
                if (scenario != null) {
                  widget.apiService.currentScenario = scenario;
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    final isLive = widget.apiService.mode == DataSourceMode.live;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.space6),
      decoration: BoxDecoration(
        color: AppColors.coralSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.coral, width: 1.5),
      ),
      child: Column(
        children: [
          const Icon(Icons.cloud_off, color: AppColors.coralStrong, size: 40),
          const SizedBox(height: AppSpacing.space2),
          const Text(
            'Không tải được dữ liệu',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.coralStrong,
            ),
          ),
          const SizedBox(height: AppSpacing.space1),
          Text(
            isLive
                ? 'Không thể kết nối đến Backend tại ${widget.apiService.baseUrl}\n($message)'
                : message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.navy),
          ),
          const SizedBox(height: AppSpacing.space4),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.navy,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(110, 42),
                ),
                onPressed: _loadData,
                child: const Text('Thử lại'),
              ),
              if (isLive) ...[
                OutlinedButton(
                  style: OutlinedButton.styleFrom(minimumSize: const Size(110, 42)),
                  onPressed: () {
                    widget.apiService.mode = DataSourceMode.fixture;
                  },
                  child: const Text('Dùng dữ liệu mẫu (G0)'),
                ),
                OutlinedButton(
                  style: OutlinedButton.styleFrom(minimumSize: const Size(110, 42)),
                  onPressed: _openSettings,
                  child: const Text('Đổi IP Backend'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space8),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(Icons.inbox_outlined, size: 48, color: AppColors.textSecondary),
          const SizedBox(height: AppSpacing.space3),
          const Text(
            'Chưa có dữ liệu số đo',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(height: AppSpacing.space1),
          Text(
            'Thiết bị ${widget.apiService.deviceId} chưa gửi bản ghi nào hoặc chưa kết nối.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: AppSpacing.space4),
          OutlinedButton(
            onPressed: _loadData,
            child: const Text('Kiểm tra lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsList(ReadingData reading) {
    final status = reading.sensorStatus;
    final recordedAtStr = reading.recordedAt != null
        ? 'Thời điểm đo: ${_formatTime(reading.recordedAt)}'
        : 'Thời điểm server nhận: ${_formatTime(_latestData?.receivedAt)}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Môi trường không khí & đất',
          style: AppTypography.sectionTitle,
        ),
        const SizedBox(height: AppSpacing.space2),

        // 1. Nhiệt độ không khí (DHT22)
        MetricCard(
          title: 'Nhiệt độ không khí',
          displayValue: reading.airTemperatureC?.toStringAsFixed(1),
          unit: '°C',
          state: status.dht22 == 'ok' ? MetricState.normal : MetricState.error,
          statusText: status.dht22 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.thermostat,
          subtitle: 'Cảm biến DHT22',
          timestamp: recordedAtStr,
        ),
        const SizedBox(height: AppSpacing.space3),

        // 2. Độ ẩm không khí (DHT22)
        MetricCard(
          title: 'Độ ẩm không khí',
          displayValue: reading.airHumidityPct?.toStringAsFixed(1),
          unit: '%',
          state: status.dht22 == 'ok' ? MetricState.normal : MetricState.error,
          statusText: status.dht22 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.water_drop,
          subtitle: 'Cảm biến DHT22',
          timestamp: recordedAtStr,
        ),
        const SizedBox(height: AppSpacing.space3),

        // 3. Nhiệt độ đất (DS18B20)
        MetricCard(
          title: 'Nhiệt độ đất',
          displayValue: reading.soilTemperatureC?.toStringAsFixed(1),
          unit: '°C',
          state: status.ds18b20 == 'ok' ? MetricState.normal : MetricState.error,
          statusText: status.ds18b20 == 'ok' ? 'Bình thường' : 'Lỗi cảm biến',
          icon: Icons.terrain,
          subtitle: 'Cảm biến DS18B20',
          timestamp: recordedAtStr,
        ),
        const SizedBox(height: AppSpacing.space3),

        // 4. Độ ẩm đất (HD-38)
        _buildHd38MetricCard(reading, status.hd38, recordedAtStr),
        const SizedBox(height: AppSpacing.space6),

        const Text(
          'Dung dịch & nước tưới mẫu',
          style: AppTypography.sectionTitle,
        ),
        const SizedBox(height: AppSpacing.space2),

        // 5. TDS mẫu nước
        _buildTdsMetricCard(reading, status.tds, recordedAtStr),
        const SizedBox(height: AppSpacing.space3),

        // 6. pH mẫu nước
        _buildPhMetricCard(reading, status.ph4502c, recordedAtStr),
        const SizedBox(height: AppSpacing.space6),
      ],
    );
  }

  Widget _buildHd38MetricCard(ReadingData reading, String status, String timestamp) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'Độ ẩm đất (HD-38)',
        displayValue: reading.soilMoistureRaw?.toString(),
        unit: '', // Tuyệt đối không gắn % khi chưa hiệu chuẩn theo hợp đồng G0
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.grass,
        subtitle: 'Số đọc thô ADC',
        timestamp: timestamp,
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
      timestamp: timestamp,
    );
  }

  Widget _buildTdsMetricCard(ReadingData reading, String status, String timestamp) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'TDS mẫu nước / dung dịch',
        displayValue: reading.waterTdsAdcRaw?.toString(),
        unit: '', // Tuyệt đối không gắn ppm khi chưa hiệu chuẩn
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.opacity,
        subtitle: 'Số đọc thô ADC',
        timestamp: timestamp,
      );
    }

    final isOk = status == 'ok';
    return MetricCard(
      title: 'TDS mẫu nước / dung dịch',
      displayValue: reading.waterTdsPpm?.toStringAsFixed(1),
      unit: 'ppm',
      state: isOk ? MetricState.normal : MetricState.error,
      statusText: isOk ? 'Bình thường' : 'Lỗi cảm biến',
      icon: Icons.opacity,
      subtitle: 'Cảm biến TDS Meter V1.0',
      timestamp: timestamp,
    );
  }

  Widget _buildPhMetricCard(ReadingData reading, String status, String timestamp) {
    if (status == 'not_calibrated') {
      return MetricCard(
        title: 'pH mẫu nước / dung dịch',
        displayValue: reading.waterPhAdcRaw?.toString(),
        unit: '', // Tuyệt đối không gắn pH khi chưa hiệu chuẩn
        state: MetricState.uncalibrated,
        statusText: 'Chưa hiệu chuẩn',
        icon: Icons.science,
        subtitle: 'Số đọc thô ADC',
        timestamp: timestamp,
      );
    }

    final isOk = status == 'ok';
    return MetricCard(
      title: 'pH mẫu nước / dung dịch',
      displayValue: reading.waterPh?.toStringAsFixed(1),
      unit: 'pH',
      state: isOk ? MetricState.normal : MetricState.error,
      statusText: isOk ? 'Bình thường' : 'Lỗi cảm biến',
      icon: Icons.science,
      subtitle: 'Cảm biến PH-4502C',
      timestamp: timestamp,
    );
  }
}
