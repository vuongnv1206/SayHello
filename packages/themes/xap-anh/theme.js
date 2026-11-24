// Mẫu "Xấp Ảnh": cả thiệp gói trong một màn hình, không cuộn. Giữa bàn là một xấp ảnh in viền trắng.
//   Đầu màn luôn có tên hai người, ngày và nơi tổ chức (thấy ngay, H1).
//   Vuốt ngang hoặc bấm nút ‹ › để sang ảnh (tấm trên bị gạt khỏi xấp); chạm ảnh để lật mặt sau: chú thích viết tay, dấu ngày.
//   Đáy màn là các tab như phân trang hồ sơ: Giờ và nơi, Trả lời, Lời chúc, Mừng cưới. Chạm tab thì tấm kéo lên từ dưới.
//   "Xem tất cả" trải cả xấp thành lưới. Động từ chuyển động: "gạt" và "lật". Lite: đổi ảnh tức thì, không xoay.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const hm = iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; };
const dmy = iso => { const p = parts(iso); return p ? `${p.d}.${p.mo}.${p.y}` : ''; };
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');
// Góc nghiêng cố định cho từng tấm (giống nhau ở máy chủ và trình duyệt)
const tilt = k => (((k * 37) % 9) - 4) * .9;

const sheet = (id, title, body) => html`
  <dialog class="xa-sheet" id="${id}" aria-labelledby="${id}-h">
    <div class="xa-sheet-in">
      <header><h2 id="${id}-h">${title}</h2><button type="button" class="xa-close" aria-label="Đóng">×</button></header>
      ${body}
    </div>
  </dialog>`;

export default defineTheme({
  id: 'xap-anh',
  name: 'Xấp Ảnh',
  version: '1.0.0',
  tier: 'premium',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#36414c',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;1,9..144,400&family=Lexend:wght@400;500;600&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: { images: { album: { min: 3, ideal: 10, max: 30, label: 'Mỗi ảnh là một tấm trong xấp' } } },
  palettes: [
    { id: 'ban-da', name: 'Mặt bàn đá', swatch: ['#36414c', '#f2c14e'] },
    { id: 'go-oc', name: 'Gỗ óc chó', swatch: ['#4a3a30', '#8fc1e3'], vars: { '--xa-table': '#4a3a30', '--xa-table-2': '#3d2f27' } },
    { id: 'ri-xanh', name: 'Rêu xanh', swatch: ['#2f4a40', '#f2c14e'], vars: { '--xa-table': '#2f4a40', '--xa-table-2': '#263d35' } },
  ],
  defaults: {
    texts: {
      firstBack: 'Trân trọng mời bạn tới chung vui ngày chúng mình về chung một nhà.',
      rsvpLead: 'Báo giúp chúng mình bạn có tới không nhé.',
    },
  },

  scenes: [
    {
      id: 'ban', label: 'Xấp ảnh', provides: ['when', 'where', 'map', 'album', 'rsvp', 'guestbook', 'gift', 'countdown'],
      render: ctx => {
        const { names: n, date, city, events, places, album, captions, accounts, texts: t, guest, main } = ctx;
        const p = parts(date);
        const place = e => places.find(x => x.address && e.address && x.address === e.address) || (events.length === 1 ? places[0] : null);
        const lunar = events.find(e => /^nhằm|âm lịch/i.test(e.lunar || ''))?.lunar;
        return html`
        <header class="xa-head">
          <h1 class="xa-names"><span class="xa-n">${n.first}</span> <span class="xa-and">và</span> <span class="xa-n">${n.second}</span></h1>
          <p class="xa-when">${lunar ? html`<i>${lunar}</i>` : ''}<b>${p ? `${WD[p.wd]}, ${p.d} tháng ${p.mo} năm ${p.y}` : ''}</b>${main ? html`<span style="order:3">${main.title} lúc ${hm(main.date)}${main.venue ? html`, ${main.venue}` : city ? html`, ${city}` : ''}</span>` : ''}</p>
        </header>

        <div class="xa-deck" aria-roledescription="xấp ảnh" aria-label="Xấp ảnh, ${album.length} tấm">
          ${album.map((src, k) => html`
            <div class="xa-print" data-k="${k}" style="--r:${tilt(k)}deg" ${k ? html`aria-hidden="true"` : ''}>
              <button type="button" class="xa-face" aria-label="Lật ảnh ${k + 1} xem mặt sau">
                <span class="xa-front"><img src="${src}" alt="${captions[k] || 'Ảnh cưới ' + (k + 1)}" loading="${k < 3 ? 'eager' : 'lazy'}" decoding="async"></span>
                <span class="xa-back">
                  ${k === 0 ? html`<span class="xa-note">Gửi ${guest()},<br>${t.firstBack}</span>` : html`<span class="xa-note">${captions[k] || 'Ảnh số ' + (k + 1)}</span>`}
                  <span class="xa-stamp">${dmy(date)}<br>${n.first} và ${n.second}</span>
                  <span class="xa-no">${k + 1}/${album.length}</span>
                </span>
              </button>
            </div>`)}
        </div>

        <div class="xa-ctrl">
          <button type="button" class="xa-prev" aria-label="Ảnh trước">‹</button>
          <span class="xa-count" aria-live="polite">1 / ${album.length}</span>
          <button type="button" class="xa-next" aria-label="Ảnh sau">›</button>
          <button type="button" class="xa-all">Xem tất cả</button>
        </div>

        <nav class="xa-tabs" aria-label="Thông tin">
          <button type="button" class="xa-tab t1" data-open="xa-gio">Giờ và nơi</button>
          <button type="button" class="xa-tab t2" data-open="xa-tl">Trả lời</button>
          <button type="button" class="xa-tab t3" data-open="xa-chuc">Lời chúc</button>
          ${ctx.has('gift') ? html`<button type="button" class="xa-tab t4" data-open="xa-qua">Mừng cưới</button>` : ''}
        </nav>

        ${sheet('xa-gio', 'Giờ và nơi', html`
          ${lunar ? html`<p class="xa-lunar">${lunar}</p>` : ''}
          <ol class="xa-events">${events.map((e, i) => html`
            <li data-ev="${i}">
              <p class="xa-hm">${hm(e.date)}</p>
              <div><h3>${e.title}</h3><p>${dmy(e.date)}</p>${e.venue ? html`<p class="xa-venue">${e.venue}</p>` : ''}${e.address ? html`<p class="xa-addr">${br(e.address)}</p>` : ''}
                <p class="xa-acts">${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}${e.gcal ? html`<a class="sh-btn xa-ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}</p>
              </div>
            </li>`)}</ol>
          <p class="xa-left" data-days="${date}"></p>`)}
        ${sheet('xa-tl', 'Trả lời', html`<p class="xa-lead">${t.rsvpLead}</p>${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Gửi trả lời', note: false, wish: false })}`)}
        ${sheet('xa-chuc', 'Lời chúc', html`${wishForm(ctx, { submit: 'Gửi lời chúc', placeholder: 'Viết đôi dòng gửi hai bạn…' })}${wishList(ctx)}`)}
        ${ctx.has('gift') ? sheet('xa-qua', 'Mừng cưới', html`${accounts.map(a => html`
          <article class="xa-acc">
            ${qrUrl(a, 'Mung cuoi') ? html`<img class="xa-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="128" height="128">` : ''}
            <div><h3>${a.who}</h3><p>${a.bank}</p><p class="xa-num">${a.number}</p><p>${a.name}</p><button type="button" class="sh-btn xa-ghost" data-copy="${a.number}">Chép số</button></div>
          </article>`)}`) : ''}

        <dialog class="xa-grid" aria-label="Tất cả ảnh">
          <div class="xa-grid-in">
            <header><h2>Cả xấp</h2><button type="button" class="xa-close" aria-label="Đóng">×</button></header>
            <ul>${album.map((src, k) => html`<li><button type="button" data-go="${k}" aria-label="Xem ảnh ${k + 1}"><img src="${src}" alt="" loading="lazy" decoding="async"></button></li>`)}</ul>
          </div>
        </dialog>`;
      },
      mount(el, ctx) {
        const root = document.documentElement;
        root.classList.add('xa-on');
        const prints = [...el.querySelectorAll('.xa-print')];
        const count = el.querySelector('.xa-count');
        const n = prints.length;
        let cur = 0;
        const layout = () => {
          prints.forEach((p, k) => {
            const d = k - cur;
            p.classList.toggle('is-gone', d < 0);
            p.classList.toggle('is-top', d === 0);
            p.style.setProperty('--d', String(Math.max(0, Math.min(d, 4))));
            p.style.zIndex = String(n - k);
            p.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
            p.querySelector('.xa-face').tabIndex = d === 0 ? 0 : -1;
            if (d !== 0) p.classList.remove('is-flip');
          });
          count.textContent = `${cur + 1} / ${n}`;
          el.querySelector('.xa-prev').disabled = cur === 0;
          el.querySelector('.xa-next').disabled = cur === n - 1;
        };
        const go = k => { cur = Math.max(0, Math.min(n - 1, k)); layout(); };
        el.querySelector('.xa-prev').addEventListener('click', () => go(cur - 1));
        el.querySelector('.xa-next').addEventListener('click', () => go(cur + 1));
        addEventListener('keydown', e => { if (document.querySelector('dialog[open]')) return; if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1); });

        // Vuốt tấm trên cùng: kéo theo tay; quá 70px thì gạt sang tấm kế. Chạm (không kéo) thì lật mặt sau.
        let drag = null;
        const deck = el.querySelector('.xa-deck');
        deck.addEventListener('pointerdown', e => { const p = prints[cur]; if (!p.contains(e.target)) return; drag = { x: e.clientX, y: e.clientY, p, moved: false }; });
        deck.addEventListener('pointermove', e => {
          if (!drag) return;
          const dx = e.clientX - drag.x;
          if (Math.abs(dx) > 8) drag.moved = true;
          if (drag.moved && !ctx.reduced) { drag.p.style.transition = 'none'; drag.p.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; }
        });
        const end = e => {
          if (!drag) return;
          const dx = e.clientX - drag.x, p = drag.p;
          p.style.transition = ''; p.style.transform = '';
          if (drag.moved && Math.abs(dx) > 70) go(cur + (dx < 0 ? 1 : -1));
          drag.wasDrag = drag.moved; setTimeout(() => { drag = null; }, 0);
        };
        deck.addEventListener('pointerup', end);
        deck.addEventListener('pointercancel', () => { if (drag) { drag.p.style.transition = ''; drag.p.style.transform = ''; drag = null; } });
        prints.forEach(p => p.querySelector('.xa-face').addEventListener('click', () => { if (drag?.wasDrag) return; p.classList.toggle('is-flip'); }));

        // Các tấm kéo lên từ dưới (tab) và lưới "Xem tất cả"
        const open = id => { const d = el.querySelector('#' + id); d?.showModal?.(); };
        el.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(b.dataset.open)));
        el.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.closest('.xa-close')) d.close(); }));
        const grid = el.querySelector('.xa-grid');
        el.querySelector('.xa-all').addEventListener('click', () => grid.showModal?.());
        grid.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { go(+b.dataset.go); grid.close(); }));

        // Đếm ngày trong tấm Giờ và nơi
        const dd = el.querySelector('[data-days]'), tt = Date.parse(dd?.dataset.days || '');
        if (dd && tt) { const days = Math.ceil((tt - Date.now()) / 864e5); dd.textContent = days > 1 ? `Còn ${days} ngày nữa.` : days === 1 ? 'Ngày mai là ngày cưới.' : days === 0 ? 'Hôm nay là ngày cưới.' : ''; }
        if (ctx.guest) el.querySelectorAll('img.xa-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
        ctx.on('rsvp', () => el.querySelector('.xa-tab.t2')?.classList.add('is-done'));
        layout();
      },
    },
  ],
});
