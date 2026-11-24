// Mẫu "Tờ Lịch": thiệp là một xấp lịch bloc treo tường. Cuộn trang bình thường, mỗi lần cuộn qua một màn
// thì một tờ bị xé đi (động từ chuyển động: "xé"). Độ dày xấp lịch ở đáy thay cho đồng hồ đếm ngược.
//   Tờ đầu: ngày cưới (số đỏ thật lớn, thứ, âm lịch), tên hai người, nơi tổ chức. Tờ hai: giờ và địa điểm.
//   Các tờ sau: mỗi tờ một ảnh gần kín bề ngang, kèm một dòng "lời hay" như lịch bloc. Tờ cuối: "Hết lịch, tới ngày cưới".
//   Sau xấp lịch là tấm bìa carton: phiếu giữ chỗ, mừng cưới, lời chúc. Nút "Giữ chỗ" cố định một chạm.
// Mức lite / không JS: các tờ xếp dọc như trang thường, không xé.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

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
          <div class="tl-stack">
            <article class="tl-sheet tl-day ${tone(p)}" data-k="0">
              ${head(p, html`Gửi ${guest()}`)}
              <p class="tl-month">Tháng ${p ? MONTH[p.mo - 1] : ''}</p>
              <p class="tl-num">${p ? p.d : ''}</p>
              <p class="tl-wd">${p ? WD[p.wd] : ''}</p>
              ${lunar ? html`<p class="tl-lunar">${lunar}</p>` : ''}
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

        // Xé lịch theo cuộn: xấp lịch đứng yên (sticky), mỗi màn cuộn qua thì tờ trên cùng bay lên và lật đi
        const sheets = [...el.querySelectorAll('.tl-sheet')];
        const n = sheets.length;
        root.classList.add('tl-tear');
        el.style.setProperty('--n', n);
        sheets.forEach((s, k) => { s.style.zIndex = String(n - k); });
        let top = 0, raf = 0;
        const measure = () => { top = el.getBoundingClientRect().top + scrollY; };
        const update = () => {
          raf = 0;
          const q = Math.max(0, (scrollY - top) / innerHeight);
          sheets.forEach((s, k) => {
            if (k === n - 1) return;
            const t = Math.min(1, Math.max(0, q - k));
            if (t <= 0) { if (s.dataset.t !== '0') { s.style.transform = ''; s.style.visibility = ''; s.dataset.t = '0'; } return; }
            s.dataset.t = String(t);
            s.style.visibility = t >= 1 ? 'hidden' : '';
            // tờ xé từ mép trên: bị giật lên, nghiêng, rời khỏi màn
            s.style.transform = `translate3d(${t * -18}vw, ${t * -112}%, 0) rotate(${t * -14}deg)`;
          });
          const left = Math.max(0, n - 1 - Math.floor(q + .5));
          el.style.setProperty('--left', left);
          el.classList.toggle('is-past', q > .15);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        measure(); update();
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', () => { measure(); onScroll(); });
        // Tải xong font/ảnh có thể đổi vị trí: đo lại
        addEventListener('load', () => { measure(); onScroll(); });
        ctx.on('motion', m => {
          if (m?.motion !== 'lite') return;
          root.classList.remove('tl-tear');
          sheets.forEach(s => { s.style.transform = ''; s.style.visibility = ''; });
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
                ${qrUrl(a, 'Mung cuoi') ? html`<img class="tl-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="132" height="132">` : ''}
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
