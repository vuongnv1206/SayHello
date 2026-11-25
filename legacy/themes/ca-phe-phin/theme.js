// Mẫu "Cà Phê Phin": Bàn cà phê & thực đơn nếm (Artisanal Café Table & Tasting Flight).
// Desktop: bàn gỗ óc chó mở cuốn thực đơn 2 mặt có gáy đồng thau. Mobile: thẻ Tasting Flight chạm nhảy nhanh.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, raw, br, fmt, parts } from '../../core/util.js';

const PHIN_SVG = `
<svg class="cf-phin-svg" viewBox="0 0 200 164" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="cfAlumBody" x1="28" y1="36" x2="172" y2="36" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#8B929A"/>
      <stop offset="28%" stop-color="#E7EAEE"/>
      <stop offset="52%" stop-color="#FFFFFF"/>
      <stop offset="78%" stop-color="#B0B7C0"/>
      <stop offset="100%" stop-color="#767D86"/>
    </linearGradient>
    <linearGradient id="cfAlumLid" x1="46" y1="10" x2="154" y2="10" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#90979F"/>
      <stop offset="35%" stop-color="#F1F3F6"/>
      <stop offset="72%" stop-color="#B9C0C8"/>
      <stop offset="100%" stop-color="#7C838B"/>
    </linearGradient>
    <linearGradient id="cfAlumPlate" x1="12" y1="126" x2="188" y2="126" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#787F87"/>
      <stop offset="35%" stop-color="#F2F4F7"/>
      <stop offset="68%" stop-color="#C7CDD4"/>
      <stop offset="100%" stop-color="#6B727A"/>
    </linearGradient>
  </defs>
  <g class="cf-lid-group">
    <circle cx="100" cy="11" r="7.5" fill="url(#cfAlumLid)" stroke="#5C626A" stroke-width="1"/>
    <path d="M54 36 C54 22, 66 17, 100 17 C134 17, 146 22, 146 36 Z" fill="url(#cfAlumLid)" stroke="#5C626A" stroke-width="1.2"/>
    <rect x="49" y="34" width="102" height="5" rx="2.5" fill="#D5DBE1" stroke="#5C626A" stroke-width="1"/>
  </g>
  <path d="M148 54 C172 54, 174 96, 152 104" stroke="#C5CBD2" stroke-width="6.5" stroke-linecap="round"/>
  <path d="M148 54 C172 54, 174 96, 152 104" stroke="#646A72" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M46 39 L154 39 L144 124 L56 124 Z" fill="url(#cfAlumBody)" stroke="#596068" stroke-width="1.4"/>
  <path d="M52 58 H148 M54 78 H146 M56 98 H144" stroke="rgba(70,76,84,0.22)" stroke-width="1.2"/>
  <ellipse cx="100" cy="127" rx="84" ry="11" fill="url(#cfAlumPlate)" stroke="#545A62" stroke-width="1.4"/>
  <ellipse cx="100" cy="125" rx="54" ry="4" fill="#6B727A" opacity="0.35"/>
</svg>`;

const VAPOR_SVG = `
<svg class="cf-vapor-svg" viewBox="0 0 180 120" fill="none" aria-hidden="true">
  <path class="vp v1" d="M52 112 C42 86, 66 64, 52 38 C42 20, 56 8, 62 2" stroke="rgba(250,243,230,0.68)" stroke-width="3.2" stroke-linecap="round"/>
  <path class="vp v2" d="M90 116 C104 88, 76 62, 92 34 C102 18, 86 6, 84 1" stroke="rgba(244,218,180,0.75)" stroke-width="3.8" stroke-linecap="round"/>
  <path class="vp v3" d="M128 112 C116 84, 140 60, 126 32 C118 16, 132 7, 134 2" stroke="rgba(250,243,230,0.62)" stroke-width="3" stroke-linecap="round"/>
</svg>`;

export default {
  id: 'ca-phe-phin',
  name: 'Cà Phê Phin',
  layout: 'wide',
  bodyClass: 'rv-custom',
  coverMs: 2800,
  cheersButton: 'btn',
  fonts: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500;1,700&family=Space+Mono:wght@400;700&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap',
  palettes: [
    { id: 'nau-sua', name: 'Nâu sữa', swatch: ['#261812', '#C98A4B'] },
    {
      id: 'matcha',
      name: 'Matcha',
      swatch: ['#2F4A32', '#A9C47A'],
      vars: {
        '--cof': '#2F4A32',
        '--cof-2': '#456348',
        '--crema': '#A9C47A',
        '--cream': '#EFF2E4',
        '--paper': '#F8F9F0',
        '--ink': '#1F2B20',
        '--ink-soft': '#4F5F50',
        '--moss': '#2F4A32',
        '--stamp': '#A63429',
      },
    },
    {
      id: 'hong-bac-xiu',
      name: 'Bạc xỉu hồng',
      swatch: ['#5E313B', '#E2A3A3'],
      vars: {
        '--cof': '#5E313B',
        '--cof-2': '#7B4652',
        '--crema': '#E2A3A3',
        '--cream': '#F7EBE6',
        '--paper': '#FDF6F2',
        '--ink': '#361D22',
        '--ink-soft': '#6D4B52',
        '--moss': '#4B6352',
        '--stamp': '#A63429',
      },
    },
  ],
  defaults: {
    effects: {
      ambient: ['bokeh'],
      colors: { bokeh: ['#f2c58b', '#c98a4b', '#fff3df'] },
      density: 0.45,
    },
    sections: ['hero', 'couple', 'families', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Quán quen ngày đầu',
      coverHint: 'Chạm vào phin để pha ly cà phê mở thiệp',
      kicker: 'Thực đơn hôm nay',
      invite: 'Hôm nay quán có một món đặc biệt: ngày chung đôi của hai đứa. Mời bạn ghé, ngồi xuống, và uống cùng chúng mình ly cà phê ngọt nhất.',
      coupleTitle: 'Hương vị mở đầu',
      storyTitle: 'Chuyện rang xay',
      eventsTitle: 'Thực đơn buổi lễ',
      albumTitle: 'Bàn nếm ảnh cưới',
      rsvpTitle: 'Phiếu order',
      rsvpLead: 'Bạn ghi giúp chúng mình lịch ghé nhé, để quán giữ sẵn một góc bàn.',
      guestbookTitle: 'Bảng ghim lời nhắn',
      giftTitle: 'Hũ tiền tip',
      thanks: 'Cảm ơn bạn đã ghé quán. Hẹn gặp lại ở ngày chung đôi.',
      closing: 'Hẹn bạn bên ly cà phê sáng,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx;
    const t = d.texts || {};
    const has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const dp = parts(d.date);
    const captions = d.images?.captions || [];

    const cover = html`
      <div class="cf-table">
        <div class="cf-cover-head">
          <p class="cf-top">${t.coverTitle || 'Quán quen ngày đầu'}</p>
          <p class="cf-to">Dành mời <b>${guest}</b></p>
        </div>
        <div class="cf-set">
          <div class="cf-vapor" aria-hidden="true">${raw(VAPOR_SVG)}</div>
          <button class="cf-phin" type="button" data-open aria-label="Chạm vào phin để pha cà phê mở thiệp">
            ${raw(PHIN_SVG)}
            <i class="drop d1"></i>
            <i class="drop d2"></i>
            <i class="drop d3"></i>
          </button>
          <div class="cf-glass" aria-hidden="true">
            <span class="cf-glass-rim"></span>
            <i class="coffee"><b class="crema-foam"></b></i>
            <span class="cf-glass-shine"></span>
          </div>
          <div class="cf-coaster-plate">
            <p class="cf-coaster-names">${n.first} <span class="cf-amp">&amp;</span> ${n.second}</p>
            ${d.date ? html`<p class="cf-coaster-date cf-mono">${fmt.short(d.date)}</p>` : ''}
          </div>
        </div>
        <button class="cf-hint-btn" type="button" data-open>${t.coverHint || 'Chạm vào phin để mở thiệp'}</button>
      </div>`;

    const secHead = (title, badge = '') => html`
      <header class="cf-mh">
        <h2>${title}</h2>
        ${badge ? html`<span class="cf-code cf-mono">${badge}</span>` : ''}
      </header>`;

    const coaster = (src, alt, cls = '') => src ? html`
      <figure class="coaster ${cls}">
        <img data-zoom src="${src}" alt="${alt}" loading="lazy">
      </figure>` : '';

    const heroBlock = has('hero') ? html`
      <section class="cf-sec cf-hero" id="cf-hero">
        <div class="cf-masthead">
          <div class="cf-mast-names">
            <span class="cf-kicker">${t.kicker || 'Thực đơn hôm nay'}</span>
            <h1 class="cf-couple">
              <span class="cf-n1">${n.first}</span>
              <span class="cf-n2"><em class="cf-amp-badge">&amp;</em> ${n.second}</span>
            </h1>
          </div>
          <div class="cf-mast-meta">
            ${dp ? html`<span class="cf-day-num" aria-hidden="true">${dp.dd}</span>` : ''}
            <dl class="cf-meta-list">
              ${d.date ? html`<div><dt>Ngày</dt><dd class="cf-mono">${fmt.short(d.date)}</dd></div>` : ''}
              ${d.date ? html`<div><dt>Giờ</dt><dd class="cf-mono">${fmt.time(d.date)}</dd></div>` : ''}
              ${d.city ? html`<div><dt>Quán</dt><dd>${d.city}</dd></div>` : ''}
            </dl>
          </div>
        </div>

        <figure class="cf-hero-coaster">
          <div class="cf-hero-mat">
            <img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}">
          </div>
          <figcaption class="cf-hero-cap">
            <span>Ngày chung đôi</span>
            ${dp ? html`<span class="cf-mono">${dp.dd}/${dp.mm}/${dp.y}</span>` : ''}
          </figcaption>
        </figure>

        ${t.invite ? html`<p class="cf-invite">${t.invite}</p>` : ''}
      </section>` : '';

    const albumBlock = has('album') && ctx.album.length ? html`
      <section class="cf-sec cf-flight-sec" id="cf-album">
        <div class="cf-flight-head">
          <div>
            <h2>${t.albumTitle || 'Bàn nếm ảnh cưới'}</h2>
            <p class="cf-flight-sub">${ctx.album.length} khung ảnh kỷ niệm</p>
          </div>
          <div class="cf-strip-ctl">
            <button type="button" class="cf-strip-btn" data-strip="-1" aria-label="Ảnh trước">‹</button>
            <button type="button" class="cf-strip-btn" data-strip="1" aria-label="Ảnh tiếp">›</button>
          </div>
        </div>
        <div class="cf-flight-strip" role="region" aria-label="Dải ảnh nếm vị kỷ niệm">
          ${ctx.album.map((src, i) => html`
            <figure class="cf-shot">
              <div class="cf-shot-frame">
                <img data-zoom src="${src}" alt="${captions[i] || `Ảnh cưới ${i + 1}`}">
              </div>
              <figcaption>
                <span class="cf-mono">#0${i + 1}</span>
                <span>${captions[i] || 'Khoảnh khắc chung đôi'}</span>
              </figcaption>
            </figure>`)}
        </div>
      </section>` : '';

    const coupleBlock = has('couple') ? html`
      <section class="cf-sec cf-couple-sec" id="cf-couple">
        ${secHead(t.coupleTitle || 'Hương vị mở đầu')}
        <div class="cf-duo">
          <article class="cf-note-card">
            ${coaster(ctx.img('groom', 3), n.groom, 'sm')}
            <div class="cf-note-body">
              <span class="cf-role">Chú rể</span>
              <h3>${n.groom}</h3>
              ${d.groom?.bio ? html`<p>${d.groom.bio}</p>` : ''}
            </div>
          </article>
          <article class="cf-note-card">
            ${coaster(ctx.img('bride', 4), n.bride, 'sm')}
            <div class="cf-note-body">
              <span class="cf-role">Cô dâu</span>
              <h3>${n.bride}</h3>
              ${d.bride?.bio ? html`<p>${d.bride.bio}</p>` : ''}
            </div>
          </article>
        </div>
      </section>` : '';

    const thanksBlock = has('thanks') ? html`
      <section class="cf-sec cf-thanks" id="cf-thanks">
        <div class="cf-thanks-wrap">
          ${coaster(ctx.img('thanks', 5), n.pair, 'thanks-ring')}
          <div class="cf-thanks-copy">
            ${t.thanks ? html`<p class="cf-thanks-lead">${t.thanks}</p>` : ''}
            ${t.closing ? html`<p class="cf-closing">${t.closing}</p>` : ''}
            <p class="cf-sign">${n.first} &amp; ${n.second}</p>
          </div>
        </div>
      </section>` : '';

    const eventsBlock = has('events') && (d.events || []).length ? html`
      <section class="cf-sec cf-events" id="cf-menu">
        ${secHead(t.eventsTitle || 'Thực đơn buổi lễ', dp ? `${dp.dd}.${dp.mm}` : '')}
        <ul class="cf-leaders">
          ${d.events.map(e => {
            const ep = parts(e.date);
            return html`
              <li class="cf-ev ${e.main ? 'main' : ''}">
                <div class="cf-ev-top">
                  <span class="cf-ev-title">${e.title}</span>
                  <i class="cf-dots" aria-hidden="true"></i>
                  <span class="cf-ev-dt">
                    ${e.date ? html`<span class="cf-mono">${fmt.time(e.date)}</span>` : ''}
                    ${ep ? html`<span class="cf-mono">${ep.dd}/${ep.mm}</span>` : ''}
                  </span>
                </div>
                ${e.venue ? html`<p class="cf-ev-venue">${e.venue}</p>` : ''}
                ${e.address ? html`<p class="cf-ev-addr">${e.address}</p>` : ''}
                ${e.lunar ? html`<p class="cf-ev-lunar">${e.lunar}</p>` : ''}
              </li>`;
          })}
        </ul>
      </section>` : '';

    const familiesBlock = has('families') && (d.families || []).length ? html`
      <section class="cf-sec cf-families" id="cf-families">
        <div class="cf-fam-grid">
          ${d.families.map(f => html`
            <div class="cf-fam">
              <h3>${f.side}</h3>
              ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
              ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
              ${f.address ? html`<p class="cf-fam-addr">${br(f.address)}</p>` : ''}
            </div>`)}
        </div>
      </section>` : '';

    const storyItems = (() => {
      const s = d.story;
      if (!s) return [];
      if (typeof s === 'string') return s.trim() ? [{ text: s.trim() }] : [];
      if (Array.isArray(s)) {
        return s.map(item => {
          if (typeof item === 'string') return item.trim() ? { text: item.trim() } : null;
          if (item && typeof item === 'object') {
            const year = String(item.year ?? '').trim();
            const title = String(item.title ?? '').trim();
            const text = String(item.text ?? item.body ?? '').trim();
            return (year || title || text) ? { year, title, text } : null;
          }
          return null;
        }).filter(Boolean);
      }
      if (typeof s === 'object') {
        const year = String(s.year ?? '').trim();
        const title = String(s.title ?? '').trim();
        const text = String(s.text ?? s.body ?? '').trim();
        return (year || title || text) ? [{ year, title, text }] : [];
      }
      return [];
    })();

    const storyBlock = has('story') && storyItems.length ? html`
      <section class="cf-sec cf-story" id="cf-story">
        ${secHead(t.storyTitle || 'Chuyện rang xay')}
        ${storyItems.length === 1 && !storyItems[0].year && !storyItems[0].title
          ? html`<p class="cf-story-prose">${br(storyItems[0].text)}</p>`
          : html`<ol class="cf-story-list">
              ${storyItems.map(item => html`
                <li>
                  ${item.year ? html`<span class="cf-story-yr cf-mono">${item.year}</span>` : html`<span class="cf-story-yr cf-mono">•</span>`}
                  <div>
                    ${item.title ? html`<h3>${item.title}</h3>` : ''}
                    ${item.text ? html`<p>${br(item.text)}</p>` : ''}
                  </div>
                </li>`)}
            </ol>`}
      </section>` : '';

    const countdownBlock = has('countdown') ? html`
      <section class="cf-sec cf-count" id="cf-count">
        <div class="cf-board">
          <span class="cf-board-label">Đếm ngược ngày chung đôi</span>
          ${W.countdown()}
        </div>
        <a class="btn ghost cf-cal-btn" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu lịch hẹn quán</a>
      </section>` : '';

    const mapBlock = has('map') ? html`
      <section class="cf-sec cf-map-sec" id="cf-map">
        ${secHead('Đường đến quán')}
        <div class="cf-map-wrap">${W.map({ btn: 'btn' })}</div>
      </section>` : '';

    const rsvpBlock = has('rsvp') ? html`
      <section class="cf-sec cf-reply" id="cf-rsvp">
        <div class="slip">
          <div class="slip-h">
            <div>
              <span class="cf-slip-kicker">Bàn đón khách</span>
              <h2>${t.rsvpTitle || 'Phiếu order'}</h2>
            </div>
            <span class="cf-slip-num cf-mono">Nº ${dp ? `${dp.dd}${dp.mm}` : '01'}</span>
          </div>
          <div class="cf-stamp" aria-hidden="true">
            <span class="cf-stamp-main">ĐÃ NHẬN ORDER</span>
            <span class="cf-stamp-sub cf-mono">${dp ? `${dp.dd}.${dp.mm}.${dp.y}` : 'ĐÃ NHẬN'}</span>
          </div>
          <p class="lead">${t.rsvpLead || 'Bạn ghi giúp chúng mình lịch ghé nhé.'}</p>
          ${W.rsvp({ btn: 'btn', yes: 'Ghé dự tiệc', no: 'Tiếc, bận rồi' })}
        </div>
      </section>` : '';

    const guestbookBlock = has('guestbook') ? html`
      <section class="cf-sec cf-book-sec" id="cf-book">
        ${secHead(t.guestbookTitle || 'Bảng ghim lời nhắn')}
        <div class="cf-guestbook-wrap">
          ${W.guestbook({ btn: 'btn', placeholder: 'Viết lời nhắn gửi hai bạn...' })}
        </div>
      </section>` : '';

    const giftBlock = has('gift') ? html`
      <section class="cf-sec cf-gift" id="cf-gift">
        ${secHead(t.giftTitle || 'Hũ tiền tip')}
        ${W.gift({
          btn: 'btn ghost',
          hint: 'Chạm nắp để mở hũ',
          box: html`<i class="jar-lid"></i><i class="jar-coins"></i><i class="jar"></i><i class="jar-label">TIP</i>`,
        })}
      </section>` : '';

    const flightPills = [
      has('hero') && html`<a href="#cf-hero" class="cf-pill on">Bàn ảnh</a>`,
      (has('events') || has('map')) && html`<a href="#cf-menu" class="cf-pill">Thực đơn</a>`,
      has('rsvp') && html`<a href="#cf-rsvp" class="cf-pill">Phiếu order</a>`,
      has('guestbook') && html`<a href="#cf-book" class="cf-pill">Lời nhắn</a>`,
    ].filter(Boolean);

    const main = html`
      <div class="cf-desktop-stage">
        ${flightPills.length ? html`<nav class="cf-flight-nav" aria-label="Lối tắt thực đơn">${flightPills}</nav>` : ''}
        <div class="cf-book">
          <div class="cf-panel cf-panel-left">
            ${heroBlock}
            ${albumBlock}
            ${coupleBlock}
            ${thanksBlock}
          </div>
          <div class="cf-spine" aria-hidden="true">
            <i class="cf-rivet"></i>
            <i class="cf-rivet"></i>
            <i class="cf-rivet"></i>
          </div>
          <div class="cf-panel cf-panel-right">
            ${eventsBlock}
            ${familiesBlock}
            ${storyBlock}
            ${countdownBlock}
            ${mapBlock}
            ${rsvpBlock}
            ${guestbookBlock}
            ${giftBlock}
          </div>
        </div>
        <footer class="cf-footer">
          <span class="cf-footer-names">${n.first} &amp; ${n.second}</span>
          ${d.date ? html`<span class="cf-sep" aria-hidden="true">/</span><span class="cf-mono">${fmt.short(d.date)}</span>` : ''}
          <span class="cf-sep" aria-hidden="true">/</span>
          <span>Cà Phê Phin</span>
        </footer>
      </div>`;

    return { cover, main };
  },

  mounted(ctx, { main }) {
    // 1) Đóng dấu cao su "ĐÃ NHẬN ORDER" khi form RSVP gửi thành công
    const slip = main.querySelector('.slip');
    const rsvpForm = main.querySelector('form[data-w="rsvp"]');
    if (slip && rsvpForm) {
      const msg = rsvpForm.querySelector('.msg');
      const stampText = slip.querySelector('.cf-stamp-main');
      const applyStamp = () => {
        if (!msg) return;
        if (/Cảm ơn/.test(msg.textContent || '')) {
          if (stampText) {
            stampText.textContent = rsvpForm.attend?.value === 'Không' ? 'ĐÃ GHI NHẬN' : 'ĐÃ NHẬN ORDER';
          }
          slip.classList.remove('stamped');
          void slip.offsetWidth;
          slip.classList.add('stamped');
        }
      };
      if (msg) new MutationObserver(applyStamp).observe(msg, { childList: true, characterData: true, subtree: true });
    }

    // 2) Nút lướt trái/phải dải ảnh Tasting Flight
    const strip = main.querySelector('.cf-flight-strip');
    if (strip) {
      main.querySelectorAll('.cf-strip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const dir = Number(btn.dataset.strip || 1);
          const card = strip.querySelector('.cf-shot');
          const step = card ? card.getBoundingClientRect().width + 14 : 260;
          strip.scrollBy({ left: dir * step, behavior: 'smooth' });
        });
      });
    }

    // 3) Theo dõi thẻ Tasting Flight đang xem
    const pills = [...main.querySelectorAll('.cf-flight-nav .cf-pill')];
    if (pills.length) {
      const targets = pills.map(a => ({ a, el: main.querySelector(a.getAttribute('href')) })).filter(x => x.el);
      const setActive = id => pills.forEach(p => p.classList.toggle('on', p.getAttribute('href') === `#${id}`));
      pills.forEach(p => p.addEventListener('click', () => setActive(p.getAttribute('href').slice(1))));
      if (typeof IntersectionObserver === 'function' && targets.length) {
        const io = new IntersectionObserver(entries => {
          const visible = entries.find(e => e.isIntersecting);
          if (visible) setActive(visible.target.id);
        }, { rootMargin: '-25% 0px -60% 0px', threshold: 0.01 });
        targets.forEach(t => io.observe(t.el));
      }
    }
  },
};
