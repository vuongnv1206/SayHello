import { defineTheme, html, br, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

const monogram = (a, b) => `${(a || '').trim().charAt(0)}${(b || '').trim().charAt(0)}`.toUpperCase();

export default defineTheme({
  id: 'hop-ky-uc',
  name: 'Hộp Ký Ức',
  version: '1.0.0',
  tier: 'cinematic',
  layout: { id: 'deck', tabs: 4, interactiveDeck: true },
  voice: 'than-mat',
  themeColor: '#1A2E26',
  tagline: 'Bộ thẻ hộp nhung · Chia thẻ đàn hồi & lật mặt sau đọc lời nhắn',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap',
  gateMs: 450,
  moment: {
    id: 'deal-flip',
    verb: 'deal',
    verbLabel: 'Chia thẻ & lật mặt sau',
    trigger: 'click',
    durationMs: 260,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-swap',
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
      hero: { required: true, aspect: '4:5', label: 'Ảnh thẻ chính trong hộp' },
      album: { min: 3, ideal: 6, max: 12 },
    },
    story: { optional: true, maxItems: 6 },
  },
  topics: [
    {
      id: 'hop-nhung',
      name: 'Hộp Nhung Monogram',
      desc: 'Hộp nhung rêu đậm ôm trọn bộ thẻ giấy bông ngà và chỉ đồng.',
      swatch: ['#1A2E26', '#FBF8F2'],
      themeColor: '#1A2E26',
      vars: {
        '--sh-bg': '#1A2E26',
        '--sh-surface': '#FBF8F2',
        '--sh-ink': '#1F2420',
        '--jb-box-ink': '#FBF8F2',
        '--sh-accent': '#8D6A32',
        '--sh-accent-ink': '#FBF8F2',
        '--sh-foil': '#C9A461',
        '--sh-soft': 'rgba(31, 36, 32, 0.16)',
        '--sh-panel': '#FBF8F2',
        '--sh-font-display': "'Cormorant Garamond', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'buu-thiep',
      name: 'Bưu Thiếp Hồi Âm',
      desc: 'Bưu thiếp viền răng cưa, mực xanh hải quân và dấu bưu điện son.',
      swatch: ['#1A2B42', '#B84238'],
      themeColor: '#1A2B42',
      vars: {
        '--sh-bg': '#1A2B42',
        '--sh-surface': '#F4EFE6',
        '--sh-ink': '#1C232D',
        '--jb-box-ink': '#F4EFE6',
        '--sh-accent': '#B84238',
        '--sh-accent-ink': '#FAF7F2',
        '--sh-foil': '#C88A4B',
        '--sh-soft': 'rgba(28, 35, 45, 0.16)',
        '--sh-panel': '#F4EFE6',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  defaults: {
    texts: {
      coverKicker: 'Hộp thẻ mời cưới',
      coverHint: 'Chạm mở nắp hộp để xem bộ thẻ mời',
      inviteKicker: 'Thiệp mời trân trọng',
      albumTitle: 'Bộ Thẻ Ảnh Kỷ Niệm',
      eventsTitle: 'Giờ & Đường Tới Lễ',
      storyTitle: 'Ghi Chú Mặt Sau',
      rsvpTitle: 'Thẻ Hồi Âm',
      rsvpLead: 'Điền thẻ hồi âm để cất gọn vào ngăn xác nhận của buổi tiệc.',
      giftTitle: 'Mừng Cưới',
      wishTitle: 'Lưu Bút',
    },
  },
  scenes: [
    {
      id: 'nap-hop',
      kind: 'gate',
      render: ({ names: n, date, city, guest, texts: t }) => html`
        <div class="jb-box-lid">
          <div class="jb-lid-frame">
            <span class="jb-medallion" aria-hidden="true">${monogram(n.first, n.second)}</span>
            <p class="jb-lid-kicker">${t.coverKicker}</p>
            <p class="jb-lid-guest">Gửi ${guest()}</p>
            <h1>${n.first} <em>&amp;</em> ${n.second}</h1>
            <p class="jb-lid-meta">${fmt.dots(date)}${city ? html` · ${city}` : ''}</p>
            <button type="button" class="sh-btn sh-tactile-btn jb-open-btn" data-open>Mở hộp thiệp</button>
            <p class="jb-lid-hint">${t.coverHint}</p>
          </div>
        </div>`,
      mount(el, ctx) {
        const btn = el.querySelector('[data-open]');
        const lid = el.querySelector('.jb-lid-frame');
        let timer = 0;
        const openBox = () => {
          if (ctx.opened) return;
          el.classList.add('is-opening');
          clearTimeout(timer);
          timer = setTimeout(() => ctx.open(), ctx.reduced ? 80 : 250);
        };
        btn?.addEventListener('click', openBox);
        lid?.addEventListener('click', e => {
          if (!e.target.closest('button, a')) openBox();
        });
      },
    },
    {
      id: 'khung-chinh',
      label: 'Bộ thẻ thiệp cưới',
      provides: ['when', 'where', 'map', 'countdown', 'album'],
      render: ctx => {
        const { names: n, date, city, main, events, places, families, album, captions, texts: t, guest, img } = ctx;
        const cards = album.length ? album.map((src, i) => ({ src, cap: captions[i] || `Khoảnh khắc 0${i + 1}` })) : [{ src: img('hero', 0), cap: n.pair }];
        const placeFor = ev => places.find(p => p.address && ev.address && p.address === ev.address) || places[0];
        return html`
          <div class="jb-shell">
            <nav class="jb-tabbar" aria-label="Ngăn thẻ trong hộp">
              <a class="jb-tab is-active" href="#jb-invite" data-tab="jb-invite">Thiệp Mời</a>
              <a class="jb-tab" href="#jb-deck" data-tab="jb-deck">Album (${cards.length})</a>
              <a class="jb-tab" href="#jb-events" data-tab="jb-events">Giờ &amp; Đường</a>
              <a class="jb-tab" href="#hoi-am" data-tab="hoi-am">Xác Nhận &amp; Quà</a>
            </nav>

            <div class="jb-stage">
              <article class="jb-card jb-invite-card" id="jb-invite">
                <div class="jb-stamp" aria-hidden="true">${monogram(n.first, n.second)}</div>
                <p class="jb-kicker">${t.inviteKicker} · ${guest()}</p>
                <h2 class="jb-names">${n.firstFull} <em>&amp;</em> ${n.secondFull}</h2>
                <div class="jb-meta-grid">
                  <div>
                    <small>Thời gian</small>
                    <b>${fmt.long(date)}</b>
                    <span>${fmt.time(date)} · ${fmt.dots(date)}</span>
                    ${main?.lunar ? html`<span>${main.lunar}</span>` : ''}
                  </div>
                  <div>
                    <small>Địa điểm</small>
                    <b>${main?.venue || city}</b>
                    ${main?.address ? html`<span>${br(main.address)}</span>` : ''}
                  </div>
                </div>
                ${countdown(ctx)}
                ${families.length ? html`
                  <div class="jb-fams">
                    ${families.map(f => html`
                      <div class="jb-fam">
                        <small>${f.side}</small>
                        ${f.father ? html`<span>Ông ${f.father}</span>` : ''}
                        ${f.mother ? html`<span>Bà ${f.mother}</span>` : ''}
                      </div>`)}
                  </div>` : ''}
                <div class="jb-invite-cta">
                  <a class="sh-btn" href="#hoi-am">Xác nhận tham dự</a>
                </div>
              </article>

              <section class="jb-card jb-deck-card" id="jb-deck" data-cards="${JSON.stringify(cards)}" aria-label="${t.albumTitle}">
                <div class="jb-deck-head">
                  <p class="jb-kicker">${t.albumTitle}</p>
                  <span class="jb-deck-count" data-deck-count>1 / ${cards.length}</span>
                </div>
                <div class="jb-deck-viewport">
                  <div class="jb-flipper" data-flipper>
                    <div class="jb-face jb-front">
                      <img src="${cards[0].src}" alt="${cards[0].cap}" data-deck-img fetchpriority="high" decoding="async">
                      <p class="jb-deck-cap" data-deck-cap>${cards[0].cap}</p>
                    </div>
                    <div class="jb-face jb-back">
                      <p class="jb-kicker">Mặt sau tấm ảnh</p>
                      <h3 data-deck-back-title>${cards[0].cap}</h3>
                      <p class="jb-back-note">${n.first} &amp; ${n.second} · ${fmt.dots(date)}</p>
                      <p class="jb-back-sub">Lưu giữ trong hộp ký ức ngày chung đôi.</p>
                    </div>
                  </div>
                </div>
                <div class="jb-deck-controls">
                  <button type="button" class="sh-btn jb-ghost" data-prev>Thẻ trước</button>
                  <button type="button" class="sh-btn jb-ghost" data-flip aria-pressed="false">Lật mặt sau</button>
                  <button type="button" class="sh-btn" data-next>Chia thẻ tiếp</button>
                </div>
                <div class="jb-thumbs" aria-hidden="true">
                  ${cards.slice(1).map(c => html`<img src="${c.src}" alt="" loading="lazy" width="60" height="75">`)}
                </div>
              </section>
            </div>

            <section class="jb-card jb-events-card" id="jb-events" aria-label="${t.eventsTitle}">
              <p class="jb-kicker">${t.eventsTitle}</p>
              <div class="jb-ev-grid">
                ${events.map((ev, i) => {
                  const p = placeFor(ev);
                  return html`
                    <article class="jb-ev-item ${ev.main ? 'is-main' : ''}" data-ev="${i}">
                      <div class="jb-ev-top">
                        <h3>${ev.title}</h3>
                        <span>${fmt.time(ev.date)} · ${fmt.short(ev.date)}</span>
                      </div>
                      ${ev.lunar ? html`<p class="jb-lunar">${ev.lunar}</p>` : ''}
                      ${ev.venue ? html`<p class="jb-ev-venue">${ev.venue}</p>` : ''}
                      ${ev.address ? html`<p class="jb-ev-addr">${br(ev.address)}</p>` : ''}
                      <div class="jb-ev-links">
                        ${p ? html`<a class="sh-btn jb-ghost" href="${p.url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                        ${ev.gcal ? html`<a class="sh-btn jb-ghost" href="${ev.gcal}" target="_blank" rel="noopener">Lưu lịch</a>` : ''}
                      </div>
                    </article>`;
                })}
              </div>
            </section>
          </div>`;
      },
      mount(el, ctx) {
        let cards = [];
        try {
          cards = JSON.parse(el.querySelector('[data-cards]')?.dataset.cards || '[]');
        } catch {}
        if (!cards.length) {
          const curImg = el.querySelector('[data-deck-img]');
          const curCap = el.querySelector('[data-deck-cap]');
          cards = [{ src: curImg?.getAttribute('src') || '', cap: curCap?.textContent || '' }];
        }
        let idx = 0;
        let flipped = false;
        const imgEl = el.querySelector('[data-deck-img]');
        const capEl = el.querySelector('[data-deck-cap]');
        const backEl = el.querySelector('[data-deck-back-title]');
        const countEl = el.querySelector('[data-deck-count]');
        const flipper = el.querySelector('[data-flipper]');
        const flipBtn = el.querySelector('[data-flip]');

        const syncCard = () => {
          const item = cards[idx];
          if (imgEl) { imgEl.src = item.src; imgEl.alt = item.cap; }
          if (capEl) capEl.textContent = item.cap;
          if (backEl) backEl.textContent = item.cap;
          if (countEl) countEl.textContent = `${idx + 1} / ${cards.length}`;
        };

        const deal = delta => {
          idx = (idx + delta + cards.length) % cards.length;
          flipped = false;
          flipper?.classList.remove('is-flipped');
          flipBtn?.setAttribute('aria-pressed', 'false');
          if (!ctx.reduced && flipper) {
            flipper.classList.remove('is-dealing');
            void flipper.offsetWidth;
            flipper.classList.add('is-dealing');
          }
          syncCard();
        };

        el.querySelector('[data-next]')?.addEventListener('click', () => deal(1));
        el.querySelector('[data-prev]')?.addEventListener('click', () => deal(-1));
        flipBtn?.addEventListener('click', () => {
          flipped = !flipped;
          flipper?.classList.toggle('is-flipped', flipped);
          flipBtn.setAttribute('aria-pressed', String(flipped));
        });

        const tabs = [...el.querySelectorAll('[data-tab]')];
        tabs.forEach(tab => {
          tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');
          });
        });
      },
    },
    {
      id: 'ky-niem',
      label: 'Ghi chú kỷ niệm',
      provides: ['story'],
      when: ctx => ctx.has('story'),
      render: ({ story, texts: t }) => html`
        <div class="jb-shell jb-story-shell">
          <div class="jb-card">
            <p class="jb-kicker">${t.storyTitle}</p>
            <div class="jb-story-grid">
              ${story.map((s, i) => html`
                <article class="jb-story-card">
                  <span>${s.year || `0${i + 1}`}</span>
                  <h3>${s.title}</h3>
                  ${s.text ? html`<p>${s.text}</p>` : ''}
                </article>`)}
            </div>
          </div>
        </div>`,
    },
    {
      id: 'hoi-am',
      kind: 'finale',
      label: 'Xác nhận, quà mừng & lưu bút',
      provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => html`
        <div class="jb-shell jb-finale-shell">
          <div class="jb-finale-grid">
            <div class="jb-card jb-pocket" data-pocket>
              <p class="jb-kicker">${ctx.texts.rsvpTitle}</p>
              <p class="jb-lead">${ctx.texts.rsvpLead}</p>
              <p class="jb-tuck-badge" data-tuck-badge hidden>Thẻ hồi âm đã được xếp gọn vào ngăn hộp.</p>
              ${rsvpForm(ctx, { yes: 'Sẽ tham dự', no: 'Tiếc quá, mình bận', submit: 'Gửi thẻ hồi âm' })}
            </div>

            <div class="jb-card">
              <p class="jb-kicker">${ctx.texts.wishTitle}</p>
              ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
              ${wishList(ctx)}
            </div>
          </div>

          ${ctx.has('gift') ? html`
            <div class="jb-card jb-gift-card">
              <p class="jb-kicker">${ctx.texts.giftTitle}</p>
              <div class="accounts">
                ${ctx.accounts.map(a => {
                  const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
                  const qr = qrUrl(a, note);
                  return html`
                    <article class="jb-acc">
                      ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR mừng cưới ${a.who}" width="144" height="144" loading="lazy">` : ''}
                      <div class="jb-acc-meta">
                        <b>${a.who}</b>
                        <span>${a.bank}</span>
                        <span class="jb-acc-num">${a.number}</span>
                        <span>${a.name}</span>
                        <button type="button" class="sh-btn jb-ghost" data-copy="${a.number}">Chép số tài khoản</button>
                      </div>
                    </article>`;
                })}
              </div>
            </div>` : ''}
        </div>`,
      mount(el, ctx) {
        const pocket = el.querySelector('[data-pocket]');
        const badge = el.querySelector('[data-tuck-badge]');
        ctx.on('rsvp', () => {
          pocket?.classList.add('is-tucked');
          if (badge) badge.hidden = false;
        });
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
