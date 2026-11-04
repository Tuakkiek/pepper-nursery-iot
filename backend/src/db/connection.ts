import mysql from 'mysql2/promise';
import { config } from '../config';

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  ssl: config.db.ssl,
  timezone: 'Z', // Enforce UTC timestamps across all MySQL date/time operations
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function checkDbConnection(): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.query('SELECT 1');
  } finally {
    conn.release();
  }
}

