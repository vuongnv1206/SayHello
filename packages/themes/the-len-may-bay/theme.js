// Mẫu "Thẻ Lên Máy Bay": tấm vé chính là thiệp mời, cuống vé là phiếu hồi âm.
//   Bìa: bảng giờ khởi hành lật chữ tên cô dâu chú rể và tên khách. Nút nhận thẻ bấm được ngay, không bắt chờ.
//   Vé: lời mời mang tên khách, tuyến đường, ngày dương và âm lịch, địa điểm. Gửi hồi âm xong cuống tách ra và đóng dấu.
//   Ảnh nhìn qua cửa sổ, Lịch trình hai nhà, Mừng cưới và Lời chúc, Lời hẹn.
// Mức chuyển động: chỉ CSS và Web Audio. lite: chữ hiện sẵn, cuống không dịch chuyển, ảnh đứng yên.
// Ảnh dùng: album[] (cửa sổ), images.thanks (ảnh cuối).
import { defineTheme, html, raw, br, plain, qrUrl, graphemes, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const initial = s => (s || '').trim().charAt(0).toUpperCase();

// Số hiệu chuyến: chữ cái đầu hai người (bỏ dấu) và ngày tháng cưới
const flightNo = ({ first, second }, date) => {
  const d = fmt.short(date).replace(/\D/g, '').slice(0, 4);
  return `${plain(initial(first))}${plain(initial(second))}${d}`;
};

// Mã vạch trang trí, vạch dày mỏng suy ra từ số hiệu nên mỗi thiệp một kiểu
const barcode = code => {
  const seed = [...code].reduce((n, c) => n + c.charCodeAt(0), 7);
  let x = 0, rects = '';
  for (let i = 0; x < 196; i++) {
    const w = 1 + ((seed * (i + 3)) % 3);
    rects += `<rect x="${x}" width="${w}" height="40"/>`;
    x += w + 1 + ((seed + i * 5) % 3);
  }
  return raw(`<svg class="ma-vach" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">${rects}</svg>`);
};

// Một hàng của bảng giờ bay: máy chủ in sẵn từng ô theo từ, trình duyệt chỉ việc lật
const boardRow = (text, cls = '') => {
  const words = String(text || '').toLocaleUpperCase('vi').split(/\s+/).filter(Boolean);
  return html`<p class="bb-hang ${cls}"><span class="sh-sr">${text}</span><span class="bb-o" aria-hidden="true">${words.map(w => html`<span class="bb-tu">${graphemes(w).map(g => html`<i>${g}</i>`)}</span>`)}</span></p>`;
};

// Tiếng lách cách ngắn khi nhận thẻ (không dùng file). Bị chặn thì im lặng.
let audio;
function clack() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, buf = a.createBuffer(1, Math.ceil(a.sampleRate * .03), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const src = a.createBufferSource(), g = a.createGain();
    g.gain.value = .12; src.buffer = buf; src.connect(g).connect(a.destination); src.start();
  } catch {}
}

const KY_TU = 'ABCDEGHIKLMNOPQRSTUVXY0123456789';
function flip(cells) {
  cells.forEach((cell, i) => {
    const target = cell.textContent;
    let left = 3 + (i % 4);
    const step = () => {
      cell.classList.remove('lat'); void cell.offsetWidth; cell.classList.add('lat');
      if (left-- <= 0) { cell.textContent = target; return; }
      cell.textContent = KY_TU[(i * 7 + left * 11) % KY_TU.length];
      setTimeout(step, 60);
    };
    setTimeout(step, i * 16);
  });
}

export default defineTheme({
  id: 'the-len-may-bay',
  name: 'Thẻ Lên Máy Bay',
  version: '1.0.0',
  tier: 'premium',
  layout: 'split',
  voice: 'than-mat',
  themeColor: '#1D3549',
  tagline: 'Tấm vé là thiệp mời, cuống vé là phiếu hồi âm, ảnh cưới nhìn qua cửa sổ.',
  fonts: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap',
  gateMs: 600,
  moment: {
    id: 'perforate-detach',
    verb: 'tear',
    verbLabel: 'Xé cuống vé xác nhận',
    trigger: 'submit',
    durationMs: 320,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-stamp',
  },
  features: { when: 'required', where: 'required', rsvp: 'required', map: 'optional', album: 'optional', gift: 'optional', guestbook: 'optional', countdown: 'optional', story: 'off' },
  slots: {
    images: { album: { min: 2, ideal: 5, max: 16 }, thanks: { aspect: '3:4', label: 'Ảnh lời hẹn cuối thiệp' } },
  },
  topics: [
    {
      id: 'hang-khong-co-dien', name: 'Hàng không cổ điển', desc: 'Xanh đá hàng không, giấy ngà, cửa sổ bầu dục.',
      swatch: ['#1D3549', '#B97A2B'], themeColor: '#1D3549',
      vars: { '--sh-bg': '#E8EEF1', '--sh-ink': '#1D3549', '--sh-accent': '#1D3549', '--sh-accent-ink': '#FAF7F0', '--sh-panel': '#FAF7F0', '--sh-soft': 'rgba(29,53,73,0.2)', '--tl-card': '#FAF7F0', '--tl-head': '#1D3549', '--tl-head-ink': '#FAF7F0', '--tl-mark': '#825016', '--tl-line': '#B97A2B', '--tl-board': '#111214', '--tl-board-ink': '#F4C247' },
    },
    {
      id: 'tau-thong-nhat', name: 'Tàu Thống Nhất', desc: 'Giấy vé tàu kem, xanh toa tàu, hai ga dừng và lỗ bấm soát vé.',
      swatch: ['#1E3A2F', '#A63429'], themeColor: '#1E3A2F',
      vars: { '--sh-bg': '#E6E0D1', '--sh-ink': '#1E3A2F', '--sh-accent': '#1E3A2F', '--sh-accent-ink': '#F7F3EA', '--sh-panel': '#F3EFE6', '--sh-soft': 'rgba(30,58,47,0.22)', '--tl-card': '#F3EFE6', '--tl-head': '#1E3A2F', '--tl-head-ink': '#F3EFE6', '--tl-mark': '#8F2A20', '--tl-line': '#A63429', '--tl-board': '#14261F', '--tl-board-ink': '#F2E3B3' },
    },
    {
      id: 'the-thong-hanh', name: 'Thẻ thông hành bến tàu', desc: 'Sổ hộ chiếu mở đôi, giấy bông xám ấm, chàm mực và triện bến nước.',
      swatch: ['#1B2D45', '#8D6E3B'], themeColor: '#1B2D45',
      vars: { '--sh-bg': '#1B2D45', '--sh-ink': '#1B2D45', '--sh-accent': '#1B2D45', '--sh-accent-ink': '#F5F2EC', '--sh-panel': '#EFECE6', '--sh-soft': 'rgba(27,45,69,0.22)', '--tl-card': '#EFECE6', '--tl-head': '#E4DFD5', '--tl-head-ink': '#1B2D45', '--tl-mark': '#6B5026', '--tl-line': '#8D6E3B', '--tl-board': '#101B2B', '--tl-board-ink': '#E9D5A8', '--tl-on-bg': '#F5F2EC' },
    },
    {
      id: 've-le-hoi', name: 'Thẻ vào tiệc đêm', desc: 'Giấy kraft sáng, lỗ đeo dây phía trên, ảnh vuông kiểu ảnh lấy liền.',
      swatch: ['#1F5E5B', '#F2EBE0'], themeColor: '#1F5E5B',
      vars: { '--sh-bg': '#1F1C18', '--sh-ink': '#1F1C18', '--sh-accent': '#1F5E5B', '--sh-accent-ink': '#F7F2E9', '--sh-panel': '#F2EBE0', '--sh-soft': 'rgba(31,28,24,0.22)', '--tl-card': '#F2EBE0', '--tl-head': '#1F5E5B', '--tl-head-ink': '#F7F2E9', '--tl-mark': '#1F5E5B', '--tl-line': '#1F5E5B', '--tl-board': '#12100E', '--tl-board-ink': '#8FD8CF', '--tl-on-bg': '#F2EBE0' },
    },
  ],
  defaults: {
    texts: {
      boardTitle: 'Khởi hành',
      boardInvite: 'Mời {k} lên chuyến',
      boardOpen: 'Nhận thẻ lên máy bay',
      inviteKicker: 'Trân trọng kính mời',
      inviteLine: 'đến dự lễ thành hôn của chúng mình',
      fromCode: 'BẠN',
      fromLabel: 'Từ nhà bạn',
      toLabel: 'Nơi tụi mình cưới',
      stubTitle: 'Cuống xác nhận chỗ',
      stubLead: 'Gửi hồi âm để giữ chỗ trên chuyến này.',
      stampYes: 'Đã lên chuyến',
      stampNo: 'Đã nhận hồi âm',
      windowTitle: 'Nhìn qua cửa sổ',
      eventsTitle: 'Lịch trình',
      giftTitle: 'Mừng cưới',
      wishTitle: 'Lời chúc',
      landing: 'Hẹn gặp {k} ở {c}',
    },
  },

  scenes: [
    /* ===== 1. Bảng giờ bay (bìa) ===== */
    {
      id: 'bang-bay', kind: 'gate',
      render: ({ names: n, texts: t, date, city, guest }) => {
        const [before, after] = (t.boardInvite || '').split('{k}');
        return html`
        <div class="bb">
          <p class="bb-dau"><span>${t.boardTitle}</span><span>${fmt.time(date)} · ${fmt.short(date)}</span></p>
          <h1 class="bb-ten">${boardRow(n.first)}${boardRow(`và ${n.second}`)}</h1>
          ${city ? boardRow(city, 'bb-noi') : ''}
          <p class="bb-moi">${before}${after !== undefined ? html`<b>${guest()}</b>${after}` : ''}</p>
          <button type="button" class="bb-nut" data-open>${t.boardOpen}</button>
        </div>`;
      },
      mount(el, ctx) {
        if (!ctx.reduced) flip([...el.querySelectorAll('.bb-o i')]);
        el.querySelector('[data-open]')?.addEventListener('click', () => {
          if (ctx.opened) return;
          if (!ctx.reduced) clack();
          ctx.open();
        });
      },
    },

    /* ===== 2. Tấm vé: thiệp mời và cuống hồi âm ===== */
    {
      id: 'tam-ve', label: 'Thẻ lên máy bay', provides: ['when', 'where', 'rsvp', 'countdown'],
      render: ctx => {
        const { names: n, texts: t, date, city, main, guest } = ctx;
        const code = flightNo(n, date);
        return html`
        <div class="ve">
          <article class="the" aria-label="Thiệp mời">
            <div class="the-dau">
              <p class="kinh-moi">${t.inviteKicker}</p>
              <p class="hanh-khach">${guest('Quý khách')}</p>
              <p class="le">${t.inviteLine}</p>
              <h2 class="ten-doi"><span>${n.first}</span><i>và</i><span>${n.second}</span></h2>
            </div>
            <div class="the-than">
              <div class="tuyen">
                <div class="ga di"><p class="ma">${t.fromCode}</p><p class="nho">${t.fromLabel}</p></div>
                <svg viewBox="0 0 120 24" aria-hidden="true"><path d="M2 18 Q60 -6 118 18" fill="none" stroke="currentColor" stroke-dasharray="3 4"/><path d="M58 3l8 3-8 3-1-2 3-1-3-1z" fill="currentColor"/></svg>
                <div class="ga den"><p class="ma">${city || n.second}</p><p class="nho">${t.toLabel}</p></div>
              </div>
              <dl class="o-tin">
                <div class="rong"><dt>Ngày cưới</dt><dd>${fmt.long(date)}</dd>${main?.lunar ? html`<dd class="am">${main.lunar}</dd>` : ''}</div>
                <div><dt>Giờ đón khách</dt><dd class="so">${fmt.time(main?.date || date)}</dd></div>
                <div><dt>Số hiệu</dt><dd class="so">${code}</dd></div>
                ${main?.venue || main?.address ? html`<div class="rong"><dt>Cổng đến</dt><dd>${main.venue || ''}</dd>${main.address ? html`<dd class="am">${br(main.address)}</dd>` : ''}</div>` : ''}
              </dl>
              <div class="con-lai">${countdown(ctx, { done: 'Chuyến đã cất cánh' })}</div>
            </div>
          </article>

          <div class="cuong">
            <div class="cuong-trong">
              <p class="cuong-dau">${t.stubTitle}</p>
              ${barcode(code)}
              <p class="cuong-loi">${t.stubLead}</p>
              ${rsvpForm(ctx, { yes: 'Mình sẽ bay cùng', no: 'Tiếc là không bay được', submit: 'Gửi và xé cuống vé' })}
              <p class="dau-moc" hidden></p>
            </div>
          </div>
        </div>`;
      },
      mount(el, ctx) {
        const stub = el.querySelector('.cuong'), stamp = el.querySelector('.dau-moc');
        ctx.on('rsvp', x => {
          stamp.textContent = x.attend === 'Không' ? ctx.data.texts?.stampNo || 'Đã nhận hồi âm' : ctx.data.texts?.stampYes || 'Đã lên chuyến';
          stamp.hidden = false;
          stub.classList.add('xe');
          if (!ctx.reduced) clack();
        });
      },
    },

    /* ===== 3. Ảnh nhìn qua cửa sổ ===== */
    {
      id: 'cua-so', label: 'Ảnh cưới', provides: ['album'], when: ctx => ctx.has('album'),
      render: ({ album, captions, texts: t }) => html`
        <h2>${t.windowTitle}</h2>
        <div class="khoang">
          ${album.slice(0, 8).map((src, i) => html`
            <figure class="o-cua">
              <div class="kinh"><img src="${src}" alt="${captions[i] || `Ảnh cưới ${i + 1}`}" loading="lazy" decoding="async"></div>
              ${captions[i] ? html`<figcaption>${captions[i]}</figcaption>` : ''}
            </figure>`)}
        </div>`,
      mount(el, ctx) {
        if (ctx.reduced) return;
        const frames = [...el.querySelectorAll('.kinh')];
        let queued = false;
        const update = () => {
          queued = false;
          const vh = innerHeight;
          frames.forEach(f => {
            const r = f.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            f.style.setProperty('--p', Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh)).toFixed(3));
          });
        };
        addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
        ctx.on('open', () => requestAnimationFrame(update));
      },
    },

    /* ===== 4. Lịch trình ===== */
    {
      id: 'lich-trinh', label: 'Lịch trình', provides: ['when', 'where', 'map'],
      render: ({ events, places, families, texts: t }) => {
        const place = e => places.find(p => p.address && e.address && p.address === e.address) || null;
        return html`
        <h2>${t.eventsTitle}</h2>
        <ol class="chang">
          ${events.map((e, i) => html`
            <li data-ev="${i}">
              <p class="gio">${fmt.time(e.date)}</p>
              <div>
                <h3>${e.title}</h3>
                <p>${fmt.long(e.date)}</p>
                ${e.lunar ? html`<p class="am">${e.lunar}</p>` : ''}
                ${e.venue ? html`<p><b>${e.venue}</b></p>` : ''}
                ${e.address ? html`<p>${br(e.address)}</p>` : ''}
                <p class="lien-ket">
                  ${place(e) ? html`<a href="${place(e).url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                  ${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">Lưu vào lịch</a>` : ''}
                </p>
              </div>
            </li>`)}
        </ol>
        ${families.length ? html`
          <div class="hai-nha">${families.map(f => html`
            <div><p class="nha">${f.side}</p>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<p class="am">${br(f.address)}</p>` : ''}</div>`)}
          </div>` : ''}`;
      },
    },

    /* ===== 5. Mừng cưới và lời chúc ===== */
    {
      id: 'hanh-ly', label: 'Mừng cưới và lời chúc', provides: ['gift', 'guestbook'],
      render: ctx => html`
        ${ctx.has('gift') ? html`
          <h2>${ctx.texts.giftTitle}</h2>
          <div class="tai-khoan">${ctx.accounts.map(a => {
            const qr = qrUrl(a, plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50));
            return html`
              <article class="tk">
                <p class="ai">${a.who}</p>
                ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR chuyển khoản tới ${a.name}" loading="lazy" width="180" height="180">` : ''}
                <p><b>${a.bank}</b></p>
                <p class="so"><span>${a.number}</span><button type="button" class="chep" data-copy="${a.number}">Chép số</button></p>
                <p>${a.name}</p>
              </article>`;
          })}</div>` : ''}
        <div class="so-chuc">
          <h2>${ctx.texts.wishTitle}</h2>
          ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
          ${wishList(ctx)}
        </div>`,
      mount(el, ctx) {
        if (ctx.guest) {
          const note = encodeURIComponent(`Mung cuoi ${plain(ctx.guest)}`.slice(0, 50));
          el.querySelectorAll('img.qr').forEach(img => { img.src = img.src.replace(/addInfo=[^&]*/, `addInfo=${note}`); });
        }
        el.querySelectorAll('.chep').forEach(b => b.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã chép'; } catch { b.textContent = b.dataset.copy; }
          setTimeout(() => { b.textContent = 'Chép số'; }, 2000);
        }));
      },
    },

    /* ===== 6. Lời hẹn ===== */
    {
      id: 'ha-canh', kind: 'finale', label: 'Lời hẹn',
      render: ({ names: n, texts: t, city, img, guest, date }) => {
        const [a, rest = ''] = (t.landing || '').split('{k}');
        const [b, c] = rest.split('{c}');
        const src = img('thanks', 0);
        return html`
          ${src ? html`<img src="${src}" alt="" loading="lazy">` : ''}
          <div class="hc">
            <p class="hc-chu">${a}${guest()}${c !== undefined ? html`${b}${city || n.second}${c}` : b}</p>
            <p class="hc-nho">${n.first} và ${n.second} · ${fmt.short(date)}</p>
          </div>`;
      },
    },
  ],
});
