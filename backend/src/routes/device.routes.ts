import { Router } from 'express';
import {
  getLatestReadingHandler,
  getHistoryReadingsHandler,
} from '../controllers/device.controller';

export const deviceRouter = Router();

// GET /api/v1/devices/:device_id/readings/latest
deviceRouter.get('/:device_id/readings/latest', getLatestReadingHandler);

// GET /api/v1/devices/:device_id/readings?limit=20
deviceRouter.get('/:device_id/readings', getHistoryReadingsHandler);

