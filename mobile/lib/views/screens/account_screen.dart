import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/auth_user.dart';
import '../../models/user_device.dart';
import '../../services/api_service.dart';
import '../widgets/device_manager_sheet.dart';
import 'login_screen.dart';
import 'register_screen.dart';

class AccountScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback? onOpenLogin;
  final VoidCallback? onLogout;

  const AccountScreen({
    super.key,
    required this.apiService,
    this.onOpenLogin,
    this.onLogout,
  });

  @override
  State<AccountScreen> createState() => _AccountScreenState();
}

class _AccountScreenState extends State<AccountScreen> {
  List<UserDevice> _devices = [];
  List<UserDevice> _systemDevices = [];
  bool _isLoadingDevices = false;
  bool _isRefreshingProfile = false;
  String? _devicesError;
  String? _lastAccountKey;

  String get _accountKey {
    final user = widget.apiService.currentUser;
    return '${widget.apiService.isAuthenticated}|${user?.username}|'
        '${widget.apiService.mode.name}|${widget.apiService.baseUrl}|'
        '${widget.apiService.deviceId}|${widget.apiService.token ?? ''}';
  }

  @override
  void initState() {
    super.initState();
    _lastAccountKey = _accountKey;
    _loadDevices();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    if (!mounted) return;
    final nextKey = _accountKey;
    if (_lastAccountKey != null && nextKey != _lastAccountKey) {
      _lastAccountKey = nextKey;
      _loadDevices();
    } else {
      _lastAccountKey = nextKey;
      setState(() {});
    }
  }

  Future<void> _refreshAccount() async {
    setState(() => _isRefreshingProfile = true);
    try {
      if (widget.apiService.isAuthenticated) {
        await widget.apiService.fetchCurrentUser();
      }
      await _loadDevices();
    } catch (e) {
      if (mounted) {
        _showSnack(
          e.toString().replaceFirst('Exception: ', ''),
          isError: true,
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRefreshingProfile = false);
      }
    }
  }

  Future<void> _loadDevices() async {
    if (!mounted) return;
    setState(() {
      _isLoadingDevices = true;
      _devicesError = null;
    });

    try {
      final isAuth = widget.apiService.isAuthenticated;
      final allFuture = isAuth
          ? Future<List<UserDevice>>.value(const <UserDevice>[])
          : widget.apiService.fetchAllDevices();
      final userFuture = isAuth
          ? widget.apiService.fetchUserDevices()
          : Future<List<UserDevice>>.value(const <UserDevice>[]);
      final detailFuture = widget.apiService
          .fetchCurrentDeviceDetail()
          .catchError((_) => null);

      final allList = await allFuture;
      final userList = await userFuture;
      await detailFuture;

      if (!mounted) return;
      setState(() {
        _systemDevices = allList;
        _devices = userList;
        _isLoadingDevices = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _devicesError = e.toString().replaceFirst('Exception: ', '');
        _isLoadingDevices = false;
      });
    }
  }

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? AppColors.coralStrong : AppColors.navy,
        content: Text(message),
      ),
    );
  }

  void _openLogin() {
    if (widget.onOpenLogin != null) {
      widget.onOpenLogin!();
      return;
    }
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => LoginScreen(apiService: widget.apiService),
      ),
    );
  }

  void _openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => RegisterScreen(apiService: widget.apiService),
      ),
    );
  }

  Future<void> _showAddDeviceFlow() async {
    try {
      final created = await showAddDeviceDialog(
        context,
        apiService: widget.apiService,
      );
      if (created != null) {
        await _loadDevices();
        _showSnack('Đã thêm thiết bị "${created.name}" (ID: ${created.deviceId})');
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _showRenameDeviceDialog(
    UserDevice device, {
    required bool isOwned,
  }) async {
    try {
      final updated = await showRenameDeviceDialog(
        context,
        apiService: widget.apiService,
        deviceId: device.deviceId,
        currentName: device.name,
        description: device.description,
        claimIfNeeded: widget.apiService.isAuthenticated && !isOwned,
        dialogTitle: (widget.apiService.isAuthenticated && !isOwned)
            ? 'Gắn vào tài khoản & đặt tên'
            : 'Đặt tên thiết bị',
      );
      if (updated != null) {
        await _loadDevices();
        _showSnack('Đã cập nhật tên thiết bị "${updated.name}".');
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _confirmDeleteDevice(
    UserDevice device, {
    required bool isOwned,
  }) async {
    try {
      final deleted = await confirmDeleteDeviceDialog(
        context,
        apiService: widget.apiService,
        device: device,
        isOwned: isOwned,
      );
      if (deleted) {
        await _loadDevices();
        _showSnack('Đã xóa thiết bị ${device.deviceId}.');
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _activateDevice(
    UserDevice device, {
    required bool isOwned,
  }) async {
    try {
      await widget.apiService.selectActiveDevice(
        device.deviceId,
        deviceName: device.name,
        isOwned: isOwned,
      );
      await _loadDevices();
      _showSnack('Đang theo dõi trạm ${device.name} (ID: ${device.deviceId})');
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    }
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn muốn đăng xuất khỏi tài khoản hiện tại?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Hủy'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.coralStrong),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    widget.apiService.logout();
    widget.onLogout?.call();
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.apiService.currentUser;
    final isAuthenticated = widget.apiService.isAuthenticated && user != null;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tài Khoản'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: isAuthenticated ? 'Làm mới tài khoản' : 'Làm mới thiết bị',
            onPressed: _isRefreshingProfile ? null : _refreshAccount,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAccount,
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.space4),
          children: [
            if (isAuthenticated) ...[
              _buildProfileCard(user),
              const SizedBox(height: AppSpacing.space6),
              _buildDevicesSection(isAuthenticated: true),
              const SizedBox(height: AppSpacing.space6),
              _buildConnectionSummaryCard(),
              const SizedBox(height: AppSpacing.space6),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.coralStrong,
                  side: const BorderSide(color: AppColors.coral, width: 1.2),
                  minimumSize: const Size(double.infinity, 48),
                ),
                icon: const Icon(Icons.logout, size: 20),
                onPressed: _confirmLogout,
                label: const Text('Đăng xuất tài khoản'),
              ),
              const SizedBox(height: AppSpacing.space4),
            ] else ...[
              _buildGuestCard(),
              const SizedBox(height: AppSpacing.space6),
              _buildDevicesSection(isAuthenticated: false),
              const SizedBox(height: AppSpacing.space6),
              _buildConnectionSummaryCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGuestCard() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.tealSoft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.teal),
                ),
                child: const Icon(
                  Icons.person_outline,
                  size: 28,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(width: AppSpacing.space3),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Chế độ Khách',
                      style: AppTypography.sectionTitle,
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Đăng nhập để quản lý hồ sơ và danh sách thiết bị riêng.',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space4),
          ElevatedButton.icon(
            icon: const Icon(Icons.login, size: 20),
            onPressed: _openLogin,
            label: const Text('Đăng nhập tài khoản'),
          ),
          const SizedBox(height: AppSpacing.space3),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
            ),
            icon: const Icon(Icons.person_add_alt_1_outlined, size: 20),
            onPressed: _openRegister,
            label: const Text('Đăng ký tài khoản mới'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileCard(AuthUser user) {
    final isFixture = widget.apiService.mode == DataSourceMode.fixture;
    final activeDevice = user.selectedDeviceId?.trim().isNotEmpty == true
        ? user.selectedDeviceId!
        : widget.apiService.deviceId;

    return Container(
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
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: AppColors.tealSoft,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.teal, width: 1.2),
                ),
                child: Icon(
                  user.isAdmin ? Icons.admin_panel_settings : Icons.person,
                  size: 28,
                  color: AppColors.navy,
                ),
              ),
              const SizedBox(width: AppSpacing.space3),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.displayName,
                      style: AppTypography.sectionTitle,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '@${user.username}',
                      style: AppTypography.caption,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: user.isAdmin ? AppColors.coralSoft : AppColors.tealSoft,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  user.role.toUpperCase(),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: user.isAdmin ? AppColors.coralStrong : AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24, color: AppColors.border),
          _buildInfoRow(
            icon: Icons.badge_outlined,
            label: 'ID tài khoản',
            value: '#${user.id}',
          ),
          const SizedBox(height: AppSpacing.space2),
          _buildInfoRow(
            icon: Icons.developer_board,
            label: 'Trạm đang theo dõi',
            value: 'ID: $activeDevice',
          ),
          if (isFixture) ...[
            const SizedBox(height: AppSpacing.space2),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.tealSoft,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'Đang dùng tài khoản mô phỏng (Chế độ Fixture G0)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.navy,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDevicesSection({required bool isAuthenticated}) {
    final activeId = widget.apiService.deviceId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                isAuthenticated ? 'Thiết bị của tài khoản' : 'Thiết bị quan trắc',
                style: AppTypography.sectionTitle,
              ),
            ),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                minimumSize: const Size(0, 38),
                padding: const EdgeInsets.symmetric(horizontal: 12),
              ),
              icon: const Icon(Icons.add, size: 18),
              onPressed: _showAddDeviceFlow,
              label: const Text('Thêm thiết bị'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.space2),
        Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: AppSpacing.space3),
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.space3,
            vertical: AppSpacing.space2,
          ),
          decoration: BoxDecoration(
            color: AppColors.tealSoft,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.teal),
          ),
          child: Row(
            children: [
              const Icon(Icons.developer_board, size: 18, color: AppColors.navy),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Text(
                  'ID thiết bị hiện tại: $activeId',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (_isLoadingDevices)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(color: AppColors.navy),
            ),
          )
        else if (_devicesError != null)
          Container(
            padding: const EdgeInsets.all(AppSpacing.space4),
            decoration: BoxDecoration(
              color: AppColors.coralSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: AppColors.coral),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _devicesError!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.coralStrong,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: AppSpacing.space2),
                OutlinedButton(
                  onPressed: _loadDevices,
                  child: const Text('Thử tải lại'),
                ),
              ],
            ),
          )
        else ...[
          if (isAuthenticated) ...[
            if (_devices.isEmpty)
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: AppSpacing.space3),
                padding: const EdgeInsets.all(AppSpacing.space4),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.card),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Text(
                  'Chưa có thiết bị nào liên kết với tài khoản này. Nhấn "Thêm thiết bị" để tạo mới hoặc gắn trạm ESP32 theo ID.',
                  style: AppTypography.caption,
                ),
              )
            else
              ..._devices.map((d) => _buildDeviceItemCard(d, isOwned: true)),
          ] else if (_systemDevices.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.space4),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.card),
                border: Border.all(color: AppColors.border),
              ),
              child: const Text(
                'Chưa có thiết bị nào. Nhấn "Thêm thiết bị" để khai báo và đặt tên trạm mới.',
                style: AppTypography.caption,
              ),
            )
          else
            ..._systemDevices.map((d) => _buildDeviceItemCard(d, isOwned: false)),
        ],
      ],
    );
  }

  Widget _buildDeviceItemCard(UserDevice device, {required bool isOwned}) {
    final isCurrentlyViewing = device.deviceId == widget.apiService.deviceId;
    final cleanName = device.name.trim();
    final displayTitle = (cleanName.isNotEmpty && cleanName != device.deviceId)
        ? cleanName
        : 'Trạm ${device.deviceId}';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.space3),
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: isCurrentlyViewing ? AppColors.teal : AppColors.border,
          width: isCurrentlyViewing ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.sensors,
                size: 20,
                color: device.isOnline ? AppColors.navy : AppColors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Text(
                  displayTitle,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.border),
                ),
                child: Text(
                  'ID: ${device.deviceId}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: device.isOnline ? AppColors.tealSoft : AppColors.cream,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  device.isOnline ? 'Online' : 'Offline',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: device.isOnline
                        ? const Color(0xFF155724)
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          if (device.description != null &&
              device.description!.trim().isNotEmpty) ...[
            const SizedBox(height: AppSpacing.space1),
            Text(
              device.description!.trim(),
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
          ],
          const SizedBox(height: AppSpacing.space3),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (isCurrentlyViewing)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.tealSoft,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Đang theo dõi',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.navy,
                    ),
                  ),
                )
              else
                OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    minimumSize: const Size(0, 36),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  onPressed: () => _activateDevice(device, isOwned: isOwned),
                  child: const Text('Chọn xem', style: TextStyle(fontSize: 12)),
                ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.navy,
                  minimumSize: const Size(0, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                icon: const Icon(Icons.edit_outlined, size: 18),
                onPressed: () => _showRenameDeviceDialog(device, isOwned: isOwned),
                label: Text(
                  (widget.apiService.isAuthenticated && !isOwned)
                      ? 'Gắn & đặt tên'
                      : 'Đặt tên',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.coralStrong,
                  minimumSize: const Size(0, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                icon: const Icon(Icons.delete_outline, size: 18),
                onPressed: () => _confirmDeleteDevice(device, isOwned: isOwned),
                label: const Text('Xóa', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConnectionSummaryCard() {
    final isFixture = widget.apiService.mode == DataSourceMode.fixture;
    final activeName = widget.apiService.activeDeviceName?.trim();
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Thông tin thiết bị & đồng bộ',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.navy,
            ),
          ),
          const SizedBox(height: AppSpacing.space3),
          _buildInfoRow(
            icon: isFixture ? Icons.science_outlined : Icons.cloud_outlined,
            label: 'Nguồn dữ liệu',
            value: isFixture ? 'Dữ liệu mẫu (Fixture G0)' : 'Backend Live',
          ),
          const SizedBox(height: AppSpacing.space2),
          _buildInfoRow(
            icon: Icons.developer_board,
            label: 'ID thiết bị hiện tại',
            value: widget.apiService.deviceId,
          ),
          if (activeName != null && activeName.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.space2),
            _buildInfoRow(
              icon: Icons.label_outline,
              label: 'Tên thiết bị',
              value: activeName,
            ),
          ],
          const SizedBox(height: AppSpacing.space2),
          _buildInfoRow(
            icon: Icons.autorenew,
            label: 'Tự động làm mới',
            value: widget.apiService.autoRefresh
                ? 'Bật (mỗi ${widget.apiService.refreshIntervalSeconds}s)'
                : 'Đang tắt',
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: AppSpacing.space2),
        Text(
          '$label:',
          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
        ),
        const SizedBox(width: AppSpacing.space2),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.navy,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

