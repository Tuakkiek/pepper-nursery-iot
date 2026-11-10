import bcrypt from 'bcryptjs';
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

  // 2. Readings (Past fixtures so live incoming ESP32 data will be the newest)
  const basePast = Date.now() - 6 * 60 * 60 * 1000; // 6 hours ago
  await insertReading(sample1, new Date(basePast));
  await insertReading(sample2, new Date(basePast + 60 * 1000));
  await insertReading(sample3, new Date(basePast + 120 * 1000));
  await insertReading(sampleLive, now);
  await insertReading(sampleStale, staleTime);

  // 3. Default Users (Admin & User)
  const adminHash = bcrypt.hashSync('admin123', 10);
  const userHash = bcrypt.hashSync('user123', 10);

  await pool.query(`
    INSERT INTO users (username, password_hash, full_name, role)
    VALUES 
      ('admin', ?, 'Quản trị viên Vườn ươm', 'admin'),
      ('user', ?, 'Kỹ thuật viên Vườn ươm', 'user')
    ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role)
  `, [adminHash, userHash]);

  // 4. Default Care Rules for Pepper Nursery (Ớt con) - Agronomy v0.1 by MThuy
  const defaultRules = [
    // Nhiệt độ không khí
    {
      code: 'RULE_TEMP_EXTREME_LOW',
      name: 'Nhiệt độ không khí cực thấp',
      desc: 'Nhiệt độ < 16°C nguy cơ chết cóng cây ớt con',
      param: 'air_temperature_c',
      op: '<',
      min: 16.0,
      max: null,
      sev: 'danger',
      advice: 'Che chắn gió lùa, phủ nylon giữ ấm, bật đèn sưởi.',
    },
    {
      code: 'RULE_TEMP_LOW',
      name: 'Nhiệt độ không khí thấp',
      desc: 'Nhiệt độ 16.0 - 19.9°C làm chậm sinh trưởng',
      param: 'air_temperature_c',
      op: 'between',
      min: 16.0,
      max: 19.9,
      sev: 'warning',
      advice: 'Khép bớt cửa gió, tránh tưới nước lạnh sáng sớm.',
    },
    {
      code: 'RULE_TEMP_HIGH',
      name: 'Nhiệt độ không khí cao',
      desc: 'Nhiệt độ 28.1 - 32.0°C tăng thoát hơi nước',
      param: 'air_temperature_c',
      op: 'between',
      min: 28.1,
      max: 32.0,
      sev: 'warning',
      advice: 'Mở thông gió, kéo lưới che 30% nắng.',
    },
    {
      code: 'RULE_TEMP_EXTREME_HIGH',
      name: 'Nhiệt độ không khí cực cao',
      desc: 'Nhiệt độ > 32°C nguy cơ cháy lá non và sốc nhiệt',
      param: 'air_temperature_c',
      op: '>',
      min: null,
      max: 32.0,
      sev: 'danger',
      advice: 'Kéo lưới che 70% nắng, bật phun sương mái làm mát.',
    },

    // Độ ẩm không khí
    {
      code: 'RULE_HUM_EXTREME_LOW',
      name: 'Độ ẩm không khí cực thấp',
      desc: 'Độ ẩm < 50% không khí khô hạn gay gắt',
      param: 'air_humidity_pct',
      op: '<',
      min: 50.0,
      max: null,
      sev: 'danger',
      advice: 'Bật phun sương làm ẩm không gian, tưới nền.',
    },
    {
      code: 'RULE_HUM_LOW',
      name: 'Độ ẩm không khí thấp',
      desc: 'Độ ẩm 50.0 - 59.9% lá non dễ bị mất nước',
      param: 'air_humidity_pct',
      op: 'between',
      min: 50.0,
      max: 59.9,
      sev: 'warning',
      advice: 'Phun sương nhẹ giữ ẩm không khí.',
    },
    {
      code: 'RULE_HUM_HIGH',
      name: 'Độ ẩm không khí cao',
      desc: 'Độ ẩm 75.1 - 85.0% tăng nguy cơ nấm lá',
      param: 'air_humidity_pct',
      op: 'between',
      min: 75.1,
      max: 85.0,
      sev: 'warning',
      advice: 'Tăng thông gió, tránh tưới chiều tối.',
    },
    {
      code: 'RULE_HUM_EXTREME_HIGH',
      name: 'Độ ẩm không khí cực cao',
      desc: 'Độ ẩm > 85% đọng nước dễ bùng phát nấm lở cổ rễ',
      param: 'air_humidity_pct',
      op: '>',
      min: null,
      max: 85.0,
      sev: 'danger',
      advice: 'Mở tối đa cửa gió, quạt đối lưu, rắc vôi bột lối đi.',
    },

    // Độ ẩm đất / giá thể
    {
      code: 'RULE_SOIL_EXTREME_DRY',
      name: 'Giá thể cực khô hạn',
      desc: 'Độ ẩm đất < 55% rễ non bị kiệt nước teo héo',
      param: 'soil_moisture_pct',
      op: '<',
      min: 55.0,
      max: null,
      sev: 'danger',
      advice: 'Tưới bù ẩm khẩn cấp bằng phun sương mịn đều mặt khay.',
    },
    {
      code: 'RULE_SOIL_DRY',
      name: 'Giá thể thiếu ẩm',
      desc: 'Độ ẩm đất 55.0 - 64.9% bắt đầu khô se mặt',
      param: 'soil_moisture_pct',
      op: 'between',
      min: 55.0,
      max: 64.9,
      sev: 'warning',
      advice: 'Chuẩn bị tưới bổ sung nước sạch trong 1-2h tới.',
    },
    {
      code: 'RULE_SOIL_WET',
      name: 'Giá thể thừa ẩm',
      desc: 'Độ ẩm đất 80.1 - 85.0% nguy cơ bí rễ',
      param: 'soil_moisture_pct',
      op: 'between',
      min: 80.1,
      max: 85.0,
      sev: 'warning',
      advice: 'Tạm dừng cữ tưới tiếp theo, chờ se mặt giá thể.',
    },
    {
      code: 'RULE_SOIL_EXTREME_WET',
      name: 'Giá thể ngập úng ngạt khí',
      desc: 'Độ ẩm đất > 85% nguy cơ thối nhũn rễ con',
      param: 'soil_moisture_pct',
      op: '>',
      min: null,
      max: 85.0,
      sev: 'danger',
      advice: 'Ngừng tưới ngay, kê khay xốp cao 20cm, thông gió đáy.',
    },

    // Nhiệt độ rễ / đất
    {
      code: 'RULE_SOIL_TEMP_EXTREME_LOW',
      name: 'Nhiệt độ rễ cực lạnh',
      desc: 'Nhiệt độ đất < 18°C rễ ngừng hấp thu',
      param: 'soil_temperature_c',
      op: '<',
      min: 18.0,
      max: null,
      sev: 'danger',
      advice: 'Kê khay cách đất 20cm, rơm rạ cách nhiệt đáy luống.',
    },
    {
      code: 'RULE_SOIL_TEMP_LOW',
      name: 'Nhiệt độ rễ thấp',
      desc: 'Nhiệt độ đất 18.0 - 21.9°C rễ phát triển chậm',
      param: 'soil_temperature_c',
      op: 'between',
      min: 18.0,
      max: 21.9,
      sev: 'warning',
      advice: 'Tưới nước lúc ấm (khoảng 10h sáng).',
    },
    {
      code: 'RULE_SOIL_TEMP_HIGH',
      name: 'Nhiệt độ rễ cao',
      desc: 'Nhiệt độ đất 28.1 - 32.0°C nóng bầu rễ',
      param: 'soil_temperature_c',
      op: 'between',
      min: 28.1,
      max: 32.0,
      sev: 'warning',
      advice: 'Tránh nắng rọi trực tiếp vào thành khay xốp.',
    },
    {
      code: 'RULE_SOIL_TEMP_EXTREME_HIGH',
      name: 'Nhiệt độ rễ cực cao',
      desc: 'Nhiệt độ đất > 32°C rễ non bị tổn thương nhiệt',
      param: 'soil_temperature_c',
      op: '>',
      min: null,
      max: 32.0,
      sev: 'danger',
      advice: 'Tưới làm mát bằng nước mát nhẹ, che nắng xiên.',
    },

    // Độ pH nước tưới
    {
      code: 'RULE_PH_EXTREME_ACID',
      name: 'Nước tưới cực chua (Axit nặng)',
      desc: 'pH < 5.3 cháy rễ non và độc tố nhôm sắt',
      param: 'water_ph',
      op: '<',
      min: 5.3,
      max: null,
      sev: 'danger',
      advice: 'Tuyệt đối không tưới! Dùng nước vôi trong nâng pH lên 6.0-6.5.',
    },
    {
      code: 'RULE_PH_ACID',
      name: 'Nước tưới chua nhẹ',
      desc: 'pH 5.3 - 5.7 rễ khó hấp thu khoáng chất',
      param: 'water_ph',
      op: 'between',
      min: 5.3,
      max: 5.7,
      sev: 'warning',
      advice: 'Châm thêm nước giếng sạch hoặc sục khí bể chứa.',
    },
    {
      code: 'RULE_PH_ALKALINE',
      name: 'Nước tưới hơi kiềm',
      desc: 'pH 6.9 - 7.4 theo dõi hấp thu vi lượng',
      param: 'water_ph',
      op: 'between',
      min: 6.9,
      max: 7.4,
      sev: 'warning',
      advice: 'Theo dõi gân lá non, chuẩn bị điều chỉnh nhẹ pH.',
    },
    {
      code: 'RULE_PH_EXTREME_ALKALINE',
      name: 'Nước tưới kiềm hóa nặng',
      desc: 'pH > 7.5 làm kết tủa phân bón rễ nghẹt chất',
      param: 'water_ph',
      op: '>',
      min: null,
      max: 7.5,
      sev: 'danger',
      advice: 'Tuyệt đối không tưới! Dùng axit citric hữu cơ hạ pH về 6.0-6.5.',
    },

    // TDS nước tưới
    {
      code: 'RULE_TDS_EXTREME_LOW',
      name: 'Nước tưới kiệt khoáng',
      desc: 'TDS < 100 ppm nước nghèo khoáng chất',
      param: 'water_tds_ppm',
      op: '<',
      min: 100.0,
      max: null,
      sev: 'danger',
      advice: 'Nước nghèo khoáng; sau 15 ngày châm nhẹ hữu cơ vi sinh.',
    },
    {
      code: 'RULE_TDS_LOW',
      name: 'Nước tưới dinh dưỡng loãng',
      desc: 'TDS 100 - 199 ppm an toàn cho cây < 10 ngày',
      param: 'water_tds_ppm',
      op: 'between',
      min: 100.0,
      max: 199.0,
      sev: 'warning',
      advice: 'Nước sạch an toàn cho cây con dưới 10 ngày tuổi.',
    },
    {
      code: 'RULE_TDS_HIGH',
      name: 'Dinh dưỡng nước tưới đậm đặc',
      desc: 'TDS 451 - 850 ppm cần pha loãng thêm nước',
      param: 'water_tds_ppm',
      op: 'between',
      min: 451.0,
      max: 850.0,
      sev: 'warning',
      advice: 'Pha loãng thêm 30-50% nước sạch trước khi tưới.',
    },
    {
      code: 'RULE_TDS_EXTREME_HIGH',
      name: 'Dinh dưỡng nước tưới ngộ độc muối',
      desc: 'TDS > 850 ppm xót và cháy rễ khẩn cấp',
      param: 'water_tds_ppm',
      op: '>',
      min: null,
      max: 850.0,
      sev: 'danger',
      advice: 'Nguy hiểm khẩn cấp! Ngừng tưới, xả nước sạch rửa trôi muối.',
    },
  ];

  for (const r of defaultRules) {
    await pool.query(`
      INSERT INTO care_rules (
        rule_code, name, description, parameter, operator,
        threshold_min, threshold_max, severity, action_advice, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        parameter = VALUES(parameter),
        operator = VALUES(operator),
        threshold_min = VALUES(threshold_min),
        threshold_max = VALUES(threshold_max),
        severity = VALUES(severity),
        action_advice = VALUES(action_advice),
        is_active = TRUE
    `, [r.code, r.name, r.desc, r.param, r.op, r.min, r.max, r.sev, r.advice]);
  }

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

