import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/care_rule.dart';
import '../../models/sensor_reading.dart';
import '../../services/api_service.dart';

class CareScreen extends StatefulWidget {
  final ApiService apiService;
  final LatestReadingResponse? latestData;

  const CareScreen({
    super.key,
    required this.apiService,
    required this.latestData,
  });

  @override
  State<CareScreen> createState() => _CareScreenState();
}

class _CareScreenState extends State<CareScreen> {
  List<CareRule> _rules = [];
  bool _isLoadingRules = false;
  String? _rulesError;

  @override
  void initState() {
    super.initState();
    _loadRules();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    _loadRules();
  }

  Future<void> _loadRules() async {
    if (!mounted) return;
    setState(() {
      _isLoadingRules = true;
      _rulesError = null;
    });

    try {
      final rules = await widget.apiService.fetchCareRules();
      if (!mounted) return;
      setState(() {
        _rules = rules;
        _isLoadingRules = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _rulesError = e.toString().replaceFirst('Exception: ', '');
        _isLoadingRules = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final reading = widget.latestData?.reading;
    final isStale = widget.latestData?.isStale;
    final advice = widget.latestData?.adviceMessage;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quy Tắc Chăm Sóc'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Làm mới quy tắc',
            onPressed: _isLoadingRules ? null : _loadRules,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadRules,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.space4),
          children: [
            // 1. Banner trạng thái nhận định hiện tại
            if (widget.latestData == null || reading == null) ...[
              _buildInfoCard(
                title: 'Chưa có dữ liệu cảm biến',
                message: 'Không đủ dữ liệu để đưa ra nhận định hoặc khuyến nghị tưới/chăm sóc.',
                isWarning: true,
              ),
            ] else if (isStale == true) ...[
              _buildInfoCard(
                title: 'Cảnh báo dữ liệu cũ',
                message: 'Thiết bị mất liên lạc quá 5 phút. Quy tắc chăm sóc không áp dụng cho số đo đã cũ.',
                isWarning: true,
              ),
            ] else if (advice != null && advice.isNotEmpty) ...[
              _buildInfoCard(
                title: 'Khuyến nghị hiện tại từ Backend',
                message: advice,
                isWarning: false,
              ),
            ] else ...[
              _buildInfoCard(
                title: 'Trạng thái bình thường',
                message: 'Các chỉ số nằm trong ngưỡng cho phép của vườn ươm ớt con giai đoạn phát triển mầm.',
                isWarning: false,
              ),
            ],

            const SizedBox(height: AppSpacing.space6),

            // 2. Danh sách quy tắc động từ Backend API (/api/v1/rules)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Quy tắc chăm sóc hệ thống',
                  style: AppTypography.sectionTitle,
                ),
                if (widget.apiService.mode == DataSourceMode.live)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.tealSoft,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'API Backend',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.navy),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.space1),
            const Text(
              'Các quy tắc do MThuy & TDat cấu hình trên Backend MySQL Aiven:',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: AppSpacing.space3),

            if (_isLoadingRules)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24.0),
                  child: CircularProgressIndicator(color: AppColors.navy),
                ),
              )
            else if (_rulesError != null)
              Container(
                padding: const EdgeInsets.all(AppSpacing.space4),
                decoration: BoxDecoration(
                  color: AppColors.coralSoft,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.coral),
                ),
                child: Column(
                  children: [
                    Text(
                      'Lỗi tải quy tắc từ backend: $_rulesError',
                      style: const TextStyle(fontSize: 13, color: AppColors.coralStrong),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: _loadRules,
                      child: const Text('Thử lại'),
                    ),
                  ],
                ),
              )
            else if (_rules.isEmpty)
              Container(
                padding: const EdgeInsets.all(AppSpacing.space6),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Text(
                  'Chưa có quy tắc nào trên hệ thống',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              )
            else
              ..._rules.map((rule) => _buildRuleCard(rule)),

            const SizedBox(height: AppSpacing.space6),
            Container(
              padding: const EdgeInsets.all(AppSpacing.space4),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(color: AppColors.border),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Nguyên tắc xử lý quy tắc G0',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.navy,
                    ),
                  ),
                  SizedBox(height: AppSpacing.space2),
                  Text(
                    '• Quy tắc do Backend tính toán và áp dụng tự động theo thời gian thực.\n'
                    '• Khi cảm biến bị lỗi hoặc chưa hiệu chuẩn, hệ thống tự động bỏ qua và không phát sinh lời khuyên sai lệch.',
                    style: TextStyle(
                      fontSize: 12,
                      height: 18 / 12,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRuleCard(CareRule rule) {
    Color badgeBg;
    Color badgeText;
    switch (rule.severity) {
      case 'danger':
        badgeBg = AppColors.coralSoft;
        badgeText = AppColors.coralStrong;
        break;
      case 'warning':
        badgeBg = const Color(0xFFFFF3CD);
        badgeText = const Color(0xFF856404);
        break;
      default:
        badgeBg = AppColors.tealSoft;
        badgeText = AppColors.navy;
    }

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
              Expanded(
                child: Text(
                  rule.name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  rule.severity.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: badgeText,
                  ),
                ),
              ),
            ],
          ),
          if (rule.description != null && rule.description!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              rule.description!,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
          const SizedBox(height: AppSpacing.space2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.cream,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.tune, size: 16, color: AppColors.navy),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    '${rule.parameterLabel}: ${rule.conditionText}',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.navy,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.space2),
          Text(
            'Hành động: ${rule.actionAdvice}',
            style: const TextStyle(
              fontSize: 13,
              height: 18 / 13,
              color: AppColors.navy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String message,
    required bool isWarning,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isWarning ? AppColors.coralSoft : AppColors.tealSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: isWarning ? AppColors.coral : AppColors.teal,
          width: 1.2,
        ),
      ),
      padding: const EdgeInsets.all(AppSpacing.space4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isWarning ? Icons.warning_amber_rounded : Icons.check_circle_outline,
            color: isWarning ? AppColors.coralStrong : AppColors.navy,
            size: 24,
          ),
          const SizedBox(width: AppSpacing.space3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isWarning ? AppColors.coralStrong : AppColors.navy,
                  ),
                ),
                const SizedBox(height: AppSpacing.space1),
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 18 / 13,
                    color: AppColors.navy,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
