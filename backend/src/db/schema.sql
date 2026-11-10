-- Database Schema for Pepper Nursery IoT MVP (G0 v0.1)

CREATE TABLE IF NOT EXISTS devices (
  device_id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  owner_id INT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_devices_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_devices_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS readings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL,
  sample_id VARCHAR(64) NOT NULL,
  schema_version VARCHAR(16) NOT NULL DEFAULT '0.1',
  recorded_at DATETIME(3) NULL,
  received_at DATETIME(3) NOT NULL,
  air_temperature_c DOUBLE NULL,
  air_humidity_pct DOUBLE NULL,
  soil_temperature_c DOUBLE NULL,
  soil_moisture_raw INT NULL,
  soil_moisture_pct DOUBLE NULL,
  water_tds_adc_raw INT NULL,
  water_tds_ppm DOUBLE NULL,
  water_ph_adc_raw INT NULL,
  water_ph DOUBLE NULL,
  sensor_status JSON NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  raw_payload JSON NOT NULL,
  CONSTRAINT fk_readings_device FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
  CONSTRAINT uk_device_sample UNIQUE KEY (device_id, sample_id),
  INDEX idx_device_received (device_id, received_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(128) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  selected_device_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_users_selected_device FOREIGN KEY (selected_device_id) REFERENCES devices(device_id) ON DELETE SET NULL,
  INDEX idx_users_selected_device (selected_device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS care_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  parameter VARCHAR(64) NOT NULL,
  operator VARCHAR(10) NOT NULL,
  threshold_min DOUBLE NULL,
  threshold_max DOUBLE NULL,
  severity ENUM('info', 'warning', 'danger') NOT NULL DEFAULT 'warning',
  action_advice TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

