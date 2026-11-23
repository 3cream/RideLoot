/* the wallpaper email. Sent through Resend once RESEND_API_KEY is set; until then nothing is sent
   and the buyer still gets the download button on the site. */
import { readFile } from 'node:fs/promises';
import { db } from './db.js';

export const WALLPAPER_FILE = new URL('../wallpapers/rideloot-series-1.jpg', import.meta.url);
export const WALLPAPER_NAME = 'RideLoot-Series-1-Wallpaper.jpg';
export const hasMail = () => !!process.env.RESEND_API_KEY;
export const site = () => (process.env.SITE_URL || 'https://www.rideloot.live').replace(/\/+$/, '');
export const wallpaperLink = (sessionId) => site() + '/api/wallpaper?o=' + encodeURIComponent(sessionId);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* sends once per order: the order row remembers that its email went out */
export async function sendWallpaper(sessionId) {
  if (!hasMail()) return { sent: false, why: 'no_mail' };
  const p = await db();
  const o = (await p.query('SELECT email, qty, emailed_at FROM orders WHERE session_id = $1', [sessionId])).rows[0];
  if (!o || !o.email) return { sent: false, why: 'no_email' };
  if (o.emailed_at) return { sent: false, why: 'already' };
  const link = wallpaperLink(sessionId), packs = o.qty + (o.qty === 1 ? ' pack' : ' packs');
  const html = `<div style="background:#05090d;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#eef3f7">
  <div style="max-width:520px;margin:0 auto">
    <p style="margin:0 0 6px;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#5db8ff">RideLoot &middot; Series 1</p>
    <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#ffffff">Your wallpaper is here</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#c6d2dc">Thanks for your order. Your RideLoot Series 1 wallpaper is attached to this email, and you can also download it with the button below.</p>
    <p style="margin:0 0 22px"><a href="${esc(link)}" style="display:inline-block;background:#0a84ff;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:13px 22px;border-radius:8px">Download wallpaper</a></p>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#c6d2dc">Your order also added ${esc(packs)} to your account. Open them at <a href="${esc(site())}" style="color:#5db8ff">${esc(site().replace(/^https?:\/\//, ''))}</a> on the device you ordered from.</p>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#7f8f9d">All sales are final. Questions? Reply to this email. TropicalTorque LLC, 3211 44th St SW, Lehigh Acres, FL 33976.</p>
  </div>
</div>`;
  const text = `Your RideLoot Series 1 wallpaper is attached to this email.\n\nDownload it here: ${link}\n\nYour order also added ${packs} to your account. Open them at ${site()} on the device you ordered from.\n\nAll sales are final. Questions? Reply to this email.\nTropicalTorque LLC, 3211 44th St SW, Lehigh Acres, FL 33976.`;
  const file = await readFile(WALLPAPER_FILE);
  const res = await fetch(process.env.RESEND_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json', 'idempotency-key': 'wallpaper-' + sessionId.slice(-120) },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'RideLoot <packs@rideloot.live>',
      to: [o.email],
      reply_to: process.env.MAIL_REPLY_TO || 'rideloot@gmail.com',
      subject: 'Your RideLoot Series 1 wallpaper',
      html, text,
      attachments: [{ filename: WALLPAPER_NAME, content: file.toString('base64') }],
    }),
  });
  if (!res.ok) { console.error('wallpaper email failed', res.status, (await res.text()).slice(0, 300)); return { sent: false, why: 'refused' }; }
  await p.query('UPDATE orders SET emailed_at = now() WHERE session_id = $1 AND emailed_at IS NULL', [sessionId]);
  return { sent: true };
}
