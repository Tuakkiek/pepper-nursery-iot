import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';
import '../widgets/history_chart.dart';
import '../widgets/pagination_controls.dart';
import '../widgets/reading_filter_dialog.dart';

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
  static const int _pageSize = 10;
  List<HistoryItem> _history = [];
  bool _isLoading = false;
  String? _errorMessage;
  MetricFilter _selectedFilter = MetricFilter.airTemp;
  int _currentPage = 1;
  String? _lastSourceKey;
  String? _lastSampleId;

  @override
  void initState() {
    super.initState();
    _lastSourceKey = widget.apiService.sourceKey;
    _lastSampleId = widget.apiService.latestReading?.reading?.sampleId;
    _loadHistory();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    if (!mounted) return;
    final nextKey = widget.apiService.sourceKey;
    if (_lastSourceKey != null && nextKey != _lastSourceKey) {
      _lastSourceKey = nextKey;
      _lastSampleId = widget.apiService.latestReading?.reading?.sampleId;
      _loadHistory(clearPrevious: true);
      return;
    }
    _lastSourceKey = nextKey;

    final nextSampleId = widget.apiService.latestReading?.reading?.sampleId;
    final topSampleId = _history.isNotEmpty ? _history.first.reading.sampleId : null;
    if (nextSampleId != null &&
        nextSampleId != _lastSampleId &&
        nextSampleId != topSampleId) {
      _lastSampleId = nextSampleId;
      _loadHistory(isBackground: true);
    }
  }

  Future<void> _loadHistory({
    bool isBackground = false,
    bool clearPrevious = false,
  }) async {
    if (!mounted) return;
    if (!isBackground || _history.isEmpty) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        if (clearPrevious) {
          _history = [];
          _currentPage = 1;
        }
      });
    }

    try {
      final list = await widget.apiService.fetchHistory();
      if (!mounted) return;
      final maxPage = list.isEmpty ? 1 : ((list.length + _pageSize - 1) ~/ _pageSize);
      setState(() {
        _history = list;
        if (_currentPage > maxPage) _currentPage = maxPage;
        _isLoading = false;
        _errorMessage = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        if (!isBackground || _history.isEmpty) {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
        }
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

  void _openReadingDetails() {
    openReadingDetailsWithFilterPopup(context, widget.apiService);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch Sử Số Đo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.manage_search),
            tooltip: 'Chi tiết & Lọc thời gian',
            onPressed: _openReadingDetails,
          ),
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
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(double.infinity, 46),
                backgroundColor: AppColors.surface,
              ),
              icon: const Icon(Icons.date_range_outlined, size: 20),
              onPressed: _openReadingDetails,
              label: const Text('Xem chi tiết & lọc theo ngày, mốc giờ'),
            ),
            const SizedBox(height: AppSpacing.space4),

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
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: MetricFilter.values.map((filter) {
                final isSelected = _selectedFilter == filter;
                return ChoiceChip(
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
                );
              }).toList(),
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
                decimals: (_selectedFilter == MetricFilter.soilTemp ||
                        _selectedFilter == MetricFilter.ph)
                    ? 2
                    : 1,
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
              else ...[
                ..._getPagedHistory().map((item) => _buildHistoryRow(item)),
                if (_totalHistoryPages > 1) ...[
                  const SizedBox(height: AppSpacing.space2),
                  PaginationControls(
                    currentPage: _currentPage,
                    totalPages: _totalHistoryPages,
                    isLoading: _isLoading,
                    onPageChanged: (page) => setState(() => _currentPage = page),
                  ),
                ],
              ],
            ],
          ],
        ),
      ),
    );
  }

  int get _totalHistoryPages =>
      _history.isEmpty ? 1 : ((_history.length + _pageSize - 1) ~/ _pageSize);

  List<HistoryItem> _getPagedHistory() {
    if (_history.isEmpty) return const [];
    final start = (_currentPage - 1) * _pageSize;
    if (start >= _history.length) return const [];
    final end = (start + _pageSize).clamp(0, _history.length);
    return _history.sublist(start, end);
  }

  Widget _buildHistoryRow(HistoryItem item) {
    final reading = item.reading;
    final status = reading.sensorStatus;
    final primaryTime = 'Đo lúc: ${_formatTime(reading.recordedAt ?? item.receivedAt)}';

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
            children: [
              const Icon(Icons.schedule, size: 15, color: AppColors.navy),
              const SizedBox(width: AppSpacing.space1),
              Expanded(
                child: Text(
                  primaryTime,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                    color: AppColors.navy,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const Divider(height: 16, color: AppColors.border),
          Row(
            children: [
              Expanded(
                child: _metricChip(
                  'Nhiệt độ KK',
                  reading.airTemperatureC != null
                      ? '${reading.airTemperatureC!.toStringAsFixed(1)} °C'
                      : '—',
                ),
              ),
              Expanded(
                child: _metricChip(
                  'Độ ẩm KK',
                  reading.airHumidityPct != null
                      ? '${reading.airHumidityPct!.toStringAsFixed(1)} %'
                      : '—',
                ),
              ),
              Expanded(
                child: _metricChip(
                  'Nhiệt độ đất',
                  reading.soilTemperatureC != null
                      ? '${reading.soilTemperatureC!.toStringAsFixed(2)} °C'
                      : '—',
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space2),
          Row(
            children: [
              Expanded(
                child: _metricChip(
                  'Độ ẩm đất',
                  status.isHd38NotCalibrated
                      ? (reading.soilMoistureRaw != null
                          ? 'ADC: ${reading.soilMoistureRaw}'
                          : 'Chưa HC')
                      : (reading.soilMoisturePct != null
                          ? '${reading.soilMoisturePct!.toStringAsFixed(1)} %'
                          : '—'),
                ),
              ),
              Expanded(
                child: _metricChip(
                  'TDS nước',
                  status.isTdsNotCalibrated
                      ? (reading.waterTdsAdcRaw != null
                          ? 'ADC: ${reading.waterTdsAdcRaw}'
                          : 'Chưa HC')
                      : (reading.waterTdsPpm != null
                          ? '${reading.waterTdsPpm!.toStringAsFixed(1)} ppm'
                          : '—'),
                ),
              ),
              Expanded(
                child: _metricChip(
                  'pH nước',
                  status.isPhNotCalibrated
                      ? (reading.waterPhAdcRaw != null
                          ? 'ADC: ${reading.waterPhAdcRaw}'
                          : 'Chưa HC')
                      : (reading.waterPh != null
                          ? '${reading.waterPh!.toStringAsFixed(2)} pH'
                          : '—'),
                ),
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
            fontFeatures: [FontFeature.tabularFigures()],
          ),
        ),
      ],
    );
  }
}
