import { pool } from '../db/connection';
import { dropTables, runMigrations } from '../db/migrations';
import { seedDatabase } from './seed';

async function main() {
  try {
    console.log('Resetting database...');
    await dropTables();
    await runMigrations();
    await seedDatabase();
    console.log('Database successfully reset and seeded.');
  } catch (err) {
    console.error('Reset failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

