(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHOTOS = [1, 2, 3, 4, 5, 6].map(i => `images/anh${i}.jpg`);

  /* ---------- Tên khách riêng ---------- */
  // Ba dạng link đều chạy: /moi/Bạn-Nhung (dấu - thay khoảng trắng), #khach=Bạn+Nhung, ?khach=Bạn+Nhung
  const hashParams = new URLSearchParams(location.hash.slice(1));
  const pathMatch = location.pathname.match(/^\/moi\/([^/]+)/);
  const pathGuest = pathMatch
    ? pathMatch[1].split(/[-+]/).map(s => { try { return decodeURIComponent(s); } catch { return s; } }).join(' ')
    : '';
  const guestName = (pathGuest || hashParams.get('khach') || params.get('khach') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (guestName) {
    $('#guest').textContent = guestName;
    $$('input[name=name]').forEach(i => (i.value = guestName));
  }

  /* ---------- Hạt rơi: cánh hoa, kim tuyến, pháo giấy ---------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [], ambient = false;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const PETAL = ['#ffb3c1', '#ff8fa3', '#ffccd5', '#f28482', '#e5383b'];
  const CONF = ['#e6c27a', '#fff3cf', '#e5383b', '#ffffff', '#ffb703'];

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function petal(top) {
    return { t: 'p', px: 0, py: 0, x: rnd(0, W), y: top ? -20 : rnd(0, H), vx: rnd(-.3, .5), vy: rnd(.5, 1.4), r: rnd(5, 10),
      rot: rnd(0, 6.3), vr: rnd(-.03, .03), ph: rnd(0, 6.3), c: PETAL[Math.random() * PETAL.length | 0] };
  }
  function spark(top) {
    return { t: 's', x: rnd(0, W), y: top ? -10 : rnd(0, H), vx: rnd(-.15, .15), vy: rnd(.2, .6), r: rnd(1, 2.4), ph: rnd(0, 6.3) };
  }
  function burst(x, y, n = 90) {
    if (reduced) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(3, 13);
      parts.push({ t: 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: rnd(5, 10), h: rnd(3, 6),
        rot: rnd(0, 6.3), vr: rnd(-.3, .3), life: rnd(90, 160), c: CONF[Math.random() * CONF.length | 0] });
    }
  }
  const FIRE = ['#ffd166', '#fff3cf', '#ff6b6b', '#ff9ebb', '#ffb703'];
  function firework(x, y) {
    if (reduced) return;
    const c = FIRE[Math.random() * FIRE.length | 0], n = W < 500 ? 46 : 70;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(1, 5.2);
      parts.push({ t: 'f', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(45, 75), max: 75, c: Math.random() < .25 ? '#ffffff' : c });
    }
  }
  // Vị trí ngón tay / chuột để cánh hoa né ra
  const ptr = { x: -999, y: -999, t: 0 };
  const track = (x, y) => { ptr.x = x; ptr.y = y; ptr.t = performance.now(); };
  addEventListener('pointermove', e => track(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', e => track(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => track(e.touches[0].clientX, e.touches[0].clientY), { passive: true });

  function startAmbient() {
    if (ambient || reduced) return;
    ambient = true;
    const n = W < 500 ? 20 : 34;
    for (let i = 0; i < n; i++) parts.push(petal(false));
    for (let i = 0; i < n / 2; i++) parts.push(spark(false));
  }
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || !parts.length) return;
    ctx.clearRect(0, 0, W, H);
    const hot = performance.now() - ptr.t < 1200;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.t === 'c') {
        p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (--p.life < 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40); ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        continue;
      }
      if (p.t === 'f') {
        p.vx *= .965; p.vy = p.vy * .965 + .045; p.x += p.vx; p.y += p.vy;
        if (--p.life < 0) { parts.splice(i, 1); continue; }
        const a = p.life / p.max;
        ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath();
        ctx.arc(p.x, p.y, .6 + 2.2 * a, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
        continue;
      }
      p.ph += .02; p.x += p.vx + Math.sin(p.ph) * .5; p.y += p.vy;
      if (p.y > H + 20) { parts[i] = p.t === 'p' ? petal(true) : spark(true); continue; }
      if (p.t === 'p') {
        if (hot) {
          const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < 12100 && d2 > 1) { const d = Math.sqrt(d2), f = (110 - d) / 110 * 1.6; p.px += dx / d * f; p.py += dy / d * f; }
        }
        p.x += p.px; p.y += p.py; p.px *= .92; p.py *= .92;
        p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.ph));
        ctx.globalAlpha = .8; ctx.fillStyle = p.c; ctx.beginPath();
        ctx.moveTo(0, -p.r); ctx.bezierCurveTo(p.r, -p.r, p.r, p.r * .6, 0, p.r);
        ctx.bezierCurveTo(-p.r, p.r * .6, -p.r, -p.r, 0, -p.r); ctx.fill(); ctx.restore();
      } else {
        ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(p.ph * 2));
        ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
  resize(); addEventListener('resize', resize); requestAnimationFrame(frame);

  /* ---------- Nhạc nền ---------- */
  const musicBtn = $('#music');
  let audio = null;
  if (CFG.music) {
    audio = new Audio(CFG.music);
    audio.loop = true; audio.preload = 'none'; audio.volume = .7;
    audio.addEventListener('play', () => musicBtn.classList.add('on'));
    audio.addEventListener('pause', () => musicBtn.classList.remove('on'));
    audio.addEventListener('error', () => (musicBtn.hidden = true));
    musicBtn.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
    // Tạm dừng khi khách rời tab, phát lại khi quay về
    let wasPlaying = false;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { wasPlaying = !audio.paused; audio.pause(); }
      else if (wasPlaying) audio.play().catch(() => {});
    });
  }

  /* ---------- Mở thiệp ---------- */
  const cover = $('#cover');
  function openCard(instant) {
    document.body.classList.remove('locked');
    document.body.classList.add('opened');
    if (audio) musicBtn.hidden = false;
    $('#love').hidden = false;
    startAmbient();
    startFly();
    if (instant) { cover.classList.add('gone'); return; }
    cover.classList.add('open');
    if (audio) audio.play().catch(() => {});
    burst(W / 2, H * .4, 140);
    setTimeout(() => { burst(W * .2, H * .3, 60); burst(W * .8, H * .3, 60); }, 500);
    setTimeout(() => cover.classList.add('gone'), 2100);
  }
  $('#open').addEventListener('click', () => openCard(false));
  if (params.get('open') === '1') openCard(true);

  /* ---------- Hiện dần khi cuộn ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .15 });
  $$('[data-rv]').forEach(el => io.observe(el));

  /* ---------- Thanh tiến độ + ảnh nền trôi chậm ---------- */
  const bar = $('#bar'), heroImg = $('#heroImg');
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      if (!reduced && y < innerHeight * 1.2) heroImg.style.transform = `translateY(${y * .18}px) scale(${1 + y * .0004})`;
      ticking = false;
    });
  }, { passive: true });

  /* ---------- Đếm ngược ---------- */
  const target = new Date(CFG.weddingDate).getTime();
  const cdEls = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };
  function setNum(el, v) {
    const s = String(v).padStart(2, '0');
    if (el.textContent === s) return;
    el.textContent = s;
    el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
  }
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) { $('#cd').hidden = true; $('#cdDone').hidden = false; clearInterval(timer); return; }
    setNum(cdEls.d, Math.floor(diff / 864e5));
    setNum(cdEls.h, Math.floor(diff / 36e5) % 24);
    setNum(cdEls.m, Math.floor(diff / 6e4) % 60);
    setNum(cdEls.s, Math.floor(diff / 1e3) % 60);
  }
  const timer = setInterval(tick, 1000); tick();

  /* ---------- Lịch tháng ---------- */
  (() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(CFG.weddingDate);
    const y = +m[1], mo = +m[2] - 1, wd = +m[3];
    const cal = $('#cal');
    const add = (txt, cls) => { const s = document.createElement('span'); s.textContent = txt; if (cls) s.className = cls; cal.appendChild(s); };
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(d => add(d, 'wd'));
    const offset = (new Date(y, mo, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) add('');
    const days = new Date(y, mo + 1, 0).getDate();
    for (let d = 1; d <= days; d++) add(d, d === wd ? 'wed' : d === CFG.engagementDay ? 'eng' : '');

    const start = new Date(CFG.weddingDate), end = new Date(start.getTime() + 3 * 36e5);
    const fmt = d => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
    $('#gcal').href = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
      + '&text=' + encodeURIComponent('Lễ Thành Hôn Minh Thắng & Linh Trang')
      + '&dates=' + fmt(start) + '/' + fmt(end)
      + '&location=' + encodeURIComponent(CFG.places[0].address);
  })();

  /* ---------- Album: trình chiếu + xem toàn màn hình ---------- */
  const show = $('#show'), thumbs = $('#thumbs');
  let cur = 0, auto = null;
  PHOTOS.forEach((src, i) => {
    const a = new Image(); a.src = src; a.alt = `Ảnh cưới ${i + 1}`; a.loading = 'lazy'; show.appendChild(a);
    const t = new Image(); t.src = src; t.alt = ''; t.loading = 'lazy';
    t.addEventListener('click', () => { go(i); restart(); });
    thumbs.appendChild(t);
  });
  function go(i) {
    cur = (i + PHOTOS.length) % PHOTOS.length;
    $$('img', show).forEach((el, k) => el.classList.toggle('on', k === cur));
    $$('img', thumbs).forEach((el, k) => el.classList.toggle('on', k === cur));
  }
  function restart() { clearInterval(auto); auto = setInterval(() => go(cur + 1), 4500); }
  go(0); restart();
  show.addEventListener('click', () => openLb(cur));
  // Ảnh nghiêng theo chuột (máy tính)
  if (!reduced && matchMedia('(hover: hover)').matches) {
    show.addEventListener('pointermove', e => {
      const r = show.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      show.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`;
    });
    show.addEventListener('pointerleave', () => (show.style.transform = ''));
  }

  const lb = $('#lb'), lbImg = $('img', lb);
  let lbIdx = 0;
  function openLb(i) {
    lbIdx = (i + PHOTOS.length) % PHOTOS.length;
    lbImg.src = PHOTOS[lbIdx];
    $('.lb-c', lb).textContent = `${lbIdx + 1} / ${PHOTOS.length}`;
    lb.hidden = false;
  }
  $$('.zoomable').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLb(PHOTOS.indexOf(img.getAttribute('src'))));
  });
  $('.lb-x', lb).addEventListener('click', () => (lb.hidden = true));
  $('.lb-p', lb).addEventListener('click', () => openLb(lbIdx - 1));
  $('.lb-n', lb).addEventListener('click', () => openLb(lbIdx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.hidden = true; });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lb.hidden = true;
    if (e.key === 'ArrowLeft') openLb(lbIdx - 1);
    if (e.key === 'ArrowRight') openLb(lbIdx + 1);
  });
  let sx = null;
  lb.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 45) openLb(lbIdx + (dx < 0 ? 1 : -1));
  });

  /* ---------- Bản đồ ---------- */
  const tabs = $('#tabs');
  let place = 0;
  function setPlace(i) {
    place = i;
    const p = CFG.places[i], q = encodeURIComponent(p.coords || p.address);
    $$('button', tabs).forEach((b, k) => b.classList.toggle('on', k === i));
    $('#addr').textContent = p.address;
    // Nhúng thẳng địa chỉ /maps/embed: địa chỉ ?output=embed chuyển hướng kèm X-Frame-Options,
    // khiến Android báo ERR_BLOCKED_BY_RESPONSE khi quay lại trang.
    // Thay hẳn khung iframe (thay vì đổi src) để không thêm mục vào lịch sử của trình duyệt.
    const old = $('#map'), frame = old.cloneNode(false);
    frame.src = `https://www.google.com/maps/embed?origin=mfe&pb=!1m3!2m1!1s${q}!6i16`;
    old.replaceWith(frame);
    $('#dir').href = p.mapLink || `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }
  // Quay lại thiệp từ Google Maps: nạp lại bản đồ phòng khi khung bị khôi phục ở trạng thái lỗi
  addEventListener('pageshow', e => { if (e.persisted) setPlace(place); });
  CFG.places.forEach((p, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = p.label;
    b.addEventListener('click', () => setPlace(i)); tabs.appendChild(b);
  });
  setPlace(0);

  /* ---------- Gửi dữ liệu: Google Sheets hoặc lưu tạm trên máy ---------- */
  const LS = 'thiep-thang-trang';
  const localGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
  const localAdd = d => { try { localStorage.setItem(LS, JSON.stringify([d, ...localGet()].slice(0, 200))); } catch {} };
  async function send(data) {
    if (!CFG.sheetUrl) { localAdd(data); return; }
    // text/plain để tránh preflight CORS với Apps Script
    await fetch(CFG.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) });
  }
  function bindForm(form, build, done) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button[type=submit]', form), msg = $('.msg', form);
      const data = build(new FormData(form));
      btn.disabled = true; msg.textContent = 'Đang gửi...';
      try {
        await send(data);
        msg.textContent = done(data);
        const r = btn.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top, 80);
      } catch {
        msg.textContent = 'Gửi chưa thành công, quý khách vui lòng thử lại.';
      }
      btn.disabled = false;
    });
  }
  bindForm($('#rsvp'),
    fd => ({ type: 'rsvp', name: fd.get('name').trim(), attend: fd.get('attend'), guests: fd.get('guests'), side: fd.get('side') }),
    d => d.attend === 'Có' ? `Cảm ơn ${d.name}! Hẹn gặp quý khách trong ngày vui ❤` : `Cảm ơn ${d.name} đã phản hồi. Rất tiếc, hẹn gặp quý khách vào dịp khác!`);

  /* ---------- Sổ lưu bút ---------- */
  const wishesEl = $('#wishes');
  function wishNode(w) {
    const d = document.createElement('div'); d.className = 'wish-item';
    const b = document.createElement('b'); b.textContent = w.name;
    const p = document.createElement('p'); p.textContent = w.message;
    d.append(b, p); return d;
  }
  function renderWishes(list) {
    wishesEl.textContent = '';
    if (!list.length) {
      const p = document.createElement('p'); p.className = 'empty';
      p.textContent = 'Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!';
      wishesEl.appendChild(p); return;
    }
    list.forEach(w => wishesEl.appendChild(wishNode(w)));
  }
  let wishPool = [];
  (async () => {
    let list = localGet().filter(x => x.type === 'wish');
    if (CFG.sheetUrl) {
      try { list = await (await fetch(CFG.sheetUrl)).json(); } catch {}
    }
    wishPool = Array.isArray(list) ? list : [];
    renderWishes(wishPool);
  })();
  bindForm($('#wish'),
    fd => ({ type: 'wish', name: fd.get('name').trim(), message: fd.get('message').trim() }),
    d => {
      $('.empty', wishesEl)?.remove();
      wishesEl.prepend(wishNode(d));
      wishPool.unshift(d);
      $('#wish textarea').value = '';
      cheers(d.name);
      return 'Cảm ơn lời chúc của quý khách ❤';
    });

  /* ---------- Cụng ly + lời cảm ơn sau khi gửi lời chúc ---------- */
  function cheers(name) {
    $('.cheers')?.remove();
    const el = document.createElement('div');
    el.className = 'cheers'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Lời cảm ơn');
    const glasses = document.createElement('div'); glasses.className = 'glasses'; glasses.setAttribute('aria-hidden', 'true');
    for (const side of ['l', 'r']) {
      const g = document.createElement('i'); g.className = 'glass ' + side;
      g.append(document.createElement('b'), document.createElement('s'));
      glasses.appendChild(g);
    }
    const spark = document.createElement('span'); spark.className = 'clink'; spark.textContent = '✨';
    glasses.appendChild(spark);
    const h = document.createElement('h3'); h.textContent = 'Cảm ơn ' + name + '!';
    const p = document.createElement('p'); p.textContent = 'Lời chúc của quý khách là món quà quý giá với chúng tôi. Xin mời cùng nâng ly chúc mừng!';
    const sign = document.createElement('p'); sign.className = 'cheers-sign'; sign.textContent = 'Minh Thắng & Linh Trang';
    const btn = document.createElement('button'); btn.className = 'btn gold'; btn.type = 'button'; btn.textContent = 'Đóng';
    const card = document.createElement('div'); card.className = 'cheers-card';
    card.append(glasses, h, p, sign, btn);
    el.appendChild(card);
    const close = () => { clearTimeout(timer); el.classList.add('out'); setTimeout(() => el.remove(), 400); };
    const timer = setTimeout(close, 9000);
    el.addEventListener('click', e => { if (e.target === el || e.target === btn) close(); });
    document.body.appendChild(el);
    // Pháo giấy bung đúng lúc hai ly chạm nhau
    setTimeout(() => {
      if (!el.isConnected) return;
      const r = glasses.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height * .3, 110);
    }, 850);
  }

  /* ---------- Hộp quà mừng ---------- */
  if (CFG.accounts.length) {
    const gift = $('#gift'), accs = $('#accounts');
    gift.hidden = false;
    CFG.accounts.forEach(a => {
      const d = document.createElement('div'); d.className = 'acc';
      const h = document.createElement('h3'); h.textContent = a.who;
      const img = new Image(); img.alt = `Mã QR ${a.who}`; img.loading = 'lazy';
      img.src = a.qr || `https://img.vietqr.io/image/${encodeURIComponent(a.bankCode)}-${encodeURIComponent(a.number)}-qr_only.png?accountName=${encodeURIComponent(a.name)}`;
      const p1 = document.createElement('p'); p1.textContent = a.bank || '';
      const p2 = document.createElement('p'); p2.className = 'num'; p2.textContent = a.number;
      const p3 = document.createElement('p'); p3.textContent = a.name;
      const btn = document.createElement('button'); btn.className = 'btn red-btn'; btn.type = 'button'; btn.textContent = 'Sao chép số tài khoản';
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(a.number); btn.textContent = 'Đã sao chép ✓'; }
        catch { btn.textContent = a.number; }
        setTimeout(() => (btn.textContent = 'Sao chép số tài khoản'), 2000);
      });
      d.append(h, img, p1, p2, p3, btn); accs.appendChild(d);
    });
    $('#giftBtn').addEventListener('click', e => {
      const b = e.currentTarget;
      if (b.classList.contains('open')) return;
      b.classList.add('open'); $('#giftHint').hidden = true;
      const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + 30, 90);
      setTimeout(() => (accs.hidden = false), 450);
    });
  }

  /* ---------- Lời chúc bay ngang màn hình ---------- */
  const fly = document.createElement('div');
  fly.className = 'fly'; fly.setAttribute('aria-hidden', 'true');
  document.body.appendChild(fly);
  const FLY_MAX = 150, FLY_LANES = 3, FLY_GAP = 48;
  const laneFree = new Array(FLY_LANES).fill(0); // thời điểm mỗi hàng trống trở lại
  let flyIdx = 0;
  // Cắt lời chúc quá dài ở khoảng 150 ký tự, ưu tiên cắt tại khoảng trắng để không gãy chữ
  function shorten(msg) {
    if (msg.length <= FLY_MAX) return msg;
    const cut = msg.slice(0, FLY_MAX), sp = cut.lastIndexOf(' ');
    return (sp > FLY_MAX - 25 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?-]+$/, '') + '…';
  }
  function flyWish() {
    if (document.hidden || !wishPool.length || !lb.hidden) return false;
    // Chỉ bay vào hàng đã trống: đuôi lời trước phải vào hẳn màn hình rồi mới tới lời sau
    const now = performance.now(), lane = laneFree.findIndex(t => t <= now);
    if (lane < 0) return false;
    const w = wishPool[flyIdx++ % wishPool.length];
    const el = document.createElement('div'); el.className = 'fly-item';
    const b = document.createElement('b'); b.textContent = w.name + ': ';
    el.append(b, shorten(String(w.message).replace(/\s+/g, ' ').trim()));
    el.style.top = `calc(9% + ${lane * 36}px)`;
    el.style.visibility = 'hidden';
    el.addEventListener('animationend', () => el.remove());
    fly.appendChild(el);
    // Tốc độ trôi cố định (~55px/giây): lời chúc dài thì bay lâu hơn chứ không nhanh hơn
    const width = el.offsetWidth, dur = Math.max(11, (W + width) / 55), speed = (W + width) / dur;
    laneFree[lane] = now + (width + FLY_GAP) / speed * 1000;
    el.style.setProperty('--dur', dur + 's');
    el.style.visibility = '';
    return true;
  }
  // Lời đầu tiên bay ra 5 giây sau khi mở thiệp (chờ thêm nếu lời chúc chưa tải xong),
  // sau đó 10 giây một lời; nếu chưa bay được (hàng còn bận, khách rời tab...) thì thử lại sau 1 giây
  function startFly() {
    if (reduced) return;
    setTimeout(function tick() { setTimeout(tick, flyWish() ? 10000 : 1000); }, 5000);
  }

  /* ---------- Pháo hoa ở phần kết ---------- */
  const thanks = $('.thanks');
  let fwTimer = null;
  new IntersectionObserver(es => {
    clearInterval(fwTimer);
    if (!es[0].isIntersecting || reduced) return;
    fwTimer = setInterval(() => {
      if (document.hidden) return;
      const r = thanks.getBoundingClientRect();
      const top = Math.max(r.top, 0), bot = Math.min(r.bottom, H);
      firework(rnd(r.left + 30, r.right - 30), rnd(top + 20, top + (bot - top) * .55));
    }, 850);
  }, { threshold: .2 }).observe(thanks);
  thanks.addEventListener('click', e => firework(e.clientX, e.clientY));

  /* ---------- Tim bay ---------- */
  function flyHeart(x, y) {
    const h = document.createElement('span');
    h.className = 'heart'; h.textContent = '❤';
    h.style.left = x - 10 + 'px'; h.style.top = y - 14 + 'px';
    h.style.setProperty('--dx', rnd(-30, 30) + 'px');
    h.addEventListener('animationend', () => h.remove());
    document.body.appendChild(h);
  }
  document.addEventListener('click', e => {
    if (reduced || e.target.closest('button, a, input, textarea, select, label, .lb, .cover, .show, .zoomable, .thanks')) return;
    flyHeart(e.clientX, e.clientY);
  });

  /* ---------- Nút thả tim + bộ đếm chung ---------- */
  const love = $('#love'), loveN = $('#loveN'), LSH = LS + '-tim';
  // pending: tim đã bấm nhưng chưa gửi (lưu lại trên máy để không mất khi khách rời trang)
  // sending: tim đang trên đường gửi lên máy chủ
  const LSP = LSH + '-cho';
  let total = 0, pending = 0, sending = 0, flushT = null;
  try { total = +localStorage.getItem(LSH) || 0; pending = CFG.sheetUrl ? +localStorage.getItem(LSP) || 0 : 0; } catch {}
  const showLove = () => (loveN.textContent = total.toLocaleString('vi-VN'));
  const savePending = () => { try { localStorage.setItem(LSP, pending); } catch {} };
  function flush() {
    clearTimeout(flushT); flushT = null;
    if (!pending || !CFG.sheetUrl) return;
    const n = Math.min(pending, 50); // Apps Script nhận tối đa 50 tim mỗi lần
    pending -= n; sending += n; savePending();
    fetch(CFG.sheetUrl, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'heart', n }) })
      .catch(() => { pending += n; savePending(); })
      .finally(() => (sending -= n));
    if (pending) flushT = setTimeout(flush, 300);
  }
  showLove();
  if (CFG.sheetUrl) {
    // Apps Script bản cũ trả về mảng lời chúc: khi đó giữ số đếm riêng trên máy
    fetch(CFG.sheetUrl + '?type=hearts').then(r => r.json()).then(d => {
      if (d && typeof d.hearts === 'number') { total = d.hearts + pending + sending; showLove(); }
      flush(); // gửi nốt tim còn sót từ lần trước
    }).catch(() => {});
    addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  }
  love.addEventListener('click', () => {
    total++; showLove();
    try { localStorage.setItem(LSH, (+localStorage.getItem(LSH) || 0) + 1); } catch {}
    if (CFG.sheetUrl) { pending++; savePending(); if (!flushT) flushT = setTimeout(flush, 600); }
    const r = love.getBoundingClientRect();
    if (!reduced) for (let i = 0; i < 3; i++) setTimeout(() => flyHeart(r.left + r.width / 2 + rnd(-12, 12), r.top), i * 90);
    love.classList.remove('pop'); void love.offsetWidth; love.classList.add('pop');
  });
})();
