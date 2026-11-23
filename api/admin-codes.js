/* make single-use email codes, with an optional note of who each batch is for */
import { randomBytes } from 'node:crypto';
import { route, json, fail, body, isAdmin, adminReady } from '../lib/http.js';
import { db } from '../lib/db.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no look-alikes
const make = () => Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join('').replace(/^(.{5})/, '$1-');

export default route('POST', async (request) => {
  if (!adminReady()) return fail(503, 'no_admin');
  if (!isAdmin(request)) return fail(401, 'unauthorized');
  const b = await body(request);
  const n = Math.min(Math.max(Math.floor(Number(b.count)) || 1, 1), 200), packs = Math.min(Math.max(Math.floor(Number(b.packs)) || 1, 1), 10);
  const note = String(b.note || '').trim().slice(0, 200) || null;
  const p = await db(), out = [];
  while (out.length < n) {
    const r = await p.query('INSERT INTO codes (code, packs, note) VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING RETURNING code', [make(), packs, note]);
    if (r.rowCount) out.push(r.rows[0].code);
  }
  return json({ ok: true, packs, note, codes: out });
});
