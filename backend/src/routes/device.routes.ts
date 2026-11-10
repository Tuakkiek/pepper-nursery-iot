import { Router } from 'express';
import {
  listDevicesHandler,
  getDeviceDetailHandler,
  createDeviceHandler,
  getLatestReadingHandler,
  getHistoryReadingsHandler,
  getRangeReadingsHandler,
} from '../controllers/device.controller';

export const deviceRouter = Router();

// GET /api/v1/devices (List all devices with latest reading & online status, ?search=...)
deviceRouter.get('/', listDevicesHandler);

// POST /api/v1/devices (Register/add a new device by ID & Name)
deviceRouter.post('/', createDeviceHandler);

// GET /api/v1/devices/:device_id/readings/latest (supports :device_id = '1', 'esp32-nursery-01', or 'me')
deviceRouter.get('/:device_id/readings/latest', getLatestReadingHandler);

// GET /api/v1/devices/:device_id/readings/range?start_date=2026-11-08&end_date=2026-11-10
deviceRouter.get('/:device_id/readings/range', getRangeReadingsHandler);

// GET /api/v1/devices/:device_id/readings?limit=20
deviceRouter.get('/:device_id/readings', getHistoryReadingsHandler);

// GET /api/v1/devices/:device_id (Get device details by ID or Name)
deviceRouter.get('/:device_id', getDeviceDetailHandler);

