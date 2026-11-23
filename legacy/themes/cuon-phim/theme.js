// Mẫu "Cuộn Phim": thiệp cưới là một suất chiếu đặc biệt. Khách kéo cần máy chiếu, đèn chiếu bật,
// cuộn phim quay, màn ảnh đếm ngược 3-2-1 rồi bộ phim bắt đầu.
// Bên trong: màn ảnh có rèm nhung mở ra ảnh cưới và phụ đề, diễn viên chính, nhà sản xuất (gia đình),
// cuộn phim dọc kể từng cảnh (bảng clapper đập khi cuộn tới), vé xem phim cho từng lễ, đếm ngược kiểu
// vòng đếm đầu phim, dải phim 35mm vuốt ngang làm album (chạm có tiếng tạch máy ảnh), ghế đôi giữ chỗ,
// lời chúc hiện như phụ đề, hộp bắp rang mừng cưới, và danh đề cuối phim chạy chữ.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, reduced, $, $$ } from '../../core/util.js';

const pad = n => String(n).padStart(2, '0');
const holes = html`<i class="holes" aria-hidden="true"></i>`;
const tc = i => `00:${pad(3 + i * 7)}:${pad((i * 23) % 60)}:${pad((i * 11) % 24)}`; // mã thời gian trang trí

// Âm thanh tự tạo bằng Web Audio (không dùng file có bản quyền). Lỗi hay bị chặn thì im lặng.
let audio;
function sound(kind) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, now = a.currentTime, len = kind === 'reel' ? 1.6 : .09;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * len), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const t = i / a.sampleRate;
      // Máy chiếu: tiếng lạch cạch 24 nhịp/giây; máy ảnh: một tiếng tạch ngắn
      const env = kind === 'reel' ? (t % (1 / 24) < .006 ? 1 : .12) * Math.min(1, t * 6, (len - t) * 3) : Math.exp(-t * 70);
      ch[i] = (Math.random() * 2 - 1) * env;
    }
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.value = kind === 'reel' ? 1800 : 3200; g.gain.value = kind === 'reel' ? .18 : .5;
    src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start(now);
  } catch {}
}

export default {
  // Bảng màu có sẵn: cặp đôi chọn trong Studio; vars ghi đè biến màu của mẫu (xem theme.css)
  palettes: [{"id":"nhung-do","name":"Nhung đỏ","swatch":["#7d1a1d","#e8a33d"]},{"id":"luc-bao","name":"Lục bảo","swatch":["#14574a","#e8a33d"],"vars":{"--velvet":"#14574a","--velvet-hi":"#1f8070"}},{"id":"hai-quan","name":"Xanh hải quân","swatch":["#183a6b","#e8a33d"],"vars":{"--velvet":"#183a6b","--velvet-hi":"#2a5ca3"}}],
  id: 'cuon-phim',
  name: 'Cuộn Phim',
  fonts: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;800&family=Playfair+Display:ital,wght@0,500;1,400;1,700&family=Space+Mono:wght@400;700&family=Be+Vietnam+Pro:wght@400;500&display=swap',
  coverMs: 900,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['sparkles'], density: .45,
      colors: { sparkles: ['#fff3d6', '#ffd27a'], confetti: ['#ffd84d', '#e8a33d', '#b3261e', '#f5efe3'], fireworks: ['#ffd84d', '#fff3d6', '#e8a33d', '#ff6b5a'] },
    },
    sections: ['hero', 'couple', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Suất chiếu đặc biệt',
      coverHint: 'Kéo cần máy chiếu để bắt đầu bộ phim',
      heroKicker: 'Một bộ phim tình cảm của',
      heroLead: 'Phim dài cả một đời, tập đầu tiên khởi chiếu vào ngày cưới. Chúng mình dành riêng cho bạn một chỗ ngồi đẹp nhất.',
      coupleTitle: 'Diễn viên chính',
      storyTitle: 'Những cảnh phim đáng nhớ',
      eventsTitle: 'Vé mời xem phim',
      countdownTitle: 'Phim sắp khởi chiếu',
      albumTitle: 'Cuộn phim kỷ niệm',
      rsvpTitle: 'Giữ chỗ cho bạn',
      rsvpLead: 'Báo giúp chúng mình để rạp chừa sẵn một ghế có tên bạn.',
      guestbookTitle: 'Phụ đề từ khán giả',
      giftTitle: 'Quầy bắp nước',
      thanksTitle: 'Hết phim',
      thanks: 'Cảm ơn bạn đã xem đến cuối. Phần tiếp theo, mời bạn tới xem tận mắt trong ngày vui của chúng mình.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts;
    const guest = ctx.guest;

    const cover = html`
      <div class="theater" aria-hidden="true"><i class="dust"></i></div>
      <div class="screen">
        <div class="card-title">
          ${guest ? html`<p class="to">Kính mời ${guest}</p>` : ''}
          <p class="pre">${t.coverTitle}</p>
          <h1><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
          <p class="cover-date">Khởi chiếu ${fmt.dots(d.date)}</p>
        </div>
        <div class="leader" aria-hidden="true"><i class="sweep"></i><b>3</b><b>2</b><b>1</b></div>
      </div>
      <i class="beam" aria-hidden="true"></i>
      <div class="projector" aria-hidden="true">
        <i class="reel r1"></i><i class="reel r2"></i>
        <i class="body"><i class="lens"></i><i class="vent"></i></i>
      </div>
      <button class="lever" data-open type="button" aria-label="Kéo cần máy chiếu để mở thiệp"><i class="arm"><i class="knob"></i></i></button>
      <p class="cover-hint">${t.coverHint}</p>`;

    const sections = {
      hero: () => html`
        <header class="hero">
          <p class="marquee" data-rv="up"><span>${t.coverTitle}</span></p>
          <div class="stage" data-rv="up">
            <figure class="silver"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}"><i class="grain" aria-hidden="true"></i></figure>
            <i class="curtain l" aria-hidden="true"></i><i class="curtain r" aria-hidden="true"></i>
          </div>
          <p class="kicker" data-rv="up">${t.heroKicker}</p>
          <h1 class="names" data-rv="zoom"><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
          <p class="premiere" data-rv="up">Khởi chiếu <b>${fmt.long(d.date)}</b> · ${fmt.time(d.date)}${d.city ? html` · ${d.city}` : ''}</p>
          <p class="sub" data-rv="up" data-type="26">${t.heroLead}</p>
          <ul class="genre" data-rv="up"><li>Tình cảm</li><li>Hài hước</li><li>Kết có hậu</li><li>P · Mọi lứa tuổi</li></ul>
        </header>`,

      couple: () => html`
        <section class="sec couple">
          <h2 data-rv="up">${t.coupleTitle}</h2>
          <div class="cast">
            ${[['groom', 3, 'Nam chính'], ['bride', 4, 'Nữ chính']].map(([who, i, role], k) => { const person = d[who]; return html`
              <figure class="still s${k}" data-rv="${k ? 'right' : 'left'}">
                <span class="frame">${holes}<img data-zoom src="${ctx.img(who, i)}" alt="${person.short}" loading="lazy">${holes}</span>
                <figcaption><small>${role}</small><b>${person.full || person.short}</b>${person.bio ? html`<span>${person.bio}</span>` : ''}</figcaption>
              </figure>`; })}
          </div>
          ${(d.families || []).length ? html`
            <div class="producers" data-rv="up">
              <h3>Nhà sản xuất</h3>
              ${d.families.map(f => html`<div><small>${f.side}</small>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<span>${br(f.address)}</span>` : ''}</div>`)}
            </div>` : ''}
        </section>`,

      story: () => (d.story || []).length ? html`
        <section class="sec story">
          <h2 data-rv="up">${t.storyTitle}</h2>
          <ol class="reel-v">
            ${d.story.map((s, i) => html`
              <li class="scene" data-rv="up">
                <div class="slate"><i class="clap" aria-hidden="true"></i>
                  <dl><div><dt>Cảnh</dt><dd>${i + 1}</dd></div><div><dt>Năm</dt><dd>${s.year}</dd></div><div><dt>Lần quay</dt><dd>1</dd></div></dl>
                </div>
                <h3>${s.title}</h3>
                ${s.text ? html`<p class="sub">${s.text}</p>` : ''}
                <span class="tc">${tc(i)}</span>
              </li>`)}
          </ol>
        </section>` : '',

      events: () => html`
        <section class="sec events">
          <h2 data-rv="up">${t.eventsTitle}</h2>
          <div class="tickets">
            ${(d.events || []).map((e, i) => html`
              <article class="ticket ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
                <div class="tk-body">
                  <p class="tk-brand">Rạp Hạnh Phúc · Vé mời</p>
                  <h3>${e.title}</h3>
                  <div class="tk-grid">
                    <div><small>Suất chiếu</small><b>${fmt.time(e.date)}</b></div>
                    <div><small>Ngày</small><b>${fmt.short(e.date)}</b></div>
                  </div>
                  ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                  ${e.venue ? html`<p class="v">${e.venue}</p>` : ''}
                  ${e.address ? html`<p class="a">${br(e.address)}</p>` : ''}
                </div>
                <div class="tk-stub"><small>Ghế</small><b>${e.main ? 'VIP' : 'A' + (i + 1)}</b><small>Hàng</small><b>${String.fromCharCode(65 + i)}</b></div>
              </article>`)}
          </div>
          <div data-rv="up">${W.calendar()}</div>
        </section>`,

      countdown: () => html`
        <section class="sec countdown">
          <h2 data-rv="up">${t.countdownTitle}</h2>
          <div class="cd-wrap" data-rv="zoom">${W.countdown({ done: 'Phim đã khởi chiếu, cảm ơn bạn đã tới xem ♥' })}</div>
          <a class="btn ghost" data-rv="up" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu lịch chiếu</a>
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sec album">
          <h2 data-rv="up">${t.albumTitle}</h2>
          <div class="strip" data-rv="left">
            <div class="track">${ctx.album.map((src, i) => html`
              <figure class="shot">
                <img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">
                <figcaption><span>${(d.images?.captions || [])[i] || ''}</span><i>${i + 1}A ▸</i></figcaption>
              </figure>`)}</div>
          </div>
          <p class="hint">Vuốt ngang để tua phim · chạm để xem ảnh lớn</p>
        </section>` : '',

      map: () => html`
        <section class="sec map-sec">
          <h2 data-rv="up">Đường tới rạp</h2>
          <div data-rv="up">${W.map({ btn: 'btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sec rsvp">
          <h2 data-rv="up">${t.rsvpTitle}</h2>
          <div class="seats" data-rv="up" aria-hidden="true">
            <i class="scr"></i>
            ${Array.from({ length: 4 }, (_, r) => html`<div>${Array.from({ length: 8 }, (_, c) => html`<i class="${r === 2 && (c === 3 || c === 4) ? 'mine' : ''}"></i>`)}</div>`)}
            <small>Ghế đôi hàng C đang chờ bạn</small>
          </div>
          <div class="booth" data-rv="up">
            <p class="lead">${t.rsvpLead}</p>
            ${W.rsvp({ btn: 'btn', yes: 'Giữ ghế nhé', no: 'Tiếc quá, bận rồi' })}
          </div>
        </section>`,

      guestbook: () => html`
        <section class="sec book">
          <h2 data-rv="up">${t.guestbookTitle}</h2>
          <p class="lead" data-rv="up">Lời chúc của bạn sẽ hiện lên màn ảnh như một dòng phụ đề.</p>
          <div data-rv="up">${W.guestbook({ btn: 'btn', placeholder: 'Viết phụ đề chúc mừng của bạn…' })}</div>
        </section>`,

      gift: () => html`
        <section class="sec gift">
          <h2 data-rv="up">${t.giftTitle}</h2>
          ${W.gift({ btn: 'btn ghost', hint: 'Chạm vào hộp bắp rang', box: html`<i class="pop">${[0, 1, 2, 3, 4, 5, 6].map(i => html`<i style="--k:${i}"></i>`)}</i><i class="bucket"><b>Mừng cưới</b></i>` })}
        </section>`,

      thanks: () => {
        const fam = (d.families || []).flatMap(f => [f.father && 'Ông ' + f.father, f.mother && 'Bà ' + f.mother]).filter(Boolean);
        const credits = [
          ['Nam chính', d.groom.full || d.groom.short], ['Nữ chính', d.bride.full || d.bride.short],
          ...(fam.length ? [['Nhà sản xuất', fam.join('\n')]] : []),
          ['Đạo diễn', 'Duyên Số'], ['Biên kịch', 'Thời Gian'], ['Âm nhạc', 'Tiếng cười của mọi người'],
          ...(d.city ? [['Bối cảnh', d.city]] : []),
          ['Khách mời đặc biệt', guest || 'Bạn'],
        ];
        return html`
        <section class="sec thanks" data-fireworks>
          <h2 data-rv="up">${t.thanksTitle}</h2>
          <figure class="last" data-rv="zoom"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"><i class="grain" aria-hidden="true"></i></figure>
          <div class="credits" data-rv="up"><div class="roll">
            ${credits.map(([k, v]) => html`<p><small>${k}</small><b>${br(v)}</b></p>`)}
            <p class="fin">${n.pair}<small>${fmt.short(d.date)}</small></p>
          </div></div>
          <p class="lead" data-rv="up">${t.thanks}</p>
        </section>`;
      },
    };

    const main = html`
      ${(d.sections || []).filter(s => ctx.has(s)).map(s => sections[s]?.() || '')}
      <footer>${n.pair} · ${fmt.dots(d.date)} · Hết</footer>`;
    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    pullLever(ctx, cover);
    clapOnScroll(main);
    shutterClicks(ctx, main);
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .35, 80), 250);
  },
};

/* Bìa: kéo cần → đèn chiếu bật, cuộn phim quay, màn ảnh đếm 3-2-1 → thiệp mở */
function pullLever(ctx, cover) {
  const b = $('.lever', cover);
  if (!b) return;
  let done = false;
  b.addEventListener('click', e => {
    if (done) return;
    done = true;
    e.stopImmediatePropagation();
    cover.classList.add('rolling');
    if (!reduced) sound('reel');
    setTimeout(() => ctx.open(false), reduced ? 0 : 2300);
  }, true);
}

/* Bảng clapper đập xuống khi cảnh phim cuộn tới */
function clapOnScroll(main) {
  const slates = $$('.slate', main);
  if (!slates.length) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('clapped'); io.unobserve(e.target);
  }), { threshold: .6 });
  slates.forEach(s => io.observe(s));
}

/* Chạm khung phim: tiếng tạch máy ảnh và chớp đèn flash (ảnh lớn vẫn do data-zoom mở) */
function shutterClicks(ctx, main) {
  $$('.shot', main).forEach(f => f.addEventListener('pointerdown', () => {
    sound('click');
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  }));
}
