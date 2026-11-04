import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';

class HistoryScreen extends StatefulWidget {
  final ApiService apiService;

  const HistoryScreen({super.key, required this.apiService});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final String deviceId = 'esp32-nursery-01';
  List<ReadingData> _history = [];
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.fetchHistory(deviceId);
      setState(() {
        _history = list;
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
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.navy),
              )
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Text(
                        'Không tải được lịch sử: $_errorMessage',
                        style: const TextStyle(color: AppColors.coralStrong),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  )
                : _history.isEmpty
                    ? const Center(
                        child: Text(
                          'Chưa có bản ghi lịch sử nào',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _history.length,
                        separatorBuilder: (context, index) =>
                            const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = _history[index];
                          return _buildHistoryItem(item);
                        },
                      ),
      ),
    );
  }

  Widget _buildHistoryItem(ReadingData item) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Mẫu: ${item.sampleId}',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 14,
                  color: AppColors.navy,
                ),
              ),
              Text(
                _formatTime(item.recordedAt),
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
              _metricText('Khí', item.airTemperatureC != null ? '${item.airTemperatureC!.toStringAsFixed(1)}°C' : '—'),
              _metricText('Ẩm khí', item.airHumidityPct != null ? '${item.airHumidityPct!.toStringAsFixed(1)}%' : '—'),
              _metricText('Đất', item.soilTemperatureC != null ? '${item.soilTemperatureC!.toStringAsFixed(1)}°C' : '—'),
              _metricText('Ẩm đất', item.soilMoisturePct != null ? '${item.soilMoisturePct!.toStringAsFixed(1)}%' : (item.soilMoistureRaw != null ? 'Raw: ${item.soilMoistureRaw}' : '—')),
              _metricText('TDS', item.waterTdsPpm != null ? '${item.waterTdsPpm!.toStringAsFixed(1)} ppm' : (item.waterTdsAdcRaw != null ? 'Raw: ${item.waterTdsAdcRaw}' : '—')),
              _metricText('pH', item.waterPh != null ? '${item.waterPh!.toStringAsFixed(1)} pH' : (item.waterPhAdcRaw != null ? 'Raw: ${item.waterPhAdcRaw}' : '—')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _metricText(String label, String value) {
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
            fontWeight: FontWeight.w600,
            color: AppColors.navy,
          ),
        ),
      ],
    );
  }
}

