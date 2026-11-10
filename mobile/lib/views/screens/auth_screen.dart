import 'dart:convert';

import 'package:flutter/material.dart';

import '../../controllers/app_controller.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/feedback_card.dart';

class AuthScreen extends StatefulWidget {
  final AppController controller;
  const AuthScreen({super.key, required this.controller});
  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final form = GlobalKey<FormState>();
  final username = TextEditingController(),
      password = TextEditingController(),
      name = TextEditingController(),
      confirm = TextEditingController();
  bool register = false, hidden = true;
  String? error;
  @override
  void dispose() {
    username.dispose();
    password.dispose();
    name.dispose();
    confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.controller.busy || !form.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => error = null);
    try {
      await widget.controller.authenticate(
        username: username.text,
        password: password.text,
        fullName: register ? name.text : null,
      );
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final busy = widget.controller.busy;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: AutofillGroup(
                child: Form(
                  key: form,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.tealSoft,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.spa_outlined,
                            color: AppColors.navy,
                            size: 36,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        register
                            ? 'Bắt đầu vườn ươm của bạn'
                            : 'Chào mừng trở lại',
                        style: AppTypography.pageTitle,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        register
                            ? 'Tạo tài khoản trước. Bạn có thể thêm thiết bị từ hộp sản phẩm sau.'
                            : 'Đăng nhập để theo dõi những thiết bị của bạn.',
                        style: AppTypography.body,
                      ),
                      const SizedBox(height: 24),
                      if (error != null ||
                          widget.controller.sessionMessage != null) ...[
                        FeedbackCard(
                          message: error ?? widget.controller.sessionMessage!,
                        ),
                        const SizedBox(height: 16),
                      ],
                      if (register) ...[
                        TextFormField(
                          controller: name,
                          enabled: !busy,
                          maxLength: 128,
                          textInputAction: TextInputAction.next,
                          autofillHints: const [AutofillHints.name],
                          decoration: const InputDecoration(
                            labelText: 'Họ và tên',
                            counterText: '',
                          ),
                          validator: (v) => v == null || v.trim().isEmpty
                              ? 'Nhập họ và tên của bạn.'
                              : null,
                        ),
                        const SizedBox(height: 16),
                      ],
                      TextFormField(
                        controller: username,
                        enabled: !busy,
                        maxLength: 64,
                        autocorrect: false,
                        textInputAction: TextInputAction.next,
                        autofillHints: const [AutofillHints.username],
                        decoration: const InputDecoration(
                          labelText: 'Tên đăng nhập',
                          counterText: '',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (v) =>
                            (v?.trim().length ?? 0) < (register ? 3 : 1)
                            ? 'Tên đăng nhập cần ít nhất ${register ? 3 : 1} ký tự.'
                            : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: password,
                        enabled: !busy,
                        obscureText: hidden,
                        autocorrect: false,
                        enableSuggestions: false,
                        textInputAction: register
                            ? TextInputAction.next
                            : TextInputAction.done,
                        autofillHints: [
                          register
                              ? AutofillHints.newPassword
                              : AutofillHints.password,
                        ],
                        decoration: InputDecoration(
                          labelText: 'Mật khẩu',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            tooltip: hidden ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                            onPressed: () => setState(() => hidden = !hidden),
                            icon: Icon(
                              hidden
                                  ? Icons.visibility_outlined
                                  : Icons.visibility_off_outlined,
                            ),
                          ),
                        ),
                        onFieldSubmitted: (_) {
                          if (!register) _submit();
                        },
                        validator: (v) {
                          if (v == null || v.length < (register ? 6 : 1)) {
                            return register
                                ? 'Mật khẩu cần ít nhất 6 ký tự.'
                                : 'Nhập mật khẩu.';
                          }
                          if (register && utf8.encode(v).length > 72) {
                            return 'Mật khẩu quá dài (tối đa 72 byte UTF-8).';
                          }
                          return null;
                        },
                      ),
                      if (register) ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: confirm,
                          enabled: !busy,
                          obscureText: hidden,
                          autocorrect: false,
                          enableSuggestions: false,
                          decoration: const InputDecoration(
                            labelText: 'Nhập lại mật khẩu',
                          ),
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          validator: (v) => v != password.text
                              ? 'Mật khẩu nhập lại chưa khớp.'
                              : null,
                        ),
                      ],
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: busy ? null : _submit,
                        child: Text(
                          busy
                              ? 'Đang xử lý…'
                              : register
                              ? 'Tạo tài khoản'
                              : 'Đăng nhập',
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: busy
                            ? null
                            : () => setState(() {
                                register = !register;
                                error = null;
                                password.clear();
                                confirm.clear();
                                form.currentState?.reset();
                              }),
                        child: Text(
                          register
                              ? 'Đã có tài khoản? Đăng nhập'
                              : 'Chưa có tài khoản? Đăng ký',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
