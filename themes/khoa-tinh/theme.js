// Mẫu "Khóa Tình": đêm trên cây cầu khóa tình. Khách xoay ổ khóa số đúng ngày cưới (ngày + tháng) để mở thiệp.
// Bên trong: mặt dây chuyền lắc lư, chùm chìa khóa kỷ niệm, thẻ khắc lịch lễ, ảnh treo dọc lan can cầu,
// lời chúc thành những ổ khóa nhỏ treo lên cầu, hộp nhẫn mừng cưới, và cuối cùng ném chìa khóa xuống sông.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts, reduced, $, $$ } from '../../core/util.js';

const KEY = '<svg viewBox="0 0 64 24" aria-hidden="true"><circle cx="11" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 12h40M48 12v8M55 12v6" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
const LOCK = '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M10 20v-6a10 10 0 0 1 20 0v6" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 46 4 30a9 9 0 0 1 16-11 9 9 0 0 1 16 11z" fill="currentColor"/></svg>';
const initial = s => (s || '').trim().split(/\s+/).pop()?.[0]?.toUpperCase() || '';

export default {
  id: 'khoa-tinh',
  name: 'Khóa Tình',
  fonts: 'https://fonts.googleapis.com/css2?family=Alex+Brush&family=Spectral:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  coverMs: 1700,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['bokeh', 'sparkles'], density: .7,
      colors: { bokeh: ['#ffcf8a', '#d8a48f', '#7fb3c8'], sparkles: ['#ffe7b3', '#ffffff'], confetti: ['#c9a227', '#d8a48f', '#b23a48', '#f7efe3'], fireworks: ['#ffcf8a', '#d8a48f', '#ffffff', '#b23a48'] },
    },
    sections: ['hero', 'couple', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      lockTitle: 'Khóa tình của chúng mình',
      lockHint: 'Mật mã là ngày chúng mình về chung một nhà',
      heroKicker: 'Đã mở khóa',
      heroLead: 'Có những ổ khóa người ta treo lên cầu rồi ném chìa xuống sông, để không bao giờ mở ra nữa. Chúng mình sắp làm điều đó, và muốn bạn đứng bên cạnh.',
      coupleTitle: 'Hai mặt dây chuyền',
      storyTitle: 'Chùm chìa khóa kỷ niệm',
      eventsTitle: 'Những ngày được khắc tên',
      countdownTitle: 'Còn bao lâu nữa đến lúc khóa chặt',
      albumTitle: 'Lan can cầu khóa tình',
      rsvpTitle: 'Bạn sẽ đến chứ?',
      rsvpLead: 'Xác nhận giúp chúng mình để giữ một chỗ ngồi thật đẹp.',
      guestbookTitle: 'Treo một ổ khóa lên cầu',
      giftTitle: 'Hộp nhẫn',
      thanksTitle: 'Thả chìa khóa xuống sông',
      thanks: 'Cảm ơn bạn đã là một phần trong câu chuyện của chúng mình. Hẹn gặp bạn trong ngày vui.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts;
    const p = parts(d.date), code = `${p.dd}${p.mm}`;
    const ini = `${initial(n.first)} ♥ ${initial(n.second)}`;
    const guest = ctx.guest;

    const dial = (i) => html`
      <div class="dial" data-dial="${i}" role="spinbutton" tabindex="0" aria-label="Vòng số ${i + 1}" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0">
        <span class="dial-strip">${[...'0123456789'].map(c => html`<b>${c}</b>`)}</span>
      </div>`;

    const cover = html`
      <div class="night" aria-hidden="true"><i class="moon"></i><i class="lamp l1"></i><i class="lamp l2"></i><i class="lamp l3"></i><i class="rail"></i><i class="river"></i></div>
      <div class="lock-wrap" data-code="${code}">
        ${guest ? html`<p class="to">Gửi ${guest}</p>` : ''}
        <h1 class="lock-title">${t.lockTitle}</h1>
        <div class="padlock" aria-hidden="false">
          <i class="shackle" aria-hidden="true"></i>
          <div class="body">
            <span class="engrave">${ini}</span>
            <div class="dials" role="group" aria-label="Ổ khóa số: nhập ngày và tháng cưới">${[0, 1, 2, 3].map(dial)}</div>
            <span class="slash" aria-hidden="true">ngày · tháng</span>
          </div>
        </div>
        <p class="lock-hint">${t.lockHint}</p>
        <p class="lock-sub">Vuốt hoặc chạm trên/dưới từng vòng số để xoay</p>
        <button class="btn ghost" data-open type="button">Mở giúp tôi</button>
      </div>`;

    const sections = {
      hero: () => html`
        <header class="hero">
          <div class="night" aria-hidden="true"><i class="moon"></i><i class="river"></i></div>
          <p class="kicker" data-rv="up"><span class="open-lock">${raw(LOCK)}</span>${t.heroKicker}</p>
          <h1 class="names" data-rv="zoom"><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
          <p class="when" data-rv="up">${fmt.long(d.date)} · ${fmt.time(d.date)}${d.city ? html` · ${d.city}` : ''}</p>
          <figure class="locket hero-locket" data-rv="drop"><i class="chain"></i><span class="frame"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}"></span></figure>
          <p class="lead" data-rv="up">${t.heroLead}</p>
        </header>`,

      couple: () => html`
        <section class="sec couple">
          <h2 data-rv="up">${t.coupleTitle}</h2>
          <div class="pair">
            ${[['groom', 3, 'Chú rể'], ['bride', 4, 'Cô dâu']].map(([who, i, role], k) => { const person = d[who]; return html`
              <figure class="locket swing s${k}" data-rv="up">
                <i class="chain"></i>
                <span class="frame"><img data-zoom src="${ctx.img(who, i)}" alt="${person.short}" loading="lazy"></span>
                <figcaption><small>${role}</small><b>${person.full || person.short}</b>${person.bio ? html`<span>${person.bio}</span>` : ''}</figcaption>
              </figure>`; })}
          </div>
          ${(d.families || []).length ? html`<div class="families" data-rv="up">${d.families.map(f => html`
            <div><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<small>${br(f.address)}</small>` : ''}</div>`)}</div>` : ''}
        </section>`,

      story: () => (d.story || []).length ? html`
        <section class="sec story">
          <h2 data-rv="up">${t.storyTitle}</h2>
          <div class="ring" aria-hidden="true"></div>
          <ol class="keys">
            ${d.story.map((s, i) => html`
              <li data-rv="${i % 2 ? 'right' : 'left'}" style="--i:${i}">
                <span class="key">${raw(KEY)}<b>${s.year}</b></span>
                <div><h3>${s.title}</h3>${s.text ? html`<p>${s.text}</p>` : ''}</div>
              </li>`)}
          </ol>
        </section>` : '',

      events: () => html`
        <section class="sec events">
          <h2 data-rv="up">${t.eventsTitle}</h2>
          <div class="tags">
            ${(d.events || []).map((e, i) => html`
              <article class="tag ${e.main ? 'main' : ''}" data-rv="flip" style="--r:${i % 2 ? 2 : -2}deg">
                <i class="hole" aria-hidden="true"></i>
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
          <h2 data-rv="up">${t.countdownTitle}</h2>
          <div data-rv="zoom">${W.countdown({ done: 'Ổ khóa đã khóa chặt, mãi mãi ♥' })}</div>
          <a class="btn ghost" data-rv="up" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sec album">
          <h2 data-rv="up">${t.albumTitle}</h2>
          <div class="bridge" data-rv="up">
            <i class="rope" aria-hidden="true"></i>
            <div class="hang">${ctx.album.map((src, i) => html`
              <figure class="photo" style="--d:${(i % 3) * .4}s; --r:${[-4, 3, -2, 5, -3][i % 5]}deg"><i class="clip" aria-hidden="true">${raw(LOCK)}</i><img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">${(d.images?.captions || [])[i] ? html`<figcaption>${d.images.captions[i]}</figcaption>` : ''}</figure>`)}</div>
          </div>
          <p class="hint">Vuốt ngang dọc lan can · chạm để xem ảnh lớn</p>
        </section>` : '',

      map: () => html`
        <section class="sec map-sec">
          <h2 data-rv="up">Đường đến cây cầu của chúng mình</h2>
          <div data-rv="up">${W.map({ btn: 'btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sec rsvp">
          <div class="card-box" data-rv="up">
            <h2>${t.rsvpTitle}</h2>
            <p class="lead">${t.rsvpLead}</p>
            ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, không đến được' })}
          </div>
        </section>`,

      guestbook: () => html`
        <section class="sec book">
          <h2 data-rv="up">${t.guestbookTitle}</h2>
          <p class="lead" data-rv="up">Mỗi lời chúc là một ổ khóa nhỏ khóa thêm hạnh phúc cho hai đứa.</p>
          <div data-rv="up">${W.guestbook({ btn: 'btn', placeholder: 'Viết lời chúc lên ổ khóa của bạn…' })}</div>
        </section>`,

      gift: () => html`
        <section class="sec gift">
          <h2 data-rv="up">${t.giftTitle}</h2>
          ${W.gift({ btn: 'btn ghost', hint: 'Chạm để mở hộp nhẫn', box: html`<i class="lid"></i><i class="base"></i><i class="ring-in"></i>` })}
        </section>`,

      thanks: () => html`
        <section class="sec thanks" data-fireworks>
          <div class="night" aria-hidden="true"><i class="moon"></i><i class="lamp l1"></i><i class="lamp l2"></i><i class="river"></i></div>
          <h2 data-rv="up">${t.thanksTitle}</h2>
          <figure class="locket big-locket" data-rv="zoom"><i class="chain"></i><span class="frame"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></span></figure>
          <button class="throw" type="button" data-rv="up" aria-label="Ném chìa khóa xuống sông"><span class="the-key">${raw(KEY)}</span><small>Chạm để ném chìa khóa</small></button>
          <p class="lead" data-rv="up">${t.thanks}</p>
          <p class="sign" data-rv="up">${n.pair}</p>
          <i class="ripple" aria-hidden="true"></i>
        </section>`,
    };

    const main = html`
      ${(d.sections || []).filter(s => ctx.has(s)).map(s => sections[s]?.() || '')}
      <footer>${ini} · ${fmt.dots(d.date)}</footer>`;
    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    dialLock(ctx, cover);
    throwKey(ctx, main);
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .45, 120), 350);
  },
};

/* Ổ khóa số: 4 vòng (ngày + tháng). Đúng mật mã thì khóa bật mở rồi mở thiệp. */
function dialLock(ctx, cover) {
  const wrap = $('.lock-wrap', cover), lock = $('.padlock', cover), btn = $('[data-open]', cover);
  if (!wrap) return;
  const code = wrap.dataset.code, dials = $$('[data-dial]', cover);
  const val = dials.map(() => 0);
  let done = false;
  const show = (i, animate = true) => {
    const strip = dials[i].firstElementChild;
    strip.style.transition = animate && !reduced ? '' : 'none';
    strip.style.transform = `translateY(${-val[i] * 10}%)`;
    dials[i].setAttribute('aria-valuenow', val[i]);
  };
  const unlock = () => {
    if (done) return; done = true;
    lock.classList.add('unlocked');
    ctx.fx.burstAt?.(lock, 40);
    setTimeout(() => ctx.open(false), reduced ? 0 : 650);
  };
  const check = () => { if (val.join('') === code) unlock(); };
  const step = (i, d) => { if (done) return; val[i] = (val[i] + d + 10) % 10; show(i); dials[i].classList.remove('tick'); void dials[i].offsetWidth; dials[i].classList.add('tick'); check(); };

  dials.forEach((el, i) => {
    show(i, false);
    let y0 = null, moved = false;
    el.addEventListener('pointerdown', e => { y0 = e.clientY; moved = false; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) > 22) { step(i, dy < 0 ? 1 : -1); y0 = e.clientY; moved = true; }
    });
    el.addEventListener('pointerup', e => {
      if (y0 !== null && !moved) { const r = el.getBoundingClientRect(); step(i, e.clientY < r.top + r.height / 2 ? 1 : -1); }
      y0 = null;
    });
    el.addEventListener('pointercancel', () => (y0 = null));
    el.addEventListener('wheel', e => { e.preventDefault(); step(i, e.deltaY < 0 ? 1 : -1); }, { passive: false });
    el.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); step(i, 1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(i, -1); }
      else if (/^\d$/.test(e.key)) { val[i] = +e.key; show(i); check(); dials[i + 1]?.focus(); }
    });
  });

  // "Mở giúp tôi": xoay từng vòng tới đúng số rồi mở (chặn lần bấm gốc để chạy hoạt ảnh trước)
  btn?.addEventListener('click', e => {
    if (done) return;
    e.stopImmediatePropagation();
    btn.disabled = true;
    [...code].forEach((c, i) => setTimeout(() => { val[i] = +c; show(i); }, reduced ? 0 : i * 150));
    setTimeout(unlock, reduced ? 0 : 700);
  }, true);
}

/* Ném chìa khóa xuống sông ở phần cuối */
function throwKey(ctx, main) {
  const b = $('.throw', main), sec = b?.closest('.thanks');
  if (!b) return;
  b.addEventListener('click', () => {
    if (b.classList.contains('thrown')) return;
    b.classList.add('thrown');
    setTimeout(() => {
      sec.classList.add('splash');
      const r = b.getBoundingClientRect();
      ctx.fx.burst(r.left + r.width / 2, r.top - 40, 60, { hearts: true });
      $('small', b).textContent = 'Chìa khóa đã nằm dưới đáy sông. Mãi mãi ♥';
    }, reduced ? 0 : 1100);
  });
}
