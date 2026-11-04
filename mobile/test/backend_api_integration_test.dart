import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/models/auth_user.dart';
import 'package:pepper_nursery_mobile/models/care_rule.dart';
import 'package:pepper_nursery_mobile/models/sensor_reading.dart';
import 'package:pepper_nursery_mobile/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late ApiService apiService;

  setUp(() {
    apiService = ApiService();
    apiService.mode = DataSourceMode.live;
    apiService.baseUrl = 'http://localhost:8000';
    apiService.deviceId = 'esp32-nursery-01';
  });

  test('Kiểm tra cấu hình mặc định kết nối Backend TDat (Port 8000)', () {
    expect(apiService.baseUrl.contains('8000'), isTrue);
    expect(apiService.deviceId, 'esp32-nursery-01');
    expect(apiService.mode, DataSourceMode.live);
  });

  test('Phân tích phản hồi Rule từ Backend (/api/v1/rules)', () {
    final ruleJson = {
      'id': 1,
      'rule_code': 'RULE_AIR_TEMP_OPTIMAL',
      'name': 'Nhiệt độ không khí vườn ươm',
      'description': 'Giữ nhiệt độ phù hợp cho cây ớt con',
      'parameter': 'air_temperature_c',
      'operator': 'between',
      'threshold_min': 25.0,
      'threshold_max': 30.0,
      'severity': 'info',
      'action_advice': 'Duy trì thông gió tự nhiên',
      'is_active': 1,
    };

    final rule = CareRule.fromJson(ruleJson);
    expect(rule.id, 1);
    expect(rule.ruleCode, 'RULE_AIR_TEMP_OPTIMAL');
    expect(rule.parameter, 'air_temperature_c');
    expect(rule.thresholdMin, 25.0);
    expect(rule.thresholdMax, 30.0);
    expect(rule.isActive, isTrue);
    expect(rule.conditionText, '25.0 – 30.0');
    expect(rule.parameterLabel, 'Nhiệt độ không khí (°C)');
  });

  test('Phân tích phản hồi Auth JWT từ Backend (/api/v1/auth/login)', () {
    final userJson = {
      'id': 1,
      'username': 'admin',
      'role': 'admin',
      'full_name': 'Hệ Thống Quản Trị',
    };

    final user = AuthUser.fromJson(userJson);
    expect(user.id, 1);
    expect(user.username, 'admin');
    expect(user.role, 'admin');
    expect(user.isAdmin, isTrue);
  });

  test('Phân tích phản hồi Latest Reading từ Backend', () {
    final latestJson = {
      'device_id': 'esp32-nursery-01',
      'reading': {
        'schema_version': '0.1',
        'device_id': 'esp32-nursery-01',
        'sample_id': 'ts-entry-102',
        'recorded_at': '2026-11-04T08:00:00Z',
        'air_temperature_c': 28.5,
        'air_humidity_pct': 75.0,
        'soil_temperature_c': 26.8,
        'soil_moisture_raw': 1820,
        'soil_moisture_pct': 52.0,
        'water_tds_adc_raw': 1550,
        'water_tds_ppm': 610.0,
        'water_ph_adc_raw': 1925,
        'water_ph': 6.5,
        'sensor_status': {
          'dht22': 'ok',
          'hd38': 'ok',
          'ds18b20': 'ok',
          'tds': 'ok',
          'ph4502c': 'ok',
        },
      },
      'received_at': '2026-11-04T08:00:03Z',
      'is_stale': false,
      'advice': null,
    };

    final response = LatestReadingResponse.fromJson(latestJson);
    expect(response.deviceId, 'esp32-nursery-01');
    expect(response.isStale, false);
    expect(response.reading, isNotNull);
    expect(response.reading!.sampleId, 'ts-entry-102');
    expect(response.reading!.airTemperatureC, 28.5);
    expect(response.reading!.waterPh, 6.5);
  });
}

