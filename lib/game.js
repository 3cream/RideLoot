/* The prize table. The server is the only place a pack is ever decided.
   Keep this in step with CONFIG.prizes in src/js/00-core.js: same ids, same weights, same entries. */
import { randomInt } from 'node:crypto';

export const GRAND_AT = 10000;   // the grand prize sits in this numbered pack, counting every pack opened, free or paid

export const PRIZES = [
  { id: 'car',     tier: 'grand',     entries: 0,     weight: 0 },
  { id: 'ent75k',  tier: 'legendary', entries: 75000, weight: 500 },
  { id: 'ent25k',  tier: 'epic',      entries: 25000, weight: 1000 },
  { id: 'ent10k',  tier: 'rare',      entries: 10000, weight: 2000 },
  { id: 'ent2500', tier: 'uncommon',  entries: 2500,  weight: 3000 },
  { id: 'ent1k',   tier: 'common',    entries: 1000,  weight: 3500 },
];

const TOTAL = PRIZES.reduce((s, p) => s + p.weight, 0);

/* packNo is the pack's place in the count of every pack opened on the site */
export function drawPrize(packNo) {
  if (packNo === GRAND_AT) return PRIZES[0];
  let r = randomInt(TOTAL);
  for (const p of PRIZES) { r -= p.weight; if (r < 0) return p; }
  return PRIZES[PRIZES.length - 1];
}

export const PACK_SIZES = [1, 3, 5, 10];

/* price of one pack in cents. PACK_PRICE_CENTS=0 makes checkout free for testing. */
export function priceCents() {
  const v = Number(process.env.PACK_PRICE_CENTS);
  return Number.isInteger(v) && v >= 0 && v <= 100000 ? v : 1000;
}
