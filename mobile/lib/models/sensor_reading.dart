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
      schemaVersion: json['schema_version'] as String? ?? '0.1',
      deviceId: json['device_id'] as String? ?? '',
      sampleId: json['sample_id'] as String? ?? '',
      recordedAt: json['recorded_at'] != null
          ? DateTime.tryParse(json['recorded_at'] as String)
          : null,
      airTemperatureC: (json['air_temperature_c'] as num?)?.toDouble(),
      airHumidityPct: (json['air_humidity_pct'] as num?)?.toDouble(),
      soilTemperatureC: (json['soil_temperature_c'] as num?)?.toDouble(),
      soilMoistureRaw: (json['soil_moisture_raw'] as num?)?.toInt(),
      soilMoisturePct: (json['soil_moisture_pct'] as num?)?.toDouble(),
      waterTdsAdcRaw: (json['water_tds_adc_raw'] as num?)?.toInt(),
      waterTdsPpm: (json['water_tds_ppm'] as num?)?.toDouble(),
      waterPhAdcRaw: (json['water_ph_adc_raw'] as num?)?.toInt(),
      waterPh: (json['water_ph'] as num?)?.toDouble(),
      sensorStatus: SensorStatus.fromJson(
        json['sensor_status'] as Map<String, dynamic>?,
      ),
    );
  }
}

class CareAdvice {
  final String version;
  final String status; // 'optimal' | 'warning' | 'danger' | 'insufficient_data'
  final int? priority;
  final String? code;
  final String message;
  final String? suggestedAction;

  const CareAdvice({
    this.version = '0.1',
    required this.status,
    this.priority,
    this.code,
    required this.message,
    this.suggestedAction,
  });

  factory CareAdvice.fromJson(dynamic json) {
    if (json == null) {
      return const CareAdvice(
        status: 'optimal',
        message: 'Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng.',
      );
    }
    if (json is String) {
      return CareAdvice(
        status: 'optimal',
        message: json,
      );
    }
    if (json is Map<String, dynamic>) {
      return CareAdvice(
        version: json['version'] as String? ?? '0.1',
        status: json['status'] as String? ?? 'optimal',
        priority: (json['priority'] as num?)?.toInt(),
        code: json['code'] as String?,
        message: json['message'] as String? ?? '',
        suggestedAction: json['suggested_action'] as String?,
      );
    }
    return const CareAdvice(
      status: 'optimal',
      message: 'Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng.',
    );
  }

  bool get isDanger => status == 'danger';
  bool get isWarning => status == 'warning';
  bool get isOptimal => status == 'optimal';
  bool get isInsufficientData => status == 'insufficient_data';
}

class LatestReadingResponse {
  final String deviceId;
  final ReadingData? reading;
  final DateTime? receivedAt;
  final bool? isStale;
  final CareAdvice? advice;

  const LatestReadingResponse({
    required this.deviceId,
    this.reading,
    this.receivedAt,
    this.isStale,
    this.advice,
  });

  String? get adviceMessage => advice?.message;

  factory LatestReadingResponse.fromJson(Map<String, dynamic> json) {
    CareAdvice? adviceObj;
    final adviceVal = json['advice'];
    if (adviceVal != null) {
      adviceObj = CareAdvice.fromJson(adviceVal);
    }

    return LatestReadingResponse(
      deviceId: json['device_id'] as String? ?? '',
      reading: json['reading'] != null
          ? ReadingData.fromJson(json['reading'] as Map<String, dynamic>)
          : null,
      receivedAt: json['received_at'] != null
          ? DateTime.tryParse(json['received_at'] as String)
          : null,
      isStale: json['is_stale'] as bool?,
      advice: adviceObj,
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
      deviceId: json['device_id'] as String? ?? '',
      limit: (json['limit'] as num?)?.toInt() ?? 20,
      readings: list
          .map((item) => HistoryItem.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
