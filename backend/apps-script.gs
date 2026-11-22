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
 * Thiệp đọc về (GET):
 *   ?invite=ten-cap-doi&type=wishes  -> [{ name, message }]
 *   ?invite=ten-cap-doi&type=hearts  -> { hearts: 123 }
 *
 * Kiểm duyệt: gõ "x" vào cột "Ẩn" của một lời chúc trong Sheet để ẩn nó khỏi thiệp.
 */

// Để trống: thiệp nào cũng ghi được. Điền danh sách để chỉ nhận những thiệp đã bán, chống ghi rác:
// const ALLOWED = ['minh-khang-thu-ha', 'hoang-nam-bao-ngoc'];
const ALLOWED = [];

const HEADERS = ['Thời gian', 'Loại', 'Tên', 'Tham dự', 'Số người', 'Khách của', 'Lời chúc', 'Ẩn'];
const MAX_WISHES = 300;

function doGet(e) {
  const p = (e && e.parameter) || {};
  const slug = cleanSlug(p.invite);
  if (!slug) return json({ error: 'invite?' });
  if (p.type === 'hearts') return json({ hearts: getHearts(slug) });
  return json(readWishes(slug));
}

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'json' }); }
  const slug = cleanSlug(d.invite);
  if (!slug) return json({ ok: false, error: 'invite' });

  if (d.type === 'heart') {
    const n = Math.max(0, Math.min(50, parseInt(d.n, 10) || 0));
    return json({ ok: true, hearts: addHearts(slug, n) });
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
