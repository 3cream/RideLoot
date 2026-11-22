/* make single-use email codes. Needs the ADMIN_TOKEN set in the host's settings, sent as "authorization: Bearer <token>". */
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { route, json, fail, body } from '../lib/http.js';
import { db } from '../lib/db.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no look-alikes
const make = () => Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join('').replace(/^(.{5})/, '$1-');

export default route('POST', async (request) => {
  const want = process.env.ADMIN_TOKEN || '', got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (want.length < 24 || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return fail(401, 'unauthorized');
  const b = await body(request), n = Math.min(Math.max(Number(b.count) || 1, 1), 500), packs = Math.min(Math.max(Number(b.packs) || 1, 1), 10);
  const p = await db(), out = [];
  while (out.length < n) {
    const code = make();
    const r = await p.query('INSERT INTO codes (code, packs) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING RETURNING code', [code, packs]);
    if (r.rowCount) out.push(code);
  }
  return json({ ok: true, packs, codes: out });
});
