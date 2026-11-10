import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/connection';

// Serialize changes per account, then lock the hardware row. Two buyers cannot
// claim the same device even if both requests arrive at the same instant.
async function withAccount<T>(userId: number, action: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
    const result = await action(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function lockDevice(conn: PoolConnection, deviceId: string) {
  const [rows] = await conn.query<RowDataPacket[]>(
    'SELECT device_id, name, owner_id, description FROM devices WHERE device_id = ? FOR UPDATE',
    [deviceId.trim()]
  );
  return rows[0];
}

export const deviceOwnershipService = {
  async claim(userId: number, deviceId: string, customName?: string) {
    return withAccount(userId, async conn => {
      const device = await lockDevice(conn, deviceId);
      if (!device) return { status: 'not_found', message: 'Không tìm thấy device ID. Kiểm tra mã trong hộp sản phẩm.' };
      if (device.owner_id !== null && device.owner_id !== userId) {
        return { status: 'conflict', message: 'Thiết bị đã được liên kết với một tài khoản khác.' };
      }
      const name = customName?.trim() || device.name;
      await conn.query('UPDATE devices SET owner_id = ?, name = ? WHERE device_id = ?', [userId, name, device.device_id]);
      await conn.query('UPDATE users SET selected_device_id = ? WHERE id = ? AND selected_device_id IS NULL', [device.device_id, userId]);
      return { status: 'ok', message: 'Đã thêm thiết bị vào tài khoản.', device: {
        device_id: device.device_id, name, description: device.description,
      } };
    });
  },

  async rename(userId: number, deviceId: string, name: string) {
    return withAccount(userId, async conn => {
      const device = await lockDevice(conn, deviceId);
      if (!device) return { status: 'not_found', message: 'Thiết bị không tồn tại.' };
      if (device.owner_id !== userId) return { status: 'forbidden', message: 'Thiết bị không thuộc tài khoản của bạn.' };
      await conn.query('UPDATE devices SET name = ? WHERE device_id = ?', [name.trim(), device.device_id]);
      return { status: 'ok', device: { device_id: device.device_id, name: name.trim() } };
    });
  },

  async remove(userId: number, deviceId: string) {
    return withAccount(userId, async conn => {
      const device = await lockDevice(conn, deviceId);
      if (!device) return { status: 'not_found', message: 'Thiết bị không tồn tại.' };
      if (device.owner_id !== userId) return { status: 'forbidden', message: 'Thiết bị không thuộc tài khoản của bạn.' };
      await conn.query('UPDATE devices SET owner_id = NULL WHERE device_id = ?', [device.device_id]);
      const [remaining] = await conn.query<RowDataPacket[]>(
        'SELECT device_id FROM devices WHERE owner_id = ? ORDER BY created_at ASC, device_id ASC', [userId]
      );
      await conn.query('UPDATE users SET selected_device_id = ? WHERE id = ? AND selected_device_id = ?',
        [remaining[0]?.device_id ?? null, userId, device.device_id]);
      const [users] = await conn.query<RowDataPacket[]>('SELECT selected_device_id FROM users WHERE id = ?', [userId]);
      return { status: 'ok', message: 'Đã gỡ thiết bị khỏi tài khoản.',
        remaining_devices_count: remaining.length, active_device_id: users[0]?.selected_device_id ?? null };
    });
  },

  async setActive(userId: number, deviceId: string) {
    return withAccount(userId, async conn => {
      const device = await lockDevice(conn, deviceId);
      if (!device) return { status: 'not_found', message: 'Thiết bị không tồn tại.' };
      if (device.owner_id !== userId) return { status: 'forbidden', message: 'Thiết bị không thuộc tài khoản của bạn.' };
      await conn.query('UPDATE users SET selected_device_id = ? WHERE id = ?', [device.device_id, userId]);
      return { status: 'ok', active_device_id: device.device_id as string };
    });
  },
};
