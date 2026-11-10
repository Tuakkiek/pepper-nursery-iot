import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';
import '../widgets/pagination_controls.dart';
import '../widgets/reading_filter_dialog.dart';

class ReadingDetailsScreen extends StatefulWidget {
  final ApiService apiService;
  final ReadingFieldFilter initialField;
  final ReadingFilterCriteria? initialCriteria;

  const ReadingDetailsScreen({
    super.key,
    required this.apiService,
    this.initialField = ReadingFieldFilter.all,
    this.initialCriteria,
  });

  @override
  State<ReadingDetailsScreen> createState() => _ReadingDetailsScreenState();
}

class _ReadingDetailsScreenState extends State<ReadingDetailsScreen> {
  late ReadingFilterCriteria _criteria;
  int _currentPage = 1;
  static const int _pageSize = 10;

  bool _isLoading = false;
  String? _errorMessage;
  RangeReadingsResponse? _response;

  @override
  void initState() {
    super.initState();
    _criteria = widget.initialCriteria ??
        ReadingFilterCriteria.initialForMode(
          widget.apiService.mode,
          initialField: widget.initialField,
        );
    _loadRangeReadings();
  }

  Future<void> _openFilterPopup() async {
    final updated = await showReadingFilterPopup(
      context,
      apiService: widget.apiService,
      initialCriteria: _criteria,
      confirmLabel: 'Áp dụng lọc',
    );
    if (updated == null || !mounted) return;
    setState(() {
      _criteria = updated;
      _currentPage = 1;
    });
    _loadRangeReadings(page: 1);
  }

  Future<void> _loadRangeReadings({int? page}) async {
    final targetPage = page ?? _currentPage;
    final startLocal = _criteria.startLocal;
    final endLocal = _criteria.endLocal;

    if (startLocal.isAfter(endLocal)) {
      setState(() {
        _errorMessage = 'Thời điểm bắt đầu phải nhỏ hơn hoặc bằng thời điểm kết thúc.';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _currentPage = targetPage;
    });

    try {
      final result = await widget.apiService.fetchRangeReadings(
        startLocal: startLocal,
        endLocal: endLocal,
        order: _criteria.order,
        page: targetPage,
        pageSize: _pageSize,
      );
      if (!mounted) return;
      setState(() {
        _response = result;
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

  String _formatDate(DateTime dt) => DateFormat('dd/MM/yyyy').format(dt);

  String _formatTimeOfDay(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  String _formatFullTime(DateTime? dt) {
    if (dt == null) return '—';
    return DateFormat('HH:mm:ss dd/MM/yyyy').format(dt.toLocal());
  }

  double? _extractFilterValue(ReadingData r) {
    switch (_criteria.fieldFilter) {
      case ReadingFieldFilter.all:
        return null;
      case ReadingFieldFilter.airTemp:
        return r.airTemperatureC;
      case ReadingFieldFilter.airHumidity:
        return r.airHumidityPct;
      case ReadingFieldFilter.soilTemp:
        return r.soilTemperatureC;
      case ReadingFieldFilter.soilMoisture:
        return r.soilMoisturePct;
      case ReadingFieldFilter.tds:
        return r.waterTdsPpm;
      case ReadingFieldFilter.ph:
        return r.waterPh;
    }
  }

  ({double min, double max, double avg, int count})? _computeStats(
    List<HistoryItem> items,
  ) {
    if (_criteria.fieldFilter == ReadingFieldFilter.all) return null;
    final values = items
        .map((e) => _extractFilterValue(e.reading))
        .whereType<double>()
        .toList();
    if (values.isEmpty) return null;
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final avgVal = values.reduce((a, b) => a + b) / values.length;
    return (min: minVal, max: maxVal, avg: avgVal, count: values.length);
  }

  @override
  Widget build(BuildContext context) {
    final readings = _response?.readings ?? const <HistoryItem>[];
    final stats = _computeStats(readings);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi Tiết Số Đo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_alt_outlined),
            tooltip: 'Chọn bộ lọc',
            onPressed: _openFilterPopup,
          ),
          IconButton(
            icon: Icon(
              _criteria.order == 'desc' ? Icons.arrow_downward : Icons.arrow_upward,
            ),
            tooltip: _criteria.order == 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước',
            onPressed: _isLoading
                ? null
                : () {
                    setState(() {
                      _criteria = _criteria.copyWith(
                        order: _criteria.order == 'desc' ? 'asc' : 'desc',
                      );
                    });
                    _loadRangeReadings(page: 1);
                  },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Tải lại',
            onPressed: _isLoading ? null : () => _loadRangeReadings(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadRangeReadings(),
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.space4),
          children: [
            _buildActiveFilterCard(),
            const SizedBox(height: AppSpacing.space3),
            _buildFieldFilterChips(),
            const SizedBox(height: AppSpacing.space4),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40.0),
                  child: CircularProgressIndicator(color: AppColors.navy),
                ),
              )
            else if (_errorMessage != null)
              _buildErrorCard(_errorMessage!)
            else ...[
              _buildSummaryCard(stats),
              const SizedBox(height: AppSpacing.space3),
              if (readings.isEmpty)
                _buildEmptyCard()
              else ...[
                ...readings.map(_buildDetailedReadingCard),
                if ((_response?.totalPages ?? 1) > 1) ...[
                  const SizedBox(height: AppSpacing.space2),
                  PaginationControls(
                    currentPage: _response?.page ?? _currentPage,
                    totalPages: _response?.totalPages ?? 1,
                    isLoading: _isLoading,
                    onPageChanged: (page) => _loadRangeReadings(page: page),
                  ),
                ],
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActiveFilterCard() {
    final startStr =
        '${_formatDate(_criteria.startDate)} ${_formatTimeOfDay(_criteria.startTime)}';
    final endStr =
        '${_formatDate(_criteria.endDate)} ${_formatTimeOfDay(_criteria.endTime)}';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.date_range_outlined, size: 20, color: AppColors.navy),
          const SizedBox(width: AppSpacing.space2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trạm ${widget.apiService.deviceId} • '
                  '${_criteria.order == 'desc' ? 'Mới nhất trước' : 'Cũ nhất trước'}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$startStr → $endStr',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.space2),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 38),
              padding: const EdgeInsets.symmetric(horizontal: 10),
            ),
            icon: const Icon(Icons.tune, size: 16),
            onPressed: _openFilterPopup,
            label: const Text('Đổi bộ lọc', style: TextStyle(fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildFieldFilterChips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Lọc theo trường dữ liệu:',
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
          children: ReadingFieldFilter.values.map((filter) {
            final selected = _criteria.fieldFilter == filter;
            final label = filter.unit.isNotEmpty
                ? '${filter.label} (${filter.unit})'
                : filter.label;
            return ChoiceChip(
              label: Text(label),
              selected: selected,
              selectedColor: AppColors.tealSoft,
              backgroundColor: AppColors.surface,
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: selected ? AppColors.navy : AppColors.textSecondary,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.control),
                side: BorderSide(
                  color: selected ? AppColors.teal : AppColors.border,
                ),
              ),
              onSelected: (isSelected) {
                if (isSelected) {
                  setState(() {
                    _criteria = _criteria.copyWith(fieldFilter: filter);
                  });
                }
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(
    ({double min, double max, double avg, int count})? stats,
  ) {
    final total = _response?.total ?? 0;
    final page = _response?.page ?? 1;
    final totalPages = _response?.totalPages ?? 1;
    final fieldFilter = _criteria.fieldFilter;
    final decimals = (fieldFilter == ReadingFieldFilter.soilTemp ||
            fieldFilter == ReadingFieldFilter.ph)
        ? 2
        : 1;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.tealSoft,
        borderRadius: BorderRadius.circular(AppRadius.control),
        border: Border.all(color: AppColors.teal),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tìm thấy $total bản ghi phù hợp',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              Text(
                'Trang $page / $totalPages',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          if (stats != null) ...[
            const SizedBox(height: AppSpacing.space2),
            Text(
              '${fieldFilter.label} (${stats.count} mẫu hợp lệ trang này): '
              'Min ${stats.min.toStringAsFixed(decimals)} • '
              'TB ${stats.avg.toStringAsFixed(decimals)} • '
              'Max ${stats.max.toStringAsFixed(decimals)} ${fieldFilter.unit}',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.navy,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailedReadingCard(HistoryItem item) {
    final r = item.reading;
    final s = r.sensorStatus;

    final allRows = <_FieldDetailRowData>[
      _FieldDetailRowData(
        filter: ReadingFieldFilter.airTemp,
        title: 'Nhiệt độ không khí',
        sensorName: 'DHT22',
        status: s.dht22,
        formattedValue: r.airTemperatureC != null
            ? '${r.airTemperatureC!.toStringAsFixed(1)} °C'
            : '—',
      ),
      _FieldDetailRowData(
        filter: ReadingFieldFilter.airHumidity,
        title: 'Độ ẩm không khí',
        sensorName: 'DHT22',
        status: s.dht22,
        formattedValue: r.airHumidityPct != null
            ? '${r.airHumidityPct!.toStringAsFixed(1)} %'
            : '—',
      ),
      _FieldDetailRowData(
        filter: ReadingFieldFilter.soilTemp,
        title: 'Nhiệt độ đất',
        sensorName: 'DS18B20',
        status: s.ds18b20,
        formattedValue: r.soilTemperatureC != null
            ? '${r.soilTemperatureC!.toStringAsFixed(2)} °C'
            : '—',
      ),
      _buildSensorRow(
        filter: ReadingFieldFilter.soilMoisture,
        title: 'Độ ẩm đất',
        sensorName: 'HD-38',
        status: s.hd38,
        value: r.soilMoisturePct,
        decimals: 1,
        unit: '%',
        rawAdc: r.soilMoistureRaw,
      ),
      _buildSensorRow(
        filter: ReadingFieldFilter.tds,
        title: 'TDS mẫu nước',
        sensorName: 'TDS V1.0',
        status: s.tds,
        value: r.waterTdsPpm,
        decimals: 1,
        unit: 'ppm',
        rawAdc: r.waterTdsAdcRaw,
      ),
      _buildSensorRow(
        filter: ReadingFieldFilter.ph,
        title: 'pH mẫu nước',
        sensorName: 'PH-4502C',
        status: s.ph4502c,
        value: r.waterPh,
        decimals: 2,
        unit: 'pH',
        rawAdc: r.waterPhAdcRaw,
      ),
    ];

    final visibleRows = _criteria.fieldFilter == ReadingFieldFilter.all
        ? allRows
        : allRows.where((row) => row.filter == _criteria.fieldFilter).toList();

    final primaryTime = 'Đo lúc: ${_formatFullTime(r.recordedAt ?? item.receivedAt)}';

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
              const Icon(Icons.schedule, size: 16, color: AppColors.navy),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Text(
                  primaryTime,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const Divider(height: 18, color: AppColors.border),
          ...visibleRows.map(_buildFieldRow),
        ],
      ),
    );
  }

  _FieldDetailRowData _buildSensorRow({
    required ReadingFieldFilter filter,
    required String title,
    required String sensorName,
    required String status,
    required double? value,
    required int decimals,
    required String unit,
    int? rawAdc,
  }) {
    final isUncalibrated = status == 'not_calibrated';
    final formattedValue = isUncalibrated
        ? (rawAdc != null ? 'ADC: $rawAdc' : '—')
        : (value != null ? '${value.toStringAsFixed(decimals)} $unit' : '—');
    final rawText = isUncalibrated
        ? 'Số đọc thô ADC'
        : (rawAdc != null ? 'ADC thô: $rawAdc' : null);

    return _FieldDetailRowData(
      filter: filter,
      title: title,
      sensorName: sensorName,
      status: status,
      formattedValue: formattedValue,
      rawValueText: rawText,
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'ok':
        return 'Bình thường';
      case 'not_calibrated':
        return 'Chưa hiệu chuẩn';
      case 'read_error':
        return 'Lỗi cảm biến';
      case 'out_of_range':
        return 'Ngoài ngưỡng';
      default:
        return 'Không xác định';
    }
  }

  Widget _buildFieldRow(_FieldDetailRowData row) {
    final isOk = row.status == 'ok';
    final isUncalibrated = row.status == 'not_calibrated';
    final badgeBg = isOk
        ? AppColors.tealSoft
        : (isUncalibrated ? AppColors.cream : AppColors.coralSoft);
    final badgeFg = isOk
        ? AppColors.navy
        : (isUncalibrated ? AppColors.textSecondary : AppColors.coralStrong);

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.space2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 5,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  row.title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.navy,
                  ),
                ),
                Text(
                  row.rawValueText != null
                      ? 'Cảm biến ${row.sensorName} • ${row.rawValueText}'
                      : 'Cảm biến ${row.sensorName}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.space2),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                row.formattedValue,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: isOk ? AppColors.navy : AppColors.textSecondary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
              const SizedBox(height: 2),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _statusLabel(row.status),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: badgeFg,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard(String message) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.coralSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.coral),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: AppColors.coralStrong, size: 32),
          const SizedBox(height: AppSpacing.space2),
          Text(
            message,
            style: const TextStyle(color: AppColors.coralStrong, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.space3),
          ElevatedButton(
            onPressed: () => _loadRangeReadings(),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyCard() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space6),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          const Icon(Icons.search_off, size: 40, color: AppColors.textSecondary),
          const SizedBox(height: AppSpacing.space2),
          const Text(
            'Không có bản ghi nào trong khoảng thời gian đã chọn',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.navy,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          const Text(
            'Hãy bấm "Đổi bộ lọc" để mở rộng ngày bắt đầu, ngày kết thúc hoặc mốc giờ.',
            style: AppTypography.caption,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: AppSpacing.space3),
          OutlinedButton.icon(
            icon: const Icon(Icons.tune, size: 18),
            onPressed: _openFilterPopup,
            label: const Text('Đổi bộ lọc'),
          ),
        ],
      ),
    );
  }
}

class _FieldDetailRowData {
  final ReadingFieldFilter filter;
  final String title;
  final String sensorName;
  final String status;
  final String formattedValue;
  final String? rawValueText;

  const _FieldDetailRowData({
    required this.filter,
    required this.title,
    required this.sensorName,
    required this.status,
    required this.formattedValue,
    this.rawValueText,
  });
}
