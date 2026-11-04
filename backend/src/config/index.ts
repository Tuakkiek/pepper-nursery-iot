import dotenv from 'dotenv';
dotenv.config();

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
  thingspeak: {
    enabled: process.env.THINGSPEAK_ENABLED !== 'false',
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

