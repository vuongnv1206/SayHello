// Kiểm tra backend/apps-script.gs không cần Google: chạy code trong Node với Sheets, Drive, Gmail giả lập.
// Chạy cùng npm test. Không gọi mạng, không đụng Sheet thật.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../backend/apps-script.gs', import.meta.url), 'utf8');

function makeSheet(name, rows = []) {
  const data = rows.map(r => [...r]);
  return {
    name, data,
    getName: () => name,
    getLastRow: () => data.length, getMaxColumns: () => 26,
    appendRow: r => data.push([...r]),
    setFrozenRows() {}, setColumnWidth() {},
    clear: () => { data.length = 0; },
    getRange(r, c, nr = 1, nc = 1) {
      const rng = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => data[r - 1 + i]?.[c - 1 + j] ?? '')),
        getValue: () => data[r - 1]?.[c - 1] ?? '',
        setValues: v => { v.forEach((row, i) => { data[r - 1 + i] ||= []; row.forEach((x, j) => (data[r - 1 + i][c - 1 + j] = x)); }); return rng; },
        setValue: v => { data[r - 1] ||= []; data[r - 1][c - 1] = v; return rng; },
        setFontWeight: () => rng, setBackground: () => rng, setNumberFormat: () => rng,
      };
      return rng;
    },
  };
}

const sheets = {};
const ss = {
  getSheetByName: n => sheets[n] || null,
  insertSheet: n => (sheets[n] = makeSheet(n)),
  getSheets: () => Object.values(sheets),
  getName: () => 'SayHello – dữ liệu', getId: () => 'SS1',
};
const props = {};
const files = [], folders = {}, mails = [], triggers = [];
let fileId = 0;
function folder(name) {
  return folders[name] ||= {
    name, kids: {}, files: [],
    getId: () => 'F-' + name,
    getFoldersByName(n) { const f = this.kids[n]; return { hasNext: () => !!f, next: () => f }; },
    createFolder(n) { return (this.kids[n] = folder(name + '/' + n)); },
    createFile(blob) { const f = { id: 'IMG' + (++fileId), blob, getId() { return this.id; }, sharing: null, setSharing(a, p) { this.sharing = [a, p]; } }; this.files.push(f); return f; },
    getFiles() { const l = [...this.files]; return { hasNext: () => l.length > 0, next: () => l.shift() }; },
  };
}

const ctx = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ss },
  PropertiesService: { getScriptProperties: () => ({
    getProperty: k => props[k] ?? null, setProperty: (k, v) => { props[k] = String(v); }, getProperties: () => ({ ...props }) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: s => ({ s, setMimeType() { return JSON.parse(s); } }), MimeType: { JSON: 'json' } },
  Utilities: {
    Charset: { UTF_8: 'utf8' },
    computeHmacSha256Signature: (v, k) => [...createHmac('sha256', k).update(v).digest()].map(b => (b > 127 ? b - 256 : b)),
    formatDate: (d, tz, f) => {
      const t = new Date(d.getTime() + 7 * 3600e3), p = n => String(n).padStart(2, '0');
      return f.replace('yyyy', t.getUTCFullYear()).replace('MM', p(t.getUTCMonth() + 1)).replace('dd', p(t.getUTCDate())).replace('HH', p(t.getUTCHours())).replace('mm', p(t.getUTCMinutes())).replace('ss', p(t.getUTCSeconds()));
    },
    base64Decode: s => { if (!/^[A-Za-z0-9+/=]*$/.test(s)) throw new Error('bad'); return [...Buffer.from(s, 'base64')]; },
    newBlob: (bytes, mime, name) => ({ bytes, mime, name }),
  },
  DriveApp: {
    getFolderById: id => { const f = Object.values(folders).find(f => f.getId() === id); if (!f) throw new Error('nf'); return f; },
    getFoldersByName: n => { const f = folders[n]; return { hasNext: () => !!f, next: () => f }; },
    createFolder: n => folder(n),
    getFileById: id => ({ makeCopy: (name, f) => { const c = { name, created: new Date(Date.now() + files.length * 1000), trashed: false, getDateCreated() { return this.created; }, setTrashed(t) { this.trashed = t; } }; files.push(c); f.files.push(c); return c; } }),
    Access: { ANYONE_WITH_LINK: 'anyone' }, Permission: { VIEW: 'view' },
  },
  MailApp: { sendEmail: (to, subj, body) => mails.push({ to, subj, body }) },
  Session: { getEffectiveUser: () => ({ getEmail: () => 'nguoi-ban@example.com' }) },
  ScriptApp: {
    getProjectTriggers: () => [...triggers], deleteTrigger: t => triggers.splice(triggers.indexOf(t), 1),
    WeekDay: { MONDAY: 'MON' },
    newTrigger: h => { const b = { timeBased: () => b, everyDays: () => b, atHour: () => b, inTimezone: () => b, onWeekDay: () => b, create: () => { triggers.push({ getHandlerFunction: () => h }); } }; return b; },
  },
  Logger: { log() {} },
  console,
};
vm.createContext(ctx);
vm.runInContext(src + '\nthis.__ = { doGet, doPost, editKey, readAdmin, upcomingWeddings, reminderText, nhacCuoi, saoLuu, caiDatTuDong, ymd, daysBetween };', ctx);
const G = ctx.__;
const post = d => G.doPost({ postData: { contents: JSON.stringify(d) } });
const get = p => G.doGet({ parameter: p });
const SECRET = 'doi-chuoi-nay-thanh-chuoi-bi-mat-cua-ban';
const key = s => createHmac('sha256', SECRET).update(s).digest('hex').slice(0, 16);

// editKey khớp với scripts/studio-link.mjs
assert.equal(G.editKey('demo-thu-tay'), key('demo-thu-tay'));

// ymd
assert.equal(G.ymd('2027-12-05'), '2027-12-05');
assert.equal(G.ymd('5/12/2027'), '2027-12-05');
assert.equal(G.ymd('2027-11-20T18:00:00+07:00'), '2027-11-20');
assert.equal(G.ymd(new Date('2027-12-04T20:00:00Z')), '2027-12-05');

// Đơn hàng + khách
const d = n => { const t = new Date(Date.now() + n * 864e5 + 7 * 3600e3); return t.toISOString().slice(0, 10); };
post({ type: 'order', code: 'SHAAAAAA', theme: 'thu-tay', pack: 'co-ban', price: 199000, groom: 'An', bride: 'Bình', date: d(7), phone: '0912', slug: 'an-binh' });
post({ type: 'order', code: 'SHBBBBBB', theme: 'tin-nhan', pack: 'co-ban', price: 199000, groom: 'Cường', bride: 'Dung', date: d(30), phone: '0913', slug: 'cuong-dung' });
post({ type: 'order', code: 'SHCCCCCC', theme: 'tin-nhan', pack: 'co-ban', price: 199000, groom: 'Em', bride: 'Gấm', date: d(1), phone: '0914', slug: 'em-gam' });
sheets['_Đơn hàng'].data[3][11] = 'Đã hủy';
post({ invite: 'an-binh', type: 'rsvp', name: 'Lan', attend: 'Có', guests: 2, side: 'Nhà trai' });
post({ invite: 'an-binh', type: 'rsvp', name: 'lan ', attend: 'Có', guests: 3, side: 'Nhà trai' });
post({ invite: 'an-binh', type: 'rsvp', name: 'Huệ', attend: 'Không', guests: 1, side: 'Nhà gái' });
// Hai khách trùng tên nhưng khác mã khách không bị gộp; cùng mã thì lần sau thay lần trước
post({ invite: 'an-binh', type: 'rsvp', name: 'Minh', attend: 'Có', guests: 1, side: 'Nhà trai', gid: 'aaaa1111' });
post({ invite: 'an-binh', type: 'rsvp', name: 'Minh', attend: 'Có', guests: 2, side: 'Nhà trai', gid: 'bbbb2222' });
post({ invite: 'an-binh', type: 'rsvp', name: 'Minh', attend: 'Có', guests: 4, side: 'Nhà trai', gid: 'bbbb2222' });
post({ invite: 'an-binh', type: 'wish', name: 'Huệ', message: 'Chúc mừng!' });
post({ invite: 'an-binh', type: 'heart', n: 5 });
// Cặp đôi cuong-dung dời ngày cưới trong Studio còn 1 ngày
post({ invite: 'cuong-dung', type: 'content', key: key('cuong-dung'), content: { date: d(1) + 'T18:00:00+07:00' } });

// Admin
assert.deepEqual(get({ type: 'admin', key: 'sai' }), { error: 'key' });
const a = get({ type: 'admin', key: key('_admin') });
assert.equal(a.orders.length, 3);
const ab = a.invites.find(i => i.slug === 'an-binh');
assert.deepEqual([ab.rsvps, ab.yes, ab.people, ab.wishes, ab.hearts], [4, 3, 8, 1, 5]);
assert.equal(a.keys['an-binh'], key('an-binh'));
assert.equal(a.keys['cuong-dung'], key('cuong-dung'));
assert.ok(!a.invites.some(i => i.slug.startsWith('_')));
console.log('✓ Apps Script: trang người bán');

// Sắp cưới: em-gam đã hủy nên bỏ; cuong-dung dùng ngày trong Studio (1 ngày)
const up = G.upcomingWeddings();
assert.deepEqual(up.map(w => [w.order.slug, w.days]), [['cuong-dung', 1], ['an-binh', 7]]);
assert.match(G.reminderText(up[0]), /ngày mai/);

// Nhắc: gửi 1 email cho 2 đám cưới, lần 2 không gửi lại
G.nhacCuoi(); G.nhacCuoi();
assert.equal(mails.length, 1);
assert.match(mails[0].subj, /2 đám cưới/);
assert.match(mails[0].body, /khach\.html\?thiep=an-binh&ma=/);

// Tải ảnh
assert.equal(post({ invite: 'an-binh', type: 'upload', key: 'x', mime: 'image/jpeg', data: 'AAAA' }).error, 'key');
assert.equal(post({ invite: 'an-binh', type: 'upload', key: key('an-binh'), mime: 'text/html', data: 'AAAA' }).error, 'type');
assert.equal(post({ invite: 'an-binh', type: 'upload', key: key('an-binh'), mime: 'image/jpeg', data: '' }).error, 'too_big');
const up1 = post({ invite: 'an-binh', type: 'upload', key: key('an-binh'), mime: 'image/jpeg', data: Buffer.from('fakejpeg').toString('base64') });
assert.equal(up1.ok, true); assert.match(up1.url, /^https:\/\/lh3\.googleusercontent\.com\/d\/IMG\d+$/);
const up2 = post({ invite: 'an-binh', type: 'upload', key: key('an-binh'), mime: 'image/png', data: Buffer.from('x').toString('base64') });
assert.equal(folders['SayHello – ảnh thiệp'].kids['an-binh'].files.length, 2, 'cùng một thư mục con');
assert.deepEqual(folders['SayHello – ảnh thiệp/an-binh'].files[0].sharing, ['anyone', 'view']);
props['uploads:an-binh'] = '120';
assert.equal(post({ invite: 'an-binh', type: 'upload', key: key('an-binh'), mime: 'image/jpeg', data: 'AAAA' }).error, 'limit');
console.log('✓ Apps Script: tải ảnh lên Drive');

// Sao lưu + cài đặt tự động
for (let i = 0; i < 10; i++) G.saoLuu();
const bk = folders['SayHello – sao lưu'].files;
assert.equal(bk.length, 10); assert.equal(bk.filter(f => !f.trashed).length, 8);
assert.deepEqual(sheets['_Thả tim'].data, [['Thiệp', 'Lượt thả tim'], ['an-binh', 5]]);
G.caiDatTuDong(); G.caiDatTuDong();
assert.deepEqual(triggers.map(t => t.getHandlerFunction()).sort(), ['nhacCuoi', 'saoLuu']);
console.log('✓ Apps Script: nhắc ngày cưới, sao lưu, cài chạy tự động');

// RSVP nhiều buổi lễ + ghi chú + lời chúc gửi kèm; ẩn và ghim lời chúc
{
  const S = 'ghim-thu', K = key(S);
  post({ invite: S, type: 'rsvp', name: 'Hà', attend: 'Có', guests: 2, side: 'Nhà gái', gid: 'h1', events: 'Lễ Ăn Hỏi; Tiệc tối', note: 'Ăn chay', wish: 'Chúc hai bạn trăm năm!' });
  post({ invite: S, type: 'wish', name: 'Bình', message: 'Hạnh phúc nhé' });
  post({ invite: S, type: 'wish', name: '=SPAM()', message: 'Quảng cáo' });
  const g1 = get({ invite: S, type: 'guests', key: K });
  assert.equal(g1.rsvps[0].events, 'Lễ Ăn Hỏi; Tiệc tối'); assert.equal(g1.rsvps[0].note, 'Ăn chay');
  assert.equal(g1.wishes.length, 3, 'lời chúc gửi kèm RSVP phải thành một dòng riêng');
  const w = n => g1.wishes.find(x => x.name.endsWith(n));
  // Sai mã thì không sửa được
  assert.equal(post({ invite: S, type: 'moderate', key: 'sai', at: w('Bình').at, name: 'Bình', message: w('Bình').message, hide: true }).error, 'key');
  // Ghim lời chúc cũ nhất: lên đầu danh sách trên thiệp
  assert.equal(post({ invite: S, type: 'moderate', key: K, at: w('Hà').at, name: 'Hà', message: w('Hà').message, pin: true }).ok, true);
  // Tên bắt đầu bằng "=" được lưu kèm dấu ' (chống công thức Sheet); trang quản lý gửi lại đúng tên đó
  assert.equal(post({ invite: S, type: 'moderate', key: K, at: w('=SPAM()').at, name: w('=SPAM()').name, message: 'Quảng cáo', hide: true }).ok, true);
  // Không khớp đủ ba thông tin thì không sửa gì
  assert.equal(post({ invite: S, type: 'moderate', key: K, at: w('Bình').at, name: 'Bình', message: 'Sai nội dung', hide: true }).error, 'notfound');
  const shown = get({ invite: S, type: 'wishes' });
  assert.deepEqual(shown.map(x => x.name), ['Hà', 'Bình']); assert.equal(shown[0].pinned, true);
  const g2 = get({ invite: S, type: 'guests', key: K });
  assert.equal(g2.wishes.find(x => x.name.endsWith('SPAM()')).hidden, true);
  // Hiện lại + bỏ ghim
  post({ invite: S, type: 'moderate', key: K, at: w('Hà').at, name: 'Hà', message: w('Hà').message, pin: false });
  assert.deepEqual(get({ invite: S, type: 'wishes' }).map(x => x.name), ['Bình', 'Hà']);
  console.log('✓ Apps Script: RSVP nhiều lễ, ẩn và ghim lời chúc');
}

// Danh sách khách mời riêng tư của cặp đôi
{
  const S = 'danh-sach', K = key(S);
  assert.equal(get({ invite: S, type: 'invite_list', key: 'sai' }).error, 'key');
  assert.deepEqual(get({ invite: S, type: 'invite_list', key: K }).list, []);
  assert.equal(post({ invite: S, type: 'invite_list', key: 'sai', list: [] }).error, 'key');
  assert.equal(post({ invite: S, type: 'invite_list', key: K, list: [{ name: '  Chị   Lan ', group: 'Nha-Gai!', sent: 1 }, { name: '' }, { name: '=1+1' }] }).count, 2);
  assert.deepEqual(get({ invite: S, type: 'invite_list', key: K }).list, [{ name: 'Chị Lan', group: 'nha-gai', sent: true }, { name: '=1+1', group: '', sent: false }]);
  post({ invite: S, type: 'invite_list', key: K, list: [{ name: 'Anh Tuấn' }] }); // ghi lại thay bản cũ, không thêm dòng
  assert.equal(get({ invite: S, type: 'invite_list', key: K }).list.length, 1);
  assert.equal(sheets['_Khách mời'].data.length, 2);
  assert.equal(post({ invite: S, type: 'invite_list', key: K, list: 'x' }).error, 'list');
  // Danh sách không lộ qua các đường công khai
  assert.ok(!JSON.stringify(get({ invite: S, type: 'content' })).includes('Anh Tuấn'));
  console.log('✓ Apps Script: danh sách khách mời riêng tư');
}
