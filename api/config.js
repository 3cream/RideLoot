/* tells the page whether the real back end is switched on, and the current price */
import { route, json, hasStripe, adminReady } from '../lib/http.js';
import { hasMail } from '../lib/mail.js';
import { hasDb } from '../lib/db.js';
import { priceCents, GRAND_AT } from '../lib/game.js';

export default route('GET', async () => json({ ok: true, live: hasDb(), checkout: hasDb() && hasStripe(), price_cents: priceCents(), grand_at: GRAND_AT, mail: hasMail(), admin: adminReady() }));
