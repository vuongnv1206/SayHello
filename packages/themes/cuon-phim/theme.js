// Mẫu "Cuộn Phim" bản 2: thiệp là một suất chiếu đặc biệt, mỗi phần là một cảnh toàn màn hình.
//   Phòng chiếu (bìa): kéo cần máy chiếu, đèn bật, cuộn phim quay, phim đầu đếm 3-2-1.
//   Mở màn: cảnh ghim, cuộn để kéo rèm nhung, ảnh cưới thu về khung, tên hiện từng chữ.
//   Diễn viên chính, Những cảnh phim (tua ngang, clapper đập), Vé mời (xé cuống vé hiện chỉ đường),
//   Giữ ghế (sơ đồ ghế + xác nhận, lời chúc chạy như phụ đề), Album 35mm, Quầy bắp nước, Danh đề.
// Mức chuyển động: standard/cinematic dùng GSAP ScrollTrigger (nạp sau khi mở bìa); lite chỉ CSS, không ghim.
// Ảnh dùng: images.hero, groom, bride, thanks, album[]
import { defineTheme, html, br, splitText, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const pad = n => String(n).padStart(2, '0');
const holes = html`<i class="holes" aria-hidden="true"></i>`;
const tc = i => `00:${pad(3 + i * 7)}:${pad((i * 23) % 60)}:${pad((i * 11) % 24)}`; // mã thời gian trang trí

/* ---------- Âm thanh tự tạo bằng Web Audio (không dùng file có bản quyền). Bị chặn thì im lặng. ---------- */
let audio;
function sound(kind) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, len = kind === 'reel' ? 1.8 : .09;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * len), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const t = i / a.sampleRate;
      // Máy chiếu: tiếng lạch cạch 24 nhịp/giây; máy ảnh: một tiếng tạch ngắn
      const env = kind === 'reel' ? (t % (1 / 24) < .006 ? 1 : .12) * Math.min(1, t * 6, (len - t) * 3) : Math.exp(-t * 70);
      ch[i] = (Math.random() * 2 - 1) * env;
    }
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.value = kind === 'reel' ? 1800 : 3200; g.gain.value = kind === 'reel' ? .18 : .5;
    src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
  } catch {}
}

// Nạp GSAP; lỗi (mất mạng, CDN chặn) thì cảnh chuyển về dạng tĩnh, không bao giờ để nội dung bị che
async function scroll(el, ctx) {
  try { return await ctx.lib('scroll'); }
  catch (e) { el.classList.add('is-static'); throw e; }
}
// Bỏ dấu cho nội dung chuyển khoản (ngân hàng không nhận dấu)
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

export default defineTheme({
  id: 'cuon-phim',
  name: 'Cuộn Phim',
  version: '2.0.0',
  tier: 'cinematic',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#15120f',
  fonts: 'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;800&family=Playfair+Display:ital,wght@0,500;1,400;1,700&family=Space+Mono:wght@400;700&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  libs: ['scroll'],
  gateMs: 700,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', story: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: {
    images: { hero: { required: true, aspect: '4:5', label: 'Ảnh trên màn ảnh mở màn' }, groom: { aspect: '3:4' }, bride: { aspect: '3:4' }, thanks: { aspect: '4:5' }, album: { min: 0, ideal: 6, max: 24 } },
    story: { optional: true, maxItems: 8 },
  },
  palettes: [
    { id: 'nhung-do', name: 'Nhung đỏ', swatch: ['#7d1a1d', '#e8a33d'] },
    { id: 'luc-bao', name: 'Lục bảo', swatch: ['#14574a', '#e8a33d'], vars: { '--velvet': '#14574a', '--velvet-hi': '#1f8070' } },
    { id: 'hai-quan', name: 'Xanh hải quân', swatch: ['#183a6b', '#e8a33d'], vars: { '--velvet': '#183a6b', '--velvet-hi': '#2a5ca3' } },
  ],
  defaults: {
    texts: {
      coverTitle: 'Suất chiếu đặc biệt',
      coverHint: 'Kéo cần máy chiếu để bắt đầu',
      heroKicker: 'Một bộ phim tình cảm của',
      heroLead: 'Phim dài cả một đời, tập đầu tiên khởi chiếu vào ngày cưới. Chúng mình giữ cho bạn một chỗ ngồi đẹp nhất.',
      coupleTitle: 'Diễn viên chính',
      storyTitle: 'Những cảnh phim đáng nhớ',
      eventsTitle: 'Vé mời',
      rsvpTitle: 'Giữ ghế cho bạn',
      rsvpLead: 'Báo giúp chúng mình để rạp chừa sẵn ghế có tên bạn.',
      albumTitle: 'Cuộn phim kỷ niệm',
      giftTitle: 'Quầy bắp nước',
      giftLead: 'Nếu muốn gửi quà mừng, chạm vào hộp bắp.',
      thanks: 'Cảm ơn bạn đã xem đến cuối. Phần tiếp theo, mời bạn tới xem tận mắt.',
    },
  },

  scenes: [
    /* ===== 1. Phòng chiếu (bìa) ===== */
    {
      id: 'phong-chieu', kind: 'gate',
      render: ({ names: n, texts: t, date, guest }) => html`
        <div class="theater" aria-hidden="true"><i class="dust"></i></div>
        <div class="screen">
          <div class="card-title">
            <p class="to">Kính mời ${guest()}</p>
            <p class="pre">${t.coverTitle}</p>
            <h1><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
            <p class="cover-date">Khởi chiếu ${fmt.dots(date)}</p>
          </div>
          <div class="leader" aria-hidden="true"><i class="sweep"></i><b>3</b><b>2</b><b>1</b></div>
        </div>
        <i class="beam" aria-hidden="true"></i>
        <div class="projector" aria-hidden="true"><i class="reel r1"></i><i class="reel r2"></i><i class="body"><i class="lens"></i></i></div>
        <button class="lever" type="button" aria-label="Kéo cần máy chiếu để mở thiệp"><i class="arm"><i class="knob"></i></i></button>
        <p class="cover-hint">${t.coverHint}</p>`,
      mount(el, ctx) {
        const lever = el.querySelector('.lever');
        let pulled = false, y0 = null;
        const pull = () => {
          if (pulled) return; pulled = true;
          el.style.setProperty('--pull', 1);
          el.classList.add('rolling');
          if (!ctx.reduced) sound('reel');
          setTimeout(() => ctx.open(), ctx.reduced ? 150 : 2300);
        };
        // Kéo cần bằng ngón tay (kéo xuống quá nửa là chạy); chạm hoặc Enter cũng chạy
        lever.addEventListener('pointerdown', e => { y0 = e.clientY; lever.setPointerCapture?.(e.pointerId); });
        lever.addEventListener('pointermove', e => { if (y0 == null || pulled) return; el.style.setProperty('--pull', Math.max(0, Math.min(1, (e.clientY - y0) / 90))); });
        lever.addEventListener('pointerup', () => { y0 = null; });
        lever.addEventListener('click', pull);
      },
    },

    /* ===== 2. Mở màn ===== */
    {
      id: 'mo-man', label: 'Mở màn', provides: ['when'],
      render: ({ names: n, texts: t, date, city, img }) => html`
        <div class="stage">
          <p class="marquee"><span>${t.coverTitle}</span></p>
          <div class="silver">
            <img src="${img('hero', 0)}" alt="${n.pair}" fetchpriority="high">
            <i class="grain" aria-hidden="true"></i>
            <i class="curtain l" aria-hidden="true"></i><i class="curtain r" aria-hidden="true"></i>
          </div>
          <p class="kicker">${t.heroKicker}</p>
          <h2 class="names">${splitText(n.first)}<em>&amp;</em>${splitText(n.second)}</h2>
          <p class="premiere">Khởi chiếu <b>${fmt.long(date)}</b> · ${fmt.time(date)}${city ? html` · ${city}` : ''}</p>
          <p class="lead">${t.heroLead}</p>
        </div>`,
      motion: {
        async standard(el, ctx) {
          const { gsap } = await scroll(el, ctx);
          gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=110%', scrub: .6, pin: true, anticipatePin: 1 } })
            .to(el.querySelector('.curtain.l'), { xPercent: -102, ease: 'power2.inOut' }, 0)
            .to(el.querySelector('.curtain.r'), { xPercent: 102, ease: 'power2.inOut' }, 0)
            .fromTo(el.querySelector('.silver img'), { scale: 1.22 }, { scale: 1, ease: 'none' }, 0)
            .from(el.querySelectorAll('.names .ch'), { yPercent: 120, opacity: 0, stagger: .025, ease: 'power3.out' }, .3)
            .from(el.querySelectorAll('.premiere, .lead, .kicker'), { opacity: 0, y: 18, stagger: .08 }, .55);
        },
        cinematic(el, ctx) { el.classList.add('flicker'); return this.standard(el, ctx); },
        lite: 'css',
      },
    },

    /* ===== 3. Diễn viên chính ===== */
    {
      id: 'dien-vien', label: 'Diễn viên chính',
      render: ({ data: d, texts: t, families, img }) => html`
        <h2 class="title">${t.coupleTitle}</h2>
        <div class="cast">
          ${[['groom', 3, 'Nam chính'], ['bride', 4, 'Nữ chính']].map(([who, i, role], k) => html`
            <figure class="still s${k}">
              <span class="frame">${holes}<img src="${img(who, i)}" alt="${d[who].short}" loading="lazy">${holes}</span>
              <figcaption><small>${role}</small><b>${d[who].full || d[who].short}</b>${d[who].bio ? html`<span>${d[who].bio}</span>` : ''}</figcaption>
            </figure>`)}
        </div>
        ${families.length ? html`
          <div class="producers"><h3>Nhà sản xuất</h3>
            ${families.map(f => html`<div><small>${f.side}</small>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<span>${br(f.address)}</span>` : ''}</div>`)}
          </div>` : ''}`,
      motion: {
        async standard(el, ctx) {
          const { gsap } = await scroll(el, ctx);
          el.querySelectorAll('.still').forEach((s, k) => gsap.from(s, { xPercent: k ? 60 : -60, rotate: k ? 6 : -6, opacity: 0, ease: 'power2.out', scrollTrigger: { trigger: s, start: 'top 92%', end: 'top 45%', scrub: .5 } }));
          gsap.from(el.querySelectorAll('.producers > div'), { y: 40, opacity: 0, stagger: .15, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el.querySelector('.producers'), start: 'top 80%' } });
        },
        lite: 'css',
      },
    },

    /* ===== 4. Những cảnh phim: tua ngang ===== */
    {
      id: 'canh-phim', label: 'Những cảnh phim', provides: ['story'], when: ctx => ctx.has('story'),
      render: ({ story, texts: t }) => html`
        <h2 class="title">${t.storyTitle}</h2>
        <div class="reel-h"><ol class="track">
          ${story.map((s, i) => html`
            <li class="scene-card">
              <div class="slate"><i class="clap" aria-hidden="true"></i>
                <dl><div><dt>Cảnh</dt><dd>${i + 1}</dd></div><div><dt>Năm</dt><dd>${s.year}</dd></div><div><dt>Lần quay</dt><dd>1</dd></div></dl>
              </div>
              <h3>${s.title}</h3>
              ${s.text ? html`<p>${s.text}</p>` : ''}
              <span class="tc">${tc(i)}</span>
            </li>`)}
        </ol></div>
        <p class="hint">Cuộn tiếp để tua phim</p>`,
      mount(el) {
        // Mức lite (và trước khi GSAP về): vuốt ngang tự nhiên, clapper đập khi khung vào giữa màn hình
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add('clapped'); }), { threshold: .6 });
        el.querySelectorAll('.scene-card').forEach(c => io.observe(c));
      },
      motion: {
        async standard(el, ctx) {
          const { gsap, ScrollTrigger } = await scroll(el, ctx);
          const track = el.querySelector('.track');
          el.classList.add('is-pinned');
          const dist = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth + 32);
          const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .5, invalidateOnRefresh: true } });
          el.querySelectorAll('.scene-card').forEach(c => ScrollTrigger.create({ trigger: c, containerAnimation: tween, start: 'left 70%', onEnter: () => { c.classList.add('clapped'); if (!ctx.reduced) sound('click'); } }));
        },
        lite: 'css',
      },
    },

    /* ===== 5. Vé mời: giờ, địa điểm, chỉ đường, đếm ngược ===== */
    {
      id: 've-moi', label: 'Vé mời', provides: ['when', 'where', 'map', 'countdown'],
      render: ctx => {
        const { events, places, texts: t } = ctx;
        const place = e => places.find(p => p.address && e.address && p.address === e.address) || places[0];
        return html`
        <h2 class="title">${t.eventsTitle}</h2>
        <div class="tickets">
          ${events.map((e, i) => html`
            <article class="ticket ${e.main ? 'main' : ''}" data-ev="${i}">
              <div class="tk-body">
                <p class="tk-brand">Rạp Hạnh Phúc · Vé mời</p>
                <h3>${e.title}</h3>
                <div class="tk-grid"><div><small>Suất chiếu</small><b>${fmt.time(e.date)}</b></div><div><small>Ngày</small><b>${fmt.short(e.date)}</b></div></div>
                ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                ${e.venue ? html`<p class="v">${e.venue}</p>` : ''}
                ${e.address ? html`<p class="a">${br(e.address)}</p>` : ''}
                <div class="tk-actions">
                  ${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                  ${e.gcal ? html`<a class="sh-btn ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu lịch</a>` : ''}
                </div>
              </div>
              <button class="tk-stub" type="button" aria-expanded="false" aria-label="Xé cuống vé ${e.title} để xem chỉ đường">
                <small>Ghế</small><b>${e.main ? 'VIP' : 'A' + (i + 1)}</b><small>Hàng</small><b>${String.fromCharCode(65 + i)}</b><i>Xé vé</i>
              </button>
            </article>`)}
        </div>
        <div class="leader-cd"><p>Phim khởi chiếu sau</p>${countdown(ctx, { done: 'Phim đã khởi chiếu, cảm ơn bạn đã tới xem ♥' })}</div>`;
      },
      mount(el, ctx) {
        el.querySelectorAll('.ticket').forEach(tk => tk.querySelector('.tk-stub').addEventListener('click', e => {
          tk.classList.add('torn'); e.currentTarget.setAttribute('aria-expanded', 'true');
          if (!ctx.reduced) sound('click');
          tk.querySelector('.tk-actions a')?.focus({ preventScroll: true });
        }));
      },
      motion: {
        async standard(el, ctx) {
          const { gsap } = await scroll(el, ctx);
          gsap.from(el.querySelectorAll('.ticket'), { y: 90, rotate: i => (i % 2 ? 4 : -4), opacity: 0, stagger: .18, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el.querySelector('.tickets'), start: 'top 85%' } });
        },
        lite: 'css',
      },
    },

    /* ===== 6. Giữ ghế: xác nhận + lời chúc thành phụ đề ===== */
    {
      id: 'giu-ghe', label: 'Giữ ghế', provides: ['rsvp', 'guestbook'],
      render: ctx => {
        const { texts: t, guest } = ctx;
        return html`
        <h2 class="title">${t.rsvpTitle}</h2>
        <div class="hall" aria-hidden="true">
          <i class="scr"></i>
          ${Array.from({ length: 5 }, (_, r) => html`<div class="row"><b>${String.fromCharCode(65 + r)}</b>${Array.from({ length: 8 }, (_, c) => html`<i class="seat ${r === 2 && (c === 3 || c === 4) ? 'mine' : ''}"></i>`)}</div>`)}
          <small>Ghế đôi hàng C đang chờ ${guest()}</small>
        </div>
        <div class="booth">
          <p class="lead">${t.rsvpLead}</p>
          ${rsvpForm(ctx, { yes: 'Giữ ghế nhé', no: 'Tiếc quá, bận rồi', submit: 'Gửi vé xác nhận' })}
        </div>
        <div class="subs">
          <h3>Phụ đề từ khán giả</h3>
          <div class="subtitle-screen"><p class="subtitle" aria-live="off"></p></div>
          ${wishForm(ctx, { submit: 'Chiếu lời chúc', placeholder: 'Viết một dòng phụ đề chúc mừng…' })}
          <details class="all-wishes"><summary>Xem tất cả lời chúc</summary>${wishList(ctx)}</details>
        </div>`;
      },
      mount(el, ctx) {
        // Lời chúc chạy như phụ đề trên màn ảnh nhỏ
        const sub = el.querySelector('.subtitle');
        let i = 0, timer;
        const show = () => {
          const list = ctx.wishes.filter(w => w.message);
          if (!list.length) { sub.textContent = '— Chưa có phụ đề, bạn viết dòng đầu tiên nhé —'; return; }
          const w = list[i++ % list.length];
          sub.classList.remove('in'); void sub.offsetWidth;
          sub.textContent = `${w.message} — ${w.name}`; sub.classList.add('in');
        };
        ctx.on('wishes', () => { i = 0; show(); clearInterval(timer); timer = setInterval(show, ctx.reduced ? 8000 : 4200); });
        show();
        ctx.on('rsvp', x => { if (x.attend === 'Có') el.querySelector('.hall').classList.add('booked'); });
      },
    },

    /* ===== 7. Album: dải phim 35mm vuốt ngang ===== */
    {
      id: 'album', label: 'Album ảnh', provides: ['album'], when: ctx => ctx.has('album'),
      render: ({ album, captions, texts: t }) => html`
        <h2 class="title">${t.albumTitle}</h2>
        <div class="strip" tabindex="0" aria-label="Dải ảnh, vuốt ngang để xem">
          <div class="strip-track">${album.map((src, i) => html`
            <figure class="shot"><button type="button" class="shot-btn" aria-label="Xem ảnh ${i + 1} lớn hơn"><img src="${src}" alt="${captions[i] || 'Ảnh cưới ' + (i + 1)}" loading="lazy"></button>
              <figcaption><span>${captions[i] || ''}</span><i>${i + 1}A ▸</i></figcaption></figure>`)}</div>
        </div>
        <p class="hint">Vuốt ngang để tua · chạm để xem ảnh lớn</p>
        <dialog class="lightbox"><img alt=""><button type="button" class="sh-x" aria-label="Đóng">×</button></dialog>`,
      mount(el, ctx) {
        const box = el.querySelector('.lightbox'), big = box.querySelector('img');
        el.querySelectorAll('.shot-btn').forEach(b => b.addEventListener('click', () => {
          const shot = b.closest('.shot');
          if (!ctx.reduced) { sound('click'); shot.classList.remove('flash'); void shot.offsetWidth; shot.classList.add('flash'); }
          const img = b.querySelector('img'); big.src = img.src; big.alt = img.alt;
          box.showModal?.();
        }));
        box.addEventListener('click', e => { if (e.target === box || e.target.closest('.sh-x')) box.close(); });
      },
    },

    /* ===== 8. Quầy bắp nước: mừng cưới ===== */
    {
      id: 'quay-bap', label: 'Mừng cưới', provides: ['gift'], when: ctx => ctx.has('gift'),
      render: ({ accounts, texts: t }) => html`
        <h2 class="title">${t.giftTitle}</h2>
        <p class="lead">${t.giftLead}</p>
        <button class="bucket" type="button" aria-expanded="false" aria-controls="quay-bap-acc">
          <i class="pop" aria-hidden="true">${[0, 1, 2, 3, 4, 5, 6].map(i => html`<i style="--k:${i}"></i>`)}</i>
          <i class="tub" aria-hidden="true"><b>Mừng cưới</b></i>
          <span class="sh-sr">Hiện thông tin mừng cưới</span>
        </button>
        <div class="accounts" id="quay-bap-acc" hidden>
          ${accounts.map(a => html`
            <article class="acc">
              <small>${a.who}</small>
              ${qrUrl(a, 'Mung cuoi') ? html`<img class="qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="220" height="220">` : ''}
              <p><b>${a.bank}</b></p>
              <p class="num"><span>${a.number}</span><button type="button" class="copy" data-copy="${a.number}">Chép số</button></p>
              <p>${a.name}</p>
            </article>`)}
        </div>`,
      mount(el, ctx) {
        const btn = el.querySelector('.bucket'), acc = el.querySelector('.accounts');
        btn.addEventListener('click', () => {
          const open = acc.hidden; acc.hidden = !open; btn.setAttribute('aria-expanded', String(open)); el.classList.toggle('popped', open);
        });
        // Nội dung chuyển khoản kèm tên khách (không dấu) để cặp đôi đối chiếu sao kê
        if (ctx.guest) el.querySelectorAll('img.qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('.copy').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
      },
    },

    /* ===== 9. Danh đề cuối phim ===== */
    {
      id: 'danh-de', kind: 'finale', label: 'Danh đề',
      render: ({ data: d, names: n, families, city, date, texts: t, img, guest }) => {
        const fam = families.flatMap(f => [f.father && 'Ông ' + f.father, f.mother && 'Bà ' + f.mother]).filter(Boolean);
        const credits = [['Nam chính', d.groom.full || d.groom.short], ['Nữ chính', d.bride.full || d.bride.short], ...(fam.length ? [['Nhà sản xuất', fam.join('\n')]] : []), ['Đạo diễn', 'Duyên Số'], ['Biên kịch', 'Thời Gian'], ['Âm nhạc', 'Tiếng cười của mọi người'], ...(city ? [['Bối cảnh', city]] : [])];
        return html`
        <div class="end">
          <figure class="last"><img src="${img('thanks', 5)}" alt="${n.pair}" loading="lazy"><i class="grain" aria-hidden="true"></i></figure>
          <div class="credits"><div class="roll">
            ${credits.map(([k, v]) => html`<p><small>${k}</small><b>${br(v)}</b></p>`)}
            <p class="guest-credit"><small>Khách mời đặc biệt</small><b>${guest('Bạn')}</b></p>
            <p class="fin">${n.pair}<small>${fmt.short(date)}</small></p>
          </div></div>
          <p class="lead">${t.thanks}</p>
          <p class="the-end">Hết</p>
        </div>`;
      },
      motion: {
        async standard(el, ctx) {
          const { gsap } = await scroll(el, ctx);
          const roll = el.querySelector('.roll'), box = el.querySelector('.credits');
          el.classList.add('is-pinned');
          gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: '+=160%', scrub: .6, pin: true, anticipatePin: 1 } })
            .fromTo(roll, { y: () => box.clientHeight }, { y: () => -roll.scrollHeight, ease: 'none' })
            .from(el.querySelector('.the-end'), { opacity: 0, scale: .9 }, '>-0.15');
        },
        lite: 'css',
      },
    },
  ],
});
