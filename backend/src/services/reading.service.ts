import crypto from 'crypto';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/connection';
import { config } from '../config';
import { IngestReadingDto } from '../schemas/reading.schema';

export interface LatestResponse {
  device_id: string;
  reading: IngestReadingDto | null;
  received_at: string | null;
  is_stale: boolean | null;
  advice: null | {
    version: string;
    status: string;
    message: string;
  };
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
  return dateObj.toISOString().replace('.000Z', 'Z');
}

export class ReadingService {
  async ensureDevice(deviceId: string, name?: string): Promise<void> {
    await pool.query(
      `INSERT INTO devices (device_id, name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE device_id = device_id`,
      [deviceId, name || deviceId]
    );
  }

  async deviceExists(deviceId: string): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM devices WHERE device_id = ? LIMIT 1',
      [deviceId]
    );
    return rows.length > 0;
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
    const exists = await this.deviceExists(deviceId);
    if (!exists) {
      return null;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT raw_payload, recorded_at, received_at
       FROM readings
       WHERE device_id = ?
       ORDER BY received_at DESC, id DESC
       LIMIT 1`,
      [deviceId]
    );

    if (rows.length === 0) {
      return {
        device_id: deviceId,
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

    let isStale: boolean | null = null;
    if (reading.recorded_at) {
      const recordedTime = new Date(reading.recorded_at).getTime();
      const diffMinutes = (Date.now() - recordedTime) / (1000 * 60);
      isStale = diffMinutes > config.staleThresholdMinutes;
    }

    return {
      device_id: deviceId,
      reading,
      received_at: formatUtcIso(row.received_at),
      is_stale: isStale,
      advice: null, // G0 contract: advice is null until MThuy's rules are approved
    };
  }

  async getHistoryReadings(deviceId: string, limitInput?: number): Promise<HistoryResponse | null> {
    const exists = await this.deviceExists(deviceId);
    if (!exists) {
      return null;
    }

    let limit = 20;
    if (limitInput !== undefined && !isNaN(limitInput)) {
      limit = Math.min(Math.max(limitInput, 1), 100);
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT raw_payload, received_at
       FROM readings
       WHERE device_id = ?
       ORDER BY received_at DESC, id DESC
       LIMIT ?`,
      [deviceId, limit]
    );

    const items: HistoryItem[] = rows.map((r) => ({
      reading: typeof r.raw_payload === 'string' ? JSON.parse(r.raw_payload) : r.raw_payload,
      received_at: formatUtcIso(r.received_at)!,
    }));

    return {
      device_id: deviceId,
      limit,
      readings: items,
    };
  }
}

export const readingService = new ReadingService();

