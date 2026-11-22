/* start a Stripe Checkout Session for 1, 3, 5 or 10 packs and hand back its address */
import { route, json, fail, body, getStripe, siteOrigin } from '../lib/http.js';
import { walletFor } from '../lib/db.js';
import { PACK_SIZES, priceCents } from '../lib/game.js';

export default route('POST', async (request) => {
  const stripe = getStripe();
  if (!stripe) return fail(503, 'no_checkout');
  const w = await walletFor(request);
  if (!w) return fail(401, 'no_wallet');
  const b = await body(request), qty = Number(b.qty);
  if (!PACK_SIZES.includes(qty)) return fail(400, 'bad_qty');
  if (b.eligible !== true) return fail(400, 'not_eligible');
  const origin = siteOrigin(request);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: priceCents(),
        product_data: { name: 'RideLoot Pack', description: 'Digital RideLoot wallpaper, delivered by email. Comes with 1 RideLoot pack to open.' },
      },
    }],
    client_reference_id: String(w.id),
    metadata: { wallet_id: String(w.id), qty: String(qty) },
    success_url: origin + '/?paid={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/?canceled=1',
  });
  return json({ ok: true, url: session.url });
});
