/* turning a finished Stripe Checkout Session into packs, exactly once */
import { tx } from './db.js';
import { PACK_SIZES } from './game.js';
import { sendWallpaper } from './mail.js';

/* returns { ok, credited, qty, wallet_id }. Safe to call any number of times for the same session. */
export async function fulfil(session) {
  if (!session || session.status !== 'complete') return { ok: false, error: 'not_complete' };
  if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') return { ok: false, error: 'unpaid' };
  const meta = session.metadata || {};
  const walletId = Number(meta.wallet_id), qty = Number(meta.qty);
  if (!Number.isInteger(walletId) || !PACK_SIZES.includes(qty)) return { ok: false, error: 'bad_session' };
  const email = (session.customer_details && session.customer_details.email) || null;
  const out = await tx(async (c) => {
    const ins = await c.query(
      'INSERT INTO orders (session_id, wallet_id, qty, amount_cents, email) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (session_id) DO NOTHING RETURNING session_id',
      [session.id, walletId, qty, session.amount_total || 0, email]);
    if (ins.rowCount) await c.query('UPDATE wallets SET packs = packs + $2 WHERE id = $1', [walletId, qty]);
    return { ok: true, credited: ins.rowCount === 1, qty, wallet_id: walletId };
  });
  /* the wallpaper email goes out once per order. A failure here never undoes the packs; the next confirm retries it. */
  try { out.emailed = (await sendWallpaper(session.id)).sent; } catch (e) { console.error(e); out.emailed = false; }
  return out;
}
