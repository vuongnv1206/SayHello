// Mẫu "Gốm Ghép Vàng" (kintsugi): thiệp là một chiếc bình gốm men ngọc. Hai mảnh gốm tách rời, chạm vào thì chúng ghép lại
// và đường vàng chảy dọc vết nứt, nối hai mảnh thành một. Bên trong: nền men rạn, dải vàng ngăn các mục chạy ra khi cuộn tới,
// khung ảnh như viên gạch men có vân vàng, chén trà đựng quà mừng.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';
// Đường nứt zigzag chạy dọc bình (từ miệng xuống đáy); hai nửa bình cắt theo đường này
const CRACK = [[120, 18], [112, 52], [128, 84], [110, 120], [130, 152], [112, 190], [128, 224], [114, 256], [122, 296]];
const crackD = 'M' + CRACK.map(p => p.join(' ')).join('L');
const left = 'M0 0H' + CRACK[0][0] + CRACK.slice(1).map(p => 'L' + p.join(' ')).join('') + 'L122 320H0Z';
const right = 'M240 0H' + CRACK[0][0] + CRACK.slice(1).map(p => 'L' + p.join(' ')).join('') + 'L122 320H240Z';
const VASE = 'M100 14H140C141 40 139 56 148 74C170 100 200 128 200 182C200 238 176 276 160 296C156 302 154 308 146 310H94C86 308 84 302 80 296C64 276 40 238 40 182C40 128 70 100 92 74C101 56 99 40 100 14Z';
const VEIN = '<svg viewBox="0 0 300 20" preserveAspectRatio="none"><path pathLength="1" d="M0 10L36 6L60 14L98 5L132 13L170 4L206 12L244 6L300 10"/></svg>';

export default {
  palettes: [
    { id: 'men-ngoc', name: 'Men ngọc & vàng', swatch: ['#7fa095', '#c8a24a'] },
    { id: 'men-lam', name: 'Men lam', swatch: ['#6b88a8', '#d3b256'], vars: { '--glaze': '#e6edf3', '--glaze-2': '#9fb4c9', '--glaze-3': '#5d7a99', '--gold': '#d3b256' } },
    { id: 'men-trang', name: 'Men trắng & vàng hồng', swatch: ['#d8d4cc', '#c98f6e'], vars: { '--glaze': '#f4f1ec', '--glaze-2': '#d8d4cc', '--glaze-3': '#a49e94', '--gold': '#c98f6e' } },
  ],
  id: 'kintsugi',
  name: 'Gốm Ghép Vàng',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  coverMs: 3200,
  cheersButton: 'btn',
  defaults: {
    effects: { ambient: ['sparkles', 'bokeh'], colors: { sparkles: ['#e8cd7a', '#fff'], bokeh: ['#e8cd7a', '#cfe0d8'], petals: ['#e8cd7a', '#cfe0d8', '#fff'], confetti: ['#c8a24a', '#7fa095', '#fff', '#e8cd7a', '#2f423d'], fireworks: ['#e8cd7a', '#cfe0d8', '#fff'] }, density: .5 },
    sections: ['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Hai mảnh, một chiếc bình',
      coverHint: 'Chạm để ghép hai mảnh lại',
      kicker: 'trân trọng kính mời',
      invite: 'Chúng mình từng là hai mảnh riêng. Tình yêu là đường vàng nối chúng lại, để chiếc bình đẹp hơn lúc ban đầu. Mời bạn đến chứng kiến ngày hai mảnh thành một.',
      coupleTitle: 'Hai mảnh ghép',
      eventsTitle: 'Những đường vàng',
      albumTitle: 'Viên gạch men kỷ niệm',
      rsvpTitle: 'Hồi âm cùng chúng mình',
      rsvpLead: 'Bạn cho chúng mình biết bạn có đến không nhé.',
      guestbookTitle: 'Lời chúc của bạn',
      giftTitle: 'Chén trà mừng cưới',
      thanks: 'Cảm ơn bạn đã là một phần đường vàng trong câu chuyện của chúng mình.',
      closing: 'Trân trọng,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const mono = `${initial(n.first)}&${initial(n.second)}`;
    const vein = () => html`<div class="vein" data-rv="blur" aria-hidden="true">${raw(VEIN)}</div>`;

    const cover = html`
      <div class="kt-stage">
        <p class="kt-top">${t.coverTitle}</p>
        <button class="kt-vase" data-open aria-label="Chạm để ghép hai mảnh gốm">
          <svg viewBox="0 0 240 320" aria-hidden="true">
            <defs>
              <linearGradient id="kt-g" x1="0" x2="1"><stop offset="0" stop-color="#6f8f86"/><stop offset=".45" stop-color="#bcd3c9"/><stop offset="1" stop-color="#6a8a80"/></linearGradient>
              <clipPath id="kt-l"><path d="${left}"/></clipPath><clipPath id="kt-r"><path d="${right}"/></clipPath>
              <clipPath id="kt-v"><path d="${VASE}"/></clipPath>
            </defs>
            <g class="half hl"><g clip-path="url(#kt-v)"><g clip-path="url(#kt-l)"><rect width="240" height="320" fill="url(#kt-g)"/><path class="craq" d="M30 60l20 30l-12 24M190 120l-24 30l14 40M60 230l26-12l8 30M150 250l22 20"/></g></g></g>
            <g class="half hr"><g clip-path="url(#kt-v)"><g clip-path="url(#kt-r)"><rect width="240" height="320" fill="url(#kt-g)"/><path class="craq" d="M30 60l20 30l-12 24M190 120l-24 30l14 40M60 230l26-12l8 30M150 250l22 20"/></g></g></g>
            <path class="gold" pathLength="1" d="${crackD}" clip-path="url(#kt-v)"/>
            <path class="rim" d="${VASE}"/>
          </svg>
          <span class="kt-mono">${initial(n.first)}<i>&amp;</i>${initial(n.second)}</span>
        </button>
        <p class="kt-to">Dành cho <b>${guest}</b></p>
        <p class="kt-hint">${t.coverHint}</p>
      </div>`;

    const sec = (cls, body) => html`<section class="sec ${cls}">${body}</section>`;
    const ttl = (h, small) => html`<header class="hd" data-rv="up">${small ? html`<small>${small}</small>` : ''}<h2>${h}</h2></header>`;
    const tile = (src, alt, cls = '') => html`<figure class="tile ${cls}"><img data-zoom src="${src}" alt="${alt}" loading="lazy"><i class="seam"></i></figure>`;
    const sections = {
      hero: () => sec('hero', html`
        <p class="kicker" data-rv="blur">${t.kicker}</p>
        <div data-rv="zoom">${tile(ctx.img('hero', 0), n.pair, 'big')}</div>
        <h2 class="names" data-rv="up">${n.first}<em>&amp;</em>${n.second}</h2>
        <p class="when" data-rv="up">${fmt.long(d.date)} · ${fmt.time(d.date)}</p>
        <p class="invite" data-type="24">${t.invite}</p>`),

      couple: () => sec('couple', html`${vein()}${ttl(t.coupleTitle)}
        <div class="duo">
          <div data-rv="drop">${tile(ctx.img('groom', 3), n.groom)}<h3>${n.groom}</h3>${d.groom.bio ? html`<p>${d.groom.bio}</p>` : ''}</div>
          <div data-rv="drop" style="transition-delay:.15s">${tile(ctx.img('bride', 4), n.bride)}<h3>${n.bride}</h3>${d.bride.bio ? html`<p>${d.bride.bio}</p>` : ''}</div>
        </div>`),

      families: () => (d.families || []).length ? sec('families', html`
        ${(d.families || []).map((f, i) => html`<div class="fam" data-rv="${i ? 'right' : 'left'}"><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}`) : '',

      events: () => sec('events', html`${vein()}${ttl(t.eventsTitle)}
        ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
          <article class="plate ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
            <div class="when2"><b>${p.dd}</b><span>tháng ${p.mo}</span><em>${fmt.time(e.date)}</em></div>
            <div><h3>${e.title}</h3><p>${e.venue}</p><p class="addr">${e.address}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}</div>
          </article>`; })}`),

      countdown: () => sec('count', html`<div data-rv="zoom">${W.countdown()}</div><a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>`),

      album: () => ctx.album.length ? sec('album', html`${vein()}${ttl(t.albumTitle)}<div class="tile-show" data-rv="zoom">${W.gallery()}</div>`) : '',

      map: () => sec('map-sec', html`${ttl('Đường đến')}<div data-rv="up">${W.map({ btn: 'btn' })}</div>`),

      rsvp: () => sec('reply', html`${vein()}<div class="porcelain" data-rv="up">${ttl(t.rsvpTitle)}<p class="lead">${t.rsvpLead}</p>${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}</div>`),

      guestbook: () => sec('book', html`${ttl(t.guestbookTitle)}${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}`),

      gift: () => sec('gift', html`${vein()}${ttl(t.giftTitle)}${W.gift({ btn: 'btn ghost', hint: 'Chạm để nhấc chén trà', box: html`<i class="bw-card">❤</i><i class="bw-cup"></i><i class="bw-gold"></i><i class="bw-saucer"></i>` })}`),

      thanks: () => sec('thanks', html`${vein()}
        <div data-rv="zoom">${tile(ctx.img('thanks', 5), n.pair, 'big')}</div>
        <p class="invite" data-rv="up">${t.thanks}</p><p class="closing">${t.closing}</p>
        <p class="sign">${n.first} &amp; ${n.second}</p>`),
    };

    const main = html`${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}<footer>${mono} · ${fmt.short(d.date)}</footer>`;
    return { cover, main };
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .42, 70, { colors: ['#e8cd7a', '#fff', '#cfe0d8'] }), 2600);
  },
};
