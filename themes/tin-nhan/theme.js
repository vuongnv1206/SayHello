// Mẫu "Tin Nhắn": thiệp cưới là một cuộc trò chuyện. Bìa là màn hình khóa điện thoại có thông báo tin nhắn mới,
// chạm vào thông báo thì mở ra nhóm chat của cô dâu chú rể. Tin nhắn hiện lần lượt kèm dấu "đang soạn tin" khi cuộn tới:
// lời báo tin kèm ảnh, danh thiếp hai người, tin nhắn cũ theo năm kể chuyện tình, thẻ lịch hẹn cho từng lễ,
// tin ghim đếm ngược, ảnh đã gửi, chia sẻ vị trí, khách trả lời xác nhận và lời chúc như bong bóng chat của mình,
// bao lì xì chuyển khoản, cuối cùng là "Đã xem" và một nhãn dán trái tim.
// Ảnh dùng: images.hero, images.groom, images.bride, images.thanks, images.album[]
import { html, br, fmt, reduced, $, $$ } from '../../core/util.js';

const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = n => String(n).padStart(2, '0');

// Tiếng "ting" khi có tin nhắn, tự tạo bằng Web Audio (không dùng file âm thanh có bản quyền)
let audio;
function ting() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    const a = audio, t = a.currentTime;
    [[880, 0], [1320, .09]].forEach(([f, d]) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.16, t + d + .01); g.gain.exponentialRampToValueAtTime(.001, t + d + .35);
      o.connect(g).connect(a.destination); o.start(t + d); o.stop(t + d + .4);
    });
  } catch {}
}

export default {
  // Bảng màu có sẵn: cặp đôi chọn trong Studio; vars ghi đè biến màu của mẫu (xem theme.css)
  palettes: [{"id":"san-ho","name":"San hô","swatch":["#e0644f","#fbd9cd"]},{"id":"bac-ha","name":"Bạc hà","swatch":["#2f9d88","#cdeee6"],"vars":{"--coral":"#2f9d88","--coral-hi":"#47b8a1","--coral-soft":"#cdeee6","--blush":"#e1f5ef"}},{"id":"lavender","name":"Oải hương","swatch":["#7b61c9","#e3dcf7"],"vars":{"--coral":"#7b61c9","--coral-hi":"#9680dd","--coral-soft":"#e3dcf7","--blush":"#efeaff"}},{"id":"xanh-troi","name":"Xanh trời","swatch":["#3d7fe0","#d3e3fb"],"vars":{"--coral":"#3d7fe0","--coral-hi":"#5b97f0","--coral-soft":"#d3e3fb","--blush":"#e4eefc"}}],
  id: 'tin-nhan',
  name: 'Tin Nhắn',
  fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,400;1,9..144,600&family=Be+Vietnam+Pro:wght@400;500;600&display=swap',
  coverMs: 700,
  cheersButton: 'btn',
  defaults: {
    effects: {
      ambient: ['hearts'], density: .35,
      colors: { hearts: ['#f08a6c', '#f6b8a2', '#e0644f'], confetti: ['#e0644f', '#f6b8a2', '#ffd27a', '#7cc4b0'], fireworks: ['#e0644f', '#ffd27a', '#7cc4b0', '#ffffff'] },
    },
    sections: ['hero', 'couple', 'story', 'events', 'countdown', 'album', 'map', 'rsvp', 'guestbook', 'gift', 'thanks'],
    texts: {
      coverTitle: 'Bạn có một lời mời đám cưới 💌',
      coverHint: 'Chạm vào thông báo để đọc tin nhắn',
      heroLead: 'Có chuyện vui này chúng mình muốn kể với bạn trước tiên…',
      invite: 'Chúng mình cưới rồi! Mời bạn tới chung vui với hai đứa nhé.',
      coupleTitle: 'Danh thiếp',
      storyTitle: 'Tin nhắn cũ',
      eventsTitle: 'Lịch hẹn',
      countdownTitle: 'Tin nhắn đã ghim',
      albumTitle: 'Ảnh đã gửi',
      rsvpTitle: 'Bạn sẽ đến chứ?',
      rsvpLead: 'Trả lời giúp chúng mình để giữ chỗ cho bạn nhé.',
      guestbookTitle: 'Nhắn lời chúc',
      giftTitle: 'Lì xì mừng cưới',
      thanksTitle: 'Cảm ơn bạn',
      thanks: 'Cảm ơn bạn đã đọc hết tin nhắn của tụi mình. Hẹn gặp bạn ngoài đời trong ngày vui nhé!',
    },
  },

  render(ctx) {
    const { data: d, names: n, widgets: W } = ctx, t = d.texts;
    const guest = ctx.guest;
    const firstWho = d.order === 'bride-first' ? 'bride' : 'groom', secondWho = firstWho === 'groom' ? 'bride' : 'groom';
    const avatar = who => ctx.img(who, who === 'groom' ? 3 : 4);
    const time = fmt.time(d.date);
    // Một tin nhắn: who = 'groom' | 'bride' | 'me' (khách)
    const bub = (who, body, { cls = '', tail = true } = {}) => who === 'me'
      ? html`<div class="bub me ${cls}">${body}</div>`
      : html`<div class="row ${who}"><img class="av ${tail ? '' : 'ghost'}" src="${avatar(who)}" alt="" loading="lazy"><div class="bub ${cls}">${tail ? html`<small class="who">${d[who].short}</small>` : ''}${body}</div></div>`;
    const day = label => html`<p class="day"><span>${label}</span></p>`;
    const thread = (cls, inner) => html`<section class="thread ${cls}">${inner}</section>`;

    const now = new Date();
    const cover = html`
      <div class="lock" aria-hidden="true"><img src="${ctx.img('hero', 0)}" alt=""></div>
      <div class="clock">
        <b class="hm">${pad(now.getHours())}:${pad(now.getMinutes())}</b>
        <span>${WD[now.getDay()]}, ${now.getDate()} tháng ${now.getMonth() + 1}</span>
      </div>
      <button class="notif" data-open type="button" aria-label="Đọc tin nhắn mời cưới">
        <i class="app" aria-hidden="true">♥</i>
        <span class="nt"><b>${n.first} &amp; ${n.second}</b><small>bây giờ</small></span>
        <span class="nb">${guest ? html`Gửi ${guest}: ` : ''}${t.coverTitle}</span>
      </button>
      <p class="cover-hint">${t.coverHint}</p>
      <i class="home-bar" aria-hidden="true"></i>`;

    const sections = {
      hero: () => html`
        <header class="top">
          <img class="av2" src="${avatar(firstWho)}" alt=""><img class="av2 b" src="${avatar(secondWho)}" alt="">
          <div><b>${n.first} &amp; ${n.second}</b><small>${guest ? html`Bạn, ${guest}, và 2 người khác` : 'Nhóm · 3 thành viên'}</small></div>
          <a class="call" href="#lich-hen" aria-label="Xem lịch cưới">📅</a>
        </header>
        ${thread('hero', html`
          ${day('Hôm nay')}
          ${bub(firstWho, html`<p>${guest ? html`${guest} ơi! ` : 'Bạn ơi! '}${t.heroLead}</p>`)}
          ${bub(secondWho, html`<figure class="pic"><img data-zoom src="${ctx.img('hero', 0)}" alt="${n.pair}"></figure>`, { cls: 'media' })}
          ${bub(secondWho, html`
            <div class="invite-card">
              <small>Thiệp mời</small>
              <h1><span>${n.first}</span><em>&amp;</em><span>${n.second}</span></h1>
              <p>${fmt.long(d.date)}<br>${time}${d.city ? html` · ${d.city}` : ''}</p>
            </div>`, { cls: 'card', tail: false })}
          ${bub(firstWho, html`<p>${t.invite}</p><span class="tm">${time}</span>`)}
        `)}`,

      couple: () => thread('couple', html`
        ${day(t.coupleTitle)}
        ${[firstWho, secondWho].map(who => { const p = d[who]; return bub(who, html`
          <div class="contact">
            <img data-zoom src="${avatar(who)}" alt="${p.short}" loading="lazy">
            <div><small>${who === 'groom' ? 'Chú rể' : 'Cô dâu'}</small><b>${p.full || p.short}</b>${p.bio ? html`<span>${p.bio}</span>` : ''}</div>
          </div>`, { cls: 'card' }); })}
        ${(d.families || []).length ? bub(firstWho, html`
          <p>Bố mẹ hai bên gửi lời chào bạn nè:</p>
          <div class="fams">${d.families.map(f => html`<div><small>${f.side}</small>${f.father ? html`<p>Ông ${f.father}</p>` : ''}${f.mother ? html`<p>Bà ${f.mother}</p>` : ''}${f.address ? html`<span>${br(f.address)}</span>` : ''}</div>`)}</div>`) : ''}
      `),

      story: () => (d.story || []).length ? thread('story', html`
        ${day(t.storyTitle)}
        ${d.story.map((s, i) => html`
          ${day(s.year)}
          ${bub(i % 2 ? secondWho : firstWho, html`<p><b>${s.title}</b>${s.text ? html`<br>${s.text}` : ''}</p>`)}
        `)}
      `) : '',

      events: () => html`<div id="lich-hen"></div>${thread('events', html`
        ${day(t.eventsTitle)}
        ${(d.events || []).map((e, i) => bub(i % 2 ? secondWho : firstWho, html`
          <div class="event ${e.main ? 'main' : ''}">
            <div class="cal-ic"><small>Th ${fmt.short(e.date).slice(3, 5)}</small><b>${fmt.short(e.date).slice(0, 2)}</b></div>
            <div><h3>${e.title}</h3><p class="t">${fmt.time(e.date)} · ${fmt.long(e.date)}</p>${e.lunar ? html`<p class="lunar">${e.lunar}</p>` : ''}${e.venue ? html`<p class="v">${e.venue}</p>` : ''}${e.address ? html`<p class="a">${br(e.address)}</p>` : ''}</div>
          </div>`, { cls: 'card' }))}
        ${bub(secondWho, html`${W.calendar()}<a class="btn small" href="${W.gcalUrl()}" target="_blank" rel="noopener">Thêm vào lịch</a>`, { cls: 'card', tail: false })}
      `)}`,

      countdown: () => thread('countdown', html`
        <div class="pin"><span class="pin-ic" aria-hidden="true">📌</span><div><small>${t.countdownTitle}</small><b>Còn bao lâu nữa là tới ngày cưới?</b></div></div>
        ${bub(firstWho, W.countdown({ done: 'Hôm nay là ngày cưới của tụi mình rồi ♥' }), { cls: 'card' })}
      `),

      album: () => ctx.album.length ? thread('album', html`
        ${day(t.albumTitle)}
        ${bub(secondWho, html`<p>Gửi bạn mấy tấm ảnh cưới nè 📷</p>`)}
        ${bub(secondWho, html`<div class="grid g${Math.min(ctx.album.length, 5)}">${ctx.album.slice(0, 5).map((src, i) => html`
          <img data-zoom src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">`)}${ctx.album.length > 5 ? html`<span class="more">+${ctx.album.length - 5}</span>` : ''}</div>`, { cls: 'media', tail: false })}
        ${(d.images?.captions || []).length ? bub(firstWho, html`<p>${d.images.captions.slice(0, 3).join(' · ')} 🥰</p>`) : ''}
      `) : '',

      map: () => thread('map-sec', html`
        ${bub(firstWho, html`<p>📍 Đã chia sẻ vị trí</p>${W.map({ btn: 'btn small' })}`, { cls: 'card' })}
      `),

      rsvp: () => thread('rsvp', html`
        ${day(t.rsvpTitle)}
        ${bub(secondWho, html`<p>${t.rsvpLead}</p>`)}
        <div class="bub me card form-bub">${W.rsvp({ btn: 'btn', yes: 'Mình sẽ đến 🎉', no: 'Tiếc quá 😢' })}</div>
      `),

      guestbook: () => thread('book', html`
        ${day(t.guestbookTitle)}
        ${bub(firstWho, html`<p>Bạn nhắn gì đó cho tụi mình đi, tụi mình đọc hết đó 😆</p>`)}
        <div class="bub me card form-bub">${W.guestbook({ btn: 'btn', placeholder: 'Nhập lời chúc…' })}</div>
      `),

      gift: () => thread('gift', html`
        ${day(t.giftTitle)}
        ${bub(secondWho, html`<p>Nếu bạn ở xa không tới được, gửi lời chúc là vui lắm rồi. Còn muốn lì xì thì ở đây nè 🧧</p>`)}
        <div class="bub me card gift-bub">${W.gift({ btn: 'btn small', hint: 'Chạm để mở bao lì xì', box: html`<i class="env"></i><i class="flap"></i><b class="seal">囍</b><span class="lbl">Lì xì mừng cưới</span>` })}</div>
      `),

      thanks: () => thread('thanks', html`
        ${day(t.thanksTitle)}
        ${bub(firstWho, html`<figure class="pic"><img data-zoom src="${ctx.img('thanks', 5)}" alt="${n.pair}" loading="lazy"></figure>`, { cls: 'media' })}
        ${bub(secondWho, html`<p>${t.thanks}</p>`)}
        <div class="row ${firstWho}" data-fireworks><img class="av ghost" src="${avatar(firstWho)}" alt=""><button class="sticker" type="button" aria-label="Gửi trái tim">❤</button></div>
        <p class="seen">Đã xem <img src="${avatar(firstWho)}" alt=""><img src="${avatar(secondWho)}" alt=""></p>
      `),
    };

    const main = html`
      ${(d.sections || []).filter(s => ctx.has(s)).map(s => sections[s]?.() || '')}
      <footer>${n.pair} · ${fmt.dots(d.date)}</footer>`;
    return { cover, main };
  },

  mounted(ctx, { cover, main }) {
    tapNotification(ctx, cover);
    revealMessages(main);
    sticker(ctx, main);
  },

  opened(ctx, instant) {
    if (instant) return;
    setTimeout(() => ctx.fx.burst(ctx.fx.width / 2, ctx.fx.height * .3, 60, { hearts: true }), 300);
  },
};

/* Bìa: chạm thông báo → tiếng ting, thông báo phóng to rồi thiệp mở */
function tapNotification(ctx, cover) {
  const b = $('.notif', cover);
  if (!b) return;
  let done = false;
  b.addEventListener('click', e => {
    if (done) return;
    done = true;
    e.stopImmediatePropagation();
    ting();
    cover.classList.add('tapped');
    setTimeout(() => ctx.open(false), reduced ? 0 : 650);
  }, true);
}

/* Tin nhắn hiện lần lượt khi cuộn tới. Trước mỗi tin của cô dâu chú rể là dấu "đang soạn tin"
   hiện ngay tại chỗ của tin đó (tin chưa hiện vẫn giữ chỗ, nên trang không bị giật). */
function revealMessages(main) {
  if (reduced || !('IntersectionObserver' in window)) return;
  main.classList.add('chat-js');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    let tm = 0;
    $$(':scope > .row, :scope > .bub, :scope > .pin, :scope > .seen', e.target).forEach((el, i) => {
      if (i && el.classList.contains('row') && !el.querySelector('.sticker')) {
        setTimeout(() => el.classList.add('pending'), tm);
        tm += 560;
      }
      setTimeout(() => { el.classList.remove('pending'); el.classList.add('on'); }, tm);
      tm += 160;
    });
  }), { threshold: .1 });
  $$('.thread', main).forEach(t => io.observe(t));
}

/* Nhãn dán trái tim ở cuối: chạm để thả tim bay lên */
function sticker(ctx, main) {
  const s = $('.sticker', main);
  s?.addEventListener('click', () => { s.classList.remove('beat'); void s.offsetWidth; s.classList.add('beat'); ctx.fx.burstAt(s, 40, { hearts: true }); ting(); });
}
