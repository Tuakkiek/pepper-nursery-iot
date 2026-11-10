class UserDevice {
  final String id;
  final String name;
  final bool isOnline;
  final bool hasReading;
  const UserDevice({
    required this.id,
    required this.name,
    this.isOnline = false,
    this.hasReading = false,
  });
  factory UserDevice.fromJson(Map<String, dynamic> json) => UserDevice(
    id: json['device_id'].toString(),
    name: json['name'] as String? ?? json['device_id'].toString(),
    isOnline: json['is_online'] == true,
    hasReading: json['latest_reading'] != null,
  );
}

class DeviceCollection {
  final List<UserDevice> devices;
  final String? activeId;
  const DeviceCollection(this.devices, this.activeId);
  factory DeviceCollection.fromJson(Map<String, dynamic> json) =>
      DeviceCollection(
        (json['devices'] as List)
            .map((item) => UserDevice.fromJson(item as Map<String, dynamic>))
            .toList(),
        json['active_device_id']?.toString(),
      );
}
