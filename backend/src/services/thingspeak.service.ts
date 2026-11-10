import { config } from '../config';
import { IngestReadingDto } from '../schemas/reading.schema';
import { readingService } from './reading.service';
import { sensorBridgeService } from './sensor-bridge.service';

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null;
  field2: string | null;
  field3: string | null;
  field4: string | null;
  field5: string | null;
  field6: string | null;
  field7: string | null;
  field8: string | null;
}

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    last_entry_id: number;
  };
  feeds: ThingSpeakFeed[];
}

function parseNum(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function parseIntNum(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

export class ThingSpeakService {
  private timer: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private lastSyncAt: string | null = null;
  private lastEntryId: number | null = null;
  private totalSynced = 0;
  private lastError: string | null = null;

  getStatus() {
    if (config.telemetryProvider === 'sensor_bridge') {
      const sbStatus = sensorBridgeService.getStatus();
      return {
        ...sbStatus,
        // compatibility aliases
        channelId: String(sbStatus.channelId),
        channel_id: sbStatus.channelId,
        isPolling: sbStatus.isPolling,
        is_running: sbStatus.isPolling,
      };
    }

    return {
      provider: 'thingspeak',
      enabled: config.thingspeak.enabled,
      channelId: config.thingspeak.channelId,
      channel_id: config.thingspeak.channelId,
      deviceId: config.thingspeak.deviceId,
      pollIntervalMs: config.thingspeak.pollIntervalMs,
      isPolling: this.timer !== null,
      is_running: this.timer !== null,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      lastEntryId: this.lastEntryId,
      totalSynced: this.totalSynced,
      lastError: this.lastError,
    };
  }

  mapFeedToDto(feed: ThingSpeakFeed, deviceId: string): IngestReadingDto {
    const airTemp = parseNum(feed.field1);
    const airHum = parseNum(feed.field2);
    const soilTemp = parseNum(feed.field3);
    const soilMoistPct = parseNum(feed.field4);
    const waterPh = parseNum(feed.field5);
    const waterTds = parseNum(feed.field6);
    const soilAdc = parseIntNum(feed.field7);
    const phAdc = parseIntNum(feed.field8);

    let recordedAt: string | null = null;
    if (feed.created_at) {
      try {
        recordedAt = new Date(feed.created_at).toISOString();
      } catch {
        recordedAt = null;
      }
    }

    return {
      schema_version: '0.1',
      device_id: deviceId,
      sample_id: `ts-entry-${feed.entry_id}`,
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

  async syncLatestFeeds(results = 10): Promise<{ fetched: number; created: number; duplicates: number; new_readings_count?: number }> {
    if (config.telemetryProvider === 'sensor_bridge') {
      return sensorBridgeService.syncLatestFeeds(results);
    }

    if (this.isSyncing) {
      return { fetched: 0, created: 0, duplicates: 0, new_readings_count: 0 };
    }

    this.isSyncing = true;
    let created = 0;
    let duplicates = 0;

    try {
      const url = `https://api.thingspeak.com/channels/${config.thingspeak.channelId}/feeds.json?api_key=${config.thingspeak.readApiKey}&results=${results}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`ThingSpeak API error HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as ThingSpeakResponse;
      const feeds = data.feeds || [];

      if (data.channel && data.channel.last_entry_id !== undefined) {
        this.lastEntryId = data.channel.last_entry_id;
      }

      for (const feed of feeds) {
        const dto = this.mapFeedToDto(feed, config.thingspeak.deviceId);
        const result = await readingService.ingestReading(dto);
        if (result.status === 'created') {
          created++;
          this.totalSynced++;
        } else if (result.status === 'duplicate') {
          duplicates++;
        }
      }

      this.lastSyncAt = new Date().toISOString();
      this.lastError = null;

      return { fetched: feeds.length, created, duplicates, new_readings_count: created };
    } catch (err: any) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.isSyncing = false;
    }
  }

  startPolling(): void {
    if (config.telemetryProvider === 'sensor_bridge') {
      sensorBridgeService.startPolling();
      return;
    }

    if (!config.thingspeak.enabled) {
      console.log('ThingSpeak sync is disabled in config.');
      return;
    }

    console.log(
      `Starting ThingSpeak polling worker (Channel: ${config.thingspeak.channelId}, Interval: ${config.thingspeak.pollIntervalMs}ms)...`
    );

    this.syncLatestFeeds()
      .then((res) => {
        if (res.created > 0) {
          console.log(`[ThingSpeak Worker] Initial sync: ${res.created} new readings ingested.`);
        }
      })
      .catch((err) => {
        console.error('[ThingSpeak Worker] Initial sync failed:', err.message);
      });

    this.timer = setInterval(async () => {
      try {
        const res = await this.syncLatestFeeds();
        if (res.created > 0) {
          console.log(`[ThingSpeak Worker] Synced: ${res.created} new readings saved to MySQL.`);
        }
      } catch (err: any) {
        console.error('[ThingSpeak Worker] Polling error:', err.message);
      }
    }, config.thingspeak.pollIntervalMs);
  }

  stopPolling(): void {
    if (config.telemetryProvider === 'sensor_bridge') {
      sensorBridgeService.stopPolling();
      return;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const thingSpeakService = new ThingSpeakService();
