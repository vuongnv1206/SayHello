// Xé tờ lịch bằng WebGL (chỉ trong lúc đang xé). Lúc đứng yên tờ lịch là HTML thật: chữ sắc, chọn được, đúng dấu.
// Khi một tờ bắt đầu bị xé, ta vẽ lại chính tờ đó lên canvas 2D (paintSheet: đo vị trí từng chữ, ảnh, khối màu
// trong trang rồi vẽ y hệt), dán lên một tấm lưới và uốn cong quanh một trục trụ di chuyển:
//   trục cắt mép trên tại điểm đang rách, nên đường rách và nếp cong luôn khớp nhau;
//   pha A (t 0–0,72): rách từ phải sang trái, góc phải cuộn lên; pha B: tờ rời gáy, bay lên trái, phất phơ.
// Ánh sáng theo pháp tuyến của nếp cong, mặt sau giấy tối hơn và lộ mờ chữ in. Lỗi bất kỳ: trả về xé bằng CSS.
import { clamp, createLife, makeRenderer, SHADER_TAIL } from '@sayhello/engine/client/stage3d.js';
import { tearLine } from './paper.js';

const ease = x => 1 - Math.pow(1 - x, 3);
const mix = (a, b, t) => a + (b - a) * t;

/** Vẽ lại một tờ lịch (đang đứng yên, chưa biến đổi) lên canvas 2D, mép trên rách theo hạt giống. */
async function paintSheet(sheet, seed, scale, fibreImg) {
  const R = sheet.getBoundingClientRect();
  const W = Math.round(R.width), H = Math.round(R.height);
  const c = document.createElement('canvas');
  c.width = Math.min(2048, Math.round(W * scale)); c.height = Math.min(2048, Math.round(H * scale));
  const sx = c.width / W, sy = c.height / H;
  const g = c.getContext('2d');
  g.scale(sx, sy);
  // mép trên rách: tờ chỉ có từ đường rách trở xuống (trong suốt phía trên)
  const line = tearLine(W, seed);
  g.beginPath(); g.moveTo(0, H); g.lineTo(0, line[0][1] + 3);
  for (const [x, y] of line) g.lineTo(x, y + 3);
  g.lineTo(W, H); g.closePath(); g.save(); g.clip();
  const css = getComputedStyle(sheet);
  g.fillStyle = css.backgroundColor || '#f7f6f2'; g.fillRect(0, 0, W, H);
  if (fibreImg) { g.globalCompositeOperation = 'multiply'; g.fillStyle = g.createPattern(fibreImg, 'repeat'); g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
  const rel = r => ({ x: r.left - R.left, y: r.top - R.top, w: r.width, h: r.height });

  // khối nền màu và đường kẻ (dải đầu tờ, nút, đường âm lịch, gạch đứt giữa các buổi)
  for (const e of sheet.querySelectorAll('*')) {
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.display === 'none') continue;
    const r = rel(e.getBoundingClientRect());
    if (!r.w || !r.h) continue;
    const bg = s.backgroundColor;
    if (bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg)) { g.fillStyle = bg; g.fillRect(r.x, r.y, r.w, r.h); }
    for (const side of ['Top', 'Bottom']) {
      const bw = parseFloat(s[`border${side}Width`]);
      if (bw > 0 && s[`border${side}Style`] !== 'none') {
        g.strokeStyle = s[`border${side}Color`]; g.lineWidth = bw; g.setLineDash(s[`border${side}Style`] === 'dashed' ? [4, 3] : []);
        const y = side === 'Top' ? r.y + bw / 2 : r.y + r.h - bw / 2;
        g.beginPath(); g.moveTo(r.x, y); g.lineTo(r.x + r.w, y); g.stroke();
      }
    }
    const bs = s.boxShadow; // nút viền (inset)
    if (bs && bs.includes('inset')) { g.setLineDash([]); g.strokeStyle = s.color; g.lineWidth = 2; g.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); }
  }
  // ảnh: object-fit cover
  for (const im of sheet.querySelectorAll('img')) {
    try { if (!im.complete) await im.decode(); } catch { continue; }
    const r = rel(im.getBoundingClientRect());
    if (!r.w || !im.naturalWidth) continue;
    const k = Math.max(r.w / im.naturalWidth, r.h / im.naturalHeight);
    const cw = r.w / k, ch = r.h / k;
    try { g.drawImage(im, (im.naturalWidth - cw) / 2, (im.naturalHeight - ch) / 2, cw, ch, r.x, r.y, r.w, r.h); } catch {}
  }
  // chữ: từng từ theo đúng vị trí trình duyệt đã xếp (giữ nguyên xuống dòng và dấu tiếng Việt)
  const seg = new Intl.Segmenter('vi', { granularity: 'word' });
  const walker = document.createTreeWalker(sheet, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue; if (!text.trim()) continue;
    const p = node.parentElement, s = getComputedStyle(p);
    if (s.visibility === 'hidden' || s.display === 'none' || p.closest('[aria-hidden="true"]:not(.tl-sheet)')) continue;
    g.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
    g.fillStyle = s.color; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = s.letterSpacing === 'normal' ? '0px' : s.letterSpacing;
    const m = g.measureText('Ấg'), A = m.fontBoundingBoxAscent ?? parseFloat(s.fontSize) * .8, D = m.fontBoundingBoxDescent ?? parseFloat(s.fontSize) * .2;
    for (const { segment, index } of seg.segment(text)) {
      if (!segment.trim()) continue;
      range.setStart(node, index); range.setEnd(node, index + segment.length);
      const rr = range.getClientRects()[0]; if (!rr) continue;
      const r = rel(rr);
      g.fillText(segment, r.x, r.y + (r.h - (A + D)) / 2 + A);
    }
  }
  g.restore();
  // lõi giấy trắng lộ ra ở mép rách
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.4; g.beginPath();
  line.forEach(([x, y], i) => (i ? g.lineTo(x, y + 3.4) : g.moveTo(x, y + 3.4))); g.stroke();
  return { canvas: c, W, H };
}

const VERT = `
  uniform vec2 uT; uniform vec2 uN; uniform float uR; uniform mat4 uFly; uniform vec2 uSize;
  varying vec3 vNrm; varying float vS; varying vec2 vUv;
  void main(){
    vec3 p = vec3(uv.x * uSize.x, (1. - uv.y) * uSize.y, 0.);   // px, gốc trên trái, y hướng xuống
    float s = dot(p.xy - uT, uN); vec3 n = vec3(0., 0., 1.);
    if (s > 0.) {
      float PI = 3.14159265, a = min(s / uR, PI);
      float s2 = s < PI * uR ? uR * sin(a) : -(s - PI * uR);
      float z = s < PI * uR ? uR * (1. - cos(a)) : 2. * uR;
      p.xy += uN * (s2 - s); p.z = z;
      n = vec3(-uN * sin(a), cos(a));
    }
    vS = s; vUv = uv;
    vec4 w = uFly * vec4(p.x, -p.y, p.z, 1.);
    vNrm = normalize(mat3(uFly) * vec3(n.x, -n.y, n.z));
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const FRAG = `
  uniform sampler2D uMap; uniform float uR;
  varying vec3 vNrm; varying float vS; varying vec2 vUv;
  void main(){
    vec4 tex = texture2D(uMap, vUv);
    if (tex.a < .5) discard;
    vec3 L = normalize(vec3(-.35, .6, .72));
    vec3 N = gl_FrontFacing ? vNrm : -vNrm;
    float diff = .62 + .38 * max(dot(N, L), 0.);
    float sheen = pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), 14.) * .05;
    float occ = vS > 0. ? 1. - .14 * exp(-vS / (.5 * uR)) : 1.;
    vec3 c;
    if (gl_FrontFacing) c = tex.rgb * diff * occ + sheen;
    else { float l = dot(tex.rgb, vec3(.3, .59, .11)); c = mix(vec3(.93, .92, .89), vec3(l), .12) * (diff * .92) * occ; }
    gl_FragColor = vec4(c, 1.);
    ${SHADER_TAIL}
  }`;

/**
 * Gắn lớp xé WebGL vào xấp lịch. Trả về hàm hook(sheet, k, t) → true nếu lớp này đã vẽ tờ đó (ẩn tờ HTML),
 * false để trang tự xé bằng CSS. Ném lỗi nếu máy không dựng được WebGL.
 */
export async function runTear(el, ctx, { tier, fibreUrl }) {
  const { THREE } = await ctx.lib('three');
  const SNAP = new URLSearchParams(location.search).has('snap');
  const hold = el.querySelector('.tl-hold');
  const canvas = document.createElement('canvas');
  canvas.className = 'tl-gl'; canvas.setAttribute('aria-hidden', 'true');
  hold.append(canvas);
  const life = createLife(document.documentElement, []);
  life.own(() => canvas.remove());
  const cine = tier === 'cinematic';
  const { renderer } = makeRenderer(THREE, canvas, { cine, coarse: true, snap: SNAP, life });
  renderer.toneMapping = THREE.NoToneMapping; // giấy và ảnh giữ đúng màu như trang
  renderer.setClearColor(0, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 10000);
  const seg = cine ? [40, 56] : [28, 40];
  const geo = new THREE.PlaneGeometry(1, 1, seg[0], seg[1]);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: null }, uT: { value: new THREE.Vector2() }, uN: { value: new THREE.Vector2(1, 0) }, uR: { value: 40 }, uFly: { value: new THREE.Matrix4() }, uSize: { value: new THREE.Vector2(1, 1) } },
    vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, transparent: false,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh);
  life.own(() => { geo.dispose(); mat.dispose(); });

  let HW = 1, HH = 1;
  const resize = () => {
    const r = hold.getBoundingClientRect(); HW = r.width; HH = r.height;
    renderer.setSize(HW, HH, false);
    camera.aspect = HW / HH; camera.position.set(0, 0, (HH / 2) / Math.tan(15 * Math.PI / 180)); camera.near = 1; camera.far = camera.position.z * 4;
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  };
  resize();
  life.listen(window, 'resize', resize);

  // Thớ giấy cho texture (cùng tấm với nền HTML)
  let fibreImg = null;
  if (fibreUrl) { const im = new Image(); im.src = fibreUrl; try { await im.decode(); fibreImg = im; } catch {} }
  await document.fonts?.ready;

  // Vòng texture: vẽ sẵn tờ trên cùng và tờ kế tiếp lúc rảnh
  const cache = new Map(); // k → { tex, W, H } | 'pending'
  const scale = Math.min(window.devicePixelRatio || 1, cine ? 1.5 : 1.25);
  const sheets = [...el.querySelectorAll('.tl-sheet')];
  const prep = k => {
    if (k < 0 || k >= sheets.length - 1 || cache.has(k)) return;
    cache.set(k, 'pending');
    const s = sheets[k];
    // chỉ chụp khi tờ đang đứng yên (chưa biến đổi)
    if (s.style.transform) { cache.delete(k); return; }
    paintSheet(s, 101 + k * 17, scale, fibreImg).then(({ canvas: c, W, H }) => {
      if (!life.alive) return;
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      renderer.initTexture(tex);
      cache.set(k, { tex, W, H });
      for (const [j, v] of cache) if (v !== 'pending' && Math.abs(j - k) > 2) { v.tex.dispose(); cache.delete(j); }
    }).catch(e => { console.warn('[tờ lịch] không vẽ được tờ', k, e?.message || e); cache.delete(k); });
  };
  const idle = fn => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 800 }) : setTimeout(fn, 120));
  idle(() => { prep(0); prep(1); });
  life.own(() => { for (const v of cache.values()) if (v !== 'pending') v.tex.dispose(); });

  const fly = new THREE.Matrix4(), tmp = new THREE.Matrix4();
  let active = -1;
  const draw = () => renderer.render(scene, camera);

  /** hook: vẽ tờ k ở tiến độ t. Trả false nếu chưa có texture (trang tự xé bằng CSS cho tờ này). */
  // front: tờ trên cùng chưa bị xé hết (các tờ được gọi theo thứ tự k tăng dần trong mỗi lần cuộn)
  let front = 0;
  const hook = (s, k, t) => {
    if (!life.alive) return false;
    if (k === 0) front = 0;
    if (t >= 1) front = k + 1;
    if (t <= 0 || t >= 1) {
      if (active === k) { active = -1; mesh.visible = false; draw(); }
      // chỉ vẽ sẵn tờ trên cùng và tờ ngay dưới
      if (t <= 0 && k <= front + 1) idle(() => prep(k));
      return false;
    }
    const c = cache.get(k);
    if (!c || c === 'pending') { prep(k); return false; }
    active = k;
    const R = s.offsetParent ? s.getBoundingClientRect() : null;
    const hr = hold.getBoundingClientRect();
    // vị trí tờ khi đứng yên (bỏ biến đổi CSS): lấy theo khung xấp lịch
    const stack = s.parentElement.getBoundingClientRect();
    const offX = stack.left - hr.left, offY = stack.top - hr.top;
    const { W, H } = c;
    mat.uniforms.uMap.value = c.tex;
    mat.uniforms.uSize.value.set(W, H);
    let tearX, alpha, Rr;
    fly.makeTranslation(offX - HW / 2, HH / 2 - offY, 0);
    if (t < .72) {
      const e = ease(t / .72);
      tearX = W * (1 - e); alpha = mix(58, 28, e) * Math.PI / 180; Rr = mix(30, 95, e);
    } else {
      const u = (t - .72) / .28, eu = ease(u);
      tearX = 0; alpha = 28 * Math.PI / 180; Rr = 95 * (1 + .35 * Math.sin(3 * Math.PI * u));
      // bay lên trái, xoay, nghiêng: quanh góc trên trái của tờ
      tmp.makeTranslation(-(.25 * W * u + .08 * W * Math.sin(1.5 * Math.PI * u)), 1.15 * H * eu, 40 * u); fly.multiply(tmp);
      tmp.makeRotationZ((14 * u - 6 * Math.sin(2.6 * Math.PI * u)) * Math.PI / 180); fly.multiply(tmp);
      tmp.makeRotationX((22 * u) * Math.PI / 180); fly.multiply(tmp);
    }
    mat.uniforms.uT.value.set(tearX, 0);
    mat.uniforms.uN.value.set(Math.cos(alpha), -Math.sin(alpha));
    mat.uniforms.uR.value = Rr;
    mat.uniforms.uFly.value.copy(fly);
    mesh.visible = true;
    draw();
    void R;
    return true;
  };
  ctx.on('motion', m => { if (m?.motion === 'lite') life.teardown(); });
  const lost = () => { life.teardown(); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost(); });
  if (SNAP) window.__tl = { cache, prep };
  return { hook, alive: () => life.alive, teardown: () => life.teardown() };
}
