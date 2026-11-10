import bcrypt from 'bcryptjs';
import { deviceOwnershipService } from './device-ownership.service';
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
    const role = 'user';

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
    const result = await deviceOwnershipService.setActive(userId, deviceIdOrName);
    if (result.status !== 'ok') return null;
    return this.getUserById(userId);
  }
}

export const authService = new AuthService();

