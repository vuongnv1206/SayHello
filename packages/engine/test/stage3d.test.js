import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLife, fpsGuard, flicker, clamp, withTimeout } from '../src/client/stage3d.js';

test('createLife: gỡ listener, chạy hàm dọn theo thứ tự ngược, gỡ class, chỉ một lần', () => {
  const removed = [], order = [];
  const target = { addEventListener() {}, removeEventListener(t) { removed.push(t); } };
  const root = { classList: { list: new Set(['a', 'b', 'c']), remove(...c) { c.forEach(x => this.list.delete(x)); } } };
  const life = createLife(root, ['a', 'b']);
  life.listen(target, 'scroll', () => {}); life.listen(target, 'resize', () => {});
  life.own(() => order.push(1)); life.own(() => order.push(2));
  life.teardown(); life.teardown();
  assert.deepEqual(removed, ['scroll', 'resize']);
  assert.deepEqual(order, [2, 1]);
  assert.deepEqual([...root.classList.list], ['c']);
  assert.equal(life.alive, false);
});

test('fpsGuard: tắt hậu kỳ khi < 24fps, về bản phẳng khi vẫn < 14fps hai lần, bỏ qua thời gian khởi động', () => {
  let slow = 0, flat = 0;
  const g = fpsGuard({ grace: 0, onSlow: () => slow++, onTooSlow: () => flat++ });
  let t = performance.now();
  const run = (fps, secs) => { for (let i = 0; i < fps * secs; i++) { t += 1000 / fps; g.tick(t); } };
  run(60, 4); assert.equal(slow, 0);
  run(20, 4.2); assert.equal(slow, 1); assert.equal(flat, 0);
  run(10, 6.5); assert.equal(flat >= 1, true);
  const off = fpsGuard({ disabled: true, onSlow: () => { throw new Error('không được gọi'); } });
  for (let i = 0; i < 100; i++) off.tick(performance.now() + i * 200);
});

test('fpsGuard: khoảng nghỉ (đứng ngắm, chuyển app) và lúc tải không bị tính là máy chậm', () => {
  let slow = 0, flat = 0;
  const g = fpsGuard({ grace: 3, onSlow: () => slow++, onTooSlow: () => flat++ });
  let t = 10_000; // tạo guard từ lâu (tải ảnh, biên dịch shader) rồi mới vẽ khung đầu
  const run = (fps, secs) => { for (let i = 0; i < fps * secs; i++) { t += 1000 / fps; g.tick(t); } };
  for (let k = 0; k < 8; k++) { run(60, .5); t += 5000; } // vẽ nửa giây rồi nghỉ 5 giây, nhiều lần
  assert.equal(slow, 0); assert.equal(flat, 0);
  run(60, 4); assert.equal(slow, 0);
  assert.ok(g.fps > 55);
});

test('flicker: tắt trước khi bật, sáng hẳn sau ~0,35s, kẹp trong [0,1]', () => {
  assert.equal(flicker(0), 0);
  assert.ok(flicker(.08) < .2);
  assert.equal(flicker(.4), 1);
  assert.equal(clamp(5), 1);
});

test('withTimeout: báo lỗi khi quá hạn', async () => {
  await assert.rejects(() => withTimeout(new Promise(() => {}), 10, 'quá lâu'), /quá lâu/);
  assert.equal(await withTimeout(Promise.resolve(3), 50, 'x'), 3);
});
