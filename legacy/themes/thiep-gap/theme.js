// Mẫu "Thiệp Gấp": sách pop-up kiến trúc 2 mặt trên desktop và lật nếp gấp 3D trên di động.
// Ảnh dùng: images.hero, images.groom, images.bride, images.couple, images.thanks, images.album[]
import { $, $$, html, br, fmt, parts, reduced, replay } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';
const dotDate = iso => { const p = parts(iso); return p ? `${p.dd}.${p.mm}.${p.y}` : ''; };
const fullDate = iso => { const p = parts(iso); return p ? `${p.weekday}, ${p.d} tháng ${p.mo} năm ${p.y}` : ''; };

export default {
  palettes: [
    { id: 'san-ho', name: 'San hô & ngọc', swatch: ['#E0634C', '#2F8F83'], vars: { '--p1': '#E0634C', '--p2': '#E9B44C', '--p3': '#2F8F83', '--p4': '#C97D6E' } },
    { id: 'tim-vang', name: 'Tím & vàng', swatch: ['#7A58B8', '#E9B44C'], vars: { '--p1': '#7A58B8', '--p2': '#E9B44C', '--p3': '#3D7FB8', '--p4': '#C6749B' } },
    { id: 'xanh-bien', name: 'Xanh biển', swatch: ['#2F6FB8', '#E9B44C'], vars: { '--p1': '#2F6FB8', '--p2': '#E9B44C', '--p3': '#2F8F83', '--p4': '#E0634C' } },
  ],
  id: 'thiep-gap',
  name: 'Thiệp Gấp',
  layout: 'wide',
  bodyClass: 'rv-custom',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  coverMs: 2500,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['petals'],
      colors: { petals: ['#E0634C', '#2F8F83', '#E9B44C', '#FFFAF1'] },
      density: .35,
    },
    sections: ['hero', 'couple', 'families', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Sách Pop-Up Kiến Trúc',
      coverHint: 'Chạm mở nếp gấp để dựng khung ảnh 3D',
      kicker: 'Trân trọng kính mời',
      invite: 'Chúng mình gấp từng lớp giấy nhỏ để kể chuyện đôi mình, và muốn mở nó ra trước mặt bạn trong ngày vui.',
      coupleTitle: 'Hai mảnh giấy, một cánh cổng',
      eventsTitle: 'Những trang trong thiệp',
      albumTitle: 'Sân khấu ảnh dựng nổi',
      rsvpTitle: 'Phiếu hồi âm gấp mép',
      rsvpLead: 'Bạn nhớ cho chúng mình biết bạn có đến không nhé.',
      guestbookTitle: 'Tờ giấy nhắn ghim góc',
      giftTitle: 'Ngăn kéo giấy mừng cưới',
      thanks: 'Cảm ơn bạn đã mở từng lớp giấy này cùng chúng mình.',
      closing: 'Hẹn gặp bạn,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const dp = parts(d.date);
    const mono = `${initial(n.first)}&${initial(n.second)}`;
    const pic = (slot, i = 0) => ctx.img(slot, i) || (ctx.album.length ? ctx.album[i % ctx.album.length] : '') || ctx.img('hero', 0) || '';
    const captions = Array.isArray(d.images?.captions) ? d.images.captions : [];

    const cover = html`
      <div class="gap-stage">
        <p class="gap-top">${t.coverTitle}</p>
        <div class="gap-card">
          <div class="gap-inside">
            <div class="pop-layer l-arch" aria-hidden="true"></div>
            <figure class="pop-layer l-photo">
              <img src="${pic('hero', 0)}" alt="${n.pair}">
            </figure>
            <div class="pop-layer l-ribbon">
              <span class="rib-names">${n.first} &amp; ${n.second}</span>
              <span class="rib-date">${dotDate(d.date)}</span>
            </div>
          </div>
          <div class="gap-front">
            <div class="front-face">
              <span class="mono">${initial(n.first)}<span>&amp;</span>${initial(n.second)}</span>
              <p class="to">Gửi <b>${guest}</b></p>
              <div class="cover-names">
                <span class="cn-a">${n.first}</span>
                <span class="cn-amp">&amp;</span>
                <span class="cn-b">${n.second}</span>
              </div>
              <p class="date">${dotDate(d.date)}</p>
            </div>
          </div>
        </div>
        <button type="button" class="gap-open" data-open>Mở trang thiệp</button>
        <p class="gap-hint">${t.coverHint}</p>
      </div>`;

    const showHero = has('hero');
    const showCouple = has('couple');
    const showFamilies = has('families') && (d.families || []).length > 0;
    const storyItems = Array.isArray(d.story) ? d.story : (typeof d.story === 'string' && d.story.trim() ? [{ text: d.story.trim() }] : []);
    const showStory = has('story') && storyItems.length > 0;
    const showSpread2 = showCouple || showFamilies || showStory;

    const showEvents = has('events') && (d.events || []).length > 0;
    const showCountdown = has('countdown');
    const showMap = has('map') && (d.places || []).length > 0;
    const showSpread3 = showEvents || showCountdown || showMap;

    const showAlbum = has('album') && ctx.album.length > 0;

    const showRsvp = has('rsvp');
    const showGuestbook = has('guestbook');
    const showGift = has('gift');
    const showThanks = has('thanks');
    const showSpread5 = showRsvp || showGuestbook || showGift || showThanks;

    const navItems = [
      showHero && ['#spread-1', 'Bìa trong'],
      showSpread2 && ['#spread-2', 'Đôi uyên ương'],
      showSpread3 && ['#spread-3', 'Lịch & Bản đồ'],
      showAlbum && ['#spread-4', 'Sân khấu ảnh'],
      showSpread5 && ['#spread-rsvp', 'Hồi âm & Quà'],
    ].filter(Boolean);

    const spread1 = showHero ? html`
      <section id="spread-1" class="spread spread-hero is-folded-open">
        <div class="page-pane hero-stage-page">
          <div class="popup-stage" data-stage-tilt>
            <div class="stage-backdrop" aria-hidden="true">
              <span class="arch-back"></span>
              <span class="arch-mid"></span>
              <span class="tab-corner"></span>
            </div>
            <div class="stage-easel fold-pop">
              <figure class="cutout-frame">
                <img data-zoom src="${pic('hero', 0)}" alt="${n.pair}">
              </figure>
              <span class="easel-crease" aria-hidden="true"></span>
            </div>
          </div>
        </div>
        <div class="page-pane hero-title-page">
          <div class="colophon-bar">
            <span class="kicker-tag">${t.kicker}</span>
            ${d.city ? html`<span class="city-tag">${d.city}</span>` : ''}
          </div>
          <div class="hero-date-block">
            <span class="hero-day" aria-hidden="true">${dp ? dp.dd : ''}</span>
            <div class="hero-month-year">
              <span>${dp ? `Tháng ${dp.mo}` : ''}</span>
              <strong>${dp ? dp.y : ''}</strong>
            </div>
          </div>
          <h1 class="hero-names">
            <span class="name-a">${n.first}</span>
            <span class="name-amp" aria-hidden="true">&amp;</span>
            <span class="name-b">${n.second}</span>
          </h1>
          <p class="when">${fullDate(d.date)}</p>
          <p class="invite">${t.invite}</p>
          ${showSpread5 ? html`<div class="hero-actions"><a class="btn hero-rsvp-link" href="#spread-rsvp">Gửi hồi âm</a></div>` : ''}
        </div>
      </section>` : '';

    const spread2 = showSpread2 ? html`
      <section id="spread-2" class="spread spread-duo ${!(showFamilies || showStory) ? 'spread-single' : ''}">
        ${showCouple ? html`
          <div class="page-pane couple-page">
            <h2>${t.coupleTitle}</h2>
            <div class="duo-cards">
              <article class="duo-card fold-pop">
                <div class="arch-window">
                  <img data-zoom src="${pic('groom', 1)}" alt="${n.groom}" loading="lazy">
                </div>
                <div class="duo-meta">
                  <span class="role-badge">Chú rể</span>
                  <h3>${n.groom}</h3>
                  ${d.groom?.bio ? html`<p>${d.groom.bio}</p>` : ''}
                </div>
              </article>
              <article class="duo-card duo-card-b fold-pop">
                <div class="arch-window arch-b">
                  <img data-zoom src="${pic('bride', 2)}" alt="${n.bride}" loading="lazy">
                </div>
                <div class="duo-meta">
                  <span class="role-badge badge-jade">Cô dâu</span>
                  <h3>${n.bride}</h3>
                  ${d.bride?.bio ? html`<p>${d.bride.bio}</p>` : ''}
                </div>
              </article>
            </div>
          </div>` : ''}
        ${(showFamilies || showStory) ? html`
          <div class="page-pane families-page">
            ${showFamilies ? html`
              <div class="fam-block">
                <h2>Hai gia đình</h2>
                <div class="fam-folds">
                  ${(d.families || []).map((f, i) => html`
                    <article class="fam-folio fold-pop ${i ? 'fam-bride' : 'fam-groom'}">
                      <h3>${f.side}</h3>
                      ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
                      ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
                      <p class="fam-addr">${br(f.address)}</p>
                    </article>`)}
                </div>
              </div>` : ''}
            ${showStory ? html`
              <div class="story-insert fold-pop">
                <h2>Chuyện chúng mình</h2>
                <div class="story-list">
                  ${storyItems.map(item => html`
                    <article class="story-item">
                      ${item.year ? html`<span class="story-year">${item.year}</span>` : ''}
                      ${item.title ? html`<h3>${item.title}</h3>` : ''}
                      <p>${item.text || item}</p>
                    </article>`)}
                </div>
              </div>` : ''}
          </div>` : ''}
      </section>` : '';

    const spread3 = showSpread3 ? html`
      <section id="spread-3" class="spread spread-ceremony ${!(showEvents || showCountdown) || !showMap ? 'spread-single' : ''}">
        ${(showEvents || showCountdown) ? html`
          <div class="page-pane events-page">
            ${showEvents ? html`
              <h2>${t.eventsTitle}</h2>
              <div class="event-tabs">
                ${(d.events || []).map(e => {
                  const p = parts(e.date);
                  return html`
                    <article class="page fold-pop ${e.main ? 'main' : ''}">
                      <div class="fold">
                        <span>${p ? p.weekday : ''}</span>
                        <b>${p ? p.dd : ''}</b>
                        <span>${p ? `Tháng ${p.mo}` : ''}</span>
                      </div>
                      <div class="page-info">
                        <h3>${e.title || ''}</h3>
                        ${e.date ? html`<p class="ev-time">${fmt.time(e.date)}</p>` : ''}
                        ${e.venue ? html`<p class="ev-venue">${e.venue}</p>` : ''}
                        ${e.address ? html`<p class="addr">${e.address}</p>` : ''}
                        ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                      </div>
                    </article>`;
                })}
              </div>` : ''}
            ${showCountdown ? html`
              <div class="count-strip fold-pop">
                ${W.countdown()}
                <a class="btn ghost gcal-btn" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>
              </div>` : ''}
          </div>` : ''}
        ${showMap ? html`
          <div class="page-pane map-page">
            <h2>Đường đến ngày vui</h2>
            <div class="map-sleeve fold-pop">${W.map({ btn: 'btn' })}</div>
          </div>` : ''}
      </section>` : '';

    const spread4 = showAlbum ? html`
      <section id="spread-4" class="spread spread-stage">
        <div class="tg-stage">
          <div class="tg-stage-head">
            <div>
              <h2>${t.albumTitle}</h2>
              <p class="stage-sub">Chạm vào khung ảnh dựng nổi để xem toàn màn hình</p>
            </div>
            <div class="stage-controls">
              <button type="button" class="stage-nav tg-prev" aria-label="Ảnh trước">Trang trước</button>
              <span class="stage-counter" aria-live="polite">1 / ${ctx.album.length}</span>
              <button type="button" class="stage-nav tg-next" aria-label="Ảnh tiếp theo">Trang sau</button>
            </div>
          </div>
          <div class="tg-stage-body">
            <div class="tg-stage-viewport">
              <div class="stage-wings fold-pop">
                <span class="wing-back" aria-hidden="true"></span>
                <figure class="wing-photo">
                  <img data-zoom src="${ctx.album[0]}" alt="${captions[0] || `Ảnh cưới 1`}">
                  <figcaption class="stage-caption">${captions[0] || `Khung ảnh 1`}</figcaption>
                </figure>
                <span class="wing-front" aria-hidden="true"></span>
              </div>
            </div>
            <div class="tg-stage-tabs" role="tablist" aria-label="Chọn khung ảnh pop-up">
              ${ctx.album.map((src, i) => html`
                <button type="button" class="tg-tab ${i === 0 ? 'on' : ''}" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" data-stage-i="${i}" data-src="${src}" data-cap="${captions[i] || `Khung ảnh ${i + 1}`}">
                  <img src="${src}" alt="" loading="lazy">
                  <span>${captions[i] || `Khung ${i + 1}`}</span>
                </button>`)}
            </div>
          </div>
        </div>
      </section>` : '';

    const spread5 = showSpread5 ? html`
      <section id="spread-rsvp" class="spread spread-closing ${!(showRsvp || showGuestbook) || !(showGift || showThanks) ? 'spread-single' : ''}">
        ${(showRsvp || showGuestbook) ? html`
          <div class="page-pane reply-page">
            ${showRsvp ? html`
              <div class="reply-slip fold-pop">
                <h2>${t.rsvpTitle}</h2>
                <p class="lead">${t.rsvpLead}</p>
                ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}
              </div>` : ''}
            ${showGuestbook ? html`
              <div class="guestbook-notes fold-pop">
                <h2>${t.guestbookTitle}</h2>
                ${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}
              </div>` : ''}
          </div>` : ''}
        ${(showGift || showThanks) ? html`
          <div class="page-pane drawer-page">
            ${showGift ? html`
              <div class="drawer-box fold-pop">
                <h2>${t.giftTitle}</h2>
                ${W.gift({
                  btn: 'btn ghost',
                  hint: 'Chạm để kéo ngăn giấy mừng cưới',
                  box: html`<i class="dr-sleeve"></i><i class="dr-tray"><span class="dr-tray-label">Kéo ngăn giấy</span></i><i class="dr-pocket"></i>`,
                })}
              </div>` : ''}
            ${showThanks ? html`
              <div class="thanks-folio fold-pop">
                <figure class="thanks-frame">
                  <img data-zoom src="${pic('thanks', Math.max(0, ctx.album.length - 1))}" alt="${n.pair}" loading="lazy">
                </figure>
                <p class="invite">${t.thanks}</p>
                <p class="closing">${t.closing}</p>
                <p class="sign">${n.first} &amp; ${n.second}</p>
              </div>` : ''}
          </div>` : ''}
      </section>` : '';

    const main = html`
      ${navItems.length > 1 ? html`
        <nav class="book-nav" aria-label="Mục lục thiệp gấp">
          ${navItems.map(([href, label], i) => html`<a class="book-tab ${i === 0 ? 'on' : ''}" href="${href}">${label}</a>`)}
        </nav>` : ''}
      <div class="book-stack">
        ${spread1}
        ${spread2}
        ${spread3}
        ${spread4}
        ${spread5}
      </div>
      <footer class="book-colophon">
        <span>${mono}</span>
        <span>${dotDate(d.date)}</span>
      </footer>`;

    return { cover, main };
  },

  mounted(ctx, { main }) {
    const spreads = $$('.spread', main);
    const panes = $$('.page-pane', main);
    const foldPops = $$('.fold-pop', main);

    // 1. Fold-hinge reveal (IntersectionObserver driving --fold: 0 -> 1)
    if (reduced || typeof IntersectionObserver !== 'function') {
      spreads.forEach(s => s.classList.add('is-folded-open'));
      panes.forEach(p => p.classList.add('is-folded-open'));
      foldPops.forEach(el => el.classList.add('is-folded-open'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-folded-open');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
      spreads.forEach(s => io.observe(s));
      panes.forEach(p => io.observe(p));
      foldPops.forEach(el => io.observe(el));
    }

    // 2. Book nav active highlight
    const navLinks = $$('.book-tab', main);
    if (navLinks.length && typeof IntersectionObserver === 'function') {
      const navIo = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          navLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === id));
        });
      }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 });
      spreads.forEach(s => s.id && navIo.observe(s));
    }

    // 3. Hero 3D Pop-Up Stage pointer parallax (hover devices, non-reduced)
    const tiltStage = $('[data-stage-tilt]', main);
    if (tiltStage && !reduced && matchMedia('(hover: hover)').matches) {
      tiltStage.addEventListener('pointermove', e => {
        const r = tiltStage.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        tiltStage.style.setProperty('--px', px.toFixed(3));
        tiltStage.style.setProperty('--py', py.toFixed(3));
      });
      tiltStage.addEventListener('pointerleave', () => {
        tiltStage.style.setProperty('--px', '0');
        tiltStage.style.setProperty('--py', '0');
      });
    }

    // 4. Spread 4 interactive 3D Pop-Up Photo Stage
    const stage = $('.tg-stage', main);
    if (stage) {
      const tabs = $$('.tg-tab', stage);
      const wing = $('.stage-wings', stage);
      const photo = $('.wing-photo img', stage);
      const capEl = $('.stage-caption', stage);
      const counter = $('.stage-counter', stage);
      const prevBtn = $('.tg-prev', stage);
      const nextBtn = $('.tg-next', stage);
      let current = 0;

      const selectSlide = idx => {
        if (!tabs.length || !photo) return;
        current = (idx + tabs.length) % tabs.length;
        const tab = tabs[current];
        const src = tab.dataset.src || '';
        const cap = tab.dataset.cap || `Khung ảnh ${current + 1}`;
        photo.setAttribute('src', src);
        photo.setAttribute('alt', cap);
        if (capEl) capEl.textContent = cap;
        if (counter) counter.textContent = `${current + 1} / ${tabs.length}`;
        tabs.forEach((b, k) => {
          const on = k === current;
          b.classList.toggle('on', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        if (!reduced && wing) replay(wing, 'is-popping');
      };

      tabs.forEach((b, i) => b.addEventListener('click', () => selectSlide(i)));
      prevBtn?.addEventListener('click', () => selectSlide(current - 1));
      nextBtn?.addEventListener('click', () => selectSlide(current + 1));
    }
  },

  opened(ctx, instant) {
    const heroSpread = $('#spread-1');
    if (heroSpread) heroSpread.classList.add('is-folded-open');
    $$('.spread-hero .page-pane, .spread-hero .fold-pop').forEach(el => el.classList.add('is-folded-open'));
    if (instant) return;
  },
};
