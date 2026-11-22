// Tiện ích dùng chung cho mọi mẫu thiệp. Không phụ thuộc thư viện ngoài.

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = arr => arr[Math.random() * arr.length | 0];

/* ---------- Dựng HTML an toàn ----------
   html`<p>${tenKhach}</p>` tự thoát ký tự đặc biệt trong giá trị chèn vào.
   Mảng được nối lại, raw(chuoi) để chèn HTML đã tin cậy (vd. kết quả của html``). */
const RAW = Symbol('raw');
export const raw = s => ({ [RAW]: String(s ?? '') });
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = v => v == null || v === false ? '' : Array.isArray(v) ? v.map(val).join('') : v[RAW] !== undefined ? v[RAW] : esc(v);
export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += val(v) + strings[i + 1]; });
  return raw(out);
}
export const toStr = h => val(h);
// Xuống dòng trong JSON ("\n") thành <br>
export const br = s => raw(esc(s).replace(/\n/g, '<br>'));

/* ---------- Ngày giờ kiểu Việt Nam ---------- */
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
// Đọc giờ địa phương ghi trong chuỗi ISO (không đổi theo múi giờ của máy khách)
export function parts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || '');
  if (!m) return null;
  const [y, mo, d, h = '00', mi = '00'] = m.slice(1);
  const wd = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
  return { y: +y, mo: +mo, d: +d, h, mi, dd: d, mm: mo, wd, weekday: WD[wd] };
}
export const fmt = {
  dots: iso => { const p = parts(iso); return p ? `${p.dd} · ${p.mm} · ${p.y}` : ''; },
  short: iso => { const p = parts(iso); return p ? `${p.dd}.${p.mm}.${p.y}` : ''; },
  long: iso => { const p = parts(iso); return p ? `${p.weekday} · ${p.d} tháng ${p.mo} năm ${p.y}` : ''; },
  time: iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; },
  full: iso => { const p = parts(iso); return p ? `${p.h}:${p.mi} · ${p.weekday}, ${p.dd}/${p.mm}/${p.y}` : ''; },
};

/* ---------- Tên khách mời riêng ----------
   ?k=Bạn+Nhung, ?khach=..., #k=... hoặc #khach=... */
export function guestName() {
  const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
  const n = q.get('k') || q.get('khach') || h.get('k') || h.get('khach') || '';
  return n.replace(/\s+/g, ' ').trim().slice(0, 60);
}

/* ---------- Gộp cấu hình: giá trị mặc định của mẫu + invite.json ---------- */
export function merge(base, over) {
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over === undefined ? base : over;
  const out = { ...(base || {}) };
  for (const k of Object.keys(over)) out[k] = merge(base?.[k], over[k]);
  return out;
}

export function loadCss(href) {
  return new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = l.onerror = res;
    document.head.appendChild(l);
  });
}

// Phát lại một animation CSS bằng cách gỡ rồi gắn lại class
export function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
