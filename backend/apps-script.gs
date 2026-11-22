/**
 * SayHello – máy chủ nhỏ cho thiệp cưới, chạy miễn phí trên Google Apps Script + Google Sheets.
 * Một script dùng chung cho MỌI thiệp: mỗi thiệp tự có một tab riêng, đặt theo đường dẫn (slug) của thiệp.
 *
 * Cài đặt: xem backend/HUONG-DAN.md
 *
 * Thiệp gửi lên (POST, body là JSON dạng text/plain):
 *   { invite: 'ten-cap-doi', type: 'rsvp', name, attend, guests, side }
 *   { invite: 'ten-cap-doi', type: 'wish', name, message }
 *   { invite: 'ten-cap-doi', type: 'heart', n }
 *   { invite: 'ten-cap-doi', type: 'content', key, content: {...} }   (Studio lưu nội dung cặp đôi sửa)
 *   { type: 'order', code, theme, pack, price, groom, bride, date, phone, slug, note }  (trang /dat-thiep/, ghi vào tab "_Đơn hàng")
 * Thiệp đọc về (GET):
 *   ?invite=ten-cap-doi&type=wishes  -> [{ name, message }]
 *   ?invite=ten-cap-doi&type=hearts  -> { hearts: 123 }
 *   ?invite=ten-cap-doi&type=content -> { content: {...} | null }
 *   ?invite=ten-cap-doi&type=guests&key=... -> { rsvps: [...], wishes: [...] }  (trang quản lý của cặp đôi)
 *
 * Kiểm duyệt: gõ "x" vào cột "Ẩn" của một lời chúc trong Sheet để ẩn nó khỏi thiệp.
 */

// Để trống: thiệp nào cũng ghi được. Điền danh sách để chỉ nhận những thiệp đã bán, chống ghi rác:
// const ALLOWED = ['minh-khang-thu-ha', 'hoang-nam-bao-ngoc'];
const ALLOWED = [];

// Chuỗi bí mật để tạo mã sửa cho từng thiệp. ĐỔI chuỗi này, và ghi đúng chuỗi đó vào file .env
// ở máy của Ngài (STUDIO_SECRET=...) để lệnh "npm run studio-link" tạo đúng link Studio.
const STUDIO_SECRET = 'doi-chuoi-nay-thanh-chuoi-bi-mat-cua-ban';

const CONTENT_SHEET = '_Nội dung';
const ORDER_SHEET = '_Đơn hàng';
const ORDER_HEADERS = ['Thời gian', 'Mã đơn', 'Mẫu', 'Gói', 'Số tiền', 'Chú rể', 'Cô dâu', 'Ngày cưới', 'Điện thoại / Zalo', 'Đường dẫn', 'Ghi chú', 'Trạng thái'];
const HEADERS = ['Thời gian', 'Loại', 'Tên', 'Tham dự', 'Số người', 'Khách của', 'Lời chúc', 'Ẩn'];
const MAX_WISHES = 300;

function doGet(e) {
  const p = (e && e.parameter) || {};
  const slug = cleanSlug(p.invite);
  if (!slug) return json({ error: 'invite?' });
  if (p.type === 'hearts') return json({ hearts: getHearts(slug) });
  if (p.type === 'content') return json({ content: readContent(slug) });
  if (p.type === 'guests') {
    if (!validKey(slug, p.key)) return json({ error: 'key' });
    return json(readGuests(slug));
  }
  return json(readWishes(slug));
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'json' }); }
  if (d.type === 'order') return json(saveOrder(d));
  const slug = cleanSlug(d.invite);
  if (!slug) return json({ ok: false, error: 'invite' });

  if (d.type === 'heart') {
    const n = Math.max(0, Math.min(50, parseInt(d.n, 10) || 0));
    return json({ ok: true, hearts: addHearts(slug, n) });
  }

  if (d.type === 'content') {
    if (!validKey(slug, d.key)) return json({ ok: false, error: 'key' });
    const text = JSON.stringify(d.content || {});
    if (text.length > 45000) return json({ ok: false, error: 'too_big' });
    return json({ ok: true, savedAt: saveContent(slug, text) });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheetFor(slug);
    if (d.type === 'rsvp') {
      sh.appendRow([new Date(), 'Xác nhận', cut(d.name, 60), cut(d.attend, 10), cut(d.guests, 4), cut(d.side, 40), '', '']);
    } else if (d.type === 'wish') {
      sh.appendRow([new Date(), 'Lời chúc', cut(d.name, 60), '', '', '', cut(d.message, 500), '']);
    } else {
      return json({ ok: false, error: 'type' });
    }
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

/* ---------- Dữ liệu ---------- */

function sheetFor(slug) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(slug);
  if (!sh) {
    sh = ss.insertSheet(slug);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f4ede1');
    sh.setColumnWidth(7, 420);
  }
  return sh;
}

function readWishes(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(slug);
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();
  const out = [];
  for (let i = rows.length - 1; i >= 0 && out.length < MAX_WISHES; i--) {
    const r = rows[i];
    if (r[1] === 'Lời chúc' && r[6] && !String(r[7]).trim()) out.push({ name: String(r[2]), message: String(r[6]) });
  }
  return out; // mới nhất trước
}

/* ---------- Nội dung cặp đôi sửa trong Studio: tab "_Nội dung", mỗi thiệp một dòng ---------- */

function contentSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONTENT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CONTENT_SHEET);
    sh.appendRow(['Thiệp', 'Nội dung (JSON)', 'Lưu lúc']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 3).setFontWeight('bold');
  }
  return sh;
}

function findContentRow(sh, slug) {
  const n = sh.getLastRow();
  if (n < 2) return 0;
  const slugs = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < slugs.length; i++) if (slugs[i][0] === slug) return i + 2;
  return 0;
}

function readContent(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET);
  if (!sh) return null;
  const row = findContentRow(sh, slug);
  if (!row) return null;
  try { return JSON.parse(sh.getRange(row, 2).getValue()); } catch (e) { return null; }
}

function saveContent(slug, text) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = contentSheet(), now = new Date();
    let row = findContentRow(sh, slug);
    if (!row) { sh.appendRow([slug, '', '']); row = sh.getLastRow(); }
    // Ghi dạng chữ thuần để Sheet không hiểu nhầm JSON thành công thức
    sh.getRange(row, 2).setNumberFormat('@').setValue(text);
    sh.getRange(row, 3).setValue(now);
    return now.toISOString();
  } finally {
    lock.releaseLock();
  }
}

function readGuests(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(slug);
  if (!sh || sh.getLastRow() < 2) return { rsvps: [], wishes: [] };
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues();
  const rsvps = [], wishes = [];
  rows.forEach(r => {
    const at = r[0] instanceof Date ? r[0].toISOString() : String(r[0]);
    if (r[1] === 'Xác nhận') rsvps.push({ at, name: String(r[2]), attend: String(r[3]), guests: Number(r[4]) || 1, side: String(r[5]) });
    if (r[1] === 'Lời chúc') wishes.push({ at, name: String(r[2]), message: String(r[6]), hidden: !!String(r[7]).trim() });
  });
  return { rsvps: rsvps, wishes: wishes };
}

// Mã sửa = 16 ký tự đầu của HMAC-SHA256(slug, STUDIO_SECRET), dạng hex
function editKey(slug) {
  const sig = Utilities.computeHmacSha256Signature(slug, STUDIO_SECRET, Utilities.Charset.UTF_8);
  return sig.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0, 16);
}

function validKey(slug, key) {
  return !!key && String(key) === editKey(slug);
}

// Chạy hàm này trong trình soạn Apps Script (chọn taoLinkStudio → Chạy) để xem mã sửa của một thiệp
function taoLinkStudio() {
  const slug = 'demo-thu-tay'; // đổi thành đường dẫn thiệp
  Logger.log('Mã sửa của ' + slug + ': ' + editKey(slug));
}

function getHearts(slug) {
  return Number(PropertiesService.getScriptProperties().getProperty('hearts:' + slug)) || 0;
}

function addHearts(slug, n) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const total = getHearts(slug) + n;
    PropertiesService.getScriptProperties().setProperty('hearts:' + slug, String(total));
    return total;
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Đơn đặt thiệp: tab "_Đơn hàng" ---------- */

// Đối chiếu: mở app ngân hàng, tìm giao dịch có nội dung là Mã đơn, rồi đổi cột "Trạng thái" thành "Đã nhận tiền".
function saveOrder(d) {
  const code = String(d.code || '').toUpperCase();
  if (!/^SH[A-Z0-9]{6}$/.test(code)) return { ok: false, error: 'code' };
  if (!d.groom || !d.bride || !d.phone) return { ok: false, error: 'missing' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(ORDER_SHEET);
    if (!sh) {
      sh = ss.insertSheet(ORDER_SHEET);
      sh.appendRow(ORDER_HEADERS);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, ORDER_HEADERS.length).setFontWeight('bold').setBackground('#f4ede1');
    }
    if (sh.getLastRow() > 1) {
      const codes = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
      if (codes.some(r => r[0] === code)) return { ok: true, duplicate: true };
    }
    sh.appendRow([new Date(), code, cut(d.themeName || d.theme, 40), cut(d.packName || d.pack, 30), Number(d.price) || 0,
      cut(d.groom, 60), cut(d.bride, 60), cut(d.date, 20), "'" + String(d.phone || '').slice(0, 20), cut(d.slug, 60), cut(d.note, 500), 'Chờ chuyển khoản']);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Tiện ích ---------- */

function cleanSlug(s) {
  s = String(s || '').toLowerCase().trim();
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(s)) return '';
  if (ALLOWED.length && ALLOWED.indexOf(s) < 0) return '';
  return s;
}

// Cắt độ dài và chặn công thức (=, +, -, @) để Sheet không chạy nội dung khách gõ
function cut(v, max) {
  let s = String(v == null ? '' : v).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
