// Mẫu "Tờ Lịch": thiệp là một xấp lịch bloc treo tường. Cuộn trang bình thường, mỗi lần cuộn qua một màn
// thì một tờ bị xé đi (động từ chuyển động: "xé"). Độ dày xấp lịch ở đáy thay cho đồng hồ đếm ngược.
//   Tờ đầu: ngày cưới (số đỏ thật lớn, thứ, âm lịch), tên hai người, nơi tổ chức. Tờ hai: giờ và địa điểm.
//   Các tờ sau: mỗi tờ một ảnh gần kín bề ngang, kèm một dòng "lời hay" như lịch bloc. Tờ cuối: "Hết lịch, tới ngày cưới".
//   Sau xấp lịch là tấm bìa carton: phiếu giữ chỗ, mừng cưới, lời chúc. Nút "Giữ chỗ" cố định một chạm.
// Mức lite / không JS: các tờ xếp dọc như trang thường, không xé.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';
import { clipTop, stub, fibreTile, paperSound } from './paper.js';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const MONTH = ['Giêng', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Chạp'];
const hm = iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; };
const lunarOf = ctx => ctx.events.find(e => /^nhằm|âm lịch/i.test(e.lunar || ''))?.lunar || '';
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Đầu tờ lịch: tháng dương bên trái, năm bên phải; ngày Chủ nhật in đỏ, Thứ bảy in xanh như lịch thật
const head = (p, extra = '') => html`<header class="tl-top"><span>Tháng ${p ? p.mo : ''}</span><span>${extra}</span><span>${p ? p.y : ''}</span></header>`;
const tone = p => (p?.wd === 0 ? 'is-sun' : p?.wd === 6 ? 'is-sat' : '');

export default defineTheme({
  id: 'to-lich',
  name: 'Tờ Lịch',
  version: '1.0.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#f7f6f2',
  fonts: 'https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;700;800&family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: {
    images: { album: { min: 3, ideal: 8, max: 20, label: 'Mỗi ảnh là một tờ lịch' } },
  },
  palettes: [
    { id: 'do-bloc', name: 'Đỏ lịch bloc', swatch: ['#f7f6f2', '#c9231b'] },
    { id: 'xanh-mua', name: 'Xanh mực tím', swatch: ['#f4f5f7', '#3a3f9a'], vars: { '--tl-red': '#3a3f9a', '--tl-blue': '#c9231b', '--tl-wall': '#d9dbe2' } },
    { id: 'tet', name: 'Giấy hồng điều', swatch: ['#fbf1ee', '#b8141b'], vars: { '--tl-paper': '#fbf1ee', '--tl-wall': '#5a1d1a', '--tl-red': '#b8141b' } },
  ],
  defaults: {
    texts: {
      tearHint: 'Cuộn xuống để xé tờ',
      lastSheet: 'Hết lịch rồi. Tới ngày cưới thôi.',
      rsvpTitle: 'Giữ chỗ cho bạn',
      rsvpLead: 'Báo giúp chúng mình trước ngày cưới nhé.',
      giftTitle: 'Mừng cưới',
      wishesTitle: 'Ghi lên lịch một lời chúc',
    },
  },

  scenes: [
    /* ===== Xấp lịch: tờ ngày cưới, tờ giờ giấc, các tờ ảnh, tờ cuối ===== */
    {
      id: 'xap', label: 'Xấp lịch', provides: ['when', 'where', 'map', 'album', 'countdown'],
      render: ctx => {
        const { names: n, date, city, events, places, album, captions, texts: t, guest } = ctx;
        const p = parts(date);
        const lunar = lunarOf(ctx);
        const place = e => places.find(x => x.address && e.address && x.address === e.address) || (events.length === 1 ? places[0] : null);
        const total = album.length + 3;
        return html`
        <div class="tl-hold">
          <div class="tl-bind" aria-hidden="true"><i class="tl-staple"></i><i class="tl-staple"></i><div class="tl-stubs"></div></div>
          <div class="tl-stack">
            <article class="tl-sheet tl-day ${tone(p)}" data-k="0">
              ${head(p, html`Gửi ${guest()}`)}
              <p class="tl-month">Tháng ${p ? MONTH[p.mo - 1] : ''}</p>
              <p class="tl-num">${p ? p.d : ''}</p>
              <p class="tl-wd">${p ? WD[p.wd] : ''}</p>
              ${lunar ? html`<p class="tl-lunar">${lunar}</p>` : ''}
              <ul class="tl-day-evs">${events.map((e, i) => html`<li data-ev="${i}"><b>${hm(e.date)}</b><span>${e.title}${e.venue ? html`<br><small>${e.venue}</small>` : ''}</span></li>`)}</ul>
              <h1 class="tl-names"><span class="tl-n">${n.first}</span><span class="tl-and">và</span><span class="tl-n">${n.second}</span></h1>
              <p class="tl-where">Báo hỷ${city ? html` tại ${city}` : ''}</p>
              <p class="tl-left" data-days="${date}"></p>
            </article>

            <article class="tl-sheet tl-plan" data-k="1">
              ${head(p, 'Giờ giấc')}
              <ol class="tl-events">
                ${events.map((e, i) => html`
                  <li data-ev="${i}">
                    <p class="tl-hm">${hm(e.date)}</p>
                    <div>
                      <h2>${e.title}</h2>
                      ${e.venue ? html`<p class="tl-venue">${e.venue}</p>` : ''}
                      ${e.address ? html`<p class="tl-addr">${br(e.address)}</p>` : ''}
                      <p class="tl-acts">
                        ${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                        ${e.gcal ? html`<a class="sh-btn tl-ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
                      </p>
                    </div>
                  </li>`)}
              </ol>
            </article>

            ${album.map((src, i) => html`
              <article class="tl-sheet tl-photo" data-k="${i + 2}">
                ${head(p, `còn ${total - (i + 2) - 1} tờ`)}
                <figure><img src="${src}" alt="${captions[i] || 'Ảnh cưới ' + (i + 1)}" loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async"></figure>
                ${captions[i] ? html`<p class="tl-saying">${captions[i]}</p>` : ''}
              </article>`)}

            <article class="tl-sheet tl-last ${tone(p)}" data-k="${total - 1}">
              ${head(p)}
              <p class="tl-num">${p ? p.d : ''}</p>
              <p class="tl-endline">${t.lastSheet}</p>
              <p class="tl-names-sm">${n.first} và ${n.second}</p>
            </article>
          </div>
          <div class="tl-edge" aria-hidden="true"><i></i></div>
          <p class="tl-hint" aria-hidden="true">${t.tearHint}</p>
        </div>`;
      },
      mount(el, ctx) {
        const root = document.documentElement;
        // Đếm ngày trên tờ đầu
        const d = el.querySelector('[data-days]'), tt = Date.parse(d?.dataset.days || '');
        if (d && tt) {
          const days = Math.ceil((tt - Date.now()) / 864e5);
          d.textContent = days > 1 ? `Còn ${days} ngày` : days === 1 ? 'Ngày mai là ngày cưới' : days === 0 ? 'Hôm nay là ngày cưới' : '';
        }
        if (ctx.reduced) return; // lite: các tờ xếp dọc, không xé

        // Giấy thật: thớ giấy vẽ một lần, phủ lên mọi tờ
        const fibre = fibreTile().then(u => { if (u) root.style.setProperty('--tl-fibre', `url(${u})`); return u; });
        // Lớp xé WebGL (nạp sau, chỉ khi máy đủ sức): hook trả true nghĩa là tờ đó đang được vẽ cong bằng WebGL
        let hook = null;

        // Xé lịch theo cuộn: xấp lịch đứng yên (sticky). Mỗi màn cuộn là một tờ:
        //   pha A (t 0–0,72): tờ rách dần theo hàng lỗ, góc phải nhấc lên, nếp gập tối dần;
        //   pha B (t 0,72–1): tờ rời gáy, bay lên trái, xoay, lật nghiêng; dưới gáy còn lại một cuống giấy.
        const sheets = [...el.querySelectorAll('.tl-sheet')];
        const n = sheets.length;
        const stubs = el.querySelector('.tl-stubs');
        const sound = paperSound();
        for (const ev of ['pointerdown', 'touchend', 'keydown']) addEventListener(ev, sound.init, { once: true, passive: true });
        root.classList.add('tl-tear');
        el.style.setProperty('--n', n);
        sheets.forEach((s, k) => { s.style.zIndex = String(n - k); });
        const E = x => 1 - Math.pow(1 - x, 3);
        let top = 0, raf = 0, lastQ = 0, lastT = performance.now(), W = 0;
        const measure = () => { top = el.getBoundingClientRect().top + scrollY; W = sheets[0].offsetWidth; sheets.forEach((s, k) => { s.dataset.clip = clipTop(W, 101 + k * 17); }); };
        const update = () => {
          raf = 0;
          const now = performance.now();
          const q = Math.max(0, (scrollY - top) / innerHeight);
          let tearing = 0;
          sheets.forEach((s, k) => {
            if (k === n - 1) return;
            const t = Math.min(1, Math.max(0, q - k));
            const was = +(s.dataset.t || 0);
            if (hook && hook(s, k, t)) {
              // WebGL đang vẽ tờ này: ẩn bản HTML, bỏ biến đổi CSS
              s.style.visibility = 'hidden'; s.style.transform = ''; s.style.clipPath = '';
              if (t < .72) tearing = Math.max(tearing, Math.abs(t - was));
              else if (was < .72) sound.release();
              s.dataset.t = String(t);
            } else if (t <= 0) {
              if (was !== 0) { s.style.transform = ''; s.style.visibility = ''; s.style.clipPath = ''; s.style.setProperty('--fold', 0); s.dataset.t = '0'; }
            } else if (t < .72) {
              const e = E(t / .72);
              s.style.visibility = '';
              s.style.clipPath = s.dataset.clip;
              s.style.transform = `perspective(1400px) translate3d(0, ${-e * 10}px, ${e * 40}px) rotateZ(${-e * 5}deg) rotateY(${-e * 16}deg) rotateX(${e * 10}deg)`;
              s.style.setProperty('--fold', e.toFixed(3));
              s.dataset.t = String(t);
              tearing = Math.max(tearing, Math.abs(t - was));
            } else {
              const u = (t - .72) / .28, eu = 1 - Math.pow(1 - u, 2);
              s.style.visibility = t >= 1 ? 'hidden' : '';
              s.style.clipPath = s.dataset.clip;
              s.style.transform = `perspective(1400px) translate3d(${-(25 * u + 8 * Math.sin(1.5 * Math.PI * u))}vw, ${-10 - eu * 118}%, ${40 + u * 60}px) rotateZ(${-5 - 14 * u + 6 * Math.sin(2.6 * Math.PI * u)}deg) rotateY(${-16 + 10 * u}deg) rotateX(${10 + 22 * u}deg)`;
              s.style.setProperty('--fold', (1 - u * .4).toFixed(3));
              if (was < .72) sound.release();
              s.dataset.t = String(t);
            }
            // cuống giấy dưới gáy: có từ lúc tờ rời gáy, mất khi cuộn ngược lại
            const has = stubs.querySelector(`[data-k="${k}"]`);
            if (t >= .72 && !has) stubs.append(stub(W, 101 + k * 17, k));
            else if (t < .72 && has) has.remove();
          });
          // tiếng rít theo tốc độ rách (px/giây theo bề ngang tờ)
          const dt = Math.max(1, now - lastT);
          sound.scrub(tearing ? tearing * W / (dt / 1000) : 0);
          clearTimeout(update.quiet); update.quiet = setTimeout(() => sound.scrub(0), 90);
          lastQ = q; lastT = now;
          const left = Math.max(0, n - 1 - Math.floor(q + .5));
          el.style.setProperty('--left', left);
          el.classList.toggle('is-past', q > .15);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        measure(); update();
        // điểm dừng mỗi màn: thả tay thì tờ đứng yên ở trạng thái nguyên hoặc đã xé, chữ luôn sắc nét
        const snaps = document.createElement('div'); snaps.className = 'tl-snaps'; snaps.setAttribute('aria-hidden', 'true');
        snaps.innerHTML = Array.from({ length: n }, (_, k) => `<i style="top:${k * 100}svh"></i>`).join('');
        el.append(snaps);
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', () => { measure(); onScroll(); });
        // Nạp lớp xé WebGL lúc rảnh; lỗi (máy không có WebGL, GPU phần mềm, mất mạng) thì giữ cách xé bằng CSS
        if (ctx.motion !== 'lite') {
          const go = async () => {
            try {
              const url = new URL('./tear3d.js', import.meta.url).href;
              const { runTear } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
              const tear = await runTear(el, ctx, { tier: ctx.motion, fibreUrl: await fibre });
              hook = (s, k, t) => tear.alive() && tear.hook(s, k, t);
              root.classList.add('tl-gl-on');
              onScroll();
            } catch (e) { console.warn('[tờ lịch] xé bằng CSS:', e?.message || e); hook = null; }
          };
          'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 1500 }) : setTimeout(go, 600);
        }
        // Tải xong font/ảnh có thể đổi vị trí: đo lại
        addEventListener('load', () => { measure(); onScroll(); });
        ctx.on('motion', m => {
          if (m?.motion !== 'lite') return;
          root.classList.remove('tl-tear');
          sheets.forEach(s => { s.style.transform = ''; s.style.visibility = ''; s.style.clipPath = ''; });
          stubs.replaceChildren(); snaps.remove();
          removeEventListener('scroll', onScroll);
        });
      },
    },

    /* ===== Bìa carton sau xấp lịch: giữ chỗ, mừng cưới, lời chúc ===== */
    {
      id: 'bia-lich', label: 'Giữ chỗ và lời chúc', kind: 'finale', provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => {
        const { texts: t, accounts } = ctx;
        return html`
        <div class="tl-board">
          <section class="tl-card" id="giu-cho" aria-labelledby="tl-rsvp-h">
            <h2 id="tl-rsvp-h">${t.rsvpTitle}</h2>
            <p class="tl-lead">${t.rsvpLead}</p>
            ${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Giữ chỗ', note: false, wish: false })}
          </section>
          ${ctx.has('gift') ? html`
          <section class="tl-card tl-gift" aria-labelledby="tl-gift-h">
            <h2 id="tl-gift-h">${t.giftTitle}</h2>
            ${accounts.map(a => html`
              <article class="tl-acc">
                ${qrUrl(a, 'Mung cuoi') ? html`<img class="tl-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="eager" width="132" height="132">` : ''}
                <div>
                  <h3>${a.who}</h3>
                  <p>${a.bank}</p>
                  <p class="tl-accnum">${a.number}</p>
                  <p>${a.name}</p>
                  <button type="button" class="sh-btn tl-ghost" data-copy="${a.number}">Chép số</button>
                </div>
              </article>`)}
          </section>` : ''}
          <section class="tl-card tl-wishes" aria-labelledby="tl-wish-h">
            <h2 id="tl-wish-h">${t.wishesTitle}</h2>
            ${wishForm(ctx, { submit: 'Ghi lời chúc', placeholder: 'Viết đôi dòng gửi hai bạn…' })}
            ${wishList(ctx)}
          </section>
        </div>
        <a class="tl-keep" href="#giu-cho">Giữ chỗ</a>`;
      },
      mount(el, ctx) {
        if (ctx.guest) el.querySelectorAll('img.tl-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
        // Nút Giữ chỗ cố định: ẩn khi phiếu đang ở trên màn
        const keep = el.querySelector('.tl-keep'), card = el.querySelector('#giu-cho');
        new IntersectionObserver(([e]) => keep.classList.toggle('is-off', e.isIntersecting), { threshold: .2 }).observe(card);
        ctx.on('rsvp', () => card.classList.add('is-sent'));
      },
    },
  ],
});
