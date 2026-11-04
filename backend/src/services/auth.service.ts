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
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; token: string } | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, password_hash, full_name, role
       FROM users
       WHERE username = ?
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
    };

    const token = this.generateToken(user);
    return { user, token };
  }

  async getUserById(id: number): Promise<AuthUser | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, full_name, role FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      username: r.username,
      full_name: r.full_name,
      role: r.role,
    };
  }
}

export const authService = new AuthService();
