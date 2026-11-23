// Lớp hiệu ứng hạt trên canvas toàn màn hình: hạt bay nền, pháo giấy, pháo hoa.
// Mẫu thiệp chọn kiểu hạt và bảng màu; invite.json có thể ghi đè trong "effects".
import { reduced, rnd, pick } from './util.js';

const DEFAULT_COLORS = {
  petals: ['#ffb3c1', '#ff8fa3', '#ffccd5', '#f28482', '#e5383b'],
  sparkles: ['#ffe9a8', '#fff3cf'],
  snow: ['#ffffff', '#eef4ff'],
  hearts: ['#ff4d6d', '#ff8fa3', '#ffccd5'],
  leaves: ['#e6c27a', '#c9983f', '#f6dfa6'],
  bokeh: ['#fff3cf', '#ffd6a5', '#ffc8dd'],
  confetti: ['#e6c27a', '#fff3cf', '#e5383b', '#ffffff', '#ffb703'],
  fireworks: ['#ffd166', '#fff3cf', '#ff6b6b', '#ff9ebb', '#ffb703'],
};

export function createFx({ ambient = ['petals', 'sparkles'], colors = {}, density = 1, avoidPointer = true } = {}) {
  const C = { ...DEFAULT_COLORS, ...colors };
  const kinds = (Array.isArray(ambient) ? ambient : [ambient]).filter(Boolean);
  const cv = document.createElement('canvas');
  cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
  Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 90 });
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [], started = false;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Một hạt bay nền. top=true: sinh ra ở mép trên màn hình
  function make(kind, top) {
    const base = { k: kind, x: rnd(0, W), y: top ? -20 : rnd(0, H), ph: rnd(0, 6.3), px: 0, py: 0, rot: rnd(0, 6.3), c: pick(C[kind] || C.petals) };
    switch (kind) {
      case 'sparkles': return { ...base, vx: rnd(-.15, .15), vy: rnd(.2, .6), r: rnd(1, 2.4) };
      case 'snow': return { ...base, vx: rnd(-.3, .3), vy: rnd(.4, 1.1), r: rnd(1.2, 3.4) };
      case 'hearts': return { ...base, y: top ? H + 20 : rnd(0, H), vx: rnd(-.2, .2), vy: -rnd(.4, 1), r: rnd(6, 12), vr: rnd(-.01, .01) };
      case 'leaves': return { ...base, vx: rnd(-.4, .6), vy: rnd(.6, 1.3), r: rnd(5, 9), vr: rnd(-.04, .04) };
      case 'bokeh': return { ...base, vx: rnd(-.12, .12), vy: -rnd(.08, .3), r: rnd(8, 26), a: rnd(.08, .22) };
      default: return { ...base, k: 'petals', vx: rnd(-.3, .5), vy: rnd(.5, 1.4), r: rnd(5, 10), vr: rnd(-.03, .03) };
    }
  }

  const ptr = { x: -999, y: -999, t: 0 };
  if (avoidPointer) {
    const track = (x, y) => { ptr.x = x; ptr.y = y; ptr.t = performance.now(); };
    addEventListener('pointermove', e => track(e.clientX, e.clientY), { passive: true });
    addEventListener('pointerdown', e => track(e.clientX, e.clientY), { passive: true });
  }

  function heartPath(r) {
    ctx.beginPath(); ctx.moveTo(0, r * .3);
    ctx.bezierCurveTo(-r, -r * .4, -r * .5, -r, 0, -r * .45);
    ctx.bezierCurveTo(r * .5, -r, r, -r * .4, 0, r * .3); ctx.closePath();
  }

  function drawAmbient(p, hot) {
    p.ph += .02;
    p.x += p.vx + Math.sin(p.ph) * (p.k === 'bokeh' ? .15 : .5); p.y += p.vy;
    if (p.y > H + 30 || p.y < -40) { Object.assign(p, make(p.k, true)); if (p.k === 'bokeh' || p.k === 'hearts') p.y = H + 30; return; }
    if (hot && p.k !== 'bokeh') {
      const dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
      if (d2 < 12100 && d2 > 1) { const d = Math.sqrt(d2), f = (110 - d) / 110 * 1.6; p.px += dx / d * f; p.py += dy / d * f; }
    }
    p.x += p.px; p.y += p.py; p.px *= .92; p.py *= .92;
    ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = p.c;
    switch (p.k) {
      case 'sparkles':
        ctx.globalAlpha = .35 + .65 * Math.abs(Math.sin(p.ph * 2));
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill(); break;
      case 'snow':
        ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill(); break;
      case 'bokeh': {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r);
        g.addColorStop(0, p.c); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = p.a * (.6 + .4 * Math.sin(p.ph)); ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.3); ctx.fill(); break;
      }
      case 'hearts':
        p.rot += p.vr; ctx.rotate(Math.sin(p.ph) * .3); ctx.globalAlpha = .7; heartPath(p.r); ctx.fill(); break;
      case 'leaves':
        p.rot += p.vr; ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.ph)); ctx.globalAlpha = .85;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .42, 0, 0, 6.3); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(-p.r, 0); ctx.lineTo(p.r, 0); ctx.stroke(); break;
      default: // cánh hoa
        p.rot += p.vr; ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.ph)); ctx.globalAlpha = .8;
        ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.bezierCurveTo(p.r, -p.r, p.r, p.r * .6, 0, p.r);
        ctx.bezierCurveTo(-p.r, p.r * .6, -p.r, -p.r, 0, -p.r); ctx.fill();
    }
    ctx.restore();
  }

  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden || !parts.length) return;
    ctx.clearRect(0, 0, W, H);
    const hot = performance.now() - ptr.t < 1200;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.k === 'confetti') {
        p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (--p.life < 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40); ctx.fillStyle = p.c;
        if (p.heart) { heartPath(p.w); ctx.fill(); } else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else if (p.k === 'spark') {
        p.vx *= .965; p.vy = p.vy * .965 + .045; p.x += p.vx; p.y += p.vy;
        if (--p.life < 0) { parts.splice(i, 1); continue; }
        const a = p.life / p.max;
        ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath();
        ctx.arc(p.x, p.y, .6 + 2.2 * a, 0, 6.3); ctx.fill(); ctx.globalAlpha = 1;
      } else drawAmbient(p, hot);
    }
  }
  resize(); addEventListener('resize', resize); requestAnimationFrame(frame);

  return {
    canvas: cv,
    get width() { return W; },
    get height() { return H; },
    start() {
      if (started || reduced) return;
      started = true;
      const n = Math.round((W < 500 ? 20 : 34) * density);
      kinds.forEach((k, i) => { for (let j = 0; j < (i ? n / 2 : n); j++) parts.push(make(k, false)); });
    },
    // Pháo giấy bung tại (x, y). hearts=true: pháo giấy hình trái tim
    burst(x, y, n = 90, { colors = C.confetti, hearts = false } = {}) {
      if (reduced) return;
      for (let i = 0; i < n; i++) {
        const a = rnd(0, Math.PI * 2), v = rnd(3, 13);
        parts.push({ k: 'confetti', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: rnd(5, 10), h: rnd(3, 6),
          rot: rnd(0, 6.3), vr: rnd(-.3, .3), life: rnd(90, 160), c: pick(colors), heart: hearts && Math.random() < .5 });
      }
    },
    firework(x, y, colors = C.fireworks) {
      if (reduced) return;
      const c = pick(colors), n = W < 500 ? 46 : 70;
      for (let i = 0; i < n; i++) {
        const a = rnd(0, Math.PI * 2), v = rnd(1, 5.2);
        parts.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(45, 75), max: 75, c: Math.random() < .25 ? '#ffffff' : c });
      }
    },
    burstAt(el, n, opts) { const r = el.getBoundingClientRect(); this.burst(r.left + r.width / 2, r.top + r.height / 3, n, opts); },
  };
}
