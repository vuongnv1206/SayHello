import { defineTheme, html, br, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const pad2 = n => String(n).padStart(2, '0');

function renderDepthFrame(pair, alt, bigText, eager = false, hasFgClass = '') {
  const { bg, fg } = pair;
  const cls = fg ? `cs-frame ${hasFgClass}` : `cs-frame no-fg ${hasFgClass}`;
  return html`
    <div class="${cls}">
      <img class="cs-bg" src="${bg}" alt="${alt}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? html` fetchpriority="high"` : ''}>
      ${bigText ? html`<p class="cs-big" aria-hidden="true">${bigText}</p>` : ''}
      ${fg ? html`<img class="cs-fg" src="${fg}" alt="" aria-hidden="true" loading="${eager ? 'eager' : 'lazy'}" decoding="async">` : ''}
    </div>`;
}

function mountDepthFrames(el, ctx) {
  const frames = [...el.querySelectorAll('.cs-frame')];
  if (!frames.length) return;
  frames.forEach(f => {
    const fg = f.querySelector('.cs-fg');
    if (!fg) return;
    const onErr = () => { f.classList.add('no-fg'); fg.remove(); };
    if (fg.complete && fg.naturalWidth === 0) onErr();
    else fg.addEventListener('error', onErr, { once: true });
  });
  if (ctx.reduced || ctx.motion === 'lite') return;
  const update = () => {
    const vh = Math.max(1, window.innerHeight);
    for (const f of frames) {
      const r = f.getBoundingClientRect();
      const center = (r.top + r.height * 0.5) / vh;
      const p = Math.max(-1, Math.min(1, (0.5 - center) * 1.4));
      f.style.setProperty('--p', p.toFixed(3));
    }
  };
  let raf = 0;
  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; update(); });
  };
  update();
  ctx.on('open', update);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}

export default defineTheme({
  id: 'chieu-sau',
  name: 'Chiều Sâu',
  version: '1.0.0',
  tier: 'cinematic',
  layout: { id: 'lookbook', split: '62-38', alternating: true },
  voice: 'than-mat',
  themeColor: '#DDE3DF',
  tagline: 'Lookbook điện ảnh 2.5D · Tách lớp tiền cảnh & đẩy tiêu cự quang học',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap',
  gateMs: 450,
  moment: {
    id: 'optical-push',
    verb: 'push-in',
    verbLabel: 'Đẩy tiêu cự 2.5D trong khung hình',
    trigger: 'scroll',
    durationMs: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'static-frame',
  },
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
      hero: { required: true, aspect: '3:4', label: 'Khung hình bìa tách lớp 2.5D' },
      album: { min: 2, ideal: 6, max: 16 },
    },
    story: { optional: true, maxItems: 6 },
  },
  topics: [
    {
      id: 'suong-da-lat',
      name: 'Sương Đà Lạt',
      desc: 'Xanh thông sương sớm, nền sương mù dịu và ánh hổ phách ấm.',
      swatch: ['#DDE3DF', '#724322'],
      themeColor: '#DDE3DF',
      vars: {
        '--sh-bg': '#DDE3DF',
        '--sh-surface': '#CFD7D2',
        '--sh-ink': '#1C2621',
        '--sh-accent': '#724322',
        '--sh-accent-ink': '#FAF7F2',
        '--sh-foil': '#B87A4B',
        '--sh-soft': 'rgba(28, 38, 33, 0.16)',
        '--sh-panel': '#CFD7D2',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'dem-sai-gon',
      name: 'Đêm Sài Gòn 90s',
      desc: 'Nhựa đường đêm khuya, đèn đường hổ phách và nhịp chữ hiện đại.',
      swatch: ['#121316', '#E2A86B'],
      themeColor: '#121316',
      vars: {
        '--sh-bg': '#121316',
        '--sh-surface': '#1B1D22',
        '--sh-ink': '#F2EDE4',
        '--sh-accent': '#E2A86B',
        '--sh-accent-ink': '#141210',
        '--sh-foil': '#D49A5A',
        '--sh-soft': 'rgba(242, 237, 228, 0.18)',
        '--sh-panel': '#1B1D22',
        '--sh-font-display': "'Bricolage Grotesque', system-ui, sans-serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'chang-vang-bien',
      name: 'Chạng Vạng Biển',
      desc: 'Xanh lam chạng vạng, giấy muối biển và đường chân trời mảnh.',
      swatch: ['#1D2E3A', '#D7B996'],
      themeColor: '#1D2E3A',
      vars: {
        '--sh-bg': '#1D2E3A',
        '--sh-surface': '#253A48',
        '--sh-ink': '#F3F0EA',
        '--sh-accent': '#D7B996',
        '--sh-accent-ink': '#16232C',
        '--sh-foil': '#C9B296',
        '--sh-soft': 'rgba(243, 240, 234, 0.18)',
        '--sh-panel': '#253A48',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  defaults: {
    texts: {
      coverKicker: 'Thư mời ngày chung đôi',
      coverHint: 'Chạm mở khung hình để bước vào thiệp cưới',
      heroKicker: 'Trân trọng kính mời',
      eventsTitle: 'Lịch Lễ & Tiệc',
      albumTitle: 'Cuộn Ảnh Chiều Sâu',
      storyTitle: 'Những Khung Hình Giữ Lại',
      rsvpTitle: 'Hẹn Gặp Bạn Trong Ngày Vui',
      rsvpLead: 'Báo giúp tụi mình biết bạn có thể thu xếp tới chung vui nhé.',
      giftTitle: 'Gửi Quà Mừng',
      wishTitle: 'Lưu Bút Khách Mời',
    },
  },
  scenes: [
    {
      id: 'man-mo',
      kind: 'gate',
      render: ({ names: n, date, city, guest, texts: t, imgPair }) => {
        const hero = imgPair('hero', 0);
        return html`
          <div class="cs-gate-shell">
            <div class="cs-gate-media">
              <img src="${hero.bg}" alt="${n.pair}" fetchpriority="high" decoding="async">
              <div class="cs-gate-scrim" aria-hidden="true"></div>
            </div>
            <div class="cs-gate-copy">
              <p class="cs-kicker">${t.coverKicker}</p>
              <p class="cs-gate-guest">Kính mời ${guest()}</p>
              <h1>${n.first} <em>&amp;</em> ${n.second}</h1>
              <p class="cs-gate-meta">${fmt.dots(date)}${city ? html` · ${city}` : ''}</p>
              <button type="button" class="sh-btn sh-tactile-btn cs-open-btn" data-open>Mở khung hình</button>
              <p class="cs-gate-hint">${t.coverHint}</p>
            </div>
          </div>`;
      },
      mount(el, ctx) {
        const btn = el.querySelector('[data-open]');
        const shell = el.querySelector('.cs-gate-shell');
        let timer = 0;
        const openNow = () => {
          if (ctx.opened) return;
          el.classList.add('is-opening');
          clearTimeout(timer);
          timer = setTimeout(() => ctx.open(), ctx.reduced ? 80 : 250);
        };
        btn?.addEventListener('click', openNow);
        shell?.addEventListener('click', e => {
          if (!e.target.closest('button, a')) openNow();
        });
      },
    },
    {
      id: 'trang-bia',
      label: 'Thiệp mời chính & lịch lễ',
      provides: ['when', 'where', 'map', 'countdown'],
      render: ctx => {
        const { names: n, date, city, main, events, places, families, texts: t, guest, imgPair } = ctx;
        const heroPair = imgPair('hero', 0);
        const placeFor = ev => places.find(p => p.address && ev.address && p.address === ev.address) || places[0];
        return html`
          <div class="cs-spread cs-hero-spread">
            <div class="cs-media-col">
              ${renderDepthFrame(heroPair, n.pair, fmt.dots(date).slice(0, 5), true)}
            </div>
            <div class="cs-type-col">
              <p class="cs-kicker">${t.heroKicker} ${guest()}</p>
              <h2 class="cs-title-names">${n.first} <em>&amp;</em> ${n.second}</h2>
              <p class="cs-date-line">${fmt.long(date)} · ${fmt.time(date)}</p>
              ${main?.lunar ? html`<p class="cs-lunar">${main.lunar}</p>` : ''}
              <div class="cs-venue-card">
                ${main?.venue ? html`<b>${main.venue}</b>` : ''}
                ${main?.address ? html`<span>${br(main.address)}</span>` : city ? html`<span>${city}</span>` : ''}
              </div>
              ${countdown(ctx)}
              <div class="cs-hero-cta">
                <a class="sh-btn" href="#loi-hen">Xác nhận tham dự</a>
              </div>
              ${families.length ? html`
                <div class="cs-fam-row">
                  ${families.map(f => html`
                    <div class="cs-fam-box">
                      <small>${f.side}</small>
                      ${f.father ? html`<span>Ông ${f.father}</span>` : ''}
                      ${f.mother ? html`<span>Bà ${f.mother}</span>` : ''}
                    </div>`)}
                </div>` : ''}
            </div>
          </div>

          <div class="cs-events-band">
            <p class="cs-kicker">${t.eventsTitle}</p>
            <div class="cs-events-grid">
              ${events.map((ev, i) => {
                const p = placeFor(ev);
                return html`
                  <article class="cs-ev-card ${ev.main ? 'is-main' : ''}" data-ev="${i}">
                    <div class="cs-ev-head">
                      <h3>${ev.title}</h3>
                      <span>${fmt.time(ev.date)} · ${fmt.short(ev.date)}</span>
                    </div>
                    ${ev.lunar ? html`<p class="cs-lunar">${ev.lunar}</p>` : ''}
                    ${ev.venue ? html`<p class="cs-ev-venue">${ev.venue}</p>` : ''}
                    ${ev.address ? html`<p class="cs-ev-addr">${br(ev.address)}</p>` : ''}
                    <div class="cs-ev-actions">
                      ${p ? html`<a class="sh-btn cs-ghost" href="${p.url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                      ${ev.gcal ? html`<a class="sh-btn cs-ghost" href="${ev.gcal}" target="_blank" rel="noopener">Lưu lịch</a>` : ''}
                    </div>
                  </article>`;
              })}
            </div>
          </div>`;
      },
      mount(el, ctx) {
        mountDepthFrames(el, ctx);
      },
    },
    {
      id: 'cuon-anh',
      label: 'Cuộn ảnh cưới',
      provides: ['album'],
      when: ctx => ctx.has('album'),
      render: ctx => {
        const { album, captions, texts: t, imgPair } = ctx;
        return html`
          <div class="cs-lookbook">
            <p class="cs-kicker cs-lookbook-head">${t.albumTitle}</p>
            <div class="cs-spreads">
              ${album.map((_, i) => {
                const pair = imgPair('album', i);
                const cap = captions[i] || `Khung hình ${pad2(i + 1)}`;
                const flip = i % 2 === 1 ? 'is-flip' : '';
                return html`
                  <article class="cs-spread cs-lookbook-item ${flip}">
                    <div class="cs-media-col">
                      ${renderDepthFrame(pair, cap, pad2(i + 1), i === 0)}
                    </div>
                    <div class="cs-type-col">
                      <span class="cs-frame-no">Khung ${pad2(i + 1)}</span>
                      <h3>${cap}</h3>
                      <p class="cs-frame-sub">${pair.fg ? 'Khoảnh khắc chân dung được giữ lại cho ngày chung vui.' : 'Góc nhìn rộng ghi lại không gian buổi hẹn đầu.'}</p>
                    </div>
                  </article>`;
              })}
            </div>
          </div>`;
      },
      mount(el, ctx) {
        mountDepthFrames(el, ctx);
      },
    },
    {
      id: 'chuyen-tinh',
      label: 'Câu chuyện',
      provides: ['story'],
      when: ctx => ctx.has('story'),
      render: ({ story, texts: t }) => html`
        <div class="cs-story-band">
          <p class="cs-kicker">${t.storyTitle}</p>
          <div class="cs-story-grid">
            ${story.map((s, i) => html`
              <article class="cs-story-card">
                <span class="cs-story-year">${s.year || pad2(i + 1)}</span>
                <h3>${s.title}</h3>
                ${s.text ? html`<p>${s.text}</p>` : ''}
              </article>`)}
          </div>
        </div>`,
    },
    {
      id: 'loi-hen',
      kind: 'finale',
      label: 'Xác nhận, quà mừng & lưu bút',
      provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => html`
        <div class="cs-finale">
          <div class="cs-finale-grid">
            <div class="cs-rsvp-box">
              <p class="cs-kicker">${ctx.texts.rsvpTitle}</p>
              <p class="cs-lead">${ctx.texts.rsvpLead}</p>
              ${rsvpForm(ctx, { yes: 'Sẽ tới chung vui', no: 'Tiếc quá, mình bận', submit: 'Gửi xác nhận' })}
            </div>
            <div class="cs-wish-box">
              <p class="cs-kicker">${ctx.texts.wishTitle}</p>
              ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
              ${wishList(ctx)}
            </div>
          </div>

          ${ctx.has('gift') ? html`
            <div class="cs-gift-box">
              <p class="cs-kicker">${ctx.texts.giftTitle}</p>
              <div class="accounts">
                ${ctx.accounts.map(a => {
                  const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
                  const qr = qrUrl(a, note);
                  return html`
                    <article class="cs-acc">
                      ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR mừng cưới ${a.who}" width="144" height="144" loading="lazy">` : ''}
                      <div class="cs-acc-info">
                        <b>${a.who}</b>
                        <span>${a.bank}</span>
                        <span class="cs-acc-num">${a.number}</span>
                        <span>${a.name}</span>
                        <button type="button" class="sh-btn cs-ghost" data-copy="${a.number}">Chép số tài khoản</button>
                      </div>
                    </article>`;
                })}
              </div>
            </div>` : ''}
        </div>`,
      mount(el, ctx) {
        if (ctx.guest) {
          const note = encodeURIComponent(`Mung cuoi ${plain(ctx.guest)}`.slice(0, 50));
          el.querySelectorAll('img.qr').forEach(img => {
            if (/vietqr\.io/.test(img.src)) {
              img.src = img.src.replace(/addInfo=[^&]*/, `addInfo=${note}`);
            }
          });
        }
        el.querySelectorAll('[data-copy]').forEach(btn => {
          btn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(btn.dataset.copy || '');
              btn.textContent = 'Đã chép';
            } catch {
              btn.textContent = btn.dataset.copy || 'Đã chép';
            }
            setTimeout(() => { btn.textContent = 'Chép số tài khoản'; }, 2000);
          });
        });
      },
    },
  ],
});
