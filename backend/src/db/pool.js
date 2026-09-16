import pg from 'pg';
import 'dotenv/config';

const { Pool, types } = pg;

// Postgres DATE (OID 1082) comes back as a JS Date object by default, which pg
// then serializes using the server's local timezone. That shifts the displayed
// date by a day depending on server TZ vs UTC (e.g. "2026-09-13" can render as
// "2026-09-12T18:30:00.000Z" in JSON). We only ever need plain date strings for
// deadlines, so keep them as-is instead of letting pg convert to a Date object.
types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon (and most managed Postgres hosts) require SSL.
  // Harmless for local Postgres too since it's only applied when the URL asks for it.
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
});