/* the buyer's download. The link carries the order's own long random id; only a real, recorded order opens it. */
import { readFile } from 'node:fs/promises';
import { db } from '../lib/db.js';
import { WALLPAPER_FILE, WALLPAPER_NAME } from '../lib/mail.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') return new Response('method', { status: 405 });
    try {
      const id = new URL(request.url).searchParams.get('o') || '';
      if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) return new Response('Not found', { status: 404 });
      const p = await db();
      const r = await p.query('SELECT 1 FROM orders WHERE session_id = $1', [id]);
      if (!r.rowCount) return new Response('Not found', { status: 404 });
      const file = await readFile(WALLPAPER_FILE);
      return new Response(file, { headers: { 'content-type': 'image/jpeg', 'content-disposition': 'attachment; filename="' + WALLPAPER_NAME + '"', 'cache-control': 'private, no-store', 'x-robots-tag': 'noindex' } });
    } catch (e) { console.error(e); return new Response('Try again shortly', { status: 500 }); }
  },
};
