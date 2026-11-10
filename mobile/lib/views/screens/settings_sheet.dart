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
  late bool _autoRefresh;
  late int _refreshInterval;

  // Health ping state
  bool _isCheckingHealth = false;
  bool? _healthStatus;
  String? _healthMessage;

  // Bridge sync state
  bool _isSyncingBridge = false;

  // Auth form state
  final TextEditingController _usernameController = TextEditingController(text: 'admin');
  final TextEditingController _passwordController = TextEditingController(text: 'admin123');
  bool _isLoggingIn = false;
  String? _authError;

  @override
  void initState() {
    super.initState();
    _mode = widget.apiService.mode;
    _scenario = widget.apiService.currentScenario;
    _urlController = TextEditingController(text: widget.apiService.baseUrl);
    _deviceController = TextEditingController(text: widget.apiService.deviceId);
    _autoRefresh = widget.apiService.autoRefresh;
    _refreshInterval = widget.apiService.refreshIntervalSeconds;
  }

  @override
  void dispose() {
    _urlController.dispose();
    _deviceController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _save() {
    widget.apiService.mode = _mode;
    widget.apiService.currentScenario = _scenario;
    widget.apiService.baseUrl = _urlController.text.trim();
    widget.apiService.deviceId = _deviceController.text.trim();
    widget.apiService.autoRefresh = _autoRefresh;
    widget.apiService.refreshIntervalSeconds = _refreshInterval;
    Navigator.of(context).pop(true);
  }

  Future<void> _checkHealth() async {
    setState(() {
      _isCheckingHealth = true;
      _healthStatus = null;
      _healthMessage = null;
    });

    widget.apiService.baseUrl = _urlController.text.trim();
    final ok = await widget.apiService.checkHealth();

    setState(() {
      _isCheckingHealth = false;
      _healthStatus = ok;
      _healthMessage = ok
          ? 'Máy chủ Backend đang hoạt động bình thường'
          : 'Không thể kết nối tới ${_urlController.text.trim()}';
    });
  }

  Future<void> _syncBridge() async {
    setState(() {
      _isSyncingBridge = true;
    });

    try {
      final res = await widget.apiService.triggerBridgeSync();
      final added = res['created'] ?? res['new_readings_count'] ?? res['added'] ?? 0;
      final total = res['fetched'] ?? res['total_feeds'] ?? 0;
      final duplicates = res['duplicates'] ?? 0;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.navy,
            content: Text(
              'Đồng bộ Sensor Data Bridge thành công! ($added bản ghi mới, $duplicates trùng / $total feeds)',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.coralStrong,
            content: Text('Lỗi đồng bộ Bridge: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSyncingBridge = false);
    }
  }

  Future<void> _login() async {
    setState(() {
      _isLoggingIn = true;
      _authError = null;
    });

    try {
      widget.apiService.baseUrl = _urlController.text.trim();
      final user = await widget.apiService.login(
        _usernameController.text.trim(),
        _passwordController.text.trim(),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.navy,
            content: Text('Đăng nhập thành công: ${user.fullName} (${user.role})'),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _authError = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isLoggingIn = false);
    }
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
              'Cấu hình Kết Nối Backend & Dữ Liệu',
              style: AppTypography.sectionTitle,
            ),
            const SizedBox(height: AppSpacing.space4),

            // 1. Chế độ nguồn dữ liệu
            const Text(
              'Nguồn dữ liệu:',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
            ),
            const SizedBox(height: AppSpacing.space1),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ChoiceChip(
                  label: const Text('Backend TDat (Khuyến nghị 100%)'),
                  selected: _mode == DataSourceMode.live,
                  selectedColor: AppColors.tealSoft,
                  labelStyle: TextStyle(
                    color: _mode == DataSourceMode.live ? AppColors.navy : AppColors.textSecondary,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected: (selected) {
                    if (selected) setState(() => _mode = DataSourceMode.live);
                  },
                ),
                ChoiceChip(
                  label: const Text('Sensor Data Bridge (Dự phòng Mục 7)'),
                  selected: _mode == DataSourceMode.bridge,
                  selectedColor: AppColors.tealSoft,
                  labelStyle: TextStyle(
                    color: _mode == DataSourceMode.bridge ? AppColors.navy : AppColors.textSecondary,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected: (selected) {
                    if (selected) setState(() => _mode = DataSourceMode.bridge);
                  },
                ),
                ChoiceChip(
                  label: const Text('Dữ liệu mẫu (Fixture G0)'),
                  selected: _mode == DataSourceMode.fixture,
                  selectedColor: AppColors.tealSoft,
                  labelStyle: TextStyle(
                    color: _mode == DataSourceMode.fixture ? AppColors.navy : AppColors.textSecondary,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected: (selected) {
                    if (selected) setState(() => _mode = DataSourceMode.fixture);
                  },
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.space4),

            // Phương án dự phòng trực tiếp Sensor Data Bridge (Mục 7)
            if (_mode == DataSourceMode.bridge) ...[
              Container(
                padding: const EdgeInsets.all(AppSpacing.space3),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Dự phòng gọi trực tiếp Sensor Data Bridge (Kênh 1):',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.navy),
                    ),
                    SizedBox(height: 4),
                    Text(
                      '• Endpoint: /api/v1/channels/1/feeds\n• Tự động quy đổi field1..field8 sang các số đo chuẩn\n• Sử dụng khi Backend TDat đang deploy lại hoặc bảo trì.',
                      style: TextStyle(fontSize: 11, height: 16 / 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.space3),
            ],

            // 2. Cấu hình Backend URL khi ở chế độ Live
            if (_mode == DataSourceMode.live) ...[
              const Text(
                'Địa chỉ Backend URL:',
                style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
              ),
              const SizedBox(height: AppSpacing.space1),
              TextField(
                controller: _urlController,
                decoration: const InputDecoration(
                  hintText: 'https://pepper-nursery-iot.onrender.com',
                  prefixIcon: Icon(Icons.link, size: 20, color: AppColors.navy),
                ),
              ),
              const SizedBox(height: AppSpacing.space1),

              // Nút chọn nhanh cấu hình mẫu URL
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.cloud_done, size: 16, color: AppColors.navy),
                    label: const Text('Cloud Render (Mặc định)'),
                    onPressed: () => setState(() => _urlController.text = ApiService.defaultCloudUrl),
                  ),
                  ActionChip(
                    label: const Text('Localhost (8000)'),
                    onPressed: () => setState(() => _urlController.text = ApiService.defaultLocalUrl),
                  ),
                  ActionChip(
                    label: const Text('Android Emulator (10.0.2.2:8000)'),
                    onPressed: () => setState(() => _urlController.text = ApiService.defaultAndroidEmulatorUrl),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.space2),

              // Nút kiểm tra kết nối (Ping Health)
              Row(
                children: [
                  OutlinedButton.icon(
                    icon: _isCheckingHealth
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.navy),
                          )
                        : const Icon(Icons.network_check, size: 18),
                    label: const Text('Kiểm tra kết nối (Ping)'),
                    onPressed: _isCheckingHealth ? null : _checkHealth,
                  ),
                  const SizedBox(width: AppSpacing.space2),
                  if (_healthStatus != null)
                    Expanded(
                      child: Text(
                        _healthMessage ?? '',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: _healthStatus! ? const Color(0xFF155724) : AppColors.coralStrong,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.space4),

              // Nút kích hoạt đồng bộ ThingSpeak
              Container(
                padding: const EdgeInsets.all(AppSpacing.space3),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(AppRadius.control),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.cloud_sync, color: AppColors.navy),
                    const SizedBox(width: AppSpacing.space2),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Sensor Data Bridge (Kênh 1)',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.navy),
                          ),
                          Text(
                            'ESP32 gửi lên Bridge, Backend tự động đồng bộ.',
                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.teal,
                        foregroundColor: AppColors.navy,
                        minimumSize: const Size(90, 36),
                      ),
                      onPressed: _isSyncingBridge ? null : _syncBridge,
                      child: _isSyncingBridge
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.navy),
                            )
                          : const Text('Đồng bộ ngay', style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),
            ] else ...[
              const Text(
                'Kịch bản kiểm thử G0 (Phase 1):',
                style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
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
                        child: Text(s.label, style: const TextStyle(fontSize: 13, color: AppColors.navy)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _scenario = val);
                    },
                  ),
                ),
              ),
            ],

            const SizedBox(height: AppSpacing.space4),

            // 3. Chọn thiết bị (Device ID)
            const Text(
              'Thiết bị theo dõi (Device ID):',
              style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.navy),
            ),
            const SizedBox(height: AppSpacing.space1),
            TextField(
              controller: _deviceController,
              decoration: const InputDecoration(
                hintText: 'esp32-nursery-01',
                prefixIcon: Icon(Icons.developer_board, size: 20, color: AppColors.navy),
              ),
            ),
            const SizedBox(height: AppSpacing.space1),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                ActionChip(
                  avatar: const Icon(Icons.bolt, size: 16, color: Color(0xFF155724)),
                  label: const Text('1 (Trạm Realtime Live 🟢)'),
                  backgroundColor: _deviceController.text == '1' ? AppColors.tealSoft : null,
                  onPressed: () => setState(() => _deviceController.text = '1'),
                ),
                ActionChip(
                  label: const Text('esp32-nursery-01 (Trạm chính)'),
                  backgroundColor: _deviceController.text == 'esp32-nursery-01' ? AppColors.tealSoft : null,
                  onPressed: () => setState(() => _deviceController.text = 'esp32-nursery-01'),
                ),
                ActionChip(
                  label: const Text('esp32-stale-01 (Dữ liệu cũ)'),
                  backgroundColor: _deviceController.text == 'esp32-stale-01' ? AppColors.tealSoft : null,
                  onPressed: () => setState(() => _deviceController.text = 'esp32-stale-01'),
                ),
                ActionChip(
                  label: const Text('esp32-empty-01 (Chưa có số đo)'),
                  backgroundColor: _deviceController.text == 'esp32-empty-01' ? AppColors.tealSoft : null,
                  onPressed: () => setState(() => _deviceController.text = 'esp32-empty-01'),
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.space4),

            // 4. Cấu hình tự động cập nhật dữ liệu (Mặc định mỗi 3s)
            Container(
              padding: const EdgeInsets.all(AppSpacing.space4),
              decoration: BoxDecoration(
                color: AppColors.cream,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.autorenew,
                            color: _autoRefresh ? AppColors.teal : AppColors.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: AppSpacing.space2),
                          const Text(
                            'Tự động cập nhật dữ liệu',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                              color: AppColors.navy,
                            ),
                          ),
                        ],
                      ),
                      Switch(
                        value: _autoRefresh,
                        activeThumbColor: AppColors.teal,
                        onChanged: (val) => setState(() => _autoRefresh = val),
                      ),
                    ],
                  ),
                  if (_autoRefresh) ...[
                    const SizedBox(height: AppSpacing.space2),
                    const Text(
                      'Chu kỳ cập nhật số đo mới nhất:',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: AppSpacing.space2),
                    Wrap(
                      spacing: 8,
                      children: [
                        ChoiceChip(
                          label: const Text('Mỗi 3s (Mặc định)'),
                          selected: _refreshInterval == 3,
                          selectedColor: AppColors.tealSoft,
                          labelStyle: TextStyle(
                            color: _refreshInterval == 3 ? AppColors.navy : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _refreshInterval = 3);
                          },
                        ),
                        ChoiceChip(
                          label: const Text('Mỗi 5s'),
                          selected: _refreshInterval == 5,
                          selectedColor: AppColors.tealSoft,
                          labelStyle: TextStyle(
                            color: _refreshInterval == 5 ? AppColors.navy : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _refreshInterval = 5);
                          },
                        ),
                        ChoiceChip(
                          label: const Text('Mỗi 10s'),
                          selected: _refreshInterval == 10,
                          selectedColor: AppColors.tealSoft,
                          labelStyle: TextStyle(
                            color: _refreshInterval == 10 ? AppColors.navy : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                          onSelected: (selected) {
                            if (selected) setState(() => _refreshInterval = 10);
                          },
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.space6),

            // 5. Tài khoản & Phân quyền (Authentication)
            Container(
              padding: const EdgeInsets.all(AppSpacing.space4),
              decoration: BoxDecoration(
                color: AppColors.cream,
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
                        'Xác thực người dùng (JWT)',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.navy),
                      ),
                      if (widget.apiService.isAuthenticated)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.tealSoft,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.apiService.currentUser!.role.toUpperCase(),
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.navy),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.space2),

                  if (widget.apiService.isAuthenticated) ...[
                    Text(
                      'Đã đăng nhập: ${widget.apiService.currentUser!.fullName} (@${widget.apiService.currentUser!.username})',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.navy),
                    ),
                    const SizedBox(height: AppSpacing.space2),
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(minimumSize: const Size(double.infinity, 40)),
                      onPressed: () {
                        setState(() {
                          widget.apiService.logout();
                        });
                      },
                      child: const Text('Đăng xuất'),
                    ),
                  ] else ...[
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _usernameController,
                            decoration: const InputDecoration(
                              hintText: 'Tên đăng nhập',
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              hintText: 'Mật khẩu',
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_authError != null) ...[
                      const SizedBox(height: 6),
                      Text(_authError!, style: const TextStyle(fontSize: 12, color: AppColors.coralStrong)),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(minimumSize: const Size(0, 40)),
                            onPressed: _isLoggingIn ? null : _login,
                            child: _isLoggingIn
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Đăng nhập'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ActionChip(
                          label: const Text('admin'),
                          onPressed: () {
                            _usernameController.text = 'admin';
                            _passwordController.text = 'admin123';
                          },
                        ),
                        const SizedBox(width: 4),
                        ActionChip(
                          label: const Text('user'),
                          onPressed: () {
                            _usernameController.text = 'user';
                            _passwordController.text = 'user123';
                          },
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.space6),
            ElevatedButton(
              onPressed: _save,
              child: const Text('Lưu và Áp dụng'),
            ),
          ],
        ),
      ),
    );
  }
}
