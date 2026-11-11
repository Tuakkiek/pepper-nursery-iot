class AuthUser {
  final int id;
  final String username;
  final String role; // 'admin' | 'user'
  final String fullName;
  final String? selectedDeviceId;
  final String? deviceName;
  final String? deviceDescription;

  const AuthUser({
    required this.id,
    required this.username,
    required this.role,
    required this.fullName,
    this.selectedDeviceId,
    this.deviceName,
    this.deviceDescription,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final dev = json['device'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      fullName: json['full_name'] as String? ?? '',
      selectedDeviceId: json['selected_device_id']?.toString(),
      deviceName: dev?['name'] as String?,
      deviceDescription: dev?['description'] as String?,
    );
  }

  AuthUser copyWith({
    int? id,
    String? username,
    String? role,
    String? fullName,
    String? selectedDeviceId,
    String? deviceName,
    String? deviceDescription,
  }) {
    return AuthUser(
      id: id ?? this.id,
      username: username ?? this.username,
      role: role ?? this.role,
      fullName: fullName ?? this.fullName,
      selectedDeviceId: selectedDeviceId ?? this.selectedDeviceId,
      deviceName: deviceName ?? this.deviceName,
      deviceDescription: deviceDescription ?? this.deviceDescription,
    );
  }

  bool get isAdmin => role == 'admin';

  String get displayName {
    final cleanName = fullName.trim();
    if (role.toLowerCase() == 'user' &&
        (cleanName.isEmpty ||
            cleanName.toLowerCase() == 'kỹ thuật viên vườn ươm')) {
      return 'user';
    }
    return cleanName.isNotEmpty ? cleanName : username;
  }
}

