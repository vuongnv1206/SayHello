// Cảnh 3D của mẫu Hồ Gương. Nạp sau khi khách chạm mặt nước (mở bìa), ở mức cinematic/standard.
// Hạ tầng (nạp thư viện, vòng đời, tải ảnh, hậu kỳ, chữ CSS3D, canh FPS) dùng chung từ @sayhello/engine/client/stage3d.js.
//
// Mặt nước: một mặt phẳng, chi tiết nằm hết trong shader: 4 sóng sin (gió) + tối đa 16 vòng sóng do tay khách
// (công thức giải tích, không cần mô phỏng nên chạy được trong WebView Zalo). Phản chiếu: vẽ thêm một lượt ở nửa
// độ phân giải, chỉ những vật nổi trên mặt nước (layer 1: ảnh đã vớt, chữ tên, cọc, bến, đèn, bầu trời).
// Fresnel: nhìn dốc xuống thì thấy xuyên vào nước (ảnh nằm dưới), nhìn sát mặt nước thì nước thành gương.
// Ảnh dưới nước: shader riêng, méo theo cùng sóng, ngả sắc nước, có vân sáng đáy hồ. Vớt lên: nổi lên, dựng đứng,
// ráo nước dần; ảnh đứng giữ nguyên màu.
import {
  clamp, ease, flicker, withTimeout, loadThree, createLife, makeRenderer, createPost, createPhotoLoader, barOnly, recoverContext,
  clonePlate, scrollStops, fpsGuard, startLoop, disposeScene, SHADER_TAIL,
} from '@sayhello/engine/client/stage3d.js';

const PX = 1 / 400;
const STEP = 8.5;            // khoảng cách giữa hai điểm dừng dọc đường thuyền trôi
const RINGS = 16;
const SUBMERGE = -.32;       // độ sâu ảnh nằm dưới nước

export async function runLake(el, ctx, opts) {
  const { tier, palettes, dropSound = () => {} } = opts;
  const root = document.documentElement;
  const SNAP = new URLSearchParams(location.search).has('snap');
  root.classList.add('hg-3d');
  const T = await loadThree(ctx);
  if (!ctx.opened || root.dataset.motion === 'lite') throw new Error('đã hạ mức');
  const { THREE, CSS3DRenderer, CSS3DObject, mergeGeometries, bindContextLoss } = T;
  const V3 = THREE.Vector3;
  const pal = palettes.find(p => p.id === root.dataset.palette) || palettes[0];
  const P = pal.preset;
  const cine = tier === 'cinematic';
  const coarse = matchMedia('(pointer: coarse)').matches;

  const life = createLife(root, ['hg-3d', 'hg-ready', 'hg-portrait', 'hg-still', 'hg-dragging']);
  const canvas = el.querySelector('.hg-canvas');
  const { renderer, gpu } = makeRenderer(THREE, canvas, { cine, coarse, snap: SNAP, exposure: P.exposure, life });
  try {
    const scene = new THREE.Scene();
    const fogC = new THREE.Color(P.fog);
    scene.background = fogC;
    scene.fog = new THREE.FogExp2(fogC, P.fogD);
    const camera = new THREE.PerspectiveCamera(50, 1, .05, 120);
    camera.layers.enable(1);
    scene.add(camera);
    const cssLayer = el.querySelector('.hg-css');
    const css = new CSS3DRenderer({ element: cssLayer });
    life.own(() => cssLayer.replaceChildren());
    life.own(() => disposeScene(scene));

    let W = 0, H = 0, aspect = 1, portrait = false, dirty = true, animUntil = 0;
    const C = k => new THREE.Color(P[k]);
    const both = o => { o.layers.enable(1); return o; }; // vật nổi: có cả trong bóng phản chiếu

    /* ---------- Điểm dừng ---------- */
    const stops = [...el.querySelectorAll('.hg-track > .hg-stop')].map((li, k) => ({
      li, k, kind: li.dataset.stop, hang: li.dataset.hang || '',
      works: [...li.querySelectorAll('.hg-imgs img[data-i]')].map(im => ({ i: +im.dataset.i, src: im.currentSrc || im.src })),
      plate: li.querySelector('.hg-plate'), items: [], dwell: 0,
    }));
    const n = stops.length, FIN = n - 1;
    // Đường thuyền trôi: lượn nhẹ trái phải
    const pathX = k => Math.sin(k * .55) * 2.2;
    stops.forEach(st => {
      st.g = new THREE.Group();
      st.g.position.set(pathX(st.k), 0, -st.k * STEP);
      scene.add(st.g);
    });
    const zEnd = -FIN * STEP;

    /* ---------- Bầu trời: vòm chuyển màu + mây nền vẽ sẵn ---------- */
    const cloudC = document.createElement('canvas'); cloudC.width = 256; cloudC.height = 128;
    { const g = cloudC.getContext('2d'); for (let i = 0; i < 90; i++) { const x = Math.random() * 256, y = 30 + Math.random() * 70, r = 10 + Math.random() * 40;
        const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); } }
    const cloudTex = new THREE.CanvasTexture(cloudC); cloudTex.wrapS = THREE.RepeatWrapping;
    const sky = both(new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({
      uniforms: { uZen: { value: C('zenith') }, uHor: { value: C('horizon') }, uSun: { value: C('sun') }, uClouds: { value: cloudTex }, uNight: { value: P.night } },
      vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
      fragmentShader: `uniform vec3 uZen,uHor,uSun; uniform sampler2D uClouds; uniform float uNight; varying vec3 vD;
        void main(){ float h=clamp(vD.y,0.,1.);
          vec3 c=mix(uHor,uZen,pow(max(h,0.),.55));
          vec3 sd=normalize(vec3(.35,.18,-1.)); float s=max(dot(vD,sd),0.);
          c+=uSun*(pow(s,900.)*(uNight>.5?2.2:3.)+pow(s,12.)*.18);
          vec2 uv=vec2(atan(vD.x,-vD.z)/6.2832+.5,clamp(h*2.2,0.,1.));
          c=mix(c,c+vec3(.08),texture2D(uClouds,uv).r*(1.-h)*.8);
          float st=uNight*step(.9975,fract(sin(dot(floor(vD.xy*420.),vec2(12.9,78.2)))*43758.5))*smoothstep(.15,.5,h);
          c+=vec3(st*.8);
          gl_FragColor=vec4(c,1.);${SHADER_TAIL} }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    })));
    sky.renderOrder = -1; sky.frustumCulled = false;
    scene.add(sky);
    scene.add(new THREE.HemisphereLight(C('horizon'), C('deep'), .9));
    const sunL = new THREE.DirectionalLight(C('sun'), P.night ? .25 : 1.1); sunL.position.set(3.5, 1.8, -10); scene.add(sunL);

    /* ---------- Sóng: dùng chung cho mặt nước và ảnh dưới nước ---------- */
    const rings = Array.from({ length: RINGS }, () => new THREE.Vector4(0, 0, -99, 0));
    let ringI = 0;
    const uni = { uT: { value: 0 }, uRings: { value: rings }, uWind: { value: P.wind }, uCalm: { value: 0 } };
    const WAVES = `
      uniform float uT, uWind, uCalm; uniform vec4 uRings[${RINGS}];
      // độ dốc mặt nước tại p (đạo hàm của tổng sóng), dùng để lệch pháp tuyến và làm méo ảnh dưới nước
      vec2 slope(vec2 p){
        vec2 d=vec2(0.); float w=uWind*(1.-uCalm);
        d+=vec2(.8,.6)*cos(dot(p,vec2(.8,.6))*1.7+uT*1.1)*.06*w;
        d+=vec2(-.5,.86)*cos(dot(p,vec2(-.5,.86))*2.9+uT*1.6)*.035*w;
        d+=vec2(.97,-.24)*cos(dot(p,vec2(.97,-.24))*5.3+uT*2.3)*.018*w;
        d+=vec2(-.3,-.95)*cos(dot(p,vec2(-.3,-.95))*9.1+uT*3.)*.01*w;
        for(int i=0;i<${RINGS};i++){ vec4 r=uRings[i]; float age=uT-r.z; if(age<0.||age>7.) continue;
          vec2 v=p-r.xy; float dist=length(v)+1e-4; float front=age*1.15;
          float e=(dist-front)*1.4; float env=exp(-e*e)*exp(-age*.55)*r.w;
          d+=(v/dist)*cos((dist-front)*9.)*env*.55; }
        return d;
      }`;
    const ringAt = (x, z, amp = 1) => { rings[ringI].set(x, z, uni.uT.value, amp); ringI = (ringI + 1) % RINGS; animUntil = Math.max(animUntil, uni.uT.value + 6); };

    /* ---------- Phản chiếu: camera soi gương qua mặt nước, vẽ nửa độ phân giải ---------- */
    // Nửa-float nếu máy vẽ được vào đó; nhiều GPU Android chỉ có 8-bit (thiếu thì phản chiếu đen)
    const rtType = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float') ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const reflRT = new THREE.WebGLRenderTarget(1, 1, { type: rtType });
    life.own(() => reflRT.dispose());
    const reflCam = new THREE.PerspectiveCamera(); reflCam.layers.set(1);
    const texMat = new THREE.Matrix4();
    const bias = new THREE.Matrix4().set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
    function updateReflection() {
      const cp = camera.getWorldPosition(new V3());
      const rot = new THREE.Matrix4().extractRotation(camera.matrixWorld);
      const look = new V3(0, 0, -1).applyMatrix4(rot).add(cp);
      const up = new V3(0, 1, 0).applyMatrix4(rot);
      reflCam.position.set(cp.x, -cp.y, cp.z);
      reflCam.up.set(up.x, -up.y, up.z);
      reflCam.lookAt(look.x, -look.y, look.z);
      reflCam.projectionMatrix.copy(camera.projectionMatrix);
      reflCam.updateMatrixWorld();
      texMat.copy(bias).multiply(reflCam.projectionMatrix).multiply(reflCam.matrixWorldInverse);
      renderer.setRenderTarget(reflRT); renderer.clear(); renderer.render(scene, reflCam); renderer.setRenderTarget(null);
    }

    /* ---------- Mặt nước ---------- */
    const waterMat = new THREE.ShaderMaterial({
      uniforms: { ...uni, tRefl: { value: reflRT.texture }, uTex: { value: texMat }, uWater: { value: C('water') }, uDeep: { value: C('deep') }, uFog: { value: fogC }, uBoost: { value: P.boost }, uSun: { value: C('sun') }, uFogD: { value: P.fogD } },
      vertexShader: `uniform mat4 uTex; varying vec4 vR; varying vec3 vW;
        void main(){ vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vR=uTex*w; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `${WAVES}
        uniform sampler2D tRefl; uniform vec3 uWater,uDeep,uFog,uSun; uniform float uBoost,uFogD; varying vec4 vR; varying vec3 vW;
        void main(){
          vec2 s=slope(vW.xz);
          vec3 nrm=normalize(vec3(-s.x,1.,-s.y));
          vec3 v=normalize(cameraPosition-vW); float ct=max(dot(nrm,v),0.);
          float fr=clamp((.02+.98*pow(max(1.-ct,0.),5.))*uBoost,0.,1.);
          vec2 ruv=vR.xy/vR.w+nrm.xz*.035;
          vec3 refl=texture2D(tRefl,ruv).rgb;
          vec3 body=mix(uWater,uDeep,.35+.5*ct);
          vec3 c=mix(body,refl,fr);
          vec3 sd=normalize(vec3(.35,.18,-1.)); c+=uSun*pow(max(dot(reflect(-v,nrm),sd),0.),180.)*.8;
          float a=mix(.5,1.,fr);
          float dist=length(cameraPosition-vW); float fg=1.-exp(-(uFogD*dist)*(uFogD*dist));
          c=mix(c,uFog,fg); a=mix(a,1.,fg);
          gl_FragColor=vec4(c,a);${SHADER_TAIL} }`,
      transparent: true, depthWrite: false,
    });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(80, Math.abs(zEnd) + 60, 1, 1), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.set(0, 0, zEnd / 2); water.renderOrder = 2;
    scene.add(water);
    // Đáy hồ tối (để ảnh dưới nước có nền)
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(80, Math.abs(zEnd) + 60), new THREE.MeshBasicMaterial({ color: C('deep') }));
    bed.rotation.x = -Math.PI / 2; bed.position.set(0, -1.2, zEnd / 2); scene.add(bed);

    /* ---------- Ảnh: dưới nước (méo theo sóng, ngả sắc nước, vân sáng) rồi vớt lên ---------- */
    const blank = new THREE.DataTexture(new Uint8Array([90, 100, 100, 255]), 1, 1); blank.needsUpdate = true;
    const photoMat = () => new THREE.ShaderMaterial({
      uniforms: { ...uni, map: { value: blank }, uDepth: { value: 1 }, uWet: { value: 0 }, uDeep: { value: C('deep') }, uWater: { value: C('water') }, uOp: { value: 1 } },
      vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `${WAVES}
        uniform sampler2D map; uniform float uDepth,uWet,uOp; uniform vec3 uDeep,uWater; varying vec2 vUv; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5); }
        void main(){
          vec2 s=slope(vW.xz)*uDepth;
          vec3 c=texture2D(map,vUv+s*.05).rgb;
          float l=dot(c,vec3(.3,.59,.11));
          c=mix(c,vec3(l),.4*uDepth);
          c=mix(c,mix(uWater,uDeep,.5),uDepth*.5);
          vec2 q=vW.xz*2.2+s*3.; float ca=abs(sin(q.x+uT*.8)+sin(q.y*1.3-uT*.6)+sin((q.x+q.y)*.7+uT*.5));
          c+=vec3(.9,1.,.95)*pow(max(0.,1.-ca*.55),6.)*.16*uDepth;
          // ráo nước: tối hơn một chút, vệt nước chảy xuống
          float streak=step(.93,h(vec2(floor(vUv.x*60.),0.)))*smoothstep(.2,0.,abs(fract(vUv.y*.5+uT*.35)-.5));
          c=c*(1.-.25*uWet)+vec3(streak*.25*uWet);
          gl_FragColor=vec4(c*.94,uOp);${SHADER_TAIL} }`,
      side: THREE.DoubleSide,
    });

    const allItems = [], photoMeshes = [];
    // Chùm ảnh: dựng đứng thành hình quạt
    const FAN = [[-1.05, -.35, .16], [0, 0, 0], [1.05, -.35, -.16]];
    for (const st of stops) {
      st.works.forEach((w, j) => {
        const fan = st.hang === 'fan';
        const yaw = new THREE.Group(), pivot = new THREE.Group(), mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat());
        const f = fan ? FAN[j] || [0, 0, 0] : [0, 0, 0];
        yaw.position.set(f[0], 0, f[1]); yaw.rotation.y = f[2];
        st.g.add(yaw); yaw.add(pivot); pivot.add(mesh);
        const item = { st, work: w, j, yaw, pivot, mesh, long: fan ? 1.5 : 2.2, lift: 0, liftAt: -1, hold: 0, aspect: .75, fan };
        mesh.userData.item = item;
        allItems.push(item); photoMeshes.push(mesh); st.items.push(item);
        sizeItem(item, .75); placeLift(item, 0);
      });
    }
    function sizeItem(it, aspect) {
      it.aspect = aspect;
      const w = aspect >= 1 ? it.long : it.long * aspect, h = aspect >= 1 ? it.long / aspect : it.long;
      it.mesh.scale.set(w, h, 1); it.w = w; it.h = h; it.mesh.position.y = h / 2;
    }
    // lift 0..1: nằm dưới nước (0) → nổi lên mặt (.35) → dựng đứng (.85) → ráo nước (1)
    function placeLift(it, L) {
      const rise = ease(clamp(L / .35)), stand = ease(clamp((L - .35) / .5));
      it.pivot.position.y = SUBMERGE * (1 - rise) + .02 * stand;
      // nằm phẳng thì mép dưới ảnh hướng về phía người xem (+z), dựng đứng quanh mép đó
      it.pivot.position.z = it.h / 2 * (1 - stand);
      it.pivot.rotation.x = -Math.PI / 2 * (1 - stand);
      const u = it.mesh.material.uniforms;
      u.uDepth.value = 1 - rise;
      u.uWet.value = L < .35 ? 0 : 1 - clamp((L - .6) / .4);
      const standing = stand > .05;
      if (standing) it.mesh.layers.enable(1); else it.mesh.layers.disable(1);
    }

    /* ---------- Vật trên hồ: cọc đo nước, bến gỗ ---------- */
    const bambooMat = new THREE.MeshStandardMaterial({ color: C('bamboo'), roughness: .7 });
    const woodMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(P.bamboo).multiplyScalar(.55), roughness: .85 });
    const markC = document.createElement('canvas'); markC.width = 32; markC.height = 512;
    { const g = markC.getContext('2d'); g.fillStyle = '#' + C('bamboo').getHexString(); g.fillRect(0, 0, 32, 512);
      g.fillStyle = 'rgba(20,24,24,.85)'; for (let i = 0; i < 40; i++) g.fillRect(0, i * 12.8, i % 5 === 0 ? 32 : 16, 2);
      g.fillStyle = '#e2522b'; g.fillRect(0, 140, 32, 6); }
    const markTex = new THREE.CanvasTexture(markC); markTex.colorSpace = THREE.SRGBColorSpace;
    for (const st of stops) {
      if (st.kind === 'gauge') {
        const pole = both(new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, 4.2, 12), new THREE.MeshStandardMaterial({ map: markTex, roughness: .7 })));
        pole.position.set(-.9, .9, 0); st.g.add(pole);
        st.pole = pole;
      }
      if (st.kind === 'jetty') {
        const parts = [];
        // lối ván chạy chéo từ bên trái tới chân tấm biển (biển dựng giữa khung hình)
        for (let i = 0; i < 12; i++) { const b = new THREE.BoxGeometry(2.4, .05, .24); b.translate(-1.9 + 0 * i, .32, -.2 + i * .27 - 1.4); parts.push(b); }
        for (const [x, z] of [[-3, -1.5], [-.8, -1.5], [-3, 1.5], [-.8, 1.5]]) { const c = new THREE.CylinderGeometry(.06, .06, 1.4, 8); c.translate(x, -.35, z); parts.push(c); }
        for (const x of [-.75, .75]) { const post = new THREE.BoxGeometry(.08, 1.3, .08); post.translate(x, .85, -.3); parts.push(post); }
        const jetty = both(new THREE.Mesh(mergeGeometries(parts), woodMat)); parts.forEach(p => p.dispose());
        st.g.add(jetty);
      }
    }

    /* ---------- Tên hai người: chữ đứng trên mặt nước (canvas), có bóng phản chiếu ---------- */
    const titleSt = stops.find(s => s.kind === 'title');
    const finSt = stops[FIN];
    const nameText = titleSt?.plate?.querySelector('.hg-names')?.innerText.split('\n').filter(Boolean) || [];
    function nameMesh() {
      const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const draw = () => {
        const g = c.getContext('2d'); g.clearRect(0, 0, 1024, 512);
        g.fillStyle = P.night ? '#e8eef2' : '#132020'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = '300 168px "Bricolage Grotesque", "Be Vietnam Pro", sans-serif';
        nameText.forEach((t, i) => g.fillText(t, 512, 210 + i * 200, 980));
        tex.needsUpdate = true; dirty = true;
      };
      draw(); document.fonts?.ready.then(() => life.alive && draw());
      // alphaTest thay cho trong suốt: chữ ghi độ sâu nên mặt nước không vẽ đè lên
      const m = both(new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: tex, alphaTest: .35, fog: false })));
      m.position.y = 1.08;
      return m;
    }
    if (titleSt && nameText.length) titleSt.g.add(nameMesh());
    if (nameText.length) { const m = nameMesh(); m.position.y = 1.5; finSt.g.add(m); finSt.names = m; }

    /* ---------- Đèn hoa đăng: mỗi lời chúc là một ngọn, khách giữ chỗ thả thêm ---------- */
    const MAXL = 48;
    const lanternMesh = both(new THREE.InstancedMesh(new THREE.CylinderGeometry(.09, .12, .16, 6), new THREE.MeshBasicMaterial({ fog: true }), MAXL));
    const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
    const glow = both(new THREE.InstancedMesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), MAXL));
    lanternMesh.count = glow.count = 0; lanternMesh.frustumCulled = glow.frustumCulled = false;
    scene.add(lanternMesh, glow);
    const lanterns = [];
    const lanternC = C('lantern');
    function addLantern(x, z, born, drift = .06) {
      if (lanterns.length >= MAXL) return;
      lanterns.push({ x, z, born, seed: Math.random() * 6.28, drift, rise: 0 });
      lanternMesh.count = glow.count = lanterns.length;
      animUntil = Math.max(animUntil, uni.uT.value + 3);
    }
    const seedLanterns = count => {
      for (let i = lanterns.length; i < Math.min(MAXL - 6, count); i++) {
        const k = 1 + (i * 7) % Math.max(1, FIN), side = i % 2 ? 1 : -1;
        addLantern(pathX(k) + side * (2.4 + (i % 3) * .7), -k * STEP - 1.5 - (i % 4), -10, .03);
      }
    };

    /* ---------- Bụi sương lơ lửng (cinematic) ---------- */
    let motes;
    if (cine) {
      const N = 160, pos = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 10; pos[i * 3 + 1] = .2 + Math.random() * 3; pos[i * 3 + 2] = (Math.random() - .5) * 14; }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      motes = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTex, color: P.night ? lanternC : new THREE.Color('#ffffff'), size: .05, transparent: true, opacity: P.night ? .5 : .35, depthWrite: false, blending: THREE.AdditiveBlending }));
      motes.frustumCulled = false; scene.add(motes);
    }

    /* ---------- Chữ trong không gian (bản sao HTML máy chủ) ---------- */
    const plates = [];
    for (const st of stops) {
      if (!st.plate || st.kind === 'title') continue;
      const pl = clonePlate(CSS3DObject, st.plate, 'hg-c hg-c-' + st.kind, PX);
      st.g.add(pl.obj); st.pl = pl; pl.st = st; plates.push(pl);
    }
    if (titleSt?.plate) { // dòng mời dưới chữ tên
      const w = titleSt.plate.querySelector('.hg-welcome');
      if (w) { const pl = clonePlate(CSS3DObject, w, 'hg-c hg-c-welcome', PX); titleSt.g.add(pl.obj); pl.obj.position.set(0, -.12, .6); pl.obj.rotation.x = -.35; pl.st = titleSt; plates.push(pl); }
    }

    /* ---------- Hậu kỳ ---------- */
    let post = cine ? createPost(T, renderer, scene, camera, { bloom: P.bloom, threshold: 1.15, coarse, grade: { uVig: .28, uGrain: .028 } }) : null;
    life.own(() => post?.dispose());

    /* ---------- Bố cục ---------- */
    const scrollMap = scrollStops(stops.map(s => s.li));
    let barT = 0;
    function resize(force) {
      if (!life.alive) return;
      const w = innerWidth, h = innerHeight;
      if (!force && w === W && h === H) return;
      if (!force && barOnly(w, h, W, H)) {
        // thanh địa chỉ: chỉ đổi tỉ lệ, cấp lại bộ đệm (kể cả phản chiếu) sau khi ngừng cuộn
        camera.aspect = w / h; camera.updateProjectionMatrix(); css.setSize(w, h);
        clearTimeout(barT); barT = setTimeout(() => resize(true), 700); dirty = true; return;
      }
      const wc = w !== W; W = w; H = h; aspect = W / H;
      camera.aspect = aspect; camera.updateProjectionMatrix();
      renderer.setSize(W, H, false); css.setSize(W, H); post?.setSize(W, H);
      const pr = renderer.getPixelRatio();
      reflRT.setSize(Math.round(W * pr * .5), Math.round(H * pr * .5));
      portrait = aspect < .9; root.classList.toggle('hg-portrait', portrait);
      if (wc || force) { stops.forEach(placeStop); scrollMap.measure(); }
      dirty = true;
    }
    // Camera mỗi điểm dừng: "nhìn xuống" (thấy ảnh dưới nước) và "nhìn ngang" (ảnh đã vớt, chữ, bến)
    function placeStop(st) {
      const fovV = portrait ? 54 : 42, tanV = Math.tan(THREE.MathUtils.degToRad(fovV / 2));
      st.fov = fovV;
      const g = st.g.position;
      let bw = 2.6, bh = 2.4, cy = 1;
      if (st.items.length) {
        const xs = st.items.map(it => [it.yaw.position.x - it.w / 2, it.yaw.position.x + it.w / 2]);
        bw = Math.max(...xs.map(x => x[1])) - Math.min(...xs.map(x => x[0])) + .4;
        bh = Math.max(...st.items.map(it => it.h)) * 1.55; // ảnh + một phần bóng phản chiếu
        cy = Math.max(...st.items.map(it => it.h)) * .32;
        if (st.pl) {
          const [lw, lh] = st.pl.size();
          st.pl.obj.position.set(portrait ? 0 : Math.min(...xs.map(x => x[0])) + lw / 2, -.05, .9);
          st.pl.obj.rotation.x = -1.2; // nhãn nổi trên mặt nước
          bw = Math.max(bw, lw + .2);
        }
      } else if (st.pl) {
        const [pw, ph] = st.pl.size();
        if (st.kind === 'gauge') { st.pl.obj.position.set(.55, 1.15, 0); bw = pw + 1.6; bh = Math.max(3.2, ph + .6); cy = 1.05; }
        else if (st.kind === 'jetty') { st.pl.obj.position.set(0, .95 + ph / 2, -.2); bw = pw + .6; bh = ph + 1.3; cy = .6 + ph / 2; }
        else if (st.kind === 'finale') { st.pl.obj.position.set(0, .3, 1.4); st.pl.obj.rotation.x = -.5; bw = Math.max(pw, 4.4); bh = ph + 2.4; cy = 1.2; }
        else { st.pl.obj.position.set(0, 1, 0); bw = pw + .3; bh = ph + .6; cy = 1; }
      } else if (st.kind === 'title') { bw = portrait ? 3.6 : 4.6; bh = 3.2; cy = .8; }
      const fill = .82;
      const d = Math.max(bh / (fill * 2 * tanV), bw / (fill * 2 * tanV * aspect));
      // nhìn ngang: hơi cao, chúc xuống ~12 độ để thấy cả bóng dưới nước
      st.across = { pos: new V3(g.x, cy + d * .2, g.z + d), look: new V3(g.x, st.items.length ? cy * .55 : cy * .9, g.z) };
      // nhìn xuống: thấy rõ ảnh đang nằm dưới nước
      const dd = Math.max(st.items.length ? 3.1 : 0, bw / (fill * 2 * tanV * aspect) * .9);
      st.down = { pos: new V3(g.x, dd * .9, g.z + dd * .55 + (st.items[0]?.h || 0) * .1), look: new V3(g.x, SUBMERGE, g.z - (st.items[0]?.h || 2) * .35) };
    }
    const camOf = st => {
      const L = st.items.length ? Math.min(...st.items.map(it => it.lift)) : 1;
      const q = ease(clamp((L - .25) / .6));
      return { pos: st.down ? st.down.pos.clone().lerp(st.across.pos, st.items.length ? q : 1) : st.across.pos.clone(), look: st.down ? st.down.look.clone().lerp(st.across.look, st.items.length ? q : 1) : st.across.look.clone() };
    };

    /* ---------- Điều khiển ---------- */
    let pT = 0, p = 0;
    const readScroll = () => { pT = scrollMap.read(); if (scrollY > 40) el.classList.remove('show-hint'); };
    const look = { x: 0, y: 0, sx: 0, sy: 0 };
    life.listen(window, 'pointermove', e => { if (e.pointerType === 'mouse') { look.x = e.clientX / W * 2 - 1; look.y = e.clientY / H * 2 - 1; } }, { passive: true });
    let base = null;
    life.listen(window, 'deviceorientation', e => {
      if (e.gamma == null) return;
      const a = screen.orientation?.angle ?? window.orientation ?? 0;
      let gx = e.gamma, gy = e.beta;
      if (a === 90) { gx = e.beta; gy = -e.gamma; } else if (a === -90 || a === 270) { gx = -e.beta; gy = e.gamma; }
      if (!base) base = { g: gx, b: gy };
      base.g += (gx - base.g) * .004; base.b += (gy - base.b) * .004;
      // bỏ rung nhỏ (~0,2°) của cảm biến: máy đặt yên thì vòng vẽ được nghỉ, đỡ tốn pin
      const nx = clamp((gx - base.g) / 22, -1, 1), ny = clamp((gy - base.b) / 22, -1, 1);
      if (Math.abs(nx - look.x) < .008 && Math.abs(ny - look.y) < .008) return;
      look.x = nx; look.y = ny;
    });
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane0 = new THREE.Plane(new V3(0, 1, 0), 0);
    const toNdc = (x, y) => { const r = canvas.getBoundingClientRect(); return ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); };
    const waterPoint = (x, y) => { ray.setFromCamera(toNdc(x, y), camera); return ray.ray.intersectPlane(plane0, new V3()); };
    const hitPhoto = (x, y) => { ray.setFromCamera(toNdc(x, y), camera); return ray.intersectObjects(photoMeshes.filter(m => m.parent.parent.parent.visible), false)[0]; };
    let down = null, lastTrail = 0;
    life.listen(canvas, 'pointerdown', e => {
      const h = hitPhoto(e.clientX, e.clientY);
      down = { x: e.clientX, y: e.clientY, t: performance.now(), item: h?.object.userData.item || null };
      dirty = true;
    });
    life.listen(canvas, 'pointermove', e => {
      if (!down) return;
      // vẽ lên nước: kéo tay để lại vệt gợn sóng
      const now = performance.now();
      if (now - lastTrail > 70 && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) {
        lastTrail = now; const pt = waterPoint(e.clientX, e.clientY); if (pt) ringAt(pt.x, pt.z, .45);
        root.classList.add('hg-dragging');
      }
    });
    const endPress = e => {
      if (!down) return;
      const quick = performance.now() - down.t < 450, still = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10;
      const item = down.item; down = null; root.classList.remove('hg-dragging');
      if (e.type !== 'pointerup' || !still || !quick) return;
      if (item && item.lift > .8) { ctx.view?.(allItems.indexOf(item)); return; }
      const pt = waterPoint(e.clientX, e.clientY);
      if (pt) { ringAt(pt.x, pt.z, 1); dropSound(.35); }
    };
    life.listen(canvas, 'pointerup', endPress); life.listen(canvas, 'pointercancel', endPress);
    life.listen(window, 'scroll', readScroll, { passive: true });
    let rz = 0;
    life.listen(window, 'resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { resize(false); readScroll(); }); });
    life.listen(window, 'orientationchange', () => { base = null; setTimeout(() => { resize(true); readScroll(); }, 350); });

    /* ---------- Kết: giữ tay để mặt nước lặng ---------- */
    const calm = { hold: 0, holding: false, t: -1 };
    const stillBtns = [el.querySelector('.hg-track [data-sh-still]'), finSt.pl?.cel.querySelector('[data-sh-still]')].filter(Boolean);
    for (const b of stillBtns) {
      life.listen(b, 'pointerdown', e => { e.stopPropagation(); calm.holding = true; dirty = true; });
      for (const t of ['pointerup', 'pointerleave', 'pointercancel']) life.listen(b, t, () => { calm.holding = false; });
    }
    const stillNow = () => { if (calm.t < 0) { calm.t = 0; root.classList.add('hg-still'); dropSound(.6); } };
    ctx.on('still', () => life.alive && stillNow());

    /* ---------- Sự kiện thiệp ---------- */
    // Vài ngọn đèn có sẵn cho mặt hồ có hơi người; mỗi lời chúc thêm một ngọn
    seedLanterns(Math.max(5, ctx.wishes.length));
    ctx.on('wishes', list => { if (life.alive) { seedLanterns(Math.max(5, list.length)); dirty = true; } });
    ctx.on('rsvp', x => {
      if (!life.alive || x?.attend === 'Không') return;
      const st = stops[Math.round(p)] || finSt;
      addLantern(st.g.position.x + .4, st.g.position.z + .8, uni.uT.value, .22);
      ringAt(st.g.position.x + .4, st.g.position.z + .8, .8);
    });
    ctx.on('motion', m => { if (m?.motion === 'lite') life.teardown(); });

    /* ---------- Vòng vẽ ---------- */
    const loader = createPhotoLoader(THREE, renderer, { maxTex: cine ? 1024 : 768, life });
    const loading = loader.loadAll(allItems, it => it.work.src, (it, tex, a) => { it.mesh.material.uniforms.map.value = tex; it.tex = tex; sizeItem(it, a); placeStop(it.st); dirty = true; });
    const cur = { pos: new V3(), look: new V3(), init: false };
    const want = new V3(), wantL = new V3(), tmp = new V3(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s1 = new V3(1, 1, 1), col = new THREE.Color();
    const guard = fpsGuard({
      disabled: SNAP,
      onSlow: () => { post?.dispose(); post = null; renderer.setPixelRatio(1); resize(true); },
      onTooSlow: () => { life.teardown(); ctx.downgrade('fps'); },
    });

    function frame(t, dt) {
      const now = t / 1000; uni.uT.value = now;
      const busy = dirty || loader.pending || Math.abs(pT - p) > 1e-4 || now < animUntil || down || calm.holding || calm.t >= 0
        || cine // mặt nước luôn gợn nhẹ ở mức cinematic
        || Math.abs(look.x - look.sx) + Math.abs(look.y - look.sy) > 1e-3 || !cur.init || cur.pos.distanceToSquared(want) > 1e-8
        || allItems.some(it => it.liftAt >= 0 && it.lift < 1);
      if (!busy) return;
      dirty = false;
      loader.pump();

      p = SNAP ? pT : p + (pT - p) * (1 - Math.exp(-dt * 2.6));
      look.sx += (look.x - look.sx) * (1 - Math.exp(-dt * 4)); look.sy += (look.y - look.sy) * (1 - Math.exp(-dt * 4));
      const k0 = Math.min(Math.floor(p), Math.max(0, n - 2)), f = p - k0;

      // Vớt ảnh: giữ tay trên ảnh dưới nước, hoặc dừng ở điểm dừng đủ lâu
      for (const st of stops) {
        // Điểm dừng đã đi qua (nằm sau hoặc sát camera) thì ẩn, để không che khung hình
        const near = (Math.abs(st.k - p) < 3.5 || st.k === FIN) && st.g.position.z < camera.position.z - .8;
        st.g.visible = near;
        if (Math.abs(p - st.k) < .2) st.dwell += dt; else st.dwell = 0;
        for (const it of st.items) {
          if (down?.item === it && performance.now() - down.t > 380 && it.liftAt < 0) { it.liftAt = now; ringAt(st.g.position.x + it.yaw.position.x, st.g.position.z + it.yaw.position.z, 1); dropSound(.4); }
          if (it.liftAt < 0 && (st.dwell > 1.2 || (SNAP && Math.abs(p - st.k) < .05))) it.liftAt = now + it.j * .25;
          if (it.liftAt >= 0 && it.lift < 1) {
            const L = clamp((now - it.liftAt) / (SNAP ? .4 : 2.2));
            if (it.lift < .3 && L >= .3) ringAt(st.g.position.x + it.yaw.position.x, st.g.position.z + it.yaw.position.z, .9);
            it.lift = L; placeLift(it, L);
          }
        }
      }

      // Camera: trôi giữa hai điểm dừng, nhô cao ở giữa quãng như thuyền lướt qua
      const a = camOf(stops[k0]), b = camOf(stops[Math.min(k0 + 1, n - 1)]), e = ease(clamp(f)), arc = Math.sin(Math.PI * e);
      want.lerpVectors(a.pos, b.pos, e); want.y += arc * .9;
      wantL.lerpVectors(a.look, b.look, e); wantL.z -= arc * 2;
      let fov = (stops[k0].fov || 44) * (1 - e) + (stops[Math.min(k0 + 1, n - 1)].fov || 44) * e + arc * 6;

      // Kết: giữ tay (1,2 giây) hoặc đứng chờ lâu
      if (calm.holding) calm.hold += dt; else calm.hold = Math.max(0, calm.hold - dt * 2);
      if (calm.hold > 1.2) stillNow();
      if (p > FIN - .05 && calm.t < 0) { calm.idle = (calm.idle || 0) + (SNAP ? 1 : dt); if (calm.idle > 10) stillNow(); }
      if (finSt.pl) finSt.pl.cel.style.setProperty('--hold', clamp(calm.hold / 1.2).toFixed(2));
      if (calm.t >= 0) {
        calm.t += Math.min(dt, .05) * (SNAP ? 4 : 1);
        uni.uCalm.value = ease(clamp(calm.t / 2.2));
        lanterns.forEach(l => { l.rise = Math.max(l.rise, ease(clamp((calm.t - 1.2 - (l.seed % 1.5)) / 4))); });
        if (calm.t > 9) { calm.t = 9; }
        animUntil = Math.max(animUntil, now + .5);
      }

      // Đèn hoa đăng trôi, nhấp nhô theo sóng; khi mặt nước lặng thì bay lên
      lanterns.forEach((l, i) => {
        const age = Math.max(0, now - l.born);
        const x = l.x + Math.sin(now * .2 + l.seed) * .3, z = l.z - age * l.drift, y = .05 + Math.sin(now * 1.3 + l.seed) * .025 * (1 - uni.uCalm.value) + l.rise * (2.5 + (i % 5) * .6);
        m4.compose(tmp.set(x, y + .08, z), q4.identity(), s1); lanternMesh.setMatrixAt(i, m4);
        lanternMesh.setColorAt(i, col.copy(lanternC).multiplyScalar(1.6 + .4 * Math.sin(now * 3 + l.seed)));
        m4.compose(tmp.set(x, y + .12, z), camera.quaternion, s1); glow.setMatrixAt(i, m4);
        glow.setColorAt(i, col.copy(lanternC).multiplyScalar(.55));
      });
      if (lanterns.length) { lanternMesh.instanceMatrix.needsUpdate = glow.instanceMatrix.needsUpdate = true; lanternMesh.instanceColor.needsUpdate = glow.instanceColor.needsUpdate = true; }

      // Camera êm; nhìn quanh theo con quay / chuột
      if (!cur.init || SNAP) { cur.pos.copy(want); cur.look.copy(wantL); cur.init = true; }
      else { const s = 1 - Math.exp(-dt * 5); cur.pos.lerp(want, s); cur.look.lerp(wantL, s); }
      camera.position.copy(cur.pos);
      camera.position.y += Math.sin(now * .7) * .02; // thuyền bồng bềnh
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.lookAt(cur.look);
      camera.rotateY(-look.sx * .1); camera.rotateX(-look.sy * .06);
      camera.updateMatrixWorld();

      // Chữ trong không gian: hiện theo khoảng cách tới điểm dừng
      for (const pl of plates) {
        let op = clamp(1.3 - Math.abs(p - pl.st.k) * 1.6);
        if (pl.st.items.length) op *= clamp((Math.min(...pl.st.items.map(it => it.lift)) - .7) / .3);
        pl.fade(op);
      }

      if (motes) {
        const pos = motes.geometry.attributes.position.array, cz = camera.position.z, cx = camera.position.x;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += Math.sin(now * .25 + i) * .0015; pos[i + 1] += Math.cos(now * .3 + i * .5) * .0008;
          if (pos[i + 2] > cz + 3) pos[i + 2] -= 14; else if (pos[i + 2] < cz - 11) pos[i + 2] += 14;
          if (pos[i] > cx + 5) pos[i] -= 10; else if (pos[i] < cx - 5) pos[i] += 10;
        }
        motes.geometry.attributes.position.needsUpdate = true;
      }

      updateReflection();
      if (post) post.render(now); else renderer.render(scene, camera);
      css.render(scene, camera);
      guard.tick(t);
      window.__hg = { fps: guard.fps, p, pT, gpu, calm: calm.t };
    }

    const loop = startLoop(life, frame);
    bindContextLoss(canvas, () => recoverContext(canvas, { teardown: life.teardown, downgrade: () => ctx.downgrade('webglcontextlost'), retry: opts.retried ? null : () => runLake(el, ctx, { ...opts, retried: true }) }));

    /* ---------- Khởi động ---------- */
    css.render(scene, camera);
    resize(true); readScroll(); p = pT;
    document.fonts?.ready.then(() => { if (life.alive) { stops.forEach(placeStop); scrollMap.measure(); readScroll(); dirty = true; } });
    await new Promise(r => { const t0 = performance.now(); const iv = setInterval(() => { if (!life.alive || loader.pending >= Math.min(2, allItems.length) || performance.now() - t0 > 2500) { clearInterval(iv); r(); } }, 50); });
    if (!life.alive) return life;
    try { await withTimeout(renderer.compileAsync(scene, camera), 4000, 'compile'); } catch {}
    if (!life.alive) return life;
    loop.start();
    root.classList.add('hg-ready');
    // Gợn sóng chào: giọt nước rơi ngay trước mặt khách
    const s0 = stops[0]; ringAt(s0.g.position.x, s0.g.position.z + 1.2, 1.2);
    setTimeout(() => { if (life.alive && scrollY < 40) el.classList.add('show-hint'); }, 2600);
    loading.then(() => { if (life.alive) { scrollMap.measure(); readScroll(); dirty = true; } });
    return life;
  } catch (err) {
    life.teardown();
    throw err;
  }
}
