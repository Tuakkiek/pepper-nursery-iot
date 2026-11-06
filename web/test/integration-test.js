/**
 * Web <-> Backend Integration Test Suite (Phase 3 & Phase 5)
 * Kiểm thử tích hợp trực tiếp giữa Web Dashboard (DKhoa) và Backend API (TDat)
 * Chạy bằng: node test/integration-test.js
 */

const assert = require('assert');

const BASE_URL = process.env.API_BASE_URL || 'https://pepper-nursery-iot.onrender.com';

async function testBackendIntegration() {
  console.log(`====================================================`);
  console.log(`Kiểm thử tích hợp Web Dashboard <-> Backend (Phase 3)`);
  console.log(`Địa chỉ Backend mục tiêu: ${BASE_URL}`);
  console.log(`====================================================\n`);

  let passed = 0;
  let total = 6;

  // 1. Health check
  try {
    process.stdout.write('1. Kiểm tra Backend Health Check (/api/v1/health)... ');
    const res = await fetch(`${BASE_URL}/api/v1/health`, { signal: AbortSignal.timeout(4000) });
    assert.strictEqual(res.status, 200, `Health check trả về status ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    console.log('✅ PASS (Backend đang hoạt động)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: Không thể kết nối Backend (${err.message}).`);
    console.log('👉 Vui lòng khởi động backend bằng lệnh: cd backend && npm run dev\n');
    return;
  }

  // 2. Trạm bình thường (esp32-nursery-01)
  try {
    process.stdout.write('2. Đọc số đo mới nhất của esp32-nursery-01... ');
    const res = await fetch(`${BASE_URL}/api/v1/devices/esp32-nursery-01/readings/latest`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.device_id, 'esp32-nursery-01');
    assert(data.reading !== null, 'Trạm esp32-nursery-01 phải có bản ghi reading');
    assert(data.reading.sample_id, 'Phải có sample_id');
    assert(data.reading.sensor_status, 'Phải có sensor_status');
    const tempDisplay = data.reading.soil_temperature_c !== null ? `${data.reading.soil_temperature_c} °C (Đất)` : `${data.reading.air_temperature_c} °C (KK)`;
    console.log(`✅ PASS (Mã mẫu: ${data.reading.sample_id}, Nhiệt độ: ${tempDisplay})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 3. Trạm dữ liệu cũ (esp32-stale-01)
  try {
    process.stdout.write('3. Kiểm tra cờ is_stale của trạm esp32-stale-01... ');
    const res = await fetch(`${BASE_URL}/api/v1/devices/esp32-stale-01/readings/latest`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.is_stale, true, 'is_stale phải là true khi trễ > 5 phút');
    console.log('✅ PASS (Đúng cờ is_stale: true)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 4. Trạm mới chưa có dữ liệu (esp32-empty-01)
  try {
    process.stdout.write('4. Kiểm tra trạm mới chưa gửi số đo (esp32-empty-01)... ');
    const res = await fetch(`${BASE_URL}/api/v1/devices/esp32-empty-01/readings/latest`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.reading, null, 'Trạm mới thì reading phải là null');
    assert.strictEqual(data.received_at, null);
    console.log('✅ PASS (Đúng định dạng reading: null)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 5. Kiểm tra thiết bị không tồn tại (404 device_not_found)
  try {
    process.stdout.write('5. Kiểm tra mã lỗi thiết bị không tồn tại (esp32-unknown)... ');
    const res = await fetch(`${BASE_URL}/api/v1/devices/esp32-unknown/readings/latest`);
    assert.strictEqual(res.status, 404);
    const data = await res.json();
    assert.strictEqual(data.error.code, 'device_not_found');
    console.log('✅ PASS (Nhận đúng 404 device_not_found)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 6. Lịch sử số đo (limit=20)
  try {
    process.stdout.write('6. Lấy lịch sử số đo (/readings?limit=20)... ');
    const res = await fetch(`${BASE_URL}/api/v1/devices/esp32-nursery-01/readings?limit=20`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.readings), 'readings phải là mảng');
    console.log(`✅ PASS (Nhận ${data.readings.length} bản ghi lịch sử)`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  console.log(`\n====================================================`);
  console.log(`Kết quả kiểm thử tích hợp: ${passed}/${total} ca thành công!`);
  console.log(`====================================================`);
}

testBackendIntegration();

