// Mẫu "Đèn Lồng": một đêm rằm ở phố Hội An. Khách thắp nến rồi thả hoa đăng xuống sông để mở thiệp.
// Bên trong: dây đèn lồng đung đưa và sáng dần khi cuộn, tường vàng phố cổ, đôi đèn lồng ôm ảnh cô dâu chú rể,
// dãy nhà phố kể chuyện tình, biển gỗ ghi lịch lễ, đèn lồng đếm ngược, cửa chớp gỗ mở ra album,
// lời chúc thành hoa đăng trôi trên sông, phong bao lì xì mừng cưới, và cuối cùng thả đèn trời.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts, reduced, $, $$ } from '../../core/util.js';

const LANTERN_COLORS = ['#d62828', '#f77f00', '#fcbf49', '#c2185b', '#2a9d8f', '#d62828', '#7b2cbf', '#f77f00'];
const lantern = (c, i, extra = '') => html`<i class="ln ${extra}" style="--c:${c}; --i:${i}"><b></b></i>`;
const string = (n = 8) => html`<div class="string" aria-hidden="true">${Array.from({ length: n }, (_, i) => lantern(LANTERN_COLORS[i % LANTERN_COLORS.length], i))}</div>`;
const WALLS = ['#f2c14e', '#7fb7be', '#e8a0a0', '#f2c14e', '#a3c4a8'];
const initial = s => (s || '').trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '';

export default {
  // Bảng màu có sẵn: cặp đôi chọn trong Studio; vars ghi đè biến màu của mẫu (xem theme.css)
  palettes: [{"id":"hoi-an","name":"Hội An","swatch":["#c1121f","#fcbf49"]},{"id":"xanh-ngoc","name":"Xanh ngọc","swatch":["#1f8a7a","#59c9b5"],"vars":{"--red":"#1f8a7a","--orange":"#3fb8a0","--pink":"#59c9b5"}},{"id":"tim-mong","name":"Tím mộng","swatch":["#7a3fb0","#c58de8"],"vars":{"--red":"#7a3fb0","--orange":"#a265d6","--pink":"#c58de8"}}],
  id: 'den-long',
  name: 'Đèn Lồng',
  fonts: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500;700&family=Noto+Serif+Display:ital,wght@0,300;0,500;1,300;1,400&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  coverMs: 1600,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['bokeh'], density: .6,
      colors: { bokeh: ['#ffb347', '#ff6b4a', '#ffd27a'], confetti: ['#d62828', '#f77f00', '#fcbf49', '#fdf3dc'], fireworks: ['#fcbf49', '#f77f00', '#d62828', '#ffffff'] },
    },
    sections: ['hero', 'couple', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Đêm rằm phố Hội',
      coverHint: 'Chạm vào hoa đăng để thắp nến và thả xuống sông',
      heroKicker: 'Phố đã lên đèn',
      heroLead: 'Ở phố cổ, mỗi chiếc đèn lồng được thắp lên là một lời chúc bình an. Đêm nay chúng mình thắp đèn để mời bạn đến chung vui.',
      coupleTitle: 'Hai ngọn đèn chung một mái hiên',
      storyTitle: 'Con phố của chúng mình',
      eventsTitle: 'Biển gỗ ghi ngày vui',
      countdownTitle: 'Đèn còn sáng bao lâu nữa',
      albumTitle: 'Sau những ô cửa gỗ',
      rsvpTitle: 'Bạn sẽ ghé phố chứ?',
      rsvpLead: 'Xác nhận giúp chúng mình để giữ một chỗ bên hiên nhà thật đẹp.',
      guestbookTitle: 'Thả một đóa hoa đăng',
      giftTitle: 'Phong bao mừng cưới',
      thanksTitle: 'Thả đèn trời',
      thanks: 'Cảm ơn bạn đã thắp thêm một ngọn đèn cho câu chuyện của chúng mình. Hẹn gặp bạn ở phố, trong ngày vui.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts;
    const ini = `${initial(n.first)} ♥ ${initial(n.second)}`;
    const guest = ctx.guest;

    const cover = html`
      <div class="town" aria-hidden="true">
        <i class="moon"></i>
        ${string(7)}
        <div class="roofs">${[0, 1, 2, 3, 4].map(i => html`<i class="house h${i}"><b></b><b></b></i>`)}</div>
        <i class="river"><i class="glow"></i></i>
        <i class="float f1"></i><i class="float f2"></i><i class="float f3"></i>
      </div>
      <div class="cover-in">
        ${guest ? html`<p class="to">Gửi ${guest}</p>` : ''}
        <p class="pre">${n.first} &amp; ${n.second}</p>
        <h1 class="cover-title">${t.coverTitle}</h1>
        <p class="cover-date">${fmt.dots(d.date)}</p>
      </div>
      <button class="hoadang" data-open type="button" aria-label="Thắp nến, thả hoa đăng để mở thiệp">
        <i class="petals">${[0, 1, 2, 3, 4, 5, 6, 7].map(i => html`<i style="--k:${i}"></i>`)}</i>
        <i class="candle"><i class="flame"></i></i>
      </button>
      <p class="cover-hint">${t.coverHint}</p>`;

    const sections = {
      hero: () => html`
        <header class="hero">
          ${string(9)}
          <p class="kicker" data-rv="up">${t.heroKicker}</p>
          <h1 class="names" data-rv="zoom"><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
          <p class="when" data-rv="up">${fmt.long(d.date)} · ${fmt.time(d.date)}${d.city ? html` · ${d.city}` : ''}</p>
          <figure class="moongate" data-rv="zoom"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}"><i class="vine" aria-hidden="true"></i></figure>
          <p class="lead" data-rv="up">${t.heroLead}</p>
        </header>`,

      couple: () => html`
        <section class="sec couple">
          <h2 data-rv="up">${t.coupleTitle}</h2>
          <div class="pair">
            ${[['groom', 3, 'Chú rể', '#d62828'], ['bride', 4, 'Cô dâu', '#c2185b']].map(([who, i, role, c], k) => { const person = d[who]; return html`
              <figure class="big-ln s${k}" data-rv="up" style="--c:${c}">
                <i class="cord" aria-hidden="true"></i>
                <span class="silk"><img data-zoom src="${ctx.img(who, i)}" alt="${person.short}" loading="lazy"></span>
                <i class="tassel" aria-hidden="true"></i>
                <figcaption><small>${role}</small><b>${person.full || person.short}</b>${person.bio ? html`<span>${person.bio}</span>` : ''}</figcaption>
              </figure>`; })}
          </div>
          ${(d.families || []).length ? html`<div class="families" data-rv="up">${d.families.map(f => html`
            <div><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<small>${br(f.address)}</small>` : ''}</div>`)}</div>` : ''}
        </section>`,

      story: () => (d.story || []).length ? html`
        <section class="sec story">
          <h2 data-rv="up">${t.storyTitle}</h2>
          <ol class="street">
            ${d.story.map((s, i) => html`
              <li class="shop" data-rv="up" style="--wall:${WALLS[i % WALLS.length]}">
                <i class="roof" aria-hidden="true"></i>
                <span class="sign">${s.year}</span>
                <div class="facade">
                  <h3>${s.title}</h3>${s.text ? html`<p>${s.text}</p>` : ''}
                </div>
                ${lantern(LANTERN_COLORS[i % LANTERN_COLORS.length], i, 'eave')}
              </li>`)}
          </ol>
        </section>` : '',

      events: () => html`
        <section class="sec events">
          <h2 data-rv="up">${t.eventsTitle}</h2>
          <div class="boards">
            ${(d.events || []).map((e, i) => html`
              <article class="board ${e.main ? 'main' : ''}" data-rv="drop" style="--r:${i % 2 ? 1.5 : -1.5}deg">
                <i class="cords" aria-hidden="true"></i>
                <h3>${e.title}</h3>
                <p class="t">${fmt.time(e.date)}</p>
                <p class="d">${fmt.long(e.date)}</p>
                ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                ${e.venue ? html`<p class="v">${e.venue}</p>` : ''}
                ${e.address ? html`<p class="a">${br(e.address)}</p>` : ''}
              </article>`)}
          </div>
          <div data-rv="up">${W.calendar()}</div>
        </section>`,

      countdown: () => html`
        <section class="sec countdown">
          ${string(7)}
          <h2 data-rv="up">${t.countdownTitle}</h2>
          <div class="cd-wrap" data-rv="zoom">${W.countdown({ done: 'Phố đã lên đèn cho ngày vui của chúng mình ♥' })}</div>
          <a class="btn ghost" data-rv="up" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sec album">
          <h2 data-rv="up">${t.albumTitle}</h2>
          <div class="windows">${ctx.album.map((src, i) => html`
            <figure class="win ${i === 0 ? 'wide' : ''}" data-rv="zoom">
              <img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">
              <i class="shutter l" aria-hidden="true"></i><i class="shutter r" aria-hidden="true"></i>
              ${(d.images?.captions || [])[i] ? html`<figcaption>${d.images.captions[i]}</figcaption>` : ''}
            </figure>`)}</div>
          <p class="hint">Cửa gỗ tự mở khi bạn cuộn tới · chạm để xem ảnh lớn</p>
        </section>` : '',

      map: () => html`
        <section class="sec map-sec">
          <h2 data-rv="up">Đường về phố của chúng mình</h2>
          <div data-rv="up">${W.map({ btn: 'btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sec rsvp">
          <div class="scroll" data-rv="up">
            <h2>${t.rsvpTitle}</h2>
            <p class="lead">${t.rsvpLead}</p>
            ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, không đến được' })}
          </div>
        </section>`,

      guestbook: () => html`
        <section class="sec book">
          <h2 data-rv="up">${t.guestbookTitle}</h2>
          <p class="lead" data-rv="up">Mỗi lời chúc là một đóa hoa đăng thả trôi, mang may mắn tới hai đứa.</p>
          <div data-rv="up">${W.guestbook({ btn: 'btn', placeholder: 'Viết điều ước lên hoa đăng của bạn…' })}</div>
        </section>`,

      gift: () => html`
        <section class="sec gift">
          <h2 data-rv="up">${t.giftTitle}</h2>
          ${W.gift({ btn: 'btn ghost', hint: 'Chạm để mở phong bao', box: html`<i class="env"></i><i class="flap"></i><i class="seal">囍</i><i class="card-in"></i>` })}
        </section>`,

      thanks: () => html`
        <section class="sec thanks" data-fireworks>
          <div class="sky" aria-hidden="true">${[0, 1, 2, 3, 4, 5].map(i => html`<i class="sky-ln" style="--x:${8 + i * 16}%; --d:${(i * 1.7) % 5}s; --s:${.5 + (i % 3) * .2}"></i>`)}</div>
          <h2 data-rv="up">${t.thanksTitle}</h2>
          <figure class="moongate small" data-rv="zoom"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></figure>
          <button class="release" type="button" data-rv="up"><i class="paper-ln"><i class="fire"></i></i><small>Chạm để thả đèn trời</small></button>
          <p class="lead" data-rv="up">${t.thanks}</p>
          <p class="sign" data-rv="up">${n.pair}</p>
        </section>`,
    };

    const main = html`
      ${(d.sections || []).filter(s => ctx.has(s)).map(s => sections[s]?.() || '')}
      <footer>${ini} · ${fmt.dots(d.date)}</footer>`;
    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    floatLantern(ctx, cover);
    lightOnScroll(main);
    releaseSkyLantern(ctx, main);
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .4, 100), 300);
  },
};

/* Bìa: chạm hoa đăng thì nến bừng sáng, hoa đăng trôi ra giữa sông rồi thiệp mở */
function floatLantern(ctx, cover) {
  const b = $('.hoadang', cover);
  if (!b) return;
  let done = false;
  b.addEventListener('click', e => {
    if (done) return;
    done = true;
    e.stopImmediatePropagation();
    b.classList.add('lit');
    cover.classList.add('lit');
    setTimeout(() => b.classList.add('away'), reduced ? 0 : 750);
    setTimeout(() => ctx.open(false), reduced ? 0 : 1600);
  }, true);
}

/* Dây đèn lồng trong thiệp: sáng lần lượt khi cuộn tới */
function lightOnScroll(main) {
  const strings = $$('.string', main);
  if (!strings.length) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('on'); io.unobserve(e.target);
  }), { threshold: .3 });
  strings.forEach(s => io.observe(s));
}

/* Phần cuối: thả đèn trời bay lên */
function releaseSkyLantern(ctx, main) {
  const b = $('.release', main), sec = b?.closest('.thanks');
  if (!b) return;
  b.addEventListener('click', () => {
    if (b.classList.contains('up')) return;
    b.classList.add('up');
    sec.classList.add('rising');
    const r = b.getBoundingClientRect();
    ctx.fx.burst(r.left + r.width / 2, r.top, 50, { hearts: true });
    setTimeout(() => { $('small', b).textContent = 'Đèn đã bay lên, mang theo lời ước của bạn ♥'; }, reduced ? 0 : 900);
  });
}
