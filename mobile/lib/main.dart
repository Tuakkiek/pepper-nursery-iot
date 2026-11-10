import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:device_preview/device_preview.dart';

import 'core/constants/app_colors.dart';
import 'core/constants/app_theme.dart';
import 'models/sensor_reading.dart';
import 'services/api_service.dart';
import 'views/screens/account_screen.dart';
import 'views/screens/care_screen.dart';
import 'views/screens/dashboard_screen.dart';
import 'views/screens/history_screen.dart';
import 'views/screens/login_screen.dart';

void main() {
  runApp(
    DevicePreview(
      enabled: !kReleaseMode,
      builder: (context) => const PepperNurseryApp(),
    ),
  );
}

class PepperNurseryApp extends StatefulWidget {
  final ApiService? apiService;
  final bool skipAuthGate;

  const PepperNurseryApp({
    super.key,
    this.apiService,
    this.skipAuthGate = false,
  });

  @override
  State<PepperNurseryApp> createState() => _PepperNurseryAppState();
}

class _PepperNurseryAppState extends State<PepperNurseryApp> {
  ApiService? _apiService;
  bool _ownsApiService = false;
  bool _isGuestMode = false;
  bool _lastIsAuthenticated = false;

  ApiService get _service {
    if (_apiService == null) {
      _ownsApiService = widget.apiService == null;
      _apiService = widget.apiService ?? ApiService();
      _lastIsAuthenticated = _apiService!.isAuthenticated;
      _apiService!.addListener(_onServiceChanged);
    }
    return _apiService!;
  }

  @override
  void initState() {
    super.initState();
    _service;
  }

  @override
  void dispose() {
    final service = _apiService;
    if (service != null) {
      service.removeListener(_onServiceChanged);
      if (_ownsApiService) {
        service.dispose();
      }
    }
    super.dispose();
  }

  void _onServiceChanged() {
    final isAuthenticated = _service.isAuthenticated;
    if (_lastIsAuthenticated != isAuthenticated) {
      _lastIsAuthenticated = isAuthenticated;
      if (mounted) {
        setState(() {});
      }
    }
  }

  void _enterGuestMode() {
    setState(() {
      _isGuestMode = true;
    });
  }

  void _openLoginScreen() {
    setState(() {
      _isGuestMode = false;
    });
  }

  void _handleLogout() {
    setState(() {
      _isGuestMode = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final service = _service;
    final showMainApp =
        widget.skipAuthGate || service.isAuthenticated || _isGuestMode;

    return MaterialApp(
      title: 'Vườn Ươm Ớt Con',
      debugShowCheckedModeBanner: false,
      locale: DevicePreview.locale(context),
      builder: DevicePreview.appBuilder,
      theme: AppTheme.lightTheme,
      home: showMainApp
          ? MainNavigationScreen(
              apiService: service,
              onOpenLogin: _openLoginScreen,
              onLogout: _handleLogout,
            )
          : LoginScreen(
              apiService: service,
              onContinueAsGuest: _enterGuestMode,
            ),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  final ApiService? apiService;
  final VoidCallback? onOpenLogin;
  final VoidCallback? onLogout;

  const MainNavigationScreen({
    super.key,
    this.apiService,
    this.onOpenLogin,
    this.onLogout,
  });

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  ApiService? _apiService;
  bool _ownsApiService = false;
  LatestReadingResponse? _cachedLatestData;

  ApiService get _service {
    if (_apiService == null) {
      _ownsApiService = widget.apiService == null;
      _apiService = widget.apiService ?? ApiService();
      _cachedLatestData = _apiService!.latestReading;
      _apiService!.checkHealth();
      _apiService!.addListener(_onServiceChanged);
    }
    return _apiService!;
  }

  @override
  void initState() {
    super.initState();
    _service;
  }

  @override
  void dispose() {
    final service = _apiService;
    if (service != null) {
      service.removeListener(_onServiceChanged);
      if (_ownsApiService) {
        service.dispose();
      }
    }
    super.dispose();
  }

  void _onServiceChanged() {
    final latest = _service.latestReading;
    if (latest != _cachedLatestData && mounted) {
      setState(() {
        _cachedLatestData = latest;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = _service;
    final screens = [
      DashboardScreen(
        apiService: service,
        onOpenLogin: widget.onOpenLogin,
        onLogout: widget.onLogout,
      ),
      HistoryScreen(apiService: service),
      CareScreen(apiService: service, latestData: _cachedLatestData),
      AccountScreen(
        apiService: service,
        onOpenLogin: widget.onOpenLogin,
        onLogout: widget.onLogout,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.border, width: 1.0)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          selectedItemColor: AppColors.navy,
          unselectedItemColor: AppColors.textSecondary,
          backgroundColor: AppColors.surface,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Tổng quan',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.show_chart_outlined),
              activeIcon: Icon(Icons.show_chart),
              label: 'Lịch sử',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.eco_outlined),
              activeIcon: Icon(Icons.eco),
              label: 'Chăm sóc',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Tài khoản',
            ),
          ],
        ),
      ),
    );
  }
}
