// Mẫu "Khung Thêu": Tấm vải lanh thêu tay bất đối xứng (Artisan Linen Tapestry).
// Giữ nguyên thao tác nhấn-giữ khung thêu ở bìa (--p 0 -> 1 trong ~1.8s) + nút "Mở ngay".
// Động từ chuyển động: Stitch & Unspool (sợi chỉ SVG chạy theo cuộn, khâu chữ thập × trên phiếu RSVP).
import { html, raw, br, fmt, parts, reduced } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';
const SPRIG = (cx, cy, r, a) => `<path pathLength="1" transform="rotate(${a} ${cx} ${cy})" d="M${cx} ${cy - r}c10 -18 28 -22 30 -4c-6 16 -24 16 -30 4z"/>`;
const HEART = 'M150 214C84 168 88 112 124 108c18 -2 26 10 26 22 0 -12 8 -24 26 -22 36 4 40 60 -26 106z';
const SHAPES = `<path pathLength="1" d="${HEART}"/>` + [0, 60, 120, 180, 240, 300].map(a => SPRIG(150, 150, 96, a)).join('');

const HOOP_SIZES = ['h-320', 'h-180', 'h-240', 'h-220', 'h-300', 'h-180'];
const formatDateVN = iso => {
  const p = parts(iso);
  return p ? `${p.weekday}, ${p.d} tháng ${p.mo} năm ${p.y}` : '';
};
const normalizeStory = story => {
  if (!story) return [];
  if (typeof story === 'string') {
    const s = story.trim();
    return s ? [{ text: s }] : [];
  }
  if (Array.isArray(story)) {
    return story.map(item => {
      if (typeof item === 'string') {
        const s = item.trim();
        return s ? { text: s } : null;
      }
      if (item && typeof item === 'object') {
        const year = String(item.year ?? '').trim();
        const title = String(item.title ?? '').trim();
        const text = String(item.text ?? item.body ?? '').trim();
        return (year || title || text) ? { year, title, text } : null;
      }
      return null;
    }).filter(Boolean);
  }
  if (typeof story === 'object') {
    const year = String(story.year ?? '').trim();
    const title = String(story.title ?? '').trim();
    const text = String(story.text ?? story.body ?? '').trim();
    return (year || title || text) ? [{ year, title, text }] : [];
  }
  return [];
};

export default {
  palettes: [
    { id: 'dat-nung', name: 'Đất nung', swatch: ['#B84A39', '#557A65'] },
    { id: 'cham', name: 'Chàm & mù tạt', swatch: ['#2F4A6B', '#C8963E'], vars: { '--thread': '#2F4A6B', '--thread-2': '#C8963E', '--sage': '#5C7D96' } },
    { id: 'hong-sen', name: 'Hồng sen', swatch: ['#A9446C', '#6B8A5E'], vars: { '--thread': '#A9446C', '--thread-2': '#6B8A5E', '--sage': '#B87492' } },
  ],
  id: 'khung-theu',
  name: 'Khung Thêu',
  layout: 'wide',
  bodyClass: 'rv-custom',
  fonts: 'https://fonts.googleapis.com/css2?family=Charm:wght@400;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  coverMs: 2200,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['leaves', 'petals'],
      colors: {
        leaves: ['#557A65', '#769984', '#C8963E'],
        petals: ['#B84A39', '#E09F8E', '#C8963E', '#FAF4EA'],
      },
      density: 0.35,
    },
    sections: ['hero', 'couple', 'families', 'story', 'album', 'events', 'countdown', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Thêu một mũi chỉ đầu tiên',
      coverHint: 'Giữ ngón tay trên khung để thêu',
      kicker: 'Thiệp thêu tay',
      invite: 'Chúng mình khâu chuyện đôi mình bằng từng mũi chỉ nhỏ trên nền vải lanh thô, và mong có bạn ngồi bên cạnh trong ngày thêu nốt đường chỉ cuối cùng.',
      coupleTitle: 'Hai sợi chỉ, một đường thêu',
      storyTitle: 'Chuyện bên khung thêu',
      eventsTitle: 'Những mảnh vải vá',
      albumTitle: 'Khung thêu kỷ niệm',
      mapTitle: 'Đường đến xưởng tiệc',
      rsvpTitle: 'Nhãn vải hồi âm',
      rsvpLead: 'Bạn cho chúng mình biết bạn sẽ đến để khâu thêm một chỗ ngồi nhé.',
      guestbookTitle: 'Chỉ thêu của bạn',
      giftTitle: 'Túi gấm mừng cưới',
      thanks: 'Cảm ơn bạn đã cùng chúng mình khâu trọn mũi chỉ ngày chung đôi.',
      closing: 'Thương mến,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx;
    const t = d.texts || {};
    const has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const iniA = initial(n.first);
    const iniB = initial(n.second);
    const captions = d.images?.captions || [];
    const families = d.families || [];
    const events = d.events || [];
    const places = d.places || [];
    const accounts = d.accounts || [];

    const cover = html`
      <div class="th-stage">
        <p class="th-top">${t.coverTitle}</p>
        <div class="th-hoop" aria-label="Khung thêu, giữ ngón tay để thêu">
          <svg viewBox="0 0 300 300" class="th-art" aria-hidden="true">
            <circle cx="150" cy="150" r="128" class="cloth"/>
            <circle cx="150" cy="150" r="118" class="cloth-stitch"/>
            <g class="ghost"><path pathLength="1" d="${HEART}"/></g>
            <mask id="th-m" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300"><g class="reveal">${raw(SHAPES)}</g></mask>
            <g class="stitch" mask="url(#th-m)">${raw(SHAPES)}</g>
            <text x="150" y="146" text-anchor="middle" class="mono-t">${iniA}</text>
            <text x="150" y="176" text-anchor="middle" class="mono-t sm">&amp; ${iniB}</text>
          </svg>
          <i class="th-ring"></i><i class="th-screw"></i>
          <span class="th-needle" aria-hidden="true"></span>
        </div>
        <p class="th-to">Gửi <b>${guest}</b></p>
        <p class="th-hint">${t.coverHint}</p>
        <button class="th-skip" data-open>Mở ngay</button>
      </div>`;

    const safeImg = (slot, i = 0) => ctx.img(slot, i) || (ctx.album.length ? ctx.album[i % ctx.album.length] : '') || ctx.img('hero', 0) || '';
    const hoopPhoto = (src, alt, cls = '', caption = '') => src ? html`
      <figure class="hoop-card ${cls}">
        <div class="hoop">
          <img data-zoom src="${src}" alt="${alt}" loading="lazy">
          <i class="hoop-screw" aria-hidden="true"></i>
        </div>
        ${caption ? html`<figcaption class="hoop-cap">${caption}</figcaption>` : ''}
      </figure>` : '';

    const crestSvg = raw(`
      <svg class="kt-crest-svg" viewBox="0 0 88 88" width="76" height="76" aria-hidden="true">
        <circle cx="44" cy="44" r="39" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="5 4"/>
        <circle cx="44" cy="44" r="32" fill="none" stroke="var(--thread-2)" stroke-width="1.4" stroke-dasharray="3 4"/>
        <path d="M22 54 C18 38 26 24 38 20 M66 54 C70 38 62 24 50 20" fill="none" stroke="var(--sage)" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round"/>
      </svg>`);

    const heroSrc = safeImg('hero', 0);
    const heroZone = has('hero') ? html`
      <section class="kt-zone kt-hero ${heroSrc ? '' : 'no-hoop'}">
        ${heroSrc ? html`
          <div class="kt-hero-hoop">
            ${hoopPhoto(heroSrc, n.pair, 'h-380')}
          </div>` : ''}
        <div class="kt-hero-copy">
          <p class="kt-salute">${t.kicker} dành riêng cho <b>${guest}</b></p>
          <h1 class="names">
            <span class="name-a">${n.first}</span>
            <span class="name-amp">&amp;</span>
            <span class="name-b">${n.second}</span>
          </h1>
          <div class="kt-hero-meta">
            <div class="kt-crest" aria-hidden="true">
              ${crestSvg}
              <span>${iniA}<i>&amp;</i>${iniB}</span>
            </div>
            <div class="kt-date-block">
              <p class="when">${formatDateVN(d.date)}</p>
              ${d.city ? html`<p class="city">${d.city}</p>` : ''}
            </div>
          </div>
          <p class="invite">${t.invite}</p>
        </div>
      </section>` : '';

    const storyItems = normalizeStory(d.story);
    const showStory = has('story') && storyItems.length > 0;
    const renderStoryBody = () => storyItems.length === 1 && !storyItems[0].year && !storyItems[0].title
      ? html`<p>${br(storyItems[0].text)}</p>`
      : html`<ol class="kt-story-list">
          ${storyItems.map(item => html`
            <li class="kt-story-item">
              ${item.year ? html`<span class="kt-story-year">${item.year}</span>` : ''}
              ${item.title ? html`<h4>${item.title}</h4>` : ''}
              ${item.text ? html`<p>${br(item.text)}</p>` : ''}
            </li>`)}
        </ol>`;
    const showCouple = has('couple');
    const showFamilies = has('families') && families.length > 0;

    const weaveZone = (showCouple || showStory || showFamilies) ? html`
      <section class="kt-zone kt-weave">
        ${showCouple ? html`
          <header class="kt-head">
            <h2 class="ttl">${t.coupleTitle}</h2>
          </header>
          <div class="duo ${showStory ? 'has-story' : ''}">
            <div class="person person-a">
              ${hoopPhoto(safeImg('groom', 1), n.groom, 'h-240')}
              <div class="person-info">
                <h3>${n.groom}</h3>
                ${d.groom?.bio ? html`<p class="bio">${d.groom.bio}</p>` : ''}
              </div>
            </div>
            ${showStory ? html`
              <article class="story-patch">
                <h3>${t.storyTitle}</h3>
                ${renderStoryBody()}
              </article>` : ''}
            <div class="person person-b">
              ${hoopPhoto(safeImg('bride', 2), n.bride, 'h-240 hoop-walnut')}
              <div class="person-info">
                <h3>${n.bride}</h3>
                ${d.bride?.bio ? html`<p class="bio">${d.bride.bio}</p>` : ''}
              </div>
            </div>
          </div>` : (showStory ? html`
          <article class="story-patch solo">
            <h3>${t.storyTitle}</h3>
            ${renderStoryBody()}
          </article>` : '')}

        ${showFamilies ? html`
          <div class="families-grid">
            ${families.map((f, i) => html`
              <div class="label fam-${i % 2}">
                <h3>${f.side}</h3>
                ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
                ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
                ${f.address ? html`<small>${br(f.address)}</small>` : ''}
              </div>`)}
          </div>` : ''}
      </section>` : '';

    const hoopsZone = (has('album') && ctx.album.length) ? html`
      <section class="kt-zone kt-hoops">
        <header class="kt-head">
          <h2 class="ttl">${t.albumTitle}</h2>
        </header>
        <div class="hoop-tapestry">
          ${ctx.album.map((src, i) => hoopPhoto(
            src,
            captions[i] || `Ảnh cưới ${i + 1}`,
            `${HOOP_SIZES[i % HOOP_SIZES.length]} tap-${i % 3} ${i % 2 ? 'zig-r' : 'zig-l'}`,
            captions[i] || ''
          ))}
        </div>
      </section>` : '';

    const showEvents = has('events') && events.length > 0;
    const showCountdown = has('countdown');
    const showMap = has('map') && places.length > 0;

    const craftZone = (showEvents || showCountdown || showMap) ? html`
      <section class="kt-zone kt-craft ${(showEvents || showCountdown) && showMap ? 'two-col' : 'one-col'}">
        ${(showEvents || showCountdown) ? html`
          <div class="kt-events-col">
            ${showEvents ? html`
              <header class="kt-head">
                <h2 class="ttl">${t.eventsTitle}</h2>
              </header>
              <div class="patches-stack">
                ${events.map((e, i) => {
                  const p = parts(e.date);
                  return html`
                    <article class="cloth-patch c${i % 3} ${e.main ? 'main' : ''}">
                      <small class="patch-meta">
                        <span class="patch-day">${p ? `${p.weekday}, ${p.dd}/${p.mm}` : ''}</span>
                        <span class="patch-time">${fmt.time(e.date)}</span>
                      </small>
                      <h3>${e.title}</h3>
                      ${e.venue ? html`<p class="venue">${e.venue}</p>` : ''}
                      ${e.address ? html`<p class="addr">${e.address}</p>` : ''}
                      ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                    </article>`;
                })}
              </div>` : ''}
            ${showCountdown ? html`
              <div class="kt-ruler">
                ${W.countdown()}
                <a class="btn ghost kt-gcal" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu ngày chung đôi</a>
              </div>` : ''}
          </div>` : ''}

        ${showMap ? html`
          <div class="kt-map-col">
            <header class="kt-head">
              <h2 class="ttl">${t.mapTitle}</h2>
            </header>
            <div class="kt-map-mat">
              ${W.map({ btn: 'btn' })}
            </div>
          </div>` : ''}
      </section>` : '';

    const showRsvp = has('rsvp');
    const showGuestbook = has('guestbook');
    const showGift = has('gift') && accounts.length > 0;

    const replyZone = (showRsvp || showGuestbook || showGift) ? html`
      <section class="kt-zone kt-reply ${showRsvp && (showGuestbook || showGift) ? 'two-col' : 'one-col'}">
        ${showRsvp ? html`
          <div class="kt-rsvp-col">
            <div class="tag">
              <h2 class="ttl">${t.rsvpTitle}</h2>
              <p class="lead">${t.rsvpLead}</p>
              ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}
            </div>
          </div>` : ''}

        ${(showGuestbook || showGift) ? html`
          <div class="kt-book-gift-col">
            ${showGuestbook ? html`
              <div class="kt-guestbook-patch">
                <h2 class="ttl">${t.guestbookTitle}</h2>
                ${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}
              </div>` : ''}
            ${showGift ? html`
              <div class="kt-gift-pouch">
                <h2 class="ttl">${t.giftTitle}</h2>
                ${W.gift({
                  btn: 'btn ghost',
                  hint: 'Chạm để nới dây túi',
                  box: html`<i class="bag-back"></i><i class="bag-card">❤</i><i class="bag"></i><i class="bag-cord"></i>`,
                })}
              </div>` : ''}
          </div>` : ''}
      </section>` : '';

    const thanksSrc = safeImg('thanks', 5);
    const thanksZone = has('thanks') ? html`
      <section class="kt-zone kt-thanks ${thanksSrc ? '' : 'no-hoop'}">
        ${thanksSrc ? html`
          <div class="kt-thanks-hoop">
            ${hoopPhoto(thanksSrc, n.pair, 'h-260')}
          </div>` : ''}
        <div class="kt-thanks-copy">
          <p class="invite">${t.thanks}</p>
          <p class="closing">${t.closing}</p>
          <p class="sign">${n.first} &amp; ${n.second}</p>
        </div>
      </section>` : '';

    const main = html`
      <div class="kt-thread-layer" aria-hidden="true">
        <svg class="kt-thread-svg" fill="none">
          <mask id="kt-thread-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1200" height="4000">
            <path class="kt-thread-reveal" d="" stroke="#fff" stroke-width="14" stroke-linecap="round" />
          </mask>
          <path class="kt-thread-guide" d="" />
          <path class="kt-thread-line" d="" mask="url(#kt-thread-mask)" />
        </svg>
      </div>
      <div class="kt-tapestry">
        ${heroZone}
        ${weaveZone}
        ${hoopsZone}
        ${craftZone}
        ${replyZone}
        ${thanksZone}
      </div>
      <footer class="kt-footer">
        <span>${iniA} &amp; ${iniB}</span>
        <span class="kt-foot-stitch" aria-hidden="true"></span>
        <span>${fmt.short(d.date)}</span>
      </footer>`;

    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    // 1. Giữ ngón tay trên khung để thêu (bắt buộc cho khach.mjs:189-201)
    const hoop = cover.querySelector('.th-hoop');
    const art = cover.querySelector('.th-art');
    const needle = cover.querySelector('.th-needle');

    if (hoop && art) {
      if (reduced) {
        art.style.setProperty('--p', '1');
        hoop.addEventListener('click', () => ctx.open(false));
      } else {
        let p = 0, holding = false, raf = 0, last = 0, done = false;
        const tick = now => {
          const dt = Math.min(64, now - last);
          last = now;
          p = Math.max(0, Math.min(1, p + (holding ? dt / 1800 : -dt / 900)));
          art.style.setProperty('--p', p.toFixed(3));
          needle?.style.setProperty('--p', p.toFixed(3));
          if (p >= 1 && !done) {
            done = true;
            navigator.vibrate?.(40);
            ctx.open(false);
            return;
          }
          if (holding || p > 0) raf = requestAnimationFrame(tick);
          else raf = 0;
        };
        const start = e => {
          if (done) return;
          e.preventDefault();
          holding = true;
          last = performance.now();
          if (!raf) raf = requestAnimationFrame(tick);
        };
        const stop = () => { holding = false; };
        hoop.addEventListener('pointerdown', start);
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => hoop.addEventListener(ev, stop));
      }
    }

    // 2. Đường chỉ chạy liên tục (running-stitch) nối các vùng theo tiến độ cuộn
    const svg = main.querySelector('.kt-thread-svg');
    const mask = main.querySelector('#kt-thread-mask');
    const reveal = main.querySelector('.kt-thread-reveal');
    const guide = main.querySelector('.kt-thread-guide');
    const line = main.querySelector('.kt-thread-line');
    if (svg && mask && reveal && guide && line) {
      let totalLen = 1;
      const updateThread = () => {
        if (reduced) {
          reveal.style.strokeDashoffset = '0';
          return;
        }
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const progress = Math.min(1, Math.max(0.08, (window.scrollY + window.innerHeight * 0.35) / (maxScroll + window.innerHeight * 0.35)));
        reveal.style.strokeDashoffset = (totalLen * (1 - progress)).toFixed(1);
      };

      const buildPath = () => {
        const w = Math.max(320, main.clientWidth);
        const h = Math.max(600, main.scrollHeight);
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('width', String(w));
        svg.setAttribute('height', String(h));
        mask.setAttribute('width', String(w));
        mask.setAttribute('height', String(h));

        const wide = w >= 720;
        const leftX = wide ? w * 0.14 : w * 0.11;
        const rightX = wide ? w * 0.86 : w * 0.89;
        const midX = w * 0.5;
        const step = wide ? 340 : 280;
        const pts = [];
        for (let y = 40, idx = 0; y < h - 40; y += step, idx++) {
          const x = idx % 3 === 0 ? leftX : idx % 3 === 1 ? rightX : midX;
          pts.push([x, y]);
        }
        pts.push([midX, Math.max(120, h - 50)]);

        let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
        for (let i = 1; i < pts.length; i++) {
          const [x0, y0] = pts[i - 1];
          const [x1, y1] = pts[i];
          const cy = (y0 + y1) / 2;
          d += ` C ${x0.toFixed(1)} ${cy.toFixed(1)}, ${x1.toFixed(1)} ${cy.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
        }
        guide.setAttribute('d', d);
        line.setAttribute('d', d);
        reveal.setAttribute('d', d);
        totalLen = Math.max(1, reveal.getTotalLength?.() || h);
        reveal.style.strokeDasharray = `${totalLen}`;
        updateThread();
      };

      buildPath();
      if (typeof ResizeObserver === 'function') {
        new ResizeObserver(buildPath).observe(main);
      }
      if (!reduced) {
        let ticking = false;
        window.addEventListener('scroll', () => {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(() => {
              ticking = false;
              updateThread();
            });
          }
        }, { passive: true });
      }
      main._ktUpdateThread = updateThread;
    }

    // 3. Khâu viền khung thêu khi xuất hiện trong tầm nhìn (chuyển động riêng theo chủ đề)
    const hoops = [...main.querySelectorAll('.hoop-card, .cloth-patch')];
    if (reduced || typeof IntersectionObserver !== 'function') {
      hoops.forEach(el => el.classList.add('stitched'));
    } else {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('stitched');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.14 });
      hoops.forEach(el => io.observe(el));
    }
  },

  opened() {
    const main = document.getElementById('card');
    if (main?._ktUpdateThread) {
      requestAnimationFrame(() => main._ktUpdateThread());
    }
  },
};
