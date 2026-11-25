// Biến dữ liệu thiệp (invite.json hoặc bản ghi Supabase) thành ctx mà các cảnh dùng để dựng HTML.
// Chạy được trên máy chủ: không đọc location/window. Tên khách mời (?k=) do trình duyệt điền vào chỗ [data-guest].
import { html, br, splitText } from './html.js';
import { fmt, gcalUrl } from './date.js';
import { createVoice } from './voice.js';

// Gộp mặc định của mẫu với dữ liệu thiệp: object gộp sâu, mảng và giá trị đơn thì dữ liệu thiệp thắng
export function merge(base, over) {
  if (Array.isArray(over) || typeof over !== 'object' || over === null) return over === undefined ? base : over;
  const out = { ...(base || {}) };
  for (const k of Object.keys(over)) out[k] = merge(base?.[k], over[k]);
  return out;
}

export const mapUrl = p => p ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.coords || p.address || p.label || '') : '';

export const qrUrl = (a, note = '') => !a ? '' : a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note || '')}` : '');

// Ảnh trong dữ liệu ghi tương đối ("images/anh1.jpg"): gắn vào gốc ảnh của thiệp
const absolutize = (src, base) => !src || /^(https?:|data:|\/)/.test(src) ? src || '' : base.replace(/\/?$/, '/') + src.replace(/^\.\//, '');

export function buildContext(theme, invite, { assetBase = '' } = {}) {
  const d = merge(theme.defaults || {}, invite || {});
  if (!d.groom?.short || !d.bride?.short) throw new TypeError('Thiếu tên cô dâu hoặc chú rể (groom.short, bride.short)');
  const [first, second] = d.order === 'bride-first' ? [d.bride, d.groom] : [d.groom, d.bride];
  const say = createVoice(theme.voice, theme.voiceText);
  const images = d.images || {};
  const album = (images.album || []).map(s => absolutize(s, assetBase)).filter(Boolean);
  const events = (d.events || []).map(e => ({ ...e, gcal: gcalUrl({ title: `${e.title} · ${first.short} & ${second.short}`, date: e.date, place: [e.venue, e.address].filter(Boolean).join(', ') }) }));
  const main = events.find(e => e.main) || events[events.length - 1] || null;

  return {
    theme, data: d, say, html, br, fmt, splitText,
    texts: d.texts || {},
    names: { groom: d.groom.short, bride: d.bride.short, first: first.short, second: second.short, pair: `${first.short} & ${second.short}`, firstFull: first.full || first.short, secondFull: second.full || second.short },
    date: d.date, city: d.city || '',
    events, main,
    places: (d.places || []).map(p => ({ ...p, url: mapUrl(p) })),
    story: d.story || [], families: d.families || [], accounts: d.accounts || [],
    album, captions: images.captions || [],
    // Ảnh theo ô (hero, groom, bride, thanks...), thiếu thì lấy ảnh thứ i trong album
    img(slot, i = 0) { return absolutize(images[slot], assetBase) || album[i % Math.max(1, album.length)] || ''; },
    // Cặp ảnh nền + lớp tách người 2.5D (fallback mượt về fg: '' nếu không có ảnh tách)
    imgPair(slot, i = 0) {
      const slotSrc = typeof images[slot] === 'string' ? absolutize(images[slot], assetBase) : '';
      const bg = slotSrc || album[i % Math.max(1, album.length)] || '';
      const rawFg = images.cutouts?.[slot] || images[`${slot}Cutout`] || (Array.isArray(images.albumCutouts) ? images.albumCutouts[i] : '') || '';
      const fg = typeof rawFg === 'string' && rawFg ? absolutize(rawFg, assetBase) : '';
      return { bg, fg };
    },
    // Chỗ điền tên khách: máy chủ để chữ mặc định, trình duyệt thay bằng ?k= nếu có
    guest(fallback = say('guest')) { return html`<span data-guest data-fallback="${fallback}">${fallback}</span>`; },
    has(feature) {
      if (theme.features?.[feature] === 'off') return false;
      if (feature === 'gift') return !!(d.accounts || []).length;
      if (feature === 'map') return !!(d.places || []).length;
      if (feature === 'story') return !!(d.story || []).length;
      if (feature === 'album') return album.length > 0;
      return true;
    },
  };
}
