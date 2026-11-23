// Mẫu "Cà Phê Phin": một góc quán quen. Bìa là mặt bàn gỗ với phin cà phê nhôm đặt trên ly thủy tinh; chạm vào phin,
// từng giọt cà phê nhỏ xuống đầy ly rồi hơi nóng bốc lên. Bên trong là thực đơn "Ngày chung đôi" kẻ chấm
// (khai vị: chuyện hai đứa; món chính: lịch lễ; tráng miệng: album), phiếu order xác nhận, mẩu giấy nhắn và hũ tiền tip.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, parts } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';

export default {
  palettes: [
    { id: 'nau-sua', name: 'Nâu sữa', swatch: ['#3b2418', '#c98a4b'] },
    { id: 'matcha', name: 'Matcha', swatch: ['#2f4a32', '#a9c47a'], vars: { '--cof': '#2f4a32', '--cof-2': '#4a6b4d', '--crema': '#a9c47a', '--cream': '#eff2e2' } },
    { id: 'hong-bac-xiu', name: 'Bạc xỉu hồng', swatch: ['#6b3b46', '#e8a5a5'], vars: { '--cof': '#6b3b46', '--cof-2': '#8d5561', '--crema': '#e8a5a5', '--cream': '#f8ebe6' } },
  ],
  id: 'ca-phe-phin',
  name: 'Cà Phê Phin',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Space+Mono:wght@400;700&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  coverMs: 3200,
  cheersButton: 'btn',
  defaults: {
    effects: { ambient: ['bokeh', 'sparkles'], colors: { bokeh: ['#f2c58b', '#c98a4b', '#fff3df'], sparkles: ['#f2c58b', '#fff'], confetti: ['#c98a4b', '#3b2418', '#f2c58b', '#fff3df', '#8a5a34'], fireworks: ['#f2c58b', '#c98a4b', '#fff'] }, density: .6 },
    sections: ['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Quán quen ngày đầu',
      coverHint: 'Chạm vào phin để pha ly cà phê đầu tiên',
      kicker: 'thực đơn hôm nay',
      invite: 'Hôm nay quán có một món đặc biệt: ngày chung đôi của hai đứa. Mời bạn ghé, ngồi xuống, và uống cùng chúng mình ly cà phê ngọt nhất.',
      coupleTitle: 'Khai vị · Chuyện hai đứa',
      eventsTitle: 'Món chính · Lịch lễ',
      albumTitle: 'Tráng miệng · Album',
      rsvpTitle: 'Phiếu order',
      rsvpLead: 'Bạn ghi giúp chúng mình bạn sẽ ghé nhé, để quán giữ chỗ.',
      guestbookTitle: 'Mẩu giấy nhắn',
      giftTitle: 'Hũ tiền tip',
      thanks: 'Cảm ơn bạn đã ghé quán. Hẹn gặp lại ở ngày chung đôi.',
      closing: 'Quán xin chào,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const dp = parts(d.date), mono = `${initial(n.first)}&${initial(n.second)}`;

    const cover = html`
      <div class="cf-table">
        <p class="cf-top">${t.coverTitle}</p>
        <div class="cf-set">
          <button class="cf-phin" data-open aria-label="Chạm vào phin để pha cà phê">
            <i class="lid"></i><i class="cup"></i><i class="plate"></i>
            <i class="drop d1"></i><i class="drop d2"></i><i class="drop d3"></i>
          </button>
          <div class="cf-glass"><i class="coffee"><b></b></i><span class="tag">${n.first} &amp; ${n.second}</span></div>
          <i class="steam s1"></i><i class="steam s2"></i><i class="steam s3"></i>
        </div>
        <p class="cf-to">Dành cho <b>${guest}</b></p>
        <p class="cf-hint">${t.coverHint}</p>
      </div>`;

    const sec = (cls, body) => html`<section class="sec ${cls}">${body}</section>`;
    const head = (small, title) => html`<header class="mh" data-rv="up"><small>${small}</small><h2>${title}</h2></header>`;
    const coaster = (src, alt, cls = '') => html`<figure class="coaster ${cls}"><img data-zoom src="${src}" alt="${alt}" loading="lazy"></figure>`;
    const sections = {
      hero: () => sec('hero', html`
        <p class="kicker" data-rv="blur">${t.kicker}</p>
        <h2 class="menu-t" data-rv="up">Ngày chung đôi</h2>
        <div data-rv="zoom">${coaster(ctx.img('hero', 0), n.pair, 'big')}</div>
        <p class="who" data-rv="up">${n.first} <em>&amp;</em> ${n.second}</p>
        <ul class="leaders big" data-rv="up"><li><span>Ngày</span><i></i><b>${fmt.dots(d.date)}</b></li><li><span>Giờ</span><i></i><b>${fmt.time(d.date)}</b></li>${d.city ? html`<li><span>Quán</span><i></i><b>${d.city}</b></li>` : ''}</ul>
        <p class="invite" data-type="24">${t.invite}</p>`),

      couple: () => sec('couple', html`
        ${head('Khai vị', t.coupleTitle.replace(/^Khai vị · /, ''))}
        <div class="duo">
          <div data-rv="drop">${coaster(ctx.img('groom', 3), n.groom)}<h3>${n.groom}</h3>${d.groom.bio ? html`<p>${d.groom.bio}</p>` : ''}</div>
          <div data-rv="drop" style="transition-delay:.15s">${coaster(ctx.img('bride', 4), n.bride)}<h3>${n.bride}</h3>${d.bride.bio ? html`<p>${d.bride.bio}</p>` : ''}</div>
        </div>`),

      families: () => (d.families || []).length ? sec('families', html`
        ${(d.families || []).map((f, i) => html`<div class="fam" data-rv="${i ? 'right' : 'left'}"><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}`) : '',

      events: () => sec('events', html`
        ${head('Món chính', t.eventsTitle.replace(/^Món chính · /, ''))}
        <ul class="leaders">
          ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
            <li class="ev ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
              <div class="row"><span>${e.title}</span><i></i><b>${fmt.time(e.date)} · ${p.dd}/${p.mm}</b></div>
              <p>${e.venue}</p><p class="addr">${e.address}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
            </li>`; })}
        </ul>`),

      countdown: () => sec('count', html`<div class="board" data-rv="zoom"><small>Còn lại</small>${W.countdown()}</div><a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>`),

      album: () => ctx.album.length ? sec('album', html`${head('Tráng miệng', t.albumTitle.replace(/^Tráng miệng · /, ''))}<div class="card-show" data-rv="zoom">${W.gallery()}</div>`) : '',

      map: () => sec('map-sec', html`${head('Địa chỉ', 'Đường đến quán')}<div data-rv="up">${W.map({ btn: 'btn' })}</div>`),

      rsvp: () => sec('reply', html`<div class="slip" data-rv="up"><div class="slip-h"><b>${t.rsvpTitle.toUpperCase()}</b><span>Nº ${String(dp.dd)}${String(dp.mm)}</span></div><p class="lead">${t.rsvpLead}</p>${W.rsvp({ btn: 'btn', yes: 'Ghé nhé', no: 'Tiếc, bận rồi' })}</div>`),

      guestbook: () => sec('book', html`${head('Bảng ghim', t.guestbookTitle)}${W.guestbook({ btn: 'btn', placeholder: 'Viết lời nhắn gửi hai bạn...' })}`),

      gift: () => sec('gift', html`${head('Tiền tip', t.giftTitle)}${W.gift({ btn: 'btn ghost', hint: 'Chạm để mở nắp hũ', box: html`<i class="jar-lid"></i><i class="jar-coins"></i><i class="jar"></i><i class="jar-label">TIP</i>` })}`),

      thanks: () => sec('thanks', html`
        <div data-rv="zoom">${coaster(ctx.img('thanks', 5), n.pair, 'big')}</div>
        <p class="invite" data-rv="up">${t.thanks}</p><p class="closing">${t.closing}</p>
        <p class="sign">${n.first} &amp; ${n.second}</p>`),
    };

    const main = html`${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}<footer>${mono} · ${fmt.short(d.date)} · cà phê phin</footer>`;
    return { cover, main };
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .45, 80, { hearts: true }), 2600);
  },
};
