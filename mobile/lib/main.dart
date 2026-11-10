import 'dart:async';

import 'package:flutter/material.dart';

import 'controllers/app_controller.dart';
import 'core/constants/app_colors.dart';
import 'core/constants/app_theme.dart';
import 'services/api_service.dart';
import 'services/session_store.dart';
import 'views/screens/auth_screen.dart';
import 'views/screens/dashboard_screen.dart';
import 'views/screens/devices_screen.dart';
import 'views/screens/history_screen.dart';
import 'views/widgets/feedback_card.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const PepperNurseryApp());
}

class PepperNurseryApp extends StatefulWidget {
  final AppController? controller;
  const PepperNurseryApp({super.key, this.controller});
  @override
  State<PepperNurseryApp> createState() => _PepperNurseryAppState();
}

class _PepperNurseryAppState extends State<PepperNurseryApp>
    with WidgetsBindingObserver {
  late final AppController controller;
  @override
  void initState() {
    super.initState();
    final api = widget.controller?.api ?? ApiService();
    controller =
        widget.controller ??
        AppController(api: api, sessions: SecureSessionStore(api.baseUrl));
    WidgetsBinding.instance.addObserver(this);
    unawaited(controller.restore());
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) =>
      controller.setForeground(state == AppLifecycleState.resumed);
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    if (widget.controller == null) controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: controller,
    builder: (context, _) => MaterialApp(
      // Discard authenticated routes and open dialogs when the session ends.
      key: ValueKey(controller.user?.id),
      title: 'Vườn ươm của tôi',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: controller.restoring
          ? const Scaffold(
              body: Center(
                child: CircularProgressIndicator(
                  semanticsLabel: 'Đang mở tài khoản',
                ),
              ),
            )
          : controller.startupError != null
          ? Scaffold(
              body: SafeArea(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        FeedbackCard(
                          message: controller.startupError!,
                          onRetry: controller.restore,
                        ),
                        TextButton(
                          onPressed: controller.logout,
                          child: const Text('Đăng nhập lại'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            )
          : controller.authenticated
          ? MainNavigationScreen(controller: controller)
          : AuthScreen(controller: controller),
    ),
  );
}

class MainNavigationScreen extends StatefulWidget {
  final AppController controller;
  const MainNavigationScreen({super.key, required this.controller});
  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int index = 0;
  void _account() {
    final c = widget.controller;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.account_circle_outlined,
                size: 40,
                color: AppColors.navy,
              ),
              const SizedBox(height: 16),
              Text(c.user!.fullName, style: AppTypography.pageTitle),
              Text('@${c.user!.username}', style: AppTypography.caption),
              const SizedBox(height: 12),
              Text('${c.devices.length} thiết bị trong tài khoản'),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  unawaited(c.logout());
                },
                icon: const Icon(Icons.logout),
                label: const Text('Đăng xuất'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    final body = switch (index) {
      0 => DashboardScreen(
        controller: c,
        onManage: () => setState(() => index = 2),
      ),
      1 =>
        c.activeDevice == null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: FeedbackCard(
                    message: 'Chọn thiết bị trong mục Thiết bị để xem lịch sử.',
                    isError: false,
                  ),
                ),
              )
            : HistoryScreen(
                key: ValueKey(c.activeId),
                apiService: c.api,
                deviceId: c.activeId!,
                deviceName: c.activeDevice!.name,
              ),
      _ => DevicesScreen(controller: c),
    };
    return Scaffold(
      appBar: AppBar(
        title: Text(
          ['Vườn ươm của tôi', 'Lịch sử số đo', 'Thiết bị của tôi'][index],
        ),
        actions: [
          IconButton(
            onPressed: c.busy ? null : _account,
            tooltip: 'Tài khoản',
            icon: const Icon(Icons.account_circle_outlined),
          ),
        ],
      ),
      body: SafeArea(child: body),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.tealSoft,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view),
            label: 'Tổng quan',
          ),
          NavigationDestination(icon: Icon(Icons.show_chart), label: 'Lịch sử'),
          NavigationDestination(icon: Icon(Icons.sensors), label: 'Thiết bị'),
        ],
      ),
    );
  }
}
