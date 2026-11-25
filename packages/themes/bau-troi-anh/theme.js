// Mẫu "Bầu Trời Ảnh" bản 2: khách nằm giữa đồng lúc chạng vạng, ngước lên trời. Camera không đi đâu cả, chỉ
// xoay như cái đầu (con quay hoặc kéo tay). Mỗi ảnh cưới là một ngôi sao mang màu của chính ảnh đó; nhìn vào đủ
// lâu thì sao NỞ thành ảnh, và đường mắt khách đi qua các ảnh vẽ nên chòm sao của riêng họ.
//   Đường chân trời là dãy đồi tạo từ tên hai người. Cuộn trang không làm trang trôi mà kéo đêm xuống.
//   Bắc: trăng đúng pha ngày cưới + ngày dương/âm. Đông: nơi tổ chức. Nam: giữ chỗ. Tây: quà mừng. Đỉnh đầu: sao của khách.
//   Hái sao: chạm ảnh đã nở để xem toàn màn hình. Kết: giữ mặt trăng, mọi ảnh bay về ghép thành chữ cái đầu tên.
//   Giữ chỗ: một con đom đóm bay lên thành ngôi sao.
// Động từ chuyển động: NỞ (sao nở thành ảnh). Ảnh giữ nguyên tỉ lệ và màu.
// Mức lite: cùng HTML thành bầu trời phẳng, ảnh là những đốm sáng, chạm để xem.
import { defineTheme, html, br, rsvpForm, wishForm, wishList, fmt } from '@sayhello/engine';

const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
const qrUrl = (a, note) => a.qr || (a.bankCode && a.number ? `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-compact2.png?accountName=${encodeURIComponent(a.name || '')}&addInfo=${encodeURIComponent(note)}` : '');

// Vị trí ảnh trên vòm trời (độ): hướng (yaw, 0 = Bắc, dương = Đông) và độ cao (alt). Ảnh đầu là ngôi sao sáng nhất ở
// hướng Bắc. 6 ảnh trải ±100° trước mặt, 30 ảnh phủ kín 360°. Dùng chung cho máy chủ (dải la bàn) và cảnh 3D.
export function skyLayout(n) {
  if (!n) return [];
  const span = n <= 6 ? 200 : Math.min(352, 200 + (n - 6) * (152 / 24));
  const out = [{ yaw: 0, alt: 36, mag: 1.15 }];
  const rest = n - 1;
  for (let i = 0; i < rest; i++) {
    let yaw = -span / 2 + span * (i + .5) / rest;
    if (Math.abs(yaw) < 16) yaw += yaw < 0 ? -12 : 12; // chừa chỗ cho ngôi sao chính
    const alt = 18 + 46 * ((i * .618034 + .31) % 1);
    out.push({ yaw: Math.round(yaw * 10) / 10, alt: Math.round(alt * 10) / 10, mag: [.82, .66, .94][i % 3] });
  }
  return out;
}
// Bản phẳng: rải ảnh theo lưới 3 cột có xê dịch nhẹ (không chồng lên nhau), ảnh chính ở giữa hàng đầu
export function flatPos(i, n) {
  const rows = Math.ceil(n / 3), col = i === 0 ? 1 : [0, 2, 1][(i - 1) % 3], row = i === 0 ? 0 : Math.floor((i - 1) / 3) + (((i - 1) % 3) === 2 ? 1 : 0);
  const jx = ((i * 37) % 11) - 5, jy = ((i * 53) % 9) - 4;
  return [(18 + col * 32 + jx).toFixed(1), (8 + row * (84 / Math.max(1, rows)) + jy).toFixed(1)];
}
// Hướng của các bảng thông tin trên đường chân trời
export const BEARINGS = { date: 0, venue: 90, rsvp: 180, gift: 270 };

// Pha trăng của một ngày (0 = trăng mới, .5 = rằm), theo chu kỳ trung bình
export function moonPhase(iso) {
  const t = new Date(iso).getTime(), ref = Date.UTC(2000, 0, 6, 18, 14);
  const p = ((t - ref) / 864e5 / 29.530588853) % 1;
  return p < 0 ? p + 1 : p;
}

export default defineTheme({
  id: 'bau-troi-anh',
  name: 'Bầu Trời Ảnh',
  version: '2.0.0',
  tier: 'cinematic',
  layout: 'stage',
  voice: 'than-mat',
  themeColor: '#142a3b',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,900&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  libs: ['three-post'],
  gateMs: 1600,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', story: 'optional', gift: 'optional', guestbook: 'optional' },
  slots: {
    images: { album: { min: 6, ideal: 12, max: 30, label: 'Mỗi ảnh là một ngôi sao. Ảnh đầu tiên là ngôi sao sáng nhất, ở hướng Bắc.' } },
    story: { optional: true, maxItems: 6 },
  },
  palettes: [
    { id: 'gio-xanh', name: 'Giờ xanh', swatch: ['#142a3b', '#d8f26b'],
      preset: { zenith: '#142a3b', haze: '#6f9aa6', band: '#c9d4b8', ridge: '#0b1512', accent: '#d8f26b', ink: '#eef2ec', nightZenith: '#070f18', nightHaze: '#1d3440', nightBand: '#3a5650', bloom: .55, exposure: 1 } },
    { id: 'dem-dong', name: 'Đêm đồng', swatch: ['#0a1620', '#d8f26b'],
      vars: { '--zenith': '#0a1620', '--haze': '#2e4a52' },
      preset: { zenith: '#0a1620', haze: '#2e4a52', band: '#4f6b5a', ridge: '#050b09', accent: '#d8f26b', ink: '#eef2ec', nightZenith: '#03080d', nightHaze: '#12232a', nightBand: '#24352f', bloom: .6, exposure: 1 } },
    { id: 'suong-som', name: 'Sương sớm', swatch: ['#dce3e6', '#2f6f5e'],
      vars: {
        '--zenith': '#3c4a63', '--haze': '#dce3e6', '--ridge': '#dfe6e9', '--hill': '#1e2a33',
        '--ink': '#13202a', '--sky-ink': '#eef2ec', '--accent': '#2f6f5e', '--paper': '#eef3f5',
        '--sh-panel': '#eef3f5', '--sh-ink': '#13202a', '--sh-accent-ink': '#ffffff', '--sh-soft': 'rgba(19, 32, 42, .22)',
        '--compass-bg': 'rgba(244, 247, 248, .94)', '--quick-btn-bg': 'rgba(244, 247, 248, .92)',
        '--up-bg': 'rgba(20, 42, 59, .68)', '--troi-mid': '#2b364a', '--troi-end': '#1e2838', '--input-bg': 'rgba(255, 255, 255, .65)',
      },
      preset: { zenith: '#3c4a63', haze: '#dce3e6', band: '#f0e6d8', ridge: '#1e2a33', accent: '#2f6f5e', ink: '#13202a', nightZenith: '#1c2638', nightHaze: '#6c7a88', nightBand: '#a59c94', bloom: .3, exposure: 1 } },
  ],
  defaults: { texts: {} },

  scenes: [
    /* ===== Bìa: ngang tầm đường chân trời, tên hai người là dãy đồi ===== */
    {
      id: 'dong', kind: 'gate',
      render: ({ names: n, date, guest }) => html`
        <div class="bt-gsky" aria-hidden="true"></div>
        <p class="bt-ridge" aria-hidden="true"><span>${n.first}</span> <span>${n.second}</span></p>
        <div class="bt-gtext">
          <p class="bt-to">Kính mời ${guest()}</p>
          <h1 class="bt-gname">nằm xuống bãi cỏ cùng ${n.first} và ${n.second}, ngắm trời ngày ${fmt.short(date)}</h1>
        </div>
        <button class="bt-up" type="button" aria-label="Ngước lên trời để mở thiệp">Ngước lên</button>`,
      mount(el, ctx) {
        const btn = el.querySelector('.bt-up');
        btn.addEventListener('click', () => {
          // iOS chỉ cho đọc con quay khi xin quyền ngay trong cú chạm này
          try { const D = window.DeviceOrientationEvent; if (D && typeof D.requestPermission === 'function') D.requestPermission().catch(() => {}); } catch {}
          el.classList.add('is-up');
          setTimeout(() => ctx.open(), ctx.reduced ? 150 : 1100);
        }, { once: true });
      },
    },

    /* ===== Bầu trời ===== */
    {
      id: 'troi', label: 'Bầu trời ảnh', provides: ['when', 'where', 'map', 'album'],
      render: ctx => {
        const { names: n, date, events, places, say, album, captions } = ctx;
        const lay = skyLayout(album.length);
        const pct = yaw => ((yaw + 180) % 360 + 360) % 360 / 3.6;
        const main = ctx.main;
        return html`
        <div class="bt-stage" aria-hidden="true">
          <canvas class="bt-canvas"></canvas>
          <div class="bt-css"></div>
          <div class="bt-veil"><p>Trời đang tối dần…</p></div>
          <p class="bt-hint3d">Nghiêng máy hoặc kéo ngang để nhìn quanh. Nhìn vào một ngôi sao để nó nở thành ảnh. Cuộn để kéo đêm xuống.</p>
        </div>
        <ol class="bt-stars" aria-label="Các ảnh trên bầu trời">
          ${album.map((src, i) => html`<li class="bt-star" style="--x:${flatPos(i, album.length)[0]}%;--y:${flatPos(i, album.length)[1]}%;--m:${lay[i].mag}">
            <button type="button" class="bt-photo" data-i="${i}" aria-label="${captions[i] || `Ảnh cưới số ${i + 1}`}"><img src="${src}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async"></button>
          </li>`)}
        </ol>
        <div class="bt-plates">
          <section class="bt-plate bt-p-date" data-bearing="date">
            <p class="bt-day">${fmt.short(date)}</p>
            <p>${fmt.long(date).split(' · ')[0]}${main?.lunar ? html`<br><span class="bt-dim">${main.lunar}</span>` : ''}</p>
            <p class="bt-names">${n.first} và ${n.second}</p>
          </section>
          <section class="bt-plate bt-p-venue" data-bearing="venue">
            <h2>Nơi đón khách</h2>
            <ol class="bt-evs">${events.map((e, i) => html`<li data-ev="${i}">
              <span class="bt-time">${fmt.time(e.date)}</span><b>${e.title}</b>
              ${e.venue ? html`<span>${e.venue}</span>` : ''}${e.address ? html`<span class="bt-dim">${br(e.address)}</span>` : ''}
              ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">${say('addCalendar')}</a>` : ''}
            </li>`)}</ol>
            ${places.length ? html`<p class="bt-maps">${places.map(p => html`<a href="${p.url}" target="_blank" rel="noopener">Chỉ đường tới ${p.label}</a>`)}</p>` : ''}
          </section>
          <section class="bt-plate bt-p-rsvp" data-bearing="rsvp">
            <h2>Thả một con đom đóm</h2>
            <p>Nhận lời thì đom đóm của bạn bay lên thành một ngôi sao trên trời của hai đứa.</p>
            <a class="bt-go" href="#san">Giữ chỗ</a>
          </section>
          ${ctx.has('gift') ? html`<section class="bt-plate bt-p-gift" data-bearing="gift">
            <h2>Gửi quà mừng</h2>
            <p>Số tài khoản và mã QR ở cuối trang.</p>
            <a class="bt-go" href="#san-qua">Xem tài khoản</a>
          </section>` : ''}
          <section class="bt-plate bt-p-moon" data-bearing="moon">
            <button type="button" class="bt-gather" data-sh-gather><i aria-hidden="true"></i><span>Giữ mặt trăng để gom trời</span></button>
          </section>
        </div>
        <nav class="bt-compass" aria-label="La bàn chân trời">
          <i class="bt-needle" aria-hidden="true"></i>
          ${album.map((_, i) => html`<button type="button" class="bt-tick" style="--x:${pct(lay[i].yaw).toFixed(1)}%" data-i="${i}" aria-label="Quay tới ảnh số ${i + 1}"></button>`)}
          ${Object.entries({ date: 'Bắc: ngày cưới', venue: 'Đông: nơi đón khách', rsvp: 'Nam: giữ chỗ', gift: 'Tây: quà mừng' }).map(([k, l]) => html`<button type="button" class="bt-dir" style="--x:${pct(BEARINGS[k]).toFixed(1)}%" data-bearing="${k}"><span>${l.split(':')[0]}</span><span class="sh-sr">${l}</span></button>`)}
        </nav>
        <dialog class="bt-view" aria-label="Xem ảnh">
          <img alt="">
          <button type="button" class="bt-v-prev" aria-label="Ảnh trước">‹</button>
          <button type="button" class="bt-v-next" aria-label="Ảnh sau">›</button>
          <button type="button" class="bt-v-close">Trả ảnh lên trời</button>
        </dialog>`;
      },
      mount(el, ctx) {
        // Xem ảnh toàn màn hình: dùng ở mọi mức (bản phẳng: chạm đốm sáng; 3D: chạm ảnh đã nở)
        const dlg = el.querySelector('.bt-view'), btns = [...el.querySelectorAll('.bt-photo')];
        let cur = 0;
        const show = i => { cur = (i + btns.length) % btns.length; const im = btns[cur].querySelector('img'); dlg.querySelector('img').src = im.currentSrc || im.src; dlg.querySelector('img').alt = btns[cur].getAttribute('aria-label'); ctx.emit('viewing', cur); };
        ctx.view = i => { if (!btns.length) return; show(i); dlg.showModal?.(); };
        btns.forEach((b, i) => b.addEventListener('click', () => ctx.view(i)));
        dlg.querySelector('.bt-v-prev').addEventListener('click', () => show(cur - 1));
        dlg.querySelector('.bt-v-next').addEventListener('click', () => show(cur + 1));
        dlg.querySelector('.bt-v-close').addEventListener('click', () => dlg.close());
        let p0 = null;
        dlg.addEventListener('pointerdown', e => { p0 = { x: e.clientX, y: e.clientY }; });
        dlg.addEventListener('pointerup', e => {
          if (!p0) return; const dx = e.clientX - p0.x, dy = e.clientY - p0.y; p0 = null;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(cur + (dx < 0 ? 1 : -1));
          else if (dy < -80) dlg.close(); // hất lên: trả ảnh lên trời
        });
        // La bàn: ở bản phẳng thì cuộn tới phần tương ứng; ở bản 3D thì quay đầu (gallery bắt sự kiện 'turn')
        el.querySelectorAll('.bt-tick').forEach(t => t.addEventListener('click', () => ctx.emit('turn', { i: +t.dataset.i })));
        el.querySelectorAll('.bt-dir').forEach(t => t.addEventListener('click', () => {
          ctx.emit('turn', { bearing: t.dataset.bearing });
          if (!document.documentElement.classList.contains('bt-3d')) el.querySelector(`.bt-plate[data-bearing="${t.dataset.bearing}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }));
        el.querySelector('.bt-plates [data-sh-gather]')?.addEventListener('click', e => { if (e.detail === 0 || !document.documentElement.classList.contains('bt-3d')) { el.classList.add('is-gathered'); ctx.emit('gather'); } });
      },
      motion: {
        async cinematic(el, ctx) { await start(el, ctx, 'cinematic'); },
        async standard(el, ctx) { await start(el, ctx, 'standard'); },
        lite() {},
      },
    },

    /* ===== Chuyện hai người (tùy chọn: chỉ hiện khi cặp đôi nhập chuyện tình) ===== */
    {
      id: 'chuyen', label: 'Chuyện hai người', provides: ['story'],
      when: ctx => ctx.has('story'),
      render: ctx => html`
        <div class="bt-story-wrap">
          <h2>Chuyện hai người</h2>
          <ol class="bt-story-list">
            ${ctx.story.map(s => html`<li class="bt-story-item">
              ${s.year ? html`<p class="bt-story-year">${s.year}</p>` : ''}
              ${s.title ? html`<h3>${s.title}</h3>` : ''}
              <p>${s.text || ''}</p>
            </li>`)}
          </ol>
        </div>`,
    },

    /* ===== Bãi cỏ: giữ chỗ (đom đóm), quà mừng, sổ sao ===== */
    {
      id: 'san', label: 'Giữ chỗ và lời chúc', provides: ['rsvp', 'gift', 'guestbook'],
      render: ctx => html`
        <div class="bt-desk">
          <div class="bt-desk-rsvp">
            <h2>Giữ chỗ</h2>
            <p class="bt-lead">Gửi lời nhận, một con đom đóm sẽ bay lên thành ngôi sao mang tên bạn.</p>
            <i class="bt-fly" aria-hidden="true"></i>
            ${rsvpForm(ctx, { yes: 'Tôi sẽ tới', no: 'Tiếc quá, tôi bận', submit: 'Thả đom đóm' })}
          </div>
          ${ctx.has('gift') ? html`
          <div class="bt-desk-gift" id="san-qua">
            <h2>Gửi quà mừng</h2>
            <div class="bt-accs">${ctx.accounts.map(a => {
              const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
              const qr = qrUrl(a, note);
              return html`<div class="bt-acc">
                ${qr ? html`<img src="${qr}" alt="Mã QR chuyển khoản tới ${a.who}" loading="lazy" width="132" height="132">` : ''}
                <p><b>${a.who}</b><span>${a.bank}</span><span class="bt-num">${a.number}</span><span>${a.name}</span></p>
                <button type="button" class="bt-copy" data-copy="${a.number}">Chép số tài khoản</button>
              </div>`;
            })}</div>
          </div>` : ''}
          <div class="bt-desk-book">
            <h2>Sổ sao</h2>
            <p class="bt-lead">Mỗi lời chúc là một ngôi sao trên đỉnh trời.</p>
            ${wishForm(ctx, { submit: 'Gửi lên trời' })}
            ${wishList(ctx)}
          </div>
        </div>`,
      mount(el, ctx) {
        ctx.on('rsvp', x => { if (x?.attend !== 'Không') el.querySelector('.bt-fly')?.classList.add('is-up'); });
        el.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
        }));
      },
    },
  ],
});

async function start(el, ctx, tier) {
  try {
    const url = new URL('./sky3d.js', import.meta.url).href;
    const { runSky } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
    await runSky(el, ctx, { tier, palettes: ctx.theme.palettes, skyLayout, BEARINGS, moonPhase });
  } catch (e) {
    console.warn('[bầu trời ảnh] dùng bản phẳng:', e?.message || e);
    document.documentElement.classList.remove('bt-3d', 'bt-ready', 'bt-portrait');
  }
}
