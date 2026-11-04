import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/api_service.dart';

class SettingsSheet extends StatefulWidget {
  final ApiService apiService;

  const SettingsSheet({super.key, required this.apiService});

  @override
  State<SettingsSheet> createState() => _SettingsSheetState();
}

class _SettingsSheetState extends State<SettingsSheet> {
  late DataSourceMode _mode;
  late FixtureScenario _scenario;
  late TextEditingController _urlController;
  late TextEditingController _deviceController;

  @override
  void initState() {
    super.initState();
    _mode = widget.apiService.mode;
    _scenario = widget.apiService.currentScenario;
    _urlController = TextEditingController(text: widget.apiService.baseUrl);
    _deviceController = TextEditingController(text: widget.apiService.deviceId);
  }

  @override
  void dispose() {
    _urlController.dispose();
    _deviceController.dispose();
    super.dispose();
  }

  void _save() {
    widget.apiService.mode = _mode;
    widget.apiService.currentScenario = _scenario;
    widget.apiService.baseUrl = _urlController.text.trim();
    widget.apiService.deviceId = _deviceController.text.trim();
    Navigator.of(context).pop(true);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.dialog)),
      ),
      padding: EdgeInsets.only(
        top: AppSpacing.space4,
        left: AppSpacing.space4,
        right: AppSpacing.space4,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.space6,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.space3),
            const Text(
              'Cấu hình kết nối & Dữ liệu',
              style: AppTypography.sectionTitle,
            ),
            const SizedBox(height: AppSpacing.space3),

            // Chế độ nguồn dữ liệu
            const Text(
              'Nguồn dữ liệu:',
              style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.navy),
            ),
            const SizedBox(height: AppSpacing.space1),
            Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Dữ liệu mẫu (Fixture)')),
                    selected: _mode == DataSourceMode.fixture,
                    selectedColor: AppColors.tealSoft,
                    labelStyle: TextStyle(
                      color: _mode == DataSourceMode.fixture ? AppColors.navy : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _mode = DataSourceMode.fixture);
                    },
                  ),
                ),
                const SizedBox(width: AppSpacing.space2),
                Expanded(
                  child: ChoiceChip(
                    label: const Center(child: Text('Backend thật (API)')),
                    selected: _mode == DataSourceMode.live,
                    selectedColor: AppColors.tealSoft,
                    labelStyle: TextStyle(
                      color: _mode == DataSourceMode.live ? AppColors.navy : AppColors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _mode = DataSourceMode.live);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.space3),

            if (_mode == DataSourceMode.fixture) ...[
              const Text(
                'Kịch bản thử nghiệm (Phase 1):',
                style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.navy),
              ),
              const SizedBox(height: AppSpacing.space1),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.control),
                  border: Border.all(color: AppColors.border),
                  color: AppColors.cream,
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<FixtureScenario>(
                    value: _scenario,
                    isExpanded: true,
                    items: FixtureScenario.values.map((s) {
                      return DropdownMenuItem(
                        value: s,
                        child: Text(
                          s.label,
                          style: const TextStyle(fontSize: 13, color: AppColors.navy),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _scenario = val);
                    },
                  ),
                ),
              ),
            ] else ...[
              const Text(
                'Base URL API Backend:',
                style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.navy),
              ),
              const SizedBox(height: AppSpacing.space1),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(
                  hintText: 'http://10.0.2.2:3000 hoặc http://192.168.1.x:3000',
                ),
              ),
              const SizedBox(height: AppSpacing.space1),
              const Text(
                'Lưu ý: Android Emulator dùng 10.0.2.2; Điện thoại thật dùng IP LAN máy tính.',
                style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
            ],

            const SizedBox(height: AppSpacing.space3),
            const Text(
              'Mã thiết bị (Device ID):',
              style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.navy),
            ),
            const SizedBox(height: AppSpacing.space1),
            TextField(
              controller: _deviceController,
              decoration: const InputDecoration(
                hintText: 'esp32-nursery-01',
              ),
            ),

            const SizedBox(height: AppSpacing.space6),
            ElevatedButton(
              onPressed: _save,
              child: const Text('Lưu và áp dụng'),
            ),
          ],
        ),
      ),
    );
  }
}

