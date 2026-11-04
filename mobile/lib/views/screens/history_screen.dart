import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';
import '../widgets/history_chart.dart';

enum MetricFilter {
  airTemp('Nhiệt độ khí', '°C'),
  airHumidity('Độ ẩm khí', '%'),
  soilTemp('Nhiệt độ đất', '°C'),
  soilMoisture('Độ ẩm đất', '%'),
  tds('TDS mẫu nước', 'ppm'),
  ph('pH mẫu nước', 'pH');

  final String label;
  final String unit;
  const MetricFilter(this.label, this.unit);
}

class HistoryScreen extends StatefulWidget {
  final ApiService apiService;

  const HistoryScreen({super.key, required this.apiService});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<HistoryItem> _history = [];
  bool _isLoading = false;
  String? _errorMessage;
  MetricFilter _selectedFilter = MetricFilter.airTemp;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.fetchHistory();
      if (!mounted) return;
      setState(() {
        _history = list;
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

  String _formatTime(DateTime? dt) {
    if (dt == null) return '—';
    return DateFormat('HH:mm:ss dd/MM').format(dt.toLocal());
  }

  List<ChartDataPoint> _getChartPoints() {
    // History trả về theo received_at giảm dần (mới nhất trước)
    // Để vẽ biểu đồ từ trái sang phải, ta đảo ngược danh sách theo thời gian tăng dần
    final chronological = _history.reversed.toList();

    return chronological.map((item) {
      final time = item.reading.recordedAt ?? item.receivedAt ?? DateTime.now();
      double? val;

      switch (_selectedFilter) {
        case MetricFilter.airTemp:
          val = item.reading.airTemperatureC;
          break;
        case MetricFilter.airHumidity:
          val = item.reading.airHumidityPct;
          break;
        case MetricFilter.soilTemp:
          val = item.reading.soilTemperatureC;
          break;
        case MetricFilter.soilMoisture:
          val = item.reading.soilMoisturePct;
          break;
        case MetricFilter.tds:
          val = item.reading.waterTdsPpm;
          break;
        case MetricFilter.ph:
          val = item.reading.waterPh;
          break;
      }

      return ChartDataPoint(
        time: time,
        value: val,
        label: _selectedFilter.label,
      );
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch Sử Số Đo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới',
            onPressed: _isLoading ? null : _loadHistory,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadHistory,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.space4),
          children: [
            // Bộ lọc chọn đại lượng biểu đồ
            const Text(
              'Chọn đại lượng xem biểu đồ:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: AppSpacing.space2),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: MetricFilter.values.map((filter) {
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text('${filter.label} (${filter.unit})'),
                      selected: isSelected,
                      selectedColor: AppColors.tealSoft,
                      backgroundColor: AppColors.surface,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? AppColors.navy : AppColors.textSecondary,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.control),
                        side: BorderSide(
                          color: isSelected ? AppColors.teal : AppColors.border,
                        ),
                      ),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedFilter = filter);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: AppSpacing.space4),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40.0),
                  child: CircularProgressIndicator(color: AppColors.navy),
                ),
              )
            else if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(AppSpacing.space4),
                decoration: BoxDecoration(
                  color: AppColors.coralSoft,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.coral),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.coralStrong, size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'Không tải được lịch sử: $_errorMessage',
                      style: const TextStyle(color: AppColors.coralStrong),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.navy,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: _loadHistory,
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              )
            else ...[
              // Biểu đồ cho đại lượng đã chọn
              HistoryChart(
                title: _selectedFilter.label,
                unit: _selectedFilter.unit,
                points: _getChartPoints(),
              ),
              const SizedBox(height: AppSpacing.space6),

              // Danh sách bản ghi gần đây
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Các bản ghi gần nhất',
                    style: AppTypography.sectionTitle,
                  ),
                  Text(
                    '${_history.length} bản ghi',
                    style: AppTypography.caption,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.space3),

              if (_history.isEmpty)
                Container(
                  padding: const EdgeInsets.all(AppSpacing.space6),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Text(
                    'Chưa có bản ghi lịch sử nào',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                )
              else
                ..._history.map((item) => _buildHistoryRow(item)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryRow(HistoryItem item) {
    final reading = item.reading;
    final recordedTime = reading.recordedAt != null
        ? 'Đo: ${_formatTime(reading.recordedAt)}'
        : 'Nhận: ${_formatTime(item.receivedAt)}';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.space3),
      padding: const EdgeInsets.all(AppSpacing.space4),
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
              Text(
                'Mẫu: ${reading.sampleId}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: AppColors.navy,
                ),
              ),
              Text(
                recordedTime,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const Divider(height: 16, color: AppColors.border),
          Wrap(
            spacing: 16,
            runSpacing: 8,
            children: [
              _metricChip('Khí', reading.airTemperatureC != null ? '${reading.airTemperatureC!.toStringAsFixed(1)}°C' : '—'),
              _metricChip('Ẩm khí', reading.airHumidityPct != null ? '${reading.airHumidityPct!.toStringAsFixed(1)}%' : '—'),
              _metricChip('Đất', reading.soilTemperatureC != null ? '${reading.soilTemperatureC!.toStringAsFixed(1)}°C' : '—'),
              _metricChip(
                'Ẩm đất',
                reading.soilMoisturePct != null
                    ? '${reading.soilMoisturePct!.toStringAsFixed(1)}%'
                    : (reading.soilMoistureRaw != null ? 'Raw: ${reading.soilMoistureRaw}' : '—'),
              ),
              _metricChip(
                'TDS',
                reading.waterTdsPpm != null
                    ? '${reading.waterTdsPpm!.toStringAsFixed(1)} ppm'
                    : (reading.waterTdsAdcRaw != null ? 'Raw: ${reading.waterTdsAdcRaw}' : '—'),
              ),
              _metricChip(
                'pH',
                reading.waterPh != null
                    ? '${reading.waterPh!.toStringAsFixed(1)} pH'
                    : (reading.waterPhAdcRaw != null ? 'Raw: ${reading.waterPhAdcRaw}' : '—'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricChip(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppColors.navy,
          ),
        ),
      ],
    );
  }
}
