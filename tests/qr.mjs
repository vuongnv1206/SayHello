// Kiểm tra bộ tạo mã QR (studio/qr.js) bằng một bộ giải mã viết riêng theo chuẩn ISO 18004:
// đọc thông tin định dạng, bỏ mặt nạ, tách khối, kiểm tra Reed-Solomon bằng syndrome, đọc lại chuỗi.
import assert from 'node:assert/strict';
import { makeQr } from '../studio/qr.js';

// GF(256) bằng bảng log/exp
const EXP = new Array(512), LOG = new Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
const remainder = (v, poly) => { const d = poly.toString(2).length - 1; for (let i = 31 - Math.clz32(v); i >= d; i--) if ((v >>> i) & 1) v ^= poly << (i - d); return v; };

// Mặt nạ theo chuẩn: điều kiện đúng thì đảo bit
const MASK = [(i, j) => (i + j) % 2 === 0, (i, j) => i % 2 === 0, (i, j) => j % 3 === 0, (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0, (i, j) => ((i * j) % 2) + ((i * j) % 3) === 0,
  (i, j) => (((i * j) % 2) + ((i * j) % 3)) % 2 === 0, (i, j) => (((i + j) % 2) + ((i * j) % 3)) % 2 === 0]; // i = hàng, j = cột

const TOTAL = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70]];
const EC = { L: { cw: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22], bl: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6] },
  M: { cw: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24], bl: [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10] } };

function decode(qr) {
  const n = qr.size, ver = (n - 17) / 4, g = (r, c) => qr.get(c, r); // g(hàng, cột)
  assert.ok(Number.isInteger(ver) && ver >= 1 && ver <= 15, 'kích thước lạ');
  // Thông tin định dạng: 15 bit, bản sao thứ nhất quanh finder trái trên, bản thứ hai ở hai bên còn lại
  const f1 = [[8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8], [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]]
    .reduce((a, [c, r], i) => a | (g(r, c) << i), 0);
  // (cột, hàng) theo chuẩn: bit 0..7 ở hàng 8 phía phải (cột n-1-i); bit 8..14 ở cột 8 phía dưới (hàng n-15+i)
  let f2 = 0; for (let i = 0; i < 8; i++) f2 |= g(8, n - 1 - i) << i; for (let i = 8; i < 15; i++) f2 |= g(n - 15 + i, 8) << i;
  assert.equal(f1, f2, 'hai bản sao thông tin định dạng khác nhau');
  const fmt = f1 ^ 0x5412; assert.equal(remainder(fmt, 0x537), 0, 'BCH định dạng sai');
  const eclBits = fmt >>> 13, mask = (fmt >>> 10) & 7, ecc = eclBits === 1 ? 'L' : eclBits === 0 ? 'M' : null;
  assert.ok(ecc, 'mức sửa lỗi lạ'); assert.equal(ecc, qr.ecc);
  if (ver >= 7) { let v = 0; for (let i = 0; i < 18; i++) v |= g(Math.floor(i / 3), n - 11 + (i % 3)) << i; assert.equal(v >>> 12, ver); assert.equal(remainder(v, 0x1f25), 0, 'BCH phiên bản sai'); }
  // Đánh dấu vùng chức năng
  const fn = Array.from({ length: n }, () => new Array(n).fill(false));
  const box = (r0, c0, r1, c1) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (r >= 0 && r < n && c >= 0 && c < n) fn[r][c] = true; };
  box(0, 0, 8, 8); box(0, n - 8, 8, n - 1); box(n - 8, 0, n - 1, 8); box(6, 0, 6, n - 1); box(0, 6, n - 1, 6);
  if (ver >= 7) { box(0, n - 11, 5, n - 9); box(n - 11, 0, n - 9, 5); }
  const al = ALIGN[ver];
  al.forEach((r, i) => al.forEach((c, j) => { if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return; box(r - 2, c - 2, r + 2, c + 2); }));
  // Đọc bit dữ liệu theo đường zigzag, bỏ mặt nạ
  const bits = [];
  for (let right = n - 1, up = true; right >= 1; right -= 2, up = !up) {
    if (right === 6) right = 5;
    for (let k = 0; k < n; k++) for (const c of [right, right - 1]) {
      const r = up ? n - 1 - k : k; if (fn[r][c]) continue;
      bits.push(g(r, c) ^ MASK[mask](r, c));
    }
  }
  const raw = Math.floor(TOTAL(ver) / 8); assert.ok(bits.length >= raw * 8 && bits.length - raw * 8 < 8, 'số bit dữ liệu không khớp phiên bản');
  const cws = Array.from({ length: raw }, (_, i) => bits.slice(i * 8, i * 8 + 8).reduce((a, b) => (a << 1) | b, 0));
  // Tách khối xen kẽ
  const nb = EC[ecc].bl[ver], eccLen = EC[ecc].cw[ver], nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb);
  const blocks = Array.from({ length: nb }, () => []);
  let p = 0;
  for (let i = 0; i < shortLen - eccLen + 1; i++) for (let b = 0; b < nb; b++) if (!(i === shortLen - eccLen && b < nShort)) blocks[b].push(cws[p++]);
  for (let i = 0; i < eccLen; i++) for (let b = 0; b < nb; b++) blocks[b].push(cws[p++]);
  assert.equal(p, raw);
  // Syndrome: giá trị đa thức mã tại α^0..α^(ecc-1) phải bằng 0
  blocks.forEach(bl => { for (let s = 0; s < eccLen; s++) { let v = 0; for (const c of bl) v = mul(v, EXP[s]) ^ c; assert.equal(v, 0, 'Reed-Solomon sai'); } });
  const data = blocks.flatMap(bl => bl.slice(0, bl.length - eccLen));
  const bs = data.flatMap(b => [7, 6, 5, 4, 3, 2, 1, 0].map(i => (b >>> i) & 1)), rd = (a, l) => bs.slice(a, a + l).reduce((x, y) => (x << 1) | y, 0);
  assert.equal(rd(0, 4), 4, 'không phải chế độ byte');
  const cc = ver <= 9 ? 8 : 16, len = rd(4, cc), out = [];
  for (let i = 0; i < len; i++) out.push(rd(4 + cc + i * 8, 8));
  return new TextDecoder().decode(new Uint8Array(out));
}

const samples = [
  'a', 'https://sayhello-wheat.vercel.app/minh-khang-thu-ha/?k=Anh+Tu%E1%BA%A5n',
  'https://sayhello-wheat.vercel.app/' + 'x'.repeat(120), 'Tiếng Việt có dấu: Nguyễn Thị Hồng Ánh ❤ '.repeat(3), 'z'.repeat(250), 'q'.repeat(400),
];
for (const t of samples) for (const ecc of ['L', 'M']) { const qr = makeQr(t, ecc); assert.equal(decode(qr), t, `${ecc} v${qr.version}`); }
const versions = new Set(samples.flatMap(t => ['L', 'M'].map(e => makeQr(t, e).version)));
assert.ok([...versions].some(v => v >= 7), 'chưa thử phiên bản có thông tin phiên bản (>= 7)');
assert.throws(() => makeQr('y'.repeat(900)), /quá dài/);
console.log('✓ QR: giải mã đúng với', [...versions].sort((a, b) => a - b).join(', '), '(phiên bản)');
