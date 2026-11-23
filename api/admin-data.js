/* everything the owner's page shows: who claimed a free pack, who bought, and the email codes */
import { route, json, fail, isAdmin, adminReady } from '../lib/http.js';
import { db } from '../lib/db.js';

export default route('GET', async (request) => {
  if (!adminReady()) return fail(503, 'no_admin');
  if (!isAdmin(request)) return fail(401, 'unauthorized');
  const p = await db();
  const [stats, emails, orders, codes] = await Promise.all([
    p.query(`SELECT (SELECT n FROM counter WHERE id = 1)::int AS opened,
                    (SELECT count(*) FROM wallets WHERE email IS NOT NULL)::int AS claims,
                    (SELECT count(*) FROM orders)::int AS orders,
                    (SELECT coalesce(sum(qty), 0) FROM orders)::int AS packs_sold,
                    (SELECT coalesce(sum(amount_cents), 0) FROM orders)::bigint AS revenue_cents,
                    (SELECT coalesce(sum(entries), 0) FROM pulls)::bigint AS entries,
                    (SELECT count(*) FROM codes WHERE redeemed_at IS NULL)::int AS codes_unused`),
    p.query(`SELECT w.email, coalesce(w.claimed_at, w.created_at) AS at, w.packs,
                    (SELECT count(*) FROM pulls x WHERE x.wallet_id = w.id)::int AS opened,
                    (SELECT coalesce(sum(entries), 0) FROM pulls x WHERE x.wallet_id = w.id)::bigint AS entries
             FROM wallets w WHERE w.email IS NOT NULL ORDER BY at DESC LIMIT 5000`),
    p.query(`SELECT o.created_at AS at, o.email, o.qty, o.amount_cents, o.session_id, o.emailed_at, w.email AS claim_email
             FROM orders o JOIN wallets w ON w.id = o.wallet_id ORDER BY o.created_at DESC LIMIT 5000`),
    p.query(`SELECT c.code, c.packs, c.note, c.created_at AS at, c.redeemed_at, w.email AS used_by
             FROM codes c LEFT JOIN wallets w ON w.id = c.wallet_id ORDER BY c.created_at DESC LIMIT 5000`),
  ]);
  const s = stats.rows[0];
  return json({ ok: true, stats: { ...s, revenue_cents: Number(s.revenue_cents), entries: Number(s.entries) },
    emails: emails.rows.map((r) => ({ ...r, entries: Number(r.entries) })), orders: orders.rows, codes: codes.rows });
});
