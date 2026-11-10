import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db/connection';
import { config } from '../config';
import { LoginDto, RegisterDto } from '../schemas/auth.schema';
import { AuthUser } from '../middlewares/auth.middleware';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        selected_device_id: user.selected_device_id || null,
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );
  }

  async register(dto: RegisterDto): Promise<{ user: AuthUser; token: string }> {
    const passwordHash = await this.hashPassword(dto.password);
    const role = dto.role || 'user';

    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES (?, ?, ?, ?)`,
      [dto.username, passwordHash, dto.full_name, role]
    );

    const user: AuthUser = {
      id: res.insertId,
      username: dto.username,
      full_name: dto.full_name,
      role: role as 'admin' | 'user',
      selected_device_id: null,
      device: null,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; token: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.password_hash, u.full_name, u.role, u.selected_device_id,
              d.name as device_name, d.description as device_description
       FROM users u
       LEFT JOIN devices d ON u.selected_device_id = d.device_id
       WHERE u.username = ?
       LIMIT 1`,
      [dto.username]
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const match = await this.comparePassword(dto.password, row.password_hash);
    if (!match) {
      return null;
    }

    const user: AuthUser = {
      id: row.id,
      username: row.username,
      full_name: row.full_name,
      role: row.role,
      selected_device_id: row.selected_device_id || null,
      device: row.selected_device_id
        ? {
            device_id: row.selected_device_id,
            name: row.device_name || row.selected_device_id,
            description: row.device_description || null,
          }
        : null,
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async getUserById(id: number): Promise<AuthUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.username, u.full_name, u.role, u.selected_device_id,
              d.name as device_name, d.description as device_description
       FROM users u
       LEFT JOIN devices d ON u.selected_device_id = d.device_id
       WHERE u.id = ?
       LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      role: r.role,
      selected_device_id: r.selected_device_id || null,
      device: r.selected_device_id
        ? {
            device_id: r.selected_device_id,
            name: r.device_name || r.selected_device_id,
            description: r.device_description || null,
          }
        : null,
    };
  }

  async selectUserDevice(
    userId: number,
    deviceIdOrName: string
  ): Promise<AuthUser | null> {
    const rawInput = String(deviceIdOrName).trim();
    if (!rawInput) return null;

    // 1. Find device by device_id OR name
    let [devRows] = await pool.query<RowDataPacket[]>(
      `SELECT device_id, name, description FROM devices WHERE device_id = ? OR name = ? LIMIT 1`,
      [rawInput, rawInput]
    );

    let device: { device_id: string; name: string; description: string | null };

    if (devRows.length > 0) {
      device = devRows[0] as any;
    } else {
      // Auto-register device if not found (e.g. newly entered channel id or name from bridge)
      const newDeviceId = rawInput;
      const newDeviceName = rawInput === '1' ? 'esp32-nursery-01' : `Trạm ${rawInput}`;
      await pool.query(
        `INSERT INTO devices (device_id, name, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE name = IF(name IS NULL OR TRIM(name) = '', VALUES(name), name)`,
        [newDeviceId, newDeviceName, `Thiết bị liên kết từ API read (${rawInput})`]
      );
      device = {
        device_id: newDeviceId,
        name: newDeviceName,
        description: `Thiết bị liên kết từ API read (${rawInput})`,
      };
    }

    // 2. Update user's selected_device_id
    await pool.query(
      `UPDATE users SET selected_device_id = ? WHERE id = ?`,
      [device.device_id, userId]
    );

    return this.getUserById(userId);
  }
}

export const authService = new AuthService();

