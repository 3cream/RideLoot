/* an email-exclusive code: single use, adds the packs it carries */
import { route, json, fail, body } from '../lib/http.js';
import { tx, walletFor, walletState } from '../lib/db.js';

export default route('POST', async (request) => {
  const w = await walletFor(request);
  if (!w) return fail(401, 'no_wallet');
  const code = String((await body(request)).code || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,24}$/.test(code)) return fail(400, 'bad_code');
  return tx(async (c) => {
    const r = await c.query('UPDATE codes SET wallet_id = $2, redeemed_at = now() WHERE code = $1 AND redeemed_at IS NULL RETURNING packs', [code, w.id]);
    if (!r.rowCount) return fail(404, 'bad_code');
    await c.query('UPDATE wallets SET packs = packs + $2 WHERE id = $1', [w.id, r.rows[0].packs]);
    return json({ ok: true, added: r.rows[0].packs, ...(await walletState(c, w.id)) });
  });
});
