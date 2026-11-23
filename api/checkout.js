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
  const origin = siteOrigin(request);
  const cents = priceCents();
  const base = {
    mode: 'payment',
    line_items: [{
      quantity: qty,
      price_data: {
        currency: 'usd',
        unit_amount: cents,
        product_data: { name: 'RideLoot Pack', description: 'Digital RideLoot wallpaper, delivered by email. Comes with 1 RideLoot pack to open.' },
      },
    }],
    client_reference_id: String(w.id),
    metadata: { wallet_id: String(w.id), qty: String(qty) },
    success_url: origin + '/?paid={CHECKOUT_SESSION_ID}',
    cancel_url: origin + '/?canceled=1',
  };
  /* the checkout page carries the RideLoot name and colours, and card statements end in RIDELOOT,
     whatever the Stripe account itself is called. If Stripe refuses those extras, checkout still opens without them. */
  const branded = {
    ...base,
    branding_settings: { display_name: 'RideLoot', button_color: '#0a84ff', background_color: '#05090d', border_style: 'rounded' },
    ...(cents > 0 ? { payment_intent_data: { statement_descriptor_suffix: 'RIDELOOT', description: 'RideLoot Pack x' + qty } } : {}),
  };
  let session;
  try { session = await stripe.checkout.sessions.create(branded); }
  catch (e) {
    if (!e || e.type !== 'StripeInvalidRequestError') throw e;
    console.error('branded checkout refused, retrying plain:', e.message);
    session = await stripe.checkout.sessions.create(base);
  }
  return json({ ok: true, url: session.url });
});
