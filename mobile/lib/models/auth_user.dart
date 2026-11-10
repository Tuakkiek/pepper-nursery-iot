class AuthUser {
  final int id;
  final String username;
  final String role; // 'admin' | 'user'
  final String fullName;
  final String? selectedDeviceId;

  const AuthUser({
    required this.id,
    required this.username,
    required this.role,
    required this.fullName,
    this.selectedDeviceId,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      fullName: json['full_name'] as String? ?? '',
      selectedDeviceId: json['selected_device_id']?.toString(),
    );
  }

  AuthUser copyWith({
    int? id,
    String? username,
    String? role,
    String? fullName,
    String? selectedDeviceId,
  }) {
    return AuthUser(
      id: id ?? this.id,
      username: username ?? this.username,
      role: role ?? this.role,
      fullName: fullName ?? this.fullName,
      selectedDeviceId: selectedDeviceId ?? this.selectedDeviceId,
    );
  }

  bool get isAdmin => role == 'admin';
}

