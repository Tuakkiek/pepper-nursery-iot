import { pool } from './connection';

export async function runMigrations(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    console.log('Running database migrations...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        owner_id INT NULL,
        description TEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_devices_owner (owner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure owner_id column exists if devices table already existed
    const [deviceColumns] = await conn.query<any[]>(
      "SHOW COLUMNS FROM devices LIKE 'owner_id'"
    );
    if (!deviceColumns || deviceColumns.length === 0) {
      await conn.query(`
        ALTER TABLE devices
        ADD COLUMN owner_id INT NULL AFTER name,
        ADD INDEX idx_devices_owner (owner_id);
      `);
    }

    await conn.query(`
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
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(128) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        selected_device_id VARCHAR(64) NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        INDEX idx_users_selected_device (selected_device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure selected_device_id column exists if table already existed
    const [userColumns] = await conn.query<any[]>(
      "SHOW COLUMNS FROM users LIKE 'selected_device_id'"
    );
    if (!userColumns || userColumns.length === 0) {
      await conn.query(`
        ALTER TABLE users
        ADD COLUMN selected_device_id VARCHAR(64) NULL AFTER role,
        ADD INDEX idx_users_selected_device (selected_device_id);
      `);
    }

    await conn.query(`
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
    `);

    console.log('Migrations completed successfully.');
  } finally {
    conn.release();
  }
}

export async function dropTables(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    console.log('Dropping tables...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
    await conn.query('DROP TABLE IF EXISTS care_rules;');
    await conn.query('DROP TABLE IF EXISTS users;');
    await conn.query('DROP TABLE IF EXISTS readings;');
    await conn.query('DROP TABLE IF EXISTS devices;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Tables dropped.');
  } finally {
    conn.release();
  }
}

