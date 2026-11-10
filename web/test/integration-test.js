/**
 * Web <-> Backend Integration Test Suite (Phase 3 & Phase 5)
 * Kiểm thử tích hợp trực tiếp giữa Web Dashboard (DKhoa) và Backend API (TDat)
 * Chạy bằng: npm run test:integration hoặc node test/integration-test.js
 */

import assert from 'assert';

const BASE_URL = process.env.API_BASE_URL || 'https://pepper-nursery-iot.onrender.com';

async function testBackendIntegration() {
  console.log(`====================================================`);
  console.log(`Kiểm thử tích hợp Web Dashboard <-> Backend (Phase 3)`);
  console.log(`Địa chỉ Backend mục tiêu: ${BASE_URL}`);
  console.log(`====================================================\n`);

  let passed = 0;
  let total = 14;

  // 1. Health check
  try {
    process.stdout.write('1. Kiểm tra Backend Health Check (/api/v1/health)... ');
    const res = await fetch(`${BASE_URL}/api/v1/health`, { signal: AbortSignal.timeout(6000) });
    assert.strictEqual(res.status, 200, `Health check trả về status ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    console.log('✅ PASS (Backend đang hoạt động)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: Không thể kết nối Backend (${err.message}).`);
    console.log('👉 Vui lòng khởi động backend hoặc kiểm tra mạng.\n');
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

  // 7. Kiểm tra Auth API: Đăng nhập Admin
  let adminToken = '';
  try {
    process.stdout.write('7. Kiểm tra API Đăng nhập Admin (POST /api/v1/auth/login)... ');
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert(data.token, 'Phải trả về jwt token');
    assert.strictEqual(data.user.role, 'admin');
    adminToken = data.token;
    console.log('✅ PASS (Token nhận diện role: admin)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 8. Kiểm tra Auth API: Đăng nhập User thường
  let userToken = '';
  try {
    process.stdout.write('8. Kiểm tra API Đăng nhập User kỹ thuật (POST /api/v1/auth/login)... ');
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'user123' })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
    assert.strictEqual(data.user.role, 'user');
    userToken = data.token;
    console.log('✅ PASS (Token nhận diện role: user)');
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 9. Xác thực token phiên (/api/v1/auth/me)
  try {
    process.stdout.write('9. Kiểm tra phiên người dùng (GET /api/v1/auth/me)... ');
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.user.username, 'admin');
    console.log(`✅ PASS (Xác thực người dùng: ${data.user.full_name})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 10. Đọc danh sách Care Rules (GET /api/v1/rules)
  try {
    process.stdout.write('10. Đọc danh sách quy tắc chăm sóc (GET /api/v1/rules?all=true)... ');
    const res = await fetch(`${BASE_URL}/api/v1/rules?all=true`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert(Array.isArray(data.rules), 'rules phải là mảng');
    console.log(`✅ PASS (Tìm thấy ${data.rules.length} quy tắc sinh học)`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 11. Admin thêm quy tắc mới
  let testRuleId = null;
  const testRuleCode = `RULE_TEST_${Math.floor(Math.random() * 10000)}`;
  try {
    process.stdout.write('11. Admin thêm quy tắc mới (POST /api/v1/rules)... ');
    const res = await fetch(`${BASE_URL}/api/v1/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        rule_code: testRuleCode,
        name: 'Quy tắc thử nghiệm tích hợp React Web',
        parameter: 'air_temperature_c',
        operator: '>',
        threshold_min: 39.5,
        severity: 'danger',
        action_advice: 'Nhiệt độ không khí vượt ngưỡng cực hạn, bật hệ thống phun sương làm mát',
        is_active: true
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert(data.rule && data.rule.id);
    testRuleId = data.rule.id;
    console.log(`✅ PASS (Tạo thành công quy tắc ID #${testRuleId} mã ${testRuleCode})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  // 12. Admin chỉnh sửa quy tắc
  if (testRuleId) {
    try {
      process.stdout.write('12. Admin chỉnh sửa quy tắc (PUT /api/v1/rules/:id)... ');
      const res = await fetch(`${BASE_URL}/api/v1/rules/${testRuleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          threshold_min: 41.0,
          action_advice: 'Đã cập nhật ngưỡng thử nghiệm thành công'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.rule.threshold_min, 41.0);
      console.log('✅ PASS (Cập nhật ngưỡng thành công)');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
    }
  }

  // 13. Admin xóa quy tắc thử nghiệm
  if (testRuleId) {
    try {
      process.stdout.write('13. Admin xóa quy tắc thử nghiệm (DELETE /api/v1/rules/:id)... ');
      const res = await fetch(`${BASE_URL}/api/v1/rules/${testRuleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      console.log(`✅ PASS (Đã xóa an toàn quy tắc #${testRuleId})`);
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
    }
  }

  // 14. Kiểm tra ThingSpeak Worker Status
  try {
    process.stdout.write('14. Đọc trạng thái ThingSpeak Worker (GET /api/v1/sync/thingspeak/status)... ');
    const res = await fetch(`${BASE_URL}/api/v1/sync/thingspeak/status`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    console.log(`✅ PASS (Kênh ThingSpeak: ${data.channel_id || 3543608}, Polling: ${data.is_running ? 'Hoạt động' : 'Tạm dừng'})`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${err.message}`);
  }

  console.log(`\n====================================================`);
  console.log(`Kết quả kiểm thử tích hợp: ${passed}/${total} ca thành công!`);
  console.log(`====================================================\n`);
}

testBackendIntegration().catch(err => {
  console.error('Lỗi thực thi suite kiểm thử tích hợp:', err);
  process.exit(1);
});
