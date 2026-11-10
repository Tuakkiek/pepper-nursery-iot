import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';
import '../../services/api_service.dart';
import '../screens/reading_details_screen.dart';

enum ReadingFieldFilter {
  all('Tất cả trường', ''),
  airTemp('Nhiệt độ không khí', '°C'),
  airHumidity('Độ ẩm không khí', '%'),
  soilTemp('Nhiệt độ đất', '°C'),
  soilMoisture('Độ ẩm đất', '%'),
  tds('TDS mẫu nước', 'ppm'),
  ph('pH mẫu nước', 'pH');

  final String label;
  final String unit;
  const ReadingFieldFilter(this.label, this.unit);
}

enum QuickTimePreset {
  last1Hour('1 giờ qua'),
  last6Hours('6 giờ qua'),
  today('Hôm nay'),
  yesterday('Hôm qua'),
  last7Days('7 ngày qua');

  final String label;
  const QuickTimePreset(this.label);
}

class ReadingFilterCriteria {
  final DateTime startDate;
  final DateTime endDate;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final ReadingFieldFilter fieldFilter;
  final QuickTimePreset? preset;
  final String order;

  const ReadingFilterCriteria({
    required this.startDate,
    required this.endDate,
    required this.startTime,
    required this.endTime,
    this.fieldFilter = ReadingFieldFilter.all,
    this.preset,
    this.order = 'desc',
  });

  factory ReadingFilterCriteria.initialForMode(
    DataSourceMode mode, {
    ReadingFieldFilter initialField = ReadingFieldFilter.all,
  }) {
    if (mode == DataSourceMode.fixture) {
      return ReadingFilterCriteria(
        startDate: DateTime(2026, 11, 4),
        endDate: DateTime(2026, 11, 4),
        startTime: const TimeOfDay(hour: 0, minute: 0),
        endTime: const TimeOfDay(hour: 23, minute: 59),
        fieldFilter: initialField,
        preset: null,
      );
    }

    final now = DateTime.now();
    return ReadingFilterCriteria(
      startDate: DateTime(now.year, now.month, now.day),
      endDate: DateTime(now.year, now.month, now.day),
      startTime: const TimeOfDay(hour: 0, minute: 0),
      endTime: const TimeOfDay(hour: 23, minute: 59),
      fieldFilter: initialField,
      preset: QuickTimePreset.today,
    );
  }

  DateTime get startLocal => DateTime(
        startDate.year,
        startDate.month,
        startDate.day,
        startTime.hour,
        startTime.minute,
        0,
      );

  DateTime get endLocal => DateTime(
        endDate.year,
        endDate.month,
        endDate.day,
        endTime.hour,
        endTime.minute,
        59,
      );

  ReadingFilterCriteria copyWith({
    DateTime? startDate,
    DateTime? endDate,
    TimeOfDay? startTime,
    TimeOfDay? endTime,
    ReadingFieldFilter? fieldFilter,
    QuickTimePreset? preset,
    bool clearPreset = false,
    String? order,
  }) {
    return ReadingFilterCriteria(
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      fieldFilter: fieldFilter ?? this.fieldFilter,
      preset: clearPreset ? null : (preset ?? this.preset),
      order: order ?? this.order,
    );
  }
}

/// Mở popup chọn bộ lọc chi tiết và điều hướng sang màn hình ReadingDetailsScreen nếu xác nhận.
Future<void> openReadingDetailsWithFilterPopup(
  BuildContext context,
  ApiService apiService, {
  ReadingFieldFilter initialField = ReadingFieldFilter.all,
}) async {
  final initial = ReadingFilterCriteria.initialForMode(
    apiService.mode,
    initialField: initialField,
  );
  final selected = await showReadingFilterPopup(
    context,
    apiService: apiService,
    initialCriteria: initial,
    confirmLabel: 'Xem chi tiết',
  );
  if (selected == null || !context.mounted) return;

  await Navigator.of(context).push(
    MaterialPageRoute(
      builder: (context) => ReadingDetailsScreen(
        apiService: apiService,
        initialCriteria: selected,
      ),
    ),
  );
}

/// Hiển thị popup cho người dùng chọn ngày, mốc thời gian, trường dữ liệu và thứ tự sắp xếp.
Future<ReadingFilterCriteria?> showReadingFilterPopup(
  BuildContext context, {
  required ApiService apiService,
  required ReadingFilterCriteria initialCriteria,
  String confirmLabel = 'Áp dụng lọc',
}) {
  return showDialog<ReadingFilterCriteria>(
    context: context,
    builder: (ctx) => _ReadingFilterDialog(
      deviceId: apiService.deviceId,
      initialCriteria: initialCriteria,
      confirmLabel: confirmLabel,
    ),
  );
}

class _ReadingFilterDialog extends StatefulWidget {
  final String deviceId;
  final ReadingFilterCriteria initialCriteria;
  final String confirmLabel;

  const _ReadingFilterDialog({
    required this.deviceId,
    required this.initialCriteria,
    required this.confirmLabel,
  });

  @override
  State<_ReadingFilterDialog> createState() => _ReadingFilterDialogState();
}

class _ReadingFilterDialogState extends State<_ReadingFilterDialog> {
  late DateTime _startDate;
  late DateTime _endDate;
  late TimeOfDay _startTime;
  late TimeOfDay _endTime;
  late ReadingFieldFilter _fieldFilter;
  QuickTimePreset? _activePreset;
  late String _order;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    _startDate = widget.initialCriteria.startDate;
    _endDate = widget.initialCriteria.endDate;
    _startTime = widget.initialCriteria.startTime;
    _endTime = widget.initialCriteria.endTime;
    _fieldFilter = widget.initialCriteria.fieldFilter;
    _activePreset = widget.initialCriteria.preset;
    _order = widget.initialCriteria.order;
  }

  void _applyPreset(QuickTimePreset preset) {
    final now = DateTime.now();
    DateTime start;
    DateTime end = now;

    switch (preset) {
      case QuickTimePreset.last1Hour:
        start = now.subtract(const Duration(hours: 1));
        break;
      case QuickTimePreset.last6Hours:
        start = now.subtract(const Duration(hours: 6));
        break;
      case QuickTimePreset.today:
        start = DateTime(now.year, now.month, now.day, 0, 0);
        end = DateTime(now.year, now.month, now.day, 23, 59);
        break;
      case QuickTimePreset.yesterday:
        final y = now.subtract(const Duration(days: 1));
        start = DateTime(y.year, y.month, y.day, 0, 0);
        end = DateTime(y.year, y.month, y.day, 23, 59);
        break;
      case QuickTimePreset.last7Days:
        final d = now.subtract(const Duration(days: 6));
        start = DateTime(d.year, d.month, d.day, 0, 0);
        end = DateTime(now.year, now.month, now.day, 23, 59);
        break;
    }

    setState(() {
      _activePreset = preset;
      _startDate = DateTime(start.year, start.month, start.day);
      _endDate = DateTime(end.year, end.month, end.day);
      _startTime = TimeOfDay(hour: start.hour, minute: start.minute);
      _endTime = TimeOfDay(hour: end.hour, minute: end.minute);
      _validationError = null;
    });
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : _endDate;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024, 1, 1),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked == null || !mounted) return;
    setState(() {
      _activePreset = null;
      _validationError = null;
      if (isStart) {
        _startDate = picked;
      } else {
        _endDate = picked;
      }
    });
  }

  Future<void> _pickTime({required bool isStart}) async {
    final initial = isStart ? _startTime : _endTime;
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked == null || !mounted) return;
    setState(() {
      _activePreset = null;
      _validationError = null;
      if (isStart) {
        _startTime = picked;
      } else {
        _endTime = picked;
      }
    });
  }

  void _confirm() {
    final criteria = ReadingFilterCriteria(
      startDate: _startDate,
      endDate: _endDate,
      startTime: _startTime,
      endTime: _endTime,
      fieldFilter: _fieldFilter,
      preset: _activePreset,
      order: _order,
    );

    if (criteria.startLocal.isAfter(criteria.endLocal)) {
      setState(() {
        _validationError = 'Thời điểm bắt đầu phải nhỏ hơn hoặc bằng thời điểm kết thúc.';
      });
      return;
    }

    Navigator.of(context).pop(criteria);
  }

  String _formatDate(DateTime dt) => DateFormat('dd/MM/yyyy').format(dt);

  String _formatTime(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.dialog),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 460),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.space4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.filter_alt_outlined, color: AppColors.navy),
                  const SizedBox(width: AppSpacing.space2),
                  const Expanded(
                    child: Text(
                      'Chọn bộ lọc xem chi tiết',
                      style: AppTypography.sectionTitle,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              Text(
                'Trạm theo dõi: ${widget.deviceId}',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: AppSpacing.space3),

              // 1. Mốc thời gian nhanh
              const Text(
                'Mốc thời gian nhanh:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.space2),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: QuickTimePreset.values.map((preset) {
                  final selected = _activePreset == preset;
                  return ChoiceChip(
                    label: Text(preset.label),
                    selected: selected,
                    selectedColor: AppColors.tealSoft,
                    backgroundColor: AppColors.cream,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: selected ? AppColors.navy : AppColors.textSecondary,
                    ),
                    onSelected: (_) => _applyPreset(preset),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.space4),

              // 2. Chọn ngày & giờ cụ thể
              const Text(
                'Khoảng ngày & giờ tùy chỉnh:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.space2),
              Row(
                children: [
                  Expanded(
                    child: _buildPickerTile(
                      label: 'Ngày bắt đầu',
                      value: _formatDate(_startDate),
                      icon: Icons.calendar_today_outlined,
                      onTap: () => _pickDate(isStart: true),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.space2),
                  Expanded(
                    child: _buildPickerTile(
                      label: 'Giờ bắt đầu',
                      value: _formatTime(_startTime),
                      icon: Icons.access_time,
                      onTap: () => _pickTime(isStart: true),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.space2),
              Row(
                children: [
                  Expanded(
                    child: _buildPickerTile(
                      label: 'Ngày kết thúc',
                      value: _formatDate(_endDate),
                      icon: Icons.event_outlined,
                      onTap: () => _pickDate(isStart: false),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.space2),
                  Expanded(
                    child: _buildPickerTile(
                      label: 'Giờ kết thúc',
                      value: _formatTime(_endTime),
                      icon: Icons.schedule,
                      onTap: () => _pickTime(isStart: false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.space4),

              // 3. Chọn trường dữ liệu cảm biến
              const Text(
                'Trường dữ liệu muốn xem:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.space2),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: ReadingFieldFilter.values.map((filter) {
                  final selected = _fieldFilter == filter;
                  final label = filter.unit.isNotEmpty
                      ? '${filter.label} (${filter.unit})'
                      : filter.label;
                  return ChoiceChip(
                    label: Text(label),
                    selected: selected,
                    selectedColor: AppColors.tealSoft,
                    backgroundColor: AppColors.cream,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: selected ? AppColors.navy : AppColors.textSecondary,
                    ),
                    onSelected: (isSelected) {
                      if (isSelected) setState(() => _fieldFilter = filter);
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.space4),

              // 4. Thứ tự sắp xếp
              const Text(
                'Thứ tự hiển thị:',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(height: AppSpacing.space2),
              Row(
                children: [
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Mới nhất trước')),
                      selected: _order == 'desc',
                      selectedColor: AppColors.tealSoft,
                      onSelected: (selected) {
                        if (selected) setState(() => _order = 'desc');
                      },
                    ),
                  ),
                  const SizedBox(width: AppSpacing.space2),
                  Expanded(
                    child: ChoiceChip(
                      label: const Center(child: Text('Cũ nhất trước')),
                      selected: _order == 'asc',
                      selectedColor: AppColors.tealSoft,
                      onSelected: (selected) {
                        if (selected) setState(() => _order = 'asc');
                      },
                    ),
                  ),
                ],
              ),

              if (_validationError != null) ...[
                const SizedBox(height: AppSpacing.space3),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.space2),
                  decoration: BoxDecoration(
                    color: AppColors.coralSoft,
                    borderRadius: BorderRadius.circular(AppRadius.control),
                    border: Border.all(color: AppColors.coral),
                  ),
                  child: Text(
                    _validationError!,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.coralStrong,
                    ),
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.space4),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Hủy'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.space2),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(minimumSize: const Size(0, 48)),
                      onPressed: _confirm,
                      child: Text(widget.confirmLabel),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPickerTile({
    required String label,
    required String value,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(AppRadius.control),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.space3,
          vertical: AppSpacing.space2,
        ),
        decoration: BoxDecoration(
          color: AppColors.cream,
          borderRadius: BorderRadius.circular(AppRadius.control),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                Icon(icon, size: 15, color: AppColors.navy),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    value,
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
          ],
        ),
      ),
    );
  }
}

