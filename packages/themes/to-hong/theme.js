// Mẫu "Tơ Hồng" bản 2.0: sợi chỉ đỏ PBR trong không gian 3D sương sớm.
//   Bìa (#bia-to-hong): sợi chỉ đỏ căng ngang — kéo/gảy sợi tơ để tạo sóng hài + tiếng đàn tơ, mở thiệp.
//   Đường tơ (#duong-to):
//     - cinematic: Three.js r170 qua @sayhello/engine/client/stage3d.js (RoomEnvironment, hậu kỳ Bloom/Grain,
//       dải lụa PBR, 6–30 khung ảnh viền đồng theo đúng tỉ lệ thật, chạm soi 2.5D, kéo/con quay nhìn quanh,
//       biển lụa Song Gia & lịch lễ CSS3D, hạt tụ tên & ngày cưới, nút thắt hoa hồng cực r = cos(2θ) + 0.3).
//     - standard: GSAP 3.13 + ScrollTrigger (svg sợi tơ vẽ theo cuộn, nghiêng 2.5D, không WebGL).
//     - lite: bố cục biên tập thoáng 2 cột (desktop) / 1 cột (mobile), sợi tơ tĩnh, không che chữ.
//   Kết duyên (#ket-duyen): nút giữ thắt nút (#knotBtn) đồng bộ với form[data-sh="rsvp"], thả dải lụa tên khách,
//     QR mừng cưới (.th-accs) và sổ lời chúc.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Tính đường dẫn SVG cho nút thắt hoa hồng cực r = cos(2θ) + 0.3
export function polarKnotPath(scale = 100) {
  let d = '';
  const N = 360;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r = (Math.cos(2 * th) + 0.3) * scale;
    const x = (r * Math.cos(th)).toFixed(1);
    const y = (-r * Math.sin(th)).toFixed(1);
    d += (i ? 'L' : 'M') + x + ' ' + y;
  }
  d += `M0 ${(1.3 * scale).toFixed(1)} C ${(-0.2 * scale).toFixed(1)} ${(1.5 * scale).toFixed(1)}, ${(-0.4 * scale).toFixed(1)} ${(1.65 * scale).toFixed(1)}, ${(-0.5 * scale).toFixed(1)} ${(1.85 * scale).toFixed(1)}`;
  d += `M0 ${(1.3 * scale).toFixed(1)} C ${(0.2 * scale).toFixed(1)} ${(1.5 * scale).toFixed(1)}, ${(0.4 * scale).toFixed(1)} ${(1.65 * scale).toFixed(1)}, ${(0.5 * scale).toFixed(1)} ${(1.85 * scale).toFixed(1)}`;
  return d;
}

// Kịch bản các điểm dừng dọc sợi tơ, tự co giãn từ 6 đến 30 ảnh và ẩn hẳn story khi cặp đôi không nhập.
export function plan(ctx) {
  const works = (ctx.album || []).map((src, i) => ({ src, i, cap: ctx.captions?.[i] || '' }));
  const hero = works[0] || null;
  const rest = works.slice(1);
  const gallery = [];

  if (rest.length <= 9) {
    rest.forEach(w => gallery.push({ kind: 'work', hang: 'single', works: [w] }));
  } else if (rest.length <= 19) {
    const singles = 5;
    rest.slice(0, singles).forEach(w => gallery.push({ kind: 'work', hang: 'single', works: [w] }));
    for (let i = singles; i < rest.length; i += 2) {
      const slice = rest.slice(i, i + 2);
      gallery.push({ kind: 'work', hang: slice.length === 2 ? 'duet' : 'single', works: slice });
    }
  } else {
    const singles = 3;
    const duetsEnd = singles + 8; // 4 duets
    rest.slice(0, singles).forEach(w => gallery.push({ kind: 'work', hang: 'single', works: [w] }));
    for (let i = singles; i < Math.min(duetsEnd, rest.length); i += 2) {
      const slice = rest.slice(i, i + 2);
      gallery.push({ kind: 'work', hang: slice.length === 2 ? 'duet' : 'single', works: slice });
    }
    for (let i = duetsEnd; i < rest.length; i += 3) {
      const slice = rest.slice(i, i + 3);
      const hang = slice.length === 3 ? 'trio' : slice.length === 2 ? 'duet' : 'single';
      gallery.push({ kind: 'work', hang, works: slice });
    }
  }

  const story = ctx.has('story') ? (ctx.story || []).map(s => ({ kind: 'text', s })) : [];
  const out = [{ kind: 'title' }];
  if (hero) out.push({ kind: 'work', hang: 'hero', works: [hero] });
  out.push({ kind: 'when' });

  const morphAt = gallery.length >= 2 ? Math.max(1, Math.floor(gallery.length * 0.45)) : -1;
  const infoAt = gallery.length >= 2 ? Math.max(1, Math.floor(gallery.length * 0.78)) : -1;

  gallery.forEach((g, idx) => {
    out.push(g);
    if (idx === morphAt) out.push({ kind: 'morph' });
    if (story.length && idx % 2 === 1 && idx < gallery.length - 1) out.push(story.shift());
    if (idx === infoAt) out.push({ kind: 'info' });
  });

  if (morphAt === -1) out.push({ kind: 'morph' });
  if (infoAt === -1) out.push({ kind: 'info' });
  out.push(...story, { kind: 'finale' });
  return out;
}

const photoFig = (w, eager) => html`
  <figure class="th-frame" data-i="${w.i}">
    <button type="button" class="th-photo-btn" data-i="${w.i}" aria-label="${w.cap ? `Phóng to ảnh ${w.i + 1}: ${w.cap}` : `Phóng to ảnh cưới số ${w.i + 1}`}">
      <img src="${w.src}" alt="${w.cap || `Ảnh cưới số ${w.i + 1}`}" data-i="${w.i}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">
    </button>
    ${w.cap ? html`<figcaption class="th-cap-item">${w.cap}</figcaption>` : ''}
  </figure>`;

function stopHtml(st, ctx) {
  const { names: n, date, city, events, places, families, main, say, splitText } = ctx;

  if (st.kind === 'title') return html`
    <li class="th-stop th-s-title" data-stop="title">
      <div class="th-plate th-title-plate">
        <p class="th-welcome">Trân trọng kính mời ${ctx.guest()}</p>
        <h2 class="th-names">
          <span class="th-n1">${splitText(n.first)}</span>
          <span class="th-amp" aria-hidden="true">và</span>
          <span class="th-n2">${splitText(n.second)}</span>
        </h2>
        <p class="th-place-date">${fmt.short(date)}${city ? html` — ${city}` : ''}</p>
      </div>
    </li>`;

  if (st.kind === 'work') {
    const caps = st.works.map(w => w.cap).filter(Boolean);
    return html`
    <li class="th-stop th-s-work th-h-${st.hang}" data-stop="work" data-hang="${st.hang}">
      <div class="th-imgs">${st.works.map(w => photoFig(w, w.i < 2))}</div>
      <div class="th-plate th-cap-plate">
        <p class="th-cap">${caps.length ? caps.join(' — ') : `Khoảnh khắc ${st.works.map(w => w.i + 1).join(', ')}`}</p>
      </div>
    </li>`;
  }

  if (st.kind === 'when') {
    const ddmm = fmt.short(date).split('.');
    return html`
    <li class="th-stop th-s-when" data-stop="when">
      <div class="th-plate th-when-plate">
        <p class="th-ddmm">${ddmm[0]}.${ddmm[1]}</p>
        <p class="th-yyyy">${ddmm[2]}</p>
        <p class="th-long">${fmt.long(date)}${main?.date ? `, ${fmt.time(main.date)}` : ''}</p>
        ${main?.lunar ? html`<p class="th-lunar">${main.lunar}</p>` : ''}
        ${countdown(ctx, { done: 'Hôm nay hai sợi tơ chính thức se thành một mối' })}
      </div>
    </li>`;
  }

  if (st.kind === 'morph') return html`
    <li class="th-stop th-s-morph" data-stop="morph">
      <div class="th-plate th-morph-plate">
        <p class="th-morph-names">${n.first} &amp; ${n.second}</p>
        <p class="th-morph-date">${fmt.short(date)}</p>
        <p class="th-morph-sub">Sợi chỉ đỏ nối hai đầu thương nhớ</p>
      </div>
    </li>`;

  if (st.kind === 'info') return html`
    <li class="th-stop th-s-info" data-stop="info">
      <div class="th-plate th-info-plate">
        ${families.length ? html`
        <div class="th-song-gia">
          <h2>Song Gia</h2>
          <div class="th-fams">
            ${families.map(f => html`
              <div class="th-fam">
                <h3>${f.side}</h3>
                ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
                ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
                ${f.address ? html`<p class="th-dim">${br(f.address)}</p>` : ''}
              </div>`)}
          </div>
        </div>` : ''}
        <div class="th-schedule">
          <h2>Lịch lễ và đường đi</h2>
          <ol class="th-evs">
            ${events.map((e, i) => html`<li data-ev="${i}">
              <span class="th-time">${fmt.time(e.date)}</span>
              <b>${e.title}</b>
              ${e.venue ? html`<span>${e.venue}</span>` : ''}
              ${e.address ? html`<span class="th-dim">${br(e.address)}</span>` : ''}
              ${e.lunar ? html`<span class="th-dim">${e.lunar}</span>` : ''}
              ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">${say('addCalendar')}</a>` : ''}
            </li>`)}
          </ol>
          ${places.length ? html`<p class="th-maps">${places.map(p => html`<a href="${p.url}" target="_blank" rel="noopener">Mở bản đồ: ${p.label}</a>`)}</p>` : ''}
        </div>
      </div>
    </li>`;

  if (st.kind === 'text') return html`
    <li class="th-stop th-s-text" data-stop="text">
      <div class="th-plate th-story-plate">
        ${st.s.year ? html`<p class="th-year">${st.s.year}</p>` : ''}
        ${st.s.title ? html`<h3>${st.s.title}</h3>` : ''}
        <p>${st.s.text || ''}</p>
      </div>
    </li>`;

  return html`
    <li class="th-stop th-s-finale" data-stop="finale">
      <div class="th-plate th-finale-plate">
        <svg class="th-lite-knot" viewBox="-150 -150 300 350" aria-hidden="true">
          <path class="th-knot-stroke" d="${polarKnotPath(95)}"/>
        </svg>
        <h2>${n.first} và ${n.second}</h2>
        <p>Cuối sợi chỉ đỏ là một nút thắt đồng tâm. Hẹn gặp ${ctx.guest('bạn')} ngày ${fmt.short(date)}.</p>
        <a class="th-go" href="#ket-duyen">Tới phần thắt nút xác nhận</a>
      </div>
    </li>`;
}

export default defineTheme({
  id: 'to-hong',
  name: 'Tơ Hồng',
  version: '2.0.0',
  tier: 'cinematic',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#EEF1F4',
  fonts: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  libs: ['three-post', 'scroll'],
  gateMs: 900,
  features: {
    when: 'required',
    where: 'required',
    rsvp: 'required',
    map: 'optional',
    album: 'optional',
    story: 'optional',
    gift: 'optional',
    guestbook: 'optional',
    countdown: 'optional',
  },
  slots: {
    images: {
      album: { min: 6, ideal: 12, max: 30, label: 'Ảnh xếp dọc sợi tơ đỏ (6–30 ảnh). Ảnh đầu tiên là ảnh mở màn.' },
    },
    story: { optional: true, maxItems: 6 },
  },
  palettes: [
    {
      id: 'suong-som',
      name: 'Sương sớm',
      swatch: ['#EEF1F4', '#C8102E'],
      vars: {
        '--mist': '#EEF1F4',
        '--sky': '#D7E2EC',
        '--ink': '#23303D',
        '--thread': '#C8102E',
        '--thread-deep': '#8E0B20',
        '--gold': '#D9A86C',
        '--sh-bg': '#EEF1F4',
        '--sh-ink': '#23303D',
        '--sh-accent': '#C8102E',
        '--sh-accent-ink': '#FFFFFF',
        '--sh-panel': '#F8FAFC',
        '--sh-soft': 'rgba(35, 48, 61, 0.18)',
      },
      preset: {
        skyTop: '#D7E2EC',
        skyBottom: '#EEF1F4',
        fog: '#E6ECF1',
        fogD: 0.025,
        thread: '#C8102E',
        threadEmissive: '#6E0718',
        gold: '#D9A86C',
        petalA: '#C8102E',
        petalB: '#F2CDD3',
        ink: '#23303D',
        cardBg: '#F8FAFC',
        env: 0.75,
        exposure: 1.0,
        bloom: 0.28,
        night: 0,
      },
    },
    {
      id: 'dem-to-do',
      name: 'Đêm tơ đỏ',
      swatch: ['#160D10', '#D91B38'],
      vars: {
        '--mist': '#160D10',
        '--sky': '#261318',
        '--ink': '#FFF3EA',
        '--thread': '#D91B38',
        '--thread-deep': '#8E0B20',
        '--gold': '#E6C27A',
        '--sh-bg': '#160D10',
        '--sh-ink': '#FFF3EA',
        '--sh-accent': '#D91B38',
        '--sh-accent-ink': '#FFFFFF',
        '--sh-panel': '#261318',
        '--sh-soft': 'rgba(255, 243, 234, 0.2)',
      },
      preset: {
        skyTop: '#160D10',
        skyBottom: '#261318',
        fog: '#1A0E12',
        fogD: 0.029,
        thread: '#D91B38',
        threadEmissive: '#9E0B23',
        gold: '#E6C27A',
        petalA: '#D91B38',
        petalB: '#E6C27A',
        ink: '#FFF3EA',
        cardBg: '#261318',
        env: 0.45,
        exposure: 1.05,
        bloom: 0.42,
        night: 1,
      },
    },
  ],
  defaults: { texts: {} },

  scenes: [
    /* ===== 1. Bìa: Gảy sợi tơ đỏ căng ngang ===== */
    {
      id: 'bia-to-hong',
      kind: 'gate',
      render: ({ names: n, date, city, guest, splitText }) => html`
        <div class="th-gate-mist" aria-hidden="true"></div>
        <div class="th-gate-inner">
          <div class="th-gate-top">
            <p class="th-gate-to">Kính mời ${guest()}</p>
            <p class="th-gate-meta">${fmt.short(date)}${city ? html` — ${city}` : ''}</p>
          </div>
          <div class="th-gate-center">
            <h1 class="th-gate-names">
              <span>${splitText(n.first)}</span>
              <span class="th-gate-and">và</span>
              <span>${splitText(n.second)}</span>
            </h1>
            <div class="th-gate-pluck" aria-hidden="true">
              <svg class="th-gate-svg" viewBox="0 0 1200 180" preserveAspectRatio="none">
                <path class="th-gate-glow" d="M 0 90 Q 600 90 1200 90"/>
                <path class="th-gate-string" d="M 0 90 Q 600 90 1200 90"/>
                <circle class="th-gate-bead" cx="600" cy="90" r="8"/>
              </svg>
            </div>
            <p class="th-gate-lede">Chạm kéo sợi chỉ đỏ để gảy lên một nhịp duyên và mở thiệp cưới.</p>
          </div>
          <div class="th-gate-actions">
            <button type="button" class="th-open-btn" data-open>Gảy sợi tơ mở thiệp</button>
          </div>
        </div>`,
      mount(el, ctx) {
        const pluckZone = el.querySelector('.th-gate-pluck');
        const strPath = el.querySelector('.th-gate-string');
        const glowPath = el.querySelector('.th-gate-glow');
        const bead = el.querySelector('.th-gate-bead');
        const openBtn = el.querySelector('[data-open]');

        let opened = false;
        let dragging = false;
        let startY = 0;
        let pullY = 0;
        let oscRaf = 0;

        const setCurve = (dx, dy) => {
          const cx = 600 + Math.max(-180, Math.min(180, dx));
          const cy = 90 + Math.max(-68, Math.min(68, dy));
          const d = `M 0 90 Q ${cx.toFixed(1)} ${cy.toFixed(1)} 1200 90`;
          strPath?.setAttribute('d', d);
          glowPath?.setAttribute('d', d);
          bead?.setAttribute('cx', cx.toFixed(1));
          bead?.setAttribute('cy', ((90 + cy) * 0.5).toFixed(1));
        };

        const askGyro = () => {
          try {
            const D = window.DeviceOrientationEvent;
            if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {});
          } catch {}
        };

        const releaseAndOpen = (amp = 42) => {
          if (opened) return;
          opened = true;
          askGyro();
          if (!ctx.reduced) pluckSound(0.45);
          el.classList.add('is-plucked');
          if (!ctx.reduced && strPath) {
            const t0 = performance.now();
            const vibrate = now => {
              const dt = (now - t0) / 1000;
              if (dt > 0.75) { setCurve(0, 0); return; }
              const wave = Math.sin(dt * 38) * Math.exp(-dt * 4.5) * amp;
              setCurve(0, wave);
              oscRaf = requestAnimationFrame(vibrate);
            };
            oscRaf = requestAnimationFrame(vibrate);
          }
          setTimeout(() => {
            cancelAnimationFrame(oscRaf);
            ctx.open();
          }, ctx.reduced ? 100 : 520);
        };

        if (pluckZone) {
          pluckZone.addEventListener('pointerdown', e => {
            if (opened) return;
            dragging = true;
            startY = e.clientY;
            pullY = 0;
            pluckZone.setPointerCapture?.(e.pointerId);
          });
          pluckZone.addEventListener('pointermove', e => {
            if (!dragging || opened) return;
            const r = pluckZone.getBoundingClientRect();
            const dx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 260;
            pullY = (e.clientY - startY) * 0.9;
            setCurve(dx, pullY);
            if (Math.abs(pullY) > 36) {
              dragging = false;
              releaseAndOpen(pullY);
            }
          });
          const endDrag = () => {
            if (!dragging || opened) return;
            dragging = false;
            releaseAndOpen(Math.abs(pullY) > 10 ? pullY : 38);
          };
          pluckZone.addEventListener('pointerup', endDrag);
          pluckZone.addEventListener('pointercancel', endDrag);
        }

        openBtn?.addEventListener('click', () => releaseAndOpen(46));
      },
    },

    /* ===== 2. Hành trình sợi tơ đỏ ===== */
    {
      id: 'duong-to',
      label: 'Đường tơ hồng',
      provides: ['when', 'where', 'map', 'album', 'story', 'countdown'],
      render: ctx => html`
        <div class="th-stage" aria-hidden="true">
          <canvas class="th-canvas"></canvas>
          <div class="th-css"></div>
          <div class="th-veil"><p>Sương đang tan…</p></div>
          <div class="th-inspect-ui">
            <button type="button" class="th-inspect-back" tabindex="-1">Trở lại sợi tơ</button>
            <button type="button" class="th-inspect-zoom" tabindex="-1">Xem ảnh lớn</button>
            <p>Kéo hoặc nghiêng để soi chiều sâu · Chạm ra ngoài để thoát</p>
          </div>
          <p class="th-hint3d">Cuộn để đi dọc sợi tơ. Kéo nhẹ để xoay góc nhìn, chạm ảnh để soi gần.</p>
          <div class="th-progress" aria-hidden="true"><i></i></div>
        </div>
        <div class="th-svg-stage" aria-hidden="true">
          <svg class="th-svg-thread" viewBox="0 0 100 1000" preserveAspectRatio="none">
            <path class="th-svg-path" pathLength="1" d="M 64 0 C 64 42, 86 68, 84 115 S 18 175, 16 235 S 88 305, 84 365 S 14 435, 18 500 S 86 575, 82 640 S 18 705, 22 770 S 80 840, 78 900 S 46 955, 50 1000"/>
          </svg>
        </div>
        <ol class="th-track">${plan(ctx).map(s => stopHtml(s, ctx))}</ol>
        <dialog class="th-view" aria-label="Xem ảnh lớn">
          <figure class="th-view-fig">
            <img alt="">
            <figcaption class="th-view-cap"></figcaption>
          </figure>
          <p class="th-view-count" aria-live="polite"></p>
          <button type="button" class="th-v-prev" aria-label="Ảnh trước">‹</button>
          <button type="button" class="th-v-next" aria-label="Ảnh sau">›</button>
          <button type="button" class="th-v-close">Đóng ảnh</button>
        </dialog>`,
      mount(el, ctx) {
        const dlg = el.querySelector('.th-view');
        const imgs = [...el.querySelectorAll('.th-track img[data-i]')];
        const capEl = dlg?.querySelector('.th-view-cap');
        const cntEl = dlg?.querySelector('.th-view-count');
        const dlgImg = dlg?.querySelector('img');
        let cur = 0;

        const show = i => {
          if (!imgs.length || !dlgImg) return;
          cur = (i + imgs.length) % imgs.length;
          const im = imgs[cur];
          dlgImg.src = im.currentSrc || im.src;
          dlgImg.alt = im.alt;
          if (capEl) capEl.textContent = im.closest('.th-frame')?.querySelector('.th-cap-item')?.textContent || im.alt || '';
          if (cntEl) cntEl.textContent = `${cur + 1} / ${imgs.length}`;
        };

        ctx.view = i => {
          if (!imgs.length || !dlg) return;
          show(i);
          dlg.showModal?.();
        };

        el.querySelectorAll('.th-photo-btn').forEach(btn => {
          btn.addEventListener('click', () => ctx.view(Number(btn.dataset.i || 0)));
        });

        dlg?.querySelector('.th-v-prev')?.addEventListener('click', () => show(cur - 1));
        dlg?.querySelector('.th-v-next')?.addEventListener('click', () => show(cur + 1));
        dlg?.querySelector('.th-v-close')?.addEventListener('click', () => dlg.close());
        dlg?.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

        let x0 = null;
        dlg?.addEventListener('pointerdown', e => { x0 = e.clientX; });
        dlg?.addEventListener('pointerup', e => {
          if (x0 != null && Math.abs(e.clientX - x0) > 50) show(cur + (e.clientX < x0 ? 1 : -1));
          x0 = null;
        });
        dlg?.addEventListener('keydown', e => {
          if (e.key === 'ArrowRight') show(cur + 1);
          if (e.key === 'ArrowLeft') show(cur - 1);
        });
      },
      motion: {
        async cinematic(el, ctx) {
          try {
            const url = new URL('./thread3d.js', import.meta.url).href;
            const { runThread } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
            await runThread(el, ctx, { palettes: ctx.theme.palettes, pluckSound });
          } catch (e) {
            console.warn('[tơ hồng] chuyển sang bản phẳng:', e?.message || e);
            document.documentElement.classList.remove('th-3d', 'th-ready', 'th-inspecting', 'th-portrait');
          }
        },
        async standard(el, ctx) {
          try {
            const url = new URL('./motion2d.js', import.meta.url).href;
            const { runMotion2d } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
            await runMotion2d(el, ctx);
          } catch (e) {
            console.warn('[tơ hồng] bản 2D chuyển về tĩnh:', e?.message || e);
          }
        },
        lite() {},
      },
    },

    /* ===== 3. Kết duyên: Giữ để thắt nút RSVP + thả dải lụa tên khách, mừng cưới, lời chúc ===== */
    {
      id: 'ket-duyen',
      label: 'Thắt nút và lời chúc',
      provides: ['rsvp', 'gift', 'guestbook'],
      render: ctx => html`
        <div class="th-desk">
          <div class="th-desk-rsvp">
            <div class="th-knot-head">
              <div>
                <h2>Thắt nút hẹn ước</h2>
                <p class="th-lead">Giữ nút chỉ đỏ để thắt chặt mối duyên hoặc điền phiếu xác nhận bên dưới để chúng mình chuẩn bị chỗ đón ${ctx.guest('bạn')}.</p>
              </div>
              <div class="th-knot-control">
                <button id="knotBtn" type="button" class="th-knot-btn" aria-label="Nhấn giữ để thắt nút và xác nhận tham dự">
                  <svg viewBox="0 0 130 130" aria-hidden="true">
                    <circle class="th-k-track" cx="65" cy="65" r="59"/>
                    <circle class="th-k-fill" cx="65" cy="65" r="59" pathLength="1"/>
                  </svg>
                  <span>Giữ để thắt</span>
                </button>
                <div class="th-guest-ribbon" aria-live="polite">
                  <span class="th-ribbon-name" data-guest data-fallback="Bạn hiền">Bạn hiền</span>
                </div>
              </div>
            </div>
            ${rsvpForm(ctx, { yes: 'Sẽ tới chung vui', no: 'Tiếc quá, mình bận', submit: 'Thắt nút xác nhận' })}
          </div>
          ${ctx.has('gift') ? html`
          <div class="th-desk-gift">
            <h2>Gửi quà mừng</h2>
            <div class="th-accs">${ctx.accounts.map(a => {
              const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
              const qr = qrUrl(a, note);
              return html`<div class="th-acc">
                ${qr ? html`<img src="${qr}" alt="Mã QR chuyển khoản tới ${a.who}" loading="lazy" width="132" height="132">` : ''}
                <p><b>${a.who}</b><span>${a.bank}</span><span class="th-num">${a.number}</span><span>${a.name}</span></p>
                <button type="button" class="th-copy" data-copy="${a.number}">Chép số tài khoản</button>
              </div>`;
            })}</div>
          </div>` : ''}
          <div class="th-desk-book">
            <h2>Sổ lời chúc</h2>
            ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
            ${wishList(ctx)}
          </div>
        </div>`,
      mount(el, ctx) {
        const kb = el.querySelector('#knotBtn');
        const fill = el.querySelector('.th-k-fill');
        const rsvpWrap = el.querySelector('.th-desk-rsvp');
        const form = el.querySelector('form[data-sh="rsvp"]');
        const ribbon = el.querySelector('.th-guest-ribbon');
        const ribbonName = el.querySelector('.th-ribbon-name');

        let hold = 0, holding = false, tied = false, raf = 0, lastT = 0;

        const syncHold = v => {
          hold = Math.max(0, Math.min(1, v));
          if (fill) fill.style.strokeDashoffset = String(1 - hold);
          kb?.style.setProperty('--hold', hold.toFixed(3));
          ctx.emit('knot', { progress: hold, tied });
        };

        const launchRibbon = name => {
          tied = true;
          rsvpWrap?.classList.add('is-tied');
          if (ribbonName) ribbonName.textContent = name || ctx.guest || 'Bạn hiền';
          ribbon?.classList.remove('is-released');
          void ribbon?.offsetWidth;
          ribbon?.classList.add('is-released');
        };

        const completeHold = () => {
          if (tied) return;
          holding = false;
          syncHold(1);
          if (!ctx.reduced) pluckSound(0.55);
          try { navigator.vibrate?.(30); } catch {}
          if (form) {
            const yesRadio = form.querySelector('input[name="attend"][value="Có"]');
            if (yesRadio) {
              yesRadio.checked = true;
              yesRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            const nameInput = form.querySelector('input[name="name"]');
            if (nameInput && !nameInput.value.trim()) nameInput.value = ctx.guest || 'Khách quý';
            if (typeof form.requestSubmit === 'function') form.requestSubmit();
            else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          } else {
            launchRibbon(ctx.guest || 'Khách quý');
          }
        };

        const tick = now => {
          const dt = Math.min(0.05, (now - (lastT || now)) / 1000);
          lastT = now;
          if (tied) { raf = 0; lastT = 0; return; }
          syncHold(hold + (holding ? dt / 0.95 : -dt / 0.55));
          if (hold >= 1) { completeHold(); raf = 0; lastT = 0; return; }
          if (holding || hold > 0) raf = requestAnimationFrame(tick);
          else { raf = 0; lastT = 0; }
        };

        const startHold = () => {
          if (tied) return;
          holding = true;
          if (!raf) raf = requestAnimationFrame(tick);
        };
        const endHold = () => { holding = false; };

        if (kb) {
          kb.addEventListener('pointerdown', e => {
            e.preventDefault();
            kb.setPointerCapture?.(e.pointerId);
            startHold();
          });
          ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach(ev => kb.addEventListener(ev, endHold));
          kb.addEventListener('keydown', e => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              startHold();
            }
          });
          kb.addEventListener('keyup', e => {
            if (e.key === ' ' || e.key === 'Enter') endHold();
          });
        }

        ctx.on('rsvp', payload => {
          if (payload?.attend !== 'Không') {
            syncHold(1);
            launchRibbon(payload?.name);
          } else {
            rsvpWrap?.classList.remove('is-tied');
          }
        });

        el.querySelectorAll('[data-copy]').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(btn.dataset.copy);
              btn.textContent = 'Đã chép';
            } catch {
              btn.textContent = btn.dataset.copy;
            }
            setTimeout(() => { btn.textContent = 'Chép số tài khoản'; }, 2000);
          });
        });
      },
    },
  ],
});

/* ---------- Tiếng gảy sợi tơ (Web Audio), bị chặn thì im lặng ---------- */
let audioCtx;
export function pluckSound(vol = 0.45) {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audioCtx;
    const now = a.currentTime;
    const freqs = [392.0, 587.33, 783.99];
    freqs.forEach((f, idx) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = idx === 0 ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(f, now + idx * 0.03);
      o.frequency.exponentialRampToValueAtTime(f * 0.996, now + 0.55 + idx * 0.03);
      const gain = (vol * 0.22) / (idx + 1);
      g.gain.setValueAtTime(0.0001, now + idx * 0.03);
      g.gain.linearRampToValueAtTime(gain, now + idx * 0.03 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.65 + idx * 0.04);
      o.connect(g).connect(a.destination);
      o.start(now + idx * 0.03);
      o.stop(now + 0.72 + idx * 0.04);
    });
  } catch {}
}
