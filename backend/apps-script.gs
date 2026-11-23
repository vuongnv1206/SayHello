/**
 * SayHello – máy chủ nhỏ cho thiệp cưới, chạy miễn phí trên Google Apps Script + Google Sheets.
 * Một script dùng chung cho MỌI thiệp: mỗi thiệp tự có một tab riêng, đặt theo đường dẫn (slug) của thiệp.
 *
 * Cài đặt: xem backend/HUONG-DAN.md
 *
 * Thiệp gửi lên (POST, body là JSON dạng text/plain):
 *   { invite: 'ten-cap-doi', type: 'rsvp', name, attend, guests, side, gid, events, note, wish }   (wish: lời chúc gửi kèm)
 *   { invite: 'ten-cap-doi', type: 'wish', name, message }
 *   { invite: 'ten-cap-doi', type: 'heart', n }
 *   { invite: 'ten-cap-doi', type: 'content', key, content: {...} }   (Studio lưu nội dung cặp đôi sửa)
 *   { type: 'order', code, theme, pack, price, groom, bride, date, phone, slug, note }  (trang /dat-thiep/, ghi vào tab "_Đơn hàng")
 * Thiệp đọc về (GET):
 *   ?invite=ten-cap-doi&type=wishes  -> [{ name, message }]
 *   ?invite=ten-cap-doi&type=hearts  -> { hearts: 123 }
 *   ?invite=ten-cap-doi&type=content -> { content: {...} | null }
 *   ?invite=ten-cap-doi&type=guests&key=... -> { rsvps: [...], wishes: [...] }  (trang quản lý của cặp đôi)
 *   ?invite=ten-cap-doi&type=invite_list&key=... -> { list: [{ name, group, sent }] }  (danh sách khách mời cặp đôi đã lưu, riêng tư)
 *   { invite: 'ten-cap-doi', type: 'invite_list', key, list: [...] }   (lưu danh sách khách mời, đánh dấu đã gửi)
 *
 *   { invite: 'ten-cap-doi', type: 'upload', key, mime, data }   (Studio tải ảnh lên Google Drive của người bán)
 *   ?type=admin&key=...  -> { orders, invites, keys }   (trang tổng hợp của người bán /ban-hang/, mã riêng của người bán)
 *
 *   { invite: 'ten-cap-doi', type: 'moderate', key, at, name, message, hide, pin }   (cặp đôi ẩn/hiện, ghim lời chúc trên trang quản lý khách)
 *
 * Kiểm duyệt: cặp đôi bấm Ẩn/Ghim trên trang quản lý khách, hoặc gõ "x" vào cột "Ẩn" của lời chúc trong Sheet.
 *
 * Chạy tự động (làm một lần): chọn hàm caiDatTuDong → Chạy. Sau đó mỗi sáng tự gửi email nhắc các đám cưới sắp tới
 * (kèm lời nhắn soạn sẵn để chuyển cho cặp đôi qua Zalo), mỗi tuần tự sao lưu Sheet vào Google Drive.
 */

// Để trống: thiệp nào cũng ghi được. Điền danh sách để chỉ nhận những thiệp đã bán, chống ghi rác:
// const ALLOWED = ['minh-khang-thu-ha', 'hoang-nam-bao-ngoc'];
const ALLOWED = [];

// Chuỗi bí mật để tạo mã sửa cho từng thiệp. ĐỔI chuỗi này, và ghi đúng chuỗi đó vào file .env
// ở máy của Ngài (STUDIO_SECRET=...) để lệnh "npm run studio-link" tạo đúng link Studio.
const STUDIO_SECRET = 'doi-chuoi-nay-thanh-chuoi-bi-mat-cua-ban';

// Địa chỉ trang web, dùng để soạn link trong email nhắc (npm run apps-script tự điền từ site.json)
const SITE_URL = 'https://sayhello-wheat.vercel.app';
// Nhắc trước ngày cưới bao nhiêu ngày
const REMIND_DAYS = [7, 1];
// Giữ bao nhiêu bản sao lưu gần nhất (bản cũ hơn chuyển vào thùng rác Drive, còn khôi phục được 30 ngày)
const KEEP_BACKUPS = 8;
const IMAGE_FOLDER = 'SayHello – ảnh thiệp';
const BACKUP_FOLDER = 'SayHello – sao lưu';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_UPLOADS = 120; // mỗi thiệp, chống lạm dụng

const CONTENT_SHEET = '_Nội dung';
const LIST_SHEET = '_Khách mời';
const ORDER_SHEET = '_Đơn hàng';
const ORDER_HEADERS = ['Thời gian', 'Mã đơn', 'Mẫu', 'Gói', 'Số tiền', 'Chú rể', 'Cô dâu', 'Ngày cưới', 'Điện thoại / Zalo', 'Đường dẫn', 'Ghi chú', 'Trạng thái'];
const HEADERS = ['Thời gian', 'Loại', 'Tên', 'Tham dự', 'Số người', 'Khách của', 'Lời chúc', 'Ẩn', 'Mã khách', 'Sự kiện', 'Ghi chú', 'Ghim'];
const MAX_WISHES = 300;

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.type === 'admin') return json(validKey('_admin', p.key) ? readAdmin() : { error: 'key' });
  const slug = cleanSlug(p.invite);
  if (!slug) return json({ error: 'invite?' });
  if (p.type === 'hearts') return json({ hearts: getHearts(slug) });
  if (p.type === 'content') return json({ content: readContent(slug) });
  if (p.type === 'invite_list') {
    if (!validKey(slug, p.key)) return json({ error: 'key' });
    return json({ list: readInviteList(slug) });
  }
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

  if (d.type === 'invite_list') {
    if (!validKey(slug, d.key)) return json({ ok: false, error: 'key' });
    return json(saveInviteList(slug, d.list));
  }

  if (d.type === 'upload') {
    if (!validKey(slug, d.key)) return json({ ok: false, error: 'key' });
    return json(saveImage(slug, d));
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
      sh.appendRow([new Date(), 'Xác nhận', cut(d.name, 60), cut(d.attend, 10), cut(d.guests, 4), cut(d.side, 40), '', '',
        String(d.gid || '').replace(/[^a-z0-9]/gi, '').slice(0, 12), cut(d.events, 120), cut(d.note, 160), '']);
      if (d.wish) sh.appendRow([new Date(), 'Lời chúc', cut(d.name, 60), '', '', '', cut(d.wish, 500), '', '', '', '', '']);
    } else if (d.type === 'wish') {
      sh.appendRow([new Date(), 'Lời chúc', cut(d.name, 60), '', '', '', cut(d.message, 500), '', '', '', '', '']);
    } else if (d.type === 'moderate') {
      if (!validKey(slug, d.key)) return json({ ok: false, error: 'key' });
      return json(moderateWish(sh, d));
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

// Tab cũ chỉ có 8 cột: đọc đủ HEADERS.length cột, cột thiếu là chuỗi rỗng
function readRows(sh) {
  const n = Math.min(HEADERS.length, sh.getMaxColumns());
  return sh.getRange(2, 1, sh.getLastRow() - 1, n).getValues().map(r => { while (r.length < HEADERS.length) r.push(''); return r; });
}

// Lời chúc hiện trên thiệp: lời ghim (quét hết các dòng) lên đầu, sau đó mới nhất trước
function readWishes(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(slug);
  if (!sh || sh.getLastRow() < 2) return [];
  const rows = readRows(sh);
  const pinned = [], out = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (r[1] !== 'Lời chúc' || !r[6] || String(r[7]).trim()) continue;
    if (String(r[11]).trim()) pinned.push({ name: String(r[2]), message: String(r[6]), pinned: true });
    else if (out.length < MAX_WISHES) out.push({ name: String(r[2]), message: String(r[6]) });
  }
  return pinned.concat(out);
}

// Ẩn/hiện hoặc ghim một lời chúc. Tìm dòng theo đủ ba thông tin (thời điểm + tên + nội dung), không theo số dòng,
// để người bán xóa hay sắp xếp lại dòng trong Sheet cũng không sửa nhầm lời chúc khác.
function moderateWish(sh, d) {
  if (sh.getLastRow() < 2) return { ok: false, error: 'notfound' };
  const rows = readRows(sh), name = String(d.name || ''), msg = String(d.message || ''), at = String(d.at || ''); // đúng như trang quản lý nhận được từ readGuests
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r[1] !== 'Lời chúc' || iso(r[0]) !== at || String(r[2]) !== name || String(r[6]) !== msg) continue;
    if (d.hide !== undefined) sh.getRange(i + 2, 8).setValue(d.hide ? 'x' : '');
    if (d.pin !== undefined) sh.getRange(i + 2, 12).setValue(d.pin ? 'ghim' : '');
    return { ok: true };
  }
  return { ok: false, error: 'notfound' };
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

/* ---------- Danh sách khách mời của cặp đôi: tab "_Khách mời", mỗi thiệp một dòng, chỉ đọc/ghi được khi có mã sửa ---------- */

function readInviteList(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LIST_SHEET);
  const row = sh ? findContentRow(sh, slug) : 0;
  if (!row) return [];
  try { const v = JSON.parse(sh.getRange(row, 2).getValue()); return Array.isArray(v) ? v : []; } catch (e) { return []; }
}

function saveInviteList(slug, list) {
  if (!Array.isArray(list)) return { ok: false, error: 'list' };
  const clean = list.slice(0, 600).map(x => ({
    name: String((x && x.name) || '').replace(/\s+/g, ' ').trim().slice(0, 60),
    group: String((x && x.group) || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30),
    sent: !!(x && x.sent),
  })).filter(x => x.name);
  const text = JSON.stringify(clean);
  if (text.length > 45000) return { ok: false, error: 'too_big' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(LIST_SHEET);
    if (!sh) {
      sh = ss.insertSheet(LIST_SHEET);
      sh.appendRow(['Thiệp', 'Danh sách khách mời (JSON)', 'Lưu lúc']);
      sh.setFrozenRows(1);
      sh.getRange(1, 1, 1, 3).setFontWeight('bold');
    }
    let row = findContentRow(sh, slug);
    if (!row) { sh.appendRow([slug, '', '']); row = sh.getLastRow(); }
    sh.getRange(row, 2).setNumberFormat('@').setValue(text);
    sh.getRange(row, 3).setValue(new Date());
    return { ok: true, count: clean.length };
  } finally {
    lock.releaseLock();
  }
}

function readGuests(slug) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(slug);
  if (!sh || sh.getLastRow() < 2) return { rsvps: [], wishes: [] };
  const rows = readRows(sh);
  const rsvps = [], wishes = [];
  rows.forEach(r => {
    const at = r[0] instanceof Date ? r[0].toISOString() : String(r[0]);
    if (r[1] === 'Xác nhận') rsvps.push({ at, name: String(r[2]), attend: String(r[3]), guests: Number(r[4]) || 1, side: String(r[5]), gid: String(r[8] || ''), events: String(r[9] || ''), note: String(r[10] || '') });
    if (r[1] === 'Lời chúc') wishes.push({ at, name: String(r[2]), message: String(r[6]), hidden: !!String(r[7]).trim(), pinned: !!String(r[11] || '').trim() });
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

/* ---------- Ảnh cặp đôi tải lên trong Studio: lưu vào Google Drive của người bán ---------- */

// Mỗi thiệp một thư mục con trong "SayHello – ảnh thiệp". Ảnh để chế độ "ai có link đều xem được" để thiệp hiện được.
function saveImage(slug, d) {
  const m = /^image\/(jpeg|png|webp)$/.exec(String(d.mime || ''));
  if (!m) return { ok: false, error: 'type' };
  let bytes;
  try { bytes = Utilities.base64Decode(String(d.data || '')); } catch (err) { return { ok: false, error: 'data' }; }
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return { ok: false, error: 'too_big' };
  const props = PropertiesService.getScriptProperties(), countKey = 'uploads:' + slug;
  const count = Number(props.getProperty(countKey)) || 0;
  if (count >= MAX_UPLOADS) return { ok: false, error: 'limit' };
  const parent = folderByName(IMAGE_FOLDER, 'imageFolder');
  const sub = parent.getFoldersByName(slug);
  const folder = sub.hasNext() ? sub.next() : parent.createFolder(slug);
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const file = folder.createFile(Utilities.newBlob(bytes, 'image/' + m[1], Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyyMMdd-HHmmss') + '.' + ext));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  props.setProperty(countKey, String(count + 1));
  return { ok: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId() };
}

// Thư mục trên Drive theo tên, nhớ id để lần sau không tạo trùng
function folderByName(name, prop) {
  const props = PropertiesService.getScriptProperties(), id = props.getProperty(prop);
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) {} }
  const found = DriveApp.getFoldersByName(name);
  const f = found.hasNext() ? found.next() : DriveApp.createFolder(name);
  props.setProperty(prop, f.getId());
  return f;
}

/* ---------- Trang tổng hợp của người bán (/ban-hang/) ---------- */

function readOrders() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, ORDER_HEADERS.length).getValues().map(r => ({
    at: iso(r[0]), code: String(r[1]), theme: String(r[2]), pack: String(r[3]), price: Number(r[4]) || 0,
    groom: String(r[5]), bride: String(r[6]), date: ymd(r[7]), phone: String(r[8]), slug: String(r[9]).trim(), note: String(r[10]), status: String(r[11]),
  }));
}

// Ngày cưới cặp đôi đã sửa trong Studio (nếu có) và lúc lưu gần nhất
function contentInfo() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONTENT_SHEET), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(r => {
    let date = '';
    try { date = ymd(JSON.parse(r[1]).date || ''); } catch (err) {}
    out[String(r[0])] = { date: date, savedAt: iso(r[2]) };
  });
  return out;
}

// Khóa gộp: có mã khách thì theo mã; không thì theo tên + bên (hai người trùng tên khác bên không bị gộp)
function rsvpKey(r) { return r.gid ? 'g:' + r.gid : 'n:' + r.name.toLowerCase().trim() + '|' + r.side; }

function readAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), orders = readOrders(), content = contentInfo();
  const invites = ss.getSheets().map(s => s.getName()).filter(n => /^[a-z0-9][a-z0-9-]{0,59}$/.test(n)).map(slug => {
    const g = readGuests(slug), last = {};
    g.rsvps.forEach(r => { last[rsvpKey(r)] = r; }); // mỗi khách lấy lần xác nhận cuối
    const rs = Object.keys(last).map(k => last[k]), yes = rs.filter(r => r.attend === 'Có');
    return { slug: slug, rsvps: rs.length, yes: yes.length, people: yes.reduce((s, r) => s + r.guests, 0), wishes: g.wishes.length,
      hearts: getHearts(slug), date: (content[slug] || {}).date || '', savedAt: (content[slug] || {}).savedAt || '' };
  });
  const keys = {};
  orders.map(o => o.slug).concat(invites.map(i => i.slug), Object.keys(content)).forEach(s => {
    if (/^[a-z0-9][a-z0-9-]{0,59}$/.test(s)) keys[s] = editKey(s);
  });
  return { orders: orders, invites: invites, keys: keys, content: content, now: new Date().toISOString() };
}

// Mở trình soạn Apps Script, chọn hàm này → Chạy, rồi xem Nhật ký thực thi để lấy link trang người bán
function taoLinkBanHang() {
  Logger.log('Trang tổng hợp (chỉ mình bạn dùng): ' + SITE_URL + '/ban-hang/?ma=' + editKey('_admin'));
}

/* ---------- Nhắc trước ngày cưới (gửi email cho người bán, kèm lời nhắn soạn sẵn cho cặp đôi) ---------- */

function upcomingWeddings() {
  const today = ymd(new Date()), content = contentInfo(), seen = {};
  return readOrders().filter(o => o.slug && !/\bh[uủ]y\b/i.test(o.status) && !seen[o.slug] && (seen[o.slug] = true)).map(o => {
    const date = (content[o.slug] || {}).date || o.date;
    return { order: o, date: date, days: date ? daysBetween(today, date) : -1 };
  }).filter(w => w.days >= 0).sort((a, b) => a.days - b.days);
}

function reminderText(w) {
  const o = w.order, key = editKey(o.slug), when = w.days === 0 ? 'hôm nay' : w.days === 1 ? 'ngày mai' : w.days + ' ngày nữa';
  return 'Đám cưới ' + o.groom + ' & ' + o.bride + ' · ' + w.date.split('-').reverse().join('/') + ' (' + when + ')\n' +
    'Zalo cặp đôi: ' + o.phone.replace(/^'/, '') + '\n\n' +
    'Lời nhắn soạn sẵn (chép rồi gửi qua Zalo):\n' +
    'Chúc mừng hai bạn, ' + when + ' là ngày vui rồi! Danh sách khách đã xác nhận và lời chúc của mọi người ở đây:\n' +
    SITE_URL + '/studio/khach.html?thiep=' + o.slug + '&ma=' + key + '\n' +
    'Nếu cần sửa giờ, địa chỉ hay câu chữ trên thiệp: ' + SITE_URL + '/studio/?thiep=' + o.slug + '&ma=' + key;
}

// Chạy tự động mỗi sáng (bật bằng caiDatTuDong). Mỗi đám cưới chỉ nhắc một lần cho mỗi mốc trong REMIND_DAYS.
function nhacCuoi() {
  const props = PropertiesService.getScriptProperties();
  const due = upcomingWeddings().filter(w => REMIND_DAYS.indexOf(w.days) >= 0 && !props.getProperty('nhac:' + w.order.slug + ':' + w.date + ':' + w.days));
  if (!due.length) return;
  MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'SayHello: ' + due.length + ' đám cưới sắp tới cần nhắc',
    due.map(reminderText).join('\n\n────────────\n\n') + '\n\nXem tất cả: ' + SITE_URL + '/ban-hang/?ma=' + editKey('_admin'));
  due.forEach(w => props.setProperty('nhac:' + w.order.slug + ':' + w.date + ':' + w.days, '1'));
}

/* ---------- Sao lưu Sheet định kỳ vào Google Drive ---------- */

// Chạy tự động mỗi tuần (bật bằng caiDatTuDong). Lượt thả tim lưu riêng nên được ghi kèm vào tab "_Thả tim" trước khi sao.
function saoLuu() {
  const ss = SpreadsheetApp.getActiveSpreadsheet(), props = PropertiesService.getScriptProperties().getProperties();
  const hearts = Object.keys(props).filter(k => k.indexOf('hearts:') === 0).map(k => [k.slice(7), Number(props[k]) || 0]);
  let hs = ss.getSheetByName('_Thả tim');
  if (!hs) hs = ss.insertSheet('_Thả tim');
  hs.clear();
  hs.getRange(1, 1, hearts.length + 1, 2).setValues([['Thiệp', 'Lượt thả tim']].concat(hearts));
  const folder = folderByName(BACKUP_FOLDER, 'backupFolder');
  DriveApp.getFileById(ss.getId()).makeCopy(ss.getName() + ' – ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm'), folder);
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) files.push(it.next());
  files.sort((a, b) => b.getDateCreated() - a.getDateCreated());
  files.slice(KEEP_BACKUPS).forEach(f => f.setTrashed(true));
}

// Chạy MỘT LẦN trong trình soạn Apps Script (chọn caiDatTuDong → Chạy, cấp quyền Gmail + Drive).
function caiDatTuDong() {
  ScriptApp.getProjectTriggers().forEach(t => { if (['nhacCuoi', 'saoLuu'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('nhacCuoi').timeBased().everyDays(1).atHour(8).inTimezone('Asia/Ho_Chi_Minh').create();
  ScriptApp.newTrigger('saoLuu').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).inTimezone('Asia/Ho_Chi_Minh').create();
  saoLuu();
  Logger.log('Đã bật: nhắc đám cưới lúc 8 giờ sáng mỗi ngày, sao lưu lúc 3 giờ sáng thứ Hai. Vừa sao lưu bản đầu tiên vào thư mục "' + BACKUP_FOLDER + '".');
  taoLinkBanHang();
}

/* ---------- Tiện ích ---------- */

function isDate(v) { return Object.prototype.toString.call(v) === '[object Date]'; }
function iso(v) { return isDate(v) ? v.toISOString() : String(v == null ? '' : v); }

// Ngày dạng yyyy-MM-dd từ ô Sheet (có thể là Date, "2027-12-05", "2027-12-05T18:00:00+07:00" hoặc "5/12/2027")
function ymd(v) {
  if (isDate(v)) return Utilities.formatDate(v, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const s = String(v == null ? '' : v), a = /(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (a) return a[0];
  const b = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  return b ? b[3] + '-' + ('0' + b[2]).slice(-2) + '-' + ('0' + b[1]).slice(-2) : '';
}

function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5); }

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
