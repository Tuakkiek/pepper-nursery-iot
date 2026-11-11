import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/api_service.dart';
import '../widgets/auth_form_widgets.dart';
import 'register_screen.dart';

/// Màn hình đăng nhập kết nối POST /api/v1/auth/login.
class LoginScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback? onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.apiService,
    this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    widget.apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_onServiceChanged);
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onServiceChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final messenger = ScaffoldMessenger.of(context);
      final user = await widget.apiService.login(
        _usernameController.text,
        _passwordController.text,
      );

      if (!mounted) return;
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop(true);
      }
      widget.onLoginSuccess?.call();
      messenger.showSnackBar(
        SnackBar(
          backgroundColor: AppColors.navy,
          content: Text('Xin chào, ${user.fullName} (${user.role})'),
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

  void _openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => RegisterScreen(
          apiService: widget.apiService,
          onRegisterSuccess: widget.onLoginSuccess,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Nội dung chính của màn hình đăng nhập
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.space4,
                    vertical: AppSpacing.space3,
                  ),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const AuthBrandHeader(
                          title: 'Vườn Ươm Ớt Con',
                          subtitle:
                              'Đăng nhập để theo dõi cảm biến và chăm sóc cây trồng',
                        ),
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
                                const Text(
                                  'Đăng nhập',
                                  style: AppTypography.sectionTitle,
                                ),
                                const SizedBox(height: AppSpacing.space4),
                                if (_errorMessage != null) ...[
                                  AuthErrorBanner(message: _errorMessage!),
                                  const SizedBox(height: AppSpacing.space4),
                                ],
                                AuthLabeledTextField(
                                  controller: _usernameController,
                                  label: 'Tên đăng nhập',
                                  hintText: 'Nhập tên đăng nhập',
                                  prefixIcon: Icons.person_outline,
                                  autofillHints: const [AutofillHints.username],
                                  validator: (val) {
                                    if (val == null || val.trim().isEmpty) {
                                      return 'Vui lòng nhập tên đăng nhập';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: AppSpacing.space4),
                                AuthLabeledTextField(
                                  controller: _passwordController,
                                  label: 'Mật khẩu',
                                  hintText: 'Nhập mật khẩu',
                                  prefixIcon: Icons.lock_outline,
                                  isPassword: true,
                                  textInputAction: TextInputAction.done,
                                  autofillHints: const [AutofillHints.password],
                                  onFieldSubmitted: (_) {
                                    if (!_isSubmitting) _submit();
                                  },
                                  validator: (val) {
                                    if (val == null || val.isEmpty) {
                                      return 'Vui lòng nhập mật khẩu';
                                    }
                                    return null;
                                  },
                                ),
                                const SizedBox(height: AppSpacing.space4),
                                ElevatedButton(
                                  onPressed: _isSubmitting ? null : _submit,
                                  child: _isSubmitting
                                      ? const Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
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
                                            Text('Đang đăng nhập...'),
                                          ],
                                        )
                                      : const Text('Đăng nhập'),
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
                              'Chưa có tài khoản?',
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
                              onPressed: _isSubmitting ? null : _openRegister,
                              child: const Text('Đăng ký ngay'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
