// Mẫu "Song Hỷ": Sân lễ sơn mài Đông Dương (Indochine Ceremonial Courtyard).
// Ảnh dùng: images.hero, images.couple, images.portrait, images.band, images.thanks, images.album[]
import { $, $$, html, br, parts, reduced } from '../../core/util.js';

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
  // Bảng màu có sẵn: cặp đôi chọn trong Studio; vars ghi đè biến màu của mẫu (xem theme.css)
  palettes: [{"id":"do-vang","name":"Đỏ vàng","swatch":["#a4161a","#e6c27a"]},{"id":"ngoc-bich","name":"Xanh ngọc","swatch":["#0f6b5c","#e6c27a"],"vars":{"--red":"#0f6b5c","--red-deep":"#0a4a40","--red-dark":"#06332c"}},{"id":"hong-phan","name":"Hồng phấn","swatch":["#b4477a","#f0d2a0"],"vars":{"--red":"#b4477a","--red-deep":"#7e2754","--red-dark":"#541638"}},{"id":"navy-bac","name":"Xanh navy & bạc","swatch":["#1f3a6b","#d7dce6"],"vars":{"--red":"#1f3a6b","--red-deep":"#14284d","--red-dark":"#0c1a33","--gold":"#d7dce6","--gold-deep":"#8d97ad"}}],
  id: 'song-hy',
  name: 'Song Hỷ',
  layout: 'wide',
  bodyClass: 'rv-custom',
  voice: 'trang-trong',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,500;0,700;1,500&display=swap',
  coverMs: 2100,
  cheersButton: 'btn gold',
  defaults: {
    effects: { ambient: ['petals', 'sparkles'] },
    sections: ['invite', 'couple', 'story', 'band', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      kicker: 'Lễ Thành Hôn',
      invite: 'Trân trọng báo tin Lễ Thành Hôn của chúng tôi',
      presence: 'Sự hiện diện của quý khách là niềm vinh hạnh\ncủa chúng tôi.',
      quote: '“Hạnh phúc là khi đi cùng nhau thật lâu,\nvà hôm nay là ngày đầu tiên của mãi mãi.”',
      thanks: 'Chúng tôi rất mong được đón tiếp quý khách\ntrong ngày vui trọng đại này.',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx;
    const t = d.texts || {};
    const has = s => ctx.has(s);
    const guest = ctx.guest || 'Quý khách';

    const pDate = parts(d.date);
    const dateDots = pDate ? `${pDate.dd} / ${pDate.mm} / ${pDate.y}` : '';
    const dateLong = pDate ? `${pDate.weekday}, ngày ${pDate.d} tháng ${pDate.mo} năm ${pDate.y}` : '';
    const dateShort = pDate ? `${pDate.dd}.${pDate.mm}.${pDate.y}` : '';
    const evTime = iso => {
      const p = parts(iso);
      return p ? `${p.h}:${p.mi} — ${p.weekday}, ${p.dd}/${p.mm}/${p.y}` : '';
    };

    const heroImg = ctx.img('hero', 0);
    const coupleImg = ctx.img('couple', 1) || ctx.img('portrait', 2) || heroImg;
    const portraitImg = ctx.img('portrait', 2) || ctx.img('groom', 0) || heroImg;
    const bandImg = ctx.img('band', 3) || ctx.img('bride', 1) || heroImg;
    const thanksImg = ctx.img('thanks', Math.max(0, ctx.album.length - 1)) || heroImg;

    const cover = html`
      <div class="door l"><i class="door-frame" aria-hidden="true"></i></div>
      <div class="door r"><i class="door-frame" aria-hidden="true"></i></div>
      <div class="cover-in">
        <div class="sh-lantern a" aria-hidden="true">
          <span class="l-cord"></span>
          <span class="l-tier1"></span>
          <span class="l-tier2"></span>
          <span class="l-tassel"></span>
        </div>
        <div class="sh-lantern b" aria-hidden="true">
          <span class="l-cord"></span>
          <span class="l-tier1"></span>
          <span class="l-tier2"></span>
          <span class="l-tassel"></span>
        </div>
        <p class="c-top">Thiệp mời cưới</p>
        <div class="seal"><span class="hy-glyph">囍</span></div>
        <h1 class="c-names">
          <span class="c-n1">${n.first}</span>
          <span class="c-amp" aria-hidden="true">&amp;</span>
          <span class="c-n2">${n.second}</span>
        </h1>
        ${dateDots ? html`<p class="c-date">${dateDots}</p>` : ''}
        <p class="c-guest">Trân trọng kính mời <b>${guest}</b></p>
        <button class="btn gold" type="button" data-open>Mở thiệp</button>
      </div>`;

    // Vùng 2: Sân Song Gia (Gia đình hai họ đối diện qua khoảng sân ngà + Lời mời + Chân dung uyên ương + Câu chuyện tùy chọn)
    const families = Array.isArray(d.families) ? d.families.filter(Boolean) : [];
    const storyItems = normalizeStory(d.story);
    const showStory = has('story') && storyItems.length > 0;
    const storyMarkup = showStory ? html`
      <aside class="story-plaque sh-plaque-reveal">
        <h3>Chuyện chúng tôi</h3>
        ${storyItems.length === 1 && !storyItems[0].year && !storyItems[0].title
          ? html`<p>${br(storyItems[0].text)}</p>`
          : html`<ol class="sh-story-list">
              ${storyItems.map(item => html`
                <li class="sh-story-item ${item.year ? '' : 'no-year'}">
                  ${item.year ? html`<span class="sh-story-year">${item.year}</span>` : ''}
                  <div class="sh-story-body">
                    ${item.title ? html`<h4>${item.title}</h4>` : ''}
                    ${item.text ? html`<p>${br(item.text)}</p>` : ''}
                  </div>
                </li>`)}
            </ol>`}
      </aside>` : '';
    const showSongGia = has('invite') || has('couple') || showStory;
    const songGiaSection = showSongGia ? html`
      <section class="courtyard-sec paper courtyard-songgia">
        ${has('invite') ? html`
          <div class="courtyard-wrap">
            ${families.length ? html`
              <div class="families ${families.length === 1 ? 'single' : ''}">
                ${families.map((f, i) => html`
                  <article class="family-col ${i === 0 ? 'left-wing' : 'right-wing'} sh-plaque-reveal">
                    <h3>${f.side}</h3>
                    ${f.father ? html`<p>Ông <b>${f.father}</b></p>` : ''}
                    ${f.mother ? html`<p>Bà <b>${f.mother}</b></p>` : ''}
                    ${f.address ? html`<small>${br(f.address)}</small>` : ''}
                  </article>
                  ${i === 0 && families.length > 1 ? html`<div class="courtyard-spine" aria-hidden="true"><span>囍</span></div>` : ''}
                `)}
              </div>` : ''}

            <div class="proclamation-grid">
              <div class="proclamation-copy sh-plaque-reveal">
                <p class="lead">${t.invite}</p>
                <div class="couple-lockup">
                  <span class="lockup-a shine dark">${n.first}</span>
                  <span class="lockup-amp" aria-hidden="true">&amp;</span>
                  <span class="lockup-b shine dark">${n.second}</span>
                </div>
                <p class="body">${br(t.presence)}</p>
                ${storyMarkup}
              </div>
              ${coupleImg ? html`
                <figure class="scroll-frame sh-plaque-reveal">
                  <div class="scroll-rod top" aria-hidden="true"></div>
                  <div class="scroll-canvas"><img data-zoom src="${coupleImg}" alt="${n.pair}" loading="lazy"></div>
                  <div class="scroll-rod bottom" aria-hidden="true"></div>
                </figure>` : ''}
            </div>
          </div>` : (storyMarkup ? html`
          <div class="courtyard-wrap courtyard-story-only">
            ${storyMarkup}
          </div>` : '')}

        ${has('couple') ? html`
          <div class="lacquer-pavilion">
            <div class="courtyard-wrap duo-grid">
              ${portraitImg ? html`
                <figure class="scroll-frame tall-arch sh-plaque-reveal">
                  <div class="scroll-rod top" aria-hidden="true"></div>
                  <div class="scroll-canvas"><img data-zoom src="${portraitImg}" alt="${n.pair}" loading="lazy"></div>
                  <div class="scroll-rod bottom" aria-hidden="true"></div>
                </figure>` : ''}
              <div class="duo-content sh-plaque-reveal">
                <h2 class="courtyard-title gold">Cô dâu &amp; Chú rể</h2>
                <div class="duo">
                  <div class="duo-person">
                    <span class="duo-role">Chú rể</span>
                    <b class="shine">${n.groom}</b>
                    ${d.groom?.bio ? html`<p class="duo-bio">${d.groom.bio}</p>` : ''}
                  </div>
                  <span class="hy-mini" aria-hidden="true">囍</span>
                  <div class="duo-person">
                    <span class="duo-role">Cô dâu</span>
                    <b class="shine">${n.bride}</b>
                    ${d.bride?.bio ? html`<p class="duo-bio">${d.bride.bio}</p>` : ''}
                  </div>
                </div>
                ${t.quote ? html`<blockquote class="quote">${br(t.quote)}</blockquote>` : ''}
              </div>
            </div>
          </div>` : ''}
      </section>` : '';

    // Vùng 3: Sân Nghi Lễ & Bản Đồ (Bài vị gỗ lịch lễ + Đếm ngược khảm vàng | Bản đồ & Trướng ảnh đôi)
    const events = Array.isArray(d.events) ? d.events.filter(Boolean) : [];
    const showCeremony = (has('events') && events.length) || has('countdown') || has('map');
    const ceremonySection = showCeremony ? html`
      <section class="courtyard-sec paper alt courtyard-ceremony">
        <div class="courtyard-wrap ceremony-grid">
          ${(has('events') && events.length) || has('countdown') ? html`
            <div class="ceremony-left">
              ${has('events') && events.length ? html`
                <div class="events-block">
                  <h2 class="courtyard-title dark">Nghi lễ &amp; Tiệc cưới</h2>
                  <div class="plaque-list">
                    ${events.map(e => {
                      const p = parts(e.date);
                      return html`
                        <article class="event ${e.main ? 'main' : ''} sh-plaque-reveal">
                          <div class="ev-date">
                            <b>${p ? p.dd : '--'}</b>
                            <span>${p ? `Tháng ${p.mo}` : 'Ngày lễ'}</span>
                          </div>
                          <div class="ev-info">
                            <h3>${e.title}</h3>
                            ${p ? html`<p class="time">${evTime(e.date)}</p>` : ''}
                            ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                            <p class="venue">${e.venue}${e.address ? html`<br><span class="ev-addr">${e.address}</span>` : ''}</p>
                          </div>
                        </article>`;
                    })}
                  </div>
                </div>` : ''}

              ${has('countdown') ? html`
                <div class="countdown-tablet sh-plaque-reveal">
                  <h2 class="courtyard-title gold sub">Cùng đếm ngược</h2>
                  <div class="sh-tally">${W.countdown()}</div>
                  ${W.calendar()}
                  <a class="btn gold" href="${W.gcalUrl()}" target="_blank" rel="noopener">Thêm vào Google Calendar</a>
                </div>` : ''}
            </div>` : ''}

          ${(coupleImg || has('map')) ? html`
            <div class="ceremony-right">
              ${coupleImg ? html`
                <figure class="scroll-frame ceremony-scroll sh-plaque-reveal">
                  <div class="scroll-rod top" aria-hidden="true"></div>
                  <div class="scroll-canvas"><img data-zoom src="${coupleImg}" alt="${n.pair}" loading="lazy"></div>
                  <div class="scroll-rod bottom" aria-hidden="true"></div>
                </figure>` : ''}
              ${has('map') ? html`
                <div class="map-pavilion sh-plaque-reveal">
                  <h2 class="courtyard-title dark">Địa điểm</h2>
                  ${W.map({ btn: 'btn red-btn' })}
                </div>` : ''}
            </div>` : ''}
        </div>
      </section>` : '';

    // Vùng 4: Triển Lãm Trướng Ảnh (bố cục trướng ảnh bất đối xứng)
    const albumImgs = [...ctx.album];
    if (has('band') && bandImg && !albumImgs.includes(bandImg)) albumImgs.unshift(bandImg);
    const showGallery = (has('album') || has('band')) && albumImgs.length > 0;
    const gallerySection = showGallery ? html`
      <section class="courtyard-sec lacquer-band courtyard-gallery">
        <div class="courtyard-wrap">
          <div class="gallery-head">
            <h2 class="courtyard-title gold">Trướng ảnh kỷ niệm</h2>
            <p class="gallery-note">Chạm vào từng bức trướng để xem ảnh cỡ lớn</p>
          </div>
          <div class="sh-scrolls count-${Math.min(albumImgs.length, 6)}">
            ${albumImgs.map((src, i) => html`
              <figure class="hang-scroll s-${i % 6} sh-plaque-reveal">
                <div class="scroll-rod top" aria-hidden="true"></div>
                <div class="scroll-canvas">
                  <img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">
                </div>
                ${d.images?.captions?.[i] ? html`<figcaption>${d.images.captions[i]}</figcaption>` : ''}
                <div class="scroll-rod bottom" aria-hidden="true"></div>
              </figure>`)}
          </div>
        </div>
      </section>` : '';

    // Vùng 5: Sảnh Tiếp Đón (RSVP khảm sơn mài + Sổ lưu bút lụa ngà + Hộp quà son vàng)
    const showHospitality = has('rsvp') || has('guestbook') || has('gift');
    const hospitalitySection = showHospitality ? html`
      <section class="courtyard-sec paper courtyard-hospitality">
        <div class="courtyard-wrap hospitality-grid ${!has('rsvp') || (!has('guestbook') && !has('gift')) ? 'single-col' : ''}">
          ${has('rsvp') ? html`
            <div class="lacquer-rsvp sh-plaque-reveal">
              <h2 class="courtyard-title gold">Xác nhận tham dự</h2>
              <p class="body">Quý khách sẽ đến chung vui cùng chúng tôi chứ?</p>
              ${W.rsvp({ btn: 'btn gold' })}
            </div>` : ''}

          ${has('guestbook') || has('gift') ? html`
            <div class="hospitality-side">
              ${has('guestbook') ? html`
                <div class="silk-guestbook sh-plaque-reveal">
                  <h2 class="courtyard-title dark">Sổ lưu bút</h2>
                  ${W.guestbook({ btn: 'btn red-btn', cls: 'light' })}
                </div>` : ''}

              ${has('gift') ? html`
                <div class="lacquer-gift sh-plaque-reveal">
                  <h2 class="courtyard-title dark">Hộp quà mừng</h2>
                  ${W.gift({ btn: 'btn red-btn' })}
                </div>` : ''}
            </div>` : ''}
        </div>
      </section>` : '';

    // Vùng 6: Lời Kết Trang Trọng (tiếng Việt chuẩn)
    const thanksSection = has('thanks') ? html`
      <section class="thanks">
        ${thanksImg ? html`<img src="${thanksImg}" alt="${n.pair}" loading="lazy">` : ''}
        <div class="thanks-text">
          <p class="thanks-hy" aria-hidden="true">囍</p>
          <h2 class="shine">Trân trọng cảm ơn</h2>
          <p>${br(t.thanks)}</p>
          <p class="sign">${n.pair}</p>
        </div>
      </section>` : '';

    const main = html`
      <div class="sh-courtyard">
        <div class="sh-side-lanterns" aria-hidden="true">
          <div class="sh-side-lantern left">
            <span class="l-cord"></span>
            <span class="l-tier1"></span>
            <span class="l-tier2"></span>
            <span class="l-tassel"></span>
          </div>
          <div class="sh-side-lantern right">
            <span class="l-cord"></span>
            <span class="l-tier1"></span>
            <span class="l-tier2"></span>
            <span class="l-tassel"></span>
          </div>
        </div>

        <header class="hero">
          <div class="hero-grid">
            <div class="hero-plaque">
              <div class="sh-hy-wrap">
                <span class="sh-glow" aria-hidden="true"></span>
                <p class="sh-hy shine">囍</p>
              </div>
              <p class="kicker">${t.kicker}</p>
              <h1 class="names">
                <span class="write">${n.first}</span>
                <span class="amp" aria-hidden="true">&amp;</span>
                <span class="write w2">${n.second}</span>
              </h1>
              <div class="hero-meta">
                ${dateLong ? html`<p class="hero-date">${dateLong}</p>` : ''}
                ${d.city ? html`<p class="hero-city">${d.city}</p>` : ''}
              </div>
              <div class="scroll-cue" aria-hidden="true"><span>Cuộn xuống sân lễ</span><i></i></div>
            </div>

            ${heroImg ? html`
              <figure class="hero-scroll">
                <div class="scroll-rod top" aria-hidden="true"></div>
                <div class="hero-photo"><img data-zoom src="${heroImg}" alt="${n.pair}"></div>
                <div class="scroll-rod bottom" aria-hidden="true"></div>
              </figure>` : ''}
          </div>
        </header>

        ${songGiaSection}
        ${ceremonySection}
        ${gallerySection}
        ${hospitalitySection}
        ${thanksSection}

        <footer>
          <span class="f-hy">囍</span>
          ${dateShort ? html`<span>${dateShort}</span>` : ''}
          <span>Trăm năm hạnh phúc</span>
        </footer>
      </div>`;

    return { cover, main };
  },

  mounted(ctx, { main }) {
    const plaques = $$('.sh-plaque-reveal', main);
    if (reduced || typeof IntersectionObserver === 'undefined') {
      plaques.forEach(el => el.classList.add('sh-lit'));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('sh-lit');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    plaques.forEach(el => io.observe(el));

    // Thị sai 2 tầng đèn lồng sân đình khi cuộn trang
    const lanterns = $$('.sh-side-lantern', main);
    if (lanterns.length) {
      let ticking = false;
      const updateLanterns = () => {
        ticking = false;
        const y = window.scrollY || 0;
        const sway = Math.sin(y * 0.0045) * 2.2;
        lanterns.forEach((l, idx) => {
          const dir = idx === 0 ? 1 : -1;
          const t1 = $('.l-tier1', l);
          const t2 = $('.l-tier2', l);
          const ts = $('.l-tassel', l);
          const base = Math.min(y * 0.06, 90);
          l.style.transform = `translate3d(0, ${base}px, 0) rotate(${sway * dir}deg)`;
          if (t1) t1.style.transform = `translate3d(0, ${Math.min(y * 0.025, 36)}px, 0)`;
          if (t2) t2.style.transform = `translate3d(0, ${Math.min(y * 0.05, 64)}px, 0) rotate(${-sway * 0.7 * dir}deg)`;
          if (ts) ts.style.transform = `translate3d(0, ${Math.min(y * 0.065, 76)}px, 0) rotate(${-sway * 1.1 * dir}deg)`;
        });
      };
      addEventListener('scroll', () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateLanterns);
        }
      }, { passive: true });
      updateLanterns();
    }
  },

  opened(ctx, instant) {
    if (instant || reduced) return;
    const hero = $('.hero');
    if (hero) {
      hero.classList.add('sh-illuminating');
      setTimeout(() => hero.classList.remove('sh-illuminating'), 2600);
    }
  },
};
