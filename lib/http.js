/* small helpers shared by every function */
import Stripe from 'stripe';
import { timingSafeEqual } from 'node:crypto';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export const fail = (status, error) => json({ ok: false, error }, status);

export async function body(request) {
  try { const b = await request.json(); return b && typeof b === 'object' ? b : {}; } catch (e) { return {}; }
}

/* wraps a handler: one method only, and a plain error instead of a stack trace */
export function route(method, fn) {
  return {
    async fetch(request) {
      if (request.method !== method) return fail(405, 'method');
      try { return await fn(request); } catch (e) {
        console.error(e);
        return fail(e && e.message === 'no database' ? 503 : 500, e && e.message === 'no database' ? 'not_ready' : 'server');
      }
    },
  };
}

let stripe = null;
export const hasStripe = () => !!process.env.STRIPE_SECRET_KEY || !!globalThis.__stripeMock;
export function getStripe() {
  if (globalThis.__stripeMock) return globalThis.__stripeMock;   // tests only
  if (!hasStripe()) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

/* where Stripe sends the buyer back to */
export function siteOrigin(request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, '');
  const u = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || u.host;
  const proto = request.headers.get('x-forwarded-proto') || u.protocol.replace(':', '');
  return proto + '://' + host;
}

/* the owner's pages: a long ADMIN_TOKEN set in the host's settings, sent as "authorization: Bearer <token>" */
export function isAdmin(request) {
  const want = process.env.ADMIN_TOKEN || '', got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return want.length >= 12 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
export const adminReady = () => (process.env.ADMIN_TOKEN || '').length >= 12;
