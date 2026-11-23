// Các mục dùng chung (đếm ngược, lịch, album, bản đồ, xác nhận, lưu bút, hộp quà...)
// và hiệu ứng gắn bằng thuộc tính (data-rv, data-parallax, data-tilt, data-type, data-fireworks).
//
// Cách dùng trong một mẫu thiệp:
//   const W = ctx.widgets;
//   html`<section>${W.countdown()}</section>`
// Sau khi mẫu trả về HTML, core tự gọi bind() cho mọi phần tử [data-w].
// Tên class (.cd, .cal, .show, .form, .wishes, .acc...) là "hợp đồng" chung: mỗi mẫu tự viết CSS cho chúng.

import { $, $$, html, raw, br, parts, fmt, reduced, rnd, replay } from './util.js';

export function createWidgets(ctx) {
  const d = ctx.data;
  const binders = {};
  const W = {};

  /* ===== Đếm ngược ===== */
  W.countdown = ({ labels = ['Ngày', 'Giờ', 'Phút', 'Giây'], done = ctx.say('countdownDone') } = {}) => html`
    <div class="cd" data-w="countdown">
      ${labels.map((l, i) => html`<div class="u"><b data-u="${i}">00</b><span>${l}</span></div>`)}
    </div>
    <p class="cd-done" hidden>${done}</p>`;
  binders.countdown = el => {
    const target = new Date(d.date).getTime(), nums = $$('b', el), doneEl = el.nextElementSibling;
    const set = (b, v) => { const s = String(v).padStart(2, '0'); if (b.textContent !== s) { b.textContent = s; replay(b, 'flip'); } };
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { el.hidden = true; if (doneEl) doneEl.hidden = false; clearInterval(t); return; }
      set(nums[0], Math.floor(diff / 864e5)); set(nums[1], Math.floor(diff / 36e5) % 24);
      set(nums[2], Math.floor(diff / 6e4) % 60); set(nums[3], Math.floor(diff / 1e3) % 60);
    };
    const t = setInterval(tick, 1000); tick();
  };

  /* ===== Lịch tháng cưới ===== */
  W.calendar = ({ weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] } = {}) => {
    const p = parts(d.date), marks = new Set((d.events || []).map(e => parts(e.date)).filter(e => e && e.y === p.y && e.mo === p.mo && e.d !== p.d).map(e => e.d));
    const offset = (new Date(p.y, p.mo - 1, 1).getDay() + 6) % 7, days = new Date(p.y, p.mo, 0).getDate();
    const cells = [...weekdays.map(w => html`<span class="wd">${w}</span>`), ...Array(offset).fill(html`<span></span>`)];
    for (let i = 1; i <= days; i++) cells.push(html`<span class="${i === p.d ? 'wed' : marks.has(i) ? 'eng' : ''}">${i}</span>`);
    return html`<div class="cal"><h3>Tháng ${p.mo} · ${p.y}</h3><div class="cal-grid">${cells}</div></div>`;
  };

  /* ===== Link thêm vào Google Calendar ===== */
  W.gcalUrl = () => {
    const start = new Date(d.date), end = new Date(start.getTime() + 3 * 36e5);
    const f = x => x.toISOString().replace(/[-:]|\.\d{3}/g, '');
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent(`Lễ Thành Hôn ${ctx.names.pair}`)
      + '&dates=' + f(start) + '/' + f(end)
      + '&location=' + encodeURIComponent(d.places?.[0]?.address || '');
  };

  /* ===== Album trình chiếu + ảnh nhỏ ===== */
  W.gallery = ({ hint = 'Chạm vào ảnh để xem toàn màn hình' } = {}) => html`
    <div class="show" data-w="gallery">${ctx.album.map((src, i) => html`<img src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy">`)}</div>
    <div class="thumbs">${ctx.album.map(src => html`<img src="${src}" alt="" loading="lazy">`)}</div>
    ${hint ? html`<p class="hint">${hint}</p>` : ''}`;
  binders.gallery = show => {
    const big = $$('img', show), small = $$('img', show.nextElementSibling);
    let cur = 0, auto;
    const go = i => { cur = (i + big.length) % big.length; big.forEach((e, k) => e.classList.toggle('on', k === cur)); small.forEach((e, k) => e.classList.toggle('on', k === cur)); };
    const restart = () => { clearInterval(auto); auto = setInterval(() => go(cur + 1), 4500); };
    small.forEach((t, i) => t.addEventListener('click', () => { go(i); restart(); }));
    show.addEventListener('click', () => ctx.lightbox.open(cur));
    go(0); restart();
    tilt(show, 10);
  };

  /* ===== Chồng ảnh polaroid kéo thả ===== */
  W.polaroids = ({ captions = [] } = {}) => html`
    <div class="polas" data-w="polaroids">
      ${ctx.album.map((src, i) => html`<figure class="pola" data-i="${i}"><img src="${src}" alt="Ảnh cưới ${i + 1}" draggable="false"><figcaption>${captions[i] || ''}</figcaption></figure>`)}
    </div>`;
  binders.polaroids = el => {
    const cards = $$('.pola', el).reverse(); // ảnh đầu tiên nằm trên cùng
    let z = cards.length;
    const place = (c, i) => { c.style.setProperty('--r', rnd(-9, 9).toFixed(1) + 'deg'); c.style.setProperty('--x', rnd(-14, 14).toFixed(0) + 'px'); c.style.zIndex = i + 1; };
    cards.forEach(place);
    cards.forEach(c => {
      let sx, sy, dx = 0, dy = 0, drag = false;
      c.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; dx = dy = 0; drag = true; c.setPointerCapture(e.pointerId); c.classList.add('drag'); c.style.zIndex = ++z; });
      c.addEventListener('pointermove', e => { if (!drag) return; dx = e.clientX - sx; dy = e.clientY - sy; c.style.translate = `${dx}px ${dy}px`; c.style.rotate = dx / 12 + 'deg'; });
      const end = () => {
        if (!drag) return; drag = false; c.classList.remove('drag');
        if (Math.hypot(dx, dy) < 6) { c.style.translate = c.style.rotate = ''; ctx.lightbox.open(+c.dataset.i); return; }
        if (Math.hypot(dx, dy) > 70) {
          // Ném ra ngoài rồi trượt về đáy chồng ảnh
          c.classList.add('fly'); c.style.translate = `${dx * 3}px ${dy * 3}px`;
          setTimeout(() => { c.classList.remove('fly'); c.style.translate = c.style.rotate = '';
            $$('.pola', el).forEach(o => (o.style.zIndex = +o.style.zIndex + 1)); c.style.zIndex = 1; place(c, 0); }, 320);
        } else { c.style.translate = c.style.rotate = ''; }
      };
      c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    });
  };

  /* ===== Bản đồ nhiều địa điểm ===== */
  W.map = ({ btn = 'btn', label = 'Chỉ đường' } = {}) => html`
    <div data-w="map">
      <div class="tabs">${(d.places || []).map((p, i) => html`<button type="button" data-i="${i}">${p.label}</button>`)}</div>
      <p class="addr"></p>
      <div class="map"><iframe title="Bản đồ" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <a class="${btn}" target="_blank" rel="noopener">${label}</a>
    </div>`;
  binders.map = el => {
    let place = 0;
    const set = i => {
      place = i;
      const p = d.places[i], q = encodeURIComponent(p.coords || p.address);
      $$('.tabs button', el).forEach((b, k) => b.classList.toggle('on', k === i));
      $('.addr', el).textContent = p.address;
      // Thay hẳn iframe (không đổi src) để không thêm mục vào lịch sử trình duyệt;
      // dùng /maps/embed vì ?output=embed bị chặn khung trên Android khi quay lại trang.
      const old = $('iframe', el), fr = old.cloneNode(false);
      fr.src = `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${q}!6i16`;
      old.replaceWith(fr);
      $('a', el).href = p.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${q}`;
    };
    $$('.tabs button', el).forEach(b => b.addEventListener('click', () => set(+b.dataset.i)));
    addEventListener('pageshow', e => { if (e.persisted) set(place); });
    if (d.places?.length) set(0); else el.hidden = true;
    if ((d.places || []).length < 2) $('.tabs', el).hidden = true;
  };

  // Mã khách ẩn danh lưu trên máy: để hai người trùng tên không bị gộp, còn một người gửi lại thì cập nhật
  const guestId = () => {
    const k = 'sayhello:' + ctx.slug + ':gid';
    try { let v = localStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 10); localStorage.setItem(k, v); } return v; }
    catch { return Math.random().toString(36).slice(2, 10); }
  };

  /* ===== Xác nhận tham dự ===== */
  W.rsvp = ({ btn = 'btn', cls = '', yes = 'Sẽ tham dự', no = 'Rất tiếc, không thể', submit = 'Gửi xác nhận' } = {}) => {
    const r = d.rsvp || {}, max = r.maxGuests || 5, sides = r.sides || ['Khách nhà trai', 'Khách nhà gái'];
    return html`
    <form class="form ${cls}" data-w="rsvp">
      <input name="name" placeholder="${ctx.say('namePh')}" aria-label="${ctx.say('namePh')}" required maxlength="60" autocomplete="name" value="${ctx.guest}">
      <div class="choice">
        <label><input type="radio" name="attend" value="Có" checked><span>${yes}</span></label>
        <label><input type="radio" name="attend" value="Không"><span>${no}</span></label>
      </div>
      <div class="row">
        <select name="guests" aria-label="Số người tham dự">
          ${Array.from({ length: max }, (_, i) => html`<option value="${i + 1}">${i + 1} người${i + 1 === max ? ' trở lên' : ''}</option>`)}
        </select>
        <select name="side" aria-label="${ctx.say('sideLabel')}">${sides.map(s => html`<option>${s}</option>`)}</select>
      </div>
      ${(d.events || []).length > 1 && r.pickEvents !== false ? html`
      <fieldset class="pick" data-pick="events"><legend>${ctx.say('pickEvents')}</legend>
        ${d.events.map((e, i) => html`<label><input type="checkbox" name="ev" value="${i}" checked><span>${e.title}</span></label>`)}
      </fieldset>` : ''}
      ${r.note !== false ? html`<input name="note" maxlength="160" placeholder="Ghi chú: ăn chay, đi cùng em bé, cần xe đưa đón…" aria-label="Ghi chú">` : ''}
      <div class="pick"><label><input type="checkbox" name="withwish"><span>Gửi kèm lời chúc lên sổ lưu bút</span></label></div>
      <textarea name="wish" placeholder="Lời chúc gửi cô dâu chú rể…" maxlength="500" rows="2" hidden></textarea>
      <button class="${btn}" type="submit">${submit}</button>
      <p class="msg" role="status"></p>
    </form>`;
  };
  binders.rsvp = form => {
    const attend = () => form.attend.value === 'Có';
    form.addEventListener('change', () => {
      $('.row', form).style.opacity = attend() ? '' : .4;
      const pick = $('[data-pick=events]', form); if (pick) pick.hidden = !attend();
      form.wish.hidden = !form.withwish.checked;
    });
    bindForm(form,
      fd => {
        const evs = attend() ? fd.getAll('ev').map(i => d.events[+i]?.title).filter(Boolean) : [];
        const out = { type: 'rsvp', name: fd.get('name').trim(), attend: fd.get('attend'), guests: fd.get('guests'), side: fd.get('side'), gid: guestId(),
          events: evs.join('; '), note: (fd.get('note') || '').trim() };
        const wish = fd.get('withwish') ? (fd.get('wish') || '').trim() : '';
        if (wish) out.wish = wish;
        return out;
      },
      x => ctx.say(x.attend === 'Có' ? 'thanksYes' : 'thanksNo', { name: x.name }));
  };

  /* ===== Sổ lưu bút ===== */
  W.guestbook = ({ btn = 'btn', cls = '', submit = 'Gửi lời chúc', placeholder = 'Gửi lời chúc tới cô dâu chú rể...' } = {}) => html`
    <form class="form ${cls}" data-w="guestbook">
      <input name="name" placeholder="${ctx.say('namePh')}" aria-label="${ctx.say('namePh')}" required maxlength="60" autocomplete="name" value="${ctx.guest}">
      <textarea name="message" placeholder="${placeholder}" required maxlength="500" rows="3"></textarea>
      <button class="${btn}" type="submit">${submit}</button>
      <p class="msg" role="status"></p>
    </form>
    <div class="wishes"></div>`;
  binders.guestbook = form => {
    const list = form.nextElementSibling;
    const node = w => { const el = document.createElement('div'); el.className = 'wish-item'; const b = document.createElement('b'); b.textContent = w.name; const p = document.createElement('p'); p.textContent = w.message; el.append(b, p); return el; };
    const render = () => {
      list.textContent = '';
      if (!ctx.wishes.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = ctx.say('firstWish'); list.append(p); return; }
      ctx.wishes.forEach(w => list.append(node(w)));
    };
    ctx.on('wishes', render); render();
    bindForm(form,
      fd => ({ type: 'wish', name: fd.get('name').trim(), message: fd.get('message').trim() }),
      x => { $('.empty', list)?.remove(); list.prepend(node(x)); ctx.wishes.unshift(x); form.message.value = ''; ctx.cheers(x.name); return ctx.say('thanksWish'); });
  };

  function bindForm(form, build, done) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button[type=submit]', form), msg = $('.msg', form), data = build(new FormData(form));
      btn.disabled = true; msg.textContent = 'Đang gửi...';
      try { await ctx.backend.send(data); msg.textContent = done(data); ctx.fx.burstAt(btn, 80, { hearts: true }); }
      catch { msg.textContent = ctx.say('sendFail'); }
      btn.disabled = false;
    });
  }

  /* ===== Hộp quà mừng cưới (QR ngân hàng) ===== */
  // Nội dung chuyển khoản tự điền tên khách (không dấu) để cặp đôi đối chiếu sao kê
  const memoFor = n => {
    const s = String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9 ]/g, '').trim();
    return s ? ('Mung cuoi ' + s).slice(0, 50) : '';
  };
  W.gift = ({ btn = 'btn', hint = 'Chạm để mở', box = raw('<i class="lid"></i><i class="box"></i>') } = {}) => {
    const memo = memoFor(ctx.guest);
    return html`
    <div data-w="gift">
      <button class="giftbox" type="button" aria-label="Mở hộp quà">${box}</button>
      <p class="hint">${hint}</p>
      <div class="accounts" hidden>
        ${(d.accounts || []).map(a => html`
          <div class="acc">
            <h3>${a.who}</h3>
            <img alt="Mã QR ${a.who}" loading="lazy" src="${a.qr || `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-qr_only.png?accountName=${encodeURIComponent(a.name)}${memo ? '&addInfo=' + encodeURIComponent(memo) : ''}`}">
            <p>${a.bank}</p><p class="num">${a.number}</p><p>${a.name}</p>
            <button class="${btn}" type="button" data-copy="${a.number}">Sao chép số tài khoản</button>
          </div>`)}
      </div>
    </div>`;
  };
  binders.gift = el => {
    const box = $('.giftbox', el), accs = $('.accounts', el);
    box.addEventListener('click', () => {
      if (box.classList.contains('open')) return;
      box.classList.add('open'); $('.hint', el).hidden = true;
      ctx.fx.burstAt(box, 90);
      setTimeout(() => (accs.hidden = false), 450);
    });
    $$('[data-copy]', el).forEach(b => b.addEventListener('click', async () => {
      const t = b.textContent;
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Đã sao chép ✓'; } catch { b.textContent = b.dataset.copy; }
      setTimeout(() => (b.textContent = t), 2000);
    }));
  };

  /* ===== Lớp cào để lộ nội dung (như vé số) =====
     W.scratch(html`<b>29.11</b>`, { label: 'Cào để xem ngày cưới', foil: ['#d4af37', '#f6e7b0'] }) */
  W.scratch = (inner, { label = 'Cào nhẹ để xem', foil = ['#b8862f', '#f6dfa6', '#c9983f'], ink = '#5a3d0c' } = {}) => html`
    <div class="scratch" data-w="scratch" data-label="${label}" data-foil="${foil.join(',')}" data-ink="${ink}">
      <div class="scratch-in">${inner}</div>
    </div>`;
  binders.scratch = el => {
    const cv = document.createElement('canvas'), c = cv.getContext('2d');
    cv.className = 'scratch-cv'; cv.setAttribute('aria-label', el.dataset.label); cv.setAttribute('role', 'button'); cv.tabIndex = 0;
    el.append(cv);
    let done = false, moves = 0, last = null;
    const paint = () => {
      const r = el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = r.width * dpr; cv.height = r.height * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = c.createLinearGradient(0, 0, r.width, r.height), cols = el.dataset.foil.split(',');
      cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
      c.fillStyle = g; c.fillRect(0, 0, r.width, r.height);
      // vân kim tuyến
      for (let i = 0; i < r.width * r.height / 90; i++) { c.fillStyle = `rgba(255,255,255,${rnd(0, .25)})`; c.fillRect(rnd(0, r.width), rnd(0, r.height), 1.4, 1.4); }
      c.fillStyle = el.dataset.ink; c.font = `500 ${Math.max(13, r.width / 16)}px ${getComputedStyle(el).fontFamily}`;
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(el.dataset.label, r.width / 2, r.height / 2);
      c.globalCompositeOperation = 'destination-out';
    };
    const reveal = () => {
      if (done) return; done = true;
      cv.classList.add('gone'); el.classList.add('revealed');
      ctx.fx.burstAt(el, 120, { hearts: true });
      el.dispatchEvent(new CustomEvent('revealed', { bubbles: true }));
    };
    const scratchAt = (x, y) => {
      const r = cv.getBoundingClientRect(), p = { x: x - r.left, y: y - r.top }, rad = Math.max(18, r.width / 12);
      c.lineWidth = rad * 2; c.lineCap = 'round';
      c.beginPath(); c.moveTo((last || p).x, (last || p).y); c.lineTo(p.x, p.y); c.stroke(); last = p;
      if (++moves % 12 === 0) {
        const img = c.getImageData(0, 0, cv.width, cv.height).data; let clear = 0;
        for (let i = 3; i < img.length; i += 64) if (img[i] === 0) clear++;
        if (clear / (img.length / 64) > .5) reveal();
      }
    };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); last = null; scratchAt(e.clientX, e.clientY); });
    cv.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') scratchAt(e.clientX, e.clientY); });
    cv.addEventListener('pointerup', () => (last = null));
    cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') reveal(); });
    if (reduced) { cv.addEventListener('click', reveal); }
    requestAnimationFrame(paint);
    new ResizeObserver(() => { if (!done) paint(); }).observe(el);
  };

  /* ===== Gắn hành vi cho mọi [data-w] trong root ===== */
  W.bind = root => {
    $$('[data-w]', root).forEach(el => binders[el.dataset.w]?.(el));
    bindEffects(root);
  };

  /* ===== Hiệu ứng theo thuộc tính ===== */
  function tilt(el, deg = 8) {
    if (reduced || !matchMedia('(hover: hover)').matches) return;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(900px) rotateY(${px * deg}deg) rotateX(${-py * deg}deg)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  }

  function bindEffects(root) {
    // data-rv="up|left|right|zoom|flip|blur|..." : hiện dần khi cuộn tới
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in'); io.unobserve(e.target);
      if (e.target.hasAttribute('data-type')) typeOut(e.target);
    }), { threshold: .15 });
    $$('[data-rv], [data-type]', root).forEach(el => io.observe(el));

    // data-type: chữ hiện từng ký tự như đang viết tay / đánh máy
    $$('[data-type]', root).forEach(el => {
      if (reduced) return;
      const walk = n => [...n.childNodes].forEach(c => {
        if (c.nodeType === 3) {
          const f = document.createDocumentFragment();
          [...c.textContent].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; f.append(s); });
          c.replaceWith(f);
        } else walk(c);
      });
      walk(el); el.classList.add('typing');
    });
    function typeOut(el) {
      if (reduced) return;
      const chs = $$('.ch', el), speed = +el.dataset.type || 28;
      chs.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * speed));
    }

    // data-tilt="8": nghiêng 3D theo chuột
    $$('[data-tilt]', root).forEach(el => tilt(el, +el.dataset.tilt || 8));

    // data-parallax="0.2": trôi chậm hơn khi cuộn (số âm: trôi nhanh hơn), bằng 0 khi phần tử ở giữa màn hình
    const px = $$('[data-parallax]', root);
    if (px.length && !reduced) {
      let ticking = false;
      const run = () => {
        px.forEach(el => {
          const r = el.parentElement.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) return;
          el.style.transform = `translate3d(0, ${(innerHeight / 2 - r.top - r.height / 2) * (+el.dataset.parallax)}px, 0)`;
        });
        ticking = false;
      };
      addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
      run();
    }

    // data-zoom: chạm ảnh để xem toàn màn hình
    $$('img[data-zoom]', root).forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => { const i = ctx.album.indexOf(img.getAttribute('src')); ctx.lightbox.open(i < 0 ? 0 : i, i < 0 ? [img.getAttribute('src')] : undefined); });
    });

    // data-fireworks: bắn pháo hoa khi phần này hiện trên màn hình, chạm để bắn thêm
    $$('[data-fireworks]', root).forEach(el => {
      let t = null;
      new IntersectionObserver(es => {
        clearInterval(t);
        if (!es[0].isIntersecting || reduced) return;
        t = setInterval(() => {
          if (document.hidden) return;
          const r = el.getBoundingClientRect(), top = Math.max(r.top, 0), bot = Math.min(r.bottom, innerHeight);
          ctx.fx.firework(rnd(r.left + 30, r.right - 30), rnd(top + 20, top + (bot - top) * .55));
        }, 850);
      }, { threshold: .2 }).observe(el);
      el.addEventListener('click', e => ctx.fx.firework(e.clientX, e.clientY));
    });
  }

  W.br = br; W.fmt = fmt;
  return W;
}
