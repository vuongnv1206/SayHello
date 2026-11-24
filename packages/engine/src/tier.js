// Chọn mức chuyển động cho máy đang xem thiệp:
//   cinematic  WebGL, ghim cảnh nặng, hậu kỳ (máy mạnh)
//   standard   GSAP + ScrollTrigger, CSS 3D, không WebGL
//   lite       CSS nhẹ, không ghim cảnh (máy yếu, tiết kiệm dữ liệu, người bật giảm chuyển động)
// pickMotion là hàm thuần (kiểm tra được trên Node); detectSignals/measureFps chỉ chạy trong trình duyệt.
export const MOTION = ['cinematic', 'standard', 'lite'];

export function pickMotion(s = {}) {
  if (MOTION.includes(s.override)) return s.override;
  if (s.reducedMotion || s.saveData) return 'lite';
  if (s.fps != null && s.fps < 30) return 'lite';
  const mem = s.deviceMemory ?? 4, cores = s.cores ?? 4;
  if (mem < 2 || cores < 4) return 'lite';
  if (s.fps != null && s.fps < 45) return 'standard';
  // WebView của Zalo/Messenger hay mất ngữ cảnh WebGL khi chuyển app: chỉ cho cinematic khi máy dư sức
  const strong = s.webgl2 && mem >= 4 && cores >= (s.inApp ? 6 : 4);
  return strong ? 'cinematic' : 'standard';
}

export function detectSignals(win = globalThis) {
  const nav = win.navigator || {}, ua = nav.userAgent || '';
  let webgl2 = false;
  try { webgl2 = !!win.document?.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true }); } catch {}
  let override = null;
  try { override = new URLSearchParams(win.location?.search || '').get('tier'); } catch {}
  return {
    override,
    reducedMotion: !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    saveData: !!nav.connection?.saveData,
    deviceMemory: nav.deviceMemory,
    cores: nav.hardwareConcurrency,
    webgl2,
    inApp: /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//i.test(ua),
  };
}

// Đếm khung hình trong một khoảng ngắn lúc khách đang nhìn bìa (bìa là HTML/CSS nhẹ nên số đo phản ánh sức máy)
export function measureFps(ms = 600, win = globalThis) {
  return new Promise(res => {
    if (!win.requestAnimationFrame) return res(null);
    let n = 0; const t0 = win.performance.now();
    const tick = t => { n++; if (t - t0 < ms) win.requestAnimationFrame(tick); else res(Math.round(n * 1000 / (t - t0))); };
    win.requestAnimationFrame(tick);
  });
}

// Lắng nghe mất ngữ cảnh WebGL trên canvas (hay gặp trên WebView Zalo/Messenger khi chuyển app).
// Gọi preventDefault() và kích hoạt callback hạ cấp; trả về hàm hủy đăng ký (an toàn trên Node).
export function bindContextLoss(canvas, onLost) {
  if (!canvas?.addEventListener) return () => {};
  const handler = e => { e.preventDefault?.(); onLost?.(e); };
  canvas.addEventListener('webglcontextlost', handler);
  return () => canvas.removeEventListener('webglcontextlost', handler);
}
