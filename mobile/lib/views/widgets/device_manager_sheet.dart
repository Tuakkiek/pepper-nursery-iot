import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/user_device.dart';
import '../../services/api_service.dart';

/// Mở bottom sheet quản lý thiết bị: xem ID thiết bị hiện tại, thêm mới, đặt/đổi tên và chuyển trạm.
Future<void> showDeviceManagerSheet(
  BuildContext context, {
  required ApiService apiService,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => DeviceManagerSheet(apiService: apiService),
  );
}

/// Hiển thị hộp thoại thêm thiết bị mới và đặt tên hiển thị.
Future<UserDevice?> showAddDeviceDialog(
  BuildContext context, {
  required ApiService apiService,
  String? dialogTitle,
  String? confirmLabel,
}) async {
  final result = await showDialog<({String id, String name, String description})>(
    context: context,
    builder: (ctx) => _AddDeviceDialog(
      showDescription: !apiService.isAuthenticated,
      dialogTitle: dialogTitle,
      confirmLabel: confirmLabel,
    ),
  );

  if (result == null) return null;

  return apiService.addDevice(
    deviceId: result.id,
    name: result.name,
    description: result.description,
    activate: true,
  );
}

class _AddDeviceDialog extends StatefulWidget {
  final bool showDescription;
  final String? dialogTitle;
  final String? confirmLabel;

  const _AddDeviceDialog({
    required this.showDescription,
    this.dialogTitle,
    this.confirmLabel,
  });

  @override
  State<_AddDeviceDialog> createState() => _AddDeviceDialogState();
}

class _AddDeviceDialogState extends State<_AddDeviceDialog> {
  final _idController = TextEditingController();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _idController.dispose();
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.dialogTitle ?? 'Thêm thiết bị mới'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _idController,
                decoration: const InputDecoration(
                  labelText: 'ID thiết bị (Device ID)',
                  hintText: 'Ví dụ: 2 hoặc esp32-vuon-02',
                ),
                validator: (val) => (val == null || val.trim().isEmpty)
                    ? 'Vui lòng nhập ID thiết bị'
                    : null,
              ),
              const SizedBox(height: AppSpacing.space3),
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Tên thiết bị',
                  hintText: 'Ví dụ: Vườn ươm Khay B',
                ),
                validator: (val) => (val == null || val.trim().isEmpty)
                    ? 'Vui lòng nhập tên thiết bị'
                    : null,
              ),
              if (widget.showDescription) ...[
                const SizedBox(height: AppSpacing.space3),
                TextFormField(
                  controller: _descController,
                  decoration: const InputDecoration(
                    labelText: 'Mô tả (tùy chọn)',
                    hintText: 'Ví dụ: Cảm biến khu vực mái che',
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(minimumSize: const Size(110, 42)),
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              Navigator.of(context).pop((
                id: _idController.text,
                name: _nameController.text,
                description: _descController.text,
              ));
            }
          },
          child: Text(widget.confirmLabel ?? 'Thêm thiết bị'),
        ),
      ],
    );
  }
}

/// Hiển thị hộp thoại đặt tên / đổi tên thiết bị.
Future<UserDevice?> showRenameDeviceDialog(
  BuildContext context, {
  required ApiService apiService,
  required String deviceId,
  required String currentName,
  String? description,
  bool claimIfNeeded = false,
  String? dialogTitle,
}) async {
  final initialName =
      (currentName.trim().isNotEmpty && currentName.trim() != deviceId)
          ? currentName.trim()
          : '';
  final newName = await showDialog<String>(
    context: context,
    builder: (ctx) => _RenameDeviceDialog(
      deviceId: deviceId,
      initialName: initialName,
      dialogTitle: dialogTitle,
    ),
  );

  if (newName == null) return null;

  return apiService.renameDevice(
    deviceId,
    newName,
    description: description,
    claimIfNeeded: claimIfNeeded,
  );
}

/// Hiển thị hộp thoại xác nhận xóa thiết bị và thực hiện xóa qua ApiService.
Future<bool> confirmDeleteDeviceDialog(
  BuildContext context, {
  required ApiService apiService,
  required UserDevice device,
  bool isOwned = false,
}) async {
  final cleanName = device.name.trim();
  final label = (cleanName.isNotEmpty && cleanName != device.deviceId)
      ? '"$cleanName" (ID: ${device.deviceId})'
      : 'Trạm ${device.deviceId} (ID: ${device.deviceId})';

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      title: const Text('Xóa thiết bị'),
      content: Text(
        'Bạn có chắc muốn xóa thiết bị $label?\nTất cả dữ liệu đo của thiết bị này cũng sẽ bị xóa khỏi danh sách.',
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.coralStrong,
            foregroundColor: Colors.white,
            minimumSize: const Size(110, 40),
          ),
          onPressed: () => Navigator.of(ctx).pop(true),
          child: const Text('Xóa thiết bị'),
        ),
      ],
    ),
  );

  if (confirmed != true) return false;
  await apiService.deleteDevice(device.deviceId, isOwned: isOwned);
  return true;
}

class _RenameDeviceDialog extends StatefulWidget {
  final String deviceId;
  final String initialName;
  final String? dialogTitle;

  const _RenameDeviceDialog({
    required this.deviceId,
    required this.initialName,
    this.dialogTitle,
  });

  @override
  State<_RenameDeviceDialog> createState() => _RenameDeviceDialogState();
}

class _RenameDeviceDialogState extends State<_RenameDeviceDialog> {
  final _nameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _nameController.text = widget.initialName;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.dialogTitle ?? 'Đặt tên thiết bị'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.cream,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Text(
                'ID thiết bị: ${widget.deviceId}',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.navy,
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.space3),
            TextFormField(
              controller: _nameController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: 'Tên thiết bị',
                hintText: 'Ví dụ: Trạm Vườn Ươm A',
              ),
              validator: (val) => (val == null || val.trim().isEmpty)
                  ? 'Tên thiết bị không được để trống'
                  : null,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Hủy'),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(minimumSize: const Size(100, 42)),
          onPressed: () {
            if (_formKey.currentState?.validate() ?? false) {
              Navigator.of(context).pop(_nameController.text);
            }
          },
          child: const Text('Lưu tên'),
        ),
      ],
    );
  }
}

class DeviceManagerSheet extends StatefulWidget {
  final ApiService apiService;

  const DeviceManagerSheet({super.key, required this.apiService});

  @override
  State<DeviceManagerSheet> createState() => _DeviceManagerSheetState();
}

class _DeviceManagerSheetState extends State<DeviceManagerSheet> {
  List<UserDevice> _userDevices = [];
  List<UserDevice> _allDevices = [];
  UserDevice? _currentDetail;
  bool _isLoading = true;
  bool _isBusy = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDevices();
  }

  Future<void> _loadDevices() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
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
      final detail = await detailFuture;

      if (!mounted) return;
      setState(() {
        _allDevices = allList;
        _userDevices = userList;
        _currentDetail = detail;
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

  void _showSnack(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: isError ? AppColors.coralStrong : AppColors.navy,
        content: Text(message),
      ),
    );
  }

  Future<void> _handleAddDevice() async {
    setState(() => _isBusy = true);
    try {
      final created = await showAddDeviceDialog(
        context,
        apiService: widget.apiService,
      );
      if (created != null) {
        await _loadDevices();
        _showSnack(
          'Đã thêm và chuyển sang thiết bị "${created.name}" (ID: ${created.deviceId})',
        );
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isBusy = false);
      }
    }
  }

  Future<void> _handleRenameDevice(
    UserDevice device, {
    required bool isOwned,
  }) async {
    setState(() => _isBusy = true);
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
        _showSnack(
          'Đã cập nhật tên thiết bị "${updated.name}" (ID: ${updated.deviceId})',
        );
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isBusy = false);
      }
    }
  }

  Future<void> _handleSelectDevice(
    UserDevice device, {
    required bool isOwned,
  }) async {
    setState(() => _isBusy = true);
    try {
      await widget.apiService.selectActiveDevice(
        device.deviceId,
        deviceName: device.name,
        isOwned: isOwned,
      );
      await _loadDevices();
      _showSnack(
        'Đang theo dõi "${device.name}" (ID: ${device.deviceId})',
      );
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isBusy = false);
      }
    }
  }

  Future<void> _handleDeleteDevice(
    UserDevice device, {
    required bool isOwned,
  }) async {
    setState(() => _isBusy = true);
    try {
      final deleted = await confirmDeleteDeviceDialog(
        context,
        apiService: widget.apiService,
        device: device,
        isOwned: isOwned,
      );
      if (deleted) {
        await _loadDevices();
        _showSnack('Đã xóa thiết bị ID: ${device.deviceId}.');
      }
    } catch (e) {
      _showSnack(e.toString().replaceFirst('Exception: ', ''), isError: true);
    } finally {
      if (mounted) {
        setState(() => _isBusy = false);
      }
    }
  }

  UserDevice _resolveActiveDevice() {
    final activeId = widget.apiService.deviceId;
    for (final d in _userDevices) {
      if (d.deviceId == activeId) return d;
    }
    for (final d in _allDevices) {
      if (d.deviceId == activeId) return d;
    }
    if (_currentDetail != null && _currentDetail!.deviceId == activeId) {
      return _currentDetail!;
    }
    final knownName = widget.apiService.activeDeviceName?.trim();
    return UserDevice(
      deviceId: activeId,
      name: (knownName != null && knownName.isNotEmpty)
          ? knownName
          : 'Trạm $activeId',
      isActive: true,
      isOnline: widget.apiService.isBackendOnline,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAuth = widget.apiService.isAuthenticated;
    final ownedIds = _userDevices.map((d) => d.deviceId).toSet();
    final activeDevice = _resolveActiveDevice();
    final isCurrentOwned = ownedIds.contains(activeDevice.deviceId);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: AppColors.cream,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        left: AppSpacing.space4,
        right: AppSpacing.space4,
        top: AppSpacing.space3,
        bottom: MediaQuery.of(context).viewInsets.bottom + AppSpacing.space4,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
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
          Row(
            children: [
              const Icon(Icons.developer_board, color: AppColors.navy),
              const SizedBox(width: AppSpacing.space2),
              const Expanded(
                child: Text(
                  'Quản lý thiết bị',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.refresh, color: AppColors.navy),
                tooltip: 'Tải lại danh sách thiết bị',
                onPressed: _isLoading || _isBusy ? null : _loadDevices,
              ),
              IconButton(
                icon: const Icon(Icons.close, color: AppColors.textSecondary),
                tooltip: 'Đóng',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space3),
          Flexible(
            child: _isLoading
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: CircularProgressIndicator(color: AppColors.navy),
                  )
                : ListView(
                    shrinkWrap: true,
                    children: [
                      _buildCurrentDeviceBanner(activeDevice, isCurrentOwned),
                      const SizedBox(height: AppSpacing.space3),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.navy,
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 44),
                        ),
                        icon: const Icon(Icons.add, size: 19),
                        onPressed: _isBusy ? null : _handleAddDevice,
                        label: const Text('Thêm thiết bị mới'),
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: AppSpacing.space3),
                        _buildErrorBanner(_errorMessage!),
                      ],
                      if (isAuth) ...[
                        const SizedBox(height: AppSpacing.space4),
                        const Text(
                          'Thiết bị của tài khoản',
                          style: AppTypography.sectionTitle,
                        ),
                        const SizedBox(height: AppSpacing.space2),
                        if (_userDevices.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.space3),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(AppRadius.card),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: const Text(
                              'Tài khoản này chưa liên kết thiết bị riêng. Nhấn "Thêm thiết bị mới" để tạo hoặc gắn ID thiết bị.',
                              style: AppTypography.caption,
                            ),
                          )
                        else
                          ..._userDevices.map(
                            (d) => _buildDeviceTile(d, isOwned: true),
                          ),
                      ] else ...[
                        const SizedBox(height: AppSpacing.space4),
                        const Text(
                          'Danh sách thiết bị hiện có',
                          style: AppTypography.sectionTitle,
                        ),
                        const SizedBox(height: AppSpacing.space2),
                        if (_allDevices.isEmpty)
                          Container(
                            padding: const EdgeInsets.all(AppSpacing.space3),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(AppRadius.card),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: const Text(
                              'Chưa có thiết bị nào. Nhấn "Thêm thiết bị mới" để tạo trạm mới.',
                              style: AppTypography.caption,
                            ),
                          )
                        else
                          ..._allDevices.map(
                            (d) => _buildDeviceTile(d, isOwned: false),
                          ),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentDeviceBanner(UserDevice active, bool isOwned) {
    final cleanName = active.name.trim();
    final hasCustomName =
        cleanName.isNotEmpty && cleanName != active.deviceId;
    final displayName =
        hasCustomName ? cleanName : 'Trạm ${active.deviceId}';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.space4),
      decoration: BoxDecoration(
        color: AppColors.tealSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.teal, width: 1.3),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'THIẾT BỊ HIỆN TẠI',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.6,
                  color: AppColors.navy,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.teal),
                ),
                child: Text(
                  'ID: ${active.deviceId}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space2),
          Row(
            children: [
              const Icon(Icons.sensors, size: 22, color: AppColors.navy),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Text(
                  displayName,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.space2),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  backgroundColor: AppColors.surface,
                  foregroundColor: AppColors.navy,
                  minimumSize: const Size(0, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                ),
                icon: const Icon(Icons.edit_outlined, size: 16),
                onPressed: _isBusy
                    ? null
                    : () => _handleRenameDevice(active, isOwned: isOwned),
                label: Text(
                  widget.apiService.isAuthenticated && !isOwned
                      ? 'Gắn & đặt tên'
                      : 'Đổi tên',
                  style: const TextStyle(fontSize: 12),
                ),
              ),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  backgroundColor: AppColors.surface,
                  foregroundColor: AppColors.coralStrong,
                  side: const BorderSide(color: AppColors.coral),
                  minimumSize: const Size(0, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                ),
                icon: const Icon(Icons.delete_outline, size: 16),
                onPressed: _isBusy
                    ? null
                    : () => _handleDeleteDevice(active, isOwned: isOwned),
                label: const Text('Xóa', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.coralSoft,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.coral),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 18, color: AppColors.coralStrong),
          const SizedBox(width: AppSpacing.space2),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.coralStrong,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeviceTile(UserDevice device, {required bool isOwned}) {
    final isCurrent = device.deviceId == widget.apiService.deviceId;
    final cleanName = device.name.trim();
    final title = (cleanName.isNotEmpty && cleanName != device.deviceId)
        ? cleanName
        : 'Trạm ${device.deviceId}';

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.space2),
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(
          color: isCurrent ? AppColors.teal : AppColors.border,
          width: isCurrent ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.sensors,
                size: 19,
                color: device.isOnline ? AppColors.navy : AppColors.textSecondary,
              ),
              const SizedBox(width: AppSpacing.space2),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.navy,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  borderRadius: BorderRadius.circular(5),
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
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: device.isOnline ? AppColors.tealSoft : AppColors.cream,
                  borderRadius: BorderRadius.circular(5),
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
            const SizedBox(height: 4),
            Text(
              device.description!.trim(),
              style: AppTypography.caption,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: AppSpacing.space2),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              if (isCurrent)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
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
                    minimumSize: const Size(0, 34),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                  onPressed: _isBusy
                      ? null
                      : () => _handleSelectDevice(device, isOwned: isOwned),
                  child: const Text('Chọn xem', style: TextStyle(fontSize: 12)),
                ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.navy,
                  minimumSize: const Size(0, 34),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                icon: const Icon(Icons.edit_outlined, size: 17),
                onPressed: _isBusy
                    ? null
                    : () => _handleRenameDevice(device, isOwned: isOwned),
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
                  minimumSize: const Size(0, 34),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                ),
                icon: const Icon(Icons.delete_outline, size: 17),
                onPressed: _isBusy
                    ? null
                    : () => _handleDeleteDevice(device, isOwned: isOwned),
                label: const Text('Xóa', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
