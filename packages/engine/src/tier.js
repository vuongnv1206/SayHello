// Chọn mức chuyển động cho máy đang xem thiệp:
//   cinematic  WebGL, ghim cảnh nặng, hậu kỳ (máy mạnh)
//   standard   GSAP + ScrollTrigger, CSS 3D, không WebGL
//   lite       CSS nhẹ, không ghim cảnh (máy yếu, tiết kiệm dữ liệu, người bật giảm chuyển động)
// pickMotion là hàm thuần (kiểm tra được trên Node); detectSignals/measureFps chỉ chạy trong trình duyệt.
export const MOTION = ['cinematic', 'standard', 'lite'];

export function pickMotion(s = {}) {
  if (MOTION.includes(s.override)) return s.override;
  if (s.reducedMotion || s.saveData) return 'lite';
  // < 20fps mới coi là máy yếu: màn 30Hz (tiết kiệm pin, iPhone Low Power Mode) vẫn đủ cho standard
  if (s.fps != null && s.fps < 20) return 'lite';
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
  try {
    const gl = win.document?.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    webgl2 = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // trả ngữ cảnh thử ngay, WebView giới hạn số ngữ cảnh
  } catch {}
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

// Đo sức máy lúc khách đang nhìn bìa (bìa là HTML/CSS nhẹ). Dùng trung vị khoảng cách giữa các khung, bỏ vài
// khung đầu: một lần khựng do font/ảnh bìa đang tải không được kéo số đo xuống như cách đếm khung.
export function measureFps(ms = 600, win = globalThis) {
  return new Promise(res => {
    if (!win.requestAnimationFrame) return res(null);
    const gaps = []; let prev = null, skip = 3; const t0 = win.performance.now();
    const tick = t => {
      if (prev != null && skip-- <= 0) gaps.push(t - prev);
      prev = t;
      if (t - t0 < ms || gaps.length < 8) return void win.requestAnimationFrame(tick);
      gaps.sort((a, b) => a - b);
      res(Math.round(1000 / Math.max(1, gaps[gaps.length >> 1])));
    };
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
