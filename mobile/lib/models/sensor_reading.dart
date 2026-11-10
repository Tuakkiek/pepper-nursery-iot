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

  static CareAdvice evaluateLocal(ReadingData? reading, {bool? isStale}) {
    if (reading == null) {
      return const CareAdvice(
        status: 'insufficient_data',
        message: 'Chưa có dữ liệu cảm biến để phân tích.',
      );
    }
    if (isStale == true) {
      return const CareAdvice(
        status: 'warning',
        code: 'DATA_STALE',
        message: 'Dữ liệu từ thiết bị đã cũ quá 5 phút hoặc trạm mất liên lạc. Hệ thống tạm dừng đưa ra lời khuyên chăm sóc.',
        suggestedAction: 'Kiểm tra nguồn điện và kết nối Wi-Fi của trạm ESP32.',
      );
    }

    // 1. Kiểm tra mức Nguy hiểm (Danger - ưu tiên cao nhất)
    if (reading.waterPh != null && reading.waterPh! < 5.3) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_PH_EXTREME_ACID',
        message: 'Nước tưới cực chua (Axit nặng: pH ${reading.waterPh!.toStringAsFixed(1)}): Nguy cơ cháy rễ non và ngộ độc kim loại.',
        suggestedAction: 'Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0 - 6.5.',
      );
    }
    if (reading.waterPh != null && reading.waterPh! > 7.5) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_PH_EXTREME_ALKALINE',
        message: 'Nước tưới kiềm hóa nặng (pH ${reading.waterPh!.toStringAsFixed(1)}): Gây kết tủa phân bón, nghẹt hấp thu vi lượng.',
        suggestedAction: 'Tuyệt đối không tưới! Dùng axit citric hữu cơ hạ pH về 6.0 - 6.5.',
      );
    }
    if (reading.soilMoisturePct != null && reading.soilMoisturePct! < 55.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_SOIL_EXTREME_DRY',
        message: 'Giá thể cực khô hạn (${reading.soilMoisturePct!.toStringAsFixed(0)}%): Rễ non bị kiệt nước teo héo khẩn cấp.',
        suggestedAction: 'Tưới bù ẩm khẩn cấp bằng phun sương mịn đều mặt khay.',
      );
    }
    if (reading.soilMoisturePct != null && reading.soilMoisturePct! > 85.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_SOIL_EXTREME_WET',
        message: 'Giá thể ngập úng ngạt khí (${reading.soilMoisturePct!.toStringAsFixed(0)}%): Nguy cơ thối nhũn rễ con.',
        suggestedAction: 'Ngừng tưới ngay, kê khay xốp cao 20cm, thông gió đáy.',
      );
    }
    if (reading.airTemperatureC != null && reading.airTemperatureC! > 32.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_TEMP_EXTREME_HIGH',
        message: 'Nhiệt độ không khí cực cao (${reading.airTemperatureC!.toStringAsFixed(1)}°C): Nguy cơ cháy lá non và sốc nhiệt.',
        suggestedAction: 'Kéo lưới che 70% nắng, bật phun sương mái làm mát.',
      );
    }
    if (reading.airTemperatureC != null && reading.airTemperatureC! < 16.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_TEMP_EXTREME_LOW',
        message: 'Nhiệt độ không khí cực thấp (${reading.airTemperatureC!.toStringAsFixed(1)}°C): Nguy cơ làm chết cóng cây con.',
        suggestedAction: 'Che chắn gió lùa, phủ nylon giữ ấm, bật đèn sưởi.',
      );
    }
    if (reading.airHumidityPct != null && reading.airHumidityPct! < 50.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_HUM_EXTREME_LOW',
        message: 'Độ ẩm không khí cực thấp (${reading.airHumidityPct!.toStringAsFixed(0)}%): Không khí khô hạn gay gắt làm teo héo lá.',
        suggestedAction: 'Bật phun sương làm ẩm không gian, tưới nền.',
      );
    }
    if (reading.airHumidityPct != null && reading.airHumidityPct! > 85.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_HUM_EXTREME_HIGH',
        message: 'Độ ẩm không khí cực cao (${reading.airHumidityPct!.toStringAsFixed(0)}%): Đọng nước dễ bùng phát nấm lở cổ rễ.',
        suggestedAction: 'Mở tối đa cửa gió, quạt đối lưu, rắc vôi bột lối đi.',
      );
    }
    if (reading.waterTdsPpm != null && reading.waterTdsPpm! > 850.0) {
      return CareAdvice(
        status: 'danger',
        code: 'RULE_TDS_EXTREME_HIGH',
        message: 'Dinh dưỡng nước tưới ngộ độc muối (${reading.waterTdsPpm!.toStringAsFixed(0)} ppm): Xót và cháy rễ khẩn cấp.',
        suggestedAction: 'Nguy hiểm khẩn cấp! Ngừng tưới, xả nước sạch rửa trôi muối.',
      );
    }

    // 2. Kiểm tra mức Cảnh báo (Warning)
    if (reading.airTemperatureC != null && reading.airTemperatureC! > 28.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_TEMP_HIGH',
        message: 'Nhiệt độ không khí cao (${reading.airTemperatureC!.toStringAsFixed(1)}°C): Làm tăng thoát hơi nước ở lá.',
        suggestedAction: 'Mở thông gió, kéo lưới che 30% nắng.',
      );
    }
    if (reading.airTemperatureC != null && reading.airTemperatureC! < 20.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_TEMP_LOW',
        message: 'Nhiệt độ không khí thấp (${reading.airTemperatureC!.toStringAsFixed(1)}°C): Làm chậm sinh trưởng cây con.',
        suggestedAction: 'Khép bớt cửa gió, tránh tưới nước lạnh sáng sớm.',
      );
    }
    if (reading.airHumidityPct != null && reading.airHumidityPct! > 75.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_HUM_HIGH',
        message: 'Độ ẩm không khí cao (${reading.airHumidityPct!.toStringAsFixed(0)}%): Tăng nguy cơ đọng nấm bệnh.',
        suggestedAction: 'Tăng thông gió, tránh tưới chiều tối.',
      );
    }
    if (reading.airHumidityPct != null && reading.airHumidityPct! < 60.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_HUM_LOW',
        message: 'Độ ẩm không khí thấp (${reading.airHumidityPct!.toStringAsFixed(0)}%): Lá non dễ mất nước.',
        suggestedAction: 'Phun sương nhẹ giữ ẩm không khí.',
      );
    }
    if (reading.soilMoisturePct != null && reading.soilMoisturePct! < 65.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_SOIL_DRY',
        message: 'Giá thể thiếu ẩm (${reading.soilMoisturePct!.toStringAsFixed(0)}%): Bắt đầu khô se mặt.',
        suggestedAction: 'Chuẩn bị tưới bổ sung nước sạch trong 1-2h tới.',
      );
    }
    if (reading.soilMoisturePct != null && reading.soilMoisturePct! > 80.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_SOIL_WET',
        message: 'Giá thể thừa ẩm (${reading.soilMoisturePct!.toStringAsFixed(0)}%): Nguy cơ bí rễ.',
        suggestedAction: 'Tạm dừng cữ tưới tiếp theo, chờ se mặt giá thể.',
      );
    }
    if (reading.waterPh != null && reading.waterPh! < 5.8) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_PH_ACID',
        message: 'Nước tưới chua nhẹ (pH ${reading.waterPh!.toStringAsFixed(1)}): Rễ khó hấp thu khoáng chất.',
        suggestedAction: 'Châm thêm nước giếng sạch hoặc sục khí bể chứa.',
      );
    }
    if (reading.waterPh != null && reading.waterPh! > 6.8) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_PH_ALKALINE',
        message: 'Nước tưới hơi kiềm (pH ${reading.waterPh!.toStringAsFixed(1)}): Theo dõi hấp thu vi lượng.',
        suggestedAction: 'Theo dõi gân lá non, chuẩn bị điều chỉnh nhẹ pH.',
      );
    }
    if (reading.waterTdsPpm != null && reading.waterTdsPpm! > 450.0) {
      return CareAdvice(
        status: 'warning',
        code: 'RULE_TDS_HIGH',
        message: 'Dinh dưỡng nước tưới đậm đặc (${reading.waterTdsPpm!.toStringAsFixed(0)} ppm).',
        suggestedAction: 'Pha loãng thêm 30-50% nước sạch trước khi tưới.',
      );
    }

    // 3. Điều kiện tối ưu (Optimal)
    return const CareAdvice(
      status: 'optimal',
      message: 'Môi trường vườn ươm ớt con đang ở điều kiện sinh trưởng lý tưởng.',
      suggestedAction: 'Duy trì chế độ thông gió và lịch tưới ổn định hiện tại.',
    );
  }
}

class LatestReadingResponse {
  final String deviceId;
  final String? deviceName;
  final ReadingData? reading;
  final DateTime? receivedAt;
  final bool? isStale;
  final CareAdvice? advice;

  const LatestReadingResponse({
    required this.deviceId,
    this.deviceName,
    this.reading,
    this.receivedAt,
    this.isStale,
    this.advice,
  });

  String? get adviceMessage => advice?.message;
  String? get adviceStatus => advice?.status;
  String? get suggestedAction => advice?.suggestedAction;

  factory LatestReadingResponse.fromJson(Map<String, dynamic> json) {
    final reading = json['reading'] != null
        ? ReadingData.fromJson(json['reading'] as Map<String, dynamic>)
        : null;
    final isStale = json['is_stale'] as bool?;

    CareAdvice? adviceObj;
    final adviceVal = json['advice'];
    if (adviceVal != null) {
      adviceObj = CareAdvice.fromJson(adviceVal);
    } else {
      // Khi backend trả về advice: null, tự động đánh giá nông học cục bộ theo hợp đồng G0 v0.1
      adviceObj = CareAdvice.evaluateLocal(reading, isStale: isStale);
    }

    return LatestReadingResponse(
      deviceId: json['device_id']?.toString() ?? '',
      deviceName: json['name'] as String?,
      reading: reading,
      receivedAt: json['received_at'] != null
          ? DateTime.tryParse(json['received_at'] as String)
          : null,
      isStale: isStale,
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
