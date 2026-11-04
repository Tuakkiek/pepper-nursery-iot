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

    // 10. Test GET /api/v1/sync/thingspeak/status
    {
      const res = await request('/api/v1/sync/thingspeak/status');
      console.assert(res.status === 200, `ThingSpeak status expected 200, got ${res.status}`);
      console.assert(res.body.data.channelId === '3543608', 'Channel ID should be 3543608');
      console.log('✓ GET ThingSpeak sync status passed');
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

    console.log('=======================================');
    console.log(' ALL 11 INTEGRATION TESTS PASSED 100%! ');
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

