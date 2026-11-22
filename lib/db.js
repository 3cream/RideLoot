/* Postgres. One small pool per function instance; tables are created on first use. */
import pg from 'pg';
import { createHash, randomBytes } from 'node:crypto';

const URL = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
export const hasDb = () => !!URL;

let pool = null, ready = null;

function getPool() {
  if (!pool) {
    const local = /localhost|127\.0\.0\.1|\/var\/run|host=\//.test(URL);
    pool = new pg.Pool({ connectionString: URL, max: 3, idleTimeoutMillis: 10000, ssl: local ? false : { rejectUnauthorized: true } });
    pool.on('error', () => { /* an idle client dropped: the pool replaces it */ });
  }
  return pool;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS wallets (
  id BIGSERIAL PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  packs INTEGER NOT NULL DEFAULT 0 CHECK (packs >= 0),
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  session_id TEXT PRIMARY KEY,
  wallet_id BIGINT NOT NULL REFERENCES wallets(id),
  qty INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS pulls (
  pack_no BIGINT PRIMARY KEY,
  wallet_id BIGINT NOT NULL REFERENCES wallets(id),
  prize_id TEXT NOT NULL,
  entries INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pulls_wallet ON pulls (wallet_id);
CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY, n BIGINT NOT NULL);
INSERT INTO counter (id, n) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,
  packs INTEGER NOT NULL DEFAULT 1,
  wallet_id BIGINT REFERENCES wallets(id),
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

export async function db() {
  if (!URL) throw new Error('no database');
  const p = getPool();
  if (!ready) ready = p.query(SCHEMA).catch((e) => { ready = null; throw e; });
  await ready;
  return p;
}

/* run fn inside one transaction; it either all happens or none of it does */
export async function tx(fn) {
  const p = await db(), c = await p.connect();
  try {
    await c.query('BEGIN');
    const out = await fn(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (err) { /* connection already gone */ }
    throw e;
  } finally { c.release(); }
}

/* a wallet is known by a random token kept in the visitor's browser; only its hash is stored */
export const newToken = () => randomBytes(32).toString('hex');
export const hashToken = (t) => createHash('sha256').update(String(t)).digest('hex');
const TOKEN = /^[0-9a-f]{64}$/;

export async function walletFor(request) {
  const t = request.headers.get('x-wallet') || '';
  if (!TOKEN.test(t)) return null;
  const p = await db();
  const r = await p.query('SELECT id, email, packs, claimed FROM wallets WHERE token_hash = $1', [hashToken(t)]);
  return r.rows[0] || null;
}

/* everything the page needs to draw this visitor's state */
export async function walletState(q, id) {
  const w = (await q.query('SELECT packs, claimed FROM wallets WHERE id = $1', [id])).rows[0];
  const rows = (await q.query('SELECT prize_id, count(*)::int AS n, coalesce(sum(entries), 0)::bigint AS e FROM pulls WHERE wallet_id = $1 GROUP BY prize_id', [id])).rows;
  const n = (await q.query('SELECT n FROM counter WHERE id = 1')).rows[0].n;
  const pulls = {}; let opened = 0, entries = 0;
  for (const r of rows) { pulls[r.prize_id] = r.n; opened += r.n; entries += Number(r.e); }
  return { packs: w.packs, claimed: w.claimed, opened, pulls, entries, next_no: Number(n) + 1 };
}
