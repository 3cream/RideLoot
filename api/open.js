/* open one pack. The server takes the pack, counts it, decides the card and records it, all in one step. */
import { route, json, fail } from '../lib/http.js';
import { tx, walletFor, walletState } from '../lib/db.js';
import { drawPrize } from '../lib/game.js';

export default route('POST', async (request) => {
  const w = await walletFor(request);
  if (!w) return fail(401, 'no_wallet');
  return tx(async (c) => {
    const took = await c.query('UPDATE wallets SET packs = packs - 1 WHERE id = $1 AND packs > 0 RETURNING id', [w.id]);
    if (!took.rowCount) return fail(409, 'no_packs');
    const packNo = Number((await c.query('UPDATE counter SET n = n + 1 WHERE id = 1 RETURNING n')).rows[0].n);
    const prize = drawPrize(packNo);
    await c.query('INSERT INTO pulls (pack_no, wallet_id, prize_id, entries) VALUES ($1, $2, $3, $4)', [packNo, w.id, prize.id, prize.entries]);
    return json({ ok: true, pack_no: packNo, prize_id: prize.id, ...(await walletState(c, w.id)) });
  });
});
