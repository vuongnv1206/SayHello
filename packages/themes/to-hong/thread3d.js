// Cảnh 3D của mẫu "Tơ Hồng" 2.0. Chỉ nạp sau khi khách gảy sợi tơ mở thiệp (mở bìa), ở mức cinematic.
// Dùng chung hạ tầng từ @sayhello/engine/client/stage3d.js (loadThree, createLife, makeRenderer, createPost,
// createPhotoLoader, clonePlate, scrollStops, fpsGuard, barOnly, startLoop, disposeScene, SHADER_TAIL).
//
// 5+ khoảnh khắc tương tác:
//   - Xuyên màn sương & cánh hoa lụa vào khung ảnh hero 2.5D (RoomEnvironment + PBR + Bloom/Grain)
//   - Kéo tay / con quay xoay góc nhìn quanh sợi chỉ đỏ PBR & sợi tơ vàng xoắn đôi
//   - Chạm bất kỳ khung ảnh nào (raycast) để dolly camera lại gần, soi nghiêng 2.5D + mở lightbox
//   - Bảng lụa Song Gia & lịch lễ CSS3D sắc nét + cụm hạt tụ tên & ngày cưới rút ra từ sợi chỉ
//   - Cuối đường: nút thắt hoa hồng cực r = cos(2θ) + 0.3 thắt chặt theo #knotBtn & RSVP
import {
  clamp, ease, withTimeout, loadThree, createLife, makeRenderer, createPost,
  createPhotoLoader, clonePlate, scrollStops, fpsGuard, barOnly, startLoop,
  disposeScene, SHADER_TAIL,
} from '@sayhello/engine/client/stage3d.js';

const PX = 1 / 400;
const STEP = 7.6;

export async function runThread(el, ctx, opts = {}) {
  const { palettes = [], pluckSound = () => {} } = opts;
  const root = document.documentElement;
  const SNAP = new URLSearchParams(location.search).has('snap');
  if (!ctx.opened || root.dataset.motion === 'lite') throw new Error('đã hạ mức');

  root.classList.add('th-3d');
  const T = await loadThree(ctx);
  if (!ctx.opened || root.dataset.motion === 'lite') {
    root.classList.remove('th-3d');
    throw new Error('đã hạ mức');
  }

  const { THREE, RoomEnvironment, CSS3DRenderer, CSS3DObject, mergeGeometries, bindContextLoss } = T;
  const V3 = THREE.Vector3;
  const UP = new V3(0, 1, 0);

  const pal = palettes.find(p => p.id === root.dataset.palette) || palettes[0];
  const P = pal?.preset || {
    skyTop: '#D7E2EC', skyBottom: '#EEF1F4', fog: '#E6ECF1', fogD: 0.025,
    thread: '#C8102E', threadEmissive: '#6E0718', gold: '#D9A86C',
    petalA: '#C8102E', petalB: '#F2CDD3', ink: '#23303D', cardBg: '#F8FAFC',
    env: 0.75, exposure: 1.0, bloom: 0.28, night: 0,
  };
  const C = k => new THREE.Color(P[k]);
  const coarse = matchMedia('(pointer: coarse)').matches;

  const life = createLife(root, ['th-3d', 'th-ready', 'th-inspecting', 'th-portrait', 'th-dragging']);
  const canvas = el.querySelector('.th-canvas');
  const { renderer, gpu } = makeRenderer(THREE, canvas, { cine: true, coarse, snap: SNAP, exposure: P.exposure, life });

  try {
    const scene = new THREE.Scene();
    const fogC = C('fog');
    scene.background = fogC;
    scene.fog = new THREE.FogExp2(fogC, P.fogD);

    // Ánh sáng môi trường HDR qua RoomEnvironment + PMREMGenerator
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environmentIntensity = P.env;
    pmrem.dispose();
    room.dispose?.();

    const camera = new THREE.PerspectiveCamera(48, 1, 0.06, 90);
    scene.add(camera);

    const cssLayer = el.querySelector('.th-css');
    const css = new CSS3DRenderer({ element: cssLayer });
    life.own(() => cssLayer.replaceChildren());
    life.own(() => disposeScene(scene));

    // Đèn chính và đèn ven ấm áp
    scene.add(new THREE.HemisphereLight(C('skyTop'), C('skyBottom'), P.night ? 0.5 : 0.85));
    const keyLight = new THREE.DirectionalLight(new THREE.Color('#fff7eb'), P.night ? 0.85 : 1.15);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(C('gold'), 0.45);
    rimLight.position.set(-5, 3, -6);
    scene.add(rimLight);

    /* ---------- Đọc các điểm dừng từ HTML ---------- */
    const stops = [...el.querySelectorAll('.th-track > .th-stop')].map((li, k) => ({
      li,
      k,
      kind: li.dataset.stop,
      hang: li.dataset.hang || '',
      works: [...li.querySelectorAll('.th-imgs img[data-i]')].map(im => ({
        i: +im.dataset.i,
        src: im.currentSrc || im.src,
      })),
      plate: li.querySelector('.th-plate'),
      items: [],
    }));
    const n = stops.length;
    const FIN = Math.max(1, n - 1);

    /* ---------- Đường cong sợi tơ đỏ động (co giãn 6–30 ảnh) ---------- */
    const curvePt = k => {
      const finBlend = ease(clamp((k - (FIN - 1.2)) / 1.2));
      const x = (Math.sin(k * 1.15 + 0.4) * 1.45 + Math.sin(k * 2.3) * 0.25) * (1 - finBlend);
      const y = (Math.cos(k * 0.85 + 0.5) * 0.42 + 1.25) * (1 - finBlend) + 1.35 * finBlend;
      return new V3(x, y, -k * STEP);
    };
    const ctrlPts = [];
    for (let k = -0.6; k <= FIN + 0.6; k += 0.4) ctrlPts.push(curvePt(k));
    const curve = new THREE.CatmullRomCurve3(ctrlPts, false, 'centripetal');
    const stopT = k => clamp((k + 0.6) / (FIN + 1.2));

    stops.forEach(st => {
      st.t = stopT(st.k);
      st.pt = curve.getPointAt(st.t);
      st.tan = curve.getTangentAt(st.t);
      st.side = st.k % 2 === 0 ? -1 : 1;
      st.g = new THREE.Group();
      st.g.position.copy(st.pt);
      scene.add(st.g);
    });

    /* ---------- Dải lụa đỏ PBR & sợi chỉ vàng xoắn đôi ---------- */
    const silkMat = new THREE.MeshPhysicalMaterial({
      color: C('thread'),
      roughness: 0.34,
      metalness: 0.05,
      sheen: 1.0,
      sheenRoughness: 0.28,
      sheenColor: C('gold'),
      emissive: C('threadEmissive'),
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: C('gold'),
      metalness: 0.8,
      roughness: 0.24,
      emissive: C('gold'),
      emissiveIntensity: 0.22,
    });

    {
      const SEG = Math.min(2000, Math.max(900, n * 140));
      const hw = 0.058;
      const pos = new Float32Array((SEG + 1) * 6);
      const nor = new Float32Array((SEG + 1) * 6);
      const uv = new Float32Array((SEG + 1) * 4);
      const p = new V3(), side = new V3(), nr = new V3(), s2 = new V3(), n2 = new V3();
      const goldPts = [];

      for (let i = 0; i <= SEG; i++) {
        const u = i / SEG;
        curve.getPointAt(u, p);
        const tg = curve.getTangentAt(u);
        side.crossVectors(tg, UP).normalize();
        nr.crossVectors(side, tg).normalize();
        const tw = Math.sin(u * 32) * 0.75 + u * n * 1.4;
        const cs = Math.cos(tw), sn = Math.sin(tw);
        s2.copy(side).multiplyScalar(cs).addScaledVector(nr, sn);
        n2.copy(nr).multiplyScalar(cs).addScaledVector(side, -sn);
        pos.set([
          p.x - s2.x * hw, p.y - s2.y * hw, p.z - s2.z * hw,
          p.x + s2.x * hw, p.y + s2.y * hw, p.z + s2.z * hw,
        ], i * 6);
        nor.set([n2.x, n2.y, n2.z, n2.x, n2.y, n2.z], i * 6);
        uv.set([0, u * 40, 1, u * 40], i * 4);

        if (i % 4 === 0) {
          const gp = p.clone().addScaledVector(s2, hw * 1.45).addScaledVector(n2, Math.sin(u * 80) * 0.03);
          goldPts.push(gp);
        }
      }
      const idx = [];
      for (let i = 0; i < SEG; i++) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      const ribbonGeo = new THREE.BufferGeometry();
      ribbonGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      ribbonGeo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      ribbonGeo.setIndex(idx);
      const ribbon = new THREE.Mesh(ribbonGeo, silkMat);
      ribbon.frustumCulled = false;
      scene.add(ribbon);

      const goldCurve = new THREE.CatmullRomCurve3(goldPts);
      const goldStrand = new THREE.Mesh(new THREE.TubeGeometry(goldCurve, Math.min(720, SEG / 2), 0.011, 5, false), goldMat);
      goldStrand.frustumCulled = false;
      scene.add(goldStrand);
    }

    /* ---------- Khung ảnh 2.5D viền đồng/lụa theo đúng tỉ lệ thật ---------- */
    const blank = new THREE.DataTexture(new Uint8Array([225, 228, 232, 255]), 1, 1);
    blank.needsUpdate = true;

    const photoMat = () => new THREE.ShaderMaterial({
      uniforms: {
        map: { value: blank },
        uTilt: { value: new THREE.Vector2() },
        uFocus: { value: 0 },
        uOp: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D map;
        uniform vec2 uTilt;
        uniform float uFocus, uOp;
        varying vec2 vUv;
        void main() {
          vec2 uv = (vUv - 0.5) / (1.0 + uFocus * 0.035) + 0.5;
          float lum = dot(texture2D(map, clamp(uv, 0.0, 1.0)).rgb, vec3(0.299, 0.587, 0.114));
          float depth = clamp((1.0 - vUv.y) * 0.65 + lum * 0.35, 0.0, 1.0);
          vec2 p = clamp(uv + uTilt * (depth - 0.45) * (0.025 + 0.04 * uFocus), 0.0, 1.0);
          vec3 col = texture2D(map, p).rgb * 0.94;
          gl_FragColor = vec4(col, uOp);
          ${SHADER_TAIL}
        }`,
      side: THREE.DoubleSide,
    });

    const matBack = new THREE.MeshStandardMaterial({ color: C('threadEmissive'), roughness: 0.72, metalness: 0.08 });
    const frameMat = new THREE.MeshStandardMaterial({ color: C('gold'), metalness: 0.78, roughness: 0.25 });

    function buildFrameGeo(w, h) {
      const b = 0.042, d = 0.046, pad = 0.045;
      const W = w + pad * 2 + b * 2, Hh = h + pad * 2 + b * 2;
      const parts = [];
      const addBox = (bw, bh, bd, x, y, z) => {
        const g = new THREE.BoxGeometry(bw, bh, bd);
        g.translate(x, y, z);
        parts.push(g);
      };
      addBox(W, b, d, 0, Hh / 2 - b / 2, 0);
      addBox(W, b, d, 0, -Hh / 2 + b / 2, 0);
      addBox(b, Hh - 2 * b, d, -W / 2 + b / 2, 0, 0);
      addBox(b, Hh - 2 * b, d, W / 2 - b / 2, 0, 0);
      const merged = mergeGeometries(parts);
      parts.forEach(p => p.dispose());
      return { border: merged, W, Hh, padW: w + pad * 2, padH: h + pad * 2 };
    }

    const allItems = [];
    const photoMeshes = [];
    const LAYOUT_OFFSETS = {
      hero: [[0, 0.18, 0, 0]],
      single: [[0, 0.12, 0, 0]],
      duet: [[-1.12, 0.18, 0.25, 0.12], [1.12, -0.06, -0.15, -0.12]],
      trio: [[-1.35, 0.24, 0.3, 0.16], [0, -0.18, -0.25, 0], [1.35, 0.2, 0.28, -0.16]],
    };

    for (const st of stops) {
      if (!st.works.length) continue;
      const offs = LAYOUT_OFFSETS[st.hang] || LAYOUT_OFFSETS.single;
      const isCluster = st.hang === 'duet' || st.hang === 'trio';
      const lat = isCluster ? 0 : st.side * (st.hang === 'hero' ? 0.55 : 0.85);

      st.works.forEach((w, j) => {
        const o = offs[j] || [0, 0, 0, 0];
        const ig = new THREE.Group();
        ig.position.set(lat + o[0], o[1] + 0.1, o[2]);
        ig.rotation.y = o[3] + (isCluster ? 0 : -st.side * 0.12);
        st.g.add(ig);

        const pMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat());
        pMesh.position.z = 0.015;
        ig.add(pMesh);

        const backing = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matBack);
        backing.position.z = 0.002;
        ig.add(backing);

        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 2.2, 6), frameMat);
        wire.position.set(0, 1.4, -0.01);
        ig.add(wire);

        const item = {
          st, work: w, j, ig, pMesh, backing, wire, border: null,
          long: st.hang === 'hero' ? 2.2 : st.hang === 'trio' ? 1.45 : st.hang === 'duet' ? 1.65 : 1.95,
          aspect: 0.75, w: 1.5, h: 2.0, W: 1.6, Hh: 2.1, tex: null,
        };
        pMesh.userData.item = item;
        allItems.push(item);
        photoMeshes.push(pMesh);
        st.items.push(item);
        sizeItem(item, 0.75);
      });
    }

    function sizeItem(item, aspect) {
      item.aspect = aspect;
      const w = aspect >= 1 ? item.long : item.long * aspect;
      const h = aspect >= 1 ? item.long / aspect : item.long;
      item.w = w; item.h = h;
      item.pMesh.scale.set(w, h, 1);
      const fg = buildFrameGeo(w, h);
      item.W = fg.W; item.Hh = fg.Hh;
      item.backing.scale.set(fg.padW, fg.padH, 1);
      item.wire.position.set(0, fg.Hh / 2 + 1.05, -0.01);
      if (item.border) {
        item.border.geometry.dispose();
        item.border.geometry = fg.border;
      } else {
        item.border = new THREE.Mesh(fg.border, frameMat);
        item.ig.add(item.border);
      }
    }

    /* ---------- Hạt tụ chữ (Tên -> Ngày cưới) ở điểm dừng morph ---------- */
    const morphSt = stops.find(s => s.kind === 'morph');
    const partU = {
      uGather: { value: 0 },
      uMorph: { value: 0 },
      uOut: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 13 * Math.min(window.devicePixelRatio || 1, 1.5) },
      uA: { value: C('thread') },
      uB: { value: C('gold') },
    };
    let particles = null;

    const sampleText = (lines, Wc, Hc) => {
      const c = document.createElement('canvas');
      c.width = Wc; c.height = Hc;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#000';
      g.textBaseline = 'alphabetic';
      for (const l of lines) {
        g.font = l.font;
        g.textAlign = l.align;
        g.fillText(l.text, l.x, l.y);
      }
      const d = g.getImageData(0, 0, Wc, Hc).data;
      const pts = [];
      for (let y = 0; y < Hc; y += 3) {
        for (let x = 0; x < Wc; x += 3) {
          if (d[(y * Wc + x) * 4 + 3] > 128) pts.push(x, y);
        }
      }
      return { pts, W: Wc, H: Hc };
    };

    const titleSt = stops.find(s => s.kind === 'title');
    const buildParticles = () => {
      if (!morphSt || particles || !life.alive) return;
      const F = 'Bricolage Grotesque';
      const Wc = 1024;
      const probe = document.createElement('canvas').getContext('2d');
      let fs = 210;
      probe.font = `800 ${fs}px "${F}", "Be Vietnam Pro", sans-serif`;
      const first = titleSt?.plate?.querySelector('.th-n1 .split')?.getAttribute('aria-label')
        || titleSt?.plate?.querySelector('.th-n1')?.textContent?.trim()
        || 'Tơ Hồng';
      const second = titleSt?.plate?.querySelector('.th-n2 .split')?.getAttribute('aria-label')
        || titleSt?.plate?.querySelector('.th-n2')?.textContent?.trim()
        || '';
      const wMax = Math.max(probe.measureText(first).width, probe.measureText(second).width, 100);
      fs = Math.floor(fs * Math.min(1, (Wc * 0.88) / wMax));
      const namesH = Math.round(fs * 2.45);
      const A = sampleText([
        { text: first, font: `800 ${fs}px "${F}", sans-serif`, align: 'center', x: Wc / 2, y: Math.round(fs * 0.98) },
        { text: second, font: `800 ${fs}px "${F}", sans-serif`, align: 'center', x: Wc / 2, y: Math.round(fs * 2.15) },
      ], Wc, namesH);

      const dateStr = morphSt.plate?.querySelector('.th-morph-date')?.textContent || '';
      const ds = Math.floor(fs * 1.1);
      const dateH = Math.round(ds * 1.5);
      const B = sampleText([
        { text: dateStr || '2027', font: `800 ${ds}px "${F}", sans-serif`, align: 'center', x: Wc / 2, y: Math.round(ds * 1.05) },
      ], Wc, dateH);

      if (!A.pts.length || !B.pts.length) return;
      const N = 4500;
      const planeW = 3.2;
      const toLocal = (S, k, out, o, dy = 0) => {
        const x = S.pts[k * 2], y = S.pts[k * 2 + 1];
        out[o] = (x / S.W - 0.5) * planeW;
        out[o + 1] = -(y / S.H - 0.5) * planeW * (S.H / S.W) + dy;
        out[o + 2] = 0;
      };
      const aN = new Float32Array(N * 3);
      const aD = new Float32Array(N * 3);
      const aS = new Float32Array(N * 3);
      const aR = new Float32Array(N);
      const nA = A.pts.length / 2, nB = B.pts.length / 2;

      for (let i = 0; i < N; i++) {
        toLocal(A, (Math.random() * nA) | 0, aN, i * 3, 0.25);
        toLocal(B, (Math.random() * nB) | 0, aD, i * 3, 0.2);
        aS[i * 3] = (Math.random() - 0.5) * 0.2;
        aS[i * 3 + 1] = -0.1 + (Math.random() - 0.5) * 0.2;
        aS[i * 3 + 2] = (Math.random() - 0.5) * 2.2;
        aR[i] = Math.random();
        aN[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
        aD[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(aN, 3));
      geo.setAttribute('aDate', new THREE.BufferAttribute(aD, 3));
      geo.setAttribute('aStart', new THREE.BufferAttribute(aS, 3));
      geo.setAttribute('aR', new THREE.BufferAttribute(aR, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: partU,
        transparent: true,
        depthWrite: false,
        vertexShader: `
          attribute vec3 aDate, aStart;
          attribute float aR;
          uniform float uGather, uMorph, uOut, uTime, uSize;
          varying float vA, vK;
          void main() {
            float g = clamp(uGather * 1.45 - aR * 0.45, 0.0, 1.0);
            g = g * g * (3.0 - 2.0 * g);
            float m = clamp(uMorph * 1.45 - aR * 0.45, 0.0, 1.0);
            m = m * m * (3.0 - 2.0 * m);
            vec3 swirl = vec3(sin(aR * 40.0 + uTime), cos(aR * 33.0 + uTime * 0.8), sin(aR * 21.0)) * 0.24 * (1.0 - g) * g * 4.0;
            vec3 p = mix(aStart, position, g) + swirl;
            vec3 arc = vec3(0.0, sin(m * 3.14159) * (aR - 0.5) * 0.85, sin(m * 3.14159) * 0.35);
            p = mix(p, aDate, m) + arc;
            float o = clamp(uOut * 1.4 - aR * 0.4, 0.0, 1.0);
            p += vec3(sin(aR * 91.0), 0.55 + cos(aR * 57.0), cos(aR * 13.0)) * o * 2.0;
            p += vec3(sin(uTime * 0.9 + aR * 30.0), cos(uTime * 0.7 + aR * 20.0), 0.0) * 0.008;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (0.75 + aR * 0.5) / max(-mv.z, 0.5);
            gl_Position = projectionMatrix * mv;
            vA = smoothstep(0.0, 0.14, uGather) * (1.0 - o);
            vK = aR;
          }`,
        fragmentShader: `
          uniform vec3 uA, uB;
          varying float vA, vK;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5 || vA < 0.01) discard;
            vec3 col = mix(uA, uB, step(0.84, vK)) * (1.1 + 0.35 * vK);
            gl_FragColor = vec4(col, vA * smoothstep(0.5, 0.25, d));
            ${SHADER_TAIL}
          }`,
      });
      particles = new THREE.Points(geo, mat);
      particles.frustumCulled = false;
      particles.renderOrder = 4;
      morphSt.g.add(particles);
      dirty = true;
    };

    /* ---------- Nút thắt hoa hồng cực r = cos(2θ) + 0.3 ở cuối đường ---------- */
    const finSt = stops[FIN];
    const knotU = {
      uTight: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: C('thread') },
      uGold: { value: C('gold') },
      uFog: { value: fogC },
    };
    const knotGroup = new THREE.Group();
    {
      const N = 360;
      const mkCurve = (sc, lo) => {
        const arr = [];
        for (let i = 0; i < N; i++) {
          const th = (i / N) * Math.PI * 2 - Math.PI / 2;
          const r = Math.cos(2 * th) * (lo ? 1.18 : 1.0) + (lo ? 0.58 : 0.3);
          let x = r * Math.cos(th), y = r * Math.sin(th);
          const z = 0.11 * Math.sin(4 * th) + 0.06 * Math.cos(6 * th) + (lo ? 0.24 * Math.sin(3 * th + 1) : 0);
          if (lo) { x += 0.12 * Math.sin(5 * th); y += 0.1 * Math.cos(3 * th); }
          arr.push(new V3(x * sc, y * sc, z * sc));
        }
        return new THREE.CatmullRomCurve3(arr, true);
      };
      const gT = new THREE.TubeGeometry(mkCurve(0.76, false), 480, 0.04, 7, true);
      const gL = new THREE.TubeGeometry(mkCurve(0.95, true), 480, 0.04, 7, true);
      gT.setAttribute('aLoose', gL.getAttribute('position'));
      gL.dispose();

      const tails = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new V3(-0.34, -1.05, 0.06), new V3(-0.12, -0.52, 0.02),
        new V3(0, -0.1, 0), new V3(0.12, -0.52, -0.02), new V3(0.36, -1.02, 0.06),
      ]), 100, 0.035, 6, false);
      tails.setAttribute('aLoose', tails.getAttribute('position'));

      const knotMat = new THREE.ShaderMaterial({
        uniforms: knotU,
        side: THREE.DoubleSide,
        vertexShader: `
          attribute vec3 aLoose;
          uniform float uTight, uTime;
          varying vec3 vN, vV;
          varying float vD;
          void main() {
            vec3 lo = aLoose + vec3(sin(uTime * 0.9 + aLoose.y * 3.0), cos(uTime * 0.7 + aLoose.x * 3.0), 0.0) * 0.04;
            vec3 p = mix(lo, position, uTight);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = -mv.xyz;
            vD = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uColor, uGold, uFog;
          uniform float uTight;
          varying vec3 vN, vV;
          varying float vD;
          void main() {
            vec3 N = normalize(vN);
            if (!gl_FrontFacing) N = -N;
            vec3 V = normalize(vV);
            vec3 L = normalize(vec3(0.35, 0.85, 0.45));
            float diff = 0.62 + 0.38 * max(dot(N, L), 0.0);
            vec3 H = normalize(L + V);
            float spec = pow(max(dot(N, H), 0.0001), 32.0) * 0.6;
            float rim = pow(max(1.0 - abs(dot(N, V)), 0.0001), 2.4);
            vec3 col = uColor * diff + uGold * (spec * 0.5 + rim * (0.28 + 0.55 * uTight));
            col *= 1.0 + 0.35 * uTight;
            float f = smoothstep(10.0, 32.0, vD) * 0.85;
            gl_FragColor = vec4(mix(col, uFog, f), 1.0);
            ${SHADER_TAIL}
          }`,
      });
      knotGroup.add(new THREE.Mesh(gT, knotMat), new THREE.Mesh(tails, knotMat));
      knotGroup.position.set(0, 0.6, 0);
      finSt.g.add(knotGroup);
    }

    /* ---------- Cánh hoa lụa bay trong sương ---------- */
    const petalU = {
      uCam: { value: new V3() },
      uTime: { value: 0 },
      uA: { value: C('petalA') },
      uB: { value: C('petalB') },
      uFog: { value: fogC },
    };
    {
      const COUNT = 160;
      const g = new THREE.InstancedBufferGeometry();
      const base = new THREE.PlaneGeometry(1, 1);
      g.index = base.index;
      g.setAttribute('position', base.getAttribute('position'));
      g.setAttribute('uv', base.getAttribute('uv'));
      base.dispose();
      const off = new Float32Array(COUNT * 4);
      for (let i = 0; i < off.length; i++) off[i] = Math.random();
      g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
      g.instanceCount = COUNT;

      const pMat = new THREE.ShaderMaterial({
        uniforms: petalU,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        vertexShader: `
          attribute vec4 aOff;
          uniform vec3 uCam;
          uniform float uTime;
          varying vec2 vUv;
          varying float vK, vD;
          void main() {
            vec3 box = vec3(8.0, 6.0, 16.0);
            vec3 b = aOff.xyz * box;
            b.y -= uTime * (0.12 + 0.14 * aOff.w);
            b.x += sin(uTime * 0.38 + aOff.w * 6.28) * 0.55;
            vec3 wp = uCam + mod(b - uCam + box * 0.5, box) - box * 0.5;
            wp.z -= 5.0;
            float a = uTime * (0.45 + aOff.w) + aOff.w * 9.0, c2 = cos(a), s2 = sin(a);
            vec3 l = position * (0.065 + 0.055 * aOff.y);
            l.x *= 0.62;
            l = vec3(l.x * c2 - l.z * s2, l.y, l.x * s2 + l.z * c2);
            float b2 = a * 0.7;
            l = vec3(l.x, l.y * cos(b2) - l.z * sin(b2), l.y * sin(b2) + l.z * cos(b2));
            vec4 mv = viewMatrix * vec4(wp + l, 1.0);
            vUv = uv; vK = aOff.w; vD = -mv.z;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform vec3 uA, uB, uFog;
          varying vec2 vUv;
          varying float vK, vD;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float d = length(vec2(p.x * (1.25 - 0.45 * p.y), p.y));
            float notch = smoothstep(0.0, 0.18, abs(p.x) + (1.0 - p.y) * 0.6 - 0.05);
            float a = smoothstep(1.0, 0.85, d) * notch;
            if (a < 0.02) discard;
            vec3 col = mix(uB, uA, step(0.62, vK)) * (0.92 + 0.08 * p.y);
            float f = smoothstep(4.5, 13.0, vD);
            gl_FragColor = vec4(mix(col, uFog, f * 0.78), a * (0.88 - f * 0.5) * smoothstep(0.8, 2.0, vD));
            ${SHADER_TAIL}
          }`,
      });
      const petals = new THREE.Mesh(g, pMat);
      petals.frustumCulled = false;
      petals.renderOrder = 5;
      scene.add(petals);
    }

    /* ---------- Biển chữ CSS3D sắc nét (Song Gia, lịch lễ, chú thích, chuyện tình) ---------- */
    const plates = [];
    for (const st of stops) {
      if (!st.plate) continue;
      const pl = clonePlate(CSS3DObject, st.plate, 'th-c th-c-' + st.kind, PX);
      st.g.add(pl.obj);
      st.pl = pl;
      pl.st = st;
      plates.push(pl);
    }
    life.listen(cssLayer, 'click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      e.preventDefault();
      document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });

    /* ---------- Hậu kỳ (Bloom + Chỉnh màu + Grain) ---------- */
    let post = createPost(T, renderer, scene, camera, {
      bloom: P.bloom,
      threshold: 1.35,
      radius: 0.55,
      coarse,
      grade: { uVig: 0.25, uGrain: 0.024 },
    });
    life.own(() => post?.dispose());

    /* ---------- Bố cục từng điểm dừng ---------- */
    const scrollMap = scrollStops(stops.map(s => s.li));
    let W = 0, H = 0, aspect = 1, portrait = false, dirty = true, barT = 0;

    function placeStop(st) {
      const fov = portrait ? 54 : 44;
      const tanV = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      st.fov = fov;
      const g = st.g.position;
      let bw = 2.8, bh = 2.4, cy = 0.25;

      if (st.items.length) {
        const xs = st.items.map(it => [it.ig.position.x - it.W / 2, it.ig.position.x + it.W / 2]);
        const ys = st.items.map(it => [it.ig.position.y - it.Hh / 2, it.ig.position.y + it.Hh / 2]);
        const minX = Math.min(...xs.map(x => x[0])), maxX = Math.max(...xs.map(x => x[1]));
        const minY = Math.min(...ys.map(y => y[0])), maxY = Math.max(...ys.map(y => y[1]));
        bw = maxX - minX + 0.5;
        bh = maxY - minY + 0.4;
        cy = (minY + maxY) * 0.5;
        if (st.pl) {
          const [lw, lh] = st.pl.size();
          if (portrait || st.hang === 'duet' || st.hang === 'trio') {
            st.pl.obj.position.set(0, minY - lh * 0.5 - 0.24, 0.2);
            bh += lh + 0.32;
            cy -= (lh + 0.24) * 0.35;
          } else {
            const sideSign = st.side > 0 ? -1 : 1;
            st.pl.obj.position.set(sideSign * (maxX - minX) * 0.5 + sideSign * (lw * 0.5 + 0.35), cy, 0.15);
            bw += lw + 0.55;
          }
        }
      } else if (st.pl) {
        const [pw, ph] = st.pl.size();
        if (st.kind === 'finale') {
          st.pl.obj.position.set(0, -1.15, 0.4);
          bw = Math.max(pw, 3.2);
          bh = ph + 2.4;
          cy = 0.05;
        } else if (st.kind === 'morph') {
          st.pl.obj.position.set(0, -1.15, 0.1);
          bw = Math.max(pw, 3.2);
          bh = ph + 2.2;
          cy = 0.1;
        } else {
          st.pl.obj.position.set(0, 0.1, 0.1);
          bw = pw + 0.4;
          bh = ph + 0.6;
          cy = 0.1;
        }
      }

      const fill = st.kind === 'info' ? 0.86 : 0.78;
      const d = Math.max(bh / (fill * 2 * tanV), bw / (fill * 2 * tanV * aspect)) + 0.25;
      st.camPos = new V3(g.x * 0.75, g.y + cy + 0.15, g.z + d);
      st.camLook = new V3(g.x, g.y + cy, g.z);
    }

    function resize(force) {
      if (!life.alive) return;
      const w = innerWidth, h = innerHeight;
      if (!force && w === W && h === H) return;
      if (!force && barOnly(w, h, W, H)) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        css.setSize(w, h);
        clearTimeout(barT);
        barT = setTimeout(() => resize(true), 700);
        dirty = true;
        return;
      }
      const wc = w !== W;
      W = w; H = h; aspect = W / Math.max(1, H);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H, false);
      css.setSize(W, H);
      post?.setSize(W, H);
      portrait = aspect < 0.9;
      root.classList.toggle('th-portrait', portrait);
      if (wc || force) {
        stops.forEach(placeStop);
        scrollMap.measure();
      }
      dirty = true;
    }

    /* ---------- Tương tác: Cuộn + Kéo xoay góc nhìn + Con quay + Chạm soi ảnh 2.5D ---------- */
    let pT = 0, p = 0;
    const progressBar = el.querySelector('.th-progress i');
    const readScroll = () => {
      pT = scrollMap.read();
      if (scrollY > 40) el.classList.remove('show-hint');
    };

    const look = { x: 0, y: 0, sx: 0, sy: 0, dragX: 0, dragY: 0 };
    let baseGyro = null;
    life.listen(window, 'deviceorientation', e => {
      if (e.gamma == null) return;
      const ang = screen.orientation?.angle ?? window.orientation ?? 0;
      let gx = e.gamma, gy = e.beta;
      if (ang === 90) { gx = e.beta; gy = -e.gamma; }
      else if (ang === -90 || ang === 270) { gx = -e.beta; gy = e.gamma; }
      if (!baseGyro) baseGyro = { g: gx, b: gy };
      baseGyro.g += (gx - baseGyro.g) * 0.004;
      baseGyro.b += (gy - baseGyro.b) * 0.004;
      const nx = clamp((gx - baseGyro.g) / 22, -1, 1);
      const ny = clamp((gy - baseGyro.b) / 22, -1, 1);
      if (Math.abs(nx - look.x) < 0.008 && Math.abs(ny - look.y) < 0.008) return;
      look.x = nx; look.y = ny;
      dirty = true;
    });

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitPhoto = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((cx - r.left) / Math.max(1, r.width)) * 2 - 1, -((cy - r.top) / Math.max(1, r.height)) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const visibleMeshes = photoMeshes.filter(m => m.userData.item.st.g.visible);
      return ray.intersectObjects(visibleMeshes, false)[0] || null;
    };

    let inspectItem = null;
    let pointerDown = null;
    const backBtn = el.querySelector('.th-inspect-back');
    const zoomBtn = el.querySelector('.th-inspect-zoom');

    const enterInspect = item => {
      if (!item) return;
      inspectItem = item;
      root.classList.add('th-inspecting');
      if (backBtn) backBtn.tabIndex = 0;
      if (zoomBtn) zoomBtn.tabIndex = 0;
      dirty = true;
    };
    const leaveInspect = () => {
      if (!inspectItem) return;
      inspectItem = null;
      root.classList.remove('th-inspecting');
      if (backBtn) backBtn.tabIndex = -1;
      if (zoomBtn) zoomBtn.tabIndex = -1;
      dirty = true;
    };

    backBtn && life.listen(backBtn, 'click', leaveInspect);
    zoomBtn && life.listen(zoomBtn, 'click', () => {
      if (inspectItem) ctx.view?.(allItems.indexOf(inspectItem));
    });
    life.listen(document, 'keydown', e => {
      if (e.key === 'Escape' && inspectItem) leaveInspect();
    });

    life.listen(window, 'pointermove', e => {
      if (e.pointerType === 'mouse' && !pointerDown) {
        look.x = (e.clientX / Math.max(1, W)) * 2 - 1;
        look.y = (e.clientY / Math.max(1, H)) * 2 - 1;
      }
    }, { passive: true });

    life.listen(canvas, 'pointerdown', e => {
      pointerDown = { x: e.clientX, y: e.clientY, t: performance.now(), hit: hitPhoto(e.clientX, e.clientY) };
      root.classList.add('th-dragging');
      dirty = true;
    });

    life.listen(canvas, 'pointermove', e => {
      if (!pointerDown) return;
      const dx = (e.clientX - pointerDown.x) / Math.max(240, W * 0.45);
      const dy = (e.clientY - pointerDown.y) / Math.max(240, H * 0.45);
      look.dragX = clamp(dx, -1, 1);
      look.dragY = clamp(dy, -1, 1);
      dirty = true;
    });

    const endDrag = e => {
      if (!pointerDown) return;
      const quick = performance.now() - pointerDown.t < 420;
      const still = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) < 12;
      const hitItem = pointerDown.hit?.object?.userData?.item || null;
      pointerDown = null;
      look.dragX = 0; look.dragY = 0;
      root.classList.remove('th-dragging');
      if (e.type === 'pointerup' && quick && still) {
        if (hitItem) enterInspect(hitItem);
        else if (inspectItem) leaveInspect();
      }
      dirty = true;
    };
    life.listen(canvas, 'pointerup', endDrag);
    life.listen(canvas, 'pointercancel', endDrag);

    life.listen(window, 'scroll', readScroll, { passive: true });
    let rz = 0;
    life.listen(window, 'resize', () => {
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => { resize(false); readScroll(); });
    });
    life.listen(window, 'orientationchange', () => {
      baseGyro = null;
      setTimeout(() => { resize(true); readScroll(); }, 350);
    });

    /* ---------- Đồng bộ nút thắt cuối đường với #knotBtn & RSVP ---------- */
    let tightTarget = 0, tight = 0;
    ctx.on('knot', d => {
      if (!life.alive) return;
      tightTarget = clamp(d?.progress ?? 0);
      dirty = true;
    });
    ctx.on('rsvp', x => {
      if (!life.alive) return;
      if (x?.attend !== 'Không') {
        tightTarget = 1;
        pluckSound(0.5);
        dirty = true;
      }
    });
    ctx.on('motion', m => {
      if (m?.motion === 'lite') life.teardown();
    });

    /* ---------- Tải ảnh & đưa lên GPU từng khung hình ---------- */
    const loader = createPhotoLoader(THREE, renderer, { maxTex: 1024, life });
    const loading = loader.loadAll(allItems, it => it.work.src, (it, tex, a) => {
      it.pMesh.material.uniforms.map.value = tex;
      it.tex = tex;
      sizeItem(it, a);
      placeStop(it.st);
      dirty = true;
    });

    /* ---------- Vòng vẽ chính ---------- */
    const cur = { pos: new V3(), look: new V3(), fov: 48, init: false };
    const wantPos = new V3(), wantLook = new V3(), worldPos = new V3(), worldQuat = new THREE.Quaternion(), worldFwd = new V3();
    const guard = fpsGuard({
      disabled: SNAP,
      onSlow: () => { post?.dispose(); post = null; renderer.setPixelRatio(1); resize(true); },
      onTooSlow: () => { life.teardown(); ctx.downgrade('fps'); },
    });

    function frame(t, dt) {
      const now = t / 1000;
      const moving = dirty || loader.pending || Math.abs(pT - p) > 1e-4 || Math.abs(tightTarget - tight) > 1e-3
        || Math.abs(look.x + look.dragX - look.sx) > 1e-3 || Math.abs(look.y + look.dragY - look.sy) > 1e-3
        || !cur.init || cur.pos.distanceToSquared(wantPos) > 1e-6 || !!inspectItem;
      if (!moving) return;
      dirty = false;
      loader.pump();

      p = SNAP ? pT : p + (pT - p) * (1 - Math.exp(-dt * 4.5));
      tight += (tightTarget - tight) * (1 - Math.exp(-dt * 6));
      const tx = clamp(look.x * 0.45 + look.dragX * 1.1, -1, 1);
      const ty = clamp(look.y * 0.45 + look.dragY * 1.1, -1, 1);
      look.sx += (tx - look.sx) * (1 - Math.exp(-dt * 7));
      look.sy += (ty - look.sy) * (1 - Math.exp(-dt * 7));

      if (progressBar) progressBar.style.transform = `scaleY(${clamp(p / FIN).toFixed(3)})`;

      // Hiện chỉ các điểm dừng gần camera
      for (const st of stops) {
        st.g.visible = Math.abs(st.k - p) < 2.6 || st.k === FIN;
      }

      // Tính vị trí camera giữa hai điểm dừng hoặc khi đang soi ảnh 2.5D
      let targetFov = 46;
      if (inspectItem) {
        inspectItem.ig.getWorldPosition(worldPos);
        inspectItem.ig.getWorldQuaternion(worldQuat);
        worldFwd.set(0, 0, 1).applyQuaternion(worldQuat);
        const tanF = Math.tan(THREE.MathUtils.degToRad(21));
        const dist = Math.max(inspectItem.Hh / (1.42 * tanF), inspectItem.W / (1.42 * tanF * aspect)) + 0.12;
        wantPos.copy(worldPos).addScaledVector(worldFwd, dist);
        wantLook.copy(worldPos);
        targetFov = 42;
      } else {
        const k0 = Math.min(Math.floor(p), Math.max(0, n - 2));
        const k1 = Math.min(k0 + 1, n - 1);
        const f = ease(clamp(p - k0));
        const a = stops[k0], b = stops[k1];
        wantPos.lerpVectors(a.camPos, b.camPos, f);
        wantLook.lerpVectors(a.camLook, b.camLook, f);
        targetFov = (a.fov || 46) * (1 - f) + (b.fov || 46) * f;
      }

      if (!cur.init || SNAP) {
        cur.pos.copy(wantPos);
        cur.look.copy(wantLook);
        cur.fov = targetFov;
        cur.init = true;
      } else {
        const sm = 1 - Math.exp(-dt * 6.5);
        cur.pos.lerp(wantPos, sm);
        cur.look.lerp(wantLook, sm);
        cur.fov += (targetFov - cur.fov) * sm;
      }

      camera.position.copy(cur.pos);
      if (Math.abs(camera.fov - cur.fov) > 0.05) {
        camera.fov = cur.fov;
        camera.updateProjectionMatrix();
      }
      camera.lookAt(cur.look);
      // Xoay nhẹ ±16° ngang, ±10° dọc theo kéo tay / chuột / con quay
      camera.rotateY(-look.sx * (inspectItem ? 0.08 : 0.28));
      camera.rotateX(-look.sy * (inspectItem ? 0.05 : 0.17));
      camera.updateMatrixWorld();

      // Cập nhật shader ảnh (hiệu ứng chiều sâu 2.5D)
      for (const it of allItems) {
        const u = it.pMesh.material.uniforms;
        const isFoc = it === inspectItem ? 1 : 0;
        u.uFocus.value += (isFoc - u.uFocus.value) * (1 - Math.exp(-dt * 8));
        u.uTilt.value.set(look.sx, look.sy);
      }

      // Cập nhật chữ CSS3D
      for (const pl of plates) {
        const distK = Math.abs(p - pl.st.k);
        const op = inspectItem ? 0 : clamp(1.25 - distK * 1.45);
        pl.fade(op);
      }

      // Cập nhật hạt tụ tên & ngày cưới
      if (morphSt) {
        const mk = morphSt.k;
        partU.uTime.value = now;
        partU.uGather.value = clamp((p - (mk - 0.85)) / 0.65);
        partU.uMorph.value = clamp((p - (mk - 0.05)) / 0.42);
        partU.uOut.value = clamp((p - (mk + 0.52)) / 0.45);
      }

      // Cập nhật nút thắt cuối & cánh hoa
      knotU.uTime.value = now;
      knotU.uTight.value = tight;
      knotGroup.rotation.y = Math.sin(now * 0.45) * 0.14;
      petalU.uCam.value.copy(camera.position);
      petalU.uTime.value = now;

      if (post) post.render(now);
      else renderer.render(scene, camera);
      css.render(scene, camera);
      guard.tick(t);
      window.__th = { fps: guard.fps, p, pT, gpu, tight, inspecting: !!inspectItem };
    }

    const loop = startLoop(life, frame);

    // Mất ngữ cảnh WebGL: dọn ngay và hạ cấp đồng bộ về 'lite' (< 300ms)
    bindContextLoss(canvas, () => {
      life.teardown();
      ctx.downgrade('webglcontextlost');
    });

    /* ---------- Khởi động ---------- */
    css.render(scene, camera);
    resize(true);
    readScroll();
    p = pT;

    document.fonts?.ready.then(() => {
      if (!life.alive) return;
      buildParticles();
      stops.forEach(placeStop);
      scrollMap.measure();
      readScroll();
      dirty = true;
    });
    setTimeout(() => { if (life.alive && !particles) buildParticles(); }, 1800);

    await new Promise(res => {
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (!life.alive || loader.pending >= Math.min(1, allItems.length) || performance.now() - t0 > 1200) {
          clearInterval(iv);
          res();
        }
      }, 50);
    });
    if (!life.alive) return life;

    try { await withTimeout(renderer.compileAsync(scene, camera), 4000, 'compile'); } catch {}
    if (!life.alive) return life;

    loop.start();
    root.classList.add('th-ready');
    setTimeout(() => {
      if (life.alive && scrollY < 40) el.classList.add('show-hint');
    }, 2200);

    loading.then(() => {
      if (life.alive) {
        scrollMap.measure();
        readScroll();
        dirty = true;
      }
    });

    return life;
  } catch (err) {
    life.teardown();
    throw err;
  }
}
