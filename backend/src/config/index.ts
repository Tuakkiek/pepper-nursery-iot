import dotenv from 'dotenv';
dotenv.config();

function resolveBridgeUrl(rawUrl?: string): string {
  const url = (rawUrl || 'https://sensor-data-bridge-backend.onrender.com').trim().replace(/\/+$/, '');
  // Auto-normalize if user supplied frontend UI URL
  if (url.includes('sensor-data-bridge-frontened.onrender.com') || url.includes('sensor-data-bridge-frontend.onrender.com')) {
    return 'https://sensor-data-bridge-backend.onrender.com';
  }
  return url;
}

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  host: process.env.HOST || '0.0.0.0',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'defaultdb',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  },
  staleThresholdMinutes: parseInt(process.env.STALE_THRESHOLD_MINUTES || '5', 10),

  // Whether to persist raw sensor telemetry into MySQL readings table (can be disabled since Bridge stores history)
  saveReadingsToDb: process.env.SAVE_READINGS_TO_DB !== 'false',

  // Telemetry Ingestion Provider ('sensor_bridge' or 'thingspeak')
  telemetryProvider: (process.env.TELEMETRY_PROVIDER || 'sensor_bridge') as 'sensor_bridge' | 'thingspeak',

  // Sensor Data Bridge (Primary Ingest Gateway)
  sensorBridge: {
    enabled: process.env.SENSOR_BRIDGE_ENABLED !== 'false',
    baseUrl: resolveBridgeUrl(process.env.SENSOR_BRIDGE_URL),
    frontendUrl: 'https://sensor-data-bridge-frontened.onrender.com',
    docsUrl: 'https://sensor-data-bridge-backend.onrender.com/docs',
    readApiKey: (
      process.env.API_READ ||
      process.env.API_READ_KEY ||
      process.env.SENSOR_BRIDGE_READ_API_KEY ||
      'sdb_read_eqQ-gZ5w8NeWaDoWQbXitJa-FAemYtcKwC34BHMwKnw'
    ).trim(),
    channelId: parseInt(process.env.SENSOR_BRIDGE_CHANNEL_ID || '1', 10),
    deviceId: process.env.SENSOR_BRIDGE_DEVICE_ID || 'esp32-nursery-01',
    pollIntervalMs: parseInt(process.env.SENSOR_BRIDGE_POLL_INTERVAL_MS || '20000', 10),
  },

  // ThingSpeak (Legacy / Fallback)
  thingspeak: {
    enabled: process.env.THINGSPEAK_ENABLED === 'true',
    channelId: process.env.THINGSPEAK_CHANNEL_ID || '3543608',
    readApiKey: process.env.THINGSPEAK_READ_API_KEY || 'EB9BC5UY233Z23O4',
    deviceId: process.env.THINGSPEAK_DEVICE_ID || 'esp32-nursery-01',
    pollIntervalMs: parseInt(process.env.THINGSPEAK_POLL_INTERVAL_MS || '20000', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'pepper_nursery_secret_key_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
