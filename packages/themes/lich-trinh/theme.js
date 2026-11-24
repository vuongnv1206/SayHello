// Mẫu "Lịch Trình": thiệp là lịch trình của chính ngày cưới. Cuộn dọc bình thường, thông tin chính là bộ khung.
//   Đầu trang: ngày, tên hai người, tóm tắt các mốc giờ (thấy ngay, không thao tác).
//   Mỗi buổi lễ là một mốc lớn trên cột giờ bên trái; ảnh rải vào khoảng giữa các mốc (sáng sớm, giữa ngày, đêm).
//   Màu trời của từng đoạn theo giờ của đoạn đó (tính sẵn ở máy chủ, không cần JS): sáng xanh nhạt, chiều nắng, tối xanh đêm.
//   Đồng hồ nhỏ dính ở cột giờ, kim quay theo đoạn đang đọc (động từ: "chạy giờ"). Đúng ngày cưới thì báo giờ hiện tại.
//   Cuối trang: "Sau tiệc" — giữ chỗ, lời chúc, mừng cưới. Nút Giữ chỗ cố định một chạm.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const hourOf = iso => { const p = parts(iso); return p ? +p.h + +p.mi / 60 : 12; };
const hhmm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Màu trời theo giờ: nội suy giữa các mốc. Chữ đổi sang sáng khi nền tối.
const SKY = [[5, '#dfe6ee'], [8, '#e9f0f2'], [12, '#eef2ea'], [15.5, '#f1e9dc'], [17.5, '#e7c6b8'], [18.6, '#7d6f93'], [19.6, '#33395a'], [23, '#1e2238']];
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function sky(h) {
  let a = SKY[0], b = SKY[SKY.length - 1];
  for (let i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; break; }
  if (h < SKY[0][0]) b = a; if (h > b[0]) a = b;
  const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
  const [r, g, bl] = hex(a[1]).map((v, i) => Math.round(v + (hex(b[1])[i] - v) * t));
  const lum = (.2126 * r + .7152 * g + .0722 * bl) / 255;
  return { bg: `rgb(${r} ${g} ${bl})`, dark: lum < .5 };
}

// Chia ảnh vào các khoảng: trước buổi đầu, giữa các buổi (gấp đôi), sau buổi cuối
function timeline(ctx) {
  const evs = ctx.events.map((e, i) => ({ e, i, h: hourOf(e.date) })).sort((a, b) => a.h - b.h);
  const photos = ctx.album.map((src, i) => ({ src, i, cap: ctx.captions[i] || '' }));
  const gaps = evs.length + 1, w = Array.from({ length: gaps }, (_, k) => (k === 0 || k === gaps - 1 ? 1 : 2));
  const sum = w.reduce((a, b) => a + b, 0);
  let at = 0;
  const groups = w.map((wk, k) => { const n = k === gaps - 1 ? photos.length - at : Math.round(photos.length * wk / sum); const g = photos.slice(at, at + n); at += n; return g; });
  const out = [];
  const first = evs[0]?.h ?? 9, last = evs[evs.length - 1]?.h ?? 18;
  groups.forEach((g, k) => {
    const h = k === 0 ? Math.max(5.5, first - 2) : k === gaps - 1 ? Math.min(23, last + 2.5) : (evs[k - 1].h + evs[k].h) / 2;
    if (g.length) out.push({ kind: 'photos', h, items: g, label: k === 0 ? 'Sáng sớm' : k === gaps - 1 ? 'Khi tiệc tàn' : 'Giữa hai buổi' });
    if (k < evs.length) out.push({ kind: 'event', h: evs[k].h, ev: evs[k] });
  });
  return out;
}

const pics = items => html`<div class="lt-pics n${Math.min(items.length, 4)}">${items.map((p, k) => html`
  <figure class="lt-pic ${k === 0 ? 'is-lead' : ''}"><img src="${p.src}" alt="${p.cap || 'Ảnh cưới ' + (p.i + 1)}" loading="lazy" decoding="async">${p.cap ? html`<figcaption>${p.cap}</figcaption>` : ''}</figure>`)}</div>`;

const clock = html`<svg class="lt-clock" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18"/><line class="lt-hh" x1="20" y1="20" x2="20" y2="10"/><line class="lt-mm" x1="20" y1="20" x2="20" y2="5"/><circle cx="20" cy="20" r="1.8" class="lt-pin"/></svg>`;

export default defineTheme({
  id: 'lich-trinh',
  name: 'Lịch Trình',
  version: '1.0.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#e9eff1',
  fonts: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,500;6..96,700;6..96,800&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional' },
  slots: { images: { album: { min: 3, ideal: 10, max: 30, label: 'Ảnh được rải theo giờ trong ngày' } } },
  palettes: [
    { id: 'troi-ngay', name: 'Trời trong ngày', swatch: ['#e9eff1', '#33395a'] },
  ],
  defaults: {
    texts: {
      intro: 'Lịch trình ngày chung đôi',
      afterTitle: 'Sau tiệc',
      rsvpLead: 'Báo giúp chúng mình bạn có tới không, để giữ chỗ cho bạn.',
      wishesTitle: 'Lời chúc',
      giftTitle: 'Mừng cưới',
    },
  },

  scenes: [
    /* ===== Đầu trang: ngày, tên, tóm tắt mốc giờ ===== */
    {
      id: 'hom-ay', label: 'Ngày cưới', provides: ['when', 'where', 'countdown'],
      render: ctx => {
        const { names: n, date, city, events, texts: t, guest } = ctx;
        const p = parts(date);
        const lunar = events.find(e => /^nhằm|âm lịch/i.test(e.lunar || ''))?.lunar;
        const s = sky(timeline(ctx)[0]?.h ?? 7);
        return html`
        <div class="lt-head" style="--sky:${s.bg}">
          <p class="lt-kicker">${t.intro}, gửi ${guest()}</p>
          <h1 class="lt-names"><span>${n.first}</span><span class="lt-and">và</span><span>${n.second}</span></h1>
          <p class="lt-date">${p ? html`${WD[p.wd]}<b>${p.d}.${p.mo}.${p.y}</b>` : ''}</p>
          ${lunar ? html`<p class="lt-lunar">${lunar}</p>` : ''}
          <ol class="lt-toc">
            ${[...events].sort((a, b) => hourOf(a.date) - hourOf(b.date)).map(e => html`<li data-ev="${events.indexOf(e)}"><a href="#ev-${events.indexOf(e)}"><b>${hhmm(hourOf(e.date))}</b><span>${e.title}${e.venue ? html`<br><small>${e.venue}</small>` : city ? html`<br><small>${city}</small>` : ''}</span></a></li>`)}
          </ol>
          <p class="lt-now" data-date="${date}" hidden></p>
        </div>`;
      },
      mount(el) {
        // Đúng ngày cưới: báo giờ hiện tại; trước đó: còn bao nhiêu ngày
        const now = el.querySelector('.lt-now'), t = Date.parse(now.dataset.date || '');
        if (!t) return;
        const day = d => new Date(d).toDateString();
        const days = Math.ceil((t - Date.now()) / 864e5);
        if (day(t) === day(Date.now())) { const d = new Date(); now.textContent = `Hôm nay là ngày cưới. Bây giờ là ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}.`; now.hidden = false; }
        else if (days > 0) { now.textContent = `Còn ${days} ngày nữa.`; now.hidden = false; }
      },
    },

    /* ===== Dòng thời gian: mốc buổi lễ và ảnh xen giữa ===== */
    {
      id: 'dong-gio', label: 'Lịch trình', provides: ['when', 'where', 'map', 'album'],
      render: ctx => {
        const { places, events } = ctx;
        const place = e => places.find(x => x.address && e.address && x.address === e.address) || (events.length === 1 ? places[0] : null);
        return html`
        <div class="lt-rail-clock" aria-hidden="true">${clock}<span class="lt-clock-t">07:00</span></div>
        ${timeline(ctx).map(b => {
          const s = sky(b.h);
          if (b.kind === 'photos') return html`
            <section class="lt-block lt-gap ${s.dark ? 'is-dark' : ''}" style="--sky:${s.bg}" data-h="${b.h}">
              <p class="lt-t"><span>${hhmm(b.h)}</span></p>
              <div class="lt-body"><h2 class="lt-gap-h">${b.label}</h2>${pics(b.items)}</div>
            </section>`;
          const e = b.ev.e, i = b.ev.i;
          return html`
            <section class="lt-block lt-ev ${s.dark ? 'is-dark' : ''}" style="--sky:${s.bg}" data-h="${b.h}" id="ev-${i}" data-ev="${i}">
              <p class="lt-t is-big"><span>${hhmm(b.h)}</span></p>
              <div class="lt-body">
                <h2 class="lt-ev-h">${e.title}</h2>
                ${e.lunar ? html`<p class="lt-ev-l">${e.lunar}</p>` : ''}
                ${e.venue ? html`<p class="lt-venue">${e.venue}</p>` : ''}
                ${e.address ? html`<p class="lt-addr">${br(e.address)}</p>` : ''}
                <p class="lt-acts">
                  ${place(e) ? html`<a class="sh-btn" href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                  ${e.gcal ? html`<a class="sh-btn lt-ghost" href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
                </p>
              </div>
            </section>`;
        })}`;
      },
      mount(el, ctx) {
        // Đồng hồ ở cột giờ: kim quay theo đoạn đang ở giữa màn (nội suy giữa hai đoạn kề nhau)
        const all = [...el.querySelectorAll('[data-h]')];
        const hh = el.querySelector('.lt-hh'), mm = el.querySelector('.lt-mm'), label = el.querySelector('.lt-clock-t'), wrap = el.querySelector('.lt-rail-clock');
        if (!all.length || !hh) return;
        let raf = 0;
        const update = () => {
          raf = 0;
          const mid = innerHeight * .5;
          // bỏ các đoạn đang ẩn (nhóm khách không dự buổi đó): khung của chúng cao 0, nằm ở toạ độ 0
          const blocks = all.filter(b => !b.hidden && b.offsetHeight);
          if (!blocks.length) return;
          let h = +blocks[0].dataset.h;
          for (let k = 0; k < blocks.length; k++) {
            const r = blocks[k].getBoundingClientRect();
            if (r.top <= mid) {
              const next = blocks[k + 1];
              const t = next ? Math.min(1, Math.max(0, (mid - r.top) / Math.max(1, r.height))) : 0;
              h = +blocks[k].dataset.h + (next ? (+next.dataset.h - +blocks[k].dataset.h) * t : 0);
            }
          }
          hh.setAttribute('transform', `rotate(${(h % 12) * 30} 20 20)`);
          mm.setAttribute('transform', `rotate(${(h % 1) * 360} 20 20)`);
          label.textContent = hhmm(h);
          const r0 = el.getBoundingClientRect();
          wrap.classList.toggle('is-on', r0.top < innerHeight * .3 && r0.bottom > innerHeight * .4);
          wrap.classList.toggle('is-dark', blocks.some(b => { const r = b.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40 && b.classList.contains('is-dark'); }));
        };
        const on = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        addEventListener('scroll', on, { passive: true });
        addEventListener('resize', on);
        if (ctx.reduced) wrap.classList.add('is-still');
      },
    },

    /* ===== Sau tiệc: giữ chỗ, lời chúc, mừng cưới ===== */
    {
      id: 'sau-tiec', kind: 'finale', label: 'Giữ chỗ và lời chúc', provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => {
        const { texts: t, accounts, names: n } = ctx;
        const s = sky(22);
        return html`
        <div class="lt-after" style="--sky:${s.bg}">
          <h2 class="lt-after-h">${t.afterTitle}</h2>
          <section class="lt-rsvp" id="giu-cho" aria-label="Giữ chỗ">
            <p class="lt-lead">${t.rsvpLead}</p>
            ${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Giữ chỗ', note: false, wish: false })}
          </section>
          <section class="lt-wishes" aria-labelledby="lt-w-h">
            <h3 id="lt-w-h">${t.wishesTitle}</h3>
            ${wishForm(ctx, { submit: 'Gửi lời chúc', placeholder: 'Viết đôi dòng gửi hai bạn…' })}
            ${wishList(ctx)}
          </section>
          ${ctx.has('gift') ? html`
          <section class="lt-gift" aria-labelledby="lt-g-h">
            <h3 id="lt-g-h">${t.giftTitle}</h3>
            ${accounts.map(a => html`
              <article class="lt-acc">
                ${qrUrl(a, 'Mung cuoi') ? html`<img class="lt-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="128" height="128">` : ''}
                <div><h4>${a.who}</h4><p>${a.bank}</p><p class="lt-num">${a.number}</p><p>${a.name}</p>
                <button type="button" class="sh-btn lt-ghost" data-copy="${a.number}">Chép số</button></div>
              </article>`)}
          </section>` : ''}
          <p class="lt-end">${n.first} và ${n.second}</p>
        </div>
        <a class="lt-keep" href="#giu-cho">Giữ chỗ</a>`;
      },
      mount(el, ctx) {
        if (ctx.guest) el.querySelectorAll('img.lt-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
        const keep = el.querySelector('.lt-keep'), card = el.querySelector('#giu-cho');
        new IntersectionObserver(([e]) => keep.classList.toggle('is-off', e.isIntersecting), { threshold: .2 }).observe(card);
        ctx.on('rsvp', () => card.classList.add('is-sent'));
      },
    },
  ],
});
