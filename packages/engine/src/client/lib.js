// Nạp thư viện nặng khi cần, ghim phiên bản cố định. Không bao giờ nạp trước khi bìa đã hiện.
//   const { gsap, ScrollTrigger } = await lib('scroll');
// prefetch(name) tải sẵn vào bộ nhớ đệm (không chạy) trong lúc khách đang nhìn bìa.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/';
const FILES = {
  gsap: [CDN + 'gsap.min.js'],
  scroll: [CDN + 'gsap.min.js', CDN + 'ScrollTrigger.min.js'],
};
const loaded = new Map();

function script(src) {
  if (!loaded.has(src)) loaded.set(src, new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = false; s.crossOrigin = 'anonymous';
    s.onload = res; s.onerror = () => { loaded.delete(src); rej(new Error('Không tải được ' + src)); };
    document.head.append(s);
  }));
  return loaded.get(src);
}

export async function lib(name) {
  const files = FILES[name];
  if (!files) throw new Error('Không có thư viện ' + name);
  for (const f of files) await script(f); // giữ thứ tự: gsap trước plugin
  const { gsap, ScrollTrigger } = window;
  if (ScrollTrigger && gsap && !gsap.core.globals().ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

export function prefetch(name) {
  for (const href of FILES[name] || []) {
    if (document.querySelector(`link[rel=prefetch][href="${href}"]`) || loaded.has(href)) continue;
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.as = 'script'; l.href = href; l.crossOrigin = 'anonymous';
    document.head.append(l);
  }
}
