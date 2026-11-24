// Mẫu "Tạp Chí Cưới": thiệp là một số tạp chí đặc biệt. Cuộn dọc bình thường, không phải học cử chỉ nào.
//   Bìa: ảnh tràn màn hình, tên hai người cỡ rất lớn cắt ngang mép ảnh; dòng tít bìa chính là ngày, giờ, nơi
//   tổ chức và hạn trả lời, chạm vào là tới đúng trang.
//   Ruột: ảnh dàn trang theo nhịp 1 tấm tràn, 2 tấm lệch, 1 tấm kèm trích dẫn, 3 tấm; dòng số trang chạy theo khi đọc.
//   Trang lịch (giờ là chữ số lớn), thư mời (chữ cái đầu lớn), phiếu trả lời cắt rời, thư bạn đọc, bìa sau có mã vạch.
// Động từ chuyển động: "dàn trang" — ảnh mở ra từ phía gáy sách khi tới; mức lite thì hiện sẵn.
// Ảnh dùng: images.hero (bìa), album[], images.thanks (bìa sau). 6 ảnh hay 30 ảnh đều được: số trang dài ra.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const dayLine = iso => { const p = parts(iso); return p ? `${WD[p.wd]}, ${p.d} tháng ${p.mo} năm ${p.y}` : ''; };
const dotDate = iso => { const p = parts(iso); return p ? `${p.dd}.${p.mm}.${p.y}` : ''; };
const hm = iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; };
// Bỏ dấu cho nội dung chuyển khoản (ngân hàng không nhận dấu)
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Nhịp dàn trang: số ảnh mỗi kiểu trang. Lặp lại cho tới hết album.
// Album dài (> 12 ảnh): chèn trang "tờ ảnh thử" 6 ảnh nhỏ để cuộn không quá dài; chạm vẫn mở cỡ lớn.
const RHYTHM = [['full', 1], ['pair', 2], ['quote', 1], ['trio', 3]];
const RHYTHM_LONG = [['full', 1], ['pair', 2], ['sheet', 6], ['quote', 1], ['trio', 3], ['sheet', 6]];
function spreads(list, total = list.length) {
  const R = total > 12 ? RHYTHM_LONG : RHYTHM;
  const out = []; let i = 0, k = 0;
  while (i < list.length) {
    let [kind, n] = R[k++ % R.length];
    const left = list.length - i;
    if (n > left) [kind, n] = kind === 'sheet' && left >= 3 ? ['sheet', left] : left === 2 ? ['pair', 2] : ['full', 1];
    out.push({ kind, items: list.slice(i, i + n) });
    i += n;
  }
  return out;
}

// Chia album: ảnh 0 lên bìa, phần còn lại chia đôi quanh trang lịch và thư mời
function plan(ctx) {
  const items = ctx.album.map((src, i) => ({ src, i, cap: ctx.captions[i] || '' }));
  const rest = items.slice(1);
  const cut = Math.min(rest.length, Math.max(2, Math.ceil(rest.length * .45)));
  return { a: spreads(rest.slice(0, cut), rest.length), b: spreads(rest.slice(cut), rest.length) };
}

// Số trang: bìa là trang 1, mỗi trang ảnh và mỗi mục cộng thêm 2 (như một tờ có hai mặt)
function folios(ctx) {
  const { a, b } = plan(ctx);
  let p = 2;
  const next = () => { const v = p; p += 2; return v; };
  const f = { a: a.map(next), lich: next(), thu: next(), b: b.map(next), phieu: next(), qua: ctx.has('gift') ? next() : 0 };
  f.back = p;
  return f;
}

const fig = (it, cls = '') => html`
  <figure class="tc-fig ${cls}" data-dan>
    <button type="button" class="tc-open" data-i="${it.i}" aria-label="Xem ảnh ${it.i + 1} cỡ lớn"><img src="${it.src}" alt="${it.cap || 'Ảnh cưới ' + (it.i + 1)}" loading="lazy" decoding="async"></button>
    ${it.cap ? html`<figcaption>${it.cap}</figcaption>` : ''}
  </figure>`;

function spreadHtml(sp, page, ctx, k) {
  const quote = ctx.story[k % Math.max(1, ctx.story.length)];
  const body = sp.kind === 'full' ? fig(sp.items[0], 'is-full')
    : sp.kind === 'pair' ? html`<div class="tc-pair">${fig(sp.items[0], 'is-a')}${fig(sp.items[1], 'is-b')}</div>`
    : sp.kind === 'quote' ? html`<div class="tc-quote">${fig(sp.items[0], 'is-q')}
        ${quote?.text ? html`<blockquote><p>${quote.text}</p>${quote.title ? html`<cite>${quote.title}${quote.year ? html`, ${quote.year}` : ''}</cite>` : ''}</blockquote>` : ''}</div>`
    : sp.kind === 'sheet' ? html`<div class="tc-sheet">${sp.items.map(it => fig({ ...it, cap: '' }, 'is-s'))}</div>`
    : html`<div class="tc-trio">${fig(sp.items[0], 'is-t0')}${fig(sp.items[1], 'is-t1')}${fig(sp.items[2], 'is-t2')}</div>`;
  return html`<div class="tc-spread is-${sp.kind}" data-folio="${page}">${body}<p class="tc-pn" aria-hidden="true">${page}</p></div>`;
}

// Mã vạch bìa sau: vạch dựng từ các chữ số của ngày cưới (trang trí, không phải mã đọc được)
function barcode(iso) {
  const digits = (iso || '').replace(/\D/g, '').slice(0, 12).split('').map(Number);
  let x = 0; const bars = [];
  for (const d of [1, 2, ...digits, 2, 1]) { const w = 1 + (d % 3); bars.push(html`<rect x="${x}" y="0" width="${w}" height="40"/>`); x += w + 1 + ((d >> 1) % 2) * 2; }
  return html`<svg class="tc-bar" viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>`;
}

export default defineTheme({
  id: 'tap-chi-cuoi',
  name: 'Tạp Chí Cưới',
  version: '1.0.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#f1f2ee',
  fonts: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700;800&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', story: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: {
    images: { hero: { required: true, aspect: '4:5', label: 'Ảnh bìa tạp chí' }, thanks: { aspect: '4:5', label: 'Ảnh bìa sau' }, album: { min: 4, ideal: 12, max: 30 } },
    story: { optional: true, maxItems: 8 },
  },
  palettes: [
    { id: 'giay-bao', name: 'Giấy báo, mực xanh', swatch: ['#f1f2ee', '#2340c8'] },
    { id: 'mat-bia', name: 'Giấy mờ, đỏ son', swatch: ['#f3f1ee', '#c2361f'], vars: { '--tc-spot': '#c2361f', '--tc-spot-soft': '#f6dcd5' } },
    { id: 'dem-in', name: 'Bản in đêm', swatch: ['#16181d', '#9fb4ff'], vars: { '--tc-paper': '#16181d', '--tc-ink': '#eef0f4', '--tc-mute': '#a5abb8', '--tc-rule': '#3a3f4b', '--tc-spot': '#9fb4ff', '--tc-spot-soft': '#262d45', '--tc-spot-ink': '#0d1020' } },
  ],
  defaults: {
    texts: {
      issue: 'Số đặc biệt',
      letterTitle: 'Thư mời',
      letter: 'Sau nhiều mùa cùng nhau, chúng mình quyết định viết tiếp câu chuyện này thành một gia đình. Ngày vui sẽ trọn vẹn hơn nhiều nếu có bạn ở đó.',
      rsvpTitle: 'Phiếu trả lời',
      rsvpLead: 'Cắt rời, điền và gửi lại giúp chúng mình nhé. Chỉ mất nửa phút.',
      wishesTitle: 'Thư bạn đọc',
      giftTitle: 'Mừng cưới',
      giftLead: 'Sự có mặt của bạn đã là món quà. Nếu muốn gửi thêm, thông tin ở dưới đây.',
      backLine: 'Hẹn gặp bạn ở số tiếp theo, ngoài đời thật.',
    },
  },

  scenes: [
    /* ===== Bìa (không có màn chờ: mở ra là thấy ngay tên, ngày, nơi tổ chức) ===== */
    {
      id: 'bia', label: 'Bìa tạp chí', provides: ['when', 'where'],
      render: ctx => {
        const { names: n, texts: t, date, city, main, events, img, guest } = ctx;
        const f = folios(ctx);
        const p = parts(date);
        const lunar = events.find(e => /tháng/i.test(e.lunar || '') && /^nhằm|âm/i.test(e.lunar))?.lunar || main?.lunar || '';
        return html`
        <header class="tc-mast">
          <p class="tc-issue">${t.issue}<span>${p ? `tháng ${p.mo}, ${p.y}` : ''}</span></p>
        </header>
        <figure class="tc-cover"><img src="${img('hero', 0)}" alt="${n.pair}" fetchpriority="high" decoding="async">
          <p class="tc-sticker"><span>Gửi riêng</span><b>${guest()}</b></p>
        </figure>
        <h1 class="tc-names"><span class="n1">${n.first}</span><span class="amp">và</span><span class="n2">${n.second}</span></h1>
        <ol class="tc-lines">
          <li><a href="#lich"><b>${dayLine(date)}</b>${lunar ? html`<span>${lunar}</span>` : ''}<i>trang ${f.lich}</i></a></li>
          ${main ? html`<li><a href="#lich"><b>${main.title} lúc ${hm(main.date)}</b><span>${main.venue || city}</span><i>trang ${f.lich}</i></a></li>` : ''}
          <li class="tc-rsvp-line"><a href="#phieu"><b>Bạn sẽ tới chứ?</b><span>Trả lời trong nửa phút</span><i>trang ${f.phieu}</i></a></li>
        </ol>
        <p class="tc-left" data-days="${date}"></p>`;
      },
      mount(el) {
        const d = el.querySelector('[data-days]'), t = Date.parse(d?.dataset.days || '');
        if (!d || !t) return;
        const days = Math.ceil((t - Date.now()) / 864e5);
        d.innerHTML = days > 1 ? `Còn <b>${days}</b> ngày` : days === 1 ? 'Ngày mai là <b>ngày cưới</b>' : days === 0 ? 'Hôm nay là <b>ngày cưới</b>' : '';
      },
    },

    /* ===== Trang ảnh, phần đầu ===== */
    {
      id: 'ruot-1', label: 'Trang ảnh', provides: ['album'], when: ctx => ctx.album.length > 1,
      render: ctx => { const f = folios(ctx); return html`${plan(ctx).a.map((sp, k) => spreadHtml(sp, f.a[k], ctx, k))}`; },
    },

    /* ===== Trang lịch: giờ là chữ số lớn ===== */
    {
      id: 'lich', label: 'Lịch ngày cưới', provides: ['when', 'where', 'map', 'countdown'],
      render: ctx => {
        const { events, places, date } = ctx;
        const f = folios(ctx);
        const place = e => places.find(p => p.address && e.address && p.address === e.address) || (events.length === 1 ? places[0] : null);
        return html`
        <div class="tc-page" data-folio="${f.lich}">
          <h2 class="tc-h">Lịch</h2>
          <p class="tc-day">${dayLine(date)}</p>
          <ol class="tc-events">
            ${events.map((e, i) => html`
              <li data-ev="${i}">
                <p class="tc-hm">${hm(e.date)}</p>
                <div>
                  <h3>${e.title}</h3>
                  <p class="tc-when">${dayLine(e.date)}${e.lunar ? html`<br><span>${e.lunar}</span>` : ''}</p>
                  ${e.venue ? html`<p class="tc-venue">${e.venue}</p>` : ''}
                  ${e.address ? html`<p class="tc-addr">${br(e.address)}</p>` : ''}
                  <p class="tc-acts">
                    ${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                    ${e.gcal ? html`<a class="sh-btn tc-ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
                  </p>
                </div>
              </li>`)}
          </ol>
          <p class="tc-pn" aria-hidden="true">${f.lich}</p>
        </div>`;
      },
    },

    /* ===== Thư mời: chữ cái đầu lớn, hai nhà ký tên như phần tác giả ===== */
    {
      id: 'thu-moi', label: 'Thư mời',
      render: ctx => {
        const { texts: t, families, names: n, guest } = ctx;
        const f = folios(ctx);
        return html`
        <div class="tc-page" data-folio="${f.thu}">
          <h2 class="tc-h">${t.letterTitle}</h2>
          <p class="tc-salute">Thân gửi ${guest()},</p>
          <p class="tc-letter">${t.letter}</p>
          <p class="tc-sign">${n.firstFull} và ${n.secondFull}</p>
          ${families.length ? html`<div class="tc-fams">${families.map(fm => html`
            <div><h3>${fm.side}</h3>${fm.father ? html`<p>Ông ${fm.father}</p>` : ''}${fm.mother ? html`<p>Bà ${fm.mother}</p>` : ''}${fm.address ? html`<p class="tc-addr">${br(fm.address)}</p>` : ''}</div>`)}</div>` : ''}
          <p class="tc-pn" aria-hidden="true">${f.thu}</p>
        </div>`;
      },
    },

    /* ===== Trang ảnh, phần sau ===== */
    {
      id: 'ruot-2', label: 'Trang ảnh tiếp', when: ctx => plan(ctx).b.length > 0,
      render: ctx => { const f = folios(ctx), { a, b } = plan(ctx); return html`${b.map((sp, k) => spreadHtml(sp, f.b[k], ctx, k + a.length))}`; },
    },

    /* ===== Phiếu trả lời cắt rời + thư bạn đọc ===== */
    {
      id: 'phieu', label: 'Phiếu trả lời', provides: ['rsvp', 'guestbook'],
      render: ctx => {
        const { texts: t } = ctx;
        const f = folios(ctx);
        return html`
        <div class="tc-page" data-folio="${f.phieu}">
          <div class="tc-coupon">
            <h2 class="tc-h">${t.rsvpTitle}</h2>
            <p class="tc-lead">${t.rsvpLead}</p>
            ${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Gửi phiếu', note: false, wish: false })}
          </div>
          <div class="tc-wishes">
            <h2 class="tc-h">${t.wishesTitle}</h2>
            ${wishForm(ctx, { submit: 'Gửi thư', placeholder: 'Viết đôi dòng gửi hai bạn…' })}
            ${wishList(ctx)}
          </div>
          <p class="tc-pn" aria-hidden="true">${f.phieu}</p>
        </div>`;
      },
      mount(el, ctx) {
        ctx.on('rsvp', () => el.querySelector('.tc-coupon')?.classList.add('is-sent'));
      },
    },

    /* ===== Mừng cưới ===== */
    {
      id: 'mung-cuoi', label: 'Mừng cưới', provides: ['gift'], when: ctx => ctx.has('gift'),
      render: ctx => {
        const { accounts, texts: t } = ctx;
        const f = folios(ctx);
        return html`
        <div class="tc-page" data-folio="${f.qua}">
          <h2 class="tc-h">${t.giftTitle}</h2>
          <p class="tc-lead">${t.giftLead}</p>
          <div class="tc-accs">
            ${accounts.map(a => html`
              <article class="tc-acc">
                <h3>${a.who}</h3>
                ${qrUrl(a, 'Mung cuoi') ? html`<img class="tc-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="200" height="200">` : ''}
                <p>${a.bank}</p>
                <p class="tc-num">${a.number}</p>
                <p>${a.name}</p>
                <button type="button" class="sh-btn tc-ghost" data-copy="${a.number}">Chép số tài khoản</button>
              </article>`)}
          </div>
          <p class="tc-pn" aria-hidden="true">${f.qua}</p>
        </div>`;
      },
      mount(el, ctx) {
        // Nội dung chuyển khoản kèm tên khách (không dấu) để cặp đôi đối chiếu sao kê
        if (ctx.guest) el.querySelectorAll('img.tc-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số tài khoản'; }, 2000);
        }));
      },
    },

    /* ===== Bìa sau ===== */
    {
      id: 'bia-sau', kind: 'finale', label: 'Bìa sau',
      render: ctx => {
        const { names: n, texts: t, date, img, album } = ctx;
        return html`
        <figure class="tc-back" data-folio="${folios(ctx).back}"><img src="${img('thanks', Math.max(0, album.length - 1))}" alt="${n.pair}" loading="lazy" decoding="async"></figure>
        <div class="tc-colophon">
          <p class="tc-backline">${t.backLine}</p>
          <p class="tc-backnames">${n.first} và ${n.second}</p>
          <div class="tc-code">${barcode(date)}<p>${dotDate(date)}</p></div>
        </div>
        <dialog class="tc-view" aria-label="Xem ảnh">
          <img alt="">
          <p class="tc-view-cap"></p>
          <div class="tc-view-nav">
            <button type="button" data-step="-1" aria-label="Ảnh trước">‹</button>
            <span class="tc-view-n"></span>
            <button type="button" data-step="1" aria-label="Ảnh sau">›</button>
            <button type="button" class="tc-view-x" aria-label="Đóng">×</button>
          </div>
        </dialog>
        <nav class="tc-folio" aria-label="Số trang"><a href="#bia">${n.first} và ${n.second}</a><span class="tc-folio-n">trang 1</span><a class="tc-reply" href="#phieu">Trả lời</a></nav>`;
      },
      mount(el, ctx) {
        const root = document.documentElement;
        // Gửi phiếu xong: bìa sau đóng dấu "Đã giữ chỗ" lên mã vạch, như bản in riêng của khách
        ctx.on('rsvp', x => { if (x?.attend === 'Có') el.querySelector('.tc-code')?.classList.add('is-kept'); });
        const reduce = () => ctx.reduced;

        /* Dòng số trang: theo trang đang chiếm giữa màn hình */
        const folio = el.querySelector('.tc-folio'), num = folio.querySelector('.tc-folio-n');
        const pages = [...document.querySelectorAll('[data-folio]')];
        const seen = new Map();
        const io = new IntersectionObserver(es => {
          es.forEach(e => seen.set(e.target, e.isIntersecting));
          const cur = pages.filter(p => seen.get(p)).pop();
          num.textContent = 'trang ' + (cur ? cur.dataset.folio : 1);
        }, { rootMargin: '-45% 0px -45% 0px' });
        pages.forEach(p => io.observe(p));
        // Ẩn ở bìa, hiện khi đã vào ruột
        const cover = document.getElementById('bia');
        if (cover) new IntersectionObserver(([e]) => folio.classList.toggle('is-on', !e.isIntersecting), { threshold: .15 }).observe(cover);
        else folio.classList.add('is-on');

        /* Dàn trang: ảnh mở ra từ phía gáy khi tới (lite: hiện sẵn) */
        const figs = document.querySelectorAll('[data-dan]');
        if (!reduce() && 'IntersectionObserver' in window) {
          root.classList.add('tc-dan');
          const io2 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io2.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
          figs.forEach(f => io2.observe(f));
        }

        /* Xem ảnh lớn: chạm ảnh nào mở ảnh đó, vuốt ngang hoặc nút để đổi ảnh */
        const view = el.querySelector('.tc-view'), big = view.querySelector('img'), cap = view.querySelector('.tc-view-cap'), n = view.querySelector('.tc-view-n');
        // Danh sách ảnh lấy từ chính trang (theo thứ tự xuất hiện), trình duyệt không có dữ liệu album riêng
        const btns = [...document.querySelectorAll('.tc-open')];
        const list = btns.map(b => { const im = b.querySelector('img'); return { src: im.currentSrc || im.src, cap: b.closest('figure')?.querySelector('figcaption')?.textContent || '' }; });
        let cur = 0;
        const show = i => {
          if (!list.length) return;
          cur = (i + list.length) % list.length;
          big.src = list[cur].src; big.alt = list[cur].cap || `Ảnh cưới ${cur + 1}`;
          cap.textContent = list[cur].cap; n.textContent = `${cur + 1} / ${list.length}`;
        };
        btns.forEach((b, k) => b.addEventListener('click', () => { show(k); view.showModal?.(); }));
        view.addEventListener('click', e => {
          const s = e.target.closest('[data-step]');
          if (s) show(cur + +s.dataset.step);
          else if (e.target === view || e.target.closest('.tc-view-x')) view.close();
        });
        let x0 = null;
        view.addEventListener('pointerdown', e => { x0 = e.clientX; });
        view.addEventListener('pointerup', e => { if (x0 != null && Math.abs(e.clientX - x0) > 50) show(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
        view.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
      },
    },
  ],
});
