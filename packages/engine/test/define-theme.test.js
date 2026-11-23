import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defineTheme } from '../src/index.js';

const scene = (id, extra = {}) => ({ id, render: () => '', ...extra });
const base = (extra = {}) => ({ id: 'cuon-phim', name: 'Cuộn Phim', version: '2.0.0', scenes: [scene('bia', { kind: 'gate' }), scene('ve', { provides: ['when', 'where', 'rsvp'] })], ...extra });

test('mẫu hợp lệ: điền mặc định và không cần ngăn kéo dự phòng', () => {
  const t = defineTheme(base());
  assert.equal(t.layout, 'scroll');
  assert.equal(t.tier, 'basic');
  assert.equal(t.voice, 'than-mat');
  assert.deepEqual(t.fallback, []);
  assert.ok(Object.isFrozen(t) && Object.isFrozen(t.scenes[0]));
});

test('thiếu cảnh hiển thị tính năng bắt buộc thì ghi vào fallback', () => {
  const t = defineTheme(base({ scenes: [scene('bia', { kind: 'gate' }), scene('chuyen', { provides: ['story'] })] }));
  assert.deepEqual(t.fallback, ['when', 'where', 'rsvp']);
});

test('tắt một tính năng bắt buộc thì không còn trong fallback', () => {
  const t = defineTheme(base({ features: { rsvp: 'off' }, scenes: [scene('ve', { provides: ['when', 'where'] })] }));
  assert.deepEqual(t.fallback, []);
});

test('báo lỗi rõ ràng bằng tiếng Việt', () => {
  assert.throws(() => defineTheme(base({ id: 'Cuộn Phim' })), /id phải là chữ thường/);
  assert.throws(() => defineTheme(base({ version: '2' })), /version/);
  assert.throws(() => defineTheme(base({ layout: 'grid' })), /layout "grid"/);
  assert.throws(() => defineTheme(base({ scenes: [] })), /ít nhất một cảnh/);
  assert.throws(() => defineTheme(base({ scenes: [scene('a'), scene('a')] })), /trùng id cảnh/);
  assert.throws(() => defineTheme(base({ scenes: [{ id: 'a' }] })), /render/);
  assert.throws(() => defineTheme(base({ scenes: [scene('a'), scene('b', { kind: 'gate' })] })), /gate phải đứng đầu/);
  assert.throws(() => defineTheme(base({ scenes: [scene('a', { provides: ['ve-so'] })] })), /provides "ve-so"/);
  assert.throws(() => defineTheme(base({ features: { rsvp: 'maybe' } })), /required\/optional\/off/);
});

test('cảnh có chuyển động điện ảnh bắt buộc có bản lite', () => {
  assert.throws(() => defineTheme(base({ scenes: [scene('a', { motion: { cinematic: () => {} } })] })), /motion.lite/);
  assert.doesNotThrow(() => defineTheme(base({ scenes: [scene('a', { motion: { cinematic: () => {}, lite: 'css' } })] })));
});
