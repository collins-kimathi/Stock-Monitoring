import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set. Copy server/.env.example to server/.env and fill it in.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Force Node.js to prefer IPv4 when DNS returns both families.
  // Supabase direct connection only has an IPv6 record; the pooler has IPv4.
  family: 4
});

export async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a series of statements inside a single transaction.
 * `fn` receives a client and must use it (not the pool) for every query.
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
