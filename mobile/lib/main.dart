import 'package:flutter/material.dart';
import 'core/constants/app_colors.dart';
import 'core/constants/app_theme.dart';
import 'models/sensor_reading.dart';
import 'services/api_service.dart';
import 'views/screens/care_screen.dart';
import 'views/screens/dashboard_screen.dart';
import 'views/screens/history_screen.dart';

void main() {
  runApp(const PepperNurseryApp());
}

class PepperNurseryApp extends StatelessWidget {
  const PepperNurseryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vườn Ươm Ớt Con',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  late final ApiService _apiService;
  LatestReadingResponse? _cachedLatestData;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _fetchCachedLatest();
    _apiService.addListener(_onServiceChanged);
  }

  @override
  void dispose() {
    _apiService.removeListener(_onServiceChanged);
    super.dispose();
  }

  void _onServiceChanged() {
    _fetchCachedLatest();
  }

  Future<void> _fetchCachedLatest() async {
    try {
      final data = await _apiService.fetchLatestReading();
      if (mounted) {
        setState(() {
          _cachedLatestData = data;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(apiService: _apiService),
      HistoryScreen(apiService: _apiService),
      CareScreen(
        apiService: _apiService,
        latestData: _cachedLatestData,
      ),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.border, width: 1.0),
          ),
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
          ],
        ),
      ),
    );
  }
}
