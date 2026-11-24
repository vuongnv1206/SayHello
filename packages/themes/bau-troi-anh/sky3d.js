// Cảnh 3D của mẫu Bầu Trời Ảnh. Camera đứng yên ở giữa đồng, chỉ xoay như cái đầu:
//   hướng (yaw) = kéo ngang / con quay / la bàn; độ ngước (pitch) = cuộn trang (kéo đêm xuống, ngước dần lên)
//   + con quay + kéo dọc bằng chuột. Ảnh là sao mang màu trung bình của chính ảnh; nhìn vào ~0,45s thì NỞ thành ảnh,
//   đường mắt khách đi qua các ảnh đã nở vẽ thành chòm sao. Ảnh giữ ≤1 (không loá), chỉ sao/trăng/đom đóm mới loá.
// Hạ tầng dùng chung: @sayhello/engine/client/stage3d.js.
import {
  clamp, ease, withTimeout, loadThree, createLife, makeRenderer, createPost, createPhotoLoader,
  clonePlate, fpsGuard, startLoop, disposeScene, SHADER_TAIL,
} from '@sayhello/engine/client/stage3d.js';

const PX = 1 / 400;
const R_PHOTO = 14, R_PLATE = 3.8, R_RIDGE = 30;
const D2R = Math.PI / 180;

export async function runSky(el, ctx, { tier, palettes, skyLayout, BEARINGS, moonPhase }) {
  const root = document.documentElement;
  const SNAP = new URLSearchParams(location.search).has('snap');
  root.classList.add('bt-3d');
  const T = await loadThree(ctx);
  if (!ctx.opened || root.dataset.motion === 'lite') throw new Error('đã hạ mức');
  const { THREE, CSS3DRenderer, CSS3DObject, bindContextLoss } = T;
  const V3 = THREE.Vector3;
  const pal = palettes.find(p => p.id === root.dataset.palette) || palettes[0];
  const P = pal.preset;
  const cine = tier === 'cinematic';
  const coarse = matchMedia('(pointer: coarse)').matches;
  const C = k => new THREE.Color(P[k]);
  const dirOf = (yaw, alt, r = 1) => new V3(Math.sin(yaw * D2R) * Math.cos(alt * D2R), Math.sin(alt * D2R), -Math.cos(yaw * D2R) * Math.cos(alt * D2R)).multiplyScalar(r);

  const life = createLife(root, ['bt-3d', 'bt-ready', 'bt-portrait', 'bt-gathering']);
  const canvas = el.querySelector('.bt-canvas');
  const { renderer, gpu } = makeRenderer(THREE, canvas, { cine, coarse, snap: SNAP, exposure: P.exposure, life });
  let dirty = true, animUntil = 0, W = 0, H = 0, aspect = 1;
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, .1, 200);
    camera.rotation.order = 'YXZ';
    scene.add(camera);
    const cssLayer = el.querySelector('.bt-css');
    const css = new CSS3DRenderer({ element: cssLayer });
    life.own(() => cssLayer.replaceChildren());
    life.own(() => disposeScene(scene));
    const uNight = { value: 0 }, uT = { value: 0 };

    /* ---------- Bầu trời: dải màu theo độ cao, quầng ráng phía Tây, chuyển dần sang đêm ---------- */
    const sky = new THREE.Mesh(new THREE.SphereGeometry(95, 40, 20), new THREE.ShaderMaterial({
      uniforms: { uNight, uZ: { value: C('zenith') }, uH: { value: C('haze') }, uB: { value: C('band') }, uZN: { value: C('nightZenith') }, uHN: { value: C('nightHaze') }, uBN: { value: C('nightBand') } },
      vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
      fragmentShader: `uniform float uNight; uniform vec3 uZ,uH,uB,uZN,uHN,uBN; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
        void main(){
          float a=vD.y;
          vec3 Z=mix(uZ,uZN,uNight), Hh=mix(uH,uHN,uNight), B=mix(uB,uBN,uNight);
          vec3 c=mix(B,Hh,smoothstep(-.02,.12,a));
          c=mix(c,Z,smoothstep(.08,.75,a));
          // quầng ráng chiều phía Tây, tắt dần khi về đêm
          vec3 gd=normalize(vec3(-.94,.04,-.33)); float g=pow(max(dot(vD,gd),0.),6.)*(1.-uNight*.8);
          c+=B*g*.35;
          c+=(h(gl_FragCoord.xy)-.5)/255.; // khử sọc dải màu
          gl_FragColor=vec4(c,1.);${SHADER_TAIL} }`,
      side: THREE.BackSide, depthWrite: false,
    }));
    sky.renderOrder = -2; sky.frustumCulled = false; scene.add(sky);

    /* ---------- Sao nền: lấp lánh, hiện dần khi trời tối (chỉ sao mới loá) ---------- */
    const NS = cine ? 900 : 500;
    const sp = new Float32Array(NS * 3), sa = new Float32Array(NS * 2);
    for (let i = 0; i < NS; i++) {
      const u = Math.random(), v = Math.random();
      const yaw = u * 360, alt = Math.asin(.05 + .95 * v) / D2R;
      dirOf(yaw, alt, 88).toArray(sp, i * 3);
      sa[i * 2] = Math.random() * 6.28; sa[i * 2 + 1] = .4 + Math.pow(Math.random(), 3) * 2.2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    starGeo.setAttribute('aS', new THREE.BufferAttribute(sa, 2));
    const stars = new THREE.Points(starGeo, new THREE.ShaderMaterial({
      uniforms: { uNight, uT, uPx: { value: 1 } },
      vertexShader: `attribute vec2 aS; uniform float uT,uNight,uPx; varying float vB;
        void main(){ vB=(.55+.45*sin(uT*1.7+aS.x))*aS.y*smoothstep(.15,.8,uNight+.12); gl_PointSize=(1.2+aS.y*.9)*uPx; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `varying float vB; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vec3(1.,.98,.92)*vB*a*2.,1.);${SHADER_TAIL} }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    stars.frustumCulled = false; scene.add(stars);

    /* ---------- Dãy đồi chân trời tạo từ tên hai người, viền sáng ở mép trên ---------- */
    const nameEl = el.closest('body').querySelector('.bt-ridge');
    const nameText = nameEl ? [...nameEl.querySelectorAll('span')].map(s => s.textContent.trim()) : [];
    const rC = document.createElement('canvas'); rC.width = 4096; rC.height = 512;
    const ridgeTex = new THREE.CanvasTexture(rC);
    ridgeTex.wrapS = THREE.RepeatWrapping; ridgeTex.repeat.x = -1; ridgeTex.offset.x = 1; // nhìn từ bên trong: lật ngang
    const drawRidge = () => {
      const g = rC.getContext('2d'); g.clearRect(0, 0, 4096, 512); g.fillStyle = '#fff';
      // đồi thấp quanh 360°
      g.beginPath(); g.moveTo(0, 512);
      for (let x = 0; x <= 4096; x += 16) { const y = 430 - 26 * Math.sin(x * .0031) - 18 * Math.sin(x * .0087 + 1.3) - 10 * Math.sin(x * .021); g.lineTo(x, y); }
      g.lineTo(4096, 512); g.fill();
      // tên hai người ở hướng Bắc (giữa canvas), chân chữ chìm vào đồi
      g.font = '900 300px Fraunces, "Be Vietnam Pro", serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(nameText.join('  '), 2048, 470, 1150);
      ridgeTex.needsUpdate = true; dirty = true;
    };
    drawRidge(); document.fonts?.load('900 300px Fraunces').then(() => life.alive && drawRidge()).catch(() => {});
    const ridgeTop = R_RIDGE * Math.tan(15 * D2R), ridgeBot = -R_RIDGE * Math.tan(10 * D2R);
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(R_RIDGE, R_RIDGE, ridgeTop - ridgeBot, 96, 1, true), new THREE.ShaderMaterial({
      uniforms: { map: { value: ridgeTex }, uRidge: { value: C('ridge') }, uRim: { value: C('band') }, uNight },
      vertexShader: `varying vec2 vUv; void main(){ vUv=(uv-.5)*vec2(-1.,1.)+.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 uRidge,uRim; uniform float uNight; varying vec2 vUv;
        void main(){ float a=texture2D(map,vUv).a; if(a<.5) discard;
          float up=texture2D(map,vUv+vec2(0.,3./512.)).a;
          float rim=(1.-up)*(1.-uNight*.5);
          gl_FragColor=vec4(uRidge+uRim*rim*.9,1.);${SHADER_TAIL} }`,
      side: THREE.BackSide,
    }));
    ridge.position.y = (ridgeTop + ridgeBot) / 2; ridge.rotation.y = 0; scene.add(ridge);

    /* ---------- Trăng đúng pha ngày cưới ---------- */
    const phase = moonPhase(ctx.data.date || Date.now());
    // màn dọc chỉ thấy ~35° ngang: kéo trăng (và ô gợi ý dưới nó) vào gần giữa để không bị cắt mép
    const MOON_YAW = innerWidth / innerHeight < .9 ? -10 : -20;
    const moonDir = dirOf(MOON_YAW, 24);
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShaderMaterial({
      uniforms: { uPhase: { value: phase }, uNight },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform float uPhase,uNight; varying vec2 vUv;
        void main(){ vec2 p=(vUv-.5)*2.; float r=length(p);
          float disc=smoothstep(.36,.34,r);
          // vùng sáng theo pha: đường phân sáng tối là một nửa elip; trăng non sáng bên phải, trăng già sáng bên trái
          float x=p.x/.35, y=p.y/.35, sq=sqrt(max(0.,1.-y*y)), k=cos(uPhase*6.2832)*sq;
          float lit=uPhase<.5?smoothstep(k-.04,k+.04,x):smoothstep(-k+.04,-k-.04,x);
          float halo=pow(max(0.,1.-r),3.)*.25;
          vec3 c=vec3(1.,.97,.9)*(disc*(.12+lit*1.)*(1.4+uNight*1.6)+halo*(.4+uNight));
          gl_FragColor=vec4(c,1.);${SHADER_TAIL} }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    moon.position.copy(moonDir.clone().multiplyScalar(70)); moon.lookAt(0, 0, 0); scene.add(moon);

    /* ---------- Ảnh: sao màu của chính ảnh → nở như mống mắt ---------- */
    const lay = skyLayout(el.querySelectorAll('.bt-photo').length);
    const blank = new THREE.DataTexture(new Uint8Array([120, 130, 140, 255]), 1, 1); blank.needsUpdate = true;
    const photoMat = () => new THREE.ShaderMaterial({
      uniforms: { map: { value: blank }, uBloom: { value: 0 }, uAvg: { value: new THREE.Color(.8, .85, .9) }, uOn: { value: 0 }, uA: { value: .75 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform sampler2D map; uniform float uBloom,uOn,uA; uniform vec3 uAvg; varying vec2 vUv;
        void main(){
          vec2 q=(vUv-.5)*vec2(uA,1.)/max(uA,1.); float d=length(q)*2.;
          float r=mix(.05,1.6,uBloom);                     // mống mắt mở dần
          float inside=smoothstep(r,r-.06,d);
          vec3 ph=texture2D(map,vUv).rgb;
          float edge=step(.985,max(abs(vUv.x-.5),abs(vUv.y-.5))*2.); // viền nhạt 1,5%
          ph=mix(ph,vec3(.93,.95,.92),edge);
          float star=(smoothstep(.07,0.,d)+smoothstep(.2,0.,d)*.25)*(1.-uBloom); // lõi nhỏ, sắc như sao
          vec3 c=ph*inside*.96+uAvg*star*1.7;            // ảnh ≤ 1, chỉ lõi sao mới loá
          float a=max(inside,star)*uOn;
          if(a<.01) discard;
          gl_FragColor=vec4(c*uOn,a);${SHADER_TAIL} }`,
      transparent: true, depthWrite: false,
    });
    const items = lay.map((L, i) => {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat());
      const it = { i, L, mesh, home: dirOf(L.yaw, L.alt, R_PHOTO), bloom: 0, bloomAt: -1, gaze: 0, onAt: -1, aspect: .75, size: 2.3 * L.mag, gatherTo: null };
      mesh.position.copy(it.home); mesh.lookAt(0, 0, 0); mesh.userData.it = it;
      scene.add(mesh);
      return it;
    });
    const sizeIt = (it, a) => { it.aspect = a; const s = it.size; it.mesh.scale.set(a >= 1 ? s : s * a, a >= 1 ? s / a : s, 1); it.mesh.material.uniforms.uA.value = a; };
    items.forEach(it => sizeIt(it, .75));
    // Quầng sáng mỗi ảnh: một lần vẽ cho tất cả
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.25)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), Math.max(1, items.length));
    halos.frustumCulled = false; scene.add(halos);

    /* ---------- Chòm sao theo đường mắt khách ---------- */
    const MAXL = 64, lp = new Float32Array(MAXL * 6);
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lineGeo.setDrawRange(0, 0);
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: C('accent').multiplyScalar(1.7), transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }));
    lines.frustumCulled = false; scene.add(lines);
    const segs = []; let lastBloomed = null;
    const addSeg = (a, b, at) => { if (segs.length < MAXL) segs.push({ a, b, at }); };

    /* ---------- Đom đóm và sao của khách ---------- */
    const accent = C('accent');
    const NF = 60, fp = new Float32Array(NF * 3), fs = new Float32Array(NF);
    for (let i = 0; i < NF; i++) { dirOf(Math.random() * 360, -4 + Math.random() * 10, 7 + Math.random() * 8).toArray(fp, i * 3); fs[i] = Math.random() * 6.28; }
    const flyGeo = new THREE.BufferGeometry(); flyGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3)); flyGeo.setAttribute('aS', new THREE.BufferAttribute(fs, 1));
    const flies = new THREE.Points(flyGeo, new THREE.ShaderMaterial({
      uniforms: { uT, uC: { value: accent }, uNight, uPx: { value: 1 } },
      vertexShader: `attribute float aS; uniform float uT,uPx; varying float vB; void main(){ vB=pow(max(.5+.5*sin(uT*1.3+aS*3.),0.),3.); vec3 p=position+vec3(sin(uT*.4+aS),cos(uT*.33+aS)*.4,cos(uT*.37+aS))*.35; gl_PointSize=3.*uPx; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
      fragmentShader: `uniform vec3 uC; uniform float uNight; varying float vB; void main(){ float a=smoothstep(.5,0.,length(gl_PointCoord-.5)); gl_FragColor=vec4(uC*vB*a*2.2*(.4+uNight),1.);${SHADER_TAIL} }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    flies.frustumCulled = false; scene.add(flies);
    const MAXG = 200, gp = new Float32Array(MAXG * 3);
    const guestGeo = new THREE.BufferGeometry(); guestGeo.setAttribute('position', new THREE.BufferAttribute(gp, 3)); guestGeo.setDrawRange(0, 0);
    const guests = new THREE.Points(guestGeo, new THREE.PointsMaterial({ color: accent.clone().multiplyScalar(2), size: 4, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, map: glowTex }));
    guests.frustumCulled = false; scene.add(guests);
    let nGuests = 0;
    const guestStar = k => dirOf((k * 137.5) % 360, 62 + (k * 7.3) % 24, 80);
    const setGuests = n => { n = Math.min(MAXG, n); for (let k = nGuests; k < n; k++) guestStar(k).toArray(gp, k * 3); nGuests = n; guestGeo.setDrawRange(0, n); guestGeo.attributes.position.needsUpdate = true; dirty = true; };
    setGuests(ctx.wishes.length);
    ctx.on('wishes', l => life.alive && setGuests(l.length));
    const risers = []; // đom đóm của khách vừa giữ chỗ, bay lên thành sao
    const riserMesh = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshBasicMaterial({ map: glowTex, color: accent.clone().multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    riserMesh.visible = false; scene.add(riserMesh);
    ctx.on('rsvp', x => {
      if (!life.alive || x?.attend === 'Không') return;
      risers.push({ at: uT.value, from: dirOf(yaw + 10, -2, 9), to: guestStar(nGuests) });
      animUntil = Math.max(animUntil, uT.value + 5);
    });

    /* ---------- Bảng thông tin trên đường chân trời (bản sao HTML máy chủ) ---------- */
    const plates = [];
    for (const src of el.querySelectorAll('.bt-plates > .bt-plate')) {
      const b = src.dataset.bearing;
      const pl = clonePlate(CSS3DObject, src, 'bt-c bt-c-' + b, PX);
      const pos = b === 'moon' ? moonDir.clone().multiplyScalar(R_PLATE).add(new V3(0, -.8, 0)) : dirOf(BEARINGS[b] ?? 0, b === 'date' ? 4 : 6, R_PLATE);
      pl.obj.position.copy(pos); pl.obj.lookAt(0, pos.y, 0);
      pl.bearing = b === 'moon' ? MOON_YAW : BEARINGS[b] ?? 0; pl.alt = b === 'moon' ? 14 : 6;
      scene.add(pl.obj); plates.push(pl);
    }
    life.listen(cssLayer, 'click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      e.preventDefault(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
    });

    /* ---------- Hậu kỳ: ngưỡng bloom 1,0, ảnh luôn ≤ 0,96 nên không bị loá ---------- */
    let post = cine ? createPost(T, renderer, scene, camera, { bloom: P.bloom, threshold: 1.0, radius: .45, coarse, grade: { uVig: .22, uGrain: .025 } }) : null;
    life.own(() => post?.dispose());

    /* ---------- Điều khiển: xoay đầu ---------- */
    const view = { yaw: 0, yawT: 0, vel: 0, pitchDrag: 0, gyroYaw: 0, gyroPitch: 0, turnFrom: null };
    let yaw = 0, pitch = -8;
    const startAt = performance.now() / 1000;
    let night = 0, pitchBase = 10;
    const troi = el;
    const readScroll = () => {
      const r = troi.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight);
      night = clamp(-r.top / span);
      if (scrollY > 40) el.classList.remove('show-hint');
      dirty = true;
    };
    // Con quay: dựng quaternion hướng máy (như DeviceOrientationControls) rồi lấy hướng nhìn của camera sau,
    // vì góc Euler thô (alpha/beta) lật 180° đúng lúc khách giơ máy thẳng đứng ngắm trời; có bù xoay màn hình.
    let base = null, lastYaw = 0;
    const gq = new THREE.Quaternion(), gEu = new THREE.Euler(), gF = new V3();
    const qX = new THREE.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5)), qS = new THREE.Quaternion(), zAx = new V3(0, 0, 1);
    life.listen(window, 'deviceorientation', e => {
      if (e.alpha == null || e.beta == null) return;
      const orient = (screen.orientation?.angle ?? window.orientation ?? 0) * D2R;
      gEu.set(e.beta * D2R, e.alpha * D2R, -(e.gamma || 0) * D2R, 'YXZ');
      gq.setFromEuler(gEu).multiply(qX).multiply(qS.setFromAxisAngle(zAx, -orient));
      gF.set(0, 0, -1).applyQuaternion(gq);
      const p = Math.asin(clamp(gF.y, -1, 1)) / D2R;
      // gần thiên đỉnh thì hướng ngang không xác định: giữ hướng cũ
      const y = Math.abs(gF.y) > .97 ? lastYaw : Math.atan2(gF.x, -gF.z) / D2R; lastYaw = y;
      if (!base) base = { y, p };
      let dy = y - base.y; if (dy > 180) dy -= 360; if (dy < -180) dy += 360;
      const gy = dy, gp = clamp(p - base.p, -30, 60); // quay sang trái: hướng giảm, như yaw của camera
      // bỏ rung nhỏ của cảm biến để máy đặt yên thì vòng vẽ được nghỉ
      if (Math.abs(gy - view.gyroYaw) < .15 && Math.abs(gp - view.gyroPitch) < .15) return;
      view.gyroYaw = gy; view.gyroPitch = gp;
      dirty = true;
    });
    let drag = null;
    life.listen(canvas, 'pointerdown', e => { drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), mouse: e.pointerType === 'mouse' }; view.vel = 0; view.turnFrom = null; dirty = true; });
    life.listen(window, 'pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly; drag.lx = e.clientX; drag.ly = e.clientY;
      view.yawT -= dx * .22; view.vel = -dx * .22;
      if (drag.mouse) view.pitchDrag = clamp(view.pitchDrag + dy * .18, -30, 50);
      dirty = true;
    });
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const endDrag = e => {
      if (!drag) return;
      const still = Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 10 && performance.now() - drag.t < 450;
      drag = null;
      if (e.type !== 'pointerup' || !still) return;
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const h = ray.intersectObjects(items.map(i => i.mesh), false)[0];
      if (!h) return;
      const it = h.object.userData.it;
      if (it.bloom > .9) ctx.view?.(it.i); else bloom(it, uT.value);
    };
    life.listen(window, 'pointerup', endDrag); life.listen(window, 'pointercancel', endDrag);
    life.listen(window, 'keydown', e => {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowLeft') { view.yawT -= 20; dirty = true; } else if (e.key === 'ArrowRight') { view.yawT += 20; dirty = true; }
    });
    // La bàn: quay đầu tới ảnh hoặc hướng thông tin
    const turnTo = (y, alt) => {
      const curY = view.yawT; let d = ((y - curY) % 360 + 540) % 360 - 180;
      view.turnFrom = { y0: curY, y1: curY + d, p0: view.pitchDrag, p1: clamp(alt - pitchBase - view.gyroPitch, -30, 50), at: uT.value };
      dirty = true;
    };
    ctx.on('turn', x => {
      if (!life.alive) return;
      if (x.i != null && items[x.i]) { turnTo(items[x.i].L.yaw, items[x.i].L.alt); setTimeout(() => life.alive && bloom(items[x.i], uT.value), 650); }
      else if (x.bearing) turnTo(BEARINGS[x.bearing] ?? 0, 8);
    });
    life.listen(window, 'scroll', readScroll, { passive: true });
    let rz = 0;
    life.listen(window, 'resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(resize); });
    life.listen(window, 'orientationchange', () => { base = null; setTimeout(resize, 350); });

    function bloom(it, now) {
      if (it.bloomAt >= 0) return;
      it.bloomAt = now; animUntil = Math.max(animUntil, now + 1);
      if (lastBloomed && lastBloomed !== it) addSeg(lastBloomed, it, now);
      lastBloomed = it;
    }

    /* ---------- Gom trời: giữ mặt trăng, ảnh bay về ghép thành chữ cái đầu tên ---------- */
    const gather = { t: -1, hold: 0, holding: false, w: 0 };
    const letters = nameText.map(t => [...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(t)][0]?.segment || '').filter(Boolean);
    let gk = .36, GW = 160, GH = 100;
    const GATHER_ALT = 34;
    const glyphDir = ([x, y], r = R_PHOTO) => dirOf((x - GW / 2) * gk, GATHER_ALT - (y - GH / 2) * gk, r);
    function gatherTargets() {
      // Màn dọc: hai chữ xếp chồng (tận dụng chiều cao); màn ngang: một hàng
      const tall = camera.aspect < .9, rows = tall ? letters.map(l => [l]) : [letters];
      GW = tall ? 110 : 160; GH = tall ? 84 * rows.length + 8 : 100;
      const c = document.createElement('canvas'); c.width = GW; c.height = GH;
      const g = c.getContext('2d', { willReadFrequently: true }); g.fillStyle = '#fff'; g.font = '900 86px Fraunces, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const rowH = GH / rows.length;
      rows.forEach((r, k) => g.fillText(r.join(' '), GW / 2, rowH * (k + .54)));
      // cỡ chữ trên trời vừa góc nhìn: điện thoại dọc chỉ thấy ~35° ngang
      const vf = camera.fov, hf = 2 * Math.atan(Math.tan(vf * D2R / 2) * camera.aspect) / D2R;
      const tw = Math.max(40, ...rows.map(r => g.measureText(r.join(' ')).width));
      gk = clamp(Math.min(.84 * hf / tw, .62 * vf / GH), .12, .36);
      const d = g.getImageData(0, 0, GW, GH).data, pts = [], edge = [];
      const on = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && d[(y * GW + x) * 4 + 3] > 128;
      for (let y = 0; y < GH; y += 2) for (let x = 0; x < GW; x += 2) if (on(x, y)) pts.push([x, y]);
      // viền nét chữ: chuỗi sao nhỏ vẽ ra hình chữ theo thứ tự đọc, để mắt đọc được chữ trước khi ảnh bay tới
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (on(x, y) && (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1))) edge.push([x, y]);
      const step = Math.max(1, Math.ceil(edge.length / 800));
      setTrace(edge.filter((_, k) => k % step === 0), ([x, y]) => (Math.min(rows.length - 1, Math.floor(y / rowH)) + x / GW) / rows.length);
      if (!pts.length) return items.map(it => it.home);
      // lấy mẫu điểm xa nhau nhất để ảnh rải đều trên nét chữ
      const pick = [pts[Math.floor(pts.length / 2)]];
      const dist = pts.map(() => Infinity);
      while (pick.length < items.length) {
        const last = pick[pick.length - 1]; let bi = 0, bd = -1;
        pts.forEach((p, k) => { dist[k] = Math.min(dist[k], (p[0] - last[0]) ** 2 + (p[1] - last[1]) ** 2); if (dist[k] > bd) { bd = dist[k]; bi = k; } });
        pick.push(pts[bi]);
      }
      return pick.map(p => glyphDir(p));
    }
    const uG = { value: -1 };
    const trace = new THREE.Points(new THREE.BufferGeometry(), new THREE.ShaderMaterial({
      uniforms: { uG, uT, uC: { value: C('accent').multiplyScalar(1.6) }, uPx: { value: 1 } },
      vertexShader: `attribute float aD; uniform float uG,uT,uPx; varying float vB;
        void main(){ float a=smoothstep(aD,aD+.5,uG)*(1.-smoothstep(6.,7.8,uG)); vB=a*(.75+.25*sin(uT*3.+aD*40.));
          gl_PointSize=(2.2+2.5*(1.-smoothstep(aD+.1,aD+.9,uG)))*uPx*a; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 uC; varying float vB; void main(){ float r=length(gl_PointCoord-.5); if(r>.5) discard; gl_FragColor=vec4(uC*vB*(1.-r*1.8),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    trace.frustumCulled = false; trace.visible = false; scene.add(trace);
    function setTrace(edge, order) {
      // vẽ theo thứ tự đọc như tay viết: độ trễ 0,4s → 2s
      const pos = new Float32Array(edge.length * 3), del = new Float32Array(edge.length);
      edge.forEach((p, k) => { const v = glyphDir(p, R_PHOTO + .3); pos.set([v.x, v.y, v.z], k * 3); del[k] = .4 + order(p) * 1.6 + Math.random() * .15; });
      trace.geometry.dispose(); trace.geometry = new THREE.BufferGeometry();
      trace.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      trace.geometry.setAttribute('aD', new THREE.BufferAttribute(del, 1));
    }
    const startGather = () => {
      if (gather.t >= 0) return;
      const tg = gatherTargets(); items.forEach((it, k) => { it.gatherTo = tg[k]; bloom(it, uT.value); });
      gather.t = 0; root.classList.add('bt-gathering'); turnTo(0, pitchBase + view.gyroPitch + view.pitchDrag);
    };
    ctx.on('gather', () => life.alive && startGather());
    const moonPl = plates.find(p => p.cel.classList.contains('bt-c-moon'));
    for (const b of [el.querySelector('.bt-plates [data-sh-gather]'), moonPl?.cel.querySelector('[data-sh-gather]')].filter(Boolean)) {
      life.listen(b, 'pointerdown', e => { e.stopPropagation(); gather.holding = true; dirty = true; });
      for (const t of ['pointerup', 'pointerleave', 'pointercancel']) life.listen(b, t, () => { gather.holding = false; });
    }

    /* ---------- Bố cục ---------- */
    function resize() {
      if (!life.alive) return;
      W = innerWidth; H = innerHeight; aspect = W / H;
      camera.fov = aspect < 1 ? 68 : 56; camera.aspect = aspect; camera.updateProjectionMatrix();
      renderer.setSize(W, H, false); css.setSize(W, H); post?.setSize(W, H);
      const pr = renderer.getPixelRatio(); stars.material.uniforms.uPx.value = pr; flies.material.uniforms.uPx.value = pr; trace.material.uniforms.uPx.value = pr;
      root.classList.toggle('bt-portrait', aspect < .9);
      readScroll(); dirty = true;
    }

    /* ---------- Vòng vẽ ---------- */
    const loader = createPhotoLoader(THREE, renderer, { maxTex: cine ? 1024 : 768, life });
    const avgCanvas = document.createElement('canvas'); avgCanvas.width = avgCanvas.height = 4;
    const loading = loader.loadAll(items, it => el.querySelectorAll('.bt-photo img')[it.i].currentSrc || el.querySelectorAll('.bt-photo img')[it.i].src, (it, tex, a) => {
      it.mesh.material.uniforms.map.value = tex; sizeIt(it, a);
      // màu trung bình của ảnh (từ bản thu nhỏ 4x4) làm màu ngôi sao
      try { const g = avgCanvas.getContext('2d', { willReadFrequently: true }); g.drawImage(tex.image, 0, 0, 4, 4); const d = g.getImageData(0, 0, 4, 4).data; let r = 0, gg = 0, b = 0; for (let k = 0; k < 64; k += 4) { r += d[k]; gg += d[k + 1]; b += d[k + 2]; } const c = new THREE.Color(r / 4080, gg / 4080, b / 4080); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.4 + .1), Math.max(.55, hsl.l)); it.mesh.material.uniforms.uAvg.value.copy(c); } catch {}
      dirty = true;
    });
    const tmp = new V3(), fwd = new V3(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), sc = new V3(), col = new THREE.Color();
    const guard = fpsGuard({ disabled: SNAP, onSlow: () => { post?.dispose(); post = null; renderer.setPixelRatio(1); resize(); }, onTooSlow: () => { life.teardown(); ctx.downgrade('fps'); } });

    function frame(t, dt) {
      const now = t / 1000; uT.value = now;
      const busy = dirty || cine || loader.pending || drag || now < animUntil || gather.t >= 0 || gather.holding || view.turnFrom || Math.abs(view.vel) > .01 || risers.length;
      if (!busy) return;
      dirty = false;
      loader.pump();

      // Ngước lên lúc mở thiệp (−8° → độ ngước theo cuộn), rồi cuộn trang kéo đêm xuống và ngước dần lên
      uNight.value += (night - uNight.value) * (1 - Math.exp(-dt * 3));
      pitchBase = 10 + 30 * ease(clamp(uNight.value * 1.15));
      const intro = SNAP ? 1 : ease(clamp((now - startAt) / 2.2));
      if (!drag && Math.abs(view.vel) > .01) { view.yawT += view.vel; view.vel *= .92; }
      if (view.turnFrom) {
        const q = ease(clamp((now - view.turnFrom.at) / .7));
        view.yawT = view.turnFrom.y0 + (view.turnFrom.y1 - view.turnFrom.y0) * q;
        view.pitchDrag = view.turnFrom.p0 + (view.turnFrom.p1 - view.turnFrom.p0) * q;
        if (q >= 1) view.turnFrom = null;
      }
      view.yaw += (view.yawT - view.yaw) * (1 - Math.exp(-dt * 10));
      yaw = view.yaw + view.gyroYaw;
      pitch = -8 + (clamp(pitchBase + view.gyroPitch + view.pitchDrag, -5, 82) + 8) * intro;
      // Lúc gom trời, mắt tự hạ về đúng tầm chữ (dù khách đang cuộn đêm tới đâu), xong thì trả lại
      gather.w = gather.t < 0 ? 0 : ease(clamp(gather.t / 1.2)) * (1 - ease(clamp((gather.t - 6.6) / 1.6)));
      pitch += (GATHER_ALT - pitch) * gather.w;
      camera.rotation.set(pitch * D2R, -yaw * D2R, 0);
      camera.updateMatrixWorld();
      camera.getWorldDirection(fwd);

      // Ảnh: sáng dần lần lượt khi ngước lên; nhìn vào ~0,45s thì nở
      items.forEach((it, k) => {
        const u = it.mesh.material.uniforms;
        if (it.onAt < 0 && intro > .3) it.onAt = now + k * .08;
        u.uOn.value = it.onAt < 0 ? 0 : clamp((now - it.onAt) / .6);
        const ang = Math.acos(clamp(fwd.dot(tmp.copy(it.mesh.position).normalize()), -1, 1)) / D2R;
        if (ang < 10 && !drag && u.uOn.value > .9) { it.gaze += dt; if (it.gaze > .45 || SNAP) bloom(it, now); } else it.gaze = 0;
        it.bloom = it.bloomAt < 0 ? 0 : ease(clamp((now - it.bloomAt) / .7));
        u.uBloom.value = it.bloom;
        // Gom trời: bay về nét chữ, nhỏ lại; xong thì trả về chỗ cũ
        let g = 0;
        if (gather.t >= 0 && it.gatherTo) g = ease(clamp((gather.t - k * .05) / 2.4)) * (1 - ease(clamp((gather.t - 6) / 2)));
        tmp.copy(it.home).lerp(it.gatherTo || it.home, g).setLength(R_PHOTO);
        it.mesh.position.copy(tmp); it.mesh.lookAt(0, 0, 0);
        const s = (1 + .45 * it.bloom) * (1 - .72 * g); // ảnh đã nở to hơn sao
        it.mesh.scale.set((it.aspect >= 1 ? it.size : it.size * it.aspect) * s, (it.aspect >= 1 ? it.size / it.aspect : it.size) * s, 1);
        const hs = it.size * (.6 - .25 * it.bloom) * s;
        m4.compose(it.mesh.position, it.mesh.quaternion, sc.set(hs, hs, 1)); halos.setMatrixAt(k, m4);
        halos.setColorAt(k, col.copy(u.uAvg.value).multiplyScalar((.55 - .4 * it.bloom) * u.uOn.value));
      });
      halos.instanceMatrix.needsUpdate = true; if (halos.instanceColor) halos.instanceColor.needsUpdate = true;
      if (gather.holding) gather.hold += dt; else gather.hold = Math.max(0, gather.hold - dt * 2);
      if (gather.hold > 1.2) startGather();
      if (moonPl) moonPl.cel.style.setProperty('--hold', clamp(gather.hold / 1.2).toFixed(2));
      if (gather.t >= 0) { gather.t += Math.min(dt, .05) * (SNAP ? 4 : 1); if (gather.t > 8.2) { gather.t = -1; root.classList.remove('bt-gathering'); } }
      uG.value = gather.t; trace.visible = gather.t >= 0;

      // Chòm sao: vẽ dần từng nét giữa các ảnh đã nở
      segs.forEach((s, k) => {
        const q = ease(clamp((now - s.at) / .8));
        s.a.mesh.position.toArray(lp, k * 6);
        tmp.copy(s.a.mesh.position).lerp(s.b.mesh.position, q).toArray(lp, k * 6 + 3);
      });
      lineGeo.setDrawRange(0, segs.length * 2); lineGeo.attributes.position.needsUpdate = true;
      lines.material.opacity = (.35 + .45 * uNight.value) * (1 - gather.w); // gom trời: tắt chòm sao để chữ rõ

      // Đom đóm của khách vừa giữ chỗ: bay lên, thành sao
      if (risers.length) {
        const r = risers[0], q = clamp((now - r.at) / 4);
        riserMesh.visible = true; riserMesh.position.copy(r.from).lerp(r.to, ease(q)); riserMesh.lookAt(0, 0, 0);
        riserMesh.scale.setScalar(1 + 2 * q);
        if (q >= 1) { risers.shift(); riserMesh.visible = false; setGuests(nGuests + 1); }
      }

      // Bảng thông tin: hiện khi nhìn về hướng đó
      for (const pl of plates) {
        let d = Math.abs(((pl.bearing - yaw) % 360 + 540) % 360 - 180);
        const op = clamp(1.4 - d / 38) * clamp(1.2 - Math.abs(pitch - pl.alt) / 45) * intro;
        pl.fade(document.querySelector('dialog[open]') ? 0 : op);
      }
      // Kim la bàn
      const needle = el.querySelector('.bt-needle');
      if (needle) needle.style.transform = `translateX(${(((yaw + 180) % 360 + 360) % 360 / 3.6).toFixed(2)}vw)`;

      if (post) post.render(now); else renderer.render(scene, camera);
      css.render(scene, camera);
      guard.tick(t);
      window.__bt = { fps: guard.fps, yaw, pitch, night: uNight.value, gpu, gather: gather.t, bloomed: items.filter(i => i.bloom > .9).length };
    }

    const loop = startLoop(life, frame);
    bindContextLoss(canvas, () => { life.teardown(); ctx.downgrade('webglcontextlost'); });
    ctx.on('motion', m => { if (m?.motion === 'lite') life.teardown(); });

    /* ---------- Khởi động ---------- */
    css.render(scene, camera);
    resize();
    await new Promise(r => { const t0 = performance.now(); const iv = setInterval(() => { if (!life.alive || loader.pending >= Math.min(2, items.length) || performance.now() - t0 > 2500) { clearInterval(iv); r(); } }, 50); });
    if (!life.alive) return life;
    try { await withTimeout(renderer.compileAsync(scene, camera), 4000, 'compile'); } catch {}
    if (!life.alive) return life;
    loop.start();
    root.classList.add('bt-ready');
    setTimeout(() => { if (life.alive) el.classList.add('show-hint'); }, 3000);
    loading.then(() => { dirty = true; });
    return life;
  } catch (err) {
    life.teardown();
    throw err;
  }
}
