// Cảnh 3D của mẫu Phòng Triển Lãm Đêm. Chỉ nạp sau khi khách bật đèn (mở bìa), ở mức cinematic/standard.
// Không có dữ liệu riêng: đọc mọi thứ từ HTML máy chủ đã dựng (.ptl-stop). Chữ trên tường là bản sao DOM đặt
// trong không gian 3D (CSS3DRenderer) nên sắc nét, đúng dấu tiếng Việt, link bấm được; bản gốc vẫn ở trong
// trang cho trình đọc màn hình và để rơi về sách triển lãm phẳng khi có lỗi.
//
// Ánh sáng: môi trường RoomEnvironment rất nhẹ + hai đèn rọi thật bám theo bức ảnh đang xem + vệt sáng
// vẽ sẵn (decal cộng sáng) trên tường và sàn cho mọi bức còn lại + chùm sáng thể tích giả. Hậu kỳ (cinematic):
// bloom nửa độ phân giải, tone mapping Neutral (giữ màu ảnh cưới trung thực), hạt phim và vignette.

const PX = 1 / 400;            // 400px chữ DOM = 1 mét trong phòng
const HALF = 3.4, H = 4.2;     // nửa chiều rộng hành lang, chiều cao trần
const STEP = 3.6;              // khoảng cách giữa hai điểm dừng
const EYE = 1.6, HANG = 1.62;  // tầm mắt, tâm treo tranh
const MAX_TEX = 1024;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
// Đèn bật có chớp: tắt, lóe, tắt, sáng hẳn (động từ "rọi" của mẫu)
const flicker = t => t <= 0 ? 0 : t < .05 ? .9 : t < .11 ? .08 : t < .16 ? .7 : t < .22 ? .2 : clamp(.6 + (t - .22) * 3);

export async function runGallery(el, ctx, { tier, palettes }) {
  const root = document.documentElement;
  root.classList.add('ptl-3d');
  const { THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass } = await ctx.lib('three-post');
  const [{ CSS3DRenderer, CSS3DObject }, { ShaderPass }, { bindContextLoss }] = await Promise.all([
    import('three/addons/renderers/CSS3DRenderer.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('@sayhello/engine'),
  ]);
  if (!ctx.opened || root.dataset.motion === 'lite') throw new Error('đã hạ mức');

  const pal = palettes.find(p => p.id === root.dataset.palette) || palettes[0];
  const P = pal.preset;
  const cine = tier === 'cinematic';
  const SNAP = new URLSearchParams(location.search).has('snap'); // chỉ để chụp màn hình kiểm tra: camera tới ngay
  const V3 = THREE.Vector3;

  /* ---------- Renderer ---------- */
  const canvas = el.querySelector('.ptl-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !cine, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, cine ? 1.5 : 1.25);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = P.exposure;

  const scene = new THREE.Scene();
  const voidC = new THREE.Color(P.void);
  scene.background = voidC;
  scene.fog = new THREE.FogExp2(voidC, P.fog);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = P.env;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(50, 1, .05, 80);
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
  // Vệt đèn rọi trên tường: đỉnh sáng phía trên, loang xuống thành elip mềm
  const poolTex = canvasTex(256, 256, (g, w, h) => {
    g.save(); g.translate(w / 2, h * .34); g.scale(1, 1.45);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.55)'); r.addColorStop(.7, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(-w, -h, w * 2, h * 2); g.restore();
  });
  const softTex = canvasTex(64, 64, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });

  /* ---------- Điểm dừng (đọc từ HTML) ---------- */
  const stops = [...el.querySelectorAll('.ptl-stop')].map((li, k) => ({ li, k, kind: li.dataset.stop, src: li.dataset.src, plate: li.querySelector('.ptl-plate'), lit: 0, litAt: -1 }));
  const n = stops.length, FIN = n - 1;
  const zEnd = -(n - 2) * STEP - 4.4, zStart = 4.5, LEN = zStart - zEnd;

  /* ---------- Phòng ---------- */
  const lightC = new THREE.Color(P.light);
  const wallMat = new THREE.MeshStandardMaterial({ color: P.wall, roughness: .93, metalness: 0, bumpMap: canvasTex(256, 256, noise, [LEN / 3, H / 3]), bumpScale: .6 });
  const floorMat = new THREE.MeshStandardMaterial({ color: P.floor, roughness: .32, metalness: 0, roughnessMap: canvasTex(256, 256, noise, [3, LEN / 2]) });
  const ceilMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(P.void).lerp(new THREE.Color(P.wall), .35), roughness: 1 });
  const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const zMid = (zStart + zEnd) / 2;
  const floor = plane(HALF * 2, LEN, floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, zMid); scene.add(floor);
  const ceil = plane(HALF * 2, LEN, ceilMat); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, zMid); scene.add(ceil);
  const wl = plane(LEN, H, wallMat); wl.rotation.y = Math.PI / 2; wl.position.set(-HALF, H / 2, zMid); scene.add(wl);
  const wr = plane(LEN, H, wallMat); wr.rotation.y = -Math.PI / 2; wr.position.set(HALF, H / 2, zMid); scene.add(wr);
  const we = plane(HALF * 2, H, wallMat); we.position.set(0, H / 2, zEnd); scene.add(we);
  const wb = plane(HALF * 2, H, wallMat); wb.rotation.y = Math.PI; wb.position.set(0, H / 2, zStart); scene.add(wb);
  // Chân tường và ray đèn trên trần: chi tiết nhỏ làm phòng "thật"
  const darkMat = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: .6 });
  for (const s of [-1, 1]) {
    const base = new THREE.Mesh(new THREE.BoxGeometry(.03, .1, LEN), darkMat); base.position.set(s * (HALF - .015), .05, zMid); scene.add(base);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.05, .04, LEN), darkMat); rail.position.set(s * (HALF - 1.25), H - .02, zMid); scene.add(rail);
  }
  scene.add(new THREE.HemisphereLight(lightC, new THREE.Color(P.floor), .4));

  // Hai đèn rọi thật bám theo bức đang xem và bức kế tiếp
  const keys = [0, 1].map(() => {
    const s = new THREE.SpotLight(lightC, 0, 0, .44, .75, 2);
    scene.add(s, s.target);
    return s;
  });

  /* ---------- Từng điểm dừng: khung ảnh, vệt sáng, đèn, chùm sáng ---------- */
  const frameMat = new THREE.MeshStandardMaterial({ color: P.frame, roughness: .42, metalness: .15 });
  const matMat = new THREE.MeshStandardMaterial({ color: P.mat, roughness: .95 });
  const lensMat = () => new THREE.MeshBasicMaterial({ color: lightC.clone().multiplyScalar(0) });
  const beamMat = () => new THREE.ShaderMaterial({
    uniforms: { uOp: { value: 0 }, uC: { value: lightC } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uOp; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float edge=pow(abs(dot(vN,vV)),2.2); float a=uOp*edge*(.25+.75*vUv.y)*smoothstep(0.,.75,vUv.y);
      gl_FragColor=vec4(uC*a,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const decal = (w, h, op) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: poolTex, color: lightC, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.userData.op = op; return m;
  };

  const photos = [];
  for (const st of stops) {
    const g = new THREE.Group();
    if (st.k === FIN) { g.position.set(0, HANG, zEnd + .01); }
    else {
      st.side = st.k % 2 === 0 ? -1 : 1;
      g.position.set(st.side * (HALF - .01), HANG, -st.k * STEP);
      g.rotation.y = st.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    scene.add(g); st.g = g;
    st.normal = new V3(0, 0, 1).applyQuaternion(g.quaternion);

    if (st.kind === 'work') {
      const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#222' }));
      const mat = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), matMat);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1, 1, .05), frameMat);
      photo.position.z = .032; mat.position.z = .031; frame.position.z = .005;
      g.add(frame, mat, photo);
      photo.userData.k = st.k; photos.push(photo);
      Object.assign(st, { photo, mat, frame });
      setPhotoSize(st, 3 / 4);
    }
    if (st.k !== FIN) {
      // Vệt sáng trên tường + dưới sàn, đèn trên ray, chùm sáng
      const wide = st.kind === 'work' ? 1 : 1.5;
      const pool = decal(3.2 * wide, 3.8, st.kind === 'work' ? .5 : .32); pool.position.set(0, .32, .002); g.add(pool);
      const fpool = decal(2.4 * wide, 1.8, .2); fpool.rotation.x = -Math.PI / 2; scene.add(fpool);
      fpool.position.copy(g.position).addScaledVector(st.normal, .9).setY(.004);
      const fix = new THREE.Group();
      const can = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .24, 16), darkMat);
      const lens = new THREE.Mesh(new THREE.CircleGeometry(.075, 16), lensMat()); lens.position.y = -.121; lens.rotation.x = Math.PI / 2;
      fix.add(can, lens);
      const fixPos = g.position.clone().addScaledVector(st.normal, 1.25).setY(H - .2);
      const aim = g.position.clone().setY(HANG + .1);
      const beamEnd = g.position.clone().addScaledVector(st.normal, .12).setY(HANG + (st.kind === 'work' ? 1.05 : .9)); // chùm sáng dừng trên mép khung, không phủ lên ảnh
      fix.position.copy(fixPos); fix.lookAt(aim); fix.rotateX(Math.PI / 2); scene.add(fix);
      const len = fixPos.distanceTo(beamEnd);
      const coneG = new THREE.ConeGeometry(.5 * wide, len, 28, 1, true); coneG.translate(0, -len / 2, 0);
      const beam = new THREE.Mesh(coneG, beamMat());
      beam.position.copy(fixPos);
      beam.quaternion.setFromUnitVectors(new V3(0, -1, 0), beamEnd.clone().sub(fixPos).normalize());
      scene.add(beam);
      Object.assign(st, { pools: [pool, fpool], lens, beam, fixPos, aim });
    }
  }

  function setPhotoSize(st, aspect) {
    const h = aspect >= 1 ? 1.9 / aspect : 1.5, w = h * aspect, m = .17, b = .035;
    st.photo.scale.set(w, h, 1);
    st.mat.scale.set(w + 2 * m, h + 2 * m, 1);
    st.frame.scale.set(w + 2 * m + 2 * b, h + 2 * m + 2 * b, 1);
    st.fw = w + 2 * m + 2 * b; st.fh = h + 2 * m + 2 * b;
  }

  /* ---------- Chữ trên tường: bản sao DOM trong CSS3D ---------- */
  for (const st of stops) {
    if (!st.plate) continue;
    const c = st.plate.cloneNode(true);
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    c.querySelectorAll('a, button').forEach(x => x.setAttribute('tabindex', '-1'));
    if (st.k === FIN) c.insertAdjacentHTML('beforeend', '<i class="ptl-dot" aria-hidden="true"></i>');
    const wrap = document.createElement('div');
    wrap.className = 'ptl-c ptl-c-' + st.kind;
    wrap.append(c);
    const obj = new CSS3DObject(wrap);
    obj.scale.setScalar(PX);
    st.g.add(obj); st.css = obj; st.cel = wrap;
  }
  // Trong cảnh 3D link "Dán chấm đỏ" cuộn tới quầy lễ tân
  cssLayer.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Trái tim ghép ảnh cuối phòng ---------- */
  const ATL = 4, atlasC = document.createElement('canvas'); atlasC.width = atlasC.height = 1024;
  const atlasG = atlasC.getContext('2d'); atlasG.fillStyle = P.mat; atlasG.fillRect(0, 0, 1024, 1024);
  const atlas = new THREE.CanvasTexture(atlasC); atlas.colorSpace = THREE.SRGBColorSpace;
  const cells = [];
  const SP = .135;
  for (let y = -1.1; y <= 1.3; y += SP) for (let x = -1.3; x <= 1.3; x += SP) {
    const u = x / 1.12, v = y / 1.12 + .08;
    if (Math.pow(u * u + v * v - 1, 3) - u * u * v * v * v < 0) cells.push([x, y + .55]);
  }
  const tileGeo = new THREE.PlaneGeometry(SP * .9, SP * .9);
  const cellAttr = new Float32Array(cells.length);
  const nWorks = stops.filter(s => s.kind === 'work').length || 1;
  // Rải đều các ảnh trên trái tim, không để hai ô cạnh nhau trùng ảnh theo một nhịp lặp dễ thấy
  const nCells = Math.min(16, nWorks);
  cells.forEach((_, i) => { cellAttr[i] = Math.floor(((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * nCells); });
  tileGeo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cellAttr, 1));
  const tileMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: atlas }, uGlow: { value: 0 } },
    vertexShader: `attribute float aCell; varying vec2 vUv; varying float vC;
      void main(){ vUv=uv; vC=aCell; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform float uGlow; varying vec2 vUv; varying float vC;
      void main(){ float col=mod(vC,4.), row=3.-floor(vC/4.);
      vec4 c=texture2D(map,(vec2(col,row)+.06+vUv*.88)/4.);
      gl_FragColor=vec4(c.rgb*(.9+uGlow),1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, cells.length);
  tiles.frustumCulled = false;
  scene.add(tiles);
  const finSt = stops[FIN];
  const tileFrom = cells.map((_, i) => {
    const w = stops.filter(s => s.kind === 'work');
    const s = w.length ? w[i % w.length] : finSt;
    return s.g.position.clone().add(new V3((Math.random() - .5) * 1.2, (Math.random() - .5) * 1.4, (Math.random() - .5) * 1.2)).addScaledVector(s.normal, .4);
  });
  const tileTo = cells.map(([x, y]) => finSt.g.localToWorld(new V3(x, y, .04)));
  const tileDelay = cells.map(([x, y]) => .9 * clamp(1 - Math.hypot(x, y - .55) / 1.6) + Math.random() * .25);
  const dummy = new THREE.Object3D();
  let mosaicT = -1;
  function placeTiles(t) {
    for (let i = 0; i < cells.length; i++) {
      const e = ease(clamp((t - tileDelay[i]) / 1.4));
      dummy.position.lerpVectors(tileFrom[i], tileTo[i], e);
      dummy.position.y += Math.sin(e * Math.PI) * .9;
      dummy.quaternion.copy(finSt.g.quaternion);
      dummy.rotateZ((1 - e) * (i % 2 ? 2.4 : -2.4)); dummy.rotateY((1 - e) * 1.6);
      dummy.scale.setScalar(e < .001 ? 1e-4 : .2 + .8 * e);
      dummy.updateMatrix(); tiles.setMatrixAt(i, dummy.matrix);
    }
    tiles.instanceMatrix.needsUpdate = true;
  }
  placeTiles(0);
  const finPool = decal(6.4, 4.8, .45); finPool.position.set(0, .7, .003); finSt.g.add(finPool);
  const finFloor = decal(6.4, 5, .3); finFloor.rotation.x = -Math.PI / 2; finFloor.position.set(0, .004, zEnd + 2.4); scene.add(finFloor);

  /* ---------- Đèn giữ chỗ: mỗi khách thắp thêm một bóng ---------- */
  const LAMPS = 12;
  const lamps = Array.from({ length: LAMPS }, (_, i) => {
    const x = -2.75 + i * (5.5 / (LAMPS - 1)), drop = .55 + ((i * 37) % 5) * .12;
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(.004, .004, drop, 4), darkMat);
    cord.position.set(x, H - drop / 2, zEnd + 1.1); scene.add(cord);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 10), new THREE.MeshBasicMaterial({ color: '#000' }));
    bulb.position.set(x, H - drop - .04, zEnd + 1.1); scene.add(bulb);
    return { bulb, on: 0, at: -1 };
  });
  let litLamps = 0;
  const lightLamps = (count, now) => { while (litLamps < Math.min(LAMPS, count)) lamps[litLamps++].at = now; };

  /* ---------- Bụi bay trong vệt đèn (cinematic) ---------- */
  let dust;
  if (cine) {
    const N = 420, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * HALF * 2; pos[i * 3 + 1] = Math.random() * H; pos[i * 3 + 2] = (Math.random() - .5) * 12; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(geo, new THREE.PointsMaterial({ map: softTex, color: lightC, size: .028, transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending }));
    dust.frustumCulled = false; scene.add(dust);
  }

  /* ---------- Bước vào trong ảnh ---------- */
  const insideMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: null }, uOp: { value: 0 }, uTilt: { value: new THREE.Vector2() }, uT: { value: 0 }, uA: { value: 1 }, uIA: { value: .75 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D map; uniform float uOp,uT,uA,uIA; uniform vec2 uTilt; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5); }
      void main(){
        vec2 uv=vUv-.5; float r=uA/uIA; if(r>1.) uv.y/=r; else uv.x*=r;
        float z=1.08+.03*sin(uT*.25); uv/=z; uv+=.5;
        // chiều sâu ước lượng: phía dưới ảnh gần hơn, vùng sáng nhô ra một chút
        float lum=dot(texture2D(map,uv).rgb,vec3(.3,.59,.11));
        float d=clamp((1.-uv.y)*.75+lum*.35,0.,1.);
        vec2 puv=uv+uTilt*(d-.45)*.05;
        vec3 c=texture2D(map,puv).rgb;
        // đốm sáng bokeh trôi trước mặt
        for(int i=0;i<7;i++){ float fi=float(i); vec2 p=vec2(h(vec2(fi,1.)),fract(h(vec2(fi,2.))+uT*.012*(1.+fi*.2))); p+=uTilt*(.04+.02*fi);
          vec2 q=(vUv-p)*vec2(uA,1.); c+=vec3(1.,.86,.66)*.09*smoothstep(.07+.012*fi,.0,length(q)); }
        float v=smoothstep(.95,.3,length(vUv-.5)); c*=mix(.55,1.,v);
        gl_FragColor=vec4(c,uOp);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthTest: false, depthWrite: false,
  });
  const insideQuad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), insideMat);
  insideQuad.renderOrder = 999; insideQuad.position.z = -.3; insideQuad.visible = false;
  camera.add(insideQuad);
  const inside = { k: -1, t: 0, dir: 0 };
  const outBtn = el.querySelector('.ptl-out');

  function enter(st) {
    if (inside.dir || inside.k >= 0 || !st.tex) return;
    inside.k = st.k; inside.t = 0; inside.dir = 1;
    insideMat.uniforms.map.value = st.tex; insideMat.uniforms.uIA.value = st.aspect || .75;
    insideQuad.visible = true;
    root.classList.add('ptl-inside');
    outBtn.tabIndex = 0;
    setTimeout(() => outBtn.focus({ preventScroll: true }), 900);
  }
  function leave() { if (inside.k >= 0 && inside.dir !== -1) inside.dir = -1; }
  outBtn.addEventListener('click', leave);
  const onKey = e => { if (e.key === 'Escape') leave(); };
  document.addEventListener('keydown', onKey);

  /* ---------- Tải ảnh: gần trước, xa sau; tối đa 1024px ---------- */
  const workStops = stops.filter(s => s.kind === 'work');
  let atlasN = 0;
  async function loadPhoto(st) {
    const img = new Image(); img.decoding = 'async'; img.src = st.src;
    await img.decode();
    const s = Math.min(1, MAX_TEX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    st.tex = tex; st.aspect = c.width / c.height;
    st.photo.material.dispose();
    st.photo.material = new THREE.MeshBasicMaterial({ map: tex, color: '#000' });
    setPhotoSize(st, st.aspect);
    if (atlasN < 16) {
      const k = atlasN++, side = Math.min(c.width, c.height), cs = 1024 / ATL;
      atlasG.drawImage(c, (c.width - side) / 2, (c.height - side) / 2, side, side, (k % ATL) * cs, Math.floor(k / ATL) * cs, cs, cs);
      atlas.needsUpdate = true;
    }
    layout();
  }
  const loading = (async () => {
    for (const st of workStops) { try { await loadPhoto(st); } catch (e) { console.warn('[phòng tranh] không tải được ảnh', st.src); } }
  })();

  /* ---------- Hậu kỳ ---------- */
  let composer = null, grade = null;
  if (cine) {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    // Ngưỡng > 1: chỉ thứ phát sáng (đèn) mới loá, ảnh cưới giữ nguyên màu
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), P.bloom, .6, 1.05));
    composer.addPass(new OutputPass());
    grade = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uGrain: { value: .045 }, uVig: { value: .55 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D tDiffuse; uniform float uT,uGrain,uVig; varying vec2 vUv;
        void main(){ vec4 c=texture2D(tDiffuse,vUv); float d=distance(vUv,vec2(.5));
        c.rgb*=mix(1.,smoothstep(.9,.28,d),uVig);
        float n=fract(sin(dot(vUv*vec2(1271.3,947.7)+fract(uT)*91.,vec2(12.9898,78.233)))*43758.5453);
        c.rgb+=(n-.5)*uGrain; gl_FragColor=c; }`,
    });
    composer.addPass(grade);
  }

  /* ---------- Bố cục theo màn hình ---------- */
  let W = 1, Hh = 1, aspect = 1, offsets = [];
  const plateSize = st => st.cel ? [st.cel.offsetWidth * PX, st.cel.offsetHeight * PX] : [0, 0];
  function layout() {
    W = innerWidth; Hh = innerHeight; aspect = W / Hh;
    camera.fov = aspect < 1 ? 56 : 44; camera.aspect = aspect; camera.updateProjectionMatrix();
    renderer.setSize(W, Hh, false); css.setSize(W, Hh); composer?.setSize(W, Hh);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const portrait = aspect < .9;
    root.classList.toggle('ptl-portrait', portrait); // đổi khổ chữ trước khi đo
    for (const st of stops) {
      // Khung cần thấy trọn (trong hệ toạ độ của bức tường) rồi tính khoảng lùi của camera
      let box;
      if (st.kind === 'work') {
        const [lw, lh] = plateSize(st);
        if (portrait) {
          st.css.position.set(-st.fw / 2 + lw / 2, -st.fh / 2 - .14 - lh / 2, .01);
          box = [-st.fw / 2, st.fw / 2, -st.fh / 2 - .14 - lh, st.fh / 2];
        } else {
          st.css.position.set(st.fw / 2 + .22 + lw / 2, -st.fh / 2 + lh / 2, .01);
          box = [-st.fw / 2, st.fw / 2 + .22 + lw, -st.fh / 2, st.fh / 2];
        }
      } else if (st.k === FIN) {
        const [pw, ph] = plateSize(st);
        st.css.position.set(0, -.78 - ph / 2, .02); // dưới đáy trái tim (đáy ở khoảng -0,6)
        box = [-1.4, 1.4, -.78 - ph, 1.95];
      } else {
        const [pw, ph] = plateSize(st);
        st.css.position.set(0, .15, .01);
        box = [-pw / 2, pw / 2, .15 - ph / 2, .15 + ph / 2];
      }
      const cx = (box[0] + box[1]) / 2, cy = (box[2] + box[3]) / 2, bw = box[1] - box[0], bh = box[3] - box[2];
      const fill = st.kind === 'work' ? .9 : .82;
      let d = Math.max(bh / (fill * 2 * tanV), bw / (fill * 2 * tanV * aspect)) + .05;
      d = Math.min(d, st.k === FIN ? 9 : HALF * 2 - .5);
      st.target = st.g.localToWorld(new V3(cx, cy, 0));
      st.cam = st.target.clone().addScaledVector(st.normal, d);
      st.dist = d;
      if (st.k !== FIN) st.cam.z += d * .16; // lùi chếch về phía vừa đi qua: thấy chiều sâu hành lang
      st.cam.y = clamp(st.cam.y, 1.15, 2.3);
    }
    // Vị trí cuộn của từng điểm dừng
    offsets = stops.map(s => s.li.getBoundingClientRect().top + scrollY);
  }

  /* ---------- Điều khiển: cuộn, nhìn quanh (chuột / con quay), chạm ---------- */
  let pT = 0, p = 0, scrolled = false;
  const readScroll = () => {
    const y = scrollY;
    let k = 0; while (k < n - 1 && y >= offsets[k + 1]) k++;
    const span = k < n - 1 ? offsets[k + 1] - offsets[k] : innerHeight;
    pT = clamp(k + (y - offsets[k]) / span, 0, n - 1);
    if (y > 40) scrolled = true;
  };
  const look = { x: 0, y: 0, sx: 0, sy: 0 };
  const onMove = e => { if (e.pointerType === 'mouse') { look.x = e.clientX / W * 2 - 1; look.y = e.clientY / Hh * 2 - 1; } };
  let base = null;
  const onTilt = e => {
    if (e.gamma == null) return;
    base ||= { g: e.gamma, b: e.beta };
    look.x = clamp((e.gamma - base.g) / 22, -1, 1); look.y = clamp((e.beta - base.b) / 22, -1, 1);
  };
  let down = null;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const onDown = e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; };
  const onUp = e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 || performance.now() - down.t > 450) return;
    if (inside.k >= 0) { leave(); return; }
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / Hh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(photos)[0];
    if (hit) enter(stops[hit.object.userData.k]);
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { layout(); readScroll(); });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('deviceorientation', onTilt);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);

  /* ---------- Sự kiện thiệp: lời chúc, giữ chỗ ---------- */
  let now = 0;
  ctx.on('wishes', list => lightLamps(Math.min(LAMPS - 1, list.length), now));
  ctx.on('rsvp', x => {
    if (x?.attend === 'Không') return;
    lightLamps(litLamps + 1, now);
    finSt.cel?.querySelector('.ptl-dot')?.classList.add('is-on');
  });

  /* ---------- Vòng vẽ ---------- */
  const tmp = new V3(), tmpL = new V3();
  let fpsN = 0, fpsT = performance.now();
  let raf = 0, last = performance.now(), power = 0, powerAt = -1, alive = true;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    // Thời gian thật cho đèn/hoạt cảnh (máy chậm vẫn đúng nhịp), bước làm mượt chặn ở 0,1s
    const dt = Math.min(.1, (t - last) / 1000); last = t; now = t / 1000;
    if (powerAt < 0) powerAt = now;
    power = flicker((now - powerAt) / 1.4);

    // Tiến trình đi bộ (giữ nguyên khi đang ở trong ảnh)
    if (inside.k < 0) p = SNAP ? pT : p + (pT - p) * (1 - Math.exp(-dt * 3.2));
    look.sx += (look.x - look.sx) * (1 - Math.exp(-dt * 4)); look.sy += (look.y - look.sy) * (1 - Math.exp(-dt * 4));

    // Đèn rọi bật dần khi khách đến gần
    for (const st of stops) {
      if (st.litAt < 0 && p > st.k - 1.35 && powerAt >= 0) st.litAt = now + (st.k === 0 ? .1 : 0);
      st.lit = st.litAt < 0 ? 0 : flicker((now - st.litAt) / 1.1) * power;
      const near = clamp(1 - Math.abs(p - st.k) * .55, .35, 1);
      if (st.pools) {
        st.pools[0].material.opacity = st.pools[0].userData.op * st.lit * near;
        st.pools[1].material.opacity = st.pools[1].userData.op * st.lit;
        st.lens.material.color.copy(lightC).multiplyScalar(6 * st.lit);
        st.beam.material.uniforms.uOp.value = (cine ? .09 : .06) * st.lit;
      }
      if (st.photo) st.photo.material.color.setScalar(.07 + .8 * st.lit);
      if (st.cel) {
        const op = clamp(1.25 - Math.abs(p - st.k) * 1.5) * clamp(st.lit * 1.4);
        st.cel.style.opacity = op.toFixed(3);
        st.cel.style.pointerEvents = op > .6 ? 'auto' : 'none';
      }
    }

    // Hai đèn rọi thật theo hai điểm dừng gần nhất
    const k0 = Math.min(Math.floor(p), n - 2), f = p - k0;
    [[k0, 1 - f], [k0 + 1, f]].forEach(([k, w], j) => {
      const st = stops[k], key = keys[j];
      if (!st?.fixPos) { key.intensity = 0; return; }
      key.position.copy(st.fixPos); key.target.position.copy(st.aim);
      key.intensity = 60 * w * st.lit;
    });

    // Trái tim ghép ảnh: bắt đầu khi tới gần cuối phòng
    if (mosaicT < 0 && p > FIN - .55) mosaicT = SNAP ? 3 : 0;
    if (SNAP && mosaicT >= 3 && !tiles.userData.done) { placeTiles(9); tiles.userData.done = true; }
    if (mosaicT >= 0 && mosaicT < 3) { mosaicT += SNAP ? dt * 3 : Math.min(.05, dt); placeTiles(mosaicT); }
    tileMat.uniforms.uGlow.value = mosaicT > 2.5 ? .08 + .06 * Math.sin(now * 1.6) : 0;
    finPool.material.opacity = finPool.userData.op * clamp(mosaicT / 1.5) * power;
    finFloor.material.opacity = finFloor.userData.op * clamp(mosaicT / 1.5) * power;

    // Đèn giữ chỗ
    for (const l of lamps) {
      const v = l.at < 0 ? 0 : flicker((now - l.at) / .9);
      l.bulb.material.color.copy(lightC).multiplyScalar(.12 + v * 5);
    }

    // Camera: nội suy giữa hai điểm dừng, đi qua giữa hành lang, liếc về phía trước khi bước
    const a = stops[k0], b = stops[Math.min(k0 + 1, n - 1)], e = ease(clamp(f)), arc = Math.sin(Math.PI * e);
    tmp.lerpVectors(a.cam, b.cam, e); tmp.x *= 1 - arc * .5;
    tmpL.lerpVectors(a.target, b.target, e); tmpL.x *= 1 - arc * .55; tmpL.z -= arc * 2.4;
    camera.fov = aspect < 1 ? 56 : 44;

    if (inside.k >= 0) {
      // Dolly zoom vào bức ảnh rồi xuyên qua mặt kính
      const st = stops[inside.k];
      inside.t = clamp(inside.t + Math.min(.05, dt) * (inside.dir > 0 ? .8 : -1.25) * (inside.dir ? 1 : 0));
      const q = ease(inside.t);
      const fov0 = camera.fov, fovZ = fov0 + 26 * Math.sin(Math.PI * clamp(q / .75) / 2) * (1 - clamp((q - .75) / .25));
      const tan0 = Math.tan(THREE.MathUtils.degToRad(fov0 / 2)), tanZ = Math.tan(THREE.MathUtils.degToRad(fovZ / 2));
      const centre = st.g.localToWorld(new V3(0, 0, 0));
      const dSame = (st.fh / (2 * tan0)) * tan0 / tanZ;
      const dIn = Math.max(.08, dSame * (1 - clamp((q - .6) / .4) * .92));
      const front = centre.clone().addScaledVector(st.normal, dIn);
      const w = clamp(q / .35);
      tmp.lerp(front, w); tmpL.lerp(centre, w);
      camera.fov = fovZ;
      insideMat.uniforms.uOp.value = clamp((q - .78) / .22);
      if (inside.dir < 0 && inside.t <= 0) {
        inside.k = -1; inside.dir = 0; insideQuad.visible = false;
        root.classList.remove('ptl-inside'); outBtn.tabIndex = -1;
      } else if (inside.dir > 0 && inside.t >= 1) inside.dir = 0;
    }
    camera.updateProjectionMatrix();
    camera.position.copy(tmp);
    camera.lookAt(tmpL);
    const lookAmt = inside.k >= 0 ? .25 : 1;
    camera.rotateY(-look.sx * .09 * lookAmt); camera.rotateX(-look.sy * .05 * lookAmt);

    if (insideQuad.visible) {
      const hq = 2 * .3 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      insideQuad.scale.set(hq * aspect, hq, 1);
      insideMat.uniforms.uA.value = aspect; insideMat.uniforms.uT.value = now;
      insideMat.uniforms.uTilt.value.set(look.sx, -look.sy);
    }

    if (dust) {
      const pos = dust.geometry.attributes.position.array, cz = camera.position.z;
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += Math.sin(now * .3 + i) * .0008; pos[i + 1] += .0012 + Math.cos(now * .2 + i * .7) * .0006;
        if (pos[i + 1] > H) pos[i + 1] = 0;
        if (pos[i + 2] > cz + 4) pos[i + 2] -= 12; else if (pos[i + 2] < cz - 8) pos[i + 2] += 12;
      }
      dust.geometry.attributes.position.needsUpdate = true;
      dust.material.opacity = .4 * power;
    }

    fpsN++; if (t - fpsT > 1000) { window.__ptl = { fps: fpsN * 1000 / (t - fpsT), p, pT }; fpsN = 0; fpsT = t; }
    el.style.setProperty('--ptl-p', (p / Math.max(1, n - 1)).toFixed(4));
    if (grade) grade.uniforms.uT.value = now;
    if (composer) composer.render(); else renderer.render(scene, camera);
    css.render(scene, camera);
  }

  const onVis = () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else if (!raf && alive) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVis);

  // Mất ngữ cảnh WebGL (hay gặp trong Zalo khi chuyển app): dọn cảnh, trả về sách triển lãm phẳng
  function teardown() {
    alive = false; cancelAnimationFrame(raf);
    removeEventListener('scroll', readScroll); removeEventListener('pointermove', onMove); removeEventListener('deviceorientation', onTilt);
    document.removeEventListener('visibilitychange', onVis); document.removeEventListener('keydown', onKey);
    cssLayer.replaceChildren();
    root.classList.remove('ptl-3d', 'ptl-ready', 'ptl-inside');
  }
  bindContextLoss(canvas, () => { teardown(); ctx.downgrade('webglcontextlost'); });

  /* ---------- Khởi động: dựng bố cục, chờ 2 ảnh đầu, bật đèn ---------- */
  css.render(scene, camera); // cho bản sao DOM vào trang để đo kích thước
  layout(); readScroll(); p = pT;
  await Promise.race([Promise.all(workStops.slice(0, 2).map(s => new Promise(r => { const t = setInterval(() => { if (s.tex) { clearInterval(t); r(); } }, 50); }))), new Promise(r => setTimeout(r, 2500))]);
  renderer.compile(scene, camera);
  root.classList.add('ptl-ready');
  raf = requestAnimationFrame(frame);
  setTimeout(() => { if (!scrolled) el.classList.add('show-hint'); }, 2200);
  addEventListener('scroll', () => el.classList.remove('show-hint'), { passive: true, once: true });
  loading.then(() => layout());
  return { teardown };
}
