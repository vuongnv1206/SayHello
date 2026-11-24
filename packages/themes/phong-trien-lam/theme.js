// Mẫu "Phòng Triển Lãm Đêm": ảnh cưới là các tác phẩm treo trong phòng tranh riêng của hai người.
//   Bìa: bức tường tối có tên triển lãm, khách bật công tắc đèn để vào.
//   Phòng tranh (3D, three.js): đi dọc hành lang, đèn rọi bật dần trước mỗi bức ảnh; chạm ảnh để bước vào trong ảnh;
//   tường thông tin ghi ngày khai mạc (ngày cưới); cuối phòng toàn bộ ảnh bay về ghép thành một trái tim.
//   Quầy lễ tân: dán chấm đỏ (giữ chỗ dự tiệc), quà mừng, sổ cảm tưởng. Mỗi khách giữ chỗ thắp thêm một bóng đèn.
// Động từ chuyển động: RỌI (đèn bật có chớp nhẹ). Không dùng hiệu ứng mờ dần trượt lên.
// Ảnh là nội dung chính: 6 đến 30 ảnh album, chú thích không bắt buộc, chuyện tình không bắt buộc.
// Mức lite (máy yếu, giảm chuyển động, mất WebGL): cùng HTML này hiện thành sách triển lãm phẳng.
// Chủ đề là bộ thông số: mỗi palette mang theo preset ánh sáng, chất liệu, sương cho cảnh 3D.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, fmt } from '@sayhello/engine';

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Danh sách điểm dừng trong phòng tranh: tên triển lãm, các tác phẩm, tường thông tin (sau tác phẩm thứ 2),
// chuyện tình nếu có (xen giữa các tác phẩm), trái tim ghép ảnh cuối phòng.
function stops(ctx) {
  const works = ctx.album.map((src, i) => ({ kind: 'work', src, i, cap: ctx.captions[i] || '' }));
  const story = ctx.has('story') ? ctx.story.map(s => ({ kind: 'text', s })) : [];
  const out = [{ kind: 'title' }];
  works.forEach((w, i) => {
    out.push(w);
    if (i === Math.min(1, works.length - 1)) out.push({ kind: 'info' });
    if (story.length && i >= 2 && i % 2 === 0) out.push(story.shift());
  });
  if (!works.length) out.push({ kind: 'info' });
  out.push(...story, { kind: 'finale' });
  return out;
}

function stopHtml(st, ctx) {
  const { names: n, date, city, events, places, say } = ctx;
  if (st.kind === 'title') return html`
    <li class="ptl-stop ptl-s-title" data-stop="title">
      <div class="ptl-plate ptl-vinyl">
        <p class="ptl-kind">Triển lãm ảnh cưới</p>
        <h2 class="ptl-names"><span>${n.first}</span><span>${n.second}</span></h2>
        <p class="ptl-dates">${fmt.short(date)}${city ? html`<br>${city}` : ''}</p>
        <p class="ptl-welcome">Kính mời ${ctx.guest()} vào xem.</p>
      </div>
    </li>`;
  if (st.kind === 'work') return html`
    <li class="ptl-stop ptl-s-work" data-stop="work" data-i="${st.i}" data-src="${st.src}">
      <figure class="ptl-work">
        <img src="${st.src}" alt="${st.cap || `Ảnh cưới số ${st.i + 1}`}" loading="${st.i < 2 ? 'eager' : 'lazy'}" decoding="async">
        <figcaption class="ptl-plate ptl-label">
          <b>${n.first} và ${n.second}</b>
          <span class="ptl-cap">${st.cap || 'Không đề'}</span>
          <small>Ảnh cưới, ${fmt.short(date).slice(-4)}</small>
          <small class="ptl-no">Số ${st.i + 1}</small>
        </figcaption>
      </figure>
    </li>`;
  if (st.kind === 'info') return html`
    <li class="ptl-stop ptl-s-info" data-stop="info">
      <div class="ptl-plate ptl-wall">
        <h2>Ngày khai mạc</h2>
        <ol class="ptl-evs">
          ${events.map((e, i) => html`<li data-ev="${i}">
            <b>${e.title}</b>
            <span class="ptl-time">${fmt.time(e.date)}</span>
            <span>${fmt.long(e.date).replace(' · ', ', ')}</span>
            ${e.lunar ? html`<span class="ptl-dim">${e.lunar}</span>` : ''}
            ${e.venue ? html`<span>${e.venue}</span>` : ''}
            ${e.address ? html`<span class="ptl-dim">${br(e.address)}</span>` : ''}
            ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">${say('addCalendar')}</a>` : ''}
          </li>`)}
        </ol>
        ${places.length ? html`<p class="ptl-maps">${places.map(p => html`<a href="${p.url}" target="_blank" rel="noopener">Chỉ đường tới ${p.label.toLowerCase()}</a>`)}</p>` : ''}
      </div>
    </li>`;
  if (st.kind === 'text') return html`
    <li class="ptl-stop ptl-s-text" data-stop="text">
      <div class="ptl-plate ptl-wall ptl-story">
        ${st.s.year ? html`<p class="ptl-year">${st.s.year}</p>` : ''}
        ${st.s.title ? html`<h2>${st.s.title}</h2>` : ''}
        <p>${st.s.text || ''}</p>
      </div>
    </li>`;
  return html`
    <li class="ptl-stop ptl-s-finale" data-stop="finale">
      <div class="ptl-plate ptl-vinyl ptl-end">
        <p class="ptl-kind">Tác phẩm cuối</p>
        <h2>Một trái tim, ghép từ ${ctx.album.length || 'những'} khoảnh khắc</h2>
        <p>Phần còn lại của triển lãm là ngày ${fmt.short(date)}. Mời bạn tới xem tận mắt.</p>
        <a class="ptl-go" href="#le-tan">Dán chấm đỏ giữ chỗ</a>
      </div>
    </li>`;
}

export default defineTheme({
  id: 'phong-trien-lam',
  name: 'Phòng Triển Lãm Đêm',
  version: '1.0.0',
  tier: 'cinematic',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#0b0e0e',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@200;300;400;600&display=swap',
  libs: ['three-post'],
  gateMs: 1100,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', story: 'optional', gift: 'optional', guestbook: 'optional' },
  slots: {
    images: { album: { min: 6, ideal: 14, max: 30, label: 'Ảnh treo trong phòng tranh, theo thứ tự đi xem' } },
    story: { optional: true, maxItems: 6 },
  },
  // Mỗi bảng màu là một preset không khí: biến CSS cho phần chữ, preset cho cảnh 3D (gallery3d.js đọc)
  palettes: [
    { id: 'xam-luc', name: 'Tường xám lục', swatch: ['#2e3b37', '#d23a2a'],
      preset: { wall: '#34433e', floor: '#1b1c1b', void: '#0b0e0e', light: '#ffe2b8', frame: '#141414', mat: '#f2efe9', fog: .05, exposure: 1.05, bloom: .55, env: .22 } },
    { id: 'nhung-man', name: 'Nhung mận', swatch: ['#3a2230', '#d23a2a'],
      vars: { '--wall': '#3a2230', '--void': '#0e0709' },
      preset: { wall: '#4a2a3a', floor: '#191214', void: '#0e0709', light: '#ffd6a8', frame: '#2b1b12', mat: '#f4ece4', fog: .055, exposure: 1.1, bloom: .6, env: .2 } },
    { id: 'thach-cao', name: 'Thạch cao trắng', swatch: ['#e7e3dc', '#c7362a'],
      vars: { '--wall': '#e7e3dc', '--void': '#cfcac1', '--ink-on-wall': '#1c1f22', '--label': '#ffffff' },
      preset: { wall: '#e9e5de', floor: '#8f8a80', void: '#d4cfc6', light: '#fff3e2', frame: '#f6f4ef', mat: '#ffffff', fog: .028, exposure: .82, bloom: .18, env: .55, light_ui: true } },
  ],
  defaults: { texts: {} },

  scenes: [
    /* ===== Bìa: bức tường tối, công tắc đèn ===== */
    {
      id: 'sanh', kind: 'gate',
      render: ({ names: n, date, city, guest }) => html`
        <div class="ptl-gwall" aria-hidden="true"><i class="ptl-gglow"></i></div>
        <div class="ptl-gtitle">
          <p class="ptl-kind">Triển lãm ảnh cưới</p>
          <h1 class="ptl-names"><span>${n.first}</span><span>${n.second}</span></h1>
          <p class="ptl-dates">Khai mạc ${fmt.short(date)}${city ? html`<br>${city}` : ''}</p>
          <p class="ptl-to">Kính mời ${guest()}</p>
        </div>
        <div class="ptl-switch-wrap">
          <button class="ptl-switch" type="button" aria-label="Bật đèn phòng tranh để mở thiệp" aria-pressed="false"><i class="ptl-rocker"></i></button>
          <p class="ptl-hint">Bật đèn để vào</p>
        </div>`,
      mount(el, ctx) {
        const sw = el.querySelector('.ptl-switch');
        let done = false, y0 = null;
        const on = () => {
          if (done) return; done = true;
          sw.setAttribute('aria-pressed', 'true');
          el.classList.add('is-on');
          // iOS chỉ cho đọc con quay khi xin quyền trong một thao tác của khách
          try { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); } catch {}
          clickSound();
          setTimeout(() => ctx.open(), ctx.reduced ? 120 : 700);
        };
        sw.addEventListener('pointerdown', e => { y0 = e.clientY; });
        sw.addEventListener('pointermove', e => { if (y0 != null && e.clientY - y0 > 24) on(); });
        sw.addEventListener('pointerup', () => { y0 = null; });
        sw.addEventListener('click', on);
      },
    },

    /* ===== Phòng tranh ===== */
    {
      id: 'phong', label: 'Phòng tranh', provides: ['when', 'where', 'map', 'album', 'story'],
      render: ctx => html`
        <div class="ptl-stage" aria-hidden="true">
          <canvas class="ptl-canvas"></canvas>
          <div class="ptl-css"></div>
          <div class="ptl-veil"><p>Đang bật đèn…</p></div>
          <div class="ptl-inside-ui"><button type="button" class="ptl-out" tabindex="-1">Ra khỏi ảnh</button></div>
          <p class="ptl-hint3d">Vuốt để đi dọc phòng tranh. Chạm vào một bức ảnh để bước vào trong.</p>
          <div class="ptl-rail"><i></i></div>
        </div>
        <ol class="ptl-track">${stops(ctx).map(s => stopHtml(s, ctx))}</ol>`,
      motion: {
        async cinematic(el, ctx) { await start(el, ctx, 'cinematic'); },
        async standard(el, ctx) { await start(el, ctx, 'standard'); },
        lite() {}, // sách triển lãm phẳng, chỉ CSS
      },
    },

    /* ===== Quầy lễ tân: chấm đỏ, quà mừng, sổ cảm tưởng ===== */
    {
      id: 'le-tan', label: 'Giữ chỗ và lời chúc', provides: ['rsvp', 'gift', 'guestbook'],
      render: ctx => html`
        <div class="ptl-desk">
          <div class="ptl-desk-rsvp">
            <h2>Giữ chỗ dự khai mạc</h2>
            <p class="ptl-lead">Ở phòng tranh, chấm đỏ cạnh tác phẩm nghĩa là đã có người giữ. Dán một chấm đỏ để báo chúng mình bạn sẽ tới.</p>
            <div class="ptl-dot-slot" aria-hidden="true"><i class="ptl-dot"></i></div>
            ${rsvpForm(ctx, { yes: 'Tôi sẽ tới', no: 'Tiếc quá, tôi bận', submit: 'Dán chấm đỏ' })}
          </div>
          ${ctx.has('gift') ? html`
          <div class="ptl-desk-gift">
            <h2>Gửi quà mừng</h2>
            <div class="ptl-accs">${ctx.accounts.map(a => {
              const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
              const qr = qrUrl(a, note);
              return html`<div class="ptl-acc">
                ${qr ? html`<img src="${qr}" alt="Mã QR chuyển khoản tới ${a.who}" loading="lazy" width="140" height="140">` : ''}
                <p><b>${a.who}</b><span>${a.bank}</span><span class="ptl-num">${a.number}</span><span>${a.name}</span></p>
                <button type="button" class="ptl-copy" data-copy="${a.number}">Chép số tài khoản</button>
              </div>`;
            })}</div>
          </div>` : ''}
          <div class="ptl-desk-book">
            <h2>Sổ cảm tưởng</h2>
            ${wishForm(ctx, { submit: 'Ghi vào sổ' })}
            ${wishList(ctx)}
          </div>
        </div>`,
      mount(el, ctx) {
        ctx.on('rsvp', x => { if (x?.attend !== 'Không') el.querySelector('.ptl-dot-slot .ptl-dot')?.classList.add('is-on'); });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
        }));
      },
    },
  ],
});

/* ---------- Tiếng công tắc tự tạo (Web Audio), bị chặn thì im lặng ---------- */
let audio;
function clickSound() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, buf = a.createBuffer(1, Math.ceil(a.sampleRate * .06), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / a.sampleRate * 90);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.value = 2400; g.gain.value = .6;
    src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
  } catch {}
}

// Nạp cảnh 3D sau khi mở bìa. Mọi lỗi (không có WebGL, CDN chặn, mất ngữ cảnh) đều rơi về sách triển lãm phẳng.
async function start(el, ctx, tier) {
  try {
    const url = new URL('./gallery3d.js', import.meta.url).href;
    const { runGallery } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    await runGallery(el, ctx, { tier, palettes: ctx.theme.palettes });
  } catch (e) {
    console.warn('[phòng tranh] dùng bản phẳng:', e?.message || e);
    document.documentElement.classList.remove('ptl-3d');
  }
}
