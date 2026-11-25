// Mẫu "Hồ Gương" bản 2: khách nhìn từ trên thuyền xuống mặt hồ lặng. Ảnh cưới nằm dưới nước, khách VỚT
// từng tấm lên (giữ tay trên ảnh, hoặc dừng lại đủ lâu), ảnh đứng dậy trên mặt nước cùng bóng phản chiếu.
//   Bìa: mặt nước lặng, tên hai người chỉ là bóng dưới nước; chạm mặt nước để gợn sóng và vào thiệp.
//   Hồ (3D): camera trôi theo đường cong; cọc đo nước khắc ngày cưới (mực nước dâng thay đồng hồ đếm ngược);
//   bến gỗ ghi giờ lễ, chỉ đường; ngón tay vẽ gợn sóng lên mặt nước; đèn hoa đăng của các khách trước trôi trên hồ.
//   Kết: giữ tay để mặt nước lặng hẳn thành gương, đèn hoa đăng bay lên.
//   Bến (DOM): thả hoa đăng giữ chỗ, quà mừng, sổ lời chúc.
// Động từ chuyển động: VỚT. Ảnh dưới nước cùng một sắc nước nên bộ ảnh lẫn lộn màu vẫn liền một mạch;
// vớt lên rồi thì ảnh giữ nguyên màu gốc.
// Mức lite (máy yếu, giảm chuyển động, mất WebGL): cùng HTML thành trang mặt nước phẳng, ảnh có bóng phản chiếu.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, fmt } from '@sayhello/engine';

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Thứ tự điểm dừng, tự co giãn theo số ảnh: 6 ảnh đầu đứng riêng, phần còn lại thành từng chùm 3 ảnh.
export function plan(ctx) {
  const works = ctx.album.map((src, i) => ({ src, i, cap: ctx.captions[i] || '' }));
  const seq = [];
  const singles = works.length <= 8 ? works.length : 6;
  works.slice(0, singles).forEach(w => seq.push({ kind: 'work', hang: 'single', works: [w] }));
  for (let i = singles; i < works.length; i += 3) seq.push({ kind: 'work', hang: 'fan', works: works.slice(i, i + 3) });
  const story = ctx.has('story') ? ctx.story.map(s => ({ kind: 'text', s })) : [];
  const out = [{ kind: 'title' }];
  seq.forEach((s, k) => {
    out.push(s);
    if (k === 0) out.push({ kind: 'gauge' });
    if (k === Math.min(2, seq.length - 1)) out.push({ kind: 'jetty' });
    if (story.length && k >= 3 && k % 2 === 1) out.push(story.shift());
  });
  if (!seq.length) out.push({ kind: 'gauge' }, { kind: 'jetty' });
  out.push(...story, { kind: 'finale' });
  return out;
}

const photo = (w, eager) => html`
  <figure class="hg-photo">
    <img src="${w.src}" alt="${w.cap || `Ảnh cưới số ${w.i + 1}`}" data-i="${w.i}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    <img class="hg-refl" src="${w.src}" alt="" aria-hidden="true" loading="lazy" decoding="async">
  </figure>`;

function stopHtml(st, ctx) {
  const { names: n, date, events, places, say } = ctx;
  if (st.kind === 'title') return html`
    <li class="hg-stop hg-s-title" data-stop="title">
      <div class="hg-plate hg-names-plate">
        <h2 class="hg-names">${n.first}<br>${n.second}</h2>
        <p class="hg-welcome">Kính mời ${ctx.guest()} lên thuyền.</p>
      </div>
    </li>`;
  if (st.kind === 'work') return html`
    <li class="hg-stop hg-s-work hg-h-${st.hang}" data-stop="work" data-hang="${st.hang}">
      <div class="hg-imgs">${st.works.map(w => photo(w, w.i < 2))}</div>
      <p class="hg-plate hg-cap">${st.works.map(w => w.cap).filter(Boolean).join('. ') || `Ảnh số ${st.works.map(w => w.i + 1).join(', ')}`}</p>
    </li>`;
  if (st.kind === 'gauge') {
    const p = fmt.short(date).split('.');
    return html`
    <li class="hg-stop hg-s-gauge" data-stop="gauge">
      <div class="hg-plate hg-gauge">
        <p class="hg-g-day">${p[0]}</p>
        <p class="hg-g-month">tháng ${+p[1]}, ${p[2]}</p>
        <p class="hg-g-week">${fmt.long(date).split(' · ')[0]}</p>
        <p class="hg-g-left" data-days="${date}">Mực nước đang dâng dần tới ngày cưới</p>
      </div>
    </li>`;
  }
  if (st.kind === 'jetty') return html`
    <li class="hg-stop hg-s-jetty" data-stop="jetty">
      <div class="hg-plate hg-board">
        <h2>Bến đón khách</h2>
        <ol class="hg-evs">
          ${events.map((e, i) => html`<li data-ev="${i}">
            <span class="hg-time">${fmt.time(e.date)}</span>
            <b>${e.title}</b>
            ${e.venue ? html`<span>${e.venue}</span>` : ''}
            ${e.address ? html`<span class="hg-dim">${br(e.address)}</span>` : ''}
            ${e.lunar ? html`<span class="hg-dim">${e.lunar}</span>` : ''}
            ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">${say('addCalendar')}</a>` : ''}
          </li>`)}
        </ol>
        ${places.length ? html`<p class="hg-maps">${places.map(p => html`<a href="${p.url}" target="_blank" rel="noopener">Chỉ đường tới ${p.label}</a>`)}</p>` : ''}
      </div>
    </li>`;
  if (st.kind === 'text') return html`
    <li class="hg-stop hg-s-text" data-stop="text">
      <div class="hg-plate hg-note">
        ${st.s.year ? html`<p class="hg-year">${st.s.year}</p>` : ''}
        ${st.s.title ? html`<h2>${st.s.title}</h2>` : ''}
        <p>${st.s.text || ''}</p>
      </div>
    </li>`;
  return html`
    <li class="hg-stop hg-s-finale" data-stop="finale">
      <div class="hg-plate hg-end">
        <h2>${n.first} và ${n.second}</h2>
        <p>Hẹn bạn bên mặt nước ngày ${fmt.short(date)}.</p>
        <button type="button" class="hg-still" data-sh-still><i aria-hidden="true"></i><span>Giữ tay để mặt nước lặng</span></button>
        <a class="hg-go" href="#ben">Thả hoa đăng giữ chỗ</a>
      </div>
    </li>`;
}

export default defineTheme({
  id: 'ho-guong',
  name: 'Hồ Gương',
  version: '2.0.0',
  tier: 'cinematic',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#d6dcd8',
  fonts: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,500;12..96,700&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  libs: ['three-post'],
  gateMs: 1200,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', story: 'optional', gift: 'optional', guestbook: 'optional' },
  slots: {
    images: { album: { min: 6, ideal: 12, max: 30, label: 'Ảnh nằm dưới mặt hồ, khách vớt lên theo thứ tự này' } },
    story: { optional: true, maxItems: 6 },
  },
  // Mỗi bảng màu là một preset không khí cho cảnh 3D: trời, nước, sương, đèn
  palettes: [
    { id: 'suong-som', name: 'Sương sớm', swatch: ['#5d7673', '#e2522b'],
      preset: { zenith: '#b9c4c3', horizon: '#dfe4e0', sun: '#fff6e8', water: '#5d7673', deep: '#1c2a2b', fog: '#d3d9d5', fogD: .028, lantern: '#e2522b', bamboo: '#9a8a63', wind: .7, boost: 1.1, bloom: .3, exposure: 1.0, night: 0 } },
    { id: 'mua-bong-may', name: 'Mưa bóng mây', swatch: ['#46585a', '#e2522b'],
      vars: { '--mist': '#aab5b2', '--water': '#46585a', '--deep': '#18211f' },
      preset: { zenith: '#8b9696', horizon: '#b8c1be', sun: '#eef0ea', water: '#46585a', deep: '#18211f', fog: '#a9b3b0', fogD: .036, lantern: '#e2522b', bamboo: '#857857', wind: 1.1, boost: 1.0, bloom: .22, exposure: .95, night: 0 } },
    { id: 'dem-trang', name: 'Đêm trăng', swatch: ['#132a3c', '#ff7a3d'],
      vars: { '--mist': '#0f1c2e', '--water': '#132a3c', '--deep': '#08121c', '--ink': '#e8eef2', '--paper': '#16283a', '--water-ink': '#e8eef2', '--sh-accent': '#ff7a3d', '--sh-accent-ink': '#08121c', '--sh-soft': 'rgba(232, 238, 242, .24)', '--sky-top': '#081220', '--input-bg': '#102030', '--hint-bg': 'rgba(8, 18, 32, .82)' },
      preset: { zenith: '#070f1c', horizon: '#1c3048', sun: '#e8eef2', water: '#132a3c', deep: '#08121c', fog: '#132236', fogD: .03, lantern: '#ff7a3d', bamboo: '#5c5440', wind: .5, boost: 1.25, bloom: .45, exposure: 1.05, night: 1 } },
  ],
  defaults: { texts: {} },

  scenes: [
    /* ===== Bìa: mặt nước lặng, tên chỉ còn là bóng dưới nước ===== */
    {
      id: 'mat-nuoc', kind: 'gate',
      render: ({ names: n, date, guest }) => html`
        <div class="hg-gsky" aria-hidden="true"></div>
        <div class="hg-gwater" aria-hidden="true">
          <p class="hg-gref">${n.first}<br>${n.second}</p>
          <i class="hg-ring"></i>
        </div>
        <div class="hg-gtext">
          <p class="hg-to">Kính mời ${guest()}</p>
          <h1 class="hg-gname">${n.first} và ${n.second}, ${fmt.short(date)}</h1>
        </div>
        <button class="hg-touch" type="button" aria-label="Chạm mặt nước để mở thiệp"><span>Chạm mặt nước</span></button>`,
      mount(el, ctx) {
        const btn = el.querySelector('.hg-touch'), ring = el.querySelector('.hg-ring');
        let done = false;
        const go = e => {
          if (done) return; done = true;
          // iOS chỉ cho đọc con quay khi xin quyền trong một cú chạm
          try { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); } catch {}
          const r = el.getBoundingClientRect();
          const x = e?.clientX ? e.clientX - r.left : r.width / 2, y = e?.clientY ? e.clientY - r.top : r.height * .62;
          ring.style.setProperty('--x', x + 'px'); ring.style.setProperty('--y', y + 'px');
          el.classList.add('is-touched');
          dropSound();
          setTimeout(() => ctx.open(), ctx.reduced ? 150 : 900);
        };
        btn.addEventListener('click', go);
        el.querySelector('.hg-gwater').addEventListener('click', go);
      },
    },

    /* ===== Mặt hồ ===== */
    {
      id: 'ho', label: 'Mặt hồ', provides: ['when', 'where', 'map', 'album', 'story', 'countdown'],
      render: ctx => html`
        <div class="hg-stage" aria-hidden="true">
          <canvas class="hg-canvas"></canvas>
          <div class="hg-css"></div>
          <div class="hg-veil"><p>Sương đang tan…</p></div>
          <p class="hg-hint3d">Vuốt để thuyền trôi. Giữ tay trên ảnh dưới nước để vớt lên, chạm mặt nước để gợn sóng.</p>
        </div>
        <ol class="hg-track">${plan(ctx).map(s => stopHtml(s, ctx))}</ol>
        <dialog class="hg-view" aria-label="Xem ảnh">
          <figure><img alt=""><img class="hg-refl" alt="" aria-hidden="true"></figure>
          <button type="button" class="hg-v-prev" aria-label="Ảnh trước">‹</button>
          <button type="button" class="hg-v-next" aria-label="Ảnh sau">›</button>
          <button type="button" class="hg-v-close">Thả ảnh xuống nước</button>
        </dialog>`,
      mount(el, ctx) {
        // Mực nước dâng: số ngày còn lại tính ở trình duyệt (trang vẫn cache chung được)
        el.querySelectorAll('[data-days]').forEach(p => {
          const d = Math.ceil((new Date(p.dataset.days) - Date.now()) / 864e5);
          p.textContent = d > 1 ? `Còn ${d} ngày, mực nước dâng dần tới vạch ngày cưới` : d === 1 ? 'Ngày mai nước chạm vạch' : d === 0 ? 'Hôm nay nước chạm vạch' : 'Nước đã chạm vạch ngày cưới';
          p.closest('.hg-stop')?.style.setProperty('--fill', String(Math.max(.08, Math.min(1, 1 - d / 365))));
        });
        // Xem ảnh toàn màn hình (mọi mức, cả khi không có 3D)
        const dlg = el.querySelector('.hg-view'), imgs = [...el.querySelectorAll('.hg-track img[data-i]')];
        let cur = 0;
        const show = i => {
          cur = (i + imgs.length) % imgs.length;
          const src = imgs[cur].currentSrc || imgs[cur].src;
          dlg.querySelectorAll('figure img').forEach(im => { im.src = src; });
          dlg.querySelector('figure img').alt = imgs[cur].alt;
        };
        ctx.view = i => { if (!imgs.length) return; show(i); dlg.showModal?.(); };
        imgs.forEach((im, i) => im.addEventListener('click', () => ctx.view(i)));
        dlg.querySelector('.hg-v-prev').addEventListener('click', () => show(cur - 1));
        dlg.querySelector('.hg-v-next').addEventListener('click', () => show(cur + 1));
        dlg.querySelector('.hg-v-close').addEventListener('click', () => dlg.close());
        let x0 = null;
        dlg.addEventListener('pointerdown', e => { x0 = e.clientX; });
        dlg.addEventListener('pointerup', e => { if (x0 != null && Math.abs(e.clientX - x0) > 50) show(cur + (e.clientX < x0 ? 1 : -1)); x0 = null; });
        dlg.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
        // Bản phẳng: nút "giữ tay" làm mặt nước lặng ngay (hoặc kích hoạt qua bàn phím ở 3D)
        el.querySelector('.hg-track [data-sh-still]')?.addEventListener('click', e => { if (e.detail === 0 || !document.documentElement.classList.contains('hg-3d')) { el.classList.add('is-still'); ctx.emit('still'); } });
      },
      motion: {
        async cinematic(el, ctx) { await start(el, ctx, 'cinematic'); },
        async standard(el, ctx) { await start(el, ctx, 'standard'); },
        lite() {},
      },
    },

    /* ===== Bến: thả hoa đăng giữ chỗ, quà mừng, lời chúc ===== */
    {
      id: 'ben', label: 'Giữ chỗ và lời chúc', provides: ['rsvp', 'gift', 'guestbook'],
      render: ctx => html`
        <div class="hg-desk">
          <div class="hg-desk-rsvp">
            <h2>Thả một ngọn hoa đăng</h2>
            <p class="hg-lead">Mỗi khách nhận lời là một ngọn đèn trôi trên mặt hồ. Thả đèn của bạn để chúng mình giữ chỗ.</p>
            <div class="hg-lantern" aria-hidden="true"><i></i></div>
            ${rsvpForm(ctx, { yes: 'Tôi sẽ tới', no: 'Tiếc quá, tôi bận', submit: 'Thả hoa đăng' })}
          </div>
          ${ctx.has('gift') ? html`
          <div class="hg-desk-gift">
            <h2>Gửi quà mừng</h2>
            <div class="hg-accs">${ctx.accounts.map(a => {
              const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
              const qr = qrUrl(a, note);
              return html`<div class="hg-acc">
                ${qr ? html`<img src="${qr}" alt="Mã QR chuyển khoản tới ${a.who}" loading="lazy" width="132" height="132">` : ''}
                <p><b>${a.who}</b><span>${a.bank}</span><span class="hg-num">${a.number}</span><span>${a.name}</span></p>
                <button type="button" class="hg-copy" data-copy="${a.number}">Chép số tài khoản</button>
              </div>`;
            })}</div>
          </div>` : ''}
          <div class="hg-desk-book">
            <h2>Lời chúc theo đèn</h2>
            ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
            ${wishList(ctx)}
          </div>
        </div>`,
      mount(el, ctx) {
        ctx.on('rsvp', x => { if (x?.attend !== 'Không') el.querySelector('.hg-lantern')?.classList.add('is-off'); });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
        }));
      },
    },
  ],
});

/* ---------- Tiếng giọt nước (Web Audio), bị chặn thì im lặng ---------- */
let audio;
export function dropSound(vol = .5) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(900, a.currentTime); o.frequency.exponentialRampToValueAtTime(260, a.currentTime + .18);
    g.gain.setValueAtTime(vol * .35, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .35);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .4);
  } catch {}
}

// Nạp cảnh 3D sau khi mở bìa. Mọi lỗi đều rơi về bản phẳng.
async function start(el, ctx, tier) {
  try {
    const url = new URL('./lake3d.js', import.meta.url).href;
    const { runLake } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    await runLake(el, ctx, { tier, palettes: ctx.theme.palettes, dropSound });
  } catch (e) {
    console.warn('[hồ gương] dùng bản phẳng:', e?.message || e);
    document.documentElement.classList.remove('hg-3d', 'hg-ready', 'hg-portrait', 'hg-still');
  }
}
