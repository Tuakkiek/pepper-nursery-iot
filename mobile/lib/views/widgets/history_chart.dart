import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/constants/app_colors.dart';

class ChartDataPoint {
  final DateTime time;
  final double? value;
  final String label;

  const ChartDataPoint({
    required this.time,
    required this.value,
    required this.label,
  });
}

class HistoryChart extends StatefulWidget {
  final String title;
  final String unit;
  final List<ChartDataPoint> points;

  const HistoryChart({
    super.key,
    required this.title,
    required this.unit,
    required this.points,
  });

  @override
  State<HistoryChart> createState() => _HistoryChartState();
}

class _HistoryChartState extends State<HistoryChart> {
  int? _selectedIndex;

  @override
  Widget build(BuildContext context) {
    final validPoints = widget.points.where((p) => p.value != null).toList();

    if (validPoints.isEmpty) {
      return Container(
        height: 180,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.card),
          border: Border.all(color: AppColors.border),
        ),
        padding: const EdgeInsets.all(AppSpacing.space4),
        child: Text(
          'Chưa đủ dữ liệu hợp lệ để vẽ biểu đồ ${widget.title}',
          style: AppTypography.caption,
          textAlign: TextAlign.center,
        ),
      );
    }

    final values = validPoints.map((p) => p.value!).toList();
    double minVal = values.reduce((a, b) => a < b ? a : b);
    double maxVal = values.reduce((a, b) => a > b ? a : b);

    if (minVal == maxVal) {
      minVal -= 1.0;
      maxVal += 1.0;
    } else {
      final padding = (maxVal - minVal) * 0.15;
      minVal -= padding;
      maxVal += padding;
    }

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${widget.title} (${widget.unit})',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
              if (_selectedIndex != null && _selectedIndex! < widget.points.length) ...[
                Text(
                  widget.points[_selectedIndex!].value != null
                      ? '${widget.points[_selectedIndex!].value!.toStringAsFixed(1)} ${widget.unit}'
                      : '—',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ],
            ],
          ),
          if (_selectedIndex != null && _selectedIndex! < widget.points.length)
            Text(
              DateFormat('HH:mm:ss dd/MM').format(widget.points[_selectedIndex!].time.toLocal()),
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
            )
          else
            const Text(
              'Chạm vào điểm trên biểu đồ để xem chi tiết',
              style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
            ),
          const SizedBox(height: AppSpacing.space3),
          SizedBox(
            height: 150,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GestureDetector(
                  onPanDown: (details) => _handleTouch(details.localPosition.dx, constraints.maxWidth),
                  onPanUpdate: (details) => _handleTouch(details.localPosition.dx, constraints.maxWidth),
                  child: CustomPaint(
                    size: Size(constraints.maxWidth, 150),
                    painter: _ChartPainter(
                      points: widget.points,
                      minVal: minVal,
                      maxVal: maxVal,
                      selectedIndex: _selectedIndex,
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _handleTouch(double dx, double width) {
    if (widget.points.isEmpty) return;
    final step = width / (widget.points.length > 1 ? widget.points.length - 1 : 1);
    int index = (dx / step).round().clamp(0, widget.points.length - 1);
    setState(() {
      _selectedIndex = index;
    });
  }
}

class _ChartPainter extends CustomPainter {
  final List<ChartDataPoint> points;
  final double minVal;
  final double maxVal;
  final int? selectedIndex;

  _ChartPainter({
    required this.points,
    required this.minVal,
    required this.maxVal,
    this.selectedIndex,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final gridPaint = Paint()
      ..color = AppColors.border
      ..strokeWidth = 1.0;

    final linePaint = Paint()
      ..color = AppColors.navy
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final dotPaint = Paint()
      ..color = AppColors.teal
      ..style = PaintingStyle.fill;

    final activeDotPaint = Paint()
      ..color = AppColors.coral
      ..style = PaintingStyle.fill;

    // Draw horizontal guidelines (min, mid, max)
    canvas.drawLine(Offset(0, 0), Offset(size.width, 0), gridPaint);
    canvas.drawLine(Offset(0, size.height / 2), Offset(size.width, size.height / 2), gridPaint);
    canvas.drawLine(Offset(0, size.height), Offset(size.width, size.height), gridPaint);

    final stepX = points.length > 1 ? size.width / (points.length - 1) : size.width / 2;

    // Không nối đường qua điểm không có dữ liệu (null/lỗi)
    Offset? lastPoint;

    for (int i = 0; i < points.length; i++) {
      final val = points[i].value;
      final x = points.length > 1 ? i * stepX : size.width / 2;

      if (val == null) {
        lastPoint = null; // Tạo khoảng trống, không vẽ nối qua điểm null
        continue;
      }

      final normalizedY = (val - minVal) / (maxVal - minVal);
      final y = size.height - (normalizedY * size.height).clamp(0.0, size.height);
      final currentPoint = Offset(x, y);

      if (lastPoint != null) {
        canvas.drawLine(lastPoint, currentPoint, linePaint);
      }

      // Draw dot
      final isSelected = selectedIndex == i;
      canvas.drawCircle(currentPoint, isSelected ? 6.0 : 4.0, isSelected ? activeDotPaint : dotPaint);

      lastPoint = currentPoint;
    }
  }

  @override
  bool shouldRepaint(covariant _ChartPainter oldDelegate) {
    return oldDelegate.points != points || oldDelegate.selectedIndex != selectedIndex;
  }
}

