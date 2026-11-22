/* Local stand-in for the host: serves public/ and runs the functions in api/.
   Usage: DATABASE_URL=postgres://... node scripts/dev-server.mjs [port]
   STRIPE_MOCK=1 swaps Stripe for a fake that completes every checkout at once (tests only). */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const port = Number(process.argv[2]) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

if (process.env.STRIPE_MOCK === '1') {
  const sessions = new Map();
  globalThis.__stripeMock = {
    checkout: { sessions: {
      async create(p) {
        const id = 'cs_test_' + Math.random().toString(36).slice(2).padEnd(12, 'x');
        const qty = p.line_items[0].quantity, total = qty * p.line_items[0].price_data.unit_amount;
        sessions.set(id, { id, status: 'complete', payment_status: total ? 'paid' : 'no_payment_required', amount_total: total, metadata: p.metadata, customer_details: { email: 'buyer@example.com' } });
        return { id, url: 'https://checkout.stripe.com/mock?return=' + encodeURIComponent(p.success_url.replace('{CHECKOUT_SESSION_ID}', id)) };
      },
      async retrieve(id) { if (!sessions.has(id)) throw new Error('missing'); return sessions.get(id); },
    } },
  };
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://' + req.headers.host);
    if (url.pathname.startsWith('/api/')) {
      const name = url.pathname.slice(5).replace(/[^a-z0-9-]/g, '');
      const mod = await import(pathToFileURL(join(root, 'api', name + '.js')).href);
      const chunks = []; for await (const c of req) chunks.push(c);
      const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const out = await mod.default.fetch(request);
      res.writeHead(out.status, Object.fromEntries(out.headers)); res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }
    const rel = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const data = await readFile(join(root, 'public', rel));
    res.writeHead(200, { 'content-type': TYPES[extname(rel)] || 'application/octet-stream' }); res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
}).listen(port, () => console.log('http://localhost:' + port));
