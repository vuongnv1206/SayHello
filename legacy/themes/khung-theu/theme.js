// Mẫu "Khung Thêu": thiệp là một khung thêu tay căng vải lanh. Khách giữ ngón tay trên khung để "thêu" nốt họa tiết
// (đường chỉ chạy dần theo thời gian giữ), thêu xong thiệp mở. Bên trong: mảnh vải vá, nhãn vải, ảnh trong khung thêu tròn, túi gấm rút dây.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts, reduced } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';
// Họa tiết cánh hoa thêu quanh trái tim; pathLength=1 để đường chỉ chạy bằng stroke-dashoffset
const SPRIG = (cx, cy, r, a) => `<path pathLength="1" transform="rotate(${a} ${cx} ${cy})" d="M${cx} ${cy - r}c10 -18 28 -22 30 -4c-6 16 -24 16 -30 4z"/>`;
const HEART = 'M150 214C84 168 88 112 124 108c18 -2 26 10 26 22 0 -12 8 -24 26 -22 36 4 40 60 -26 106z';
// Mọi đường thêu (trái tim + 6 cánh hoa); lớp "reveal" trong mask lộ dần theo --p nên chỉ phần đã thêu mới thấy
const SHAPES = `<path pathLength="1" d="${HEART}"/>` + [0, 60, 120, 180, 240, 300].map(a => SPRIG(150, 150, 96, a)).join('');

export default {
  palettes: [
    { id: 'dat-nung', name: 'Đất nung', swatch: ['#c4573a', '#7a9a7e'] },
    { id: 'cham', name: 'Chàm & mù tạt', swatch: ['#2f4a6b', '#d9a441'], vars: { '--thread': '#2f4a6b', '--thread-2': '#d9a441', '--sage': '#6f8fa8' } },
    { id: 'hong-sen', name: 'Hồng sen', swatch: ['#b04a74', '#8aa05f'], vars: { '--thread': '#b04a74', '--thread-2': '#8aa05f', '--sage': '#c98aa5' } },
  ],
  id: 'khung-theu',
  name: 'Khung Thêu',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  coverMs: 2200,
  cheersButton: 'btn',
  defaults: {
    effects: { ambient: ['petals', 'leaves'], colors: { petals: ['#c4573a', '#e7b8a2', '#d9a441', '#fff'], leaves: ['#7a9a7e', '#9db79f', '#c4573a'], confetti: ['#c4573a', '#7a9a7e', '#d9a441', '#2f4a6b', '#f2ead9'], fireworks: ['#d9a441', '#c4573a', '#fff'] }, density: .6 },
    sections: ['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Thêu một mũi chỉ đầu tiên',
      coverHint: 'Giữ ngón tay trên khung để thêu',
      kicker: 'từng mũi chỉ một',
      invite: 'Chúng mình thêu chuyện đôi mình bằng từng mũi chỉ nhỏ, và muốn bạn là người ngồi bên cạnh trong ngày khâu nốt đường cuối cùng.',
      coupleTitle: 'Hai sợi chỉ, một đường thêu',
      eventsTitle: 'Những mảnh vải vá',
      albumTitle: 'Khung thêu kỷ niệm',
      rsvpTitle: 'Nhãn vải hồi âm',
      rsvpLead: 'Bạn cho chúng mình biết bạn sẽ đến để khâu thêm một chỗ ngồi nhé.',
      guestbookTitle: 'Chỉ thêu của bạn',
      giftTitle: 'Túi gấm mừng cưới',
      thanks: 'Cảm ơn bạn đã thêu cùng chúng mình mũi chỉ này.',
      closing: 'Thương mến,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const dp = parts(d.date), mono = `${initial(n.first)}&${initial(n.second)}`;

    const cover = html`
      <div class="th-stage">
        <p class="th-top">${t.coverTitle}</p>
        <div class="th-hoop" aria-label="Khung thêu, giữ ngón tay để thêu">
          <svg viewBox="0 0 300 300" class="th-art" aria-hidden="true">
            <circle cx="150" cy="150" r="128" class="cloth"/>
            <g class="ghost"><path pathLength="1" d="${HEART}"/></g>
            <mask id="th-m" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><g class="reveal">${raw(SHAPES)}</g></mask>
            <g class="stitch" mask="url(#th-m)">${raw(SHAPES)}</g>
            <text x="150" y="146" text-anchor="middle" class="mono-t">${initial(n.first)}</text>
            <text x="150" y="176" text-anchor="middle" class="mono-t sm">&amp; ${initial(n.second)}</text>
          </svg>
          <i class="th-ring"></i><i class="th-screw"></i>
          <span class="th-needle" aria-hidden="true"></span>
        </div>
        <p class="th-to">Gửi <b>${guest}</b></p>
        <p class="th-hint">${t.coverHint}</p>
        <button class="th-skip" data-open>Mở ngay</button>
      </div>`;

    const patch = (cls, body) => html`<section class="sheet ${cls}">${body}</section>`;
    const hoopPhoto = (src, alt, cls = '') => html`<figure class="hoop ${cls}"><img data-zoom src="${src}" alt="${alt}" loading="lazy"></figure>`;
    const sections = {
      hero: () => patch('hero', html`
        <p class="kicker" data-rv="blur">${t.kicker}</p>
        <div data-rv="zoom">${hoopPhoto(ctx.img('hero', 0), n.pair, 'big')}</div>
        <h2 class="names" data-rv="up">${n.first} <em>&amp;</em> ${n.second}</h2>
        <p class="when" data-rv="up">${fmt.long(d.date)}</p>
        <p class="invite" data-type="24">${t.invite}</p>`),

      couple: () => patch('couple', html`
        <h2 class="ttl" data-rv="up">${t.coupleTitle}</h2>
        <div class="duo">
          <div data-rv="drop">${hoopPhoto(ctx.img('groom', 3), n.groom)}<h3>${n.groom}</h3>${d.groom.bio ? html`<p>${d.groom.bio}</p>` : ''}</div>
          <div data-rv="drop" style="transition-delay:.15s">${hoopPhoto(ctx.img('bride', 4), n.bride, 'b')}<h3>${n.bride}</h3>${d.bride.bio ? html`<p>${d.bride.bio}</p>` : ''}</div>
        </div>`),

      families: () => (d.families || []).length ? patch('families', html`
        ${(d.families || []).map((f, i) => html`<div class="label" data-rv="${i ? 'right' : 'left'}"><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}`) : '',

      events: () => patch('events', html`
        <h2 class="ttl" data-rv="up">${t.eventsTitle}</h2>
        ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
          <article class="cloth-patch c${i % 3} ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
            <small>${p.weekday} · ${p.dd}/${p.mm} · ${fmt.time(e.date)}</small><h3>${e.title}</h3>
            <p>${e.venue}</p><p class="addr">${e.address}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
          </article>`; })}`),

      countdown: () => patch('count', html`<div data-rv="zoom">${W.countdown()}</div><a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>`),

      album: () => ctx.album.length ? patch('album', html`<h2 class="ttl" data-rv="up">${t.albumTitle}</h2><div class="hoop-show" data-rv="zoom">${W.gallery()}</div>`) : '',

      map: () => patch('map-sec', html`<h2 class="ttl" data-rv="up">Đường đến</h2><div data-rv="up">${W.map({ btn: 'btn' })}</div>`),

      rsvp: () => patch('reply', html`<div class="tag" data-rv="flip"><h2 class="ttl">${t.rsvpTitle}</h2><p class="lead">${t.rsvpLead}</p>${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}</div>`),

      guestbook: () => patch('book', html`<h2 class="ttl" data-rv="up">${t.guestbookTitle}</h2>${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}`),

      gift: () => patch('gift', html`<h2 class="ttl" data-rv="up">${t.giftTitle}</h2>${W.gift({ btn: 'btn ghost', hint: 'Chạm để nới dây túi', box: html`<i class="bag-back"></i><i class="bag-card">❤</i><i class="bag"></i><i class="bag-cord"></i>` })}`),

      thanks: () => patch('thanks', html`
        <div data-rv="zoom">${hoopPhoto(ctx.img('thanks', 5), n.pair, 'big')}</div>
        <p class="invite" data-rv="up">${t.thanks}</p><p class="closing">${t.closing}</p>
        <p class="sign">${n.first} &amp; ${n.second}</p>`),
    };

    const main = html`${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}<footer>${mono} · ${fmt.short(d.date)}</footer>`;
    return { cover, main };
  },

  // Giữ ngón tay trên khung để thêu: p chạy 0 → 1 trong ~1.8 giây, thả sớm thì đường chỉ tụt lại
  mounted(ctx, { cover }) {
    const hoop = cover.querySelector('.th-hoop'), art = cover.querySelector('.th-art'), needle = cover.querySelector('.th-needle');
    if (!hoop || reduced) return;
    let p = 0, holding = false, raf = 0, last = 0, done = false;
    const tick = now => {
      const dt = Math.min(64, now - last); last = now;
      p = Math.max(0, Math.min(1, p + (holding ? dt / 1800 : -dt / 900)));
      art.style.setProperty('--p', p.toFixed(3));
      needle.style.setProperty('--p', p.toFixed(3));
      if (p >= 1 && !done) { done = true; navigator.vibrate?.(40); ctx.open(false); return; }
      if (holding || p > 0) raf = requestAnimationFrame(tick); else raf = 0;
    };
    const start = e => { if (done) return; e.preventDefault(); holding = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(tick); };
    const stop = () => { holding = false; };
    hoop.addEventListener('pointerdown', start);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => hoop.addEventListener(ev, stop));
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .42, 90, { hearts: true }), 900);
  },
};
