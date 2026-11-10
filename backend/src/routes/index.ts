import { Router } from 'express';
import { readingRouter } from './reading.routes';
import { deviceRouter } from './device.routes';
import { authRouter } from './auth.routes';
import { ruleRouter } from './rule.routes';
import { thingSpeakService } from '../services/thingspeak.service';
import { sensorBridgeService } from '../services/sensor-bridge.service';
import {
  claimUserDeviceHandler,
  getUserDevicesHandler,
  updateUserDeviceNameHandler,
  removeUserDeviceHandler,
  setActiveDeviceHandler,
} from '../controllers/device.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', authRouter);

// Dedicated user devices route (/api/v1/user/devices...)
const userDeviceRouter = Router();
userDeviceRouter.get('/devices', authenticate, getUserDevicesHandler);
userDeviceRouter.post('/devices', authenticate, claimUserDeviceHandler);
userDeviceRouter.patch('/devices/:device_id', authenticate, updateUserDeviceNameHandler);
userDeviceRouter.delete('/devices/:device_id', authenticate, removeUserDeviceHandler);
userDeviceRouter.put('/devices/:device_id/active', authenticate, setActiveDeviceHandler);
apiRouter.use('/user', userDeviceRouter);

apiRouter.use('/rules', ruleRouter);
apiRouter.use('/readings', readingRouter);
apiRouter.use('/devices', deviceRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sensor Data Bridge Status & Manual Trigger
apiRouter.get('/sync/bridge/status', (req, res) => {
  const status = sensorBridgeService.getStatus();
  res.status(200).json({
    status: 'ok',
    channel_id: status.channelId,
    is_running: status.isPolling,
    data: status,
  });
});

apiRouter.post('/sync/bridge', async (req, res) => {
  try {
    const results = await sensorBridgeService.syncLatestFeeds(20);
    res.status(200).json({
      status: 'ok',
      message: 'Sensor Data Bridge sync completed',
      ...results,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'sensor_bridge_sync_error',
        message: err.message,
      },
    });
  }
});

// ThingSpeak legacy routes (Aliased to telemetry provider for full frontend backward compatibility)
apiRouter.get('/sync/thingspeak/status', (req, res) => {
  const status = thingSpeakService.getStatus();
  res.status(200).json({
    status: 'ok',
    channel_id: status.channelId,
    is_running: status.isPolling,
    data: status,
  });
});

apiRouter.post('/sync/thingspeak', async (req, res) => {
  try {
    const results = await thingSpeakService.syncLatestFeeds(20);
    res.status(200).json({
      status: 'ok',
      message: 'Telemetry sync completed',
      ...results,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'sync_error',
        message: err.message,
      },
    });
  }
});
