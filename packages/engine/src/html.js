// Dựng HTML an toàn, chạy được cả trên máy chủ lẫn trình duyệt (không đụng tới window/document).
//   html`<p>${tenKhach}</p>`  tự thoát ký tự đặc biệt trong giá trị chèn vào
//   raw(chuoi)                chèn HTML đã tin cậy (chỉ cho chuỗi do mình viết, không cho dữ liệu khách nhập)
//   Mảng được nối lại; null/false/undefined thành chuỗi rỗng.
const RAW = Symbol.for('sayhello.raw');

export const raw = s => ({ [RAW]: String(s ?? '') });
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = v => v == null || v === false ? '' : Array.isArray(v) ? v.map(val).join('') : v[RAW] !== undefined ? v[RAW] : esc(v);

export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += val(v) + strings[i + 1]; });
  return raw(out);
}
export const toStr = h => val(h);
// Xuống dòng trong dữ liệu ("\n") thành <br>
export const br = s => raw(esc(s).replace(/\n/g, '<br>'));
// Nhúng dữ liệu JSON vào <script type="application/json"> mà không thể thoát ra khỏi thẻ
const LS = new RegExp(String.fromCharCode(0x2028), 'g'), PS = new RegExp(String.fromCharCode(0x2029), 'g');
export const jsonScript = obj => raw(JSON.stringify(obj).replace(/</g, '\\u003c').replace(LS, '\\u2028').replace(PS, '\\u2029'));

/**
 * Tách chữ thành từng cụm ký tự (grapheme) để làm hiệu ứng chữ, không làm rời dấu tiếng Việt.
 * "Khánh" (dạng NFD có dấu tổ hợp) vẫn ra 5 cụm: K h á n h.
 */
export function graphemes(text) {
  const s = String(text ?? '').normalize('NFC');
  if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter('vi', { granularity: 'grapheme' }).segment(s)].map(x => x.segment);
  return [...s];
}

// Chữ tách thành <span> cho hiệu ứng, có aria-label để trình đọc màn hình vẫn đọc nguyên chữ
export const splitText = (text, cls = 'ch') => html`<span class="split" aria-label="${text}">${graphemes(text).map((g, i) => g === ' ' ? raw(' ') : html`<span class="${cls}" aria-hidden="true" style="--i:${i}">${g}</span>`)}</span>`;

// Bỏ dấu tiếng Việt cho nội dung chuyển khoản / chuỗi ASCII an toàn
export const plain = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim();
