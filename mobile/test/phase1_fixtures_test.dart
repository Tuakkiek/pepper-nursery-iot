import 'package:flutter_test/flutter_test.dart';
import 'package:pepper_nursery_mobile/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late ApiService apiService;

  setUp(() {
    apiService = ApiService();
    apiService.mode = DataSourceMode.fixture;
  });

  test('1. Fixture Normal: đủ 5 cảm biến, trạng thái bình thường', () async {
    apiService.currentScenario = FixtureScenario.normal;
    final res = await apiService.fetchLatestReading();

    expect(res.deviceId, 'esp32-nursery-01');
    expect(res.isStale, false);
    expect(res.reading, isNotNull);

    final reading = res.reading!;
    expect(reading.airTemperatureC, 28.2);
    expect(reading.airHumidityPct, 72.0);
    expect(reading.soilTemperatureC, 27.1);
    expect(reading.soilMoisturePct, 46.0);
    expect(reading.waterTdsPpm, 620.0);
    expect(reading.waterPh, 6.4);

    expect(reading.sensorStatus.dht22, 'ok');
    expect(reading.sensorStatus.hd38, 'ok');
    expect(reading.sensorStatus.ds18b20, 'ok');
    expect(reading.sensorStatus.tds, 'ok');
    expect(reading.sensorStatus.ph4502c, 'ok');
  });

  test('2. Fixture Partial Error: dht22 và tds lỗi, ds18b20 hợp lệ', () async {
    apiService.currentScenario = FixtureScenario.partialError;
    final res = await apiService.fetchLatestReading();

    expect(res.reading, isNotNull);
    final reading = res.reading!;

    // DHT22 & TDS lỗi => giá trị quy đổi là null
    expect(reading.airTemperatureC, isNull);
    expect(reading.airHumidityPct, isNull);
    expect(reading.waterTdsPpm, isNull);
    expect(reading.sensorStatus.dht22, 'read_error');
    expect(reading.sensorStatus.tds, 'read_error');

    // DS18B20 vẫn đo tốt
    expect(reading.soilTemperatureC, 27.0);
    expect(reading.sensorStatus.ds18b20, 'ok');
  });

  test('3. Fixture Uncalibrated: HD-38, TDS, pH có raw ADC, quy đổi là null', () async {
    apiService.currentScenario = FixtureScenario.uncalibrated;
    final res = await apiService.fetchLatestReading();

    expect(res.reading, isNotNull);
    final reading = res.reading!;

    // Trạng thái chưa hiệu chuẩn
    expect(reading.sensorStatus.hd38, 'not_calibrated');
    expect(reading.sensorStatus.tds, 'not_calibrated');
    expect(reading.sensorStatus.ph4502c, 'not_calibrated');

    // Giá trị quy đổi phải là null theo hợp đồng G0 (không tự gán %, ppm, pH giả)
    expect(reading.soilMoisturePct, isNull);
    expect(reading.waterTdsPpm, isNull);
    expect(reading.waterPh, isNull);

    // Có số đọc raw ADC
    expect(reading.soilMoistureRaw, 1800);
    expect(reading.waterTdsAdcRaw, 1560);
    expect(reading.waterPhAdcRaw, 1930);
  });

  test('4. Fixture Stale: is_stale là true', () async {
    apiService.currentScenario = FixtureScenario.stale;
    final res = await apiService.fetchLatestReading();

    expect(res.isStale, true);
    expect(res.reading, isNotNull);
  });

  test('5. Fixture Empty: reading là null, không sinh số 0 giả', () async {
    apiService.currentScenario = FixtureScenario.empty;
    final res = await apiService.fetchLatestReading();

    expect(res.reading, isNull);
    expect(res.receivedAt, isNull);
    expect(res.isStale, isNull);
  });

  test('6. Fixture Server Error: ném exception lỗi máy chủ', () async {
    apiService.currentScenario = FixtureScenario.serverError;
    expect(
      () => apiService.fetchLatestReading(),
      throwsA(isA<Exception>()),
    );
  });

  test('7. History: nạp danh sách lịch sử nhiều bản ghi thành công', () async {
    final history = await apiService.fetchHistory();

    expect(history.isNotEmpty, true);
    expect(history.length, greaterThanOrEqualTo(2));
    expect(history.first.reading.sampleId, isNotEmpty);
  });
}
