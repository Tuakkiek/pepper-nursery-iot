class SensorStatus {
  final String dht22;
  final String hd38;
  final String ds18b20;
  final String tds;
  final String ph4502c;

  const SensorStatus({
    this.dht22 = 'unknown',
    this.hd38 = 'unknown',
    this.ds18b20 = 'unknown',
    this.tds = 'unknown',
    this.ph4502c = 'unknown',
  });

  factory SensorStatus.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const SensorStatus();
    return SensorStatus(
      dht22: json['dht22'] as String? ?? 'unknown',
      hd38: json['hd38'] as String? ?? 'unknown',
      ds18b20: json['ds18b20'] as String? ?? 'unknown',
      tds: json['tds'] as String? ?? 'unknown',
      ph4502c: json['ph4502c'] as String? ?? 'unknown',
    );
  }

  Map<String, dynamic> toJson() => {
    'dht22': dht22,
    'hd38': hd38,
    'ds18b20': ds18b20,
    'tds': tds,
    'ph4502c': ph4502c,
  };

  bool get isDht22Ok => dht22 == 'ok';
  bool get isHd38Ok => hd38 == 'ok';
  bool get isHd38NotCalibrated => hd38 == 'not_calibrated';
  bool get isDs18b20Ok => ds18b20 == 'ok';
  bool get isTdsOk => tds == 'ok';
  bool get isTdsNotCalibrated => tds == 'not_calibrated';
  bool get isPhOk => ph4502c == 'ok';
  bool get isPhNotCalibrated => ph4502c == 'not_calibrated';
}

double? _toDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

class ReadingData {
  final String schemaVersion;
  final String deviceId;
  final String sampleId;
  final DateTime? recordedAt;
  final double? airTemperatureC;
  final double? airHumidityPct;
  final double? soilTemperatureC;
  final int? soilMoistureRaw;
  final double? soilMoisturePct;
  final int? waterTdsAdcRaw;
  final double? waterTdsPpm;
  final int? waterPhAdcRaw;
  final double? waterPh;
  final SensorStatus sensorStatus;

  const ReadingData({
    required this.schemaVersion,
    required this.deviceId,
    required this.sampleId,
    this.recordedAt,
    this.airTemperatureC,
    this.airHumidityPct,
    this.soilTemperatureC,
    this.soilMoistureRaw,
    this.soilMoisturePct,
    this.waterTdsAdcRaw,
    this.waterTdsPpm,
    this.waterPhAdcRaw,
    this.waterPh,
    required this.sensorStatus,
  });

  factory ReadingData.fromJson(Map<String, dynamic> json) {
    return ReadingData(
      schemaVersion: json['schema_version']?.toString() ?? '0.1',
      deviceId: json['device_id']?.toString() ?? '',
      sampleId: json['sample_id']?.toString() ?? '',
      recordedAt: json['recorded_at'] != null
          ? DateTime.tryParse(json['recorded_at'] as String)
          : null,
      airTemperatureC: _toDouble(json['air_temperature_c']),
      airHumidityPct: _toDouble(json['air_humidity_pct']),
      soilTemperatureC: _toDouble(json['soil_temperature_c']),
      soilMoistureRaw: _toInt(json['soil_moisture_raw']),
      soilMoisturePct: _toDouble(json['soil_moisture_pct']),
      waterTdsAdcRaw: _toInt(json['water_tds_adc_raw']),
      waterTdsPpm: _toDouble(json['water_tds_ppm']),
      waterPhAdcRaw: _toInt(json['water_ph_adc_raw']),
      waterPh: _toDouble(json['water_ph']),
      sensorStatus: SensorStatus.fromJson(
        json['sensor_status'] as Map<String, dynamic>?,
      ),
    );
  }
}

class LatestReadingResponse {
  final String deviceId;
  final String? deviceName;
  final ReadingData? reading;
  final DateTime? receivedAt;
  final bool? isStale;
  final String? adviceMessage;
  final String? adviceStatus;
  final String? suggestedAction;

  const LatestReadingResponse({
    required this.deviceId,
    this.deviceName,
    this.reading,
    this.receivedAt,
    this.isStale,
    this.adviceMessage,
    this.adviceStatus,
    this.suggestedAction,
  });

  factory LatestReadingResponse.fromJson(Map<String, dynamic> json) {
    String? message;
    String? adviceStatus;
    String? suggestedAction;
    final adviceVal = json['advice'];
    if (adviceVal is String) {
      message = adviceVal;
    } else if (adviceVal is Map<String, dynamic>) {
      message = adviceVal['message'] as String?;
      adviceStatus = adviceVal['status'] as String?;
      suggestedAction = adviceVal['suggested_action'] as String?;
    }

    return LatestReadingResponse(
      deviceId: json['device_id']?.toString() ?? '',
      deviceName: json['name'] as String?,
      reading: json['reading'] != null
          ? ReadingData.fromJson(json['reading'] as Map<String, dynamic>)
          : null,
      receivedAt: json['received_at'] != null
          ? DateTime.tryParse(json['received_at'] as String)
          : null,
      isStale: json['is_stale'] as bool?,
      adviceMessage: message,
      adviceStatus: adviceStatus,
      suggestedAction: suggestedAction,
    );
  }
}

class HistoryItem {
  final ReadingData reading;
  final DateTime? receivedAt;

  const HistoryItem({
    required this.reading,
    this.receivedAt,
  });

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    final readingJson = (json['reading'] as Map<String, dynamic>?) ?? json;
    return HistoryItem(
      reading: ReadingData.fromJson(readingJson),
      receivedAt: json['received_at'] != null
          ? DateTime.tryParse(json['received_at'] as String)
          : null,
    );
  }
}

class HistoryResponse {
  final String deviceId;
  final int limit;
  final List<HistoryItem> readings;

  const HistoryResponse({
    required this.deviceId,
    required this.limit,
    required this.readings,
  });

  factory HistoryResponse.fromJson(Map<String, dynamic> json) {
    final list = (json['readings'] as List<dynamic>?) ?? [];
    return HistoryResponse(
      deviceId: json['device_id']?.toString() ?? '',
      limit: _toInt(json['limit']) ?? 20,
      readings: list
          .map((item) => HistoryItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class RangeReadingsResponse {
  final String deviceId;
  final String startDate;
  final String endDate;
  final int total;
  final int page;
  final int pageSize;
  final int totalPages;
  final List<HistoryItem> readings;

  const RangeReadingsResponse({
    required this.deviceId,
    required this.startDate,
    required this.endDate,
    required this.total,
    required this.page,
    required this.pageSize,
    required this.totalPages,
    required this.readings,
  });

  factory RangeReadingsResponse.fromJson(Map<String, dynamic> json) {
    final list = (json['readings'] as List<dynamic>?) ?? [];
    return RangeReadingsResponse(
      deviceId: json['device_id']?.toString() ?? '',
      startDate: json['start_date']?.toString() ?? '',
      endDate: json['end_date']?.toString() ?? '',
      total: _toInt(json['total']) ?? list.length,
      page: _toInt(json['page']) ?? 1,
      pageSize: _toInt(json['page_size']) ?? 10,
      totalPages: _toInt(json['total_pages']) ?? 1,
      readings: list
          .map((item) => HistoryItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
