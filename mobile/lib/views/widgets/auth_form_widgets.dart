import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

/// Header nhận diện thương hiệu của màn hình xác thực.
class AuthBrandHeader extends StatelessWidget {
  final String title;
  final String subtitle;

  const AuthBrandHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: AppColors.tealSoft,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.teal, width: 1.5),
          ),
          child: const Icon(
            Icons.eco_rounded,
            size: 32,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: AppSpacing.space4),
        Text(
          title,
          style: AppTypography.pageTitle,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.space1),
        Text(
          subtitle,
          style: AppTypography.caption,
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

/// Khung hiển thị thông báo lỗi xác thực theo Design System.
class AuthErrorBanner extends StatelessWidget {
  final String message;

  const AuthErrorBanner({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.space3),
      decoration: BoxDecoration(
        color: AppColors.coralSoft,
        borderRadius: BorderRadius.circular(AppRadius.control),
        border: Border.all(color: AppColors.coral, width: 1.2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.error_outline,
            color: AppColors.coralStrong,
            size: 20,
          ),
          const SizedBox(width: AppSpacing.space2),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontSize: 13,
                height: 18 / 13,
                fontWeight: FontWeight.w500,
                color: AppColors.coralStrong,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Ô nhập liệu có nhãn cố định phía trên và hỗ trợ ẩn/hiện mật khẩu.
class AuthLabeledTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String hintText;
  final IconData prefixIcon;
  final bool isPassword;
  final TextInputAction textInputAction;
  final Iterable<String>? autofillHints;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onFieldSubmitted;

  const AuthLabeledTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hintText,
    required this.prefixIcon,
    this.isPassword = false,
    this.textInputAction = TextInputAction.next,
    this.autofillHints,
    this.validator,
    this.onFieldSubmitted,
  });

  @override
  State<AuthLabeledTextField> createState() => _AuthLabeledTextFieldState();
}

class _AuthLabeledTextFieldState extends State<AuthLabeledTextField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.navy,
          ),
        ),
        const SizedBox(height: AppSpacing.space2),
        TextFormField(
          controller: widget.controller,
          obscureText: widget.isPassword ? _obscureText : false,
          textInputAction: widget.textInputAction,
          autofillHints: widget.autofillHints,
          validator: widget.validator,
          onFieldSubmitted: widget.onFieldSubmitted,
          style: AppTypography.body,
          decoration: InputDecoration(
            hintText: widget.hintText,
            hintStyle: const TextStyle(
              fontSize: 15,
              color: AppColors.textSecondary,
            ),
            prefixIcon: Icon(
              widget.prefixIcon,
              size: 20,
              color: AppColors.navy,
            ),
            suffixIcon: widget.isPassword
                ? IconButton(
                    icon: Icon(
                      _obscureText
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                    tooltip: _obscureText ? 'Hiện mật khẩu' : 'Ẩn mật khẩu',
                    constraints: const BoxConstraints(
                      minWidth: 44,
                      minHeight: 44,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
