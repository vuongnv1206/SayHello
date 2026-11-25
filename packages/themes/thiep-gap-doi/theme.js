import { defineTheme, html, br, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const monogram = (a, b) => `${(a || '').trim().charAt(0)}${(b || '').trim().charAt(0)}`.toUpperCase();

export default defineTheme({
  id: 'thiep-gap-doi',
  name: 'Thiệp Gấp Đôi',
  version: '1.0.0',
  tier: 'cinematic',
  layout: { id: 'folio', spread: '2-leaf', stickyLeft: true },
  voice: 'trang-trong',
  themeColor: '#2B0D11',
  tagline: 'Folio hai cánh mở · Niêm phong ánh kim & Giấy Dó',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap',
  gateMs: 450,
  moment: {
    id: 'unseal-gleam',
    verb: 'unseal',
    verbLabel: 'Mở niêm phong & ánh nhũ',
    trigger: 'click-or-pointer',
    durationMs: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-fade',
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
      hero: { required: true, aspect: '3:4', label: 'Ảnh bìa thiệp gấp đôi' },
      groom: { aspect: '3:4' },
      bride: { aspect: '3:4' },
      album: { min: 2, ideal: 6, max: 16 },
    },
    story: { optional: true, maxItems: 6 },
  },
  topics: [
    {
      id: 'son-mai',
      name: 'Sơn Mài Khảm Trai',
      desc: 'Nền sơn mài huyết dụ trầm cùng nhũ vàng ấm và chữ ngà.',
      swatch: ['#2B0D11', '#D6B26E'],
      themeColor: '#2B0D11',
      vars: {
        '--sh-bg': '#2B0D11',
        '--sh-surface': '#3A1318',
        '--sh-ink': '#F4ECE1',
        '--sh-accent': '#D6B26E',
        '--sh-accent-ink': '#240B0E',
        '--sh-foil': '#E9CF98',
        '--sh-soft': 'rgba(244, 236, 225, 0.2)',
        '--sh-panel': '#3A1318',
        '--sh-font-display': "'Cormorant Garamond', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'giay-do',
      name: 'Giấy Dó & Triện Mộc',
      desc: 'Giấy Dó ấm sợi tự nhiên, mực than và dấu triện son.',
      swatch: ['#F5F0E6', '#B22A22'],
      themeColor: '#F5F0E6',
      vars: {
        '--sh-bg': '#F5F0E6',
        '--sh-surface': '#EFE8D9',
        '--sh-ink': '#1F2421',
        '--sh-accent': '#B22A22',
        '--sh-accent-ink': '#FAF6EE',
        '--sh-foil': '#9A7B4F',
        '--sh-soft': 'rgba(31, 36, 33, 0.16)',
        '--sh-panel': '#EFE8D9',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'lua-nga',
      name: 'Lụa Ngà & Giấy Can',
      desc: 'Giấy bông ngà trang nhã, chữ than đá và viền vàng sâm panh.',
      swatch: ['#FAF8F4', '#7A6344'],
      themeColor: '#FAF8F4',
      vars: {
        '--sh-bg': '#FAF8F4',
        '--sh-surface': '#F1ECE3',
        '--sh-ink': '#2D2926',
        '--sh-accent': '#7A6344',
        '--sh-accent-ink': '#FAF8F4',
        '--sh-foil': '#C6A972',
        '--sh-soft': 'rgba(45, 41, 38, 0.15)',
        '--sh-panel': '#F1ECE3',
        '--sh-font-display': "'Cormorant Garamond', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  defaults: {
    texts: {
      coverTitle: 'Thiệp Báo Hỷ',
      coverHint: 'Chạm niêm phong để mở thiệp hai cánh',
      cardKicker: 'Trân trọng kính mời',
      eventsTitle: 'Lịch Lễ & Tiệc',
      albumTitle: 'Khung Hình Kỷ Niệm',
      storyTitle: 'Chuyện Hai Đứa',
      rsvpTitle: 'Phiếu Hồi Âm',
      rsvpLead: 'Sự hiện diện của quý khách là niềm vinh hạnh lớn của hai gia đình.',
      giftTitle: 'Mừng Hỷ',
      wishTitle: 'Sổ Lưu Bút',
    },
  },
  scenes: [
    {
      id: 'bia-thiep',
      kind: 'gate',
      render: ({ names: n, date, city, guest, texts: t }) => html`
        <div class="fg-envelope">
          <div class="fg-flap fg-flap-l" aria-hidden="true"></div>
          <div class="fg-flap fg-flap-r" aria-hidden="true"></div>
          <div class="fg-jacket">
            <p class="fg-kicker">${t.coverTitle}</p>
            <p class="fg-guest">Kính gửi ${guest()}</p>
            <div class="fg-monogram" aria-hidden="true">${monogram(n.first, n.second)}</div>
            <h1 class="fg-cover-names">${n.first} <span>&amp;</span> ${n.second}</h1>
            <p class="fg-cover-meta">${fmt.dots(date)}${city ? html` · ${city}` : ''}</p>
            <button type="button" class="fg-seal sh-tactile-btn" data-open aria-label="Mở niêm phong thiệp cưới">
              <span>Mở thiệp</span>
            </button>
            <p class="fg-cover-hint">${t.coverHint}</p>
          </div>
        </div>`,
      mount(el, ctx) {
        const btn = el.querySelector('[data-open]');
        const jacket = el.querySelector('.fg-jacket');
        let timer = 0;
        const triggerOpen = () => {
          if (ctx.opened) return;
          el.classList.add('is-unsealing');
          clearTimeout(timer);
          timer = setTimeout(() => ctx.open(), ctx.reduced ? 80 : 260);
        };
        btn?.addEventListener('click', triggerOpen);
        jacket?.addEventListener('click', e => {
          if (!e.target.closest('button, a')) triggerOpen();
        });
      },
    },
    {
      id: 'to-chinh',
      label: 'Thiệp mời chính',
      provides: ['when', 'where', 'map', 'countdown', 'album'],
      render: ctx => {
        const { names: n, data: d, date, city, main, events, places, families, album, captions, texts: t, img, guest } = ctx;
        const placeFor = ev => places.find(p => p.address && ev.address && p.address === ev.address) || places[0];
        return html`
          <div class="fg-spread">
            <aside class="fg-left" aria-label="Tấm thiệp chính">
              <div class="fg-card fg-foil">
                <div class="fg-card-head">
                  <span class="fg-crest" aria-hidden="true">${monogram(n.first, n.second)}</span>
                  <p class="fg-kicker">${t.cardKicker} ${guest()}</p>
                </div>
                <h2 class="fg-names">
                  <span>${n.firstFull}</span>
                  <em>&amp;</em>
                  <span>${n.secondFull}</span>
                </h2>
                <div class="fg-rule" aria-hidden="true"></div>
                <div class="fg-date-block">
                  <p class="fg-date-main">${fmt.long(date)}</p>
                  <p class="fg-date-dots">${fmt.dots(date)} · ${fmt.time(date)}</p>
                  ${main?.lunar ? html`<p class="fg-lunar">${main.lunar}</p>` : ''}
                </div>
                <div class="fg-venue-block">
                  ${main?.venue ? html`<p class="fg-venue">${main.venue}</p>` : ''}
                  ${main?.address ? html`<p class="fg-addr">${br(main.address)}</p>` : city ? html`<p class="fg-addr">${city}</p>` : ''}
                </div>
                ${countdown(ctx)}
                <div class="fg-card-actions">
                  <a class="sh-btn" href="#hoi-am">Xác nhận tham dự</a>
                </div>
              </div>
            </aside>

            <div class="fg-right">
              <figure class="fg-hero-plate">
                <img src="${img('hero', 0)}" alt="${n.pair}" fetchpriority="high" decoding="async">
                <figcaption>
                  <span>${n.first} &amp; ${n.second}</span>
                  <span>${fmt.dots(date)}</span>
                </figcaption>
              </figure>

              ${families.length ? html`
                <section class="fg-sheet fg-families" aria-label="Thông tin hai gia đình">
                  <p class="fg-kicker">Song gia</p>
                  <div class="fg-fam-grid">
                    ${families.map(f => html`
                      <article class="fg-fam-card">
                        <h3>${f.side}</h3>
                        ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
                        ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
                        ${f.address ? html`<p class="fg-dim">${br(f.address)}</p>` : ''}
                      </article>`)}
                  </div>
                </section>` : ''}

              <section class="fg-sheet fg-portraits" aria-label="Cô dâu và chú rể">
                <div class="fg-couple-grid">
                  ${[['groom', 1, 'Chú rể'], ['bride', 2, 'Cô dâu']].map(([who, idx, role]) => html`
                    <figure class="fg-portrait">
                      <img src="${img(who, idx)}" alt="${d[who].short}" loading="lazy" decoding="async">
                      <figcaption>
                        <small>${role}</small>
                        <b>${d[who].full || d[who].short}</b>
                        ${d[who].bio ? html`<span>${d[who].bio}</span>` : ''}
                      </figcaption>
                    </figure>`)}
                </div>
              </section>

              <section class="fg-sheet fg-events" aria-label="${t.eventsTitle}">
                <p class="fg-kicker">${t.eventsTitle}</p>
                <div class="fg-ev-list">
                  ${events.map((ev, i) => {
                    const p = placeFor(ev);
                    return html`
                      <article class="fg-ev-card ${ev.main ? 'is-main' : ''}" data-ev="${i}">
                        <div class="fg-ev-top">
                          <h3>${ev.title}</h3>
                          <span class="fg-ev-time">${fmt.time(ev.date)} · ${fmt.short(ev.date)}</span>
                        </div>
                        ${ev.lunar ? html`<p class="fg-lunar">${ev.lunar}</p>` : ''}
                        ${ev.venue ? html`<p class="fg-venue">${ev.venue}</p>` : ''}
                        ${ev.address ? html`<p class="fg-addr">${br(ev.address)}</p>` : ''}
                        <div class="fg-ev-links">
                          ${p ? html`<a class="sh-btn fg-ghost" href="${p.url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                          ${ev.gcal ? html`<a class="sh-btn fg-ghost" href="${ev.gcal}" target="_blank" rel="noopener">Lưu lịch</a>` : ''}
                        </div>
                      </article>`;
                  })}
                </div>
              </section>

              ${album.length ? html`
                <section class="fg-sheet fg-album" aria-label="${t.albumTitle}">
                  <p class="fg-kicker">${t.albumTitle}</p>
                  <div class="fg-album-grid">
                    ${album.map((src, i) => html`
                      <figure class="fg-album-item">
                        <img src="${src}" alt="${captions[i] || `Ảnh cưới ${i + 1}`}" loading="lazy" decoding="async">
                        ${captions[i] ? html`<figcaption>${captions[i]}</figcaption>` : ''}
                      </figure>`)}
                  </div>
                </section>` : ''}
            </div>
          </div>`;
      },
      mount(el, ctx) {
        const card = el.querySelector('.fg-foil');
        if (!card || ctx.reduced) return;
        card.addEventListener('pointermove', e => {
          const r = card.getBoundingClientRect();
          const x = ((e.clientX - r.left) / Math.max(1, r.width)) * 100;
          const y = ((e.clientY - r.top) / Math.max(1, r.height)) * 100;
          card.style.setProperty('--gx', `${x.toFixed(1)}%`);
          card.style.setProperty('--gy', `${y.toFixed(1)}%`);
        });
      },
    },
    {
      id: 'chuyen-tinh',
      label: 'Chuyện hai đứa',
      provides: ['story'],
      when: ctx => ctx.has('story'),
      render: ({ story, texts: t }) => html`
        <div class="fg-story-wrap">
          <p class="fg-kicker">${t.storyTitle}</p>
          <ol class="fg-story-list">
            ${story.map((item, i) => html`
              <li class="fg-story-item">
                <span class="fg-story-year">${item.year || `0${i + 1}`}</span>
                <div>
                  <h3>${item.title}</h3>
                  ${item.text ? html`<p>${item.text}</p>` : ''}
                </div>
              </li>`)}
          </ol>
        </div>`,
    },
    {
      id: 'hoi-am',
      kind: 'finale',
      label: 'Phiếu hồi âm & lưu bút',
      provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => html`
        <div class="fg-finale">
          <div class="fg-reply-sheet">
            <div class="fg-tear-line" aria-hidden="true"><span>Phiếu hồi âm · Xé góc gửi lại</span></div>
            <div class="fg-reply-grid">
              <div class="fg-rsvp-col">
                <p class="fg-kicker">${ctx.texts.rsvpTitle}</p>
                <p class="fg-lead">${ctx.texts.rsvpLead}</p>
                ${rsvpForm(ctx, { yes: 'Sẽ tham dự', no: 'Xin cáo lỗi', submit: 'Gửi phiếu hồi âm' })}
              </div>
              <div class="fg-wish-col">
                <p class="fg-kicker">${ctx.texts.wishTitle}</p>
                ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
                ${wishList(ctx)}
              </div>
            </div>
          </div>

          ${ctx.has('gift') ? html`
            <div class="fg-gift-sheet">
              <p class="fg-kicker">${ctx.texts.giftTitle}</p>
              <div class="accounts">
                ${ctx.accounts.map(a => {
                  const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
                  const qr = qrUrl(a, note);
                  return html`
                    <article class="fg-acc">
                      ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR mừng cưới ${a.who}" width="144" height="144" loading="lazy">` : ''}
                      <div class="fg-acc-meta">
                        <b>${a.who}</b>
                        <span>${a.bank}</span>
                        <span class="fg-acc-num">${a.number}</span>
                        <span>${a.name}</span>
                        <button type="button" class="sh-btn fg-ghost" data-copy="${a.number}">Chép số tài khoản</button>
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
