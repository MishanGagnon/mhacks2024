import { Pool } from 'pg';

let pool: Pool;

declare global {
    var pgPool: Pool;
  }
if (!global.pgPool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // You can add more Pool configurations here if needed
  });
  global.pgPool = pool;
} else {
  pool = global.pgPool;
}

export default pool;