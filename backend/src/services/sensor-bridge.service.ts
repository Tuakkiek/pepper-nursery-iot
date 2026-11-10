import { config } from '../config';
import { IngestReadingDto } from '../schemas/reading.schema';
import { readingService } from './reading.service';

export interface BridgeFeedValues {
  field1?: number | string | null; // Air Temperature (°C)
  field2?: number | string | null; // Air Humidity (%)
  field3?: number | string | null; // Soil Temperature (°C)
  field4?: number | string | null; // Soil Moisture (%)
  field5?: number | string | null; // Water pH
  field6?: number | string | null; // Water TDS (ppm)
  field7?: number | string | null; // Soil Moisture ADC (raw)
  field8?: number | string | null; // Water pH ADC (raw)
  [key: string]: any;
}

export interface BridgeFeed {
  id: number;
  channel_id: number;
  values: BridgeFeedValues;
  received_at: string;
}

export interface BridgeFeedListResponse {
  channel_id: number;
  total: number;
  feeds: BridgeFeed[];
}

function parseNum(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? null : num;
}

function parseIntNum(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = typeof val === 'number' ? Math.round(val) : parseInt(val, 10);
  return isNaN(num) ? null : num;
}

export class SensorBridgeService {
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncAt: string | null = null;
  private lastEntryId: number | null = null;
  private totalSynced = 0;
  private lastError: string | null = null;

  // In-memory cache of latest readings from Bridge (bypasses DB if saveReadingsToDb = false)
  private cachedLatestReading: IngestReadingDto | null = null;
  private cachedHistory: { reading: IngestReadingDto; received_at: string }[] = [];

  getCachedLatestReading(): IngestReadingDto | null {
    return this.cachedLatestReading;
  }

  getCachedHistory(limit = 20): { reading: IngestReadingDto; received_at: string }[] {
    return this.cachedHistory.slice(0, limit);
  }

  getStatus() {
    const sb = config.sensorBridge;
    return {
      provider: 'sensor-data-bridge',
      enabled: sb.enabled,
      baseUrl: sb.baseUrl,
      frontendUrl: sb.frontendUrl,
      docsUrl: sb.docsUrl,
      channelId: sb.channelId,
      channel_id: sb.channelId,
      deviceId: sb.deviceId,
      pollIntervalMs: sb.pollIntervalMs,
      isPolling: this.timer !== null,
      is_running: this.timer !== null,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      lastEntryId: this.lastEntryId,
      totalSynced: this.totalSynced,
      lastError: this.lastError,
    };
  }

  mapFeedToDto(feed: BridgeFeed, deviceId: string): IngestReadingDto {
    const vals = typeof feed.values === 'string' ? JSON.parse(feed.values) : (feed.values || {});

    const airTemp = parseNum(vals.field1);
    const airHum = parseNum(vals.field2);
    const soilTemp = parseNum(vals.field3);
    const soilMoistPct = parseNum(vals.field4);
    const waterPh = parseNum(vals.field5);
    const waterTds = parseNum(vals.field6);
    const soilAdc = parseIntNum(vals.field7);
    const phAdc = parseIntNum(vals.field8);

    // Form UTC ISO timestamp from received_at
    let recordedAt: string | null = null;
    if (feed.received_at) {
      try {
        const raw = String(feed.received_at).trim();
        const isoString = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
        recordedAt = new Date(isoString).toISOString();
      } catch {
        recordedAt = null;
      }
    }

    return {
      schema_version: '0.1',
      device_id: deviceId,
      sample_id: `sdb-entry-${feed.id}`,
      recorded_at: recordedAt,
      air_temperature_c: airTemp,
      air_humidity_pct: airHum,
      soil_temperature_c: soilTemp,
      soil_moisture_raw: soilAdc,
      soil_moisture_pct: soilMoistPct,
      water_tds_adc_raw: null,
      water_tds_ppm: waterTds,
      water_ph_adc_raw: phAdc,
      water_ph: waterPh,
      sensor_status: {
        dht22: airTemp !== null || airHum !== null ? 'ok' : 'read_error',
        ds18b20: soilTemp !== null ? 'ok' : 'read_error',
        hd38: soilMoistPct !== null ? 'ok' : soilAdc !== null ? 'not_calibrated' : 'read_error',
        tds: waterTds !== null ? 'ok' : 'read_error',
        ph4502c: waterPh !== null ? 'ok' : phAdc !== null ? 'not_calibrated' : 'read_error',
      },
    };
  }

  async syncLatestFeeds(limit = 20): Promise<{
    fetched: number;
    created: number;
    duplicates: number;
    new_readings_count: number;
  }> {
    if (this.isSyncing) {
      return { fetched: 0, created: 0, duplicates: 0, new_readings_count: 0 };
    }

    this.isSyncing = true;
    let created = 0;
    let duplicates = 0;

    try {
      const sb = config.sensorBridge;
      const url = `${sb.baseUrl}/api/v1/channels/${sb.channelId}/feeds?limit=${limit}`;

      const res = await fetch(url, {
        headers: {
          'X-API-Key': sb.readApiKey,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Sensor Data Bridge API error HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as BridgeFeedListResponse;
      const feeds = data.feeds || [];

      const nowIso = new Date().toISOString();
      const items: { reading: IngestReadingDto; received_at: string }[] = [];

      for (const feed of feeds) {
        if (feed.id) {
          this.lastEntryId = Math.max(this.lastEntryId || 0, feed.id);
        }
        const dto = this.mapFeedToDto(feed, sb.deviceId);
        const itemReceivedAt = dto.recorded_at || nowIso;
        items.push({ reading: dto, received_at: itemReceivedAt });

        if (config.saveReadingsToDb) {
          const result = await readingService.ingestReading(dto);
          if (result.status === 'created') {
            created++;
            this.totalSynced++;
          } else if (result.status === 'duplicate') {
            duplicates++;
          }
        } else {
          // Bypassing DB storage for raw telemetry, saving to in-memory cache
          created++;
          this.totalSynced++;
        }
      }

      // Update in-memory caches (sorted newest first)
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
        this.cachedLatestReading = items[0].reading;
        this.cachedHistory = items;
      }

      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;

      return {
        fetched: feeds.length,
        created,
        duplicates,
        new_readings_count: created,
      };
    } catch (err: any) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  startPolling(): void {
    const sb = config.sensorBridge;
    if (!sb.enabled) {
      console.log('[Sensor Data Bridge] Polling worker is disabled in config.');
      return;
    }

    console.log(
      `[Sensor Data Bridge] Starting polling worker (URL: ${sb.baseUrl}, Channel: ${sb.channelId}, Interval: ${sb.pollIntervalMs}ms)...`
    );

    // Initial run immediately
    this.syncLatestFeeds(10)
      .then((res) => {
        if (res.created > 0) {
          console.log(`[Sensor Data Bridge] Initial sync: ${res.created} new readings ingested.`);
        } else {
          console.log(`[Sensor Data Bridge] Initial sync: checked ${res.fetched} feeds, all up to date.`);
        }
      })
      .catch((err) => {
        console.error('[Sensor Data Bridge] Initial sync failed:', err.message);
      });

    this.timer = setInterval(async () => {
      try {
        const res = await this.syncLatestFeeds(10);
        if (res.created > 0) {
          console.log(`[Sensor Data Bridge] Synced: ${res.created} new readings saved to MySQL.`);
        }
      } catch (err: any) {
        console.error('[Sensor Data Bridge] Polling error:', err.message);
      }
    }, sb.pollIntervalMs);
  }

  stopPolling(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const sensorBridgeService = new SensorBridgeService();

// Register bridge cache fallback with readingService (enables zero-DB mode when saveReadingsToDb is false)
readingService.setFallbackGetters(
  (deviceId: string) => {
    const cached = sensorBridgeService.getCachedLatestReading();
    return cached && cached.device_id === deviceId ? cached : null;
  },
  (deviceId: string, limit: number) => {
    const items = sensorBridgeService.getCachedHistory(limit);
    return items.filter((i) => i.reading.device_id === deviceId);
  }
);

