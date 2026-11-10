import { Router } from 'express';
import {
  getLatestReadingHandler,
  getHistoryReadingsHandler,
  getRangeReadingsHandler,
} from '../controllers/device.controller';

export const deviceRouter = Router();

// GET /api/v1/devices/:device_id/readings/latest
deviceRouter.get('/:device_id/readings/latest', getLatestReadingHandler);

// GET /api/v1/devices/:device_id/readings/range?start_date=2026-11-08&end_date=2026-11-10
deviceRouter.get('/:device_id/readings/range', getRangeReadingsHandler);

// GET /api/v1/devices/:device_id/readings?limit=20
deviceRouter.get('/:device_id/readings', getHistoryReadingsHandler);

