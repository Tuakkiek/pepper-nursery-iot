import { pool } from '../db/connection';
import { runMigrations } from '../db/migrations';
import { computePayloadHash } from '../services/reading.service';
import { IngestReadingDto } from '../schemas/reading.schema';

const sample1: IngestReadingDto = {
  schema_version: '0.1',
  device_id: 'esp32-nursery-01',
  sample_id: 'sample-0001',
  recorded_at: '2026-11-04T08:00:00Z',
  air_temperature_c: 28.2,
  air_humidity_pct: 72.0,
  soil_temperature_c: 27.1,
  soil_moisture_raw: 1800,
  soil_moisture_pct: 46.0,
  water_tds_adc_raw: 1560,
  water_tds_ppm: 620.0,
  water_ph_adc_raw: 1930,
  water_ph: 6.4,
  sensor_status: {
    dht22: 'ok',
    hd38: 'ok',
    ds18b20: 'ok',
    tds: 'ok',
    ph4502c: 'ok',
  },
};

const sample2: IngestReadingDto = {
  schema_version: '0.1',
  device_id: 'esp32-nursery-01',
  sample_id: 'sample-0002',
  recorded_at: null,
  air_temperature_c: 28.2,
  air_humidity_pct: 72.0,
  soil_temperature_c: 27.1,
  soil_moisture_raw: 1800,
  soil_moisture_pct: null,
  water_tds_adc_raw: 1560,
  water_tds_ppm: null,
  water_ph_adc_raw: 1930,
  water_ph: null,
  sensor_status: {
    dht22: 'ok',
    hd38: 'not_calibrated',
    ds18b20: 'ok',
    tds: 'not_calibrated',
    ph4502c: 'not_calibrated',
  },
};

const sample3: IngestReadingDto = {
  schema_version: '0.1',
  device_id: 'esp32-nursery-01',
  sample_id: 'sample-0003',
  recorded_at: '2026-11-04T08:02:00Z',
  air_temperature_c: null,
  air_humidity_pct: null,
  soil_temperature_c: 27.0,
  soil_moisture_raw: 1805,
  soil_moisture_pct: null,
  water_tds_adc_raw: null,
  water_tds_ppm: null,
  water_ph_adc_raw: 1932,
  water_ph: null,
  sensor_status: {
    dht22: 'read_error',
    hd38: 'not_calibrated',
    ds18b20: 'ok',
    tds: 'read_error',
    ph4502c: 'not_calibrated',
  },
};

// Recent sample to test live freshness (is_stale: false)
const now = new Date();
const sampleLive: IngestReadingDto = {
  ...sample1,
  sample_id: 'sample-live-recent',
  recorded_at: now.toISOString(),
  air_temperature_c: 28.5,
  air_humidity_pct: 70.0,
  soil_temperature_c: 26.8,
  soil_moisture_pct: 48.0,
};

// Stale sample for esp32-stale-01 (is_stale: true)
const staleTime = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
const sampleStale: IngestReadingDto = {
  ...sample1,
  device_id: 'esp32-stale-01',
  sample_id: 'sample-stale-001',
  recorded_at: staleTime.toISOString(),
};

async function insertReading(dto: IngestReadingDto, receivedAt: Date) {
  const hash = computePayloadHash(dto);
  await pool.query(
    `INSERT INTO readings (
      device_id, sample_id, schema_version, recorded_at, received_at,
      air_temperature_c, air_humidity_pct, soil_temperature_c,
      soil_moisture_raw, soil_moisture_pct, water_tds_adc_raw, water_tds_ppm,
      water_ph_adc_raw, water_ph, sensor_status, payload_hash, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE payload_hash = VALUES(payload_hash)`,
    [
      dto.device_id,
      dto.sample_id,
      dto.schema_version,
      dto.recorded_at ? new Date(dto.recorded_at) : null,
      receivedAt,
      dto.air_temperature_c,
      dto.air_humidity_pct,
      dto.soil_temperature_c,
      dto.soil_moisture_raw,
      dto.soil_moisture_pct,
      dto.water_tds_adc_raw,
      dto.water_tds_ppm,
      dto.water_ph_adc_raw,
      dto.water_ph,
      JSON.stringify(dto.sensor_status),
      hash,
      JSON.stringify(dto),
    ]
  );
}

export async function seedDatabase(): Promise<void> {
  console.log('Seeding database with G0 v0.1 fixtures...');

  await runMigrations();

  // 1. Devices
  await pool.query(`
    INSERT INTO devices (device_id, name, description)
    VALUES 
      ('esp32-nursery-01', 'Trạm vườn ươm ớt 01', 'Trạm thực tế gửi dữ liệu định kỳ'),
      ('esp32-stale-01', 'Trạm kiểm thử dữ liệu cũ', 'Trạm mô phỏng mất kết nối (is_stale: true)'),
      ('esp32-empty-01', 'Trạm mới chưa có dữ liệu', 'Trạm mới khởi tạo chưa có số đo (reading: null)')
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)
  `);

  // 2. Readings
  await insertReading(sample1, new Date('2026-11-04T08:00:02Z'));
  await insertReading(sample2, new Date('2026-11-04T08:01:02Z'));
  await insertReading(sample3, new Date('2026-11-04T08:02:02Z'));
  await insertReading(sampleLive, now);
  await insertReading(sampleStale, staleTime);

  console.log('Seeding finished successfully.');
}

async function main() {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

