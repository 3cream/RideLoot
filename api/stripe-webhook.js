/* Stripe calls this when a checkout finishes, so packs arrive even if the buyer never returns to the site.
   Only switched on once STRIPE_WEBHOOK_SECRET is set. */
import { getStripe } from '../lib/http.js';
import { fulfil } from '../lib/orders.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return new Response('method', { status: 405 });
    const stripe = getStripe(), secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !secret) return new Response('not configured', { status: 503 });
    const raw = await request.text();
    let event;
    try { event = await stripe.webhooks.constructEventAsync(raw, request.headers.get('stripe-signature') || '', secret); }
    catch (e) { return new Response('bad signature', { status: 400 }); }
    try {
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await fulfil(event.data.object);
    } catch (e) { console.error(e); return new Response('retry', { status: 500 }); }
    return new Response('ok');
  },
};
