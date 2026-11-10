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
      selectedDeviceId: json['selected_device_id'] as String?,
      deviceName: dev?['name'] as String?,
      deviceDescription: dev?['description'] as String?,
    );
  }

  bool get isAdmin => role == 'admin';
}

