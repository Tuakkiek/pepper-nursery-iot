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
    apiService.baseUrl = ApiService.defaultCloudUrl;
    apiService.deviceId = ApiService.defaultDeviceId;
  });

  test('Kiểm tra cấu hình mặc định kết nối Backend Cloud Render', () {
    expect(apiService.baseUrl, equals('https://pepper-nursery-iot.onrender.com'));
    expect(apiService.deviceId, equals('1'));
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

  test('Phân tích phản hồi thực tế từ Backend Cloud Render với cảm biến lỗi & stale', () {
    final liveRenderJson = {
      'device_id': 'esp32-nursery-01',
      'reading': {
        'water_ph': null,
        'device_id': 'esp32-nursery-01',
        'sample_id': 'ts-entry-442',
        'recorded_at': '2026-11-06T12:14:24.000Z',
        'sensor_status': {
          'tds': 'read_error',
          'hd38': 'read_error',
          'dht22': 'read_error',
          'ds18b20': 'ok',
          'ph4502c': 'read_error',
        },
        'water_tds_ppm': null,
        'schema_version': '0.1',
        'air_humidity_pct': null,
        'water_ph_adc_raw': null,
        'air_temperature_c': null,
        'soil_moisture_pct': null,
        'soil_moisture_raw': null,
        'water_tds_adc_raw': null,
        'soil_temperature_c': 4.37837,
      },
      'received_at': '2026-11-06T12:14:26.935Z',
      'is_stale': true,
      'advice': null,
    };

    final res = LatestReadingResponse.fromJson(liveRenderJson);
    expect(res.deviceId, 'esp32-nursery-01');
    expect(res.isStale, isTrue);
    expect(res.reading, isNotNull);
    expect(res.reading!.soilTemperatureC, closeTo(4.378, 0.001));
    expect(res.reading!.airTemperatureC, isNull);
    expect(res.reading!.sensorStatus.ds18b20, 'ok');
    expect(res.reading!.sensorStatus.dht22, 'read_error');
  });

  test('Phân tích danh sách lịch sử HistoryResponse từ Backend', () {
    final historyJson = {
      'device_id': 'esp32-nursery-01',
      'limit': 2,
      'readings': [
        {
          'reading': {
            'device_id': 'esp32-nursery-01',
            'sample_id': 'ts-entry-442',
            'soil_temperature_c': 4.378,
            'sensor_status': {'ds18b20': 'ok'},
          },
          'received_at': '2026-11-06T12:14:26.935Z',
        },
        {
          'reading': {
            'device_id': 'esp32-nursery-01',
            'sample_id': 'ts-entry-441',
            'soil_temperature_c': 4.386,
            'sensor_status': {'ds18b20': 'ok'},
          },
          'received_at': '2026-11-06T12:14:06.921Z',
        },
      ],
    };

    final history = HistoryResponse.fromJson(historyJson);
    expect(history.deviceId, 'esp32-nursery-01');
    expect(history.limit, 2);
    expect(history.readings.length, 2);
    expect(history.readings[0].reading.sampleId, 'ts-entry-442');
  });

  test('Kiểm tra chế độ Fixture Auth và Sync ThingSpeak khi không có mạng', () async {
    apiService.mode = DataSourceMode.fixture;

    // Đăng nhập fixture
    final user = await apiService.login('admin', 'admin123');
    expect(user.username, 'admin');
    expect(apiService.isAuthenticated, isTrue);

    // Đồng bộ fixture
    final syncRes = await apiService.triggerThingSpeakSync();
    expect(syncRes['status'], 'ok');
    expect(syncRes['fetched'], 20);

    // Đăng xuất
    apiService.logout();
    expect(apiService.isAuthenticated, isFalse);

    // Đăng ký tài khoản mới ở chế độ Fixture
    final registered = await apiService.register(
      fullName: 'Nguyễn Văn Thử',
      username: 'nongdan01',
      password: 'password123',
    );
    expect(registered.username, 'nongdan01');
    expect(registered.fullName, 'Nguyễn Văn Thử');
    expect(registered.role, 'user');
    expect(apiService.isAuthenticated, isTrue);

    // Đăng ký trùng tên phải báo lỗi
    expect(
      () => apiService.register(
        fullName: 'Trùng Tên',
        username: 'nongdan01',
        password: 'password123',
      ),
      throwsA(isA<Exception>()),
    );
  });

  test('Phân tích phản hồi thực tế từ Sensor Data Bridge qua Backend (device_id = 1)', () {
    final liveBridgeJson = {
      'device_id': '1',
      'name': 'esp32-nursery-01',
      'reading': {
        'water_ph': 4.24,
        'device_id': '1',
        'sample_id': 'sdb-entry-870',
        'recorded_at': '2026-11-10T16:57:57.000Z',
        'sensor_status': {
          'tds': 'ok',
          'hd38': 'ok',
          'dht22': 'ok',
          'ds18b20': 'ok',
          'ph4502c': 'ok',
        },
        'water_tds_ppm': 58.5,
        'schema_version': '0.1',
        'air_humidity_pct': 79.1,
        'water_ph_adc_raw': 923,
        'air_temperature_c': 30.4,
        'soil_moisture_pct': 0,
        'soil_moisture_raw': 4078,
        'water_tds_adc_raw': null,
        'soil_temperature_c': 29.56,
      },
      'received_at': '2026-11-10T16:58:13.148Z',
      'is_stale': false,
      'advice': {
        'status': 'danger',
        'message': 'Nước tưới cực chua (Axit nặng)',
        'suggested_action': 'Không tưới nước này cho cây con',
      },
    };

    final res = LatestReadingResponse.fromJson(liveBridgeJson);
    expect(res.deviceId, '1');
    expect(res.deviceName, 'esp32-nursery-01');
    expect(res.isStale, isFalse);
    expect(res.adviceStatus, 'danger');
    expect(res.adviceMessage, 'Nước tưới cực chua (Axit nặng)');
    expect(res.suggestedAction, 'Không tưới nước này cho cây con');
    expect(res.reading, isNotNull);
    expect(res.reading!.sampleId, 'sdb-entry-870');
    expect(res.reading!.soilTemperatureC, closeTo(29.56, 0.001));
    expect(res.reading!.waterPh, closeTo(4.24, 0.001));
    expect(res.reading!.soilMoisturePct, 0.0);
  });

  test('Đổi deviceId, baseUrl hoặc currentScenario phải xóa cache latestReading', () async {
    apiService.mode = DataSourceMode.fixture;
    apiService.currentScenario = FixtureScenario.normal;
    await apiService.fetchLatestReading();
    expect(apiService.latestReading, isNotNull);

    apiService.currentScenario = FixtureScenario.partialError;
    expect(apiService.latestReading, isNull);

    await apiService.fetchLatestReading();
    expect(apiService.latestReading, isNotNull);

    apiService.deviceId = 'esp32-stale-01';
    expect(apiService.latestReading, isNull);

    await apiService.fetchLatestReading();
    expect(apiService.latestReading, isNotNull);

    apiService.baseUrl = 'http://localhost:8000';
    expect(apiService.latestReading, isNull);
  });

  test('Kiểm tra cấu hình và chức năng tự động cập nhật dữ liệu mỗi 5s', () async {
    // Mặc định tự động cập nhật là bật và chu kỳ là 5 giây
    expect(apiService.autoRefresh, isTrue);
    expect(apiService.refreshIntervalSeconds, equals(5));

    // Đổi chu kỳ sang 10 giây
    apiService.refreshIntervalSeconds = 10;
    expect(apiService.refreshIntervalSeconds, equals(10));

    // Chuyển sang Fixture và gọi pollLatestReading
    apiService.mode = DataSourceMode.fixture;
    apiService.currentScenario = FixtureScenario.normal;

    final polled = await apiService.pollLatestReading();
    expect(polled, isNotNull);
    expect(apiService.latestReading, isNotNull);
    expect(apiService.latestReading!.deviceId, equals('esp32-nursery-01'));
    expect(apiService.lastRefreshedAt, isNotNull);

    // Bật / tắt autoRefresh
    apiService.autoRefresh = false;
    expect(apiService.autoRefresh, isFalse);
    apiService.stopAutoRefresh();
  });

  test('Phân tích RangeReadingsResponse từ Backend (/readings/range) và lọc Fixture theo thời gian', () async {
    final rangeJson = {
      'device_id': '1',
      'start_date': '2026-11-10',
      'end_date': '2026-11-11',
      'total': 76,
      'page': 1,
      'page_size': 10,
      'total_pages': 8,
      'readings': [
        {
          'reading': {
            'schema_version': '0.1',
            'device_id': '1',
            'sample_id': 'sdb-entry-951',
            'recorded_at': '2026-11-10T17:26:48.000Z',
            'air_temperature_c': 30.4,
            'air_humidity_pct': 79.3,
            'soil_temperature_c': 29.37,
            'soil_moisture_raw': 4089,
            'soil_moisture_pct': 0,
            'water_tds_adc_raw': null,
            'water_tds_ppm': 58.5,
            'water_ph_adc_raw': 919,
            'water_ph': 4.26,
            'sensor_status': {
              'dht22': 'ok',
              'hd38': 'ok',
              'ds18b20': 'ok',
              'tds': 'ok',
              'ph4502c': 'ok',
            },
          },
          'received_at': '2026-11-10T17:27:04.463Z',
        },
      ],
    };

    final parsed = RangeReadingsResponse.fromJson(rangeJson);
    expect(parsed.deviceId, '1');
    expect(parsed.total, 76);
    expect(parsed.pageSize, 10);
    expect(parsed.totalPages, 8);
    expect(parsed.readings.length, 1);
    expect(parsed.readings.first.reading.waterPh, closeTo(4.26, 0.001));

    // Kiểm tra fetchRangeReadings mặc định pageSize = 10 ở chế độ Fixture
    apiService.mode = DataSourceMode.fixture;
    final fixtureRange = await apiService.fetchRangeReadings(
      startLocal: DateTime.utc(2026, 11, 4, 8, 0, 0).toLocal(),
      endLocal: DateTime.utc(2026, 11, 4, 8, 5, 0).toLocal(),
      order: 'asc',
    );
    expect(fixtureRange.pageSize, 10);
    expect(fixtureRange.total, 2);
    expect(fixtureRange.readings.first.reading.sampleId, 'sample-0001');
    expect(fixtureRange.readings.last.reading.sampleId, 'sample-0002');
  });

  test('Tải danh sách thiết bị, thêm thiết bị mới và đổi tên thiết bị (Fixture)', () async {
    apiService.mode = DataSourceMode.fixture;

    final devices = await apiService.fetchAllDevices();
    expect(devices, isNotEmpty);
    expect(devices.first.deviceId, '1');
    expect(apiService.activeDeviceName, 'Trạm vườn ươm Khay A');

    final detail = await apiService.fetchCurrentDeviceDetail();
    expect(detail, isNotNull);
    expect(detail!.deviceId, '1');

    // Thêm thiết bị mới và tự động kích hoạt
    final added = await apiService.addDevice(
      deviceId: 'esp32-khay-02',
      name: 'Vườn ươm Khay B',
    );
    expect(added.deviceId, 'esp32-khay-02');
    expect(added.name, 'Vườn ươm Khay B');
    expect(apiService.deviceId, 'esp32-khay-02');
    expect(apiService.activeDeviceName, 'Vườn ươm Khay B');

    // Đặt/đổi tên thiết bị mới tạo
    final renamed = await apiService.renameDevice(
      'esp32-khay-02',
      'Khay B Nhà Kính',
    );
    expect(renamed.name, 'Khay B Nhà Kính');
    expect(apiService.activeDeviceName, 'Khay B Nhà Kính');

    // Chuyển lại trạm ID 1
    await apiService.selectActiveDevice('1', isOwned: true);
    expect(apiService.deviceId, '1');
    expect(apiService.activeDeviceName, 'Trạm vườn ươm Khay A');

    // Xóa thiết bị đang theo dõi -> tự động chuyển về thiết bị còn lại
    await apiService.selectActiveDevice('esp32-khay-02');
    await apiService.deleteDevice('esp32-khay-02');
    final afterDelete = await apiService.fetchAllDevices();
    expect(afterDelete.any((d) => d.deviceId == 'esp32-khay-02'), isFalse);
    expect(apiService.deviceId, '1');
    expect(apiService.activeDeviceName, 'Trạm vườn ươm Khay A');
  });

  test('Phân tích phản hồi số đo kèm lời khuyên CareAdvice theo Hợp đồng Mục 5.1', () {
    final contractJson = {
      'device_id': 'esp32-nursery-01',
      'received_at': '2026-11-10T08:02:17.717Z',
      'is_stale': false,
      'reading': {
        'schema_version': '0.1',
        'device_id': 'esp32-nursery-01',
        'sample_id': 'sdb-entry-113',
        'recorded_at': '2026-11-08T06:14:53.000Z',
        'air_temperature_c': 32.7,
        'air_humidity_pct': 69.5,
        'soil_temperature_c': 32.0,
        'soil_moisture_pct': 0.0,
        'soil_moisture_raw': 4095,
        'water_ph': 3.28,
        'water_ph_adc_raw': 1022,
        'water_tds_ppm': 58.5,
        'water_tds_adc_raw': null,
        'sensor_status': {
          'dht22': 'ok',
          'ds18b20': 'ok',
          'hd38': 'ok',
          'tds': 'ok',
          'ph4502c': 'ok',
        },
      },
      'advice': {
        'version': '0.1',
        'status': 'danger',
        'priority': 2,
        'code': 'RULE_TEMP_EXTREME_HIGH',
        'message': 'Nhiệt độ không khí cực cao: Kéo lưới che 70% nắng, bật phun sương mái làm mát.',
        'suggested_action': 'Kéo lưới che 70% nắng, bật phun sương mái làm mát.',
      },
    };

    final response = LatestReadingResponse.fromJson(contractJson);
    expect(response.deviceId, equals('esp32-nursery-01'));
    expect(response.isStale, isFalse);
    expect(response.reading, isNotNull);
    expect(response.reading!.sampleId, equals('sdb-entry-113'));
    expect(response.reading!.airTemperatureC, equals(32.7));
    expect(response.reading!.waterPh, equals(3.28));

    // Kiểm tra cấu trúc Advice
    expect(response.advice, isNotNull);
    expect(response.advice!.status, equals('danger'));
    expect(response.advice!.isDanger, isTrue);
    expect(response.advice!.code, equals('RULE_TEMP_EXTREME_HIGH'));
    expect(response.advice!.suggestedAction, isNotNull);
    expect(response.adviceMessage, contains('Nhiệt độ không khí cực cao'));
  });

  test('Kiểm tra chế độ dự phòng Sensor Data Bridge (Mục 7)', () {
    expect(ApiService.sensorBridgeBaseUrl, contains('sensor-data-bridge-backend.onrender.com'));
    expect(ApiService.sensorBridgeApiKey, startsWith('sdb_read_'));

    apiService.mode = DataSourceMode.bridge;
    expect(apiService.mode, equals(DataSourceMode.bridge));
  });

  test('Kiểm tra CRUD quy tắc chăm sóc và đồng bộ Bridge trong ApiService', () async {
    apiService.mode = DataSourceMode.fixture;

    // 1. Đồng bộ Bridge
    final bridgeSync = await apiService.triggerBridgeSync();
    expect(bridgeSync['status'], equals('ok'));
    expect(bridgeSync['fetched'], equals(20));

    // 2. Thêm quy tắc
    const newRule = CareRule(
      ruleCode: 'RULE_TEST',
      name: 'Quy tắc thử nghiệm',
      parameter: 'air_temperature_c',
      operator: '>',
      thresholdMax: 35.0,
      actionAdvice: 'Làm mát khẩn cấp',
    );
    final created = await apiService.createRule(newRule);
    expect(created.ruleCode, equals('RULE_TEST'));

    // 3. Sửa quy tắc
    final updated = await apiService.updateRule(1, newRule);
    expect(updated.name, equals('Quy tắc thử nghiệm'));

    // 4. Xóa quy tắc
    final deleted = await apiService.deleteRule(1);
    expect(deleted, isTrue);
  });

  test('Kiểm tra tự động đánh giá nông học cục bộ khi Backend trả về advice: null', () {
    // Trường hợp nước tưới cực chua (pH = 4.2) như dữ liệu thực tế từ Bridge
    final dangerousReadingJson = {
      'device_id': '1',
      'reading': {
        'schema_version': '0.1',
        'device_id': '1',
        'sample_id': 'sdb-entry-999',
        'recorded_at': '2026-11-10T17:00:00Z',
        'water_ph': 4.2,
        'soil_moisture_pct': 0.0,
        'air_temperature_c': 30.5,
        'air_humidity_pct': 78.0,
      },
      'received_at': '2026-11-10T17:00:02Z',
      'is_stale': false,
      'advice': null,
    };

    final res = LatestReadingResponse.fromJson(dangerousReadingJson);
    expect(res.advice, isNotNull);
    expect(res.advice!.isDanger, isTrue);
    expect(res.advice!.code, equals('RULE_PH_EXTREME_ACID'));
    expect(res.advice!.message, contains('Nước tưới cực chua'));
    expect(res.advice!.suggestedAction, contains('nước vôi trong'));

    // Trường hợp thông số lý tưởng
    final optimalReadingJson = {
      'device_id': 'esp32-nursery-01',
      'reading': {
        'schema_version': '0.1',
        'device_id': 'esp32-nursery-01',
        'sample_id': 'sample-opt',
        'recorded_at': '2026-11-10T17:00:00Z',
        'water_ph': 6.2,
        'soil_moisture_pct': 70.0,
        'air_temperature_c': 25.0,
        'air_humidity_pct': 68.0,
        'water_tds_ppm': 350.0,
      },
      'received_at': '2026-11-10T17:00:02Z',
      'is_stale': false,
      'advice': null,
    };

    final optimalRes = LatestReadingResponse.fromJson(optimalReadingJson);
    expect(optimalRes.advice, isNotNull);
    expect(optimalRes.advice!.isOptimal, isTrue);
    expect(optimalRes.advice!.message, contains('điều kiện sinh trưởng lý tưởng'));
  });

  test('Kiểm tra danh sách thiết bị fetchDevices trong ApiService', () async {
    apiService.mode = DataSourceMode.fixture;
    final devs = await apiService.fetchDevices();
    expect(devs, isNotEmpty);
    expect(devs.any((d) => d.deviceId == '1'), isTrue);
    expect(devs.any((d) => d.deviceId == 'esp32-nursery-01'), isTrue);
  });
}

