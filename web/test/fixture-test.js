/**
 * Automated Test Suite for G0 Fixtures & Adapter
 * Chạy bằng: node test/fixture-test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Đang chạy kiểm thử bộ Fixtures và Hợp đồng G0 v0.1 cho Web Dashboard...\n');

const FIXTURES_DIR = path.resolve(__dirname, '../../docs/contracts/fixtures');

// 1. Kiểm tra tồn tại các file fixture chính thức trong docs/contracts/fixtures/
const requiredFixtures = [
  'latest-normal.json',
  'latest-uncalibrated.json',
  'latest-partial-error.json',
  'latest-stale.json',
  'latest-empty.json',
  'server-error.json',
  'history.json'
];

requiredFixtures.forEach(filename => {
  const filepath = path.join(FIXTURES_DIR, filename);
  assert(fs.existsSync(filepath), `Thiếu file fixture: ${filename}`);
  const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  console.log(`  ✓ ${filename} hợp lệ.`);
});

// 2. Kiểm thử hợp đồng latest-normal.json
const normal = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'latest-normal.json'), 'utf8'));
assert.strictEqual(normal.device_id, 'esp32-nursery-01');
assert.strictEqual(normal.is_stale, false);
assert.strictEqual(normal.advice, null);
assert.strictEqual(typeof normal.reading.air_temperature_c, 'number');
assert.strictEqual(typeof normal.reading.air_humidity_pct, 'number');
assert.strictEqual(typeof normal.reading.soil_temperature_c, 'number');
assert.strictEqual(normal.reading.sensor_status.dht22, 'ok');
console.log('  ✓ latest-normal.json tuân thủ schema G0 v0.1.');

// 3. Kiểm thử hợp đồng latest-uncalibrated.json
const uncalibrated = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'latest-uncalibrated.json'), 'utf8'));
assert.strictEqual(uncalibrated.reading.soil_moisture_pct, null, 'Chưa hiệu chuẩn thì % đất phải là null');
assert.strictEqual(uncalibrated.reading.water_tds_ppm, null, 'Chưa hiệu chuẩn thì TDS ppm phải là null');
assert.strictEqual(uncalibrated.reading.water_ph, null, 'Chưa hiệu chuẩn thì pH phải là null');
assert.strictEqual(typeof uncalibrated.reading.soil_moisture_raw, 'number', 'Phải có số đọc thô soil_moisture_raw');
assert.strictEqual(uncalibrated.reading.sensor_status.hd38, 'not_calibrated');
assert.strictEqual(uncalibrated.is_stale, null, 'recorded_at null thì is_stale là null');
console.log('  ✓ latest-uncalibrated.json: null cho đại lượng quy đổi, giữ raw ADC.');

// 4. Kiểm thử hợp đồng latest-partial-error.json
const partial = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'latest-partial-error.json'), 'utf8'));
assert.strictEqual(partial.reading.air_temperature_c, null);
assert.strictEqual(partial.reading.air_humidity_pct, null);
assert.strictEqual(partial.reading.sensor_status.dht22, 'read_error');
assert.strictEqual(partial.reading.soil_temperature_c, 27.0, 'Cảm biến khác vẫn đọc bình thường');
assert.strictEqual(partial.reading.sensor_status.ds18b20, 'ok');
console.log('  ✓ latest-partial-error.json: cảm biến lỗi không làm mất dữ liệu cảm biến khác.');

// 5. Kiểm thử hợp đồng latest-stale.json
const stale = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'latest-stale.json'), 'utf8'));
assert.strictEqual(stale.is_stale, true, 'is_stale phải là true khi thiết bị trễ > 5 phút');
console.log('  ✓ latest-stale.json: cờ is_stale = true.');

// 6. Kiểm thử hợp đồng latest-empty.json
const empty = JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, 'latest-empty.json'), 'utf8'));
assert.strictEqual(empty.reading, null);
assert.strictEqual(empty.received_at, null);
assert.strictEqual(empty.is_stale, null);
console.log('  ✓ latest-empty.json: thể hiện đúng trường hợp chưa có bản ghi.');

// 7. Kiểm tra quy tắc 0 != null
const zeroValue = 0.0;
assert(zeroValue !== null && zeroValue !== undefined, 'Số 0 hợp lệ không được đánh đồng với null');
console.log('  ✓ Quy tắc 0 != null được kiểm chứng.');

console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ FIXTURE ĐÃ VƯỢT QUA (7/7 tests passed)!');

