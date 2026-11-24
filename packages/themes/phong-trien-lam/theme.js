// Mẫu "Phòng Triển Lãm Đêm": ảnh cưới là các tác phẩm treo trong phòng tranh riêng của hai người.
//   Bìa: bức tường tối, thấp thoáng bức ảnh đầu tiên; khách bật công tắc.
//   Phòng tranh (3D, three.js): tên triển lãm sáng lên trên tường; đi dọc hành lang qua nhiều kiểu treo
//   (ảnh đơn treo chếch, một bức treo dây giữa lối đi, một góc tường treo kín, một hộp đèn); khách chạm giữ
//   để tự "rọi" đèn pin lên ảnh; chạm ảnh để bước vào trong ảnh và vuốt sang ảnh khác.
//   Cuối phòng: quay lại nhìn cả hành lang, giữ công tắc lớn: đèn tắt hết rồi bật lần lượt về phía bức ảnh chính
//   treo khổ lớn ở tường cuối (chào màn).
//   Quầy lễ tân: dán chấm đỏ lên bức ảnh mình thích nhất để giữ chỗ dự tiệc; quà mừng; sổ cảm tưởng.
// Động từ chuyển động: RỌI (đèn bật có chớp nhẹ). Không dùng hiệu ứng mờ dần trượt lên.
// Ảnh là nội dung chính: 6 đến 30 ảnh album, chú thích và chuyện tình không bắt buộc.
// Mức lite (máy yếu, giảm chuyển động, mất WebGL): cùng HTML này thành sách triển lãm phẳng, ảnh được rọi khi cuộn tới.
// Chủ đề là bộ thông số: mỗi palette mang theo preset ánh sáng, chất liệu, sương cho cảnh 3D (gallery3d.js đọc).
import { defineTheme, html, br, rsvpForm, wishForm, wishList, fmt } from '@sayhello/engine';

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Kịch bản treo tranh, tự co giãn theo số ảnh. Ảnh đầu tiên là bức chính, để dành cho tường cuối.
//   single: một ảnh treo chếch; wire: treo dây giữa lối đi; salon: góc tường treo kín 3–5 ảnh; lightbox: hộp đèn.
export function plan(ctx) {
  const works = ctx.album.map((src, i) => ({ src, i, cap: ctx.captions[i] || '' }));
  const hero = works[0], rest = works.slice(1);
  const seq = [];
  const salonN = rest.length >= 10 ? 5 : rest.length >= 7 ? 3 : 0;
  const salonAt = salonN ? Math.floor(rest.length * .55) : -1;
  const wireAt = rest.length >= 5 ? Math.floor(rest.length * .3) : -1;
  for (let i = 0; i < rest.length; i++) {
    if (i === salonAt) { seq.push({ kind: 'work', hang: 'salon', works: rest.slice(i, i + salonN) }); i += salonN - 1; continue; }
    const hang = i === wireAt ? 'wire' : i === rest.length - 1 && rest.length >= 6 ? 'lightbox' : 'single';
    seq.push({ kind: 'work', hang, works: [rest[i]] });
  }
  const story = ctx.has('story') ? ctx.story.map(s => ({ kind: 'text', s })) : [];
  const out = [{ kind: 'title' }];
  seq.forEach((s, k) => {
    out.push(s);
    if (k === 0) out.push({ kind: 'info' });
    if (story.length && k >= 1 && k % 2 === 1) out.push(story.shift());
  });
  if (!seq.length) out.push({ kind: 'info' });
  out.push(...story, { kind: 'finale', hang: 'hero', works: hero ? [hero] : [] });
  return out;
}

const img = (w, eager) => html`<img src="${w.src}" alt="${w.cap || `Ảnh cưới số ${w.i + 1}`}" data-i="${w.i}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;

function label(st, ctx) {
  const { names: n } = ctx, ws = st.works;
  if (st.hang === 'salon') return html`
    <div class="ptl-plate ptl-label">
      <b>Góc tường của ${n.first} và ${n.second}</b>
      ${ws.map(w => html`<span>Số ${w.i + 1}${w.cap ? html`, <i>${w.cap}</i>` : ''}</span>`)}
    </div>`;
  const w = ws[0];
  return html`
    <div class="ptl-plate ptl-label">
      ${w.cap ? html`<b class="ptl-cap">${w.cap}</b>` : html`<b>${n.first} và ${n.second}</b>`}
      ${st.hang === 'lightbox' ? html`<small>Hộp đèn</small>` : st.hang === 'wire' ? html`<small>Treo giữa lối đi</small>` : ''}
      <small class="ptl-no">Số ${w.i + 1}</small>
    </div>`;
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
    <li class="ptl-stop ptl-s-work ptl-h-${st.hang}" data-stop="work" data-hang="${st.hang}">
      <div class="ptl-imgs">${st.works.map(w => img(w, w.i < 3))}</div>
      ${label(st, ctx)}
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
    <li class="ptl-stop ptl-s-finale" data-stop="finale" data-hang="hero">
      ${st.works.length ? html`<div class="ptl-imgs">${st.works.map(w => img(w, false))}</div>` : ''}
      <div class="ptl-plate ptl-vinyl ptl-end">
        <p class="ptl-kind">Tác phẩm chính</p>
        <h2>${n.first} và ${n.second}, ${fmt.short(date)}</h2>
        <button type="button" class="ptl-allon" data-sh-allon><i aria-hidden="true"></i><span>Giữ để bật toàn bộ đèn</span></button>
        <a class="ptl-go" href="#le-tan">Dán chấm đỏ giữ chỗ</a>
      </div>
    </li>`;
}

export default defineTheme({
  id: 'phong-trien-lam',
  name: 'Phòng Triển Lãm Đêm',
  version: '1.1.0',
  tier: 'cinematic',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#0b0e0e',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@200;300;400;600&display=swap',
  libs: ['three-post'],
  gateMs: 1100,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', story: 'optional', gift: 'optional', guestbook: 'optional' },
  slots: {
    images: { album: { min: 6, ideal: 14, max: 30, label: 'Ảnh treo trong phòng tranh. Ảnh đầu tiên là bức chính, treo khổ lớn ở tường cuối.' } },
    story: { optional: true, maxItems: 6 },
  },
  // Mỗi bảng màu là một preset không khí: biến CSS cho phần chữ, preset cho cảnh 3D.
  //   wash: ánh sáng chung (lạnh), light: đèn rọi tranh (ấm); tách hai nhiệt độ màu để tường không ngả vàng đục.
  palettes: [
    { id: 'xam-luc', name: 'Tường xám lục', swatch: ['#2b3a3c', '#d23a2a'],
      preset: { wall: '#2b3a3c', floor: '#161718', void: '#07090a', fogColor: '#121817', wash: '#7d93a0', light: '#fff0d8', frame: '#1a1714', mat: '#e2ded5', fog: .032, exposure: 1.0, bloom: .35, env: .12 } },
    { id: 'nhung-man', name: 'Nhung mận', swatch: ['#3a2230', '#d23a2a'],
      vars: { '--wall': '#3f2433', '--void': '#0a0507' },
      preset: { wall: '#3f2433', floor: '#151012', void: '#0a0507', fogColor: '#1a1016', wash: '#9d93ad', light: '#ffeedc', frame: '#2b1b12', mat: '#e8e1d8', fog: .034, exposure: 1.02, bloom: .35, env: .12 } },
    { id: 'thach-cao', name: 'Thạch cao trắng', swatch: ['#e7e3dc', '#c7362a'],
      vars: { '--wall': '#e7e3dc', '--void': '#cfcac1', '--ink-on-wall': '#1c1f22', '--label': '#ffffff' },
      preset: { wall: '#e4e0d9', floor: '#8a857c', void: '#cdc8bf', fogColor: '#d6d1c8', wash: '#eef2f5', light: '#fff1de', frame: '#f4f2ed', mat: '#ffffff', fog: .022, exposure: .8, bloom: .2, env: .55 } },
    // Men lam: xanh men gốm Chu Đậu, khung sơn trắng; ánh đèn ấm trên tường chàm thành xanh đá sạch, tôn màu da
    { id: 'men-lam', name: 'Men lam', swatch: ['#22304a', '#d23a2a'],
      vars: { '--wall': '#22304a', '--void': '#06080d' },
      preset: { wall: '#22304a', floor: '#121418', void: '#06080d', fogColor: '#0f1522', wash: '#9fb3d9', light: '#fff2e0', frame: '#ece9e2', mat: '#f6f4ef', fog: .035, exposure: 1.05, bloom: .4, env: .15 } },
  ],
  defaults: { texts: {} },

  scenes: [
    /* ===== Bìa: bức tường tối, thấp thoáng ảnh đầu tiên, công tắc đèn ===== */
    {
      id: 'sanh', kind: 'gate',
      render: ({ names: n, img: im, album, guest }) => html`
        <div class="ptl-gwall" aria-hidden="true">
          ${album[0] ? html`<img class="ptl-ghost" src="${im('hero')}" alt="" decoding="async">` : ''}
          <i class="ptl-gglow"></i>
        </div>
        <div class="ptl-gtitle">
          <p class="ptl-to">Kính mời ${guest()}</p>
          <h1 class="ptl-gname">tới phòng tranh của ${n.first} và ${n.second}</h1>
        </div>
        <div class="ptl-switch-wrap">
          <button class="ptl-switch" type="button" aria-label="Bật đèn phòng tranh để mở thiệp" aria-pressed="false"><i class="ptl-rocker"></i></button>
          <p class="ptl-hint">Bật đèn</p>
        </div>`,
      mount(el, ctx) {
        const sw = el.querySelector('.ptl-switch');
        let done = false, y0 = null;
        const on = () => {
          if (done) return; done = true;
          sw.setAttribute('aria-pressed', 'true');
          el.classList.add('is-on');
          clickSound();
          setTimeout(() => ctx.open(), ctx.reduced ? 120 : 700);
        };
        sw.addEventListener('pointerdown', e => { y0 = e.clientY; });
        sw.addEventListener('pointermove', e => { if (y0 != null && e.clientY - y0 > 24) on(); });
        sw.addEventListener('pointerup', () => { y0 = null; });
        // iOS chỉ cho đọc con quay khi xin quyền trong một cú chạm (click), không tính thao tác kéo
        sw.addEventListener('click', () => {
          try { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); } catch {}
          on();
        });
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
          <div class="ptl-inside-ui"><button type="button" class="ptl-out" tabindex="-1">Ra khỏi ảnh</button><p>Vuốt ngang để xem ảnh khác</p></div>
          <p class="ptl-hint3d">Vuốt để đi dọc phòng tranh. Chạm giữ để rọi đèn, chạm vào ảnh để bước vào trong.</p>
          <div class="ptl-rail"><i></i></div>
        </div>
        <ol class="ptl-track">${plan(ctx).map(s => stopHtml(s, ctx))}</ol>`,
      mount(el, ctx) {
        // Bản phẳng (lite, hoặc trước khi cảnh 3D sẵn sàng): ảnh tối, được "rọi" khi cuộn tới
        const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
        }), { rootMargin: '0px 0px -25% 0px' });
        el.querySelectorAll('.ptl-stop').forEach(s => io ? io.observe(s) : s.classList.add('is-lit'));
        // Nút "Giữ để bật toàn bộ đèn" ở bản phẳng: bật sáng mọi ảnh cùng lúc
        el.querySelector('.ptl-track [data-sh-allon]')?.addEventListener('click', () => {
          el.querySelectorAll('.ptl-stop').forEach(s => s.classList.add('is-lit'));
          ctx.emit('allon');
        });
      },
      motion: {
        async cinematic(el, ctx) { await start(el, ctx, 'cinematic'); },
        async standard(el, ctx) { await start(el, ctx, 'standard'); },
        lite() {},
      },
    },

    /* ===== Quầy lễ tân: chấm đỏ lên bức ảnh thích nhất, quà mừng, sổ cảm tưởng ===== */
    {
      id: 'le-tan', label: 'Giữ chỗ và lời chúc', provides: ['rsvp', 'gift', 'guestbook'],
      render: ctx => html`
        <div class="ptl-desk">
          <div class="ptl-desk-rsvp">
            <h2>Giữ chỗ dự khai mạc</h2>
            <p class="ptl-lead">Ở phòng tranh, chấm đỏ cạnh một tác phẩm nghĩa là đã có người giữ. Chọn bức bạn thích nhất rồi dán chấm đỏ để báo chúng mình bạn sẽ tới.</p>
            ${ctx.album.length ? html`
            <div class="ptl-fav" role="radiogroup" aria-label="Bức ảnh bạn thích nhất">
              ${ctx.album.map((src, i) => html`<button type="button" role="radio" aria-checked="false" class="ptl-thumb" data-fav="${i + 1}" aria-label="Ảnh số ${i + 1}"><img src="${src}" alt="" loading="lazy" decoding="async"><i class="ptl-dot" aria-hidden="true"></i></button>`)}
            </div>` : html`<div class="ptl-dot-slot" aria-hidden="true"><i class="ptl-dot"></i></div>`}
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
        // Chọn ảnh thích nhất (mặc định bức chính); khi gửi, ghi kèm vào ghi chú cho cặp đôi biết
        const thumbs = [...el.querySelectorAll('.ptl-thumb')];
        let fav = thumbs[0];
        const pick = t => { fav = t; thumbs.forEach(x => x.setAttribute('aria-checked', String(x === t))); };
        if (fav) pick(fav);
        thumbs.forEach(t => t.addEventListener('click', () => pick(t)));
        // Chạy ở pha capture trên phần tử cha: trước khi dịch vụ gửi form đọc dữ liệu
        el.querySelector('.ptl-desk-rsvp')?.addEventListener('submit', e => {
          const note = e.target.elements?.note;
          if (fav && note && !/thích ảnh số/i.test(note.value)) note.value = `${note.value ? note.value + '. ' : ''}Thích ảnh số ${fav.dataset.fav}`.slice(0, 160);
        }, true);
        ctx.on('rsvp', x => {
          if (x?.attend === 'Không') return;
          (fav || el).querySelector('.ptl-dot')?.classList.add('is-on');
          ctx.emit('reddot', { i: fav ? +fav.dataset.fav - 1 : 0 });
        });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
        }));
      },
    },
  ],
});

/* ---------- Tiếng công tắc tự tạo (Web Audio), bị chặn thì im lặng ---------- */
let audio;
export function clickSound(vol = .6) {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, buf = a.createBuffer(1, Math.ceil(a.sampleRate * .06), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / a.sampleRate * 90);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.value = 2400; g.gain.value = vol;
    src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
  } catch {}
}

// Nạp cảnh 3D sau khi mở bìa. Mọi lỗi (không có WebGL, CDN chặn, mất ngữ cảnh) đều rơi về sách triển lãm phẳng.
async function start(el, ctx, tier) {
  try {
    const url = new URL('./gallery3d.js', import.meta.url).href;
    const { runGallery } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    await runGallery(el, ctx, { tier, palettes: ctx.theme.palettes, clickSound });
  } catch (e) {
    console.warn('[phòng tranh] dùng bản phẳng:', e?.message || e);
    document.documentElement.classList.remove('ptl-3d', 'ptl-ready', 'ptl-inside', 'ptl-portrait');
  }
}
