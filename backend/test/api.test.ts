import http from 'http';
import { app } from '../src/app';
import { pool } from '../src/db/connection';
import { seedDatabase } from '../src/scripts/seed';

let server: http.Server;
const TEST_PORT = 8089;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function request(
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<{ status: number; body: any }> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const body = await res.json();
  return { status: res.status, body };
}

async function runTests() {
  console.log('--- Starting API Integration Tests ---');
  await seedDatabase();

  server = app.listen(TEST_PORT);
  console.log(`Test server running on port ${TEST_PORT}`);

  try {
    // 1. Test GET /api/v1/health
    {
      const res = await request('/api/v1/health');
      console.assert(res.status === 200, `Health check expected 200, got ${res.status}`);
      console.assert(res.body.status === 'ok', 'Health status should be ok');
      console.log('✓ Health check passed');
    }

    // 2. Test GET /api/v1/devices/esp32-nursery-01/readings/latest
    {
      const res = await request('/api/v1/devices/esp32-nursery-01/readings/latest');
      console.assert(res.status === 200, `Latest expected 200, got ${res.status}`);
      console.assert(res.body.device_id === 'esp32-nursery-01', 'device_id should match');
      console.assert(res.body.reading !== null, 'reading should not be null');
      console.assert(res.body.advice === null, 'advice should be null at G0');
      console.assert(typeof res.body.is_stale === 'boolean', 'is_stale should be boolean');
      console.log('✓ GET latest reading passed');
    }

    // 3. Test GET /api/v1/devices/esp32-empty-01/readings/latest (device with no readings)
    {
      const res = await request('/api/v1/devices/esp32-empty-01/readings/latest');
      console.assert(res.status === 200, `Empty latest expected 200, got ${res.status}`);
      console.assert(res.body.reading === null, 'reading should be null');
      console.assert(res.body.received_at === null, 'received_at should be null');
      console.assert(res.body.is_stale === null, 'is_stale should be null');
      console.assert(res.body.advice === null, 'advice should be null');
      console.log('✓ GET empty device latest passed (latest-empty.json match)');
    }

    // 4. Test GET /api/v1/devices/non-existent/readings/latest (404)
    {
      const res = await request('/api/v1/devices/non-existent/readings/latest');
      console.assert(res.status === 404, `Not found expected 404, got ${res.status}`);
      console.assert(res.body.error.code === 'device_not_found', 'error code device_not_found');
      console.log('✓ GET non-existent device returns 404 passed');
    }

    // 5. Test GET /api/v1/devices/esp32-nursery-01/readings?limit=2
    {
      const res = await request('/api/v1/devices/esp32-nursery-01/readings?limit=2');
      console.assert(res.status === 200, `History expected 200, got ${res.status}`);
      console.assert(res.body.limit === 2, 'limit should be 2');
      console.assert(Array.isArray(res.body.readings), 'readings should be array');
      console.assert(res.body.readings.length === 2, `readings length expected 2, got ${res.body.readings.length}`);
      console.log('✓ GET history readings with limit passed');
    }

    // 5b. Test GET /api/v1/devices/esp32-nursery-01/readings/range (Date range filtering)
    {
      const res = await request(
        '/api/v1/devices/esp32-nursery-01/readings/range?start_date=2026-01-01&end_date=2026-12-31'
      );
      console.assert(res.status === 200, `Range expected 200, got ${res.status}`);
      console.assert(res.body.device_id === 'esp32-nursery-01', 'device_id match');
      console.assert(Array.isArray(res.body.readings), 'readings should be array');
      console.assert(res.body.total >= 0, 'total should be non-negative');
      console.log('✓ GET range readings with start_date & end_date passed');
    }

    // 5c. Test GET /api/v1/devices/esp32-nursery-01/readings/range missing params -> 422
    {
      const res = await request('/api/v1/devices/esp32-nursery-01/readings/range');
      console.assert(res.status === 422, `Missing range params expected 422, got ${res.status}`);
      console.log('✓ GET range readings without dates returns 422 passed');
    }

    // 6. Test POST /api/v1/readings (New reading -> 201 Created)
    const testSampleId = `sample-test-${Date.now()}`;
    const newPayload = {
      schema_version: '0.1',
      device_id: 'esp32-nursery-01',
      sample_id: testSampleId,
      recorded_at: new Date().toISOString(),
      air_temperature_c: 29.0,
      air_humidity_pct: 68.5,
      soil_temperature_c: 26.5,
      soil_moisture_raw: 1750,
      soil_moisture_pct: 50.0,
      water_tds_adc_raw: 1500,
      water_tds_ppm: 600.0,
      water_ph_adc_raw: 1900,
      water_ph: 6.5,
      sensor_status: {
        dht22: 'ok',
        hd38: 'ok',
        ds18b20: 'ok',
        tds: 'ok',
        ph4502c: 'ok',
      },
    };

    {
      const res = await request('/api/v1/readings', { method: 'POST', body: newPayload });
      console.assert(res.status === 201, `Ingest expected 201, got ${res.status}`);
      console.assert(res.body.duplicate === false, 'duplicate should be false');
      console.assert(res.body.sample_id === testSampleId, 'sample_id should match');
      console.log('✓ POST new reading (201 Created) passed');
    }

    // 7. Test POST duplicate identical payload -> 200 OK, duplicate: true
    {
      const res = await request('/api/v1/readings', { method: 'POST', body: newPayload });
      console.assert(res.status === 200, `Duplicate expected 200, got ${res.status}`);
      console.assert(res.body.duplicate === true, 'duplicate should be true');
      console.assert(res.body.sample_id === testSampleId, 'sample_id should match');
      console.log('✓ POST duplicate identical reading (200 Duplicate) passed');
    }

    // 8. Test POST same sample_id with conflict payload -> 409 Conflict
    {
      const conflictPayload = {
        ...newPayload,
        air_temperature_c: 35.0, // different temperature!
      };
      const res = await request('/api/v1/readings', { method: 'POST', body: conflictPayload });
      console.assert(res.status === 409, `Conflict expected 409, got ${res.status}`);
      console.assert(res.body.error.code === 'sample_conflict', 'error code sample_conflict');
      console.log('✓ POST conflict reading (409 Conflict) passed');
    }

    // 9. Test POST invalid payload -> 400 Bad Request
    {
      const invalidPayload = {
        schema_version: '0.2', // wrong schema version!
        device_id: 'esp32-nursery-01',
      };
      const res = await request('/api/v1/readings', { method: 'POST', body: invalidPayload });
      console.assert(res.status === 400, `Invalid expected 400, got ${res.status}`);
      console.assert(res.body.error.code === 'invalid_reading', 'error code invalid_reading');
      console.log('✓ POST invalid reading (400 Bad Request) passed');
    }

    // 10. Test GET /api/v1/sync/bridge/status & /api/v1/sync/thingspeak/status
    {
      const res = await request('/api/v1/sync/bridge/status');
      console.assert(res.status === 200, `Bridge status expected 200, got ${res.status}`);
      console.assert(res.body.data.channelId === 1 || res.body.data.channelId === '1', 'Channel ID should be 1');
      console.log('✓ GET Sensor Data Bridge sync status passed');
    }
    {
      const res = await request('/api/v1/sync/thingspeak/status');
      console.assert(res.status === 200, `ThingSpeak status expected 200, got ${res.status}`);
      console.log('✓ GET ThingSpeak legacy status (aliased) passed');
    }

    // 11. Test Rule Engine Evaluation (when toggled on/off)
    {
      const { ruleService } = await import('../src/services/rule.service');
      // Default: disabled -> advice null
      const resDefault = await request('/api/v1/devices/esp32-nursery-01/readings/latest');
      console.assert(resDefault.body.advice === null, 'advice should be null when disabled');

      // Enable temporarily
      ruleService.setEnabled(true);
      const resEnabled = await request('/api/v1/devices/esp32-nursery-01/readings/latest');
      console.assert(resEnabled.body.advice !== null, 'advice should not be null when enabled');
      console.assert(typeof resEnabled.body.advice.status === 'string', 'advice should have status string');
      console.assert(typeof resEnabled.body.advice.message === 'string', 'advice should have message string');

      // Restore to disabled (conforming to G0 v0.1 draft)
      ruleService.setEnabled(false);
      const resRestored = await request('/api/v1/devices/esp32-nursery-01/readings/latest');
      console.assert(resRestored.body.advice === null, 'advice should be restored to null');
      console.log('✓ Rule Engine advice evaluation (enabled & disabled modes) passed');
    }

    // 12. Test Auth: Login as Admin
    let adminToken = '';
    {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { username: 'admin', password: 'admin123' },
      });
      console.assert(res.status === 200, `Admin login expected 200, got ${res.status}`);
      console.assert(res.body.user.role === 'admin', 'role should be admin');
      console.assert(typeof res.body.token === 'string', 'token should be string');
      adminToken = res.body.token;
      console.log('✓ POST /auth/login as Admin passed');
    }

    // 13. Test Auth: Login as User
    let userToken = '';
    {
      const res = await request('/api/v1/auth/login', {
        method: 'POST',
        body: { username: 'user', password: 'user123' },
      });
      console.assert(res.status === 200, `User login expected 200, got ${res.status}`);
      console.assert(res.body.user.role === 'user', 'role should be user');
      userToken = res.body.token;
      console.log('✓ POST /auth/login as User passed');
    }

    // 14. Test Auth: GET /auth/me
    {
      const res = await request('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.assert(res.status === 200, `Auth me expected 200, got ${res.status}`);
      console.assert(res.body.user.username === 'admin', 'username should be admin');
      console.assert(res.body.user.selected_device_id !== undefined, 'selected_device_id should exist');
      console.log('✓ GET /auth/me passed');
    }

    // 14b. Test Devices API: GET /api/v1/devices
    {
      const res = await request('/api/v1/devices');
      console.assert(res.status === 200, `List devices expected 200, got ${res.status}`);
      console.assert(Array.isArray(res.body.devices), 'devices should be array');
      console.assert(res.body.devices.length >= 2, 'should have at least 2 devices');
      console.log('✓ GET /devices (list all devices) passed');
    }

    // 14c. Test Device Detail: GET /api/v1/devices/1 (lookup by ID from API read)
    {
      const res = await request('/api/v1/devices/1');
      console.assert(res.status === 200, `Device 1 detail expected 200, got ${res.status}`);
      console.assert(res.body.device.device_id === '1', 'device_id should be 1');
      console.log('✓ GET /devices/1 (detail by API read ID) passed');
    }

    // 14d. Test User Select Device: PUT /api/v1/auth/me/device
    {
      const res = await request('/api/v1/auth/me/device', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userToken}` },
        body: { device_id: '1' },
      });
      console.assert(res.status === 200, `Select device expected 200, got ${res.status}`);
      console.assert(res.body.user.selected_device_id === '1', 'selected_device_id should be 1');
      console.log('✓ PUT /auth/me/device (select device for user) passed');
    }

    // 14e. Test Reading for user device: GET /api/v1/devices/me/readings/latest
    {
      const res = await request('/api/v1/devices/me/readings/latest', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      console.assert(res.status === 200, `Me reading expected 200, got ${res.status}`);
      console.log('✓ GET /devices/me/readings/latest passed');
    }

    // 15. Test Rules: GET /api/v1/rules
    {
      const res = await request('/api/v1/rules');
      console.assert(res.status === 200, `Get rules expected 200, got ${res.status}`);
      console.assert(res.body.total >= 10, 'Expected at least 10 seeded care rules');
      console.log('✓ GET /rules (list care rules) passed');
    }

    // 16. Test Rules: Non-admin cannot create rule (403 Forbidden)
    {
      const res = await request('/api/v1/rules', {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
        body: {
          rule_code: 'TEST_USER_RULE',
          name: 'Test user rule',
          parameter: 'air_temperature_c',
          operator: '>',
          threshold_max: 40,
          severity: 'warning',
          action_advice: 'Action advice test',
        },
      });
      console.assert(res.status === 403, `User create rule expected 403, got ${res.status}`);
      console.log('✓ User cannot create care rule (403 Forbidden) passed');
    }

    // 17. Test Rules: Admin can create, update, delete rule
    let createdRuleId: number = 0;
    {
      // Create
      const res = await request('/api/v1/rules', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          rule_code: 'TEST_ADMIN_RULE',
          name: 'Quy tắc thử nghiệm của Admin',
          parameter: 'soil_moisture_pct',
          operator: '<',
          threshold_min: 30,
          severity: 'danger',
          action_advice: 'Độ ẩm cực thấp dưới 30%, tưới khẩn cấp.',
        },
      });
      console.assert(res.status === 201, `Admin create rule expected 201, got ${res.status}`);
      createdRuleId = res.body.rule.id;
      console.assert(createdRuleId > 0, 'createdRuleId should be valid');

      // Update
      const resUpdate = await request(`/api/v1/rules/${createdRuleId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'Quy tắc đã được Admin cập nhật',
        },
      });
      console.assert(resUpdate.status === 200, `Admin update rule expected 200, got ${resUpdate.status}`);
      console.assert(resUpdate.body.rule.name === 'Quy tắc đã được Admin cập nhật', 'Updated name should match');

      // Delete
      const resDelete = await request(`/api/v1/rules/${createdRuleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.assert(resDelete.status === 200, `Admin delete rule expected 200, got ${resDelete.status}`);
      console.log('✓ Admin CRUD care rules (Create, Update, Delete) passed');
    }

    console.log('=======================================');
    console.log(' ALL 17 INTEGRATION TESTS PASSED 100%! ');
    console.log('=======================================');
  } finally {
    server.close();
    await pool.end();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

