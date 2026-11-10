import 'package:flutter/material.dart';

import '../../controllers/app_controller.dart';
import '../../core/constants/app_colors.dart';
import '../../models/user_device.dart';
import '../widgets/feedback_card.dart';

Future<void> showDeviceForm(
  BuildContext context,
  AppController controller, {
  UserDevice? device,
}) async {
  final success = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => DeviceForm(controller: controller, device: device),
  );
  if (success == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          device == null
              ? 'Đã thêm thiết bị vào tài khoản.'
              : 'Đã đổi tên thiết bị.',
        ),
      ),
    );
  }
}

class DevicesScreen extends StatelessWidget {
  final AppController controller;
  const DevicesScreen({super.key, required this.controller});

  Future<void> _remove(BuildContext context, UserDevice device) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Gỡ thiết bị khỏi tài khoản?'),
        content: Text(
          '“${device.name}” (ID: ${device.id}) sẽ được gỡ khỏi tài khoản. Dữ liệu trên hệ thống vẫn được giữ. Tài khoản khác có thể thêm lại bằng device ID.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Giữ lại'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.coralStrong),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Gỡ thiết bị'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await controller.remove(device.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã gỡ thiết bị khỏi tài khoản.')),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  Future<void> _select(BuildContext context, UserDevice device) async {
    try {
      await controller.select(device.id);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(error.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: controller.refreshDevices,
    child: ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Mỗi thiết bị thuộc một tài khoản. Bạn có thể thêm nhiều thiết bị để theo dõi từng khu vực.',
          style: AppTypography.body,
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: controller.busy || controller.loadingDevices
              ? null
              : () => showDeviceForm(context, controller),
          icon: const Icon(Icons.add),
          label: const Text('Thêm thiết bị'),
        ),
        const SizedBox(height: 24),
        if (controller.loadingDevices) const LinearProgressIndicator(),
        if (controller.deviceError != null)
          FeedbackCard(
            message: controller.deviceError!,
            onRetry: controller.refreshDevices,
          ),
        if (controller.devices.isEmpty &&
            !controller.loadingDevices &&
            controller.deviceError == null)
          const EmptyDevices(),
        for (final device in controller.devices)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.sensors, color: AppColors.navy),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            device.name,
                            style: AppTypography.sectionTitle,
                          ),
                        ),
                        PopupMenuButton<String>(
                          enabled:
                              !controller.busy && !controller.loadingDevices,
                          tooltip: 'Tùy chọn ${device.name}',
                          onSelected: (action) {
                            if (action == 'rename') {
                              showDeviceForm(
                                context,
                                controller,
                                device: device,
                              );
                            } else {
                              _remove(context, device);
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(
                              value: 'rename',
                              child: Text('Đổi tên'),
                            ),
                            PopupMenuItem(
                              value: 'remove',
                              child: Text('Gỡ khỏi tài khoản'),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Text(
                      'Device ID: ${device.id}',
                      style: AppTypography.caption,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      !device.hasReading
                          ? 'Chưa có dữ liệu'
                          : device.isOnline
                          ? 'Đang cập nhật'
                          : 'Chưa có số đo mới',
                      style: AppTypography.caption,
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed:
                          controller.busy ||
                              controller.loadingDevices ||
                              device.id == controller.activeId
                          ? null
                          : () => _select(context, device),
                      icon: Icon(
                        device.id == controller.activeId
                            ? Icons.check_circle_outline
                            : Icons.visibility_outlined,
                      ),
                      label: Text(
                        device.id == controller.activeId
                            ? 'Đang xem trên tổng quan'
                            : 'Chọn thiết bị này',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    ),
  );
}

class EmptyDevices extends StatelessWidget {
  const EmptyDevices({super.key});
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 32),
    child: Column(
      children: [
        Icon(Icons.sensors_outlined, size: 64, color: AppColors.teal),
        SizedBox(height: 24),
        Text(
          'Chưa có thiết bị nào',
          style: AppTypography.pageTitle,
          textAlign: TextAlign.center,
        ),
        SizedBox(height: 12),
        Text(
          'Tìm device ID trong hộp sản phẩm và thêm thiết bị đầu tiên của bạn.',
          style: AppTypography.body,
          textAlign: TextAlign.center,
        ),
      ],
    ),
  );
}

class DeviceForm extends StatefulWidget {
  final AppController controller;
  final UserDevice? device;
  const DeviceForm({super.key, required this.controller, this.device});
  @override
  State<DeviceForm> createState() => _DeviceFormState();
}

class _DeviceFormState extends State<DeviceForm> {
  final form = GlobalKey<FormState>();
  final id = TextEditingController();
  late final TextEditingController name = TextEditingController(
    text: widget.device?.name,
  );
  bool saving = false;
  String? error;
  @override
  void dispose() {
    id.dispose();
    name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (saving || !form.currentState!.validate()) return;
    setState(() {
      saving = true;
      error = null;
    });
    try {
      if (widget.device == null) {
        await widget.controller.claim(id.text, name.text);
      } else {
        await widget.controller.rename(widget.device!.id, name.text);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        setState(() {
          saving = false;
          error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) => PopScope(
    canPop: !saving,
    child: Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: form,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                widget.device == null ? 'Thêm thiết bị' : 'Đổi tên thiết bị',
                style: AppTypography.pageTitle,
              ),
              const SizedBox(height: 12),
              Text(
                widget.device == null
                    ? 'Nhập đúng device ID được in trong hộp sản phẩm.'
                    : 'Device ID: ${widget.device!.id}',
                style: AppTypography.body,
              ),
              const SizedBox(height: 24),
              if (error != null) ...[
                FeedbackCard(message: error!),
                const SizedBox(height: 16),
              ],
              if (widget.device == null) ...[
                TextFormField(
                  controller: id,
                  enabled: !saving,
                  maxLength: 64,
                  autocorrect: false,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Device ID',
                    hintText: 'Mã trong hộp sản phẩm',
                  ),
                  validator: (v) => v == null || v.trim().isEmpty
                      ? 'Vui lòng nhập device ID.'
                      : null,
                ),
                const SizedBox(height: 16),
              ],
              TextFormField(
                controller: name,
                enabled: !saving,
                maxLength: 128,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: widget.device == null
                      ? 'Tên gợi nhớ (không bắt buộc)'
                      : 'Tên gợi nhớ',
                  hintText: 'Ví dụ: Khay ớt ban công',
                ),
                onFieldSubmitted: (_) => _save(),
                validator: (v) =>
                    widget.device != null && (v == null || v.trim().isEmpty)
                    ? 'Vui lòng nhập tên thiết bị.'
                    : null,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: saving ? null : _save,
                child: Text(
                  saving
                      ? 'Đang lưu…'
                      : widget.device == null
                      ? 'Thêm vào tài khoản'
                      : 'Lưu tên',
                ),
              ),
              TextButton(
                onPressed: saving ? null : () => Navigator.pop(context),
                child: const Text('Hủy'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
