// Mẫu "Thư Tay": thiệp là một lá thư tay. Bóc dấu sáp để mở phong bì, thư trượt ra,
// lời mời hiện từng chữ như đang viết, cào lớp nhũ để lộ ngày cưới, ảnh là những con tem
// và tấm polaroid kéo ném được, sự kiện là những tấm vé xé cuống.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, parts } from '../../core/util.js';

const initial = s => (s || '').trim().split(/\s+/).pop()?.[0] || '';

export default {
  // Bảng màu có sẵn: cặp đôi chọn trong Studio; vars ghi đè biến màu của mẫu (xem theme.css)
  palettes: [{"id":"sap-do","name":"Sáp đỏ","swatch":["#8e1b2c","#b08d57"]},{"id":"xanh-reu","name":"Xanh rêu","swatch":["#3f6b4f","#b08d57"],"vars":{"--wax":"#3f6b4f","--wax-hi":"#5e9374"}},{"id":"oai-huong","name":"Tím oải hương","swatch":["#6a4c93","#b08d57"],"vars":{"--wax":"#6a4c93","--wax-hi":"#8f72b8"}},{"id":"dai-duong","name":"Xanh đại dương","swatch":["#1f5f8b","#b08d57"],"vars":{"--wax":"#1f5f8b","--wax-hi":"#3f86b8"}}],
  id: 'thu-tay',
  name: 'Thư Tay',
  fonts: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Ephesis&family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  coverMs: 2900,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['petals', 'bokeh'],
      colors: { petals: ['#d8a7a7', '#c98b8b', '#e8c9c0', '#b5838d', '#efd9ce'], bokeh: ['#fff4e0', '#f3d9c8'], confetti: ['#8e1b2c', '#c98b8b', '#e8c9c0', '#1f2a44', '#d4af37'], fireworks: ['#d4af37', '#f3d9c8', '#c98b8b', '#ffffff'] },
      density: .8,
    },
    sections: ['letter', 'date', 'couple', 'families', 'events', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      greeting: 'Thân gửi',
      letter: 'Sau những tháng năm thương nhau, chúng mình đã quyết định cùng nhau viết tiếp câu chuyện ở một chương mới. Chúng mình viết lá thư này để mời bạn đến chung vui, vì ngày hạnh phúc nhất sẽ trọn vẹn hơn khi có bạn ở đó.',
      dateTitle: 'Ngày chúng mình về chung một nhà',
      scratch: 'Cào lớp nhũ để xem ngày',
      coupleTitle: 'Hai con tem, một hành trình',
      eventsTitle: 'Vé mời',
      albumTitle: 'Những khoảnh khắc',
      albumHint: 'Kéo và ném ảnh để xem tấm tiếp theo · chạm để phóng to',
      rsvpTitle: 'Thư hồi âm',
      rsvpLead: 'Bạn sẽ đến chứ? Hồi âm giúp chúng mình chuẩn bị chu đáo hơn nhé.',
      guestbookTitle: 'Gửi lại đôi dòng',
      giftTitle: 'Phong bì mừng',
      thanks: 'Cảm ơn bạn đã đọc đến dòng cuối cùng. Hẹn gặp bạn trong ngày vui của chúng mình.',
      closing: 'Thương mến,',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts, has = s => ctx.has(s);
    const guest = ctx.guest || 'bạn thân mến';
    const mono = `${initial(n.first)}&${initial(n.second)}`;
    const dp = parts(d.date);

    const seal = html`<span class="mono">${initial(n.first)}<i>&amp;</i>${initial(n.second)}</span>`;

    const cover = html`
      <div class="desk">
        <p class="to" data-rv="blur">Gửi <b>${guest}</b></p>
        <div class="env">
          <div class="env-back"></div>
          <div class="env-letter"><p>${t.greeting} ${guest},</p><i></i><i></i><i></i></div>
          <div class="env-front"></div>
          <div class="env-flap"></div>
          <button class="seal" data-open aria-label="Bóc dấu sáp để mở thư">
            <span class="half l">${seal}</span><span class="half r">${seal}</span><span class="ring"></span>
          </button>
          <div class="stamp mini"><img src="${ctx.img('hero', 0)}" alt=""></div>
        </div>
        <p class="hint">Chạm vào dấu sáp để mở thư</p>
      </div>`;

    const stamp = (src, label, cls = '') => html`
      <figure class="stamp ${cls}" data-tilt="10"><img data-zoom src="${src}" alt="${label}" loading="lazy"><figcaption>${label}</figcaption></figure>`;

    const sections = {
      letter: () => html`
        <section class="sheet letter">
          <div class="postmark" aria-hidden="true">
            <svg viewBox="0 0 120 120"><defs><path id="pm" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"/></defs>
              <circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="34"/>
              <text><textPath href="#pm">${fmt.short(d.date)} · ${d.city || 'Việt Nam'} · </textPath></text>
              <text x="60" y="66" text-anchor="middle" class="pm-mono">${mono}</text></svg>
          </div>
          ${stamp(ctx.img('hero', 0), n.pair, 'hero-stamp')}
          <p class="greet" data-rv="blur">${t.greeting} <b>${guest}</b>,</p>
          <p class="body" data-type="22">${t.letter}</p>
          <h1 class="names" data-rv="up">
            <span>${n.first}</span><em>&amp;</em><span>${n.second}</span>
          </h1>
          <p class="kicker" data-rv="up">trân trọng mời bạn tới dự lễ thành hôn</p>
        </section>`,

      date: () => html`
        <section class="sheet date">
          <h2 data-rv="up">${t.dateTitle}</h2>
          <div data-rv="zoom">
            ${W.scratch(html`<span class="wd">${dp.weekday}</span><b>${dp.dd}<i>/</i>${dp.mm}</b><span class="yr">${dp.y} · ${fmt.time(d.date)}</span>`,
              { label: t.scratch, foil: ['#b08d57', '#f3e3c3', '#c9a46a', '#efe0c4', '#a37d45'], ink: '#4a3520' })}
          </div>
          <div class="cd-wrap" data-rv="up">${W.countdown()}</div>
          <a class="btn ghost" href="${W.gcalUrl()}" target="_blank" rel="noopener" data-rv="up">Lưu vào lịch</a>
        </section>`,

      couple: () => html`
        <section class="sheet couple">
          <h2 data-rv="up">${t.coupleTitle}</h2>
          <div class="stamps">
            <div data-rv="drop">${stamp(ctx.img('groom', 3), n.groom)}${d.groom.bio ? html`<p class="bio">${d.groom.bio}</p>` : ''}</div>
            <span class="plus" data-rv="zoom">&amp;</span>
            <div data-rv="drop" style="transition-delay:.15s">${stamp(ctx.img('bride', 4), n.bride)}${d.bride.bio ? html`<p class="bio">${d.bride.bio}</p>` : ''}</div>
          </div>
        </section>`,

      families: () => (d.families || []).length ? html`
        <section class="sheet families">
          ${(d.families || []).map((f, i) => html`
            <div data-rv="${i ? 'right' : 'left'}">
              <h3>${f.side}</h3>
              ${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}
              <small>${br(f.address)}</small>
            </div>`)}
        </section>` : '',

      events: () => html`
        <section class="sheet events">
          <h2 data-rv="up">${t.eventsTitle}</h2>
          ${(d.events || []).map((e, i) => { const p = parts(e.date); return html`
            <article class="ticket ${e.main ? 'main' : ''}" data-rv="${i % 2 ? 'right' : 'left'}">
              <div class="t-main">
                <small>${e.main ? 'Sự kiện chính' : 'Nghi lễ'}</small>
                <h3>${e.title}</h3>
                <p>${e.venue}</p>
                <p class="addr">${e.address}</p>
                ${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}
              </div>
              <div class="t-stub">
                <span>${p.weekday}</span><b>${p.dd}</b><span>tháng ${p.mo}</span><em>${fmt.time(e.date)}</em>
              </div>
            </article>`; })}
        </section>`,

      album: () => ctx.album.length ? html`
        <section class="sheet album">
          <h2 data-rv="up">${t.albumTitle}</h2>
          <div data-rv="zoom">${W.polaroids({ captions: d.images?.captions || [] })}</div>
          <p class="hint">${t.albumHint}</p>
        </section>` : '',

      map: () => html`
        <section class="sheet map-sec">
          <h2 data-rv="up">Đường đến</h2>
          <div data-rv="up">${W.map({ btn: 'btn' })}</div>
        </section>`,

      rsvp: () => html`
        <section class="sheet reply">
          <div class="reply-card" data-rv="flip">
            <h2>${t.rsvpTitle}</h2>
            <p class="lead">${t.rsvpLead}</p>
            ${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến', no: 'Tiếc quá, mình bận' })}
          </div>
        </section>`,

      guestbook: () => html`
        <section class="sheet book">
          <h2 data-rv="up">${t.guestbookTitle}</h2>
          <div data-rv="up">${W.guestbook({ btn: 'btn', placeholder: 'Viết đôi dòng gửi tới hai bạn...' })}</div>
        </section>`,

      gift: () => html`
        <section class="sheet gift">
          <h2 data-rv="up">${t.giftTitle}</h2>
          ${W.gift({ btn: 'btn ghost', hint: 'Chạm để mở phong bì', box: html`<i class="g-back"></i><i class="g-card">❤</i><i class="g-front"></i><i class="g-flap"></i>` })}
        </section>`,

      thanks: () => html`
        <section class="sheet thanks" data-fireworks>
          <figure class="torn" data-rv="zoom"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></figure>
          <p class="body" data-rv="up">${t.thanks}</p>
          <p class="closing" data-rv="up">${t.closing}</p>
          <p class="sign"><span>${n.first}</span> &amp; <span>${n.second}</span></p>
        </section>`,
    };

    const main = html`
      ${(d.sections || []).filter(has).map(s => sections[s]?.() || '')}
      <footer><span>${mono}</span> · ${fmt.short(d.date)}</footer>`;

    return { cover, main };
  },

  mounted(ctx, { main }) {
    // Chữ ký tự viết khi cuộn tới
    const sign = main.querySelector('.sign');
    if (sign) new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { sign.classList.add('in'); io.disconnect(); } }, { threshold: .6 }).observe(sign);
    // Bóc dấu sáp thành công: rung nhẹ trên điện thoại
    document.querySelector('.seal')?.addEventListener('click', () => navigator.vibrate?.(30));
  },

  opened(ctx, instant) {
    if (instant) return;
    const { fx } = ctx;
    setTimeout(() => fx.burst(fx.width / 2, fx.height * .45, 120, { hearts: true }), 1300);
  },
};
