// Mẫu "Photobooth": thiệp là góc chụp ảnh ở tiệc cưới.
//   Bìa: máy chụp trắng có rèm voan giữa sảnh tiệc đêm. Bấm Chụp: rèm vén, đếm 3-2-1, flash trắng cả màn hình bốn lần.
//   Thiệp: dải ảnh in ra từ khe máy chính là tấm thiệp; ô cuối là lời mời có tên khách; ảnh hiện dần như ảnh lấy liền.
//   Lễ và tiệc, Hồi âm (gửi xong in một dải ảnh mang tên khách để lưu), Mừng cưới, Lời chúc, Lời cảm ơn.
// Mức chuyển động: chỉ CSS và Web Audio, không nạp thư viện. lite: không đếm, không flash, thiệp in sẵn.
// Ảnh dùng: images.hero (màn hình máy chụp), album[] (ô trong dải ảnh và ảnh thêm).
import { defineTheme, html, br, rsvpForm, wishForm, wishList, countdown, fmt, qrUrl } from '@sayhello/engine';

const initial = s => (s || '').trim().charAt(0).toUpperCase();
const ngay = iso => fmt.dots(iso).replace(/ · /g, '.');

// Tiếng màn trập tổng hợp bằng Web Audio (không dùng file). Bị chặn thì im lặng.
let audio;
function shutter() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, buf = a.createBuffer(1, Math.ceil(a.sampleRate * .12), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'bandpass'; f.frequency.value = 2200; g.gain.value = .35;
    src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
  } catch {}
}

const wait = (ms, ctx) => new Promise(r => setTimeout(r, ctx.reduced ? 0 : ms));

export default defineTheme({
  id: 'photobooth',
  name: 'Photobooth',
  version: '1.0.0',
  tier: 'premium',
  layout: 'scroll',
  voice: 'trang-trong',
  themeColor: '#141b2d',
  fonts: 'https://fonts.googleapis.com/css2?family=Noto+Serif+Display:ital,wght@0,200;0,300;0,400;1,300&family=Pinyon+Script&family=Be+Vietnam+Pro:wght@300;400;500&display=swap',
  gateMs: 700,
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional', story: 'off' },
  slots: {
    images: { hero: { required: true, aspect: '3:4', label: 'Ảnh trên màn hình máy chụp' }, album: { min: 3, ideal: 6, max: 24 } },
  },
  palettes: [
    { id: 'dem-xanh', name: 'Đêm xanh', swatch: ['#141b2d', '#b79c6b'] },
    { id: 'dem-ruou', name: 'Rượu vang', swatch: ['#2a1420', '#c7a56f'], vars: { '--dem': '#24111b', '--dem-2': '#3a1a2a', '--kim': '#c7a56f' } },
    { id: 'rung-dem', name: 'Rừng đêm', swatch: ['#11201b', '#b9a274'], vars: { '--dem': '#0f1c18', '--dem-2': '#1a3029', '--kim': '#b9a274' } },
  ],
  defaults: {
    texts: {
      boothKicker: 'Lễ thành hôn',
      boothInvite: 'Mời {k} chụp cùng cô dâu chú rể',
      boothShoot: 'Chụp',
      skip: 'Xem thiệp ngay',
      inviteKicker: 'Trân trọng kính mời',
      inviteLine: 'đến dự lễ thành hôn của',
      eventsTitle: 'Lễ và tiệc',
      rsvpTitle: 'Hồi âm',
      rsvpLead: 'Báo cô dâu chú rể bạn có đến không. Gửi xong, máy sẽ in một dải ảnh mang tên bạn để giữ làm kỷ niệm.',
      giftTitle: 'Mừng cưới',
      wishTitle: 'Lời chúc',
      thanks: 'Cảm ơn bạn đã ghé góc chụp của tụi mình. Hẹn gặp bạn ở tiệc.',
    },
  },

  scenes: [
    /* ===== 1. Góc chụp (bìa) ===== */
    {
      id: 'goc-chup', kind: 'gate',
      render: ({ names: n, texts: t, img, guest }) => {
        const [before, after] = (t.boothInvite || '').split('{k}');
        return html`
        <i class="lap-lanh" aria-hidden="true"></i>
        <div class="goc">
          <p class="bang-ten"><span class="kich">${t.boothKicker}</span><span class="ten-cap">${n.first} và ${n.second}</span></p>
          <div class="may">
            <i class="rem l" aria-hidden="true"></i><i class="rem r" aria-hidden="true"></i>
            <div class="man-hinh">
              <img class="xem" src="${img('hero', 0)}" alt="" fetchpriority="high">
              <p class="dem" aria-live="assertive"></p>
              <p class="loi-man">${before}${after !== undefined ? html`${guest()}${after}` : ''}</p>
            </div>
            <div class="bang">
              <p class="cham" aria-hidden="true"><i></i><i></i><i></i><i></i></p>
              <button type="button" class="nut-chup"><span>${t.boothShoot}</span></button>
            </div>
            <i class="khe" aria-hidden="true"></i>
          </div>
          <button type="button" class="bo-qua" data-skip>${t.skip}</button>
        </div>
        <i class="flash" aria-hidden="true"></i>`;
      },
      mount(el, ctx) {
        const shots = [...ctx.root.querySelectorAll('#thiep .o img')].map(i => i.getAttribute('src'));
        const xem = el.querySelector('.xem'), dem = el.querySelector('.dem'), flash = el.querySelector('.flash');
        const loi = el.querySelector('.loi-man'), cham = [...el.querySelectorAll('.cham i')], btn = el.querySelector('.nut-chup');
        let busy = false;
        const shoot = async () => {
          if (busy || ctx.opened) return;
          busy = true; btn.disabled = true;
          if (ctx.reduced) { ctx.open(); return; }
          el.querySelector('.may').classList.add('mo-rem');
          loi.textContent = 'Nhìn vào máy nhé';
          await wait(900, ctx);
          for (let k = 0; k < 4; k++) {
            if (shots[k]) xem.src = shots[k];
            for (const so of k === 0 ? [3, 2, 1] : [1]) {
              dem.textContent = so; dem.classList.remove('nhay'); void dem.offsetWidth; dem.classList.add('nhay');
              await wait(k === 0 ? 750 : 600, ctx);
            }
            dem.textContent = '';
            shutter();
            flash.classList.remove('no'); void flash.offsetWidth; flash.classList.add('no');
            cham[k].classList.add('da');
            await wait(650, ctx);
          }
          loi.textContent = 'Đang in thiệp của bạn';
          await wait(500, ctx);
          ctx.open();
        };
        btn.addEventListener('click', shoot);
        el.querySelector('[data-skip]').addEventListener('click', () => { ctx.skipped = true; ctx.open(); });
      },
    },

    /* ===== 2. Dải ảnh in ra: tấm thiệp ===== */
    {
      id: 'thiep', label: 'Thiệp mời', provides: ['when', 'where'],
      render: ({ names: n, texts: t, img, album, guest, main, date }) => html`
        <i class="khe-in" aria-hidden="true"></i>
        <div class="khung-in">
          <article class="dai">
            <p class="dai-dau">${initial(n.first)}<span>và</span>${initial(n.second)}</p>
            ${[0, 1, 2].map(i => html`<figure class="o"><img src="${album[i] || img('hero', i)}" alt="Ảnh cưới ${i + 1}"></figure>`)}
            <div class="o-moi">
              <p class="kinh-moi">${t.inviteKicker}</p>
              <p class="moi-ten">${guest('Quý khách')}</p>
              <p class="moi-chu">${t.inviteLine}</p>
              <h1 class="moi-doi"><span>${n.first}</span><span class="va">và</span><span>${n.second}</span></h1>
              <p class="moi-ngay">${fmt.time(main?.date || date)}, ${fmt.long(main?.date || date)}</p>
              ${main?.venue ? html`<p class="moi-noi">${main.venue}</p>` : ''}
            </div>
          </article>
        </div>
        <p class="goi-y" aria-hidden="true"></p>`,
      mount(el, ctx) {
        const hint = el.querySelector('.goi-y');
        ctx.on('open', ({ instant }) => {
          if (instant || ctx.reduced || ctx.skipped) { el.classList.add('in', 'hien', 'xong'); return; }
          hint.textContent = 'Ảnh đang hiện dần…';
          requestAnimationFrame(() => el.classList.add('in'));
          setTimeout(() => el.classList.add('hien'), 1700);
          setTimeout(() => { el.classList.add('xong'); hint.textContent = 'Kéo xuống để xem giờ lễ và hồi âm'; }, 4800);
        });
      },
    },

    /* ===== 3. Lễ và tiệc ===== */
    {
      id: 'le-tiec', label: 'Lễ và tiệc', provides: ['when', 'where', 'map', 'countdown', 'album'],
      render: ctx => {
        const { events, places, families, texts: t, album } = ctx;
        const place = e => places.find(p => p.address && e.address && p.address === e.address) || null;
        const more = album.slice(3, 9);
        return html`
        <h2>${t.eventsTitle}</h2>
        ${events.map((e, i) => html`
          <article class="buoi" data-ev="${i}">
            <p class="gio">${fmt.time(e.date)}</p>
            <div>
              <h3>${e.title}</h3>
              <p class="ngay">${fmt.long(e.date)}</p>
              ${e.lunar ? html`<p class="am">${e.lunar}</p>` : ''}
              ${e.venue ? html`<p>${e.venue}</p>` : ''}
              ${e.address ? html`<p class="dc">${br(e.address)}</p>` : ''}
              <p class="lien-ket">
                ${place(e) ? html`<a href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
              </p>
            </div>
          </article>`)}
        ${families.length ? html`
          <div class="hai-nha">${families.map(f => html`
            <div><p class="nha">${f.side}</p>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}</div>`)}
          </div>` : ''}
        <div class="con-lai"><p>Còn</p>${countdown(ctx, { done: 'Hôm nay là ngày cưới' })}</div>
        ${more.length ? html`<div class="them-anh">${more.map((src, i) => html`<img src="${src}" alt="Ảnh cưới ${i + 4}" loading="lazy">`)}</div>` : ''}`;
      },
    },

    /* ===== 4. Hồi âm: gửi xong in dải ảnh mang tên khách ===== */
    {
      id: 'hoi-am', label: 'Hồi âm', provides: ['rsvp'],
      render: ctx => html`
        <h2>${ctx.texts.rsvpTitle}</h2>
        <p class="dan">${ctx.texts.rsvpLead}</p>
        <div class="ha-luoi">
          ${rsvpForm(ctx, { yes: 'Sẽ đến chung vui', no: 'Tiếc là không đến được', submit: 'Gửi hồi âm', wish: false })}
          <div class="ket-qua" hidden data-cap="${ctx.names.first} và ${ctx.names.second}" data-chu="${initial(ctx.names.first)}  và  ${initial(ctx.names.second)}" data-ngay="${ngay(ctx.date)}">
            <canvas width="600" height="1800" aria-label="Dải ảnh mang tên bạn"></canvas>
            <a class="sh-btn vien" download>Lưu dải ảnh</a>
          </div>
        </div>`,
      mount(el, ctx) {
        const info = el.querySelector('.ket-qua').dataset;
        const shots = [...ctx.root.querySelectorAll('#thiep .o img')].map(i => i.currentSrc || i.src);
        const load = src => new Promise((ok, no) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
        ctx.on('rsvp', async x => {
          const cv = el.querySelector('canvas'), c = cv.getContext('2d');
          const W = 600, P = 36, w = W - P * 2, h = Math.round(w * .75), G = 24;
          const css = getComputedStyle(ctx.root), kim = css.getPropertyValue('--kim').trim() || '#b79c6b';
          cv.height = P + 70 + 3 * h + 2 * G + 360;
          c.fillStyle = '#fff'; c.fillRect(0, 0, W, cv.height); c.textAlign = 'center';
          try { await Promise.all([document.fonts.load('40px "Pinyon Script"'), document.fonts.load('300 40px "Noto Serif Display"')]); } catch {}
          c.fillStyle = kim; c.font = '300 34px "Noto Serif Display"'; c.fillText(info.chu, W / 2, P + 40);
          const imgs = await Promise.all(shots.slice(0, 3).map(s => load(s).catch(() => null)));
          imgs.forEach((im, k) => {
            const y = P + 70 + k * (h + G);
            if (!im) { c.fillStyle = '#e9e6e1'; c.fillRect(P, y, w, h); return; }
            const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
            c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, P, y, w, h);
          });
          const y0 = P + 70 + 3 * h + 2 * G, den = x.attend === 'Có';
          c.fillStyle = kim; c.font = '46px "Pinyon Script"'; c.fillText(den ? 'Hẹn gặp' : 'Cảm ơn', W / 2, y0 + 80);
          c.fillStyle = '#1e2740'; c.font = '400 40px "Noto Serif Display"'; c.fillText(x.name || '', W / 2, y0 + 140);
          c.font = '300 48px "Noto Serif Display"'; c.fillText(info.cap, W / 2, y0 + 228);
          c.fillStyle = '#6b7183'; c.font = '400 24px "Be Vietnam Pro"'; c.fillText(info.ngay, W / 2, y0 + 278);
          const kq = el.querySelector('.ket-qua'), a = kq.querySelector('a');
          kq.hidden = false;
          try { a.href = cv.toDataURL('image/png'); a.hidden = false; } catch { a.hidden = true; }
          a.download = 'thiep-cuoi.png';
          kq.scrollIntoView({ behavior: ctx.reduced ? 'auto' : 'smooth', block: 'center' });
        });
      },
    },

    /* ===== 5. Mừng cưới ===== */
    {
      id: 'mung-cuoi', label: 'Mừng cưới', provides: ['gift'], when: ctx => ctx.has('gift'),
      render: ({ accounts, texts: t }) => html`
        <h2>${t.giftTitle}</h2>
        <div class="tai-khoan">${accounts.map(a => html`
          <article class="tk">
            <p class="ai">${a.who}</p>
            ${qrUrl(a, 'Mung cuoi') ? html`<img class="qr" src="${qrUrl(a, 'Mung cuoi')}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="200" height="200">` : ''}
            <p><b>${a.bank}</b></p>
            <p class="so"><span>${a.number}</span><button type="button" class="chep" data-copy="${a.number}">Chép số</button></p>
            <p>${a.name}</p>
          </article>`)}
        </div>`,
      mount(el) {
        el.querySelectorAll('.chep').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
      },
    },

    /* ===== 6. Lời chúc ===== */
    {
      id: 'loi-chuc', label: 'Lời chúc', provides: ['guestbook'],
      render: ctx => html`
        <h2>${ctx.texts.wishTitle}</h2>
        ${wishForm(ctx, { submit: 'Gửi lời chúc', placeholder: 'Viết vài dòng cho cô dâu chú rể…' })}
        ${wishList(ctx)}`,
    },

    /* ===== 7. Lời cảm ơn ===== */
    {
      id: 'cam-on', kind: 'finale', label: 'Lời cảm ơn',
      render: ({ names: n, texts: t, date }) => html`
        <p class="ten-cuoi">${n.first} và ${n.second}</p>
        <p class="ngay-cuoi">${ngay(date)}</p>
        <p class="cam-on">${t.thanks}</p>`,
    },
  ],
});
