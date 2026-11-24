// Mẫu "Chiều Sâu" (bản thử màn bìa): ảnh cưới thành bìa tạp chí thời trang. Mỗi ảnh có ba lớp:
//   nền (ảnh gốc) — chữ khổng lồ — người (lớp tách nền làm sẵn lúc tải ảnh lên, *-nguoi.webp).
//   Đầu cặp đôi che một phần chữ, như bìa Vogue. Cuộn thì ba lớp trôi ba tốc độ: ảnh có chiều sâu thật.
//   "Nắng Hiên": nắng qua cửa lá sách rơi chéo lên ảnh, lệch nhau trên từng lớp (vì chúng ở độ sâu khác nhau),
//   góc nắng đổi theo cuộn như buổi chiều trôi; chạm ảnh thì cửa mở, nắng tràn.
//   Thông tin (ngày, giờ, nơi) luôn là chữ thật, rõ, ở mép dưới; màn đầu có đủ tên, ngày, nơi (H1).
// Lite: ba lớp đứng yên (vẫn giữ hiệu ứng chữ sau lưng), không nắng chuyển động.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, parts } from '@sayhello/engine';

const WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const hm = iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; };
const cut = src => String(src || '').replace(/\.(jpe?g|png|webp)$/i, '-nguoi.webp');
const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

/** Một trang bìa ba lớp: big = chữ khổng lồ (mảng dòng), foot = thông tin chữ nhỏ ở mép dưới */
const page = (src, alt, big, foot, k) => html`
  <section class="cs-page" data-k="${k}">
    <div class="cs-frame" style="--cut:url('${cut(src)}')">
      <img class="cs-bg" src="${src}" alt="${alt}" ${k ? html`loading="lazy"` : html`fetchpriority="high"`} decoding="async">
      <p class="cs-big" aria-hidden="true">${big.map(l => html`<span>${l}</span>`)}</p>
      <img class="cs-fg" src="${cut(src)}" alt="" aria-hidden="true" ${k ? html`loading="lazy"` : ''} decoding="async">
      <i class="cs-sun" aria-hidden="true"></i>
      <div class="cs-foot">${foot}</div>
    </div>
  </section>`;

export default defineTheme({
  id: 'chieu-sau',
  name: 'Chiều Sâu',
  version: '0.1.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'than-mat',
  themeColor: '#1d1a17',
  fonts: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wdth,wght@0,62.5..100,300..800;1,62.5..100,300..500&family=Inter:wght@400;500;600&display=swap&subset=vietnamese',
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional' },
  slots: { images: { album: { min: 3, ideal: 8, max: 30, label: 'Ảnh có người: hệ thống tự tách người khỏi nền' } } },
  palettes: [{ id: 'nang-chieu', name: 'Nắng chiều', swatch: ['#1d1a17', '#f3ebdd'] }],
  defaults: { texts: { rsvpLead: 'Báo giúp chúng mình bạn có tới không nhé.', wishesTitle: 'Lời chúc', giftTitle: 'Mừng cưới' } },

  scenes: [
    {
      id: 'bia', label: 'Bìa', provides: ['when', 'where', 'album'],
      render: ctx => {
        const { names: n, date, city, events, main, album, captions, guest } = ctx;
        const p = parts(date);
        const lunar = events.find(e => /^nhằm|âm lịch/i.test(e.lunar || ''))?.lunar;
        const ev = main || events[0];
        const pick = i => album[i % Math.max(1, album.length)];
        return html`
        ${page(pick(0), n.pair, [n.first, n.second], html`
          <p class="cs-to">Gửi ${guest()}</p>
          <p class="cs-names">${n.first} và ${n.second}</p>
          <p class="cs-when"><b>${p ? `${WD[p.wd]}, ${p.d} tháng ${p.mo} năm ${p.y}` : ''}</b>${lunar ? html`<span>${lunar}</span>` : ''}</p>
          ${ev ? html`<p class="cs-where">${ev.title} lúc ${hm(ev.date)}<br>${ev.venue || city}</p>` : ''}`, 0)}
        ${page(pick(1), captions[1] || n.pair, p ? [`${p.d}.${p.mo}`] : [''], html`
          <p class="cs-when"><b>${p ? `${WD[p.wd]}, ${p.d} tháng ${p.mo} năm ${p.y}` : ''}</b>${lunar ? html`<span>${lunar}</span>` : ''}</p>`, 1)}
        ${page(pick(2), captions[2] || n.pair, ev ? [hm(ev.date)] : [''], html`
          ${events.map((e, i) => html`<p class="cs-ev" data-ev="${i}"><b>${hm(e.date)} ${e.title}</b><span>${e.venue || ''}${e.address ? html`<br>${br(e.address)}` : ''}</span></p>`)}
          <p class="cs-acts"><a class="cs-btn" href="#tra-loi">Trả lời</a>${ctx.places[0] ? html`<a class="cs-btn cs-ghost" href="${ctx.places[0].url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}</p>`, 2)}`;
      },
      mount(el, ctx) {
        const root = document.documentElement;
        const pages = [...el.querySelectorAll('.cs-page')];
        // Đặt chữ khổng lồ ngay sau đầu người: đọc lớp người, tìm hàng có người đầu tiên (đỉnh đầu) và tâm ngang
        const place = pg => {
          const fg = pg.querySelector('.cs-fg'), bg = pg.querySelector('.cs-bg'), big = pg.querySelector('.cs-big');
          if (!fg.naturalWidth) { pg.classList.add('no-fg'); return; }
          try {
            const W = 96, H = Math.round(W * fg.naturalHeight / fg.naturalWidth);
            const c = document.createElement('canvas'); c.width = W; c.height = H;
            const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(fg, 0, 0, W, H);
            const d = g.getImageData(0, 0, W, H).data;
            let top = -1, minX = W, maxX = 0;
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 140) { if (top < 0) top = y; if (y < top + H * .12) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } }
            if (top < 0) { pg.classList.add('no-fg'); return; }
            // ảnh phủ kín khung (object-fit: cover): đổi toạ độ ảnh sang toạ độ khung
            const fr = pg.querySelector('.cs-frame').getBoundingClientRect();
            // khung ảnh: kín màn (điện thoại) hoặc cột dọc giữa màn (màn rộng); đo theo chính ô ảnh, bỏ biến đổi cuộn
            const box = { left: bg.offsetLeft, top: bg.offsetTop, width: bg.offsetWidth, height: bg.offsetHeight };
            const s = Math.max(box.width / fg.naturalWidth, box.height / fg.naturalHeight);
            const ox = box.left + (box.width - fg.naturalWidth * s) / 2, oy = box.top + (box.height - fg.naturalHeight * s) / 2;
            const headY = oy + (top / H) * fg.naturalHeight * s;
            const cx = ox + ((minX + maxX) / 2 / W) * fg.naturalWidth * s;
            pg.style.setProperty('--head', `${Math.round(headY)}px`);
            pg.style.setProperty('--cx', `${Math.round(cx)}px`);
            // cỡ chữ khổng lồ: dòng dài nhất vừa 94% bề ngang, tổng các dòng không quá 40% chiều cao khung
            const spans = [...big.children];
            big.style.setProperty('--fs', '100px');
            const w = Math.max(...spans.map(x => x.offsetWidth), 1);
            let fs = Math.min(fr.width * .94 / w * 100, fr.height * .4 / (spans.length * .8), 420);
            if (innerWidth >= 900) fs = Math.min(fs, fr.height * .3);
            // đầu người sát mép trên: thu chữ cho vừa khoảng trống phía trên đầu (chừa 20px), tối thiểu 56px;
            // vẫn không vừa thì hạ chữ xuống (đầu che nhiều hơn một chút)
            const room = (headY - 20) / (spans.length * .8 - .24);
            fs = Math.max(56, Math.min(fs, room));
            const need = fs * (spans.length * .8 - .24) + 20;
            if (headY < need) pg.style.setProperty('--head', `${Math.round(need)}px`);
            big.style.setProperty('--fs', `${Math.round(fs)}px`);
            void bg; void big;
          } catch { pg.classList.add('no-fg'); }
        };
        const placeAll = () => pages.forEach(pg => { const fg = pg.querySelector('.cs-fg'); fg.complete ? place(pg) : fg.addEventListener('load', () => place(pg), { once: true }); });
        pages.forEach(pg => pg.querySelector('.cs-fg').addEventListener('error', () => pg.classList.add('no-fg'), { once: true }));
        placeAll();
        addEventListener('resize', placeAll);
        document.fonts?.ready.then(placeAll);
        if (ctx.reduced) return;

        // Chiều sâu theo cuộn: mỗi trang cao hơn màn hình, khung ảnh dính; nền trôi chậm, chữ trôi vừa, người trôi nhanh.
        // Nắng: góc dải sáng đổi theo tiến độ cuộn toàn bìa (chiều → hoàng hôn), lệch nhau giữa các lớp.
        root.classList.add('cs-move');
        let raf = 0;
        const update = () => {
          raf = 0;
          const vh = innerHeight;
          pages.forEach((pg, k) => {
            const r = pg.getBoundingClientRect();
            const p = Math.max(-1, Math.min(1, -r.top / Math.max(1, r.height - vh) * 2 - 1)); // -1 → 1 trong lúc trang dính
            pg.style.setProperty('--p', p.toFixed(4));
          });
          const all = el.getBoundingClientRect();
          const day = Math.max(0, Math.min(1, -all.top / Math.max(1, all.height - vh)));
          root.style.setProperty('--day', day.toFixed(4));
        };
        const on = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        addEventListener('scroll', on, { passive: true });
        addEventListener('resize', on);
        // Chạm ảnh: cửa lá sách mở, nắng tràn (chạm lần nữa thì khép)
        pages.forEach(pg => pg.querySelector('.cs-frame').addEventListener('click', e => { if (e.target.closest('a, button')) return; pg.classList.toggle('is-open'); }));
      },
    },

    {
      id: 'tra-loi', kind: 'finale', label: 'Trả lời', provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => {
        const { texts: t, accounts, names: n } = ctx;
        return html`
        <div class="cs-after">
          <h2 class="cs-h">Bạn sẽ tới chứ?</h2>
          <p class="cs-lead">${t.rsvpLead}</p>
          ${rsvpForm(ctx, { yes: 'Mình sẽ tới', no: 'Tiếc quá, không tới được', submit: 'Gửi trả lời', note: false, wish: false })}
          <h2 class="cs-h cs-h2">${t.wishesTitle}</h2>
          ${wishForm(ctx, { submit: 'Gửi lời chúc', placeholder: 'Viết đôi dòng gửi hai bạn…' })}
          ${wishList(ctx)}
          ${ctx.has('gift') ? html`<h2 class="cs-h cs-h2">${t.giftTitle}</h2>${accounts.map(a => html`
            <article class="cs-acc">${qrUrl(a, 'Mung cuoi') ? html`<img class="cs-qr" data-qr="${a.qr ? '' : '1'}" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="120" height="120">` : ''}
              <div><h3>${a.who}</h3><p>${a.bank}</p><p class="cs-num">${a.number}</p><p>${a.name}</p></div></article>`)}` : ''}
          <p class="cs-end">${n.first} và ${n.second}</p>
        </div>`;
      },
      mount(el, ctx) {
        if (ctx.guest) el.querySelectorAll('img.cs-qr[data-qr="1"]').forEach(img => { const u = new URL(img.src); u.searchParams.set('addInfo', ('Mung cuoi ' + plain(ctx.guest)).slice(0, 50)); img.src = u.href; });
      },
    },
  ],
});
