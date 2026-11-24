import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineTheme, renderDocument, buildContext, graphemes, html, toStr, pickMotion, bindContextLoss, fmt } from '../src/index.js';

const invite = {
  slug: 'thu', date: '2027-11-20T18:00:00+07:00', city: 'Hà Nội',
  groom: { short: 'Gia Huy' }, bride: { short: 'Khánh Linh' },
  events: [{ title: 'Lễ Vu Quy', date: '2027-11-20T08:30:00+07:00' }, { title: 'Tiệc Cưới', date: '2027-11-20T18:00:00+07:00', main: true, venue: 'Nhà hàng A' }],
  places: [{ label: 'Tiệc', address: 'Số 1 phố B' }],
  images: { hero: 'images/a.jpg', album: ['images/b.jpg'] },
};
const theme = defineTheme({
  id: 'thu-nghiem', name: 'Thử', version: '1.0.0',
  scenes: [
    { id: 'bia', kind: 'gate', render: ctx => ctx.html`<h1>${ctx.names.pair}</h1><p>Gửi ${ctx.guest()}</p>` },
    { id: 've', provides: ['when', 'where', 'rsvp'], render: ctx => ctx.html`<p>${ctx.main.title}</p><img src="${ctx.img('hero')}">` },
  ],
});

test('graphemes giữ nguyên dấu tiếng Việt kể cả dạng tổ hợp (NFD)', () => {
  assert.deepEqual(graphemes('Khánh'.normalize('NFD')), ['K', 'h', 'á', 'n', 'h']);
  assert.equal(graphemes('Ngọc Ánh').length, 8);
});

test('html`` thoát ký tự của dữ liệu khách nhập', () => {
  assert.equal(toStr(html`<p>${'<script>alert(1)</script>'}</p>`), '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('dữ liệu nhúng trong <script> không thoát ra được khỏi thẻ', async () => {
  const { jsonScript } = await import('../src/html.js');
  const out = toStr(jsonScript({ slug: '</script><script>alert(1)</script>' }));
  assert.doesNotMatch(out, /<\/script>/i);
  assert.equal(JSON.parse(out).slug, '</script><script>alert(1)</script>');
  const doc = renderDocument(theme, { ...invite, slug: '</script><img src=x onerror=alert(1)>' });
  assert.equal((doc.match(/<\/script>/g) || []).length, (doc.match(/<script/g) || []).length);
});

test('fmt đọc giờ ghi trong chuỗi, không đổi theo múi giờ máy chủ', () => {
  assert.equal(fmt.time('2027-11-20T18:00:00+07:00'), '18:00');
  assert.equal(fmt.long('2027-11-20T18:00:00+07:00'), 'Thứ Bảy · 20 tháng 11 năm 2027');
});

test('buildContext: thứ tự tên, ảnh tuyệt đối, buổi lễ chính, link lịch', () => {
  const ctx = buildContext(theme, { ...invite, order: 'bride-first' }, { assetBase: '/demo/' });
  assert.equal(ctx.names.pair, 'Khánh Linh & Gia Huy');
  assert.equal(ctx.img('hero'), '/demo/images/a.jpg');
  assert.equal(ctx.img('groom', 0), '/demo/images/b.jpg'); // thiếu ô thì lấy album
  assert.equal(ctx.main.title, 'Tiệc Cưới');
  assert.match(ctx.events[0].gcal, /^https:\/\/calendar\.google\.com\//);
  assert.throws(() => buildContext(theme, { groom: {} }), /Thiếu tên/);
});

test('renderDocument: trang đủ, có bìa khoá cuộn, Thông tin nhanh, import map, không lộ dữ liệu thừa', () => {
  const doc = renderDocument(theme, { ...invite, groom: { short: 'Gia <b>Huy</b>' } }, { assetBase: '/demo/', url: 'https://x.vn/thu/' });
  assert.match(doc, /^<!doctype html>/);
  assert.match(doc, /<html lang="vi" class="sh-locked"/);
  assert.match(doc, /data-scene="bia" data-kind="gate"/);
  assert.match(doc, /id="sh-quick"/);
  assert.match(doc, /"@sayhello\/engine":"\/_e\/engine\/index.js"/);
  assert.match(doc, /Gia &lt;b&gt;Huy&lt;\/b&gt;/);
  assert.doesNotMatch(doc, /Gia <b>Huy<\/b>/);
  assert.match(doc, /<span data-guest data-fallback="bạn">bạn<\/span>/);
  assert.match(doc, /href="#ve"/); // nút xác nhận trong Thông tin nhanh nhảy tới cảnh có rsvp
  // Dữ liệu cho trình duyệt nhúng an toàn trong thẻ script
  const json = /<script type="application\/json" id="sh-data">(.*?)<\/script>/s.exec(doc)[1];
  assert.equal(JSON.parse(json).theme, 'thu-nghiem');
});

test('renderDocument: mẫu không có cảnh rsvp thì Thông tin nhanh chứa sẵn form xác nhận', () => {
  const t = defineTheme({ id: 'toi-gian', name: 'Tối giản', version: '1.0.0', scenes: [{ id: 'a', render: () => '' }] });
  const doc = renderDocument(t, invite);
  assert.match(doc, /form class="sh-form sh-quick-rsvp" data-sh="rsvp"/);
  assert.doesNotMatch(doc, /class="sh-locked"/);
});

test('bảng màu: chỉ nhận id của mẫu và biến CSS hợp lệ, không chèn được CSS lạ', () => {
  const t = defineTheme({ id: 'mau', name: 'M', version: '1.0.0', scenes: [{ id: 'a', provides: ['when', 'where', 'rsvp'], render: () => '' }],
    palettes: [{ id: 'xanh', vars: { '--velvet': '#14574a', 'color': 'red', '--x': 'red;}body{display:none' } }] });
  const doc = renderDocument(t, { ...invite, palette: 'xanh' });
  assert.match(doc, /style="--velvet:#14574a" data-palette="xanh"/);
  assert.doesNotMatch(doc, /body{display/);
  assert.doesNotMatch(renderDocument(t, { ...invite, palette: 'khong-co' }), /data-palette/);
});

test('nhạc nền và nhóm khách: dựng nút nhạc, gửi nhóm cho trình duyệt, đánh dấu buổi lễ', () => {
  const doc = renderDocument(theme, { ...invite, music: 'nhac/a.mp3', guestGroups: [{ id: 'Nha-Gai', events: [1], greeting: 'Kính mời họ nhà gái' }, { label: 'thiếu id' }] }, { assetBase: '/demo/' });
  assert.match(doc, /<audio id="sh-audio" src="\/demo\/nhac\/a.mp3" preload="none" loop>/);
  const data = JSON.parse(/id="sh-data">(.*?)<\/script>/s.exec(doc)[1]);
  assert.deepEqual(data.groups, [{ id: 'nha-gai', events: [1], greeting: 'Kính mời họ nhà gái', note: '' }]);
  assert.match(doc, /<li data-ev="0">/);
});

test('pickMotion: tôn trọng giảm chuyển động, hạ mức máy yếu, thận trọng trong Zalo', () => {
  assert.equal(pickMotion({ reducedMotion: true, webgl2: true, deviceMemory: 8, cores: 8 }), 'lite');
  assert.equal(pickMotion({ saveData: true }), 'lite');
  assert.equal(pickMotion({ deviceMemory: 1, cores: 8 }), 'lite');
  assert.equal(pickMotion({ webgl2: true, deviceMemory: 8, cores: 8 }), 'cinematic');
  assert.equal(pickMotion({ webgl2: true, deviceMemory: 8, cores: 4, inApp: true }), 'standard');
  assert.equal(pickMotion({ webgl2: true, deviceMemory: 8, cores: 8, fps: 38 }), 'standard');
  assert.equal(pickMotion({ override: 'lite', webgl2: true, deviceMemory: 8, cores: 8 }), 'lite');
});

test('renderDocument: import map khai báo three và three/addons/ cho nạp động sau khi mở bìa', () => {
  const doc = renderDocument(theme, invite);
  const mapJson = /<script type="importmap">(.*?)<\/script>/s.exec(doc)[1];
  const { imports } = JSON.parse(mapJson);
  assert.equal(imports['three'], 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js');
  assert.equal(imports['three/addons/'], 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/');
});

test('bindContextLoss: gọi preventDefault + callback khi mất ngữ cảnh WebGL và gỡ bỏ sạch', () => {
  assert.doesNotThrow(() => bindContextLoss(null, () => {})());
  const listeners = new Map();
  const canvas = {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); },
  };
  let lostCount = 0;
  let prevented = false;
  const unbind = bindContextLoss(canvas, () => { lostCount++; });
  assert.ok(listeners.has('webglcontextlost'));
  listeners.get('webglcontextlost')({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(lostCount, 1);
  unbind();
  assert.equal(listeners.has('webglcontextlost'), false);
});

test('lib: từ chối thư viện không khai báo', async () => {
  const { lib } = await import('../src/client/lib.js');
  await assert.rejects(() => lib('khong-ton-tai'), /Không có thư viện/);
});
