// Hạ tầng dùng chung cho các mẫu thiệp 3D (Phòng Triển Lãm, Hồ Gương, Bầu Trời Ảnh...).
// Mẫu chỉ lo phần "nghệ thuật" (cảnh, ánh sáng, camera, tương tác); những việc dễ sai đều nằm ở đây:
//   - nạp three.js + addons có hẹn giờ (mạng chậm thì rơi về bản phẳng, không kẹt màn chờ)
//   - tạo renderer, từ chối GPU phần mềm (SwiftShader/llvmpipe) trừ khi đang chụp kiểm tra (?snap)
//   - vòng đời: listener tự gỡ, dọn GPU, một vòng vẽ duy nhất, dừng khi tab ẩn, vẽ theo nhu cầu
//   - tải ảnh: giải mã ngoài luồng chính, thu về <= maxTex, mỗi khung hình chỉ đưa một ảnh lên GPU
//   - hậu kỳ: bloom (chỉ thứ phát sáng) + chỉnh màu an toàn cho ảnh cưới; tự tắt khi FPS thấp
//   - chữ trong không gian: bản sao DOM của HTML máy chủ đặt vào CSS3DRenderer (sắc nét, đúng dấu)
//   - tiến trình cuộn theo các điểm dừng [data-stop]
// Không import three ở đầu file: chỉ nạp khi mẫu gọi loadThree() sau khi khách mở bìa.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = t => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
export const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
// Đèn bật có chớp (dùng chung cho động từ "rọi", "thắp")
export const flicker = t => t <= 0 ? 0 : t < .05 ? .9 : t < .11 ? .08 : t < .16 ? .7 : t < .22 ? .2 : clamp(.6 + (t - .22) * 3);

/** Nạp three + các addon thường dùng. Mạng chậm quá `ms` thì báo lỗi để mẫu chuyển về bản phẳng. */
export async function loadThree(ctx, { ms = 9000, extra = [] } = {}) {
  const [post, css3d, shaderPass, bgu, engine, ...more] = await withTimeout(Promise.all([
    ctx.lib('three-post'),
    import('three/addons/renderers/CSS3DRenderer.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
    import('@sayhello/engine'),
    ...extra.map(p => import(p)),
  ]), ms, 'tải thư viện 3D quá lâu');
  return { ...post, ...css3d, ...shaderPass, ...bgu, bindContextLoss: engine.bindContextLoss, extra: more };
}

/**
 * Tạo vòng đời cho một cảnh 3D. Mọi thứ đăng ký qua listen()/own() đều được gỡ/dọn trong teardown().
 * classes: các class trên <html> cần gỡ khi dọn (vd. 'ptl-3d', 'ptl-ready').
 */
export function createLife(root, classes = []) {
  const offs = [], disposers = [];
  const life = {
    alive: true,
    listen(t, type, fn, o) { t.addEventListener(type, fn, o); offs.push(() => t.removeEventListener(type, fn, o)); },
    own(fn) { disposers.push(fn); },
    teardown() {
      if (!life.alive) return;
      life.alive = false;
      offs.splice(0).forEach(f => { try { f(); } catch {} });
      disposers.splice(0).reverse().forEach(f => { try { f(); } catch {} });
      root.classList.remove(...classes);
    },
  };
  return life;
}

/** Renderer chung. Ném lỗi khi máy chỉ có GPU phần mềm (cảnh 3D sẽ giật), trừ khi snap. */
export function makeRenderer(THREE, canvas, { cine, coarse, snap, exposure = 1, life }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !cine || !coarse, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !snap });
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (!snap && /swiftshader|llvmpipe|software/i.test(gpu)) { renderer.dispose(); throw new Error('GPU phần mềm'); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cine ? 1.5 : 1));
  renderer.toneMapping = THREE.NeutralToneMapping; // giữ màu ảnh cưới trung thực hơn ACES
  renderer.toneMappingExposure = exposure;
  life?.own(() => renderer.dispose());
  return { renderer, gpu };
}

// Hai đoạn shader dùng ở cuối mọi ShaderMaterial: tone mapping + chuyển màu (đúng cả khi vẽ thẳng ra màn hình)
export const SHADER_TAIL = `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>`;

// Chỉnh màu an toàn cho ảnh: đường cong S nhẹ, vai sáng không cháy, chỉ vùng tối ngả lạnh, đen kiểu phim, hạt phim
export const GRADE = {
  uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uGrain: { value: .03 }, uVig: { value: .32 }, uAsp: { value: 1 }, uShadow: { value: [-.004, .006, .012] } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uGrain,uVig,uAsp; uniform vec3 uShadow; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
      c=mix(c,c*c*(3.-2.*c),.14);
      vec3 k=max(c-.82,0.); c=c-k+k/(1.+k*3.);
      float l=dot(c,vec3(.2126,.7152,.0722));
      c=mix(c+uShadow,c,smoothstep(.02,.18,l));
      c=vec3(.014,.016,.018)+c*.986;
      vec2 q=(vUv-.5)*vec2(uAsp,1.); c*=mix(1.,smoothstep(1.05,.3,length(q)),uVig);
      float nz=fract(sin(dot(vUv*vec2(1271.3,947.7)+fract(uT)*91.,vec2(12.9898,78.233)))*43758.5453);
      c+=(nz-.5)*uGrain*(.5+.5*(1.-l)); gl_FragColor=vec4(c,1.); }`,
};

/**
 * Hậu kỳ: RenderPass + bloom (ngưỡng cao: chỉ đèn/nguồn sáng loá) + OutputPass + chỉnh màu.
 * Trả về đối tượng có render(), setSize(), dispose(); null nếu không dùng (mức standard).
 */
export function createPost(T, renderer, scene, camera, { bloom = .4, threshold = 1.6, radius = .6, coarse, grade = {} } = {}) {
  const { THREE } = T;
  const ext = renderer.extensions;
  const type = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
  const composer = new T.EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type, samples: coarse ? 0 : 4 }));
  composer.addPass(new T.RenderPass(scene, camera));
  composer.addPass(new T.UnrealBloomPass(new THREE.Vector2(256, 256), bloom, radius, threshold));
  composer.addPass(new T.OutputPass());
  const gp = new T.ShaderPass({ ...GRADE, uniforms: THREE.UniformsUtils.clone(GRADE.uniforms) });
  for (const [k, v] of Object.entries(grade)) if (gp.uniforms[k]) gp.uniforms[k].value = v;
  composer.addPass(gp);
  return {
    composer, grade: gp,
    setSize(w, h) { composer.setSize(w, h); gp.uniforms.uAsp.value = w / h; },
    render(t) { gp.uniforms.uT.value = t; composer.render(); },
    dispose() { composer.dispose(); },
  };
}

/**
 * Tải ảnh cho WebGL: giải mã ngoài luồng chính (createImageBitmap, trừ WebKit iOS dùng canvas),
 * thu về tối đa maxTex px, rồi pump() mỗi khung hình đưa đúng một ảnh lên GPU (tránh giật).
 */
export function createPhotoLoader(THREE, renderer, { maxTex = 1024, life } = {}) {
  const ua = navigator.userAgent;
  const appleWebKit = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua));
  const ready = [], textures = [];
  async function decode(src) {
    if (!appleWebKit && 'createImageBitmap' in window) {
      try {
        const blob = await (await fetch(src)).blob();
        const probe = await createImageBitmap(blob);
        const s = Math.min(1, maxTex / Math.max(probe.width, probe.height));
        const w = Math.round(probe.width * s), h = Math.round(probe.height * s);
        probe.close?.();
        const bmp = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high', imageOrientation: 'flipY' });
        return { image: bmp, w, h, flipY: false };
      } catch {}
    }
    const im = new Image(); im.decoding = 'async'; im.crossOrigin = 'anonymous'; im.src = src; await im.decode();
    const s = Math.min(1, maxTex / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return { image: c, w: c.width, h: c.height, flipY: true };
  }
  life?.own(() => textures.forEach(t => t.dispose()));
  return {
    /** Tải lần lượt; onReady(item, tex, aspect) được gọi trong pump() (lúc đã lên GPU). */
    async loadAll(items, srcOf, onReady) {
      for (const it of items) {
        if (life && !life.alive) return;
        try {
          const d = await decode(srcOf(it));
          if (life && !life.alive) { d.image.close?.(); return; }
          const tex = new THREE.Texture(d.image);
          tex.flipY = d.flipY; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
          tex.needsUpdate = true; textures.push(tex);
          ready.push({ it, tex, aspect: d.w / d.h, onReady });
        } catch { console.warn('[thiệp 3D] không tải được ảnh', srcOf(it)); }
      }
    },
    get pending() { return ready.length; },
    /** Gọi mỗi khung hình. Trả về true nếu vừa đưa một ảnh lên GPU. */
    pump() {
      const r = ready.shift(); if (!r) return false;
      renderer.initTexture(r.tex);
      // onReady trước khi đóng bitmap: mẫu có thể đọc ảnh (vd. lấy màu trung bình)
      try { r.onReady(r.it, r.tex, r.aspect); } finally { r.tex.image?.close?.(); }
      return true;
    },
  };
}

/** Bản sao chữ của HTML máy chủ đặt vào không gian 3D. Link/nút trong bản sao không nhận Tab (bản gốc lo việc đó). */
export function clonePlate(CSS3DObject, src, cls, px = 1 / 400) {
  const c = src.cloneNode(true);
  c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
  c.querySelectorAll('a, button, input, select, textarea').forEach(x => x.setAttribute('tabindex', '-1'));
  const wrap = document.createElement('div'); wrap.className = cls; wrap.setAttribute('aria-hidden', 'true'); wrap.append(c);
  const obj = new CSS3DObject(wrap); obj.scale.setScalar(px);
  const plate = {
    obj, cel: wrap, last: -1,
    // Đo kể cả khi đang ẩn (CSS3DRenderer ẩn bằng display:none)
    size() { const prev = wrap.style.display; wrap.style.display = ''; const r = [wrap.offsetWidth * px, wrap.offsetHeight * px]; wrap.style.display = prev; return r; },
    // Chỉ ghi DOM khi độ mờ thực sự đổi
    fade(op) {
      const r = Math.round(op * 50) / 50; if (r === plate.last) return;
      plate.last = r; obj.visible = r > 0; wrap.style.opacity = r; wrap.style.pointerEvents = r > .6 ? 'auto' : 'none';
    },
  };
  return plate;
}

/** Tiến trình cuộn theo các điểm dừng: k nguyên tại đầu điểm dừng thứ k, phân số ở giữa. */
export function scrollStops(els) {
  let offsets = [];
  return {
    measure() { offsets = els.map(s => s.getBoundingClientRect().top + scrollY); },
    read() {
      const y = scrollY, n = els.length;
      let k = 0; while (k < n - 1 && y >= offsets[k + 1]) k++;
      const span = k < n - 1 ? offsets[k + 1] - offsets[k] : innerHeight;
      return clamp(k + (y - (offsets[k] || 0)) / (span || 1), 0, n - 1);
    },
  };
}

/**
 * Canh FPS: sau `grace` giây vẽ, nếu cinematic < 24fps thì onSlow() (tắt hậu kỳ); vẫn < 14fps hai lần thì onTooSlow()
 * (về bản phẳng). Gọi tick(t) mỗi khung hình đã vẽ.
 * Chỉ đo những quãng vẽ liên tục: vòng vẽ theo nhu cầu sẽ nghỉ khi khách đứng yên, và tab bị ẩn khi khách
 * chuyển sang Zalo; những khoảng nghỉ đó không phải máy chậm. Đồng hồ bắt đầu ở khung vẽ đầu tiên, không phải
 * lúc tạo (tải ảnh, biên dịch shader trên 4G có thể mất vài giây).
 */
export function fpsGuard({ grace = 3, onSlow, onTooSlow, disabled }) {
  let n = 0, t0 = 0, last = 0, drawn = 0, slow = 0, degraded = false;
  const GAP = 250;
  return {
    fps: 0,
    reset() { t0 = 0; n = 0; },
    tick(t) {
      if (!t0 || t - last > GAP) { if (t0) drawn += Math.max(0, last - t0); t0 = t; last = t; n = 0; return; }
      n++; last = t;
      if (t - t0 < 2000) return;
      const fps = n * 1000 / (t - t0); drawn += t - t0; n = 0; t0 = t; this.fps = fps;
      if (disabled || drawn / 1000 < grace) return;
      if (!degraded && fps < 24) { degraded = true; onSlow?.(); }
      else if (degraded && fps < 14) { if (++slow >= 2) onTooSlow?.(); }
      else if (fps >= 14) slow = 0;
    },
  };
}

/**
 * Thanh địa chỉ iOS/Android ẩn hiện khi cuộn chỉ đổi chiều cao vài chục px: trả về true nếu là trường hợp đó.
 * Khi ấy chỉ cập nhật tỉ lệ camera (canvas CSS tự giãn), còn cấp lại bộ đệm GPU thì để sau khi khách ngừng cuộn.
 */
export function barOnly(w, h, W, H) { return w === W && h !== H && Math.abs(h - H) < 140; }

/** Vòng vẽ một-luồng: dừng khi tab ẩn, tiếp tục khi hiện, gỡ sạch khi teardown. */
export function startLoop(life, frame) {
  let raf = 0, last = performance.now(), started = false;
  const tick = t => {
    if (!life.alive) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(.1, (t - last) / 1000); last = t;
    frame(t, dt);
  };
  life.listen(document, 'visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (started && life.alive && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  });
  life.own(() => { cancelAnimationFrame(raf); raf = 0; });
  return {
    start() { started = true; if (!raf && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } },
  };
}

/** Dọn mọi geometry/material/texture trong cảnh. */
export function disposeScene(scene) {
  scene.traverse(o => {
    o.geometry?.dispose?.();
    for (const m of [].concat(o.material || [])) {
      for (const v of Object.values(m.uniforms || {})) if (v?.value?.isTexture) v.value.dispose();
      for (const k of ['map', 'bumpMap', 'roughnessMap', 'normalMap', 'alphaMap', 'emissiveMap']) m[k]?.dispose?.();
      m.dispose?.();
    }
  });
  scene.environment?.dispose?.();
}
