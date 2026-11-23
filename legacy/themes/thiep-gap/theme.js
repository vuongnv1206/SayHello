// Mẫu "Thiệp Gấp": tấm thiệp giấy gấp kiểu pop-up (kirigami). Mở nắp thiệp, các lớp giấy cắt (cổng hoa, hai người, hoa lá)
// dựng đứng lên từng lớp. Bên trong là những tờ giấy xếp chồng, ngăn kéo giấy đựng hộp mừng cưới.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, parts } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';

export default {
  palettes: [
    { id: 'san-ho', name: 'San hô & ngọc', swatch: ['#e8705b', '#2f8f83'] },
    { id: 'tim-vang', name: 'Tím & vàng', swatch: ['#7a58b8', '#f0b84a'], vars: { '--p1': '#7a58b8', '--p2': '#f0b84a', '--p3': '#3d7fb8', '--p4': '#ef8fb0' } },
    { id: 'xanh-bien', name: 'Xanh biển', swatch: ['#2f6fb8', '#f4a259'], vars: { '--p1': '#2f6fb8', '--p2': '#f4a259', '--p3': '#79c2d0', '--p4': '#e8705b' } },
  ],
  id: 'thiep-gap',
  name: 'Thiệp Gấp',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  coverMs: 2600,
  cheersButton: 'btn',
  defaults: {
    effects: { ambient: ['sparkles', 'petals'], colors: { petals: ['#e8705b', '#f0b84a', '#2f8f83', '#ef8fb0', '#fff'], sparkles: ['#fff', '#f0b84a'], confetti: ['#e8705b', '#2f8f83', '#f0b84a', '#ef8fb0', '#3d7fb8'], fireworks: ['#e8705b', '#f0b84a', '#2f8f83', '#fff'] }, density: .7 },
    sections: ['hero', 'couple', 'families', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Một tấm thiệp gấp',
      coverHint: 'Chạm để mở thiệp',
      kicker: 'trân trọng kính mời',
      invite: 'Chúng mình gấp từng lớp giấy nhỏ để kể chuyện đôi mình, và muốn mở nó ra trước mặt bạn trong ngày vui.',
      coupleTitle: 'Hai mảnh giấy, một cánh cổng',
      eventsTitle: 'Những trang trong thiệp',
      albumTitle: 'Khung ảnh dựng đứng',
      rsvpTitle: 'Báo tin cho chúng mình',
      rsvpLead: 'Bạn nhớ cho chúng mình biết bạn có đến không nhé.',
      guestbookTitle: 'Tờ giấy nhắn',
      giftTitle: 'Ngăn kéo quà mừng',
      thanks: 'Cảm ơn bạn đã mở từng lớp giấy này cùng chúng mình.',
      closing: 'Hẹn gặp bạn,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const dp = parts(d.date), mono = `${initial(n.first)}&${initial(n.second)}`;

    const cover = html`
      <div class="gap-stage">
        <p class="gap-top">${t.coverTitle}</p>
        <div class="gap-card">
          <div class="gap-inside" aria-hidden="true">
            <i class="l l1"><svg viewBox="0 0 200 220"><path d="M20 220V90C20 45 55 12 100 12s80 33 80 78v130z"/><path class="in" d="M44 220V96c0-34 24-58 56-58s56 24 56 58v124z"/></svg></i>
            <i class="l l2"><svg viewBox="0 0 200 120"><path d="M0 120c20-50 50-70 100-70s80 20 100 70z"/></svg></i>
            <i class="l l3"><svg viewBox="0 0 200 150"><circle cx="72" cy="34" r="17"/><path d="M50 150c0-52 8-92 22-92s22 40 22 92z"/><circle cx="130" cy="42" r="15"/><path d="M110 150c0-48 7-84 20-84s20 36 20 84z"/><path class="veil" d="M115 58c14-14 30-10 34 4-14 4-26 4-34-4z"/></svg></i>
            <i class="l l4"><svg viewBox="0 0 200 70"><g><circle cx="22" cy="44" r="9"/><circle cx="14" cy="34" r="7"/><circle cx="30" cy="34" r="7"/><path d="M22 52v18"/></g><g><circle cx="176" cy="40" r="10"/><circle cx="168" cy="29" r="7"/><circle cx="185" cy="30" r="7"/><path d="M176 50v20"/></g></svg></i>
            <p class="ribbon">${n.first} <b>&amp;</b> ${n.second}</p>
          </div>
          <div class="gap-front">
            <div class="front-face">
              <span class="mono">${initial(n.first)}<i>&amp;</i>${initial(n.second)}</span>
              <p class="to">Gửi <b>${guest}</b></p>
              <h1>${n.first}<em>&amp;</em>${n.second}</h1>
              <p class="date">${fmt.dots(d.date)}</p>
            </div>
          </div>
        </div>
        <button class="gap-open" data-open>Mở thiệp</button>
        <p class="gap-hint">${t.coverHint}</p>
      </div>`;

    const sheet = (cls, body) => html`<section class="sheet ${cls}"><div class="paper">${body}</div></section>`;
    const sections = {
      hero: () => sheet('hero', html`
        <p class="kicker" data-rv="blur">${t.kicker}</p>
        <figure class="cutout" data-rv="zoom"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}" loading="lazy"></figure>
        <h2 class="names" data-rv="up">${n.first}<em>&amp;</em>${n.second}</h2>
        <p class="when" data-rv="up">${fmt.long(d.date)}</p>
        <p class="invite" data-type="24">${t.invite}</p>`),

      couple: () => sheet('couple', html`
        <h2 data-rv="up">${t.coupleTitle}</h2>
        <div class="duo">
          <div data-rv="drop"><i class="scallop"><img data-zoom src="${ctx.img('groom', 3)}" alt="${n.groom}" loading="lazy"></i><h3>${n.groom}</h3>${d.groom.bio ? html`<p>${d.groom.bio}</p>` : ''}</div>
          <div data-rv="drop" style="transition-delay:.15s"><i class="scallop b"><img data-zoom src="${ctx.img('bride', 4)}" alt="${n.bride}" loading="lazy"></i><h3>${n.bride}</h3>${d.bride.bio ? html`<p>${d.bride.bio}</p>` : ''}</div>
        </div>`),

      families: () => (d.families || []).length ? sheet('families', html`
        ${(d.families || []).map((f, i) => html`<div data-rv="${i ? 'right' : 'left'}"><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}`) : '',

      events: () => sheet('events', html`
        <h2 data-rv="up">${t.eventsTitle}</h2>
        ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
          <article class="page ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
            <div class="fold"><span>${p.weekday}</span><b>${p.dd}</b><span>T${p.mo}</span></div>
            <div><h3>${e.title}</h3><p>${fmt.time(e.date)} · ${e.venue}</p><p class="addr">${e.address}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}</div>
          </article>`; })}`),

      countdown: () => sheet('count', html`<div data-rv="zoom">${W.countdown()}</div><a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>`),

      album: () => ctx.album.length ? sheet('album', html`<h2 data-rv="up">${t.albumTitle}</h2><div class="frame" data-rv="zoom">${W.gallery()}</div>`) : '',

      map: () => sheet('map-sec', html`<h2 data-rv="up">Đường đến</h2><div data-rv="up">${W.map({ btn: 'btn' })}</div>`),

      rsvp: () => sheet('reply', html`<h2 data-rv="up">${t.rsvpTitle}</h2><p class="lead">${t.rsvpLead}</p>${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}`),

      guestbook: () => sheet('book', html`<h2 data-rv="up">${t.guestbookTitle}</h2>${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}`),

      gift: () => sheet('gift', html`<h2 data-rv="up">${t.giftTitle}</h2>${W.gift({ btn: 'btn ghost', hint: 'Kéo ngăn tủ ra (chạm)', box: html`<i class="dr-body"></i><i class="dr-paper">❤</i><i class="dr-front"></i>` })}`),

      thanks: () => sheet('thanks', html`
        <figure class="cutout" data-rv="zoom"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></figure>
        <p class="invite" data-rv="up">${t.thanks}</p><p class="closing">${t.closing}</p>
        <p class="sign">${n.first} &amp; ${n.second}</p>`),
    };

    const main = html`${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}<footer>${mono} · ${fmt.short(d.date)}</footer>`;
    return { cover, main };
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .42, 90, { hearts: true }), 1700);
  },
};
