// Mẫu "Vé Máy Bay": thiệp là tấm thẻ lên máy bay. Khách xé cuống vé để "lên máy bay",
// máy bay bay dọc thiệp theo đường cuộn, bảng giờ bay lật chữ, hộ chiếu đóng dấu, ảnh qua ô cửa sổ,
// check-in để xác nhận, hành lý ký gửi chứa phong bì mừng.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts, reduced, $, $$ } from '../../core/util.js';

// "Minh Khang" -> "MKH": mã sân bay từ tên
const code = s => {
  const w = (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D').toUpperCase().split(/\s+/).filter(Boolean);
  let c = w.map(x => x[0]).join('');
  if (c.length < 3) c += (w[w.length - 1] || 'XXX').slice(1, 1 + 3 - c.length);
  return c.slice(0, 3).padEnd(3, 'X');
};
const PLANE = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M60 30.6c0-2.2-1.8-3.6-4-3.6H40.5L26 6h-6l7.6 21H13.4L8 20H3l3.5 12L3 44h5l5.4-7h14.2L20 58h6l14.5-21H56c2.2 0 4-1.4 4-3.6z" fill="currentColor"/></svg>';

export default {
  id: 've-may-bay',
  name: 'Vé Máy Bay',
  fonts: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400;1,9..144,600&family=JetBrains+Mono:wght@400;600&display=swap',
  coverMs: 2600,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['sparkles'], density: .6,
      colors: { sparkles: ['#ffffff', '#ffe8cc'], confetti: ['#e76f51', '#f4a261', '#14213d', '#8ecae6', '#ffffff'], fireworks: ['#f4a261', '#e76f51', '#8ecae6', '#ffffff'] },
    },
    sections: ['hero', 'story', 'board', 'passport', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      airline: 'SayHello Airlines',
      heroKicker: 'Chuyến bay mang tên',
      heroTitle: 'Hạnh Phúc',
      heroLead: 'Hai hành khách đã quyết định đi chung một chuyến, trọn đời. Mời bạn lên máy bay cùng chúng mình.',
      storyTitle: 'Hành trình đã qua',
      boardTitle: 'Giờ khởi hành',
      passportTitle: 'Hai hành khách',
      albumTitle: 'Qua ô cửa sổ',
      rsvpTitle: 'Làm thủ tục check-in',
      rsvpLead: 'Check-in giúp chúng mình giữ chỗ cho bạn nhé.',
      guestbookTitle: 'Bưu thiếp gửi phi hành đoàn',
      giftTitle: 'Hành lý ký gửi',
      thanks: 'Cảm ơn bạn đã bay cùng chúng mình. Chúc bạn một ngày hạ cánh thật vui.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'Khách quý';
    const [A, B] = [code(n.first), code(n.second)];
    const p = parts(d.date);
    const flight = `SH${p.dd}${p.mm}`;

    const cover = html`
      <div class="sky"><i class="cl c1"></i><i class="cl c2"></i><i class="cl c3"></i></div>
      <div class="pass" role="group" aria-label="Thẻ lên máy bay">
        <div class="pass-main">
          <div class="pass-head"><span>${t.airline}</span><span>Boarding pass</span></div>
          <div class="route">
            <div><b>${A}</b><small>${n.first}</small></div>
            <span class="plane-ico">${raw(PLANE)}</span>
            <div><b>${B}</b><small>${n.second}</small></div>
          </div>
          <dl class="grid">
            <div class="wide"><dt>Hành khách</dt><dd>${guest}</dd></div>
            <div><dt>Chuyến bay</dt><dd>${flight}</dd></div>
            <div><dt>Ngày</dt><dd>${p.dd}.${p.mm}.${p.y}</dd></div>
            <div><dt>Lên máy bay</dt><dd>${fmt.time(d.date)}</dd></div>
            <div><dt>Cửa</dt><dd>Hạnh Phúc</dd></div>
            <div><dt>Ghế</dt><dd>Gần trái tim</dd></div>
            <div><dt>Hạng</dt><dd>Thượng khách</dd></div>
          </dl>
          <div class="barcode" aria-hidden="true"></div>
        </div>
        <button class="stub" data-open aria-label="Xé cuống vé để mở thiệp">
          <span class="stub-in"><small>${flight}</small><b>${A}→${B}</b><em>Xé để lên máy bay</em><i class="arrow">⟶</i></span>
        </button>
      </div>
      <p class="tear-hint">Kéo hoặc chạm vào cuống vé</p>
      <div class="takeoff" aria-hidden="true">${raw(PLANE)}</div>`;

    const sections = {
      hero: () => html`
        <header class="hero">
          <div class="sky"><i class="cl c1" data-parallax="0.25"></i><i class="cl c2" data-parallax="0.4"></i><i class="cl c3" data-parallax="0.15"></i></div>
          <p class="kicker" data-rv="up">${t.heroKicker}</p>
          <h1 class="big" data-rv="zoom">${t.heroTitle}</h1>
          <div class="route big-route" data-rv="up">
            <div><b data-flap>${A}</b><small>${n.first}</small></div>
            <span class="dash"><i>${raw(PLANE)}</i></span>
            <div><b data-flap>${B}</b><small>${n.second}</small></div>
          </div>
          <p class="when" data-rv="up">${fmt.long(d.date)} · ${fmt.time(d.date)}</p>
          <p class="lead" data-rv="up">${t.heroLead}</p>
          <figure class="porthole hero-win" data-rv="zoom"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}"></figure>
        </header>`,

      story: () => (d.story || []).length ? html`
        <section class="sec story">
          <h2 data-rv="up">${t.storyTitle}</h2>
          <ol class="legs">
            ${d.story.map((s, i) => html`
              <li data-rv="${i % 2 ? 'right' : 'left'}"><span class="yr">${s.year}</span><div><h3>${s.title}</h3>${s.text ? html`<p>${s.text}</p>` : ''}</div></li>`)}
          </ol>
        </section>` : '',

      board: () => html`
        <section class="sec board-sec">
          <h2 data-rv="up">${t.boardTitle}</h2>
          <div class="board" data-rv="up">
            <div class="board-row head"><span>Giờ</span><span>Chuyến</span><span>Nơi đến</span><span>Trạng thái</span></div>
            ${(d.events || []).map(e => { const q = parts(e.date); return html`
              <div class="board-row ${e.main ? 'main' : ''}">
                <span data-flap>${fmt.time(e.date)}</span>
                <span><b data-flap>${e.title}</b><small>${q.dd}/${q.mm} · ${e.venue || ''}</small></span>
                <span class="dest">${e.address}</span>
                <span class="st" data-flap>${e.main ? 'CHÍNH' : 'ĐÚNG GIỜ'}</span>
              </div>`; })}
          </div>
          <div class="cd-board" data-rv="zoom"><p>Cất cánh sau</p>${W.countdown({ labels: ['Ngày', 'Giờ', 'Phút', 'Giây'], done: 'Đã cất cánh ✈' })}</div>
          <a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener" data-rv="up">Lưu giờ bay vào lịch</a>
        </section>`,

      passport: () => html`
        <section class="sec passport-sec">
          <h2 data-rv="up">${t.passportTitle}</h2>
          ${[['groom', 3, 'Chú rể'], ['bride', 4, 'Cô dâu']].map(([who, i, role], k) => { const person = d[who]; return html`
            <article class="passport" data-rv="${k ? 'right' : 'left'}">
              <img data-zoom src="${ctx.img(who, i)}" alt="${person.short}" loading="lazy">
              <dl>
                <dt>Họ tên</dt><dd>${person.full || person.short}</dd>
                <dt>Vai trò</dt><dd>${role}</dd>
                ${person.bio ? html`<dt>Ghi chú</dt><dd class="bio">${person.bio}</dd>` : ''}
              </dl>
              <span class="visa v${k}" aria-hidden="true">${k ? 'ĐÃ ĐỒNG Ý' : 'ĐÃ CẦU HÔN'}<small>${fmt.short(d.date)}</small></span>
              <p class="mrz" aria-hidden="true">P&lt;VNM${code(person.short)}&lt;&lt;${(person.full || person.short).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D').toUpperCase().replace(/\s+/g, '<')}&lt;&lt;&lt;&lt;</p>
            </article>`; })}
          ${(d.families || []).length ? html`<div class="families" data-rv="up">${d.families.map(f => html`
            <div><h3>${f.side}</h3>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}<small>${br(f.address)}</small></div>`)}</div>` : ''}
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sec album">
          <h2 data-rv="up">${t.albumTitle}</h2>
          <div class="windows" data-rv="up">${ctx.album.map((src, i) => html`<figure class="porthole"><img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy"></figure>`)}</div>
          <p class="hint">Vuốt ngang để nhìn qua từng ô cửa · chạm để phóng to</p>
        </section>` : '',

      map: () => html`
        <section class="sec map-sec">
          <h2 data-rv="up">Điểm đến</h2>
          <div data-rv="up">${W.map({ btn: 'btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sec checkin">
          <div class="counter" data-rv="up">
            <h2>${t.rsvpTitle}</h2>
            <p class="lead">${t.rsvpLead}</p>
            ${W.rsvp({ btn: 'btn', yes: '✈ Tôi sẽ bay', no: 'Lần sau nhé', submit: 'Check-in' })}
          </div>
        </section>`,

      guestbook: () => html`
        <section class="sec book">
          <h2 data-rv="up">${t.guestbookTitle}</h2>
          <div data-rv="up">${W.guestbook({ btn: 'btn', placeholder: 'Viết vài dòng lên tấm bưu thiếp…' })}</div>
        </section>`,

      gift: () => html`
        <section class="sec gift">
          <h2 data-rv="up">${t.giftTitle}</h2>
          ${W.gift({ btn: 'btn ghost', hint: 'Chạm để mở vali', box: html`<i class="handle"></i><i class="case"></i><i class="lid"></i><i class="tag">${A}→${B}</i>` })}
        </section>`,

      thanks: () => html`
        <section class="sec landing" data-fireworks>
          <div class="sky"><i class="cl c1"></i><i class="cl c2"></i></div>
          <figure class="porthole big-win" data-rv="zoom"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></figure>
          <p class="arrive" data-rv="up">Đã hạ cánh an toàn</p>
          <p class="lead" data-rv="up">${t.thanks}</p>
          <p class="sign" data-rv="up">${n.pair}</p>
        </section>`,
    };

    const main = html`
      <svg class="flightpath" aria-hidden="true"><path class="fp-bg"/><path class="fp-done"/></svg>
      <span class="fp-plane" aria-hidden="true">${raw(PLANE)}</span>
      ${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}
      <footer>${t.airline} · Chuyến ${flight} · ${A} ✈ ${B}</footer>`;

    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    tearStub(cover);
    flightPath(main);
    flaps(main);
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .55, 110), 500);
  },
};

/* Kéo cuống vé: quá ngưỡng thì xé (bấm nút mở) */
function tearStub(cover) {
  const stub = $('.stub', cover);
  if (!stub) return;
  let sx = 0, sy = 0, drag = false, moved = false;
  stub.addEventListener('pointerdown', e => { drag = true; moved = false; sx = e.clientX; sy = e.clientY; stub.setPointerCapture(e.pointerId); stub.classList.add('drag'); });
  stub.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = Math.max(0, e.clientX - sx), dy = Math.max(0, e.clientY - sy), dist = Math.hypot(dx, dy);
    if (dist > 6) moved = true;
    stub.style.transform = `translate(${dx * .6}px, ${dy * .6}px) rotate(${Math.min(dist / 6, 22)}deg)`;
    if (dist > 90) { drag = false; stub.style.transform = ''; stub.classList.remove('drag'); stub.click(); }
  });
  const end = e => {
    if (!drag) return; drag = false; stub.classList.remove('drag'); stub.style.transform = '';
    if (moved) e.preventDefault();
  };
  stub.addEventListener('pointerup', end); stub.addEventListener('pointercancel', end);
  // Chặn click sinh ra sau khi kéo dở (chưa đủ ngưỡng)
  stub.addEventListener('click', e => { if (moved && !cover.classList.contains('open')) { moved = false; e.stopImmediatePropagation(); } }, true);
}

/* Đường bay dọc thiệp: máy bay đi theo vị trí cuộn */
function flightPath(main) {
  const svg = $('.flightpath', main), plane = $('.fp-plane', main);
  if (!svg || reduced) { svg?.remove(); plane?.remove(); return; }
  const bg = $('.fp-bg', svg), done = $('.fp-done', svg);
  let len = 0;
  const build = () => {
    const w = main.clientWidth, h = main.scrollHeight, top = innerHeight * .9;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.style.height = h + 'px';
    // đường lượn sóng sát hai mép
    let dpath = `M ${w - 26} ${top}`, y = top, side = 1;
    while (y < h - 200) { const ny = Math.min(y + 900, h - 200); dpath += ` C ${side ? w - 26 : 26} ${y + 450}, ${side ? 26 : w - 26} ${ny - 450}, ${side ? 26 : w - 26} ${ny}`; y = ny; side = 1 - side; }
    bg.setAttribute('d', dpath); done.setAttribute('d', dpath);
    len = bg.getTotalLength();
    done.style.strokeDasharray = `${len} ${len}`;
    update();
  };
  const update = () => {
    if (!len) return;
    const mr = main.getBoundingClientRect(), prog = Math.min(1, Math.max(0, (innerHeight * .55 - mr.top - innerHeight * .9) / (main.scrollHeight - innerHeight * 1.1)));
    const at = len * prog, pt = bg.getPointAtLength(at), nx = bg.getPointAtLength(Math.min(len, at + 2));
    done.style.strokeDashoffset = len - at;
    const ang = Math.atan2(nx.y - pt.y, nx.x - pt.x) * 180 / Math.PI;
    plane.style.transform = `translate(${pt.x - 14}px, ${pt.y - 14}px) rotate(${ang}deg)`;
    plane.style.opacity = prog > 0 && prog < 1 ? 1 : .0;
  };
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { update(); tick = false; }); } }, { passive: true });
  addEventListener('resize', build);
  // ảnh tải xong làm trang dài ra: dựng lại đường bay
  new ResizeObserver(() => build()).observe(main);
  build();
}

/* Chữ lật như bảng giờ bay ở sân bay */
function flaps(root) {
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    const el = e.target, final = el.textContent;
    if (reduced) return;
    let f = 0; const steps = 14;
    const t = setInterval(() => {
      f++;
      el.textContent = [...final].map((c, i) => c === ' ' || f > steps * (i + 1) / final.length + 4 ? c : CH[Math.random() * CH.length | 0]).join('');
      if (f > steps + 6) { clearInterval(t); el.textContent = final; }
    }, 55);
  }), { threshold: .6 });
  $$('[data-flap]', root).forEach(el => io.observe(el));
}
