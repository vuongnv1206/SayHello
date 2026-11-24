// Chất giấy cho Tờ Lịch (chạy trong trình duyệt, không cần thư viện):
//   fibreTile()  — tấm thớ giấy 256² vẽ một lần bằng canvas, dùng làm nền mọi tờ (multiply lên màu giấy)
//   tearLine()   — đường rách theo hàng lỗ, có hạt giống theo từng tờ: cùng một đường cho mép trên tờ bay đi và cuống còn lại
//   clipTop()    — clip-path polygon để mép trên tờ đang xé lởm chởm
//   stub()       — cuống giấy còn dính dưới gáy keo sau khi tờ bị xé (SVG, mép dưới là đường rách)
//   paperSound() — tiếng xé tổng hợp bằng WebAudio: tiếng rít theo tốc độ kéo, tiếng "tách" ở mỗi lỗ, tiếng dứt khi rời gáy

export const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ s >>> 15, 1 | s), ((s ^ s >>> 7) >>> 0) / 4294967296);

/** Đường rách: điểm [x, y] mỗi 1,5px; đi qua tâm lỗ (y = 0), xơ ra ở quãng giữa hai lỗ. */
export function tearLine(W, seed, pitch = 12, hole = 2.4) {
  const r = rng(seed), pts = [];
  let drift = 0;
  for (let x = 0; x <= W + .01; x += 1.5) {
    const c = x % pitch, nearHole = Math.abs(c - pitch / 2) < hole;
    drift = drift * .82 + (r() - .5) * 1.1;
    const y = nearHole ? 0 : drift * 1.6 + (r() - .5) * .9;
    pts.push([Math.min(x, W), Math.max(-2.5, Math.min(2.5, y))]);
  }
  return pts;
}

/** Clip-path cho mép trên tờ đang bay: đường rách lệch xuống 3px, phần dưới giữ nguyên. */
export function clipTop(W, seed) {
  const pts = tearLine(W, seed).map(([x, y]) => `${x.toFixed(1)}px ${(y + 3).toFixed(1)}px`);
  return `polygon(${pts.join(',')}, 100% 100%, 0 100%)`;
}

/** Cuống giấy dưới gáy: dải cao 7px, mép dưới là đường rách của chính tờ đó. */
export function stub(W, seed, k) {
  const pts = tearLine(W, seed).map(([x, y]) => `${x.toFixed(1)},${(7 + y).toFixed(1)}`);
  const el = document.createElement('div');
  el.className = 'tl-stub';
  el.dataset.k = String(k);
  el.style.setProperty('--o', String(k));
  el.innerHTML = `<svg viewBox="0 0 ${W} 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 L${W},0 L${pts.reverse().join(' L')} Z"/></svg>`;
  return el;
}

/** Tấm thớ giấy: nhiễu mịn ±3% độ sáng + sợi dài theo nhiều hướng. Trả về URL blob (hoặc '' nếu không vẽ được). */
export async function fibreTile(size = 256) {
  try {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const img = g.createImageData(size, size), d = img.data, r = rng(7);
    for (let i = 0; i < d.length; i += 4) { const v = 236 + (r() - .5) * 16; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    // sợi giấy: nét mảnh, ngắn, hơi cong, sáng hoặc tối nhẹ
    for (let k = 0; k < 520; k++) {
      const x = r() * size, y = r() * size, a = r() * Math.PI, len = 6 + r() * 26;
      g.strokeStyle = r() < .5 ? `rgba(0,0,0,${.025 + r() * .04})` : `rgba(255,255,255,${.05 + r() * .08})`;
      g.lineWidth = .4 + r() * .7;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * len * .5 + (r() - .5) * 4, y + Math.sin(a) * len * .5 + (r() - .5) * 4, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
    // vẽ lại sát mép đối diện để tấm ghép liền
    const tile = document.createElement('canvas'); tile.width = tile.height = size;
    const t = tile.getContext('2d');
    for (const [dx, dy] of [[0, 0], [-size, 0], [0, -size], [-size, -size]]) t.drawImage(c, dx + size / 2, dy + size / 2);
    const blob = await new Promise(res => tile.toBlob(res, 'image/png'));
    return blob ? URL.createObjectURL(blob) : '';
  } catch { return ''; }
}

/** Tiếng xé giấy. Chỉ tạo AudioContext sau thao tác của khách (chạm/cuộn bằng tay). Lỗi thì im lặng. */
export function paperSound() {
  let ac, noise, src, bp, gain, ready = false;
  const init = () => {
    if (ready) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const ch = noise.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
      bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .9;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
      gain = ac.createGain(); gain.gain.value = 0;
      src.connect(bp).connect(hp).connect(gain).connect(ac.destination); src.start();
      ready = true;
    } catch {}
  };
  const burst = (dur, f0, f1, peak, q = 1.2) => {
    if (!ready) return;
    try {
      const s = ac.createBufferSource(); s.buffer = noise;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
      const g = ac.createGain(), t = ac.currentTime;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .005); g.gain.exponentialRampToValueAtTime(.001, t + dur);
      s.connect(f).connect(g).connect(ac.destination); s.start(t, Math.random()); s.stop(t + dur + .02);
    } catch {}
  };
  const muted = () => { try { return sessionStorage.getItem('sayhello:music-off') === '1'; } catch { return false; } };
  return {
    init,
    /** speed: px rách mỗi giây (0 khi đứng yên) */
    scrub(speed) {
      if (!ready || muted()) return;
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      const t = ac.currentTime;
      bp.frequency.setTargetAtTime(1800 + Math.min(1400, speed * .9), t, .03);
      gain.gain.setTargetAtTime(Math.min(.22, speed * .0009), t, .015);
    },
    pop() { if (!muted()) burst(.004 + Math.random() * .004, 4200 * (.85 + Math.random() * .3), 3600, .08, 3); },
    release() { if (!muted()) { burst(.14, 2600, 900, .25); navigator.vibrate?.(8); } },
  };
}
