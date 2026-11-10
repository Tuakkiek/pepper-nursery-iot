import { Request, Response, NextFunction } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db/connection';
import { readingService } from '../services/reading.service';

// Resolve "me" from the database: the selected device in a JWT may be outdated.
export async function requireDeviceAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let deviceId = req.params.device_id;
    if (deviceId === 'me') {
      const [users] = await pool.query<RowDataPacket[]>(
        'SELECT selected_device_id FROM users WHERE id = ? LIMIT 1', [req.user!.id]
      );
      deviceId = users[0]?.selected_device_id;
      if (!deviceId) {
        res.status(404).json({ error: { code: 'no_active_device', message: 'Tài khoản chưa chọn thiết bị.' } });
        return;
      }
    }
    const device = await readingService.resolveDevice(deviceId);
    if (!device) {
      res.status(404).json({ error: { code: 'device_not_found', message: 'Thiết bị không tồn tại.' } });
      return;
    }
    if (req.user!.role !== 'admin' && device.owner_id !== req.user!.id) {
      res.status(403).json({ error: { code: 'forbidden', message: 'Thiết bị không thuộc tài khoản của bạn.' } });
      return;
    }
    req.params.device_id = device.device_id;
    next();
  } catch (error) {
    next(error);
  }
}
