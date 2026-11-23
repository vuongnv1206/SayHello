// Tạo mã QR (chế độ byte, mức sửa lỗi L hoặc M, phiên bản 1-15) hoàn toàn trên trình duyệt, không cần thư viện ngoài.
// Dùng: const qr = makeQr('https://...'); qr.size, qr.get(x, y) -> true nếu ô đen.
// Chạy được cả trong Node (dùng cho tests/qr.mjs).

const ECC_PER_BLOCK = { L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22], M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24] };
const NUM_BLOCKS = { L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6], M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10] };
const FORMAT_BITS = { L: 1, M: 0 };
const MAX_VERSION = 15;

const bit = (x, i) => ((x >>> i) & 1) !== 0;

function rawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}
const dataCodewords = (ver, ecc) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecc][ver] * NUM_BLOCKS[ecc][ver];

// Số học trong GF(256) với đa thức 0x11D
function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; }
function rsDivisor(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = gfMul(root, 2); }
  return r;
}
function rsRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => (r[i] ^= gfMul(c, f))); }
  return r;
}

function toUtf8(text) { return [...new TextEncoder().encode(text)]; }

function encodeData(bytes, ecc) {
  let ver = 1;
  for (; ver <= MAX_VERSION; ver++) {
    const cc = ver <= 9 ? 8 : 16;
    if (4 + cc + bytes.length * 8 <= dataCodewords(ver, ecc) * 8 && (cc === 16 || bytes.length < 256)) break;
  }
  if (ver > MAX_VERSION) throw new Error('Nội dung quá dài cho mã QR');
  const bits = [], put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = dataCodewords(ver, ecc) * 8;
  put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const out = [];
  for (let i = 0; i < bits.length; i += 8) out.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  return { ver, codewords: out };
}

function interleave(data, ver, ecc) {
  const nb = NUM_BLOCKS[ecc][ver], eccLen = ECC_PER_BLOCK[ecc][ver], raw = Math.floor(rawModules(ver) / 8);
  const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(eccLen), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const len = shortLen - eccLen + (i < nShort ? 0 : 1), dat = data.slice(k, k + len); k += len;
    const e = rsRemainder(dat, div); if (i < nShort) dat.push(0);
    blocks.push(dat.concat(e));
  }
  const res = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - eccLen || j >= nShort) res.push(b[i]); });
  return res;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => (x * y) % 2 + (x * y) % 3 === 0,
  (x, y) => ((x * y) % 2 + (x * y) % 3) % 2 === 0, (x, y) => ((x + y) % 2 + (x * y) % 3) % 2 === 0,
];

function build(ver, ecc, codewords, mask) {
  const size = ver * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const n = ver === 1 ? 0 : Math.floor(ver / 7) + 2, step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
  const pos = n ? [6] : []; for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
  pos.forEach((a, i) => pos.forEach((b, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(a + dx, b + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));
  const drawFormat = mk => {
    const data = (FORMAT_BITS[ecc] << 3) | mk; let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) set(8, i, bit(bits, i));
    set(8, 7, bit(bits, 6)); set(8, 8, bit(bits, 7)); set(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(bits, i));
    set(8, size - 8, true);
  };
  drawFormat(0); // giữ chỗ để vùng này được tính là vùng chức năng
  if (ver >= 7) {
    let rem = ver; for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (ver << 12) | rem;
    for (let i = 0; i < 18; i++) { const a = size - 11 + (i % 3), b = Math.floor(i / 3); set(a, b, bit(bits, i)); set(b, a, bit(bits, i)); }
  }
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
      if (!fn[y][x] && k < codewords.length * 8) { m[y][x] = bit(codewords[k >>> 3], 7 - (k & 7)); k++; }
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[mask](x, y)) m[y][x] = !m[y][x];
  drawFormat(mask);
  return m;
}

// Điểm phạt đơn giản (hàng dài cùng màu, khối 2x2, cân bằng đen trắng) để chọn mặt nạ dễ quét
function penalty(m) {
  const size = m.length; let p = 0, dark = 0;
  for (let y = 0; y < size; y++) for (let t = 0; t < 2; t++) {
    let run = 1;
    for (let x = 1; x < size; x++) {
      const a = t ? m[x][y] : m[y][x], b = t ? m[x - 1][y] : m[y][x - 1];
      if (a === b) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
    }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (m[y][x]) dark++;
    if (x && y && m[y][x] === m[y][x - 1] && m[y][x] === m[y - 1][x] && m[y][x] === m[y - 1][x - 1]) p += 3;
  }
  return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
}

export function makeQr(text, ecc = 'M') {
  let enc;
  try { enc = encodeData(toUtf8(text), ecc); } catch (e) { if (ecc === 'L') throw e; ecc = 'L'; enc = encodeData(toUtf8(text), ecc); }
  const all = interleave(enc.codewords, enc.ver, ecc);
  let best = null, bestP = Infinity;
  for (let mk = 0; mk < 8; mk++) { const m = build(enc.ver, ecc, all, mk), p = penalty(m); if (p < bestP) { best = m; bestP = p; } }
  return { size: best.length, version: enc.ver, ecc, get: (x, y) => best[y][x], modules: best };
}
