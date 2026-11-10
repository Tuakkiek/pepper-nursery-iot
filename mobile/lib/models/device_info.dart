class DeviceInfo {
  final String deviceId;
  final String name;
  final String? description;
  final bool isOnline;
  final bool isActive;

  const DeviceInfo({
    required this.deviceId,
    required this.name,
    this.description,
    this.isOnline = false,
    this.isActive = false,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> json) {
    return DeviceInfo(
      deviceId: json['device_id'] as String? ?? json['id'] as String? ?? '',
      name: json['name'] as String? ?? json['device_id'] as String? ?? '',
      description: json['description'] as String?,
      isOnline: json['is_online'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? false,
    );
  }
}

