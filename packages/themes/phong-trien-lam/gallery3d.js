// Cảnh 3D của mẫu Phòng Triển Lãm Đêm. Chỉ nạp sau khi khách bật đèn (mở bìa), ở mức cinematic/standard.
// Không có dữ liệu riêng: đọc mọi thứ từ HTML máy chủ đã dựng (.ptl-stop). Chữ trên tường là bản sao DOM đặt
// trong không gian 3D (CSS3DRenderer): sắc nét, đúng dấu tiếng Việt, link bấm được; bản gốc vẫn ở trong trang
// cho trình đọc màn hình và để rơi về sách triển lãm phẳng khi có lỗi.
//
// Ánh sáng: nền lạnh (hemisphere + RoomEnvironment rất nhẹ), đèn tranh ấm. Ảnh in dùng shader riêng: vùng sáng
// của đèn rọi trên mặt ảnh, kính có vệt loá chạy theo góc nhìn, đèn pin của khách. Vệt sáng tường/sàn, ống kính
// đèn và bóng đèn giữ chỗ là InstancedMesh; ray, chân tường, thân đèn gộp thành một lần vẽ.
// Hậu kỳ (cinematic): bloom chỉ cho thứ phát sáng (ngưỡng 1,6), tone mapping Neutral (giữ màu ảnh), hạt phim.
// Hiệu năng: chỉ vẽ các điểm dừng gần; đứng yên thì không vẽ lại; FPS thấp thì tự tắt hậu kỳ, rồi rơi về bản phẳng.

const PX = 1 / 400;            // 400px chữ DOM = 1 mét trong phòng
const HALF = 3.4, H = 4.2;     // nửa chiều rộng hành lang, chiều cao trần
const STEP = 3.8;              // khoảng cách giữa hai điểm dừng
const HANG = 1.62;             // tâm treo tranh
const NEAR = 4;                // số điểm dừng mỗi phía được vẽ

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
// Đèn bật có chớp: lóe, tắt, lóe, sáng hẳn (động từ "rọi" của mẫu)
const flicker = t => t <= 0 ? 0 : t < .05 ? .9 : t < .11 ? .08 : t < .16 ? .7 : t < .22 ? .2 : clamp(.6 + (t - .22) * 3);
const withTimeout = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

export async function runGallery(el, ctx, { tier, palettes, clickSound = () => {} }) {
  const root = document.documentElement;
  const SNAP = new URLSearchParams(location.search).has('snap'); // chỉ để chụp màn hình kiểm tra: camera tới ngay
  root.classList.add('ptl-3d');
  // Mạng chậm hay CDN bị chặn: không để khách kẹt ở màn "Đang bật đèn"
  const [{ THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }, { CSS3DRenderer, CSS3DObject }, { ShaderPass }, { mergeGeometries }, { bindContextLoss }] = await withTimeout(Promise.all([
    ctx.lib('three-post'),
    import('three/addons/renderers/CSS3DRenderer.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
    import('@sayhello/engine'),
  ]), 9000, 'tải thư viện 3D quá lâu');
  if (!ctx.opened || root.dataset.motion === 'lite') throw new Error('đã hạ mức');

  const pal = palettes.find(p => p.id === root.dataset.palette) || palettes[0];
  const P = pal.preset;
  const cine = tier === 'cinematic';
  const coarse = matchMedia('(pointer: coarse)').matches;
  const V3 = THREE.Vector3, Y = new V3(0, 1, 0);
  const MAXT = cine ? 1024 : 768;

  /* ---------- Renderer ---------- */
  const canvas = el.querySelector('.ptl-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !cine || !coarse, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: !SNAP });
  // Máy chỉ có GPU phần mềm (SwiftShader, llvmpipe) thì cảnh 3D sẽ giật: dùng bản phẳng
  const gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
  if (!SNAP && /swiftshader|llvmpipe|software/i.test(gpu)) { renderer.dispose(); throw new Error('GPU phần mềm'); }

  let alive = true, started = false, raf = 0;
  const off = [];   // hàm gỡ listener
  const listen = (t, type, fn, o) => { t.addEventListener(type, fn, o); off.push(() => t.removeEventListener(type, fn, o)); };

  try {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cine ? 1.5 : 1));
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = P.exposure;

    const scene = new THREE.Scene();
    const voidC = new THREE.Color(P.void);
    scene.background = voidC;
    scene.fog = new THREE.FogExp2(voidC, P.fog);
    if (cine) {
      const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
      scene.environment = pmrem.fromScene(room, .04).texture;
      scene.environmentIntensity = P.env;
      pmrem.dispose(); room.dispose?.();
    }
    const camera = new THREE.PerspectiveCamera(50, 1, .05, 60);
    scene.add(camera);
    const cssLayer = el.querySelector('.ptl-css');
    const css = new CSS3DRenderer({ element: cssLayer });

    /* ---------- Kết cấu vẽ bằng canvas (không tải thêm file) ---------- */
    const canvasTex = (w, h, draw, repeat) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
      return t;
    };
    const noise = (g, w, h) => {
      const d = g.createImageData(w, h);
      for (let i = 0; i < d.data.length; i += 4) { const v = 118 + Math.random() * 26 + (Math.random() < .02 ? 30 : 0); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      g.putImageData(d, 0, 0);
    };
    const radial = (cx, cy, sy, stops) => (g, w, h) => {
      g.save(); g.translate(w * cx, h * cy); g.scale(1, sy);
      const r = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      stops.forEach(([o, a]) => r.addColorStop(o, `rgba(255,255,255,${a})`));
      g.fillStyle = r; g.fillRect(-w, -h, w * 2, h * 2); g.restore();
    };
    const poolTex = canvasTex(256, 256, radial(.5, .34, 1.45, [[0, 1], [.35, .55], [.7, .12], [1, 0]]));
    const softTex = canvasTex(64, 64, radial(.5, .5, 1, [[0, 1], [1, 0]]));
    // Bóng đổ mềm của khung (đèn chiếu từ trên xuống nên bóng lệch xuống dưới)
    const shadowTex = canvasTex(128, 128, (g, w, h) => { g.filter = 'blur(10px)'; g.fillStyle = '#fff'; g.fillRect(22, 22, w - 44, h - 44); });
    const blank = new THREE.DataTexture(new Uint8Array([40, 40, 40, 255]), 1, 1); blank.needsUpdate = true;

    /* ---------- Điểm dừng (đọc từ HTML) ---------- */
    const stops = [...el.querySelectorAll('.ptl-track > .ptl-stop')].map((li, k) => ({
      li, k, kind: li.dataset.stop, hang: li.dataset.hang || '',
      works: [...li.querySelectorAll('.ptl-imgs img[data-i]')].map(im => ({ i: +im.dataset.i, src: im.currentSrc || im.src })),
      plate: li.querySelector('.ptl-plate'), lit: 0, litAt: -1, dwell: 0, items: [], near: [],
    }));
    const n = stops.length, FIN = n - 1, finSt = stops[FIN];
    const zEnd = -(n - 2) * STEP - 4.4, zStart = 5, LEN = zStart - zEnd, zMid = (zStart + zEnd) / 2;
    const lightC = new THREE.Color(P.light), washC = new THREE.Color(P.wash);

    /* ---------- Phòng ---------- */
    const Std = cine ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;
    const wallMat = cine
      ? new THREE.MeshStandardMaterial({ color: P.wall, roughness: .93, bumpMap: canvasTex(256, 256, noise, [LEN / 3, H / 3]), bumpScale: .6 })
      : new THREE.MeshLambertMaterial({ color: P.wall });
    const floorMat = cine
      ? new THREE.MeshStandardMaterial({ color: P.floor, roughness: .3, roughnessMap: canvasTex(256, 256, noise, [3, LEN / 2]) })
      : new THREE.MeshLambertMaterial({ color: P.floor });
    const ceilMat = new Std({ color: new THREE.Color(P.void).lerp(new THREE.Color(P.wall), .35) });
    const darkMat = new Std({ color: '#0d0d0d', ...(cine ? { roughness: .55, metalness: .3 } : {}) });
    const frameMat = new Std({ color: P.frame, ...(cine ? { roughness: .38, metalness: .12 } : {}) });
    const matMat = new Std({ color: P.mat, ...(cine ? { roughness: .95 } : {}) });
    const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const roomMeshes = [];
    const addRoom = (w, h, mat, pos, ry = 0, rx = 0) => { const m = plane(w, h, mat); m.position.set(...pos); m.rotation.set(rx, ry, 0); scene.add(m); roomMeshes.push(m); };
    addRoom(HALF * 2, LEN, floorMat, [0, 0, zMid], 0, -Math.PI / 2);
    addRoom(HALF * 2, LEN, ceilMat, [0, H, zMid], 0, Math.PI / 2);
    addRoom(LEN, H, wallMat, [-HALF, H / 2, zMid], Math.PI / 2);
    addRoom(LEN, H, wallMat, [HALF, H / 2, zMid], -Math.PI / 2);
    addRoom(HALF * 2, H, wallMat, [0, H / 2, zEnd]);
    addRoom(HALF * 2, H, wallMat, [0, H / 2, zStart], Math.PI);
    scene.add(new THREE.HemisphereLight(washC, new THREE.Color(P.floor), cine ? .35 : .6));

    // Vật tĩnh màu tối gộp thành một lần vẽ
    const statics = [];
    const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); statics.push(g); };
    for (const s of [-1, 1]) { box(.03, .1, LEN, s * (HALF - .015), .05, zMid); box(.05, .04, LEN, s * (HALF - 1.25), H - .02, zMid); }

    // Hai đèn rọi thật bám theo bức đang xem và bức kế tiếp; đèn pin của khách
    const keys = [0, 1].map(() => { const s = new THREE.SpotLight(lightC, 0, 0, .42, .75, 2); scene.add(s, s.target); return s; });
    const torch = new THREE.SpotLight(new THREE.Color('#fff4e4'), 0, 0, .16, .55, 2); scene.add(torch, torch.target);

    /* ---------- Shader ---------- */
    const TAIL = `
      #include <tonemapping_fragment>
      #include <colorspace_fragment>`;
    const printVS = `varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-w.xyz); gl_Position=projectionMatrix*viewMatrix*w; }`;
    // Ảnh in: vùng sáng của đèn rọi (sáng ở 4/5 chiều cao, tối dần ra góc dưới), đèn pin, kính phản chiếu
    const printFS = `uniform sampler2D map; uniform float uLit,uSpot,uTorchI,uGlint,uOp,uEmit; uniform vec3 uTorch;
      varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vV;
      void main(){
        vec3 c=texture2D(map,vUv).rgb;
        float d=length((vUv-vec2(.5,.82))*vec2(1.,1.2));
        float spot=mix(1.,.7+.38*smoothstep(1.1,.05,d),uSpot);
        float torch=uTorchI*smoothstep(.55,0.,distance(vW,uTorch));
        vec3 col=c*(uLit*spot+torch*.9+uEmit);
        float fres=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.);
        float band=smoothstep(.07,0.,abs(vUv.x*.8+vUv.y*.55-uGlint));
        col+=vec3(1.,.97,.92)*(band*.05+fres*.04)*(uLit+uEmit+.12);
        gl_FragColor=vec4(col,uOp);${TAIL}
      }`;
    const printMat = transparent => new THREE.ShaderMaterial({
      uniforms: { map: { value: blank }, uLit: { value: 0 }, uSpot: { value: 1 }, uTorch: { value: new V3(0, -99, 0) }, uTorchI: { value: 0 }, uGlint: { value: .7 }, uOp: { value: 1 }, uEmit: { value: 0 } },
      vertexShader: printVS, fragmentShader: printFS, transparent,
    });
    // Bóng ảnh mờ trên sàn bóng (không cần render lần hai)
    const reflMat = () => new THREE.ShaderMaterial({
      uniforms: { map: { value: blank }, uOp: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D map; uniform float uOp; varying vec2 vUv;
        void main(){ vec3 c=texture2D(map,vec2(1.-vUv.x,vUv.y*.9),3.).rgb; float a=uOp*pow(1.-vUv.y,2.2); gl_FragColor=vec4(c*a,1.);${TAIL} }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const beamMat = () => new THREE.ShaderMaterial({
      uniforms: { uOp: { value: 0 }, uC: { value: lightC } },
      vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform float uOp; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ float edge=pow(abs(dot(vN,vV)),2.2); float a=uOp*edge*(.25+.75*vUv.y)*smoothstep(.05,.8,vUv.y); gl_FragColor=vec4(uC*a,1.);${TAIL} }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });

    /* ---------- Khung tranh: phào gỗ hai bậc, bo giấy có gờ vát, gộp thành 2 lần vẽ ---------- */
    const ring = (W, Hh, b, d, z0) => {
      const g = [];
      const add = (w, h, x, y) => { const q = new THREE.BoxGeometry(w, h, d); q.translate(x, y, z0 + d / 2); g.push(q); };
      add(W, b, 0, Hh / 2 - b / 2); add(W, b, 0, -Hh / 2 + b / 2); add(b, Hh - 2 * b, -W / 2 + b / 2, 0); add(b, Hh - 2 * b, W / 2 - b / 2, 0);
      return g;
    };
    const merged = parts => { const g = mergeGeometries(parts); parts.forEach(x => x.dispose()); return g; };
    function frameGeos(w, h, m, b, deep) {
      const W = w + 2 * m + 2 * b, Hh = h + 2 * m + 2 * b;
      const moulding = merged(deep
        ? ring(W, Hh, b, .09, 0)
        : [...ring(W, Hh, b, .03, 0), ...ring(W - 2 * b + .004, Hh - 2 * b + .004, .014, .045, 0)]);
      let mat = null;
      if (m > 0) {
        const p = new THREE.PlaneGeometry(w + 2 * m, h + 2 * m); p.translate(0, 0, .012);
        mat = merged([p, ...ring(w + .012, h + .012, .006, .004, .012)]);
      }
      return { moulding, mat, W, Hh };
    }

    /* ---------- Kiểu treo: vị trí và cỡ tối đa từng ảnh trong hệ toạ độ của bức tường ---------- */
    const SALON = { // [x, y, cao tối đa, rộng tối đa]
      3: [[-.85, .1, 1.15, 1.1], [.55, .45, .7, .9], [.6, -.48, .55, .9]],
      5: [[-1.15, .05, 1.2, 1.05], [.12, .5, .72, .85], [.15, -.45, .58, .85], [1.2, .32, .9, .8], [1.18, -.66, .44, .7]],
    };
    // Màn dọc: cụm ảnh xếp theo chiều cao để vẫn lọt khung điện thoại
    const SALON_P = {
      3: [[0, .6, 1.0, 1.2], [-.42, -.55, .62, .72], [.45, -.55, .62, .72]],
      5: [[-.36, .78, .92, .78], [.5, .92, .62, .66], [.5, .1, .55, .66], [-.4, -.35, .6, .72], [.44, -.72, .5, .66]],
    };
    const LOOK = { // [cao tối đa, rộng tối đa, bo giấy, phào]
      single: [1.5, 1.9, .15, .045], wire: [1.2, 1.5, .1, .04], lightbox: [1.35, 1.8, 0, .03], hero: [2.3, 3.0, .22, .06],
    };
    function slots(st) {
      if (st.hang === 'salon') {
        const lay = SALON[st.works.length] || st.works.map((_, j) => [(j - (st.works.length - 1) / 2) * 1.1, 0, .9, 1]);
        return st.works.map((w, j) => ({ w, x: lay[j][0], y: lay[j][1], maxH: lay[j][2], maxW: lay[j][3], m: .07, b: .035, lay: [lay[j], (SALON_P[st.works.length] || [])[j]] }));
      }
      const [maxH, maxW, m, b] = LOOK[st.hang] || LOOK.single;
      return st.works.map(w => ({ w, x: 0, y: 0, maxH, maxW, m, b }));
    }

    /* ---------- Dựng từng điểm dừng ---------- */
    const pools = [];      // vệt sáng tường + sàn: {k, m, wt}
    const lenses = [];     // ống kính đèn: {k, m}
    const prints = [];     // để chạm (raycast)
    const allItems = [];   // thứ tự xem trong ảnh
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion();

    for (const st of stops) {
      const g = new THREE.Group();
      if (st.k === FIN) { g.position.set(0, HANG + .3, zStart - .01); g.rotation.y = Math.PI; }
      else if (st.hang === 'wire') { g.position.set(0, HANG + .15, -st.k * STEP); }
      else {
        st.side = st.k % 2 === 0 ? -1 : 1;
        g.position.set(st.side * (HALF - .01), HANG, -st.k * STEP);
        g.rotation.y = st.side < 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      scene.add(g); st.g = g; g.updateMatrixWorld();
      st.normal = new V3(0, 0, 1).applyQuaternion(g.quaternion);

      for (const sl of slots(st)) {
        const ig = new THREE.Group(); ig.position.set(sl.x, sl.y, 0); g.add(ig);
        const wire = st.hang === 'wire';
        const pm = printMat(wire);
        const print = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pm);
        print.position.z = st.hang === 'lightbox' ? .05 : .018;
        ig.add(print);
        const item = { ...sl, st, ig, print, pm, rl: 0, rlAt: -1, torchT: 0, aspect: .75, wire };
        if (st.hang === 'lightbox') pm.uniforms.uSpot.value = 0;
        print.userData.item = item; prints.push(print);
        st.items.push(item); allItems.push(item);
        if (wire) {
          item.fMat = frameMat.clone(); item.fMat.transparent = true;
          item.mMat = matMat.clone(); item.mMat.transparent = true;
          item.back = plane(1, 1, new Std({ color: '#7b6c58', transparent: true })); item.back.rotation.y = Math.PI; item.back.position.z = -.002; ig.add(item.back);
        } else {
          // Bóng đổ mềm của khung
          item.shadow = plane(1, 1, new THREE.MeshBasicMaterial({ map: shadowTex, color: '#000', transparent: true, opacity: .5, depthWrite: false }));
          item.shadow.position.set(0, -.07, .002); ig.add(item.shadow);
        }
        if (st.hang !== 'salon' && !wire) { // bóng ảnh trên sàn
          item.refl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.5), reflMat());
          item.refl.rotation.order = 'YXZ';
          item.refl.rotation.set(-Math.PI / 2, Math.atan2(-st.normal.x, -st.normal.z), 0);
          scene.add(item.refl); st.near.push(item.refl);
        }
        setSize(item, .75);
      }

      // Đèn rọi trên trần, vệt sáng tường + sàn, chùm sáng (trừ hộp đèn tự phát sáng)
      if (st.hang !== 'lightbox') {
        const wide = st.hang === 'salon' ? 2 : st.hang === 'hero' ? 1.9 : st.kind === 'work' ? 1 : 1.5;
        const wallPos = g.localToWorld(new V3(0, .32, .004));
        pools.push({ k: st.k, wt: st.kind === 'work' || st.k === FIN ? .5 : .32, m: new THREE.Matrix4().compose(wallPos, g.quaternion, new V3(3.2 * wide, 3.8, 1)) });
        if (st.hang !== 'wire') {
          const fp = g.position.clone().addScaledVector(st.normal, .9 + (st.k === FIN ? .4 : 0)).setY(.004);
          q4.setFromEuler(new THREE.Euler(-Math.PI / 2, Math.atan2(-st.normal.x, -st.normal.z), 0, 'YXZ'));
          pools.push({ k: st.k, wt: st.k === FIN ? .09 : .18, m: new THREE.Matrix4().compose(fp, q4, new V3(2.4 * wide, 1.8, 1)) });
        }
        const fixPos = st.hang === 'wire' ? g.position.clone().add(new V3(0, 0, 1.3)).setY(H - .2) : g.position.clone().addScaledVector(st.normal, 1.25).setY(H - .2);
        const aim = g.position.clone().setY(g.position.y + .1);
        const look = new THREE.Object3D(); look.position.copy(fixPos); look.lookAt(aim); look.rotateX(Math.PI / 2); look.updateMatrix();
        const can = new THREE.CylinderGeometry(.07, .09, .24, 14); can.applyMatrix4(look.matrix); statics.push(can);
        lenses.push({ k: st.k, m: look.matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, -.121, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)) });
        const beamEnd = g.position.clone().addScaledVector(st.normal, .12).setY(g.position.y + (st.k === FIN ? 1.8 : st.kind === 'work' ? 1.4 : 1.1)); // dừng trên mép khung
        const len = fixPos.distanceTo(beamEnd);
        const coneG = new THREE.ConeGeometry(.5 * wide, len, 24, 1, true); coneG.translate(0, -len / 2, 0);
        const beam = new THREE.Mesh(coneG, beamMat());
        beam.position.copy(fixPos);
        beam.quaternion.setFromUnitVectors(new V3(0, -1, 0), beamEnd.clone().sub(fixPos).normalize());
        scene.add(beam); st.beam = beam; st.near.push(beam);
        Object.assign(st, { fixPos, aim });
      } else {
        // Hộp đèn: quầng sáng quanh hộp thay cho đèn rọi
        pools.push({ k: st.k, wt: .3, m: new THREE.Matrix4().compose(g.localToWorld(new V3(0, 0, .004)), g.quaternion, new V3(3.4, 3.4, 1)) });
      }
      if (st.hang === 'wire') { // hai sợi dây treo lên trần
        for (const sx of [-.45, .45]) { const c = new THREE.CylinderGeometry(.003, .003, H - HANG - .9, 4); c.translate(sx, (H + HANG + .9) / 2, -st.k * STEP); statics.push(c); }
      }
    }

    function setSize(item, aspect) {
      item.aspect = aspect;
      let h = item.maxH, w = h * aspect;
      if (w > item.maxW) { w = item.maxW; h = w / aspect; }
      item.print.scale.set(w, h, 1);
      const fg = frameGeos(w, h, item.m, item.b, item.st.hang === 'lightbox');
      if (item.moulding) { item.moulding.geometry.dispose(); item.moulding.geometry = fg.moulding; }
      else { item.moulding = new THREE.Mesh(fg.moulding, item.fMat || frameMat); item.ig.add(item.moulding); }
      if (fg.mat) {
        if (item.mat) { item.mat.geometry.dispose(); item.mat.geometry = fg.mat; }
        else { item.mat = new THREE.Mesh(fg.mat, item.mMat || matMat); item.ig.add(item.mat); }
      }
      item.W = fg.W; item.Hh = fg.Hh;
      item.shadow?.scale.set(fg.W + .12, fg.Hh + .12, 1);
      item.back?.scale.set(fg.W, fg.Hh, 1);
      if (item.refl) {
        item.refl.scale.set(fg.W * 1.05, 1, 1);
        const foot = item.st.g.localToWorld(new V3(item.x, 0, 0)).setY(.005);
        item.refl.position.copy(foot).addScaledVector(item.st.normal, .76);
      }
    }

    // Vệt sáng, ống kính đèn: InstancedMesh, màu từng bản = cường độ
    const black = new THREE.Color(0, 0, 0);
    const poolMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), pools.length);
    pools.forEach((p, i) => { poolMesh.setMatrixAt(i, p.m); poolMesh.setColorAt(i, black); });
    poolMesh.frustumCulled = false; scene.add(poolMesh);
    const lensMesh = new THREE.InstancedMesh(new THREE.CircleGeometry(.075, 16), new THREE.MeshBasicMaterial(), Math.max(1, lenses.length));
    lenses.forEach((l, i) => { lensMesh.setMatrixAt(i, l.m); lensMesh.setColorAt(i, black); });
    lensMesh.frustumCulled = false; scene.add(lensMesh);

    /* ---------- Bóng đèn giữ chỗ: mỗi khách thắp thêm một bóng (gần bức chính) ---------- */
    const LAMPS = 12;
    const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.045, 12, 10), new THREE.MeshBasicMaterial(), LAMPS);
    const lamps = Array.from({ length: LAMPS }, (_, i) => {
      const x = -2.75 + i * (5.5 / (LAMPS - 1)), drop = .5 + ((i * 37) % 5) * .12, z = zStart - 1.3;
      const c = new THREE.CylinderGeometry(.003, .003, drop, 4); c.translate(x, H - drop / 2, z); statics.push(c);
      bulbMesh.setMatrixAt(i, m4.makeTranslation(x, H - drop - .045, z)); bulbMesh.setColorAt(i, black);
      return { at: -1 };
    });
    bulbMesh.frustumCulled = false; scene.add(bulbMesh);
    let litLamps = 0, animUntil = 0;
    const lightLamps = (count, at) => { while (litLamps < Math.min(LAMPS, count)) { lamps[litLamps++].at = at; animUntil = Math.max(animUntil, at + 1); } };

    // Bục đặt bảng chữ cuối phòng (đứng giữa lối đi, nhìn về phía bức chính)
    const signPos = new V3(0, 1.32, zEnd + 3.1);
    box(.46, .72, .22, 0, .36, zEnd + 3.12);
    const staticMesh = new THREE.Mesh(merged(statics), darkMat);
    scene.add(staticMesh);

    /* ---------- Bụi bay trong vệt đèn (cinematic) ---------- */
    let dust;
    if (cine) {
      const N = 380, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * HALF * 2; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - .5) * 12; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: softTex, color: lightC, size: .026, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending }));
      dust.frustumCulled = false; scene.add(dust);
    }

    /* ---------- Chữ trên tường: bản sao DOM trong CSS3D ---------- */
    const plates = [];
    const cloneInto = (src, cls) => {
      const c = src.cloneNode(true);
      c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
      c.querySelectorAll('a, button').forEach(x => x.setAttribute('tabindex', '-1'));
      const wrap = document.createElement('div'); wrap.className = 'ptl-c ' + cls; wrap.append(c);
      const obj = new CSS3DObject(wrap); obj.scale.setScalar(PX);
      return { obj, cel: wrap, last: -1 };
    };
    for (const st of stops) {
      if (!st.plate) continue;
      const pl = cloneInto(st.plate, 'ptl-c-' + st.kind);
      if (st.k === FIN) { pl.obj.position.copy(signPos); pl.obj.rotation.y = Math.PI; scene.add(pl.obj); pl.sign = true; }
      else st.g.add(pl.obj);
      pl.st = st; st.pl = pl; plates.push(pl);
    }
    // Nhãn của bức chính (hiện sau màn chào)
    const heroSrc = document.createElement('div'); heroSrc.className = 'ptl-plate ptl-label';
    heroSrc.innerHTML = '<b></b><small>Tác phẩm chính, Số 1</small>';
    heroSrc.querySelector('b').textContent = finSt.plate?.querySelector('h2')?.textContent || '';
    const heroPl = cloneInto(heroSrc, 'ptl-c-work'); heroPl.hero = true; heroPl.st = finSt; plates.push(heroPl);
    if (finSt.items.length) finSt.g.add(heroPl.obj);
    // Link "#le-tan" trong cảnh 3D: cuộn tới quầy lễ tân
    listen(cssLayer, 'click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });

    /* ---------- Bước vào trong ảnh ---------- */
    const insideMat = new THREE.ShaderMaterial({
      uniforms: { map: { value: blank }, map2: { value: blank }, uMix: { value: 0 }, uOp: { value: 0 }, uTilt: { value: new THREE.Vector2() }, uT: { value: 0 }, uA: { value: 1 }, uIA: { value: .75 }, uIA2: { value: .75 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D map,map2; uniform float uOp,uT,uA,uIA,uIA2,uMix; uniform vec2 uTilt; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5); }
        // Ảnh vừa khít màn hình; lệch tỉ lệ nhiều thì giữ trọn ảnh, nền là chính ảnh đó làm mờ
        vec3 photo(sampler2D m, float ia){
          vec2 uv=vUv-.5; float z=1.06+.025*sin(uT*.25); uv/=z;
          vec2 cov=uv, con=uv;
          if(uA>ia){ cov.y*=ia/uA; con.x*=uA/ia; } else { cov.x*=uA/ia; con.y*=ia/uA; }
          float mis=max(uA/ia,ia/uA);
          vec2 s=(mis>1.25?con:cov)+.5;
          float lum=dot(texture2D(m,clamp(s,0.,1.)).rgb,vec3(.3,.59,.11));
          float d=clamp((1.-s.y)*.75+lum*.35,0.,1.);
          vec2 p=s+uTilt*(d-.45)*.12;
          vec3 bg=texture2D(m,cov+.5,5.).rgb*.32;
          float inb=step(0.,p.x)*step(p.x,1.)*step(0.,p.y)*step(p.y,1.);
          return mix(bg,texture2D(m,clamp(p,0.,1.)).rgb,mis>1.25?inb:1.);
        }
        void main(){
          vec3 c=mix(photo(map,uIA),photo(map2,uIA2),uMix);
          for(int i=0;i<7;i++){ float fi=float(i); vec2 p=vec2(h(vec2(fi,1.)),fract(h(vec2(fi,2.))+uT*.012*(1.+fi*.2))); p+=uTilt*(.04+.02*fi);
            vec2 q=(vUv-p)*vec2(uA,1.); c+=vec3(1.,.86,.66)*.08*smoothstep(.07+.012*fi,.0,length(q)); }
          c*=mix(.55,1.,smoothstep(.95,.3,length(vUv-.5)));
          gl_FragColor=vec4(c,uOp);${TAIL}
        }`,
      transparent: true, depthTest: false, depthWrite: false,
    });
    const insideQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), insideMat);
    insideQuad.renderOrder = 999; insideQuad.position.z = -.3; insideQuad.visible = false; insideQuad.frustumCulled = false;
    camera.add(insideQuad);
    const inside = { item: null, view: -1, t: 0, dir: 0, mixT: 1 };
    const outBtn = el.querySelector('.ptl-out');
    listen(document, 'touchmove', e => { if (inside.item || cc.t >= 0) e.preventDefault(); }, { passive: false });

    function enter(item) {
      if (inside.dir || inside.item || !item.tex) return;
      inside.item = item; inside.view = allItems.indexOf(item); inside.t = 0; inside.dir = 1; inside.mixT = 1;
      const u = insideMat.uniforms;
      u.map.value = item.tex; u.uIA.value = item.aspect; u.uMix.value = 0;
      insideQuad.visible = true; root.classList.add('ptl-inside');
      outBtn.tabIndex = 0; setTimeout(() => alive && outBtn.focus({ preventScroll: true }), 900);
    }
    function leave() { if (inside.item && inside.dir !== -1) inside.dir = -1; }
    function swipe(dir) { // xem ảnh kế tiếp ngay trong chế độ toàn màn hình
      if (!inside.item || inside.dir) return;
      let v = inside.view;
      for (let s = 0; s < allItems.length; s++) { v = (v + dir + allItems.length) % allItems.length; if (allItems[v].tex) break; }
      const it = allItems[v]; if (!it?.tex || v === inside.view) return;
      const u = insideMat.uniforms;
      if (u.uMix.value > .5) { u.map.value = u.map2.value; u.uIA.value = u.uIA2.value; }
      u.map2.value = it.tex; u.uIA2.value = it.aspect; u.uMix.value = 0; inside.mixT = 0; inside.view = v;
    }
    listen(outBtn, 'click', leave);
    listen(document, 'keydown', e => {
      if (!inside.item) return;
      if (e.key === 'Escape') leave(); else if (e.key === 'ArrowRight') swipe(1); else if (e.key === 'ArrowLeft') swipe(-1);
    });

    /* ---------- Màn chào: giữ công tắc lớn, đèn tắt hết rồi bật dần về phía bức chính ---------- */
    const cc = { t: -1, done: false, hold: 0, holding: false, idle: 0 };
    const ccLen = .8 + (n - 1) * .3 + .7;
    const ccOn = k => k === FIN ? ccLen - .5 : .8 + (FIN - 1 - k) * .3;
    function curtain() {
      if (cc.t >= 0 || cc.done || !finSt.items.length) return;
      cc.t = 0; root.classList.add('ptl-cc'); clickSound(.8);
    }
    for (const b of [el.querySelector('.ptl-track [data-sh-allon]'), finSt.pl?.cel.querySelector('[data-sh-allon]')].filter(Boolean)) {
      listen(b, 'pointerdown', e => { e.stopPropagation(); cc.holding = true; dirty = true; });
      for (const t of ['pointerup', 'pointerleave', 'pointercancel']) listen(b, t, () => { cc.holding = false; });
      listen(b, 'click', e => { if (e.detail === 0) curtain(); }); // bàn phím, trình đọc màn hình
    }

    /* ---------- Tải ảnh: giải mã ngoài luồng chính, mỗi khung hình chỉ đưa lên GPU một ảnh ---------- */
    const ua = navigator.userAgent;
    const appleWebKit = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua));
    async function decode(src) {
      if (!appleWebKit && 'createImageBitmap' in window) {
        try {
          const blob = await (await fetch(src)).blob();
          const probe = await createImageBitmap(blob);
          const s = Math.min(1, MAXT / Math.max(probe.width, probe.height));
          const w = Math.round(probe.width * s), h = Math.round(probe.height * s);
          probe.close?.();
          const bmp = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high', imageOrientation: 'flipY' });
          return { image: bmp, w, h, flipY: false };
        } catch {}
      }
      const im = new Image(); im.decoding = 'async'; im.src = src; await im.decode();
      const s = Math.min(1, MAXT / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      return { image: c, w: c.width, h: c.height, flipY: true };
    }
    const uploads = [];
    async function loadItem(item) {
      const d = await decode(item.w.src);
      if (!alive) { d.image.close?.(); return; }
      const tex = new THREE.Texture(d.image);
      tex.flipY = d.flipY; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      tex.needsUpdate = true;
      uploads.push({ item, tex, aspect: d.w / d.h });
    }
    // Ảnh gần lối vào trước, bức chính sau cùng
    const order = allItems.filter(it => it.st.k !== FIN).concat(allItems.filter(it => it.st.k === FIN));
    const loading = (async () => { for (const it of order) { if (!alive) return; try { await loadItem(it); } catch { console.warn('[phòng tranh] không tải được ảnh', it.w.src); } } })();

    /* ---------- Hậu kỳ ---------- */
    let composer = null, grade = null;
    if (cine) {
      const ext = renderer.extensions;
      const type = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
      composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type, samples: coarse ? 0 : 4 }));
      composer.addPass(new RenderPass(scene, camera));
      // Ngưỡng 1,6: chỉ ống kính đèn và bóng đèn mới loá, ảnh cưới giữ nguyên màu
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), P.bloom, .6, 1.6));
      composer.addPass(new OutputPass());
      grade = new ShaderPass({
        uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uGrain: { value: .04 }, uVig: { value: .5 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uGrain,uVig; varying vec2 vUv;
          void main(){ vec4 c=texture2D(tDiffuse,vUv); float d=distance(vUv,vec2(.5));
          c.rgb*=mix(1.,smoothstep(.9,.28,d),uVig);
          float nz=fract(sin(dot(vUv*vec2(1271.3,947.7)+fract(uT)*91.,vec2(12.9898,78.233)))*43758.5453);
          c.rgb+=(nz-.5)*uGrain; gl_FragColor=c; }`,
      });
      composer.addPass(grade);
    }

    /* ---------- Bố cục theo màn hình ---------- */
    let W = 0, Hh = 0, aspect = 1, offsets = [], tanV = .4, portrait = false, dirty = true;
    // Đo bảng chữ kể cả khi đang ẩn (CSS3DRenderer ẩn bằng display:none khi đối tượng không hiện)
    const plateSize = pl => {
      if (!pl) return [0, 0];
      const prev = pl.cel.style.display; pl.cel.style.display = '';
      const r = [pl.cel.offsetWidth * PX, pl.cel.offsetHeight * PX];
      pl.cel.style.display = prev; return r;
    };
    const measure = () => { offsets = stops.map(s => s.li.getBoundingClientRect().top + scrollY); };
    function resize(force) {
      if (!alive) return;
      const w = innerWidth, h = innerHeight;
      if (!force && w === W && h === Hh) return;
      const widthChanged = w !== W;
      W = w; Hh = h; aspect = W / Hh;
      camera.fov = aspect < 1 ? 56 : 44; camera.aspect = aspect; camera.updateProjectionMatrix();
      tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      renderer.setSize(W, Hh, false); css.setSize(W, Hh); composer?.setSize(W, Hh);
      const wasPortrait = portrait;
      portrait = aspect < .9;
      root.classList.toggle('ptl-portrait', portrait); // đổi khổ chữ trước khi đo
      if (portrait !== wasPortrait) for (const it of allItems) { // đổi cách xếp góc tường treo kín
        const l = it.lay?.[portrait ? 1 : 0] || it.lay?.[0]; if (!l) continue;
        Object.assign(it, { x: l[0], y: l[1], maxH: l[2], maxW: l[3] }); it.ig.position.set(l[0], l[1], 0); setSize(it, it.aspect);
      }
      if (widthChanged || force) { stops.forEach(placeStop); measure(); }
      dirty = true;
    }
    const ANG = { single: 24, salon: 0, wire: 0, lightbox: 0, hero: 0 };
    function placeStop(st) {
      // Khung cần thấy trọn (toạ độ của bức tường), nhãn đặt cạnh hoặc dưới
      let x0 = 0, x1 = 0, y0 = 0, y1 = 0, ang = 0, fill = .82;
      if (st.items.length) {
        x0 = Math.min(...st.items.map(i => i.x - i.W / 2)); x1 = Math.max(...st.items.map(i => i.x + i.W / 2));
        y0 = Math.min(...st.items.map(i => i.y - i.Hh / 2)); y1 = Math.max(...st.items.map(i => i.y + i.Hh / 2));
        const pl = st.k === FIN ? heroPl : st.pl, [lw, lh] = plateSize(pl);
        if (pl) {
          if (portrait) { pl.obj.position.set(x0 + lw / 2, y0 - .14 - lh / 2, .02); y0 -= .14 + lh; }
          else { pl.obj.position.set(x1 + .22 + lw / 2, y0 + lh / 2, .02); x1 += .22 + lw; }
        }
        ang = ANG[st.hang] ?? 10; fill = st.hang === 'hero' ? .92 : st.hang === 'single' ? .72 : st.hang === 'salon' ? .76 : .84;
      } else if (st.pl && !st.pl.sign) {
        const [pw, ph] = plateSize(st.pl);
        st.pl.obj.position.set(0, .15, .01);
        x0 = -pw / 2; x1 = pw / 2; y0 = .15 - ph / 2; y1 = .15 + ph / 2;
        ang = st.kind === 'title' ? 14 : st.kind === 'text' ? 8 : 0;
      }
      if (portrait) ang /= 2;
      const bw = Math.max(.5, x1 - x0), bh = Math.max(.5, y1 - y0), a = THREE.MathUtils.degToRad(ang);
      let d = Math.max(bh / (fill * 2 * tanV), bw * Math.cos(a) / (fill * 2 * tanV * aspect)) + .05;
      const target = st.g.localToWorld(new V3((x0 + x1) / 2, (y0 + y1) / 2, 0));
      let dir = st.normal.clone();
      if (a) { const d1 = dir.clone().applyAxisAngle(Y, a), d2 = dir.clone().applyAxisAngle(Y, -a); dir = d1.z >= d2.z ? d1 : d2; } // chếch về phía vừa đi qua
      if (st.k !== FIN && st.hang !== 'wire') d = Math.min(d, (HALF * 2 - .4) / Math.max(.3, Math.abs(dir.x)));
      const cam = target.clone().addScaledVector(dir, d);
      cam.x = clamp(cam.x, -HALF + .3, HALF - .3); cam.y = clamp(cam.y, 1.15, 2.4);
      if (st.k === FIN) {
        st.closeCam = cam; st.closeTarget = target;
        st.longCam = new V3(0, 1.72, zEnd + (portrait ? .7 : 1.3)); st.longTarget = new V3(0, HANG + .45, zStart);
        st.cam = cc.done || !st.items.length ? cam : st.longCam; st.target = cc.done || !st.items.length ? target : st.longTarget;
      } else { st.cam = cam; st.target = target; }
    }

    /* ---------- Điều khiển: cuộn, nhìn quanh, chạm, giữ để rọi, vuốt trong ảnh ---------- */
    let pT = 0, p = 0;
    const readScroll = () => {
      const y = scrollY;
      let k = 0; while (k < n - 1 && y >= offsets[k + 1]) k++;
      const span = k < n - 1 ? offsets[k + 1] - offsets[k] : innerHeight;
      pT = clamp(k + (y - (offsets[k] || 0)) / (span || 1), 0, n - 1);
      if (y > 40) el.classList.remove('show-hint');
    };
    const look = { x: 0, y: 0, sx: 0, sy: 0, dx: 0, dy: 0 };
    listen(window, 'pointermove', e => { if (e.pointerType === 'mouse') { look.x = e.clientX / W * 2 - 1; look.y = e.clientY / Hh * 2 - 1; } }, { passive: true });
    let base = null;
    const orient = () => screen.orientation?.angle ?? window.orientation ?? 0;
    listen(window, 'deviceorientation', e => {
      if (e.gamma == null) return;
      const a = orient();
      let gx = e.gamma, gy = e.beta;
      if (a === 90) { gx = e.beta; gy = -e.gamma; } else if (a === -90 || a === 270) { gx = -e.beta; gy = e.gamma; }
      if (!base) base = { g: gx, b: gy };
      base.g += (gx - base.g) * .004; base.b += (gy - base.b) * .004; // mốc trôi chậm theo tư thế cầm máy
      look.x = clamp((gx - base.g) / 22, -1, 1); look.y = clamp((gy - base.b) / 22, -1, 1);
    });
    listen(window, 'orientationchange', () => { base = null; setTimeout(() => { resize(true); readScroll(); }, 350); });

    let down = null, torchOn = false;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const toNdc = (x, y) => { const r = canvas.getBoundingClientRect(); return ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); };
    const shown = m => m.visible && m.parent.visible && m.parent.parent?.visible !== false;
    const hitPrint = (x, y) => { ray.setFromCamera(toNdc(x, y), camera); return ray.intersectObjects(prints.filter(shown), false)[0]; };
    listen(canvas, 'pointerdown', e => { down = { x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, t: performance.now(), id: e.pointerId }; dirty = true; });
    listen(canvas, 'pointermove', e => {
      if (!down || e.pointerId !== down.id) return;
      down.cx = e.clientX; down.cy = e.clientY;
      if (inside.item) { look.dx = clamp((e.clientX - down.x) / W * 3, -1.4, 1.4); look.dy = clamp((e.clientY - down.y) / Hh * 3, -1.4, 1.4); }
    });
    const endPress = e => {
      if (!down) return;
      const dx = e.clientX - down.x, dy = e.clientY - down.y, quick = performance.now() - down.t < 450, still = Math.hypot(dx, dy) < 10;
      const wasTorch = torchOn;
      down = null; torchOn = false; look.dx = look.dy = 0; dirty = true;
      if (e.type !== 'pointerup') return;
      if (inside.item) {
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) swipe(dx < 0 ? 1 : -1);
        else if (still && quick) leave();
        return;
      }
      if (still && quick && !wasTorch) { const h = hitPrint(e.clientX, e.clientY); if (h) enter(h.object.userData.item); }
    };
    listen(canvas, 'pointerup', endPress); listen(canvas, 'pointercancel', endPress);
    listen(window, 'scroll', readScroll, { passive: true });
    let rz = 0;
    listen(window, 'resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { resize(false); readScroll(); }); });

    /* ---------- Sự kiện thiệp: lời chúc, giữ chỗ, chấm đỏ ---------- */
    let now = performance.now() / 1000;
    lightLamps(Math.min(LAMPS - 1, ctx.wishes.length), now);
    ctx.on('wishes', list => { if (alive) { lightLamps(Math.min(LAMPS - 1, list.length), now); dirty = true; } });
    ctx.on('reddot', ({ i }) => {
      if (!alive) return;
      lightLamps(litLamps + 1, now);
      const it = allItems.find(x => x.w.i === i) || allItems[0]; if (!it) return;
      const dot = new THREE.Mesh(new THREE.CircleGeometry(.028, 20), new THREE.MeshBasicMaterial({ color: '#d23a2a' }));
      dot.position.set(it.W / 2 + .07, -it.Hh / 2 + .06, .012); it.ig.add(dot);
      it.dot = { mesh: dot, at: now }; animUntil = Math.max(animUntil, now + .6);
    });
    ctx.on('allon', () => alive && curtain());
    ctx.on('motion', m => { if (m?.motion === 'lite') teardown(); });

    /* ---------- Vòng vẽ ---------- */
    const cur = { pos: new V3(), look: new V3(), init: false };
    const want = new V3(), wantL = new V3(), tmp = new V3(), tmpC = new THREE.Color();
    const rail = { el: el.querySelector('.ptl-rail i'), last: -1 };
    let last = performance.now(), fpsN = 0, fpsT = last, slow = 0, readyAt = 0;
    const torchTargets = () => roomMeshes.concat(prints.filter(shown));

    function lightOf(st) {
      if (cc.t < 0) return st.lit;
      return cc.t < .8 ? st.lit * clamp(1 - cc.t / .4) : flicker((cc.t - ccOn(st.k)) / 1.0);
    }

    function frame(t) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min(.1, (t - last) / 1000); last = t; now = t / 1000;

      // Có gì cần vẽ lại không? Đứng yên thì nghỉ cho đỡ tốn pin
      const busy = dirty || uploads.length || Math.abs(pT - p) > 1e-4 || now < animUntil || inside.dir || inside.item || down || cc.t >= 0 || cc.holding || cc.hold > 0
        || (p > FIN - .05 && !cc.done) || Math.abs(look.x + look.dx - look.sx) + Math.abs(look.y + look.dy - look.sy) > 1e-3 || !cur.init || cur.pos.distanceToSquared(want) > 1e-8;
      if (!busy) return;
      dirty = false;

      // Mỗi khung hình đưa lên GPU tối đa một ảnh
      const up = uploads.shift();
      if (up) {
        renderer.initTexture(up.tex);
        up.tex.image?.close?.();
        up.item.tex = up.tex; up.item.pm.uniforms.map.value = up.tex;
        if (up.item.refl) up.item.refl.material.uniforms.map.value = up.tex;
        setSize(up.item, up.aspect); placeStop(up.item.st);
      }

      if (!inside.item && cc.t < 0) p = SNAP ? pT : p + (pT - p) * (1 - Math.exp(-dt * 3.2));
      look.sx += (look.x + look.dx - look.sx) * (1 - Math.exp(-dt * 4)); look.sy += (look.y + look.dy - look.sy) * (1 - Math.exp(-dt * 4));

      // Đèn tường bật khi khách đến gần; ảnh được "rọi" khi khách dừng lại (hoặc tự rọi bằng đèn pin)
      for (const st of stops) {
        const near = Math.abs(st.k - p) <= NEAR || p > FIN - 1.2 || cc.t >= 0;
        st.g.visible = near; st.near.forEach(o => { o.visible = near; });
        if (st.k === FIN) { if (!cc.done) st.litAt = -1; }
        else if (st.litAt < 0 && p > st.k - 1.35) { st.litAt = now + (st.k === 0 ? .15 : 0); animUntil = Math.max(animUntil, st.litAt + 1.2); }
        st.lit = st.litAt < 0 ? 0 : flicker((now - st.litAt) / 1.1);
        const L = lightOf(st);
        if (st.beam) st.beam.material.uniforms.uOp.value = (cine ? .085 : .06) * L;
        if (Math.abs(p - st.k) < .2 && !inside.item) st.dwell += dt; else st.dwell = 0;
        for (const it of st.items) {
          if (it.rlAt < 0 && (st.dwell > .9 || it.torchT > .45 || (cc.t >= 0 && cc.t > ccOn(st.k)))) { it.rlAt = now; animUntil = Math.max(animUntil, now + 1.2); }
          it.rl = it.rlAt < 0 ? 0 : flicker((now - it.rlAt) / 1.1);
          const u = it.pm.uniforms;
          if (st.hang === 'lightbox') { u.uLit.value = 0; u.uEmit.value = .06 + 1.02 * L; }
          else if (st.k === FIN && cc.t < 0 && !cc.done) u.uLit.value = .04;
          else u.uLit.value = .08 + .26 * L + .58 * it.rl * (cc.t >= 0 ? L : 1);
          // Vệt loá trên kính chạy theo vị trí camera và độ nghiêng máy
          it.ig.worldToLocal(tmp.copy(camera.position));
          u.uGlint.value = .72 + tmp.x / Math.max(.5, Math.abs(tmp.z)) * .45 + look.sx * .25;
          if (it.refl) it.refl.material.uniforms.uOp.value = .1 * (L * .4 + it.rl * .6);
          if (it.wire) { // treo giữa lối đi: tan ra khi camera đi xuyên qua
            const dz = Math.abs(camera.position.z - st.g.position.z), op = Math.abs(camera.position.x) < 1.3 ? clamp((dz - .15) / .75) : 1;
            u.uOp.value = op; it.fMat.opacity = op; it.mMat.opacity = op; it.back.material.opacity = op; it.ig.visible = op > .01;
          }
          if (it.dot) it.dot.mesh.scale.setScalar(2.2 - 1.2 * ease(clamp((now - it.dot.at) / .4)));
        }
      }
      pools.forEach((pl, i) => { const s = stops[pl.k]; poolMesh.setColorAt(i, tmpC.copy(lightC).multiplyScalar(s.g.visible ? pl.wt * lightOf(s) : 0)); });
      poolMesh.instanceColor.needsUpdate = true;
      lenses.forEach((l, i) => lensMesh.setColorAt(i, tmpC.copy(lightC).multiplyScalar(12 * lightOf(stops[l.k]))));
      if (lensMesh.instanceColor) lensMesh.instanceColor.needsUpdate = true;
      lamps.forEach((l, i) => bulbMesh.setColorAt(i, tmpC.copy(lightC).multiplyScalar(.03 + (l.at < 0 ? 0 : flicker((now - l.at) / .9)) * 9)));
      bulbMesh.instanceColor.needsUpdate = true;

      // Hai đèn rọi thật theo hai điểm dừng gần nhất (trong màn chào: đèn đang bật và bức chính)
      const k0 = Math.min(Math.floor(p), Math.max(0, n - 2)), f = p - k0;
      [[k0, 1 - f], [k0 + 1, f]].forEach(([k, w], j) => {
        const st = cc.t >= 0 ? (j ? finSt : stops[clamp(FIN - 1 - Math.floor((cc.t - .8) / .3), 0, FIN - 1)]) : stops[k], key = keys[j];
        if (!st?.fixPos) { key.intensity = 0; return; }
        key.position.copy(st.fixPos); key.target.position.copy(st.aim);
        key.intensity = 46 * (cc.t >= 0 ? 1 : w) * lightOf(st);
      });

      // Camera: nội suy giữa hai điểm dừng, đi qua giữa hành lang, liếc về phía trước khi bước
      const a = stops[k0], b = stops[Math.min(k0 + 1, n - 1)], e = ease(clamp(f)), arc = Math.sin(Math.PI * e);
      want.lerpVectors(a.cam, b.cam, e); want.x *= 1 - arc * .5;
      wantL.lerpVectors(a.target, b.target, e); wantL.x *= 1 - arc * .55; if (b.k !== FIN) wantL.z -= arc * 2.4;
      let fov = aspect < 1 ? 56 : 44;

      // Màn chào: lùi xa nhìn cả hành lang, đèn tắt rồi bật dần, camera tiến về bức chính
      if (cc.holding) cc.hold += dt; else cc.hold = Math.max(0, cc.hold - dt * 2);
      if (p > FIN - .05 && cc.t < 0 && !cc.done) { cc.idle += SNAP ? 1 : dt; if (cc.hold > 1.1 || cc.idle > 9) curtain(); }
      if (finSt.pl) finSt.pl.cel.style.setProperty('--hold', clamp(cc.hold / 1.1).toFixed(2));
      if (cc.t >= 0) {
        cc.t += Math.min(dt, .05) * (SNAP ? 4 : 1);
        const q = ease(clamp((cc.t - .8) / (ccLen - .6)));
        want.lerpVectors(finSt.longCam, finSt.closeCam, q); wantL.lerpVectors(finSt.longTarget, finSt.closeTarget, q);
        if (cc.t > ccLen + 1) {
          cc.t = -1; cc.done = true; root.classList.remove('ptl-cc');
          finSt.cam = finSt.closeCam; finSt.target = finSt.closeTarget; finSt.litAt = now - 2;
          stops.forEach(s => { if (s.litAt < 0) s.litAt = now - 2; s.items.forEach(it => { if (it.rlAt < 0) it.rlAt = now - 2; }); });
        }
      }

      if (inside.item) {
        // Dolly zoom vào bức ảnh rồi xuyên qua mặt kính
        const it = inside.item;
        inside.t = clamp(inside.t + Math.min(.05, dt) * (SNAP ? 5 : 1) * (inside.dir > 0 ? .8 : -1.25) * (inside.dir ? 1 : 0));
        const q = ease(inside.t);
        const fovZ = fov + 26 * Math.sin(Math.PI * clamp(q / .75) / 2) * (1 - clamp((q - .75) / .25));
        const tanZ = Math.tan(THREE.MathUtils.degToRad(fovZ / 2));
        const centre = it.ig.localToWorld(new V3()), nrm = it.st.normal;
        const dSame = it.Hh / (2 * tanZ);
        const dIn = Math.max(.08, dSame * (1 - clamp((q - .6) / .4) * .92));
        const w = clamp(q / .35);
        want.lerp(centre.clone().addScaledVector(nrm, dIn), w); wantL.lerp(centre, w);
        fov = fovZ;
        insideMat.uniforms.uOp.value = clamp((q - .78) / .22);
        if (inside.mixT < 1) { inside.mixT = Math.min(1, inside.mixT + dt * (SNAP ? 20 : 2.5)); insideMat.uniforms.uMix.value = ease(inside.mixT); }
        if (inside.dir < 0 && inside.t <= 0) {
          inside.item = null; inside.dir = 0; insideQuad.visible = false;
          root.classList.remove('ptl-inside'); outBtn.tabIndex = -1;
        } else if (inside.dir > 0 && inside.t >= 1) inside.dir = 0;
      }

      // Đèn pin: chạm giữ (không kéo) để rọi; nghiêng máy để quét
      if (down && !inside.item && !torchOn && performance.now() - down.t > 220 && Math.hypot(down.cx - down.x, down.cy - down.y) < 10) torchOn = true;
      let tI = 0;
      if (torchOn && down) {
        ray.setFromCamera(toNdc(down.cx + look.sx * W * .12, down.cy + look.sy * Hh * .12), camera);
        const h = ray.intersectObjects(torchTargets(), false)[0];
        if (h) {
          tI = 1;
          torch.position.copy(camera.position).add(tmp.set(0, -.15, 0)); torch.target.position.copy(h.point);
          const it = h.object.userData.item;
          if (it) it.torchT += dt;
          prints.forEach(m => m.material.uniforms.uTorch.value.copy(h.point));
        }
      }
      torch.intensity += (tI * 40 - torch.intensity) * (1 - Math.exp(-dt * 10));
      if (torch.intensity < .01 && !tI) torch.intensity = 0; else animUntil = Math.max(animUntil, now + .2);
      prints.forEach(m => { m.material.uniforms.uTorchI.value = torch.intensity / 40; });

      // Camera êm (không giật khi bố cục đổi); rung tay rất nhẹ ở mức cinematic
      if (!cur.init || SNAP) { cur.pos.copy(want); cur.look.copy(wantL); cur.init = true; }
      else { const s = inside.item || cc.t >= 0 ? 1 : 1 - Math.exp(-dt * 7); cur.pos.lerp(want, s); cur.look.lerp(wantL, s); }
      camera.position.copy(cur.pos);
      if (cine && !inside.item) camera.position.add(tmp.set(Math.sin(now * 2.5) * .004, Math.cos(now * 1.9) * .003, 0));
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.lookAt(cur.look);
      const lookAmt = inside.item ? .25 : 1;
      camera.rotateY(-look.sx * .09 * lookAmt); camera.rotateX(-look.sy * .05 * lookAmt);

      if (insideQuad.visible) {
        const hq = 2 * .3 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        insideQuad.scale.set(hq * aspect, hq, 1);
        insideMat.uniforms.uA.value = aspect; insideMat.uniforms.uT.value = now;
        insideMat.uniforms.uTilt.value.set(look.sx, -look.sy);
      }

      // Chữ trên tường: hiện theo khoảng cách; chỉ ghi DOM khi giá trị đổi
      for (const pl of plates) {
        let op;
        if (pl.sign) op = (p > FIN - .6 ? clamp((p - (FIN - .6)) / .5) : 0) * (cc.done ? 0 : cc.t >= 0 ? clamp(1 - cc.t / .6) : 1);
        else if (pl.hero) op = cc.done ? clamp(1.25 - Math.abs(p - FIN) * 1.5) : 0;
        else op = clamp(1.25 - Math.abs(p - pl.st.k) * 1.5) * clamp(lightOf(pl.st) * 1.4);
        if (inside.item) op = 0;
        const r = Math.round(op * 50) / 50;
        if (r !== pl.last) {
          pl.last = r; pl.obj.visible = r > 0;
          pl.cel.style.opacity = r; pl.cel.style.pointerEvents = r > .6 ? 'auto' : 'none';
        }
      }

      if (dust) {
        const pos = dust.geometry.attributes.position.array, cz = camera.position.z;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += Math.sin(now * .3 + i) * .0008; pos[i + 1] += .0012 + Math.cos(now * .2 + i * .7) * .0006;
          if (pos[i + 1] > H) pos[i + 1] = 0;
          if (pos[i + 2] > cz + 4) pos[i + 2] -= 12; else if (pos[i + 2] < cz - 8) pos[i + 2] += 12;
        }
        dust.geometry.attributes.position.needsUpdate = true;
      }

      const rp = Math.round(p / Math.max(1, n - 1) * 200) / 200;
      if (rp !== rail.last && rail.el) { rail.last = rp; rail.el.style.transform = `scaleY(${rp})`; }
      if (grade) grade.uniforms.uT.value = now;
      if (composer) composer.render(); else renderer.render(scene, camera);
      css.render(scene, camera);

      // Máy không kham nổi: tắt hậu kỳ trước, vẫn chậm thì về bản phẳng
      fpsN++;
      if (t - fpsT > 2000) {
        const fps = fpsN * 1000 / (t - fpsT); fpsN = 0; fpsT = t;
        window.__ptl = { fps, p, pT, gpu };
        if (!SNAP && now > readyAt + 3) {
          if (composer && fps < 24) { composer.dispose(); composer = null; grade = null; renderer.setPixelRatio(1); resize(true); }
          else if (!composer && fps < 14 && ++slow >= 2) { teardown(); ctx.downgrade('fps'); }
          else if (fps >= 14) slow = 0;
        }
      }
      if (SNAP) window.__ptl = { ...(window.__ptl || {}), p, pT, cc: cc.t, ccDone: cc.done };
    }

    listen(document, 'visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (started && alive && !raf) { last = performance.now(); dirty = true; raf = requestAnimationFrame(frame); }
    });

    // Dọn sạch: listener, GPU, bản sao chữ; trả về sách triển lãm phẳng
    function teardown() {
      if (!alive) return;
      alive = false; cancelAnimationFrame(raf); raf = 0;
      off.forEach(f => f()); off.length = 0;
      cssLayer.replaceChildren();
      scene.traverse(o => {
        o.geometry?.dispose?.();
        for (const m of [].concat(o.material || [])) { for (const v of Object.values(m.uniforms || {})) if (v?.value?.isTexture) v.value.dispose(); m.map?.dispose?.(); m.dispose?.(); }
      });
      allItems.forEach(it => it.tex?.dispose());
      scene.environment?.dispose?.();
      composer?.dispose?.(); renderer.dispose();
      root.classList.remove('ptl-3d', 'ptl-ready', 'ptl-inside', 'ptl-cc', 'ptl-portrait');
    }
    bindContextLoss(canvas, () => { teardown(); ctx.downgrade('webglcontextlost'); });

    /* ---------- Khởi động: đo bố cục, chờ ảnh đầu, biên dịch shader sau màn che, rồi bật đèn ---------- */
    css.render(scene, camera); // cho bản sao chữ vào trang để đo
    resize(true); readScroll(); p = pT;
    document.fonts?.ready.then(() => { if (alive) { stops.forEach(placeStop); measure(); readScroll(); dirty = true; } });
    await new Promise(r => {
      const t0 = performance.now();
      const tick = setInterval(() => { if (!alive || uploads.length >= Math.min(2, order.length) || performance.now() - t0 > 2500) { clearInterval(tick); r(); } }, 50);
    });
    if (!alive) return { teardown };
    insideQuad.visible = true;
    try { await withTimeout(renderer.compileAsync(scene, camera), 4000, 'compile'); } catch {}
    insideQuad.visible = false;
    if (!alive) return { teardown };
    started = true; readyAt = performance.now() / 1000;
    if (!document.hidden) frame(performance.now());
    root.classList.add('ptl-ready');
    setTimeout(() => { if (alive && scrollY < 40) el.classList.add('show-hint'); }, 2200);
    loading.then(() => { if (alive) { measure(); readScroll(); dirty = true; } });
    return { teardown };
  } catch (err) {
    // Lỗi giữa chừng: dọn những gì đã dựng rồi báo lên để theme.js chuyển về bản phẳng
    alive = false; cancelAnimationFrame(raf);
    off.forEach(f => f());
    el.querySelector('.ptl-css')?.replaceChildren();
    renderer.dispose();
    throw err;
  }
}
