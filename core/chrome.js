// Các thành phần nổi trên mọi thiệp: nhạc nền, nút thả tim, lời chúc bay ngang,
// tim bay khi chạm, thanh tiến độ cuộn, xem ảnh toàn màn hình, lời cảm ơn sau khi gửi lời chúc.
import { $, $$, reduced, rnd, replay } from './util.js';

export function createLightbox(ctx) {
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true;
  lb.innerHTML = '<button class="lb-x" aria-label="Đóng">×</button><button class="lb-p" aria-label="Ảnh trước">‹</button><img alt=""><button class="lb-n" aria-label="Ảnh sau">›</button><span class="lb-c"></span>';
  document.body.appendChild(lb);
  const img = $('img', lb);
  let list = ctx.album, idx = 0;
  const show = i => { idx = (i + list.length) % list.length; img.src = list[idx]; $('.lb-c', lb).textContent = list.length > 1 ? `${idx + 1} / ${list.length}` : ''; };
  const api = {
    el: lb,
    get open_() { return !lb.hidden; },
    open(i = 0, custom) { list = custom || ctx.album; if (!list.length) return; show(i); lb.hidden = false; $$('.lb-p, .lb-n', lb).forEach(b => (b.hidden = list.length < 2)); },
    close() { lb.hidden = true; },
  };
  $('.lb-x', lb).addEventListener('click', api.close);
  $('.lb-p', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-n', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) api.close(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') api.close();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let sx = null;
  lb.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1)); });
  return api;
}

export function createChrome(ctx) {
  const fx = ctx.fx, eff = ctx.data.effects || {};
  const api = {};

  /* ---------- Thanh tiến độ cuộn ---------- */
  if (eff.progress !== false) {
    const p = document.createElement('div'); p.className = 'progress'; p.setAttribute('aria-hidden', 'true'); p.innerHTML = '<i></i>';
    document.body.appendChild(p);
    const bar = p.firstChild; let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%'; ticking = false; });
    }, { passive: true });
  }

  /* ---------- Nhạc nền ---------- */
  let audio = null;
  const musicBtn = document.createElement('button');
  musicBtn.className = 'music'; musicBtn.hidden = true; musicBtn.setAttribute('aria-label', 'Bật hoặc tắt nhạc'); musicBtn.innerHTML = '<span>♪</span>';
  document.body.appendChild(musicBtn);
  if (ctx.data.music) {
    const m = ctx.data.music; // ../assets/... tính từ gốc web chính, không từ địa chỉ thiệp
    audio = new Audio(m.startsWith('../assets/') ? new URL(m.slice(3), ctx.root).href : m);
    audio.loop = true; audio.preload = 'none'; audio.volume = .7;
    audio.addEventListener('play', () => musicBtn.classList.add('on'));
    audio.addEventListener('pause', () => musicBtn.classList.remove('on'));
    audio.addEventListener('error', () => (musicBtn.hidden = true));
    musicBtn.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
    let was = false;
    document.addEventListener('visibilitychange', () => { if (document.hidden) { was = !audio.paused; audio.pause(); } else if (was) audio.play().catch(() => {}); });
  }

  /* ---------- Nút thả tim + bộ đếm chung ---------- */
  const love = document.createElement('button');
  love.className = 'love'; love.hidden = true; love.setAttribute('aria-label', 'Thả tim'); love.innerHTML = '<span>❤</span><b>0</b>';
  document.body.appendChild(love);
  if (eff.loveButton !== false) {
    const n = $('b', love), LSH = ctx.backend.storageKey + ':tim', LSP = LSH + ':cho', online = ctx.backend.online;
    let total = 0, pending = 0, sending = 0, flushT = null;
    try { total = +localStorage.getItem(LSH) || 0; pending = online ? +localStorage.getItem(LSP) || 0 : 0; } catch {}
    const show = () => (n.textContent = total.toLocaleString('vi-VN'));
    const save = () => { try { localStorage.setItem(LSP, pending); } catch {} };
    const flush = () => {
      clearTimeout(flushT); flushT = null;
      if (!pending || !online) return;
      const k = Math.min(pending, 50); // Apps Script nhận tối đa 50 tim mỗi lần
      pending -= k; sending += k; save();
      ctx.backend.sendHearts(k).catch(() => { pending += k; save(); }).finally(() => (sending -= k));
      if (pending) flushT = setTimeout(flush, 300);
    };
    show();
    if (online) {
      ctx.backend.hearts().then(h => { if (h !== null) { total = h + pending + sending; show(); } flush(); });
      addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
    }
    love.addEventListener('click', () => {
      total++; show();
      try { localStorage.setItem(LSH, (+localStorage.getItem(LSH) || 0) + 1); } catch {}
      if (online) { pending++; save(); if (!flushT) flushT = setTimeout(flush, 600); }
      const r = love.getBoundingClientRect();
      if (!reduced) for (let i = 0; i < 3; i++) setTimeout(() => flyHeart(r.left + r.width / 2 + rnd(-12, 12), r.top), i * 90);
      replay(love, 'pop');
    });
  }

  /* ---------- Tim bay khi chạm vào thiệp ---------- */
  function flyHeart(x, y) {
    const h = document.createElement('span');
    h.className = 'heart'; h.textContent = eff.tapSymbol || '❤';
    h.style.left = x - 10 + 'px'; h.style.top = y - 14 + 'px';
    h.style.setProperty('--dx', rnd(-30, 30) + 'px');
    h.addEventListener('animationend', () => h.remove());
    document.body.appendChild(h);
  }
  api.flyHeart = flyHeart;
  if (eff.tapHearts !== false) {
    document.addEventListener('click', e => {
      if (reduced || e.target.closest('button, a, input, textarea, select, label, canvas, .lb, .cover, .show, .polas, [data-zoom], [data-fireworks], [data-w]')) return;
      flyHeart(e.clientX, e.clientY);
    });
  }

  /* ---------- Lời chúc bay ngang màn hình ---------- */
  function startFly() {
    if (reduced || eff.flyingWishes === false) return;
    const fly = document.createElement('div'); fly.className = 'fly'; fly.setAttribute('aria-hidden', 'true');
    document.body.appendChild(fly);
    const MAX = 150, LANES = 3, GAP = 48, free = new Array(LANES).fill(0);
    let i = 0;
    const shorten = m => { if (m.length <= MAX) return m; const cut = m.slice(0, MAX), sp = cut.lastIndexOf(' '); return (sp > MAX - 25 ? cut.slice(0, sp) : cut).replace(/[\s,.;:!?-]+$/, '') + '…'; };
    const one = () => {
      if (document.hidden || !ctx.wishes.length || !ctx.lightbox.el.hidden) return false;
      const now = performance.now(), lane = free.findIndex(t => t <= now);
      if (lane < 0) return false;
      const w = ctx.wishes[i++ % ctx.wishes.length];
      const el = document.createElement('div'); el.className = 'fly-item';
      const b = document.createElement('b'); b.textContent = w.name + ': ';
      el.append(b, shorten(String(w.message).replace(/\s+/g, ' ').trim()));
      el.style.top = `calc(9% + ${lane * 36}px)`; el.style.visibility = 'hidden';
      el.addEventListener('animationend', () => el.remove());
      fly.appendChild(el);
      // tốc độ cố định ~55px/giây: lời dài bay lâu hơn chứ không nhanh hơn
      const Wd = innerWidth, width = el.offsetWidth, dur = Math.max(11, (Wd + width) / 55), speed = (Wd + width) / dur;
      free[lane] = now + (width + GAP) / speed * 1000;
      el.style.setProperty('--dur', dur + 's'); el.style.visibility = '';
      return true;
    };
    setTimeout(function tick() { setTimeout(tick, one() ? 10000 : 1000); }, 5000);
  }

  /* ---------- Lời cảm ơn + cụng ly sau khi gửi lời chúc ---------- */
  api.cheers = name => {
    $('.cheers')?.remove();
    const el = document.createElement('div');
    el.className = 'cheers'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Lời cảm ơn');
    el.innerHTML = `<div class="cheers-card"><div class="glasses" aria-hidden="true"><i class="glass l"><b></b><s></s></i><i class="glass r"><b></b><s></s></i><span class="clink">✨</span></div>
      <h3></h3><p>Lời chúc của quý khách là món quà quý giá với chúng tôi. Xin mời cùng nâng ly chúc mừng!</p><p class="cheers-sign"></p><button class="btn" type="button">Đóng</button></div>`;
    $('h3', el).textContent = 'Cảm ơn ' + name + '!';
    $('.cheers-sign', el).textContent = ctx.names.pair;
    const btn = $('button', el);
    btn.className = ctx.theme.cheersButton || 'btn';
    const close = () => { clearTimeout(t); el.classList.add('out'); setTimeout(() => el.remove(), 400); };
    const t = setTimeout(close, 9000);
    el.addEventListener('click', e => { if (e.target === el || e.target === btn) close(); });
    document.body.appendChild(el);
    setTimeout(() => { if (!el.isConnected) return; const r = $('.glasses', el).getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top + r.height * .3, 110); }, 850);
  };

  api.onOpen = () => {
    if (audio) musicBtn.hidden = false;
    if (eff.loveButton !== false) love.hidden = false;
    startFly();
  };
  // iOS chỉ cho phát nhạc ngay trong cử chỉ chạm. Một số mẫu mở bìa sau một khoảng chờ,
  // nên mở khóa trước (phát tắt tiếng) ở lần chạm đầu, tới lúc mở thiệp thì bật tiếng.
  let unlocked = false;
  api.unlockMusic = () => {
    if (!audio || unlocked || document.body.classList.contains('opened')) return; unlocked = true;
    audio.muted = true; audio.play().catch(() => {});
  };
  api.playMusic = () => {
    if (!audio) return;
    if (unlocked) { audio.muted = false; audio.currentTime = 0; }
    audio.play().catch(() => {});
  };
  return api;
}
