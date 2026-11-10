import assert from 'node:assert/strict';
import { test } from 'node:test';
import mysql from 'mysql2/promise';
import { app } from '../src/app';
import { pool } from '../src/db/connection';
import { config } from '../src/config';
import { runMigrations } from '../src/db/migrations';
import { authService } from '../src/services/auth.service';
import { sensorBridgeService } from '../src/services/sensor-bridge.service';

// This suite creates its own schema. Never run against the application's DB.
const enabled = process.env.RUN_OWNERSHIP_DB_TESTS === '1';
test('account/device lifecycle against isolated MySQL and real HTTP API', { skip: !enabled }, async t => {
  assert.ok(['127.0.0.1', 'localhost'].includes(config.db.host), 'Test DB must be local');
  assert.match(config.db.database, /^pepper_test_[a-z0-9_]+$/);
  const admin = await mysql.createConnection({ host: config.db.host, port: config.db.port,
    user: config.db.user, password: config.db.password });
  // CREATE without IF NOT EXISTS prevents accidentally reusing an existing DB.
  await admin.query(`CREATE DATABASE \`${config.db.database}\``);
  await admin.end();
  await runMigrations();
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const port = (server.address() as { port: number }).port;
  const request = async (method: string, path: string, token?: string, body?: object) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/v1${path}`, { method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, body: await response.json() as any };
  };
  let alice: string, bob: string;
  try {
    await t.test('registration creates a user with zero devices and rejects admin role', async () => {
      const escalated = await request('POST', '/auth/register', undefined, { username: 'bad', password: 'secret123', full_name: 'Bad', role: 'admin' });
      assert.equal(escalated.status, 400);
      const a = await request('POST', '/auth/register', undefined, { username: 'alice', password: 'secret123', full_name: 'Alice' });
      const b = await request('POST', '/auth/register', undefined, { username: 'bob', password: 'secret123', full_name: 'Bob' });
      assert.equal(a.status, 201); assert.equal(b.status, 201); assert.equal(a.body.user.role, 'user');
      alice = a.body.token; bob = b.body.token;
      const empty = await request('GET', '/user/devices', alice);
      assert.equal(empty.status, 200); assert.deepEqual(empty.body.devices, []); assert.equal(empty.body.active_device_id, null);
      const latest = await request('GET', '/devices/me/readings/latest', alice);
      assert.equal(latest.status, 404); assert.equal(latest.body.error.code, 'no_active_device');
      const duplicate = await request('POST', '/auth/register', undefined, { username: 'alice', password: 'secret123', full_name: 'Alice' });
      assert.equal(duplicate.status, 409);
      assert.equal((await request('POST', '/auth/login', undefined, { username: 'alice', password: 'wrong' })).status, 401);
      assert.equal((await request('POST', '/auth/login', undefined, { username: 'alice', password: 'secret123' })).status, 200);
    });
    await t.test('only admin provisions hardware; unknown ID is not created by claim', async () => {
      assert.equal((await request('POST', '/devices', alice, { device_id: 'A', name: 'A' })).status, 403);
      const unknown = await request('POST', '/user/devices', alice, { device_id: 'unknown' });
      assert.equal(unknown.status, 404); assert.equal(unknown.body.error.code, 'device_not_found');
      const adminToken = authService.generateToken({ id: 999, username: 'admin', full_name: 'Admin', role: 'admin' });
      for (const id of ['A', 'B', 'C', 'RACE']) assert.equal((await request('POST', '/devices', adminToken, { device_id: id, name: `Khay ${id}` })).status, 201);
      assert.equal((await request('GET', '/devices/A/readings/latest')).status, 401);
      assert.equal((await request('GET', '/devices', alice)).status, 403);
    });
    await t.test('one account owns multiple devices; the other cannot claim/read/change them', async () => {
      for (const id of ['A', 'B', 'C']) assert.equal((await request('POST', '/user/devices', alice, { device_id: id })).status, 201);
      assert.equal((await request('POST', '/user/devices', alice, { device_id: 'A' })).status, 201); // idempotent
      const conflict = await request('POST', '/user/devices', bob, { device_id: 'A' });
      assert.equal(conflict.status, 409); assert.equal(conflict.body.error.code, 'device_already_claimed');
      for (const path of ['/devices/A', '/devices/A/readings/latest', '/devices/A/readings', '/devices/A/readings/range?start_date=2026-11-01&end_date=2026-11-11']) {
        assert.equal((await request('GET', path, bob)).status, 403);
      }
      assert.equal((await request('PATCH', '/user/devices/A', bob, { name: 'Steal' })).status, 403);
      assert.equal((await request('DELETE', '/user/devices/A', bob)).status, 403);
      assert.equal((await request('PUT', '/user/devices/A/active', bob)).status, 403);
      assert.equal((await request('PUT', '/auth/me/device', bob, { device_id: 'A' })).status, 404);
      assert.equal((await request('PUT', '/user/devices/RACE/active', bob)).status, 403);
      assert.equal((await request('GET', '/user/devices', alice)).body.total, 3);
    });
    await t.test('active device comes from DB, rename survives ingest, zero and null survive API', async () => {
      assert.equal((await request('PUT', '/user/devices/C/active', alice)).status, 200);
      assert.equal((await request('GET', '/devices/me/readings/latest', alice)).body.device_id, 'C');
      assert.equal((await request('PATCH', '/user/devices/C', alice, { name: 'Ban công' })).status, 200);
      assert.equal((await request('PATCH', '/user/devices/C', alice, { name: '   ' })).status, 400);
      const reading = { schema_version: '0.1', device_id: 'C', sample_id: 'zero-test', recorded_at: new Date().toISOString(),
        air_temperature_c: 25, air_humidity_pct: 60, soil_temperature_c: 26, soil_moisture_raw: 4086, soil_moisture_pct: 0,
        water_tds_adc_raw: null, water_tds_ppm: null, water_ph_adc_raw: 1000, water_ph: 6.2,
        sensor_status: { dht22: 'ok', ds18b20: 'ok', hd38: 'ok', tds: 'read_error', ph4502c: 'ok' } };
      assert.equal((await request('POST', '/readings', undefined, reading)).status, 201);
      const latest = await request('GET', '/devices/me/readings/latest', alice);
      assert.equal(latest.body.reading.soil_moisture_pct, 0); assert.equal(latest.body.reading.water_tds_ppm, null);
      assert.equal(latest.body.name, 'Ban công');
      assert.equal((await request('GET', '/devices/C/readings', alice)).body.readings.length, 1);
    });
    await t.test('removing non-active preserves active; unlink allows reclaim and removes old access', async () => {
      const removed = await request('DELETE', '/user/devices/B', alice);
      assert.equal(removed.status, 200); assert.equal(removed.body.active_device_id, 'C');
      assert.equal((await request('DELETE', '/user/devices/C', alice)).body.active_device_id, 'A');
      assert.equal((await request('GET', '/devices/C/readings/latest', alice)).status, 403);
      assert.equal((await request('POST', '/user/devices', bob, { device_id: 'C' })).status, 201);
      assert.equal((await request('GET', '/devices/C/readings', bob)).body.readings.length, 1);
      const last = await request('DELETE', '/user/devices/A', alice);
      assert.equal(last.body.active_device_id, null); assert.equal(last.body.remaining_devices_count, 0);
    });
    await t.test('simultaneous claims have exactly one winner under InnoDB row locking', async () => {
      const results = await Promise.all([alice, bob].map(token => request('POST', '/user/devices', token, { device_id: 'RACE' })));
      assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
      const lists = await Promise.all([alice, bob].map(token => request('GET', '/user/devices', token)));
      assert.equal(lists.flatMap(r => r.body.devices).filter(d => d.device_id === 'RACE').length, 1);
    });
    await t.test('bridge cache cannot leak between legacy device IDs', async () => {
      const adminToken = authService.generateToken({ id: 999, username: 'admin', full_name: 'Admin', role: 'admin' });
      for (const id of ['1', 'esp32-nursery-01']) {
        await request('POST', '/devices', adminToken, { device_id: id, name: id });
      }
      await request('POST', '/user/devices', alice, { device_id: '1' });
      await request('POST', '/user/devices', bob, { device_id: 'esp32-nursery-01' });
      const cached = { device_id: '1', sample_id: 'cache-only', recorded_at: null };
      Object.assign(sensorBridgeService, { cachedLatestReading: cached,
        cachedHistory: [{ reading: cached, received_at: new Date().toISOString() }] });
      assert.equal((await request('GET', '/devices/1/readings/latest', alice)).body.reading.device_id, '1');
      assert.equal((await request('GET', '/devices/esp32-nursery-01/readings/latest', bob)).body.reading, null);
      assert.equal((await request('GET', '/devices/esp32-nursery-01/readings', bob)).body.readings.length, 0);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
});
