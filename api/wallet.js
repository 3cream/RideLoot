/* GET: this visitor's packs, pulls and entries. POST: start a new wallet. */
import { json, fail } from '../lib/http.js';
import { db, walletFor, walletState, newToken, hashToken } from '../lib/db.js';

export default {
  async fetch(request) {
    try {
      const p = await db();
      if (request.method === 'GET') {
        const w = await walletFor(request);
        if (!w) return fail(401, 'no_wallet');
        return json({ ok: true, ...(await walletState(p, w.id)) });
      }
      if (request.method === 'POST') {
        const token = newToken();
        const r = await p.query('INSERT INTO wallets (token_hash) VALUES ($1) RETURNING id', [hashToken(token)]);
        return json({ ok: true, token, ...(await walletState(p, r.rows[0].id)) });
      }
      return fail(405, 'method');
    } catch (e) {
      console.error(e);
      return fail(e && e.message === 'no database' ? 503 : 500, e && e.message === 'no database' ? 'not_ready' : 'server');
    }
  },
};
