import { runMigrations } from '../db/migrations';
import { pool } from '../db/connection';

async function main() {
  try {
    await runMigrations();
    console.log('Migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

