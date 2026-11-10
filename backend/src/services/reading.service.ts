import crypto from 'crypto';
import { deviceOwnershipService } from './device-ownership.service';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/connection';
import { config } from '../config';
import { IngestReadingDto } from '../schemas/reading.schema';
import { ruleService, AdviceResult } from './rule.service';
import { careRuleService } from './care-rule.service';

export interface LatestResponse {
  device_id: string;
  name?: string;
  reading: IngestReadingDto | null;
  received_at: string | null;
  is_stale: boolean | null;
  advice: AdviceResult | null;
}

export interface HistoryItem {
  reading: IngestReadingDto;
  received_at: string;
}

export interface HistoryResponse {
  device_id: string;
  limit: number;
  readings: HistoryItem[];
}

export interface RangeResponse {
  device_id: string;
  start_date: string;
  end_date: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  readings: HistoryItem[];
}

export interface HistoryQueryOptions {
  limit?: number;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  tz?: string;
  order?: 'desc' | 'asc';
  page?: number;
  page_size?: number;
}

export function computePayloadHash(dto: IngestReadingDto): string {
  // Canonical string: sort keys to ensure stable hash
  const canonicalObj = {
    schema_version: dto.schema_version,
    device_id: dto.device_id,
    sample_id: dto.sample_id,
    recorded_at: dto.recorded_at,
    air_temperature_c: dto.air_temperature_c,
    air_humidity_pct: dto.air_humidity_pct,
    soil_temperature_c: dto.soil_temperature_c,
    soil_moisture_raw: dto.soil_moisture_raw,
    soil_moisture_pct: dto.soil_moisture_pct,
    water_tds_adc_raw: dto.water_tds_adc_raw,
    water_tds_ppm: dto.water_tds_ppm,
    water_ph_adc_raw: dto.water_ph_adc_raw,
    water_ph: dto.water_ph,
    sensor_status: {
      dht22: dto.sensor_status.dht22,
      hd38: dto.sensor_status.hd38,
      ds18b20: dto.sensor_status.ds18b20,
      tds: dto.sensor_status.tds,
      ph4502c: dto.sensor_status.ph4502c,
    },
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonicalObj)).digest('hex');
}

export function formatUtcIso(d: Date | string | null): string | null {
  if (!d) return null;
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString();
}

export class ReadingService {
  private fallbackLatestGetter: ((deviceId: string) => IngestReadingDto | null) | null = null;
  private fallbackHistoryGetter: (
    (deviceId: string, limit: number, options?: HistoryQueryOptions) => HistoryItem[] | null
  ) | null = null;

  setFallbackGetters(
    latest: (deviceId: string) => IngestReadingDto | null,
    history: (deviceId: string, limit: number, options?: HistoryQueryOptions) => HistoryItem[] | null
  ) {
    this.fallbackLatestGetter = latest;
    this.fallbackHistoryGetter = history;
  }

  async ensureDevice(deviceId: string, name?: string): Promise<void> {
    await pool.query(
      `INSERT INTO devices (device_id, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE device_id = VALUES(device_id)`,
      [deviceId, name || deviceId]
    );
  }

  async resolveDevice(
    deviceIdOrName: string
  ): Promise<{ device_id: string; name: string; owner_id: number | null; description: string | null } | null> {
    const raw = String(deviceIdOrName).trim();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT device_id, name, owner_id, description FROM devices WHERE device_id = ? OR name = ? ORDER BY device_id = ? DESC LIMIT 1`,
      [raw, raw, raw]
    );
    if (rows.length > 0) {
      return rows[0] as any;
    }
    return null;
  }

  async deviceExists(deviceId: string): Promise<boolean> {
    const dev = await this.resolveDevice(deviceId);
    return dev !== null;
  }

  async listDevices(search?: string): Promise<{
    device_id: string;
    name: string;
    description: string | null;
    created_at: string;
    is_online: boolean;
    latest_reading: any;
  }[]> {
    let query = `SELECT device_id, name, description, created_at FROM devices`;
    const params: any[] = [];
    if (search) {
      query += ` WHERE device_id LIKE ? OR name LIKE ? OR description LIKE ?`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    query += ` ORDER BY created_at ASC`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const result = [];
    for (const r of rows) {
      const latest = await this.getLatestReading(r.device_id);
      const isOnline = latest && latest.is_stale === false && latest.reading !== null;
      result.push({
        device_id: r.device_id,
        name: r.name,
        description: r.description,
        created_at: formatUtcIso(r.created_at) || new Date().toISOString(),
        is_online: Boolean(isOnline),
        latest_reading: latest?.reading || null,
      });
    }

    return result;
  }

  async createDevice(data: {
    device_id: string;
    name: string;
    description?: string | null;
  }): Promise<{ device_id: string; name: string; description: string | null }> {
    await pool.query(
      `INSERT INTO devices (device_id, name, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description)`,
      [data.device_id, data.name, data.description || null]
    );
    return {
      device_id: data.device_id,
      name: data.name,
      description: data.description || null,
    };
  }

  claimDeviceForUser(userId: number, deviceId: string, customName?: string) {
    return deviceOwnershipService.claim(userId, deviceId, customName);
  }

  async getUserDevices(userId: number): Promise<{
    active_device_id: string | null;
    total: number;
    devices: any[];
  }> {
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT selected_device_id FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    const activeDeviceId = userRows.length > 0 ? userRows[0].selected_device_id : null;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT device_id, name, description, created_at
       FROM devices
       WHERE owner_id = ?
       ORDER BY created_at ASC`,
      [userId]
    );

    const devices = [];
    for (const r of rows) {
      const latest = await this.getLatestReading(r.device_id);
      const isOnline = latest && latest.is_stale === false && latest.reading !== null;
      devices.push({
        device_id: r.device_id,
        name: r.name,
        description: r.description,
        created_at: formatUtcIso(r.created_at) || new Date().toISOString(),
        is_active: r.device_id === activeDeviceId,
        is_online: Boolean(isOnline),
        latest_reading: latest?.reading || null,
        latest_advice: latest?.advice || null,
      });
    }

    return {
      active_device_id: activeDeviceId,
      total: devices.length,
      devices,
    };
  }

  updateUserDeviceName(userId: number, deviceId: string, name: string) {
    return deviceOwnershipService.rename(userId, deviceId, name);
  }

  removeUserDevice(userId: number, deviceId: string) {
    return deviceOwnershipService.remove(userId, deviceId);
  }

  setUserActiveDevice(userId: number, deviceId: string) {
    return deviceOwnershipService.setActive(userId, deviceId);
  }

  async ingestReading(dto: IngestReadingDto): Promise<
    | { status: 'created'; received_at: string }
    | { status: 'duplicate'; received_at: string }
    | { status: 'conflict' }
  > {
    // Ensure device exists
    await this.ensureDevice(dto.device_id);

    const payloadHash = computePayloadHash(dto);

    // Check for existing (device_id, sample_id)
    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT received_at, payload_hash FROM readings WHERE device_id = ? AND sample_id = ? LIMIT 1',
      [dto.device_id, dto.sample_id]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.payload_hash === payloadHash) {
        return {
          status: 'duplicate',
          received_at: formatUtcIso(existing.received_at)!,
        };
      } else {
        return { status: 'conflict' };
      }
    }

    const now = new Date();
    const receivedAtIso = now.toISOString();

    await pool.query<ResultSetHeader>(
      `INSERT INTO readings (
        device_id, sample_id, schema_version, recorded_at, received_at,
        air_temperature_c, air_humidity_pct, soil_temperature_c,
        soil_moisture_raw, soil_moisture_pct, water_tds_adc_raw, water_tds_ppm,
        water_ph_adc_raw, water_ph, sensor_status, payload_hash, raw_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.device_id,
        dto.sample_id,
        dto.schema_version,
        dto.recorded_at ? new Date(dto.recorded_at) : null,
        now,
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
        payloadHash,
        JSON.stringify(dto),
      ]
    );

    return {
      status: 'created',
      received_at: receivedAtIso,
    };
  }

  async getLatestReading(deviceId: string): Promise<LatestResponse | null> {
    const dev = await this.resolveDevice(deviceId);
    if (!dev) {
      return null;
    }
    const targetId = dev.device_id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT raw_payload, recorded_at, received_at
       FROM readings
       WHERE device_id = ? OR device_id = ?
       ORDER BY received_at DESC, id DESC
       LIMIT 1`,
      [targetId, deviceId]
    );

    if (rows.length === 0) {
      if (this.fallbackLatestGetter) {
        const cached = this.fallbackLatestGetter(targetId);
        if (cached) {
          let isStale: boolean | null = null;
          if (cached.recorded_at) {
            const recordedTime = new Date(cached.recorded_at).getTime();
            const diffMinutes = (Date.now() - recordedTime) / (1000 * 60);
            isStale = diffMinutes > config.staleThresholdMinutes;
          }

          let advice: AdviceResult | null = null;
          if (ruleService.isEnabled()) {
            advice = await careRuleService.evaluateActiveRules(cached, isStale);
            if (!advice) {
              advice = ruleService.evaluate(cached, isStale);
            }
          }

          return {
            device_id: deviceId,
            name: dev.name,
            reading: cached,
            received_at: cached.recorded_at || new Date().toISOString(),
            is_stale: isStale,
            advice,
          };
        }
      }

      return {
        device_id: deviceId,
        name: dev.name,
        reading: null,
        received_at: null,
        is_stale: null,
        advice: null,
      };
    }

    const row = rows[0];
    const reading: IngestReadingDto = typeof row.raw_payload === 'string'
      ? JSON.parse(row.raw_payload)
      : row.raw_payload;

    if (reading && reading.recorded_at) {
      reading.recorded_at = formatUtcIso(reading.recorded_at);
    }

    let isStale: boolean | null = null;
    if (reading.recorded_at) {
      const recordedTime = new Date(reading.recorded_at).getTime();
      const diffMinutes = (Date.now() - recordedTime) / (1000 * 60);
      isStale = diffMinutes > config.staleThresholdMinutes;
    }

    let advice: AdviceResult | null = null;
    if (ruleService.isEnabled()) {
      advice = await careRuleService.evaluateActiveRules(reading, isStale);
      if (!advice) {
        advice = ruleService.evaluate(reading, isStale);
      }
    }

    return {
      device_id: deviceId,
      name: dev.name,
      reading,
      received_at: formatUtcIso(row.received_at),
      is_stale: isStale,
      advice,
    };
  }

  async getHistoryReadings(deviceId: string, limitInput?: number): Promise<HistoryResponse | null> {
    const dev = await this.resolveDevice(deviceId);
    if (!dev) {
      return null;
    }
    const targetId = dev.device_id;

    let limit = 20;
    if (limitInput !== undefined && !isNaN(limitInput)) {
      limit = Math.min(Math.max(limitInput, 1), 100);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT raw_payload, received_at
       FROM readings
       WHERE device_id = ? OR device_id = ?
       ORDER BY received_at DESC, id DESC
       LIMIT ?`,
      [targetId, deviceId, limit]
    );

    if (rows.length === 0 && this.fallbackHistoryGetter) {
      const cachedItems = this.fallbackHistoryGetter(targetId, limit);
      if (cachedItems && cachedItems.length > 0) {
        return {
          device_id: deviceId,
          limit,
          readings: cachedItems,
        };
      }
    }

    const items: HistoryItem[] = rows.map((r) => {
      const reading: IngestReadingDto = typeof r.raw_payload === 'string'
        ? JSON.parse(r.raw_payload)
        : r.raw_payload;
      if (reading && reading.recorded_at) {
        reading.recorded_at = formatUtcIso(reading.recorded_at);
      }
      return {
        reading,
        received_at: formatUtcIso(r.received_at)!,
      };
    });

    return {
      device_id: deviceId,
      limit,
      readings: items,
    };
  }

  async getRangeReadings(
    deviceId: string,
    options: {
      start_date: string;
      end_date: string;
      start_time?: string;
      end_time?: string;
      tz?: string;
      order?: 'desc' | 'asc';
      page?: number;
      page_size?: number;
      limit?: number;
    }
  ): Promise<RangeResponse | null> {
    const dev = await this.resolveDevice(deviceId);
    if (!dev) {
      return null;
    }
    const targetId = dev.device_id;

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.page_size || 20));
    const order = options.order === 'asc' ? 'ASC' : 'DESC';

    const startTime = options.start_time || '00:00:00';
    const endTime = options.end_time || '23:59:59';
    const startIso = `${options.start_date} ${startTime}`;
    const endIso = `${options.end_date} ${endTime}`;

    // Try DB query first
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as cnt
       FROM readings
       WHERE (device_id = ? OR device_id = ?)
         AND (
           (recorded_at IS NOT NULL AND recorded_at >= ? AND recorded_at <= ?)
           OR (recorded_at IS NULL AND received_at >= ? AND received_at <= ?)
         )`,
      [targetId, deviceId, startIso, endIso, startIso, endIso]
    );

    const dbTotal = Number((countRows[0] as any)?.cnt || 0);

    // If no DB rows found, try fallback from sensor-bridge cache
    if (dbTotal === 0 && this.fallbackHistoryGetter) {
      const allCached = this.fallbackHistoryGetter(targetId, 1000, {
        start_date: options.start_date,
        end_date: options.end_date,
        start_time: options.start_time,
        end_time: options.end_time,
        order: options.order,
      });

      if (allCached) {
        const total = allCached.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const offset = (page - 1) * pageSize;
        const pagedReadings = options.limit
          ? allCached.slice(0, Math.min(options.limit, pageSize))
          : allCached.slice(offset, offset + pageSize);

        return {
          device_id: deviceId,
          start_date: options.start_date,
          end_date: options.end_date,
          total,
          page,
          page_size: pageSize,
          total_pages: totalPages,
          readings: pagedReadings,
        };
      }
    }

    const offset = (page - 1) * pageSize;
    const fetchLimit = options.limit ? Math.min(options.limit, pageSize) : pageSize;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT raw_payload, received_at
       FROM readings
       WHERE (device_id = ? OR device_id = ?)
         AND (
           (recorded_at IS NOT NULL AND recorded_at >= ? AND recorded_at <= ?)
           OR (recorded_at IS NULL AND received_at >= ? AND received_at <= ?)
         )
       ORDER BY COALESCE(recorded_at, received_at) ${order}
       LIMIT ? OFFSET ?`,
      [targetId, deviceId, startIso, endIso, startIso, endIso, fetchLimit, offset]
    );

    const items: HistoryItem[] = rows.map((r) => {
      const reading: IngestReadingDto =
        typeof r.raw_payload === 'string' ? JSON.parse(r.raw_payload) : r.raw_payload;
      if (reading && reading.recorded_at) {
        reading.recorded_at = formatUtcIso(reading.recorded_at);
      }
      return {
        reading,
        received_at: formatUtcIso(r.received_at)!,
      };
    });

    const totalPages = Math.ceil(dbTotal / pageSize) || 1;

    return {
      device_id: deviceId,
      start_date: options.start_date,
      end_date: options.end_date,
      total: dbTotal,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      readings: items,
    };
  }
}

export const readingService = new ReadingService();

