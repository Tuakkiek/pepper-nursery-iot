class AuthUser {
  final int id;
  final String username;
  final String role; // 'admin' | 'user'
  final String fullName;

  const AuthUser({
    required this.id,
    required this.username,
    required this.role,
    required this.fullName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id'] as int? ?? 0,
      username: json['username'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
      fullName: json['full_name'] as String? ?? '',
    );
  }

  bool get isAdmin => role == 'admin';
}

