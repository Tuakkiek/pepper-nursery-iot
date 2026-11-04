import { app } from './app';
import { config } from './config';
import { checkDbConnection } from './db/connection';
import { runMigrations } from './db/migrations';
import { thingSpeakService } from './services/thingspeak.service';

async function startServer() {
  try {
    console.log('Connecting to MySQL database on Aiven...');
    await checkDbConnection();
    console.log('Database connected successfully.');

    // Ensure tables exist
    await runMigrations();

    app.listen(config.port, config.host, () => {
      console.log(`====================================================`);
      console.log(` Pepper Nursery IoT Backend is running!`);
      console.log(` Local URL:   http://localhost:${config.port}`);
      console.log(` Network URL: http://${config.host}:${config.port}`);
      console.log(` Contract:    v0.1 (/api/v1)`);
      console.log(` DB Host:     ${config.db.host}:${config.db.port}`);
      if (config.thingspeak.enabled) {
        console.log(` ThingSpeak:  Channel ${config.thingspeak.channelId} (Polling: ${config.thingspeak.pollIntervalMs}ms)`);
      }
      console.log(`====================================================`);

      // Start ThingSpeak sync worker
      thingSpeakService.startPolling();
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

