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

class LatestReadingResponse {
  final String deviceId;
  final ReadingData? reading;
  final DateTime? receivedAt;
  final bool? isStale;
  final String? advice;

  const LatestReadingResponse({
    required this.deviceId,
    this.reading,
    this.receivedAt,
    this.isStale,
    this.advice,
  });

  factory LatestReadingResponse.fromJson(Map<String, dynamic> json) {
    return LatestReadingResponse(
      deviceId: json['device_id'] as String? ?? '',
      reading: json['reading'] != null
          ? ReadingData.fromJson(json['reading'] as Map<String, dynamic>)
          : null,
      receivedAt: json['received_at'] != null
          ? DateTime.tryParse(json['received_at'] as String)
          : null,
      isStale: json['is_stale'] as bool?,
      advice: json['advice'] as String?,
    );
  }
}

