// Mẫu "Song Hỷ": cửa son mở hai cánh, đèn lồng, chữ Hỷ vàng kim, tên viết tay ánh kim.
// Ảnh dùng: images.hero, images.couple, images.portrait, images.band, images.thanks, images.album[]
import { html, br, fmt, parts } from '../../core/util.js';

export default {
  id: 'song-hy',
  name: 'Song Hỷ',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Dancing+Script:wght@500;700&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap',
  coverMs: 2100,
  cheersButton: 'btn gold',
  defaults: {
    effects: { ambient: ['petals', 'sparkles'] },
    sections: ['invite', 'couple', 'band', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      kicker: 'Lễ Thành Hôn',
      invite: 'Trân trọng báo tin Lễ Thành Hôn của chúng tôi',
      presence: 'Sự hiện diện của quý khách là niềm vinh hạnh\ncủa chúng tôi.',
      quote: '“Hạnh phúc là khi đi cùng nhau thật lâu,\nvà hôm nay là ngày đầu tiên của mãi mãi.”',
      thanks: 'Chúng tôi rất mong được đón tiếp quý khách\ntrong ngày vui trọng đại này.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'Quý khách';

    const cover = html`
      <div class="door l"></div><div class="door r"></div>
      <div class="cover-in">
        <div class="lantern a"></div><div class="lantern b"></div>
        <p class="c-top">Thiệp mời cưới</p>
        <div class="seal"><span>囍</span></div>
        <h1 class="c-names">${n.first} <em>&amp;</em> ${n.second}</h1>
        <p class="c-date">${fmt.dots(d.date)}</p>
        <p class="c-guest">Trân trọng kính mời <b>${guest}</b></p>
        <button class="btn gold" data-open>Mở thiệp</button>
      </div>`;

    const sections = {
      invite: () => html`
        <section class="sec paper">
          <p class="orn" data-rv="zoom">❦</p>
          <div class="families">
            ${(d.families || []).map((f, i) => html`
              <div data-rv="${i ? 'right' : 'left'}">
                <h3>${f.side}</h3>
                ${f.father ? html`<p>Ông <b>${f.father}</b></p>` : ''}
                ${f.mother ? html`<p>Bà <b>${f.mother}</b></p>` : ''}
                <small>${br(f.address)}</small>
              </div>`)}
          </div>
          <p class="lead" data-rv="up">${t.invite}</p>
          <div class="couple-names" data-rv="zoom">
            <span class="shine dark">${n.first}</span><i class="beat">❤</i><span class="shine dark">${n.second}</span>
          </div>
          <div class="arch" data-rv="flip"><img data-zoom src="${ctx.img('couple', 1)}" alt="${n.pair}" loading="lazy"></div>
          <p class="body" data-rv="up">${br(t.presence)}</p>
        </section>`,

      couple: () => html`
        <section class="sec red">
          <h2 class="title shine" data-rv="up">Cô dâu &amp; Chú rể</h2>
          <div class="arch wide" data-rv="zoom"><img data-zoom src="${ctx.img('portrait', 3)}" alt="${n.pair}" loading="lazy"></div>
          <div class="duo">
            <div data-rv="left"><small>Chú rể</small><b>${n.groom}</b></div>
            <span class="hy-mini" data-rv="zoom">囍</span>
            <div data-rv="right"><small>Cô dâu</small><b>${n.bride}</b></div>
          </div>
          <p class="quote" data-rv="up">${br(t.quote)}</p>
        </section>`,

      band: () => html`<div class="band" data-rv="zoom"><img data-zoom src="${ctx.img('band', 2)}" alt="" loading="lazy"></div>`,

      events: () => html`
        <section class="sec paper">
          <h2 class="title shine dark" data-rv="up">Sự kiện cưới</h2>
          ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
            <div class="event ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
              <div class="ev-date"><b>${p.dd}</b><span>Tháng ${p.mo}</span></div>
              <div class="ev-info">
                <h3>${e.title}</h3>
                <p class="time">${fmt.full(e.date)}</p>
                ${e.lunar ? html`<p>${e.lunar}</p>` : ''}
                <p>${e.venue}<br><small>${e.address}</small></p>
              </div>
            </div>`; })}
        </section>`,

      countdown: () => html`
        <section class="sec red">
          <h2 class="title shine" data-rv="up">Cùng đếm ngược</h2>
          <div data-rv="zoom">${W.countdown()}</div>
          <div data-rv="up">${W.calendar()}</div>
          <a class="btn gold" href="${W.gcalUrl()}" target="_blank" rel="noopener" data-rv="up">Thêm vào Google Calendar</a>
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sec paper">
          <h2 class="title shine dark" data-rv="up">Album ảnh cưới</h2>
          <div data-rv="zoom">${W.gallery()}</div>
        </section>` : '',

      map: () => html`
        <section class="sec paper alt">
          <h2 class="title shine dark" data-rv="up">Địa điểm</h2>
          <div data-rv="up">${W.map({ btn: 'btn red-btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sec red">
          <h2 class="title shine" data-rv="up">Xác nhận tham dự</h2>
          <p class="body" data-rv="up">Quý khách sẽ đến chung vui cùng chúng tôi chứ?</p>
          <div data-rv="up">${W.rsvp({ btn: 'btn gold' })}</div>
        </section>`,

      guestbook: () => html`
        <section class="sec paper">
          <h2 class="title shine dark" data-rv="up">Sổ lưu bút</h2>
          <div data-rv="up">${W.guestbook({ btn: 'btn red-btn', cls: 'light' })}</div>
        </section>`,

      gift: () => html`
        <section class="sec paper alt">
          <h2 class="title shine dark" data-rv="up">Hộp quà mừng</h2>
          ${W.gift({ btn: 'btn red-btn' })}
        </section>`,

      thanks: () => html`
        <section class="thanks" data-fireworks>
          <img src="${ctx.img('thanks', 5)}" alt="" loading="lazy">
          <div class="thanks-text">
            <h2 class="shine" data-rv="up">Thank you!</h2>
            <p data-rv="up">${br(t.thanks)}</p>
            <p class="sign" data-rv="up">${n.pair}</p>
          </div>
        </section>`,
    };

    const main = html`
      <header class="hero">
        <div class="cloud c1"></div><div class="cloud c2"></div>
        <div class="hero-text">
          <p class="hy shine">囍</p>
          <p class="kicker">${t.kicker}</p>
          <h1 class="names"><span class="write">${n.first}</span><span class="amp">&amp;</span><span class="write w2">${n.second}</span></h1>
          <p class="hero-date">${fmt.long(d.date)}</p>
        </div>
        <div class="hero-photo"><img data-parallax="0.18" src="${ctx.img('hero', 0)}" alt="${n.pair}"></div>
        <div class="scroll-hint" aria-hidden="true"><i></i></div>
      </header>
      ${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}
      <footer>囍 · ${fmt.short(d.date)} · 囍</footer>`;

    return { cover, main };
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx, W = fx.width, H = fx.height;
    fx.burst(W / 2, H * .4, 140);
    setTimeout(() => { fx.burst(W * .2, H * .3, 60); fx.burst(W * .8, H * .3, 60); }, 500);
  },
};
