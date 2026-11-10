class CareRule {
  final int? id;
  final String ruleCode;
  final String name;
  final String? description;
  final String parameter;
  final String operator;
  final double? thresholdMin;
  final double? thresholdMax;
  final String severity; // 'info' | 'warning' | 'danger'
  final String actionAdvice;
  final bool isActive;

  const CareRule({
    this.id,
    required this.ruleCode,
    required this.name,
    this.description,
    required this.parameter,
    required this.operator,
    this.thresholdMin,
    this.thresholdMax,
    this.severity = 'warning',
    required this.actionAdvice,
    this.isActive = true,
  });

  factory CareRule.fromJson(Map<String, dynamic> json) {
    return CareRule(
      id: json['id'] as int?,
      ruleCode: json['rule_code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      parameter: json['parameter'] as String? ?? '',
      operator: json['operator'] as String? ?? '',
      thresholdMin: (json['threshold_min'] as num?)?.toDouble(),
      thresholdMax: (json['threshold_max'] as num?)?.toDouble(),
      severity: json['severity'] as String? ?? 'warning',
      actionAdvice: json['action_advice'] as String? ?? '',
      isActive: json['is_active'] == true || json['is_active'] == 1,
    );
  }

  String get parameterLabel {
    switch (parameter) {
      case 'air_temperature_c':
        return 'Nhiệt độ không khí (°C)';
      case 'air_humidity_pct':
        return 'Độ ẩm không khí (%)';
      case 'soil_temperature_c':
        return 'Nhiệt độ đất (°C)';
      case 'soil_moisture_pct':
        return 'Độ ẩm đất (%)';
      case 'water_ph':
        return 'pH mẫu nước';
      case 'water_tds_ppm':
        return 'TDS mẫu nước (ppm)';
      default:
        return parameter;
    }
  }

  String get conditionText {
    if (operator == 'between') {
      return '$thresholdMin – $thresholdMax';
    } else if (operator == 'outside') {
      return '< $thresholdMin hoặc > $thresholdMax';
    } else {
      return '$operator ${thresholdMin ?? thresholdMax}';
    }
  }
}

