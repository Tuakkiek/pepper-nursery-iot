class UserDevice {
  final String deviceId;
  final String name;
  final String? description;
  final DateTime? createdAt;
  final bool isActive;
  final bool isOnline;

  const UserDevice({
    required this.deviceId,
    required this.name,
    this.description,
    this.createdAt,
    this.isActive = false,
    this.isOnline = false,
  });

  factory UserDevice.fromJson(Map<String, dynamic> json) {
    final id = json['device_id']?.toString() ?? '';
    return UserDevice(
      deviceId: id,
      name: (json['name'] as String?)?.trim().isNotEmpty == true
          ? (json['name'] as String).trim()
          : id,
      description: json['description'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
      isActive: json['is_active'] == true || json['is_active'] == 1,
      isOnline: json['is_online'] == true || json['is_online'] == 1,
    );
  }

  UserDevice copyWith({
    String? deviceId,
    String? name,
    String? description,
    DateTime? createdAt,
    bool? isActive,
    bool? isOnline,
  }) {
    return UserDevice(
      deviceId: deviceId ?? this.deviceId,
      name: name ?? this.name,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
      isActive: isActive ?? this.isActive,
      isOnline: isOnline ?? this.isOnline,
    );
  }
}

