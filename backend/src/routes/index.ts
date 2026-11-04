import { Router } from 'express';
import { readingRouter } from './reading.routes';
import { deviceRouter } from './device.routes';
import { thingSpeakService } from '../services/thingspeak.service';

export const apiRouter = Router();

apiRouter.use('/readings', readingRouter);
apiRouter.use('/devices', deviceRouter);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual trigger for ThingSpeak sync
apiRouter.post('/sync/thingspeak', async (req, res) => {
  try {
    const results = await thingSpeakService.syncLatestFeeds(20);
    res.status(200).json({
      status: 'ok',
      message: 'ThingSpeak sync completed',
      ...results,
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'thingspeak_sync_error',
        message: err.message,
      },
    });
  }
});

