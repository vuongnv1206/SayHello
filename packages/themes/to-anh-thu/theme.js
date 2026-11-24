// Mẫu "Tờ Ảnh Thử": thiệp là tờ in thử (contact sheet) của tiệm ảnh. Xem tổng thể trước, chi tiết sau.
//   Đầu tờ: tên hai người, ngày, giờ, nơi viết bằng bút sáp đỏ ở lề (thấy ngay, H1).
//   Lưới khung phim đánh số: 6 ảnh là khung lớn hai cột, 30 ảnh vẫn gọn trong vài màn. Ghi chú bút sáp chen giữa lưới:
//   giờ và nơi từng buổi lễ, có nút chỉ đường.
//   Chạm khung: kính lúp phóng ảnh kín màn, vuốt hoặc bấm để sang khung khác.
//   Trả lời: "khoanh" khung bạn thích nhất (vòng bút sáp vẽ quanh khung), rồi gửi phiếu kèm số khung đó.
// Động từ chuyển động: "khoanh". Lite: vòng khoanh hiện sẵn, không vẽ dần.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const hm = iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; };
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');
const ring = html`<svg class="ta-ring" viewBox="0 0 120 150" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M60 6 C98 4 116 34 114 76 C112 122 90 146 56 144 C22 142 4 116 6 74 C8 34 26 8 66 8"/></svg>`;

export default defineTheme({
  id: 'to-anh-thu',
  name: 'Tờ Ảnh Thử',
  version: '1.0.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#d9dbd6',
  fonts: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,400..800&family=Caveat:wght@500;700&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: { images: { album: { min: 4, ideal: 12, max: 36, label: 'Mỗi ảnh là một khung trên tờ in thử' } } },
  palettes: [
    { id: 'xam-lanh', name: 'Giấy ảnh xám lạnh', swatch: ['#d9dbd6', '#e0352b'] },
    { id: 'trang-sua', name: 'Giấy ảnh trắng', swatch: ['#eeefec', '#1f5fd1'], vars: { '--ta-paper': '#eeefec', '--ta-pen': '#1f5fd1' } },
  ],
  defaults: {
    texts: {
      roll: 'Cuộn phim cưới',
      pickTitle: 'Khoanh khung bạn thích',
      pickLead: 'Chạm một khung, bấm "Khoanh khung này", rồi gửi trả lời. Chúng mình sẽ biết bạn thích tấm nào nhất.',
      pickNone: 'Chưa khoanh khung nào (không bắt buộc).',
      wishesTitle: 'Ghi chú của khách',
      giftTitle: 'Mừng cưới',
    },
  },

  scenes: [
    {
      id: 'to-in', label: 'Tờ ảnh thử', provides: ['when', 'where', 'map', 'album', 'countdown'],
      render: ctx => {
        const { names: n, date, city, events, places, album, captions, texts: t, guest, main } = ctx;
        const p = parts(date);
        const place = e => places.find(x => x.address && e.address && x.address === e.address) || (events.length === 1 ? places[0] : null);
        const lunar = events.find(e => /^nhằm|âm lịch/i.test(e.lunar || ''))?.lunar;
        const frame = (src, k) => html`
          <li class="ta-frame" data-k="${k}">
            <button type="button" class="ta-open" data-k="${k}" aria-label="Phóng to khung ${k + 1}"><img src="${src}" alt="${captions[k] || 'Ảnh cưới ' + (k + 1)}" loading="${k < 4 ? 'eager' : 'lazy'}" decoding="async"></button>
            <span class="ta-fn">${k + 1}</span>${ring}
          </li>`;
        // Ghi chú lề: giờ và nơi các buổi lễ, chen sau hàng đầu của lưới
        const note = html`
          <li class="ta-note">
            ${events.map((e, i) => html`
              <div class="ta-ev" data-ev="${i}">
                <p class="ta-pen ta-ev-h">${hm(e.date)} ${e.title}</p>
                ${e.venue ? html`<p class="ta-venue">${e.venue}</p>` : ''}
                ${e.address ? html`<p class="ta-addr">${br(e.address)}</p>` : ''}
                <p class="ta-acts">${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}${e.gcal ? html`<a class="sh-btn ta-ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}</p>
              </div>`)}
          </li>`;
        const cut = Math.min(2, album.length);
        return html`
        <header class="ta-head">
          <p class="ta-roll">${t.roll}<span>gửi ${guest()}</span></p>
          <h1 class="ta-names"><span>${n.first}</span><span class="ta-and">và</span><span>${n.second}</span></h1>
          <p class="ta-pen ta-date">${p ? `${WD[p.wd]} ${p.d}.${p.mo}.${p.y}` : ''}</p>
          ${lunar ? html`<p class="ta-lunar">${lunar}</p>` : ''}
          ${main ? html`<p class="ta-main">${main.title} lúc ${hm(main.date)}${main.venue ? html`<br>${main.venue}` : city ? html`<br>${city}` : ''}</p>` : ''}
          <p class="ta-left" data-days="${date}"></p>
        </header>
        <ol class="ta-sheet">
          ${album.slice(0, cut).map((s, k) => frame(s, k))}
          ${note}
          ${album.slice(cut).map((s, k) => frame(s, k + cut))}
        </ol>
        <dialog class="ta-loupe" aria-label="Kính lúp">
          <img alt="">
          <p class="ta-l-cap"></p>
          <div class="ta-l-nav">
            <button type="button" data-step="-1" aria-label="Khung trước">‹</button>
            <span class="ta-l-n"></span>
            <button type="button" data-step="1" aria-label="Khung sau">›</button>
          </div>
          <div class="ta-l-acts">
            <button type="button" class="ta-pick">Khoanh khung này</button>
            <button type="button" class="ta-l-x">Đóng</button>
          </div>
        </dialog>`;
      },
      mount(el, ctx) {
        const d = el.querySelector('[data-days]'), tt = Date.parse(d?.dataset.days || '');
        if (d && tt) { const days = Math.ceil((tt - Date.now()) / 864e5); d.textContent = days > 1 ? `còn ${days} ngày` : days === 1 ? 'ngày mai' : days === 0 ? 'hôm nay' : ''; }
        const loupe = el.querySelector('.ta-loupe'), big = loupe.querySelector('img'), cap = loupe.querySelector('.ta-l-cap'), num = loupe.querySelector('.ta-l-n');
        const btns = [...el.querySelectorAll('.ta-open')];
        let cur = 0;
        const show = k => {
          cur = (k + btns.length) % btns.length;
          const im = btns[cur].querySelector('img');
          big.src = im.currentSrc || im.src; big.alt = im.alt; cap.textContent = im.alt.startsWith('Ảnh cưới') ? '' : im.alt;
          num.textContent = `Khung ${cur + 1} / ${btns.length}`;
          loupe.querySelector('.ta-pick').textContent = ctx.fav === cur ? 'Đã khoanh khung này' : 'Khoanh khung này';
        };
        btns.forEach((b, k) => b.addEventListener('click', () => { show(k); loupe.showModal?.(); }));
        loupe.addEventListener('click', e => {
          const s = e.target.closest('[data-step]');
          if (s) show(cur + +s.dataset.step);
          else if (e.target === loupe || e.target.closest('.ta-l-x')) loupe.close();
        });
        let x0 = null;
        loupe.addEventListener('pointerdown', e => { x0 = e.clientX; });
        loupe.addEventListener('pointerup', e => { if (x0 != null && Math.abs(e.clientX - x0) > 50) show(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
        // Khoanh: chỉ một khung; vòng bút sáp vẽ dần quanh khung đó trên tờ in thử
        loupe.querySelector('.ta-pick').addEventListener('click', () => {
          ctx.fav = cur;
          el.querySelectorAll('.ta-frame').forEach(f => f.classList.toggle('is-fav', +f.dataset.k === cur));
          ctx.emit('fav', cur);
          loupe.close();
          el.querySelector(`.ta-frame[data-k="${cur}"]`)?.scrollIntoView({ block: 'center', behavior: ctx.reduced ? 'auto' : 'smooth' });
        });
      },
    },

    /* ===== Phiếu trả lời kèm khung đã khoanh, ghi chú của khách, mừng cưới ===== */
    {
      id: 'phieu', label: 'Trả lời', kind: 'finale', provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => {
        const { texts: t, accounts, names: n } = ctx;
        return html`
        <section class="ta-rsvp" id="tra-loi" aria-labelledby="ta-r-h">
          <h2 id="ta-r-h" class="ta-pen ta-h">${t.pickTitle}</h2>
          <p class="ta-lead">${t.pickLead}</p>
          <p class="ta-picked" aria-live="polite"><span class="ta-picked-img"></span><span class="ta-picked-t">${t.pickNone}</span></p>
          ${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Gửi trả lời', note: false, wish: false })}
        </section>
        <section class="ta-wishes" aria-labelledby="ta-w-h">
          <h2 id="ta-w-h" class="ta-pen ta-h">${t.wishesTitle}</h2>
          ${wishForm(ctx, { submit: 'Gửi lời chúc', placeholder: 'Viết đôi dòng gửi hai bạn…' })}
          ${wishList(ctx)}
        </section>
        ${ctx.has('gift') ? html`
        <section class="ta-gift" aria-labelledby="ta-g-h">
          <h2 id="ta-g-h" class="ta-pen ta-h">${t.giftTitle}</h2>
          ${accounts.map(a => html`
            <article class="ta-acc">
              ${qrUrl(a, 'Mung cuoi') ? html`<img class="ta-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="128" height="128">` : ''}
              <div><h3>${a.who}</h3><p>${a.bank}</p><p class="ta-num">${a.number}</p><p>${a.name}</p><button type="button" class="sh-btn ta-ghost" data-copy="${a.number}">Chép số</button></div>
            </article>`)}
        </section>` : ''}
        <p class="ta-end">${n.first} và ${n.second}</p>
        <a class="ta-reply" href="#tra-loi">Trả lời</a>`;
      },
      mount(el, ctx) {
        const form = el.querySelector('form[data-sh=rsvp]');
        // Số khung đã khoanh đi kèm phiếu (ô ẩn "note")
        const hidden = Object.assign(document.createElement('input'), { type: 'hidden', name: 'note' });
        form.append(hidden);
        const pickedImg = el.querySelector('.ta-picked-img'), pickedT = el.querySelector('.ta-picked-t');
        ctx.on('fav', k => {
          const src = document.querySelector(`.ta-frame[data-k="${k}"] img`);
          pickedImg.innerHTML = '';
          if (src) { const im = document.createElement('img'); im.src = src.currentSrc || src.src; im.alt = ''; pickedImg.append(im); }
          pickedT.textContent = `Bạn đã khoanh khung số ${k + 1}.`;
          hidden.value = `Thích khung số ${k + 1}`;
        });
        if (ctx.guest) el.querySelectorAll('img.ta-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
        const reply = el.querySelector('.ta-reply'), sec = el.querySelector('#tra-loi');
        new IntersectionObserver(([e]) => reply.classList.toggle('is-off', e.isIntersecting), { threshold: .2 }).observe(sec);
        ctx.on('rsvp', () => sec.classList.add('is-sent'));
      },
    },
  ],
});
