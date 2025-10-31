import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'servetrack',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let db;

try {
  db = mysql.createPool(config);
  if (process.env.NODE_ENV === 'development') {
    console.log('[database] Connection pool initialized');
  }
} catch (err) {
  console.error('[database] Failed to initialize pool:', err);
  throw err;
}

/**
 * Utility to verify DB connection health.
 */
export async function testConnection() {
  const conn = await db.getConnection();
  await conn.ping();
  conn.release();
  return true;
}

export default db;