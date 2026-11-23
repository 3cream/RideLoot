# RideLoot

Giveaway pack site, hosted on Vercel.

- `public/` is the built site Vercel serves (`index.html` plus `assets/`).
- `src/` is the site's source: `body.html`, `css/`, `js/`, joined by `scripts/build.py`.
- `api/` holds the server functions; `lib/` is their shared code.

## How it runs

Without a database the site runs as a self-contained preview: packs and pulls live in the visitor's browser.

With a database connected it switches to live mode: packs, pulls, entries and the site-wide pack count are kept
on the server, and every pack is decided there.

| Setting (Vercel environment variable) | What it does |
|---|---|
| `DATABASE_URL` or `POSTGRES_URL` | Postgres connection. Set automatically when a Postgres database is connected to the project. Turns live mode on. |
| `STRIPE_SECRET_KEY` | Turns checkout on. |
| `STRIPE_WEBHOOK_SECRET` | Optional. Lets Stripe add packs even if the buyer never returns to the site. Endpoint: `/api/stripe-webhook`, event `checkout.session.completed`. |
| `PACK_PRICE_CENTS` | Price of one pack in cents. `0` makes checkout free for testing. Default `1000`. |
| `ADMIN_TOKEN` | The owner's password, 12 or more characters. Unlocks `/admin`: the list of free pack emails, orders, and the email code maker. |
| `SITE_URL` | Optional. The address Stripe returns buyers to, if it should differ from the one they came from. |

The prize table lives in two places that must match: `lib/game.js` (the server, which decides) and
`CONFIG.prizes` in `src/js/00-core.js` (the page, which displays).

## Working on it

    python3 scripts/build.py src/index.src.html public/index.html     # rebuild the page after editing src/
    DATABASE_URL=postgres://... STRIPE_MOCK=1 node scripts/dev-server.mjs 3000   # run site + functions locally
