// Khởi động thiệp trong trình duyệt. HTML đã được máy chủ dựng sẵn (render.js); ở đây chỉ gắn hành vi:
// điền tên khách, chọn mức chuyển động, gắn dịch vụ, gọi mount của từng cảnh, xử lý bìa (gate).
import { pickMotion, detectSignals, measureFps } from '../tier.js';
import { createVoice } from '../voice.js';
import { createBackend } from './backend.js';
import { bindServices } from './services.js';
import { lib, prefetch } from './lib.js';

function guestName() {
  const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.slice(1));
  return (q.get('k') || q.get('khach') || h.get('k') || h.get('khach') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export async function boot(theme) {
  const root = document.documentElement;
  const data = JSON.parse(document.getElementById('sh-data')?.textContent || '{}');
  const params = new URLSearchParams(location.search);
  const say = createVoice(data.voice, data.voiceText);
  const guest = guestName();

  // Tên khách: chỉ đổi chữ hiển thị (textContent), không bao giờ chèn HTML từ đường dẫn
  document.querySelectorAll('[data-guest]').forEach(el => { el.textContent = guest || el.dataset.fallback || ''; });
  if (guest) document.querySelectorAll('[data-guest-value]').forEach(el => { if (!el.value) el.value = guest; });

  const signals = detectSignals(window);
  let motion = pickMotion(signals);
  root.dataset.motion = motion;

  const listeners = {};
  const ctx = {
    theme, data, say, guest, lib, root,
    get motion() { return motion; },
    get reduced() { return motion === 'lite'; },
    wishes: [],
    backend: createBackend({ sheetUrl: data.sheetUrl, slug: data.slug }),
    on(ev, fn) { (listeners[ev] ||= []).push(fn); },
    emit(ev, x) { (listeners[ev] || []).forEach(fn => { try { fn(x); } catch (e) { console.error(e); } }); },
    scene: id => document.getElementById(id),
    open: () => openInvite(false),
    opened: false,
  };
  window.__sayhello = ctx; // để kiểm tra tự động và gỡ lỗi

  bindServices(document, ctx);
  ctx.backend.wishes().then(list => { ctx.wishes.splice(0, ctx.wishes.length, ...list); ctx.emit('wishes', ctx.wishes); });

  // Gắn từng cảnh. Lỗi ở một cảnh không được làm hỏng cả thiệp.
  const scenes = theme.scenes.map(s => ({ def: s, el: document.getElementById(s.id) })).filter(x => x.el);
  for (const { def, el } of scenes) {
    try { def.mount?.(el, ctx); } catch (e) { console.error(`[thiệp] cảnh ${def.id}:`, e); }
  }

  const gate = scenes.find(x => x.def.kind === 'gate');
  // Đo sức máy trong lúc khách nhìn bìa; chỉ được hạ mức, không nâng (tránh nhảy giao diện)
  if (gate && motion !== 'lite' && !signals.override) {
    measureFps(600, window).then(fps => {
      const m = pickMotion({ ...signals, fps });
      if (!ctx.opened && ['cinematic', 'standard', 'lite'].indexOf(m) > ['cinematic', 'standard', 'lite'].indexOf(motion)) { motion = m; root.dataset.motion = m; }
    });
  }
  if (motion !== 'lite') {
    const warm = () => theme.libs?.forEach(prefetch);
    'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 1500 }) : setTimeout(warm, 800);
  }

  // Chuyển động theo mức máy: chỉ chạy sau khi thiệp đã mở (bìa luôn là HTML/CSS nhẹ)
  async function runMotion() {
    for (const { def, el } of scenes) {
      const m = def.motion?.[motion] ?? def.motion?.standard;
      if (typeof m !== 'function') continue;
      try { await m.call(def.motion, el, ctx); } catch (e) { console.error(`[thiệp] chuyển động cảnh ${def.id}:`, e); }
    }
  }

  function openInvite(instant) {
    if (ctx.opened) return;
    ctx.opened = true;
    root.classList.remove('sh-locked');
    root.classList.add('sh-open');
    if (gate) {
      gate.el.classList.add('is-open');
      gate.el.setAttribute('aria-hidden', 'true');
      const hide = () => { gate.el.hidden = true; };
      instant || motion === 'lite' ? hide() : setTimeout(hide, theme.gateMs ?? 900);
    }
    document.querySelector('.sh-scene')?.focus?.({ preventScroll: true });
    ctx.emit('open', { instant });
    runMotion();
  }

  if (!gate || params.get('open') === '1') openInvite(true);
  root.classList.add('sh-ready');
  return ctx;
}
