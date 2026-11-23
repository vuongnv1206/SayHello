// Mẫu "Kính Vạn Hoa": thiệp là một ống kính vạn hoa. Bìa là hình tròn phản chiếu ảnh cưới thành sáu mảnh đối xứng, xoay và đổi màu liên tục;
// chạm vào, các mảnh khớp lại thành bức ảnh của hai bạn. Bên trong: nền chàm với mảng màu rực, khung ảnh lục giác,
// dải tam giác ngăn các mục, viên đá quý đựng quà mừng.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, parts } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';

export default {
  palettes: [
    { id: 'ruc-ro', name: 'Rực rỡ', swatch: ['#e63e8c', '#17b5a8'] },
    { id: 'hoang-hon', name: 'Hoàng hôn', swatch: ['#ff6b4a', '#ffc93c'], vars: { '--k1': '#ff6b4a', '--k2': '#ffc93c', '--k3': '#c44a8f', '--k4': '#5a3fc0' } },
    { id: 'bien-sau', name: 'Biển sâu', swatch: ['#18a0d8', '#5ee0b8'], vars: { '--k1': '#18a0d8', '--k2': '#5ee0b8', '--k3': '#7a5cf0', '--k4': '#ffd166' } },
  ],
  id: 'kinh-van-hoa',
  name: 'Kính Vạn Hoa',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  coverMs: 2800,
  cheersButton: 'btn',
  defaults: {
    effects: { ambient: ['sparkles', 'bokeh'], colors: { sparkles: ['#ffc93c', '#fff', '#17b5a8'], bokeh: ['#e63e8c', '#17b5a8', '#ffc93c', '#6a4cff'], petals: ['#e63e8c', '#ffc93c', '#17b5a8'], confetti: ['#e63e8c', '#17b5a8', '#ffc93c', '#6a4cff', '#fff'], fireworks: ['#e63e8c', '#17b5a8', '#ffc93c', '#fff'] }, density: .8 },
    sections: ['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Ống kính vạn hoa',
      coverHint: 'Chạm để các mảnh màu khớp lại',
      kicker: 'mời bạn nhìn vào bên trong',
      invite: 'Mỗi lần xoay, vạn hoa lại cho một bức tranh khác. Cuộc sống của chúng mình cũng vậy, và từ nay luôn có hai người cùng nhìn. Mời bạn đến xoay thử một vòng cùng chúng mình.',
      coupleTitle: 'Hai mảnh màu, một bức tranh',
      eventsTitle: 'Những lần xoay',
      albumTitle: 'Mảnh ghép khoảnh khắc',
      rsvpTitle: 'Xoay nhẹ, cho chúng mình biết',
      rsvpLead: 'Bạn có đến không? Hồi âm giúp chúng mình ghép đủ màu cho ngày vui.',
      guestbookTitle: 'Thêm một mảnh màu',
      giftTitle: 'Viên đá quý mừng cưới',
      thanks: 'Cảm ơn bạn đã thêm một mảnh màu vào bức tranh của chúng mình.',
      closing: 'Nhiều màu sắc,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const mono = `${initial(n.first)}&${initial(n.second)}`;
    const hero = ctx.img('hero', 0);
    // url() trong biến CSS được tính theo tệp CSS chứ không theo trang, nên cần địa chỉ tuyệt đối
    const heroAbs = hero ? new URL(hero, location.href).href : '';

    const cover = html`
      <div class="kv-stage">
        <i class="bit b1"></i><i class="bit b2"></i><i class="bit b3"></i><i class="bit b4"></i>
        <p class="kv-top">${t.coverTitle}</p>
        <button class="kv-lens" data-open aria-label="Chạm để các mảnh màu khớp lại thành ảnh">
          <span class="kal" style="--img:url('${heroAbs}')">${[0, 1, 2, 3, 4, 5].map(i => html`<i style="--i:${i}"></i>`)}</span>
          <span class="tint"></span>
          <span class="photo"><img src="${hero}" alt="${n.pair}"></span>
          <span class="bezel"></span>
        </button>
        <h1 class="kv-names">${n.first} <em>&amp;</em> ${n.second}</h1>
        <p class="kv-to">Mời <b>${guest}</b></p>
        <p class="kv-hint">${t.coverHint}</p>
      </div>`;

    const sec = (cls, body) => html`<section class="sec ${cls}">${body}</section>`;
    const strip = () => html`<div class="facets" aria-hidden="true"></div>`;
    const ttl = (h, small) => html`<header class="hd" data-rv="up">${small ? html`<small>${small}</small>` : ''}<h2>${h}</h2></header>`;
    const hex = (src, alt, cls = '') => html`<figure class="hex ${cls}"><span><img data-zoom src="${src}" alt="${alt}" loading="lazy"></span></figure>`;
    const sections = {
      hero: () => sec('hero', html`
        <p class="kicker" data-rv="blur">${t.kicker}</p>
        <div data-rv="zoom">${hex(hero, n.pair, 'big')}</div>
        <h2 class="names" data-rv="up">${n.first}<em>&amp;</em>${n.second}</h2>
        <p class="when" data-rv="up">${fmt.long(d.date)} · ${fmt.time(d.date)}</p>
        <p class="invite" data-type="24">${t.invite}</p>`),

      couple: () => sec('couple', html`${strip()}${ttl(t.coupleTitle)}
        <div class="duo">
          <div data-rv="drop">${hex(ctx.img('groom', 3), n.groom)}<h3>${n.groom}</h3>${d.groom.bio ? html`<p>${d.groom.bio}</p>` : ''}</div>
          <div data-rv="drop" style="transition-delay:.15s">${hex(ctx.img('bride', 4), n.bride, 'b')}<h3>${n.bride}</h3>${d.bride.bio ? html`<p>${d.bride.bio}</p>` : ''}</div>
        </div>`),

      families: () => (d.families || []).length ? sec('families', html`
        ${(d.families || []).map((f, i) => html`<div class="fam" data-rv="${i ? 'right' : 'left'}"><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}`) : '',

      events: () => sec('events', html`${strip()}${ttl(t.eventsTitle)}
        ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
          <article class="facet-card c${i % 3} ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
            <div class="when2"><b>${p.dd}</b><span>T${p.mo}</span><em>${fmt.time(e.date)}</em></div>
            <div><h3>${e.title}</h3><p>${e.venue}</p><p class="addr">${e.address}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}</div>
          </article>`; })}`),

      countdown: () => sec('count', html`<div data-rv="zoom">${W.countdown()}</div><a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>`),

      album: () => ctx.album.length ? sec('album', html`${strip()}${ttl(t.albumTitle)}<div class="prism" data-rv="zoom">${W.gallery()}</div>`) : '',

      map: () => sec('map-sec', html`${ttl('Đường đến')}<div data-rv="up">${W.map({ btn: 'btn' })}</div>`),

      rsvp: () => sec('reply', html`${strip()}<div class="panel" data-rv="up">${ttl(t.rsvpTitle)}<p class="lead">${t.rsvpLead}</p>${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}</div>`),

      guestbook: () => sec('book', html`${ttl(t.guestbookTitle)}${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}`),

      gift: () => sec('gift', html`${strip()}${ttl(t.giftTitle)}${W.gift({ btn: 'btn ghost', hint: 'Chạm để xoay viên đá', box: html`<i class="gem-card">❤</i><i class="gem"></i><i class="gem-shine"></i>` })}`),

      thanks: () => sec('thanks', html`${strip()}
        <div data-rv="zoom">${hex(ctx.img('thanks', 5), n.pair, 'big')}</div>
        <p class="invite" data-rv="up">${t.thanks}</p><p class="closing">${t.closing}</p>
        <p class="sign">${n.first} &amp; ${n.second}</p>`),
    };

    const main = html`${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}<footer>${mono} · ${fmt.short(d.date)}</footer>`;
    return { cover, main };
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .4, 110, { colors: ['#e63e8c', '#17b5a8', '#ffc93c', '#6a4cff', '#fff'] }), 1500);
  },
};
