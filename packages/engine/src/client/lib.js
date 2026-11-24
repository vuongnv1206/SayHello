// Nạp thư viện nặng khi cần, ghim phiên bản cố định. Không bao giờ nạp trước khi bìa đã hiện.
//   const { gsap, ScrollTrigger } = await lib('scroll');
//   const { THREE } = await lib('three');
//   const { THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = await lib('three-post');
//   const { Lenis } = await lib('lenis');
// prefetch(name) tải sẵn vào bộ nhớ đệm (không chạy) trong lúc khách đang nhìn bìa.
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/';
const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
const LENIS_URL = 'https://cdn.jsdelivr.net/npm/lenis@1.3.28/dist/lenis.mjs';

const FILES = {
  gsap: [CDN + 'gsap.min.js'],
  scroll: [CDN + 'gsap.min.js', CDN + 'ScrollTrigger.min.js'],
};

const PRELOAD = {
  three: [THREE_CDN + 'build/three.module.min.js'],
  'three-post': [
    THREE_CDN + 'build/three.module.min.js',
    THREE_CDN + 'examples/jsm/environments/RoomEnvironment.js',
    THREE_CDN + 'examples/jsm/postprocessing/EffectComposer.js',
    THREE_CDN + 'examples/jsm/postprocessing/RenderPass.js',
    THREE_CDN + 'examples/jsm/postprocessing/UnrealBloomPass.js',
    THREE_CDN + 'examples/jsm/postprocessing/OutputPass.js',
  ],
  lenis: [LENIS_URL],
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

function esm(spec) {
  if (!loaded.has(spec)) {
    loaded.set(spec, import(spec).catch(() => {
      loaded.delete(spec);
      throw new Error('Không tải được ' + spec);
    }));
  }
  return loaded.get(spec);
}

const ESM = {
  three: async () => ({ THREE: await esm('three') }),
  'three-post': async () => {
    const [THREE, { RoomEnvironment }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      esm('three'),
      esm('three/addons/environments/RoomEnvironment.js'),
      esm('three/addons/postprocessing/EffectComposer.js'),
      esm('three/addons/postprocessing/RenderPass.js'),
      esm('three/addons/postprocessing/UnrealBloomPass.js'),
      esm('three/addons/postprocessing/OutputPass.js'),
    ]);
    return { THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass };
  },
  lenis: async () => {
    const mod = await esm(LENIS_URL);
    return { Lenis: mod.default ?? mod.Lenis };
  },
};

export async function lib(name) {
  if (ESM[name]) return ESM[name]();
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
  for (const href of PRELOAD[name] || []) {
    if (document.querySelector(`link[rel=modulepreload][href="${href}"]`) || loaded.has(href)) continue;
    const l = document.createElement('link');
    l.rel = 'modulepreload'; l.href = href; l.crossOrigin = 'anonymous';
    document.head.append(l);
  }
}
