/* the free first pack: one per email address, one per wallet */
import { route, json, fail, body } from '../lib/http.js';
import { tx, walletFor, walletState } from '../lib/db.js';

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

export default route('POST', async (request) => {
  const w = await walletFor(request);
  if (!w) return fail(401, 'no_wallet');
  const email = String((await body(request)).email || '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) return fail(400, 'bad_email');
  return tx(async (c) => {
    const me = (await c.query('SELECT claimed FROM wallets WHERE id = $1 FOR UPDATE', [w.id])).rows[0];
    if (me.claimed) return json({ ok: true, already: true, ...(await walletState(c, w.id)) });
    const taken = await c.query('SELECT 1 FROM wallets WHERE email = $1 AND id <> $2', [email, w.id]);
    if (taken.rowCount) return fail(409, 'email_used');
    await c.query('UPDATE wallets SET claimed = TRUE, claimed_at = now(), email = $2, packs = packs + 1 WHERE id = $1', [w.id, email]);
    return json({ ok: true, ...(await walletState(c, w.id)) });
  });
});
