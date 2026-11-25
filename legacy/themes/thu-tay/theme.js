// Mẫu "Thư Tay": Bàn viết thư hoài niệm (Tactile Writing Desk).
// Động từ chuyển động: Unseal, Scratch & Toss (Bóc sáp, Cào nhũ & Ném ảnh).
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, parts, reduced } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';

export default {
  palettes: [
    { id: 'sap-do', name: 'Sáp đỏ', swatch: ['#8e1b2c', '#b08d57'] },
    { id: 'xanh-reu', name: 'Xanh rêu', swatch: ['#3f6b4f', '#b08d57'], vars: { '--wax': '#3f6b4f', '--wax-hi': '#5e9374' } },
    { id: 'oai-huong', name: 'Tím oải hương', swatch: ['#6a4c93', '#b08d57'], vars: { '--wax': '#6a4c93', '--wax-hi': '#8f72b8' } },
    { id: 'dai-duong', name: 'Xanh đại dương', swatch: ['#1f5f8b', '#b08d57'], vars: { '--wax': '#1f5f8b', '--wax-hi': '#3f86b8' } },
  ],
  id: 'thu-tay',
  name: 'Thư Tay',
  layout: 'wide',
  bodyClass: 'rv-custom',
  fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Ephesis&family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  coverMs: 2400,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['petals', 'bokeh'],
      colors: {
        petals: ['#d8a7a7', '#c98b8b', '#e8c9c0', '#b5838d', '#efd9ce'],
        bokeh: ['#fff4e0', '#f3d9c8'],
      },
      density: .75,
    },
    sections: ['letter', 'date', 'couple', 'families', 'story', 'events', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      greeting: 'Thân gửi',
      letter: 'Sau những tháng năm thương nhau, chúng mình đã quyết định cùng nhau viết tiếp câu chuyện ở một chương mới. Chúng mình viết lá thư này để mời bạn đến chung vui, vì ngày hạnh phúc nhất sẽ trọn vẹn hơn khi có bạn ở đó.',
      dateTitle: 'Cào nhũ xem ngày hẹn',
      scratch: 'Cào nhẹ lớp nhũ đồng',
      coupleTitle: 'Hai con tem, một hành trình',
      storyTitle: 'Đôi dòng kỷ niệm',
      eventsTitle: 'Vé mời nghi lễ',
      albumTitle: 'Bàn ảnh kỷ niệm',
      albumHint: 'Kéo ném ảnh sang bên để lật tấm sau, chạm nhẹ để phóng to',
      rsvpTitle: 'Thư hồi âm',
      rsvpLead: 'Bạn sẽ đến chung vui chứ? Hồi âm giúp chúng mình chuẩn bị chu đáo hơn nhé.',
      guestbookTitle: 'Gửi lại đôi dòng',
      giftTitle: 'Phong bì mừng cưới',
      thanks: 'Cảm ơn bạn đã đọc đến dòng cuối cùng. Hẹn gặp bạn trong ngày vui của chúng mình.',
      closing: 'Thương mến,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx;
    const t = d.texts || {};
    const has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const mono = `${initial(n.first)}&${initial(n.second)}`;
    const dp = parts(d.date) || { weekday: '', dd: '', mm: '', y: '', mo: '' };
    const safeImg = (slot, i = 0) => ctx.img(slot, i) || ctx.img('hero', 0) || '';
    const cityLabel = d.city ? d.city : 'Việt Nam';
    const storyText = typeof d.story === 'string'
      ? d.story.trim()
      : Array.isArray(d.story)
        ? d.story.map(x => (typeof x === 'string' ? x : x?.text || x?.body || '')).filter(Boolean).join('\n\n')
        : (d.story?.text || d.story?.body || '').trim();

    const seal = html`<span class="mono">${initial(n.first)}<i>&amp;</i>${initial(n.second)}</span>`;

    const cover = html`
      <div class="desk">
        <p class="to">Gửi <b>${guest}</b></p>
        <div class="env">
          <div class="env-back"></div>
          <div class="env-letter"><p>${t.greeting} ${guest},</p><i></i><i></i><i></i></div>
          <div class="env-front"></div>
          <div class="env-flap"></div>
          <button class="seal" data-open type="button" aria-label="Bóc dấu sáp để mở thư">
            <span class="half l">${seal}</span><span class="half r">${seal}</span><span class="ring"></span>
          </button>
          ${safeImg('hero', 0) ? html`<div class="stamp mini"><img src="${safeImg('hero', 0)}" alt=""></div>` : ''}
        </div>
        <p class="hint">Chạm vào dấu sáp để mở thư</p>
      </div>`;

    const stamp = (src, label, cls = '') => src ? html`
      <figure class="stamp ${cls}" data-tilt="8">
        <img data-zoom src="${src}" alt="${label}" loading="lazy">
        <figcaption>${label}</figcaption>
      </figure>` : '';

    const heroSrc = safeImg('hero', 0);
    const groomSrc = safeImg('groom', 3);
    const brideSrc = safeImg('bride', 4);
    const thanksSrc = safeImg('thanks', 5);

    const showZone1Left = has('letter') || has('hero');
    const showZone1Right = Boolean(heroSrc) || has('date');

    const zone1 = (showZone1Left || showZone1Right) ? html`
      <section id="tt-thu" class="desk-zone zone-top" aria-label="Lá thư mời và ngày cưới">
        ${showZone1Left ? html`
          <article class="sheet letter-sheet">
            <div class="postmark" aria-hidden="true">
              <svg viewBox="0 0 140 140">
                <defs><path id="pm-arc" d="M70,70 m-50,0 a50,50 0 1,1 100,0 a50,50 0 1,1 -100,0"/></defs>
                <circle cx="70" cy="70" r="64"/><circle cx="70" cy="70" r="38"/>
                <text><textPath href="#pm-arc">${fmt.short(d.date)} ${cityLabel} </textPath></text>
                <text x="70" y="76" text-anchor="middle" class="pm-mono">${mono}</text>
              </svg>
            </div>
            <p class="greet">${t.greeting} <b>${guest}</b>,</p>
            <p class="body">${br(t.letter)}</p>
            <h1 class="names">
              <span class="n1">${n.first}</span>
              <span class="n-join"><em class="amp">&amp;</em><span class="n2">${n.second}</span></span>
            </h1>
            <p class="letter-invite">Trân trọng kính mời bạn tới dự lễ thành hôn</p>
            <div class="letter-sig" data-ink-draw>
              <svg class="ink-sig" viewBox="0 0 280 56" aria-hidden="true">
                <path class="ink-path" pathLength="100" d="M14 42 C 42 14, 74 12, 92 34 C 108 52, 134 10, 166 26 C 194 40, 224 18, 266 24" />
                <path class="ink-path ink-sub" pathLength="100" d="M48 48 Q 140 36 248 44" />
              </svg>
              <span class="sig-mono">${mono}</span>
            </div>
          </article>` : ''}

        ${showZone1Right ? html`
          <div class="desk-right-top">
            ${heroSrc ? html`
              <figure class="heirloom-frame">
                <span class="corner tl" aria-hidden="true"></span>
                <span class="corner tr" aria-hidden="true"></span>
                <span class="corner bl" aria-hidden="true"></span>
                <span class="corner br" aria-hidden="true"></span>
                <img data-zoom src="${heroSrc}" alt="Ảnh cưới ${n.pair}">
                <figcaption>
                  <span class="hf-names">${n.pair}</span>
                  <span class="hf-meta">${fmt.short(d.date)}</span>
                </figcaption>
              </figure>` : ''}
            ${has('date') ? html`
              <div class="sheet date-card">
                <h2>${t.dateTitle}</h2>
                <div class="scratch-wrap">
                  ${W.scratch(
                    html`<span class="wd">${dp.weekday}</span><b>${dp.dd}<i>/</i>${dp.mm}</b><span class="yr"><span>${dp.y}</span><span>${fmt.time(d.date)}</span></span>`,
                    { label: t.scratch, foil: ['#b08d57', '#f3e3c3', '#c9a46a', '#efe0c4', '#a37d45'], ink: '#3b2814' }
                  )}
                </div>
                <div class="cd-wrap">${W.countdown()}</div>
                <div class="date-actions">
                  <a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener">Lưu vào lịch</a>
                </div>
              </div>` : ''}
          </div>` : ''}
      </section>` : '';

    const hasFamilies = has('families') && (d.families || []).length > 0;
    const hasStory = has('story') && Boolean(storyText);
    const hasCouple = has('couple');
    const hasAlbum = has('album') && (ctx.album || []).length > 0;
    const hasEvents = has('events') && (d.events || []).length > 0;
    const showZone2Left = hasCouple || hasFamilies || hasStory;
    const showZone2Right = hasAlbum || hasEvents;

    const zone2 = (showZone2Left || showZone2Right) ? html`
      <section id="tt-ban-anh" class="desk-zone zone-mid" aria-label="Chân dung, bàn ảnh và vé mời">
        ${showZone2Left ? html`
          <div class="desk-col-left">
            ${hasCouple ? html`
              <article class="sheet couple-folio">
                <h2>${t.coupleTitle}</h2>
                <div class="stamps">
                  <div class="stamp-unit">
                    ${stamp(groomSrc, n.groom)}
                    ${d.groom?.bio ? html`<p class="bio">${d.groom.bio}</p>` : ''}
                  </div>
                  <span class="plus" aria-hidden="true">&amp;</span>
                  <div class="stamp-unit">
                    ${stamp(brideSrc, n.bride)}
                    ${d.bride?.bio ? html`<p class="bio">${d.bride.bio}</p>` : ''}
                  </div>
                </div>
              </article>` : ''}

            ${hasStory ? html`
              <article class="sheet story-postcard">
                <h2>${t.storyTitle}</h2>
                <p class="story-body">${br(storyText)}</p>
              </article>` : ''}

            ${hasFamilies ? html`
              <article class="sheet families-ledger">
                ${(d.families || []).map(f => html`
                  <div class="fam-col">
                    <h3>${f.side || ''}</h3>
                    ${f.father ? html`<p>Ông ${f.father}</p>` : ''}
                    ${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
                    ${f.address ? html`<small>${br(f.address)}</small>` : ''}
                  </div>`)}
              </article>` : ''}
          </div>` : ''}

        ${showZone2Right ? html`
          <div class="desk-col-right">
            ${hasAlbum ? html`
              <article class="polaroid-mat">
                <div class="mat-head">
                  <h2>${t.albumTitle}</h2>
                  <p class="hint">${t.albumHint}</p>
                </div>
                ${W.polaroids({ captions: d.images?.captions || [] })}
              </article>` : ''}

            ${hasEvents ? html`
              <article class="sheet tickets-deck">
                <h2>${t.eventsTitle}</h2>
                ${(d.events || []).map(e => {
                  const ep = parts(e.date) || { weekday: '', dd: '', mo: '' };
                  return html`
                    <div class="ticket ${e.main ? 'main' : ''}">
                      <div class="t-main">
                        <small>${e.main ? 'Sự kiện chính' : 'Nghi lễ'}</small>
                        <h3>${e.title || ''}</h3>
                        ${e.venue ? html`<p>${e.venue}</p>` : ''}
                        ${e.address ? html`<p class="addr">${e.address}</p>` : ''}
                        ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
                      </div>
                      <div class="t-stub">
                        <span>${ep.weekday}</span>
                        <b>${ep.dd}</b>
                        <span>tháng ${ep.mo}</span>
                        <em>${fmt.time(e.date)}</em>
                      </div>
                    </div>`;
                })}
              </article>` : ''}
          </div>` : ''}
      </section>` : '';

    const hasMap = has('map') && (d.places || []).length > 0;
    const hasGift = has('gift') && (d.accounts || []).length > 0;
    const hasThanks = has('thanks');
    const hasRsvp = has('rsvp');
    const hasGuestbook = has('guestbook');
    const showZone3Left = hasMap || hasGift || hasThanks;
    const showZone3Right = hasRsvp || hasGuestbook;

    const zone3 = (showZone3Left || showZone3Right) ? html`
      <section id="tt-hoi-am" class="desk-zone zone-bottom" aria-label="Bản đồ, hồi âm và lời cảm ơn">
        ${showZone3Left ? html`
          <div class="desk-col-left">
            ${hasMap ? html`
              <article class="sheet map-folio">
                <h2>Đường đến</h2>
                ${W.map({ btn: 'btn' })}
              </article>` : ''}

            ${hasGift ? html`
              <article class="sheet gift-folio">
                <h2>${t.giftTitle}</h2>
                ${W.gift({
                  btn: 'btn ghost',
                  hint: 'Chạm để mở phong bì',
                  box: html`<i class="g-back"></i><i class="g-card">❤</i><i class="g-front"></i><i class="g-flap"></i>`,
                })}
              </article>` : ''}

            ${hasThanks ? html`
              <article class="sheet thanks-folio">
                ${thanksSrc ? html`
                  <figure class="torn">
                    <img data-zoom src="${thanksSrc}" alt="${n.pair}" loading="lazy">
                  </figure>` : ''}
                <p class="body">${br(t.thanks)}</p>
                <p class="closing">${t.closing}</p>
                <div class="thanks-sig" data-ink-draw>
                  <p class="sign"><span>${n.first}</span> <em>&amp;</em> <span>${n.second}</span></p>
                  <svg class="ink-sig closing-flourish" viewBox="0 0 240 28" aria-hidden="true">
                    <path class="ink-path" pathLength="100" d="M16 18 C 72 6, 152 26, 224 10" />
                  </svg>
                </div>
              </article>` : ''}
          </div>` : ''}

        ${showZone3Right ? html`
          <div class="desk-col-right">
            ${hasRsvp ? html`
              <article class="reply">
                <div class="reply-card">
                  <div class="airmail-badge" aria-hidden="true">PAR AVION</div>
                  <h2>${t.rsvpTitle}</h2>
                  <p class="lead">${t.rsvpLead}</p>
                  ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}
                </div>
              </article>` : ''}

            ${hasGuestbook ? html`
              <article class="sheet book-folio">
                <h2>${t.guestbookTitle}</h2>
                ${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}
              </article>` : ''}
          </div>` : ''}
      </section>` : '';

    const main = html`
      <nav class="desk-nav" aria-label="Mục nhanh trên bàn thư">
        <a href="#tt-thu">Thư</a>
        <a href="#tt-ban-anh">Bàn ảnh</a>
        <a href="#tt-hoi-am">Hồi âm</a>
      </nav>
      <div class="desk-spread">
        ${zone1}
        ${zone2}
        ${zone3}
      </div>
      <footer>
        <span class="f-mono">${mono}</span>
        <span class="f-date">${fmt.short(d.date)}</span>
      </footer>`;

    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    const drawTargets = [...main.querySelectorAll('[data-ink-draw], .sign')];
    if (reduced || !('IntersectionObserver' in window)) {
      drawTargets.forEach(el => el.classList.add('in'));
    } else {
      let observed = false;
      ctx._startInkDraw = instant => {
        if (observed) return;
        observed = true;
        const start = () => {
          const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            });
          }, { threshold: .35 });
          drawTargets.forEach(el => io.observe(el));
        };
        if (instant) start();
        else setTimeout(start, 1200);
      };
    }

    cover.querySelector('.seal')?.addEventListener('click', () => navigator.vibrate?.(30));
  },

  opened(ctx, instant) {
    ctx._startInkDraw?.(instant);
  },
};
