import { Router } from 'express';
import {
  listDevicesHandler,
  getDeviceDetailHandler,
  createDeviceHandler,
  getLatestReadingHandler,
  getHistoryReadingsHandler,
  getRangeReadingsHandler,
  claimUserDeviceHandler,
  getUserDevicesHandler,
  updateUserDeviceNameHandler,
  removeUserDeviceHandler,
  setActiveDeviceHandler,
} from '../controllers/device.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { requireDeviceAccess } from '../middlewares/device-access.middleware';

export const deviceRouter = Router();

// User devices management routes (/devices/my...)
deviceRouter.get('/my', authenticate, getUserDevicesHandler);
deviceRouter.post('/my', authenticate, claimUserDeviceHandler);
deviceRouter.patch('/my/:device_id', authenticate, updateUserDeviceNameHandler);
deviceRouter.delete('/my/:device_id', authenticate, removeUserDeviceHandler);
deviceRouter.put('/my/:device_id/active', authenticate, setActiveDeviceHandler);

// GET /api/v1/devices (List all devices with latest reading & online status, ?search=...)
deviceRouter.get('/', authenticate, requireAdmin, listDevicesHandler);

// POST /api/v1/devices (Register/add a new device by ID & Name)
deviceRouter.post('/', authenticate, requireAdmin, createDeviceHandler);

// GET /api/v1/devices/:device_id/readings/latest (supports :device_id = '1', 'esp32-nursery-01', or 'me')
deviceRouter.get('/:device_id/readings/latest', authenticate, requireDeviceAccess, getLatestReadingHandler);

// GET /api/v1/devices/:device_id/readings/range?start_date=2026-11-08&end_date=2026-11-10
deviceRouter.get('/:device_id/readings/range', authenticate, requireDeviceAccess, getRangeReadingsHandler);

// GET /api/v1/devices/:device_id/readings?limit=20
deviceRouter.get('/:device_id/readings', authenticate, requireDeviceAccess, getHistoryReadingsHandler);

// GET /api/v1/devices/:device_id (Get device details by ID or Name)
deviceRouter.get('/:device_id', authenticate, requireDeviceAccess, getDeviceDetailHandler);

