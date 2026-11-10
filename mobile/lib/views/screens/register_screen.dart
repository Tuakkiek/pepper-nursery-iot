import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/api_service.dart';
import '../widgets/auth_form_widgets.dart';

/// Màn hình đăng ký tài khoản mới kết nối POST /api/v1/auth/register.
class RegisterScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback? onRegisterSuccess;

  const RegisterScreen({
    super.key,
    required this.apiService,
    this.onRegisterSuccess,
  });

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _fullNameController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final messenger = ScaffoldMessenger.of(context);
      final user = await widget.apiService.register(
        fullName: _fullNameController.text,
        username: _usernameController.text,
        password: _passwordController.text,
      );

      if (!mounted) return;
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop(true);
      }
      widget.onRegisterSuccess?.call();
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: AppColors.navy,
          content: Text('Đăng ký thành công! Xin chào ${user.fullName}.'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isFixture = widget.apiService.mode == DataSourceMode.fixture;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Đăng ký tài khoản'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.space4,
              vertical: AppSpacing.space4,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const AuthBrandHeader(
                    title: 'Tạo tài khoản mới',
                    subtitle:
                        'Đăng ký để theo dõi số đo và chăm sóc vườn ươm ớt con',
                  ),
                  if (isFixture) ...[
                    const SizedBox(height: AppSpacing.space3),
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.tealSoft,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.teal),
                        ),
                        child: const Text(
                          'Đang ở chế độ Dữ liệu mẫu (Fixture G0)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.navy,
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.space6),
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.space4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(AppRadius.card),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_errorMessage != null) ...[
                            AuthErrorBanner(message: _errorMessage!),
                            const SizedBox(height: AppSpacing.space4),
                          ],
                          AuthLabeledTextField(
                            controller: _fullNameController,
                            label: 'Họ và tên',
                            hintText: 'Ví dụ: Nguyễn Văn A',
                            prefixIcon: Icons.badge_outlined,
                            autofillHints: const [AutofillHints.name],
                            validator: (val) {
                              if (val == null || val.trim().isEmpty) {
                                return 'Vui lòng nhập họ và tên';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.space4),
                          AuthLabeledTextField(
                            controller: _usernameController,
                            label: 'Tên đăng nhập',
                            hintText: 'Tối thiểu 3 ký tự',
                            prefixIcon: Icons.person_outline,
                            autofillHints: const [AutofillHints.newUsername],
                            validator: (val) {
                              final clean = val?.trim() ?? '';
                              if (clean.length < 3) {
                                return 'Tên đăng nhập phải có ít nhất 3 ký tự';
                              }
                              if (RegExp(r'\s').hasMatch(clean)) {
                                return 'Tên đăng nhập không được chứa khoảng trắng';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.space4),
                          AuthLabeledTextField(
                            controller: _passwordController,
                            label: 'Mật khẩu',
                            hintText: 'Tối thiểu 6 ký tự',
                            prefixIcon: Icons.lock_outline,
                            isPassword: true,
                            autofillHints: const [AutofillHints.newPassword],
                            validator: (val) {
                              if (val == null || val.length < 6) {
                                return 'Mật khẩu phải có ít nhất 6 ký tự';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.space4),
                          AuthLabeledTextField(
                            controller: _confirmPasswordController,
                            label: 'Xác nhận mật khẩu',
                            hintText: 'Nhập lại mật khẩu',
                            prefixIcon: Icons.lock_reset_outlined,
                            isPassword: true,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) {
                              if (!_isSubmitting) _submit();
                            },
                            validator: (val) {
                              if (val == null || val.isEmpty) {
                                return 'Vui lòng xác nhận mật khẩu';
                              }
                              if (val != _passwordController.text) {
                                return 'Mật khẩu xác nhận không khớp';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.space6),
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : _submit,
                            child: _isSubmitting
                                ? const Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      ),
                                      SizedBox(width: AppSpacing.space2),
                                      Text('Đang tạo tài khoản...'),
                                    ],
                                  )
                                : const Text('Đăng ký'),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.space4),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        'Đã có tài khoản?',
                        style: AppTypography.caption,
                      ),
                      TextButton(
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.navy,
                          minimumSize: const Size(44, 44),
                          textStyle: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        onPressed: _isSubmitting
                            ? null
                            : () => Navigator.of(context).pop(),
                        child: const Text('Đăng nhập'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
