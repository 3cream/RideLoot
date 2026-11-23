/* the buyer is back from Stripe: ask Stripe whether that session really finished, then add the packs once */
import { route, json, fail, body, getStripe } from '../lib/http.js';
import { db, walletFor, walletState } from '../lib/db.js';
import { fulfil } from '../lib/orders.js';

export default route('POST', async (request) => {
  const stripe = getStripe();
  if (!stripe) return fail(503, 'no_checkout');
  const w = await walletFor(request);
  if (!w) return fail(401, 'no_wallet');
  const id = String((await body(request)).session_id || '');
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return fail(400, 'bad_session');
  let session;
  try { session = await stripe.checkout.sessions.retrieve(id); } catch (e) { return fail(404, 'bad_session'); }
  const r = await fulfil(session);
  if (!r.ok) return fail(402, r.error);
  return json({ ok: true, credited: r.credited, qty: r.qty, emailed: r.emailed === true, mine: r.wallet_id === Number(w.id), ...(await walletState(await db(), w.id)) });
});
