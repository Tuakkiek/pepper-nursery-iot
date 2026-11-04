import { pool } from './connection';

export async function runMigrations(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    console.log('Running database migrations...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        description TEXT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

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
    await conn.query('DROP TABLE IF EXISTS readings;');
    await conn.query('DROP TABLE IF EXISTS devices;');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Tables dropped.');
  } finally {
    conn.release();
  }
}

