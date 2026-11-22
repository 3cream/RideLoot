# RideLoot

Giveaway pack site. Preview build: no payments, no accounts, no real winners yet.

- `public/` is the built site that Vercel serves (`index.html` plus `assets/`).
- `src/` is the source: `body.html`, `css/`, `js/`, joined by `scripts/build.py`.

Rebuild after editing `src/`:

    python3 scripts/build.py src/index.src.html public/index.html
