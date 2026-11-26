import { defineTheme, html, br, plain, qrUrl, rsvpForm, wishForm, wishList, countdown, fmt } from '@sayhello/engine';

export function polarKnotPath(scale = 88) {
  let d = '';
  const N = 240;
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

export default defineTheme({
  id: 'song-gia',
  name: 'Song Gia',
  version: '1.0.0',
  tier: 'cinematic',
  layout: { id: 'split', ratio: '50-50', dualHouse: true },
  voice: 'trang-trong',
  themeColor: '#F6F4EF',
  tagline: 'Chia đôi 50/50 Nhà Trai & Nhà Gái · Hội tụ về lễ thành hôn',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap',
  gateMs: 450,
  moment: {
    id: 'seam-converge',
    verb: 'converge',
    verbLabel: 'Hội tụ hai nhà & kết nút tơ',
    trigger: 'click',
    durationMs: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    reducedFallback: 'instant-join',
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
      hero: { required: true, aspect: '4:3', label: 'Ảnh chung hai gia đình' },
      groom: { aspect: '3:4' },
      bride: { aspect: '3:4' },
      album: { min: 2, ideal: 6, max: 14 },
    },
    story: { optional: true, maxItems: 6 },
  },
  topics: [
    {
      id: 'gom-su',
      name: 'Song Gia Gốm Sứ',
      desc: 'Men sứ ngà Chu Đậu, chàm lam trang trọng và đường chỉ son.',
      swatch: ['#F6F4EF', '#1E3250'],
      themeColor: '#F6F4EF',
      vars: {
        '--sh-bg': '#F6F4EF',
        '--sh-surface': '#ECE8DF',
        '--sh-ink': '#1E242B',
        '--sh-accent': '#1E3250',
        '--sh-accent-ink': '#F6F4EF',
        '--sh-foil': '#B02E26',
        '--sh-soft': 'rgba(30, 36, 43, 0.16)',
        '--sh-panel': '#ECE8DF',
        '--sh-font-display': "'Playfair Display', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
    {
      id: 'hai-thanh-pho',
      name: 'Hai Thành Phố Một Ngày',
      desc: 'Giấy lanh ấm, xanh rêu trầm và đường nối hai miền đất nung.',
      swatch: ['#F5F2EC', '#3D5A4C'],
      themeColor: '#F5F2EC',
      vars: {
        '--sh-bg': '#F5F2EC',
        '--sh-surface': '#EAE5DC',
        '--sh-ink': '#1F2226',
        '--sh-accent': '#3D5A4C',
        '--sh-accent-ink': '#F5F2EC',
        '--sh-foil': '#A84632',
        '--sh-soft': 'rgba(31, 34, 38, 0.16)',
        '--sh-panel': '#EAE5DC',
        '--sh-font-display': "'Newsreader', Georgia, serif",
        '--sh-font-body': "'Be Vietnam Pro', system-ui, sans-serif",
      },
    },
  ],
  defaults: {
    texts: {
      coverTitle: 'Lễ Thành Hôn & Vu Quy',
      coverHint: 'Chạm để hợp hai nửa tấm thiệp',
      convergeKicker: 'Trân trọng kính mời',
      eventsTitle: 'Nghi Lễ Hai Gia Đình',
      albumTitle: 'Ảnh Cưới Hai Miền',
      storyTitle: 'Hành Trình Gặp Gỡ',
      rsvpTitle: 'Kết Nút Xác Nhận',
      rsvpLead: 'Hai gia đình trân trọng đón tiếp quý khách trong ngày chung vui.',
      giftTitle: 'Mừng Cưới Hai Nhà',
      wishTitle: 'Sổ Lưu Bút Song Gia',
    },
  },
  scenes: [
    {
      id: 'hai-nga',
      kind: 'gate',
      render: ({ names: n, date, city, guest, texts: t }) => html`
        <div class="sg-gate-stage">
          <div class="sg-half sg-half-l">
            <p class="sg-side-tag">Nhà Trai</p>
            <strong class="sg-side-name">${n.groom}</strong>
          </div>
          <div class="sg-seam" aria-hidden="true"></div>
          <div class="sg-half sg-half-r">
            <p class="sg-side-tag">Nhà Gái</p>
            <strong class="sg-side-name">${n.bride}</strong>
          </div>
          <div class="sg-gate-center">
            <p class="sg-kicker">${t.coverTitle}</p>
            <p class="sg-guest">Trân trọng kính mời ${guest()}</p>
            <h1>${n.first} <em>&amp;</em> ${n.second}</h1>
            <p class="sg-gate-meta">${fmt.dots(date)}${city ? html` · ${city}` : ''}</p>
            <button type="button" class="sh-btn sh-tactile-btn" data-open>Hợp lễ mở thiệp</button>
            <p class="sg-gate-hint">${t.coverHint}</p>
          </div>
        </div>`,
      mount(el, ctx) {
        const btn = el.querySelector('[data-open]');
        const center = el.querySelector('.sg-gate-center');
        let timer = 0;
        const converge = () => {
          if (ctx.opened) return;
          el.classList.add('is-converging');
          clearTimeout(timer);
          timer = setTimeout(() => ctx.open(), ctx.reduced ? 80 : 260);
        };
        btn?.addEventListener('click', converge);
        center?.addEventListener('click', e => {
          if (!e.target.closest('button, a')) converge();
        });
      },
    },
    {
      id: 'hop-nhat',
      label: 'Thông tin hai gia đình và lịch lễ',
      provides: ['when', 'where', 'map', 'countdown', 'album'],
      render: ctx => {
        const { names: n, data: d, date, city, main, events, places, families, album, captions, texts: t, guest, img } = ctx;
        const placeFor = ev => places.find(p => p.address && ev.address && p.address === ev.address) || places[0];
        const leftFam = families[0] || null;
        const rightFam = families[1] || null;
        return html`
          <div class="sg-wrap">
            <header class="sg-head">
              <p class="sg-kicker">${t.coverTitle}</p>
              <h2 class="sg-head-names">${n.first} <em>&amp;</em> ${n.second}</h2>
              <p class="sg-head-meta">${fmt.dots(date)}${city ? html` · ${city}` : ''}</p>
            </header>

            <div class="sg-switcher" role="group" aria-label="Chọn góc nhìn gia đình">
              <button type="button" class="sg-pill is-active" data-side-pick="all">Cả Hai</button>
              <button type="button" class="sg-pill" data-side-pick="nha-trai">Khách Nhà Trai</button>
              <button type="button" class="sg-pill" data-side-pick="nha-gai">Khách Nhà Gái</button>
            </div>

            <div class="sg-split" data-side-focus="all">
              <article class="sg-col sg-col-left" data-side="nha-trai">
                <p class="sg-kicker">Nhà Trai</p>
                <figure class="sg-portrait">
                  <img src="${img('groom', 1)}" alt="${d.groom.short}" fetchpriority="high" decoding="async">
                  <figcaption>
                    <b>${d.groom.full || d.groom.short}</b>
                    ${d.groom.bio ? html`<span>${d.groom.bio}</span>` : ''}
                  </figcaption>
                </figure>
                ${leftFam ? html`
                  <div class="sg-fam-card">
                    <h3>${leftFam.side}</h3>
                    ${leftFam.father ? html`<p>Ông ${leftFam.father}</p>` : ''}
                    ${leftFam.mother ? html`<p>Bà ${leftFam.mother}</p>` : ''}
                    ${leftFam.address ? html`<p class="sg-dim">${br(leftFam.address)}</p>` : ''}
                  </div>` : ''}
              </article>

              <article class="sg-col sg-col-right" data-side="nha-gai">
                <p class="sg-kicker">Nhà Gái</p>
                <figure class="sg-portrait">
                  <img src="${img('bride', 2)}" alt="${d.bride.short}" fetchpriority="high" decoding="async">
                  <figcaption>
                    <b>${d.bride.full || d.bride.short}</b>
                    ${d.bride.bio ? html`<span>${d.bride.bio}</span>` : ''}
                  </figcaption>
                </figure>
                ${rightFam ? html`
                  <div class="sg-fam-card">
                    <h3>${rightFam.side}</h3>
                    ${rightFam.father ? html`<p>Ông ${rightFam.father}</p>` : ''}
                    ${rightFam.mother ? html`<p>Bà ${rightFam.mother}</p>` : ''}
                    ${rightFam.address ? html`<p class="sg-dim">${br(rightFam.address)}</p>` : ''}
                  </div>` : ''}
              </article>
            </div>

            <section class="sg-converge" aria-label="Thiệp chung ngày cưới">
              <p class="sg-kicker">${t.convergeKicker} ${guest()}</p>
              <h2 class="sg-pair-title">${n.firstFull} <em>&amp;</em> ${n.secondFull}</h2>
              <p class="sg-date-main">${fmt.long(date)} · ${fmt.time(date)} (${fmt.dots(date)})</p>
              ${main?.lunar ? html`<p class="sg-lunar">${main.lunar}</p>` : ''}
              <p class="sg-venue-main">${main?.venue || city}${main?.address ? html` — ${main.address}` : ''}</p>
              ${countdown(ctx)}
              <div class="sg-cta-row">
                <a class="sh-btn" href="#chung-doi">Xác nhận tham dự</a>
              </div>
            </section>

            <section class="sg-events" aria-label="${t.eventsTitle}">
              <p class="sg-kicker">${t.eventsTitle}</p>
              <div class="sg-ev-grid">
                ${events.map((ev, i) => {
                  const p = placeFor(ev);
                  return html`
                    <article class="sg-ev-card ${ev.main ? 'is-main' : ''}" data-ev="${i}">
                      <div class="sg-ev-top">
                        <h3>${ev.title}</h3>
                        <span>${fmt.time(ev.date)} · ${fmt.short(ev.date)}</span>
                      </div>
                      ${ev.lunar ? html`<p class="sg-lunar">${ev.lunar}</p>` : ''}
                      ${ev.venue ? html`<p class="sg-ev-venue">${ev.venue}</p>` : ''}
                      ${ev.address ? html`<p class="sg-ev-addr">${br(ev.address)}</p>` : ''}
                      <div class="sg-ev-links">
                        ${p ? html`<a class="sh-btn sg-ghost" href="${p.url}" target="_blank" rel="noopener">Chỉ đường</a>` : ''}
                        ${ev.gcal ? html`<a class="sh-btn sg-ghost" href="${ev.gcal}" target="_blank" rel="noopener">Lưu lịch</a>` : ''}
                      </div>
                    </article>`;
                })}
              </div>
            </section>

            ${album.length ? html`
              <section class="sg-album" aria-label="${t.albumTitle}">
                <p class="sg-kicker">${t.albumTitle}</p>
                <div class="sg-album-grid">
                  ${album.map((src, i) => html`
                    <figure class="sg-album-item">
                      <img src="${src}" alt="${captions[i] || `Ảnh cưới ${i + 1}`}" loading="lazy" decoding="async">
                      ${captions[i] ? html`<figcaption>${captions[i]}</figcaption>` : ''}
                    </figure>`)}
                </div>
              </section>` : ''}
          </div>`;
      },
      mount(el, ctx) {
        const split = el.querySelector('.sg-split');
        const pills = [...el.querySelectorAll('[data-side-pick]')];
        const setSide = side => {
          if (split) split.dataset.sideFocus = side;
          pills.forEach(p => p.classList.toggle('is-active', p.dataset.sidePick === side));
        };
        pills.forEach(p => p.addEventListener('click', () => setSide(p.dataset.sidePick || 'all')));
        if (ctx.group?.id === 'nha-gai' || ctx.group?.id === 'nha-trai') {
          setSide(ctx.group.id);
        }
      },
    },
    {
      id: 'hanh-trinh',
      label: 'Hành trình hai nhà',
      provides: ['story'],
      when: ctx => ctx.has('story'),
      render: ({ story, texts: t }) => html`
        <div class="sg-wrap sg-story-wrap">
          <p class="sg-kicker">${t.storyTitle}</p>
          <div class="sg-story-grid">
            ${story.map((s, i) => html`
              <article class="sg-story-card">
                <span>${s.year || `0${i + 1}`}</span>
                <h3>${s.title}</h3>
                ${s.text ? html`<p>${s.text}</p>` : ''}
              </article>`)}
          </div>
        </div>`,
    },
    {
      id: 'chung-doi',
      kind: 'finale',
      label: 'Kết nút xác nhận & quà mừng',
      provides: ['rsvp', 'guestbook', 'gift'],
      render: ctx => html`
        <div class="sg-wrap sg-finale">
          <div class="sg-finale-grid">
            <div class="sg-rsvp-box">
              <div class="sg-knot-head">
                <svg class="sg-knot-svg" viewBox="-128 -128 256 300" width="92" height="108" aria-hidden="true">
                  <path class="sg-knot-track" d="${polarKnotPath(84)}" pathLength="1" />
                  <path class="sg-knot-fill" d="${polarKnotPath(84)}" pathLength="1" />
                </svg>
                <div>
                  <p class="sg-kicker">${ctx.texts.rsvpTitle}</p>
                  <p class="sg-lead">${ctx.texts.rsvpLead}</p>
                </div>
              </div>
              ${rsvpForm(ctx, { yes: 'Sẽ tới dự lễ', no: 'Xin phép vắng mặt', submit: 'Xác nhận tham dự' })}
            </div>

            <div class="sg-wish-box">
              <p class="sg-kicker">${ctx.texts.wishTitle}</p>
              ${wishForm(ctx, { submit: 'Gửi lời chúc' })}
              ${wishList(ctx)}
            </div>
          </div>

          ${ctx.has('gift') ? html`
            <div class="sg-gift-box">
              <p class="sg-kicker">${ctx.texts.giftTitle}</p>
              <div class="accounts">
                ${ctx.accounts.map(a => {
                  const note = plain(`${ctx.names.first} ${ctx.names.second} mung cuoi`).slice(0, 50);
                  const qr = qrUrl(a, note);
                  return html`
                    <article class="sg-acc">
                      ${qr ? html`<img class="qr" src="${qr}" alt="Mã QR mừng cưới ${a.who}" width="144" height="144" loading="lazy">` : ''}
                      <div class="sg-acc-meta">
                        <b>${a.who}</b>
                        <span>${a.bank}</span>
                        <span class="sg-acc-num">${a.number}</span>
                        <span>${a.name}</span>
                        <button type="button" class="sh-btn sg-ghost" data-copy="${a.number}">Chép số tài khoản</button>
                      </div>
                    </article>`;
                })}
              </div>
            </div>` : ''}
        </div>`,
      mount(el, ctx) {
        const box = el.querySelector('.sg-rsvp-box');
        ctx.on('rsvp', payload => {
          if (payload?.attend !== 'Không') box?.classList.add('is-knotted');
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
