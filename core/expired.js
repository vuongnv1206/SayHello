// Trang lưu niệm khi thiệp hết hạn gói (lifecycle.expiresAt trong invite.json, do người bán đặt, cặp đôi không sửa được).
// Link cũ không bị 404: khách vẫn thấy tên cặp đôi, ngày cưới và lời cảm ơn; cặp đôi liên hệ người bán để gia hạn.
import { fmt } from './util.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function isExpired(data) {
  const e = data.lifecycle?.expiresAt;
  return !!e && /^\d{4}-\d{2}-\d{2}$/.test(e) && Date.now() > Date.parse(e + 'T23:59:59+07:00');
}

export async function showExpired(data, root) {
  const [a, b] = data.order === 'bride-first' ? [data.bride, data.groom] : [data.groom, data.bride];
  let zalo = '';
  try { zalo = String((await (await fetch(new URL('shop.json', root))).json()).zalo || '').replace(/\D/g, ''); } catch {}
  document.title = `${a.short} & ${b.short}`;
  document.documentElement.lang = 'vi';
  document.body.style.cssText = 'margin:0;min-height:100vh;display:grid;place-items:center;background:#1c1512;color:#f6ead8;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box';
  document.body.innerHTML = `<main style="max-width:420px">
    <p style="letter-spacing:.25em;font-size:12px;opacity:.7;margin:0 0 14px">KỶ NIỆM NGÀY CHUNG ĐÔI</p>
    <h1 style="font:italic 500 46px/1.15 Georgia,serif;margin:0 0 10px">${esc(a.short)} &amp; ${esc(b.short)}</h1>
    <p style="margin:0 0 22px;opacity:.85">${esc(fmt.long(data.date))}</p>
    <p style="margin:0 0 26px;opacity:.8">Cảm ơn mọi người đã đến chung vui và gửi lời chúc. Trang thiệp đã kết thúc thời gian lưu trữ.</p>
    ${zalo ? `<a href="https://zalo.me/${zalo}" style="display:inline-block;padding:11px 26px;border-radius:999px;background:#e8c98a;color:#2a1a10;text-decoration:none;font-weight:600">Liên hệ để gia hạn thiệp</a>` : ''}
  </main>`;
}
