import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  defineTheme,
  merge,
  qrUrl,
  renderDocument,
} from '../src/index.js';
import { bindServices } from '../src/client/services.js';

const baseInvite = {
  slug: 't5-test',
  date: '2027-11-20T18:00:00+07:00',
  city: 'Hà Nội',
  groom: { short: 'Gia Huy' },
  bride: { short: 'Khánh Linh' },
  events: [{ title: 'Tiệc Cưới', date: '2027-11-20T18:00:00+07:00', main: true, venue: 'Sảnh A' }],
  images: { hero: 'images/hero.jpg', album: ['images/a1.jpg'] },
};

test('merge() blocks __proto__, constructor, prototype pollution', () => {
  const payload = JSON.parse('{"__proto__":{"polluted":true},"constructor":{"prototype":{"evil":1}},"prototype":{"x":1},"city":"Đà Nẵng"}');
  const out = merge({ groom: { short: 'X' } }, payload);
  assert.equal(out.city, 'Đà Nẵng');
  assert.equal(out.polluted, undefined);
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.getPrototypeOf(out), Object.prototype);
  assert.equal(Object.hasOwn(out, 'prototype'), false);
});

test('qrUrl() validates a.qr URL schemes and rejects javascript:/data:/vbscript:/protocol-relative', () => {
  assert.equal(qrUrl({ qr: 'https://example.com/qr.png' }), 'https://example.com/qr.png');
  assert.equal(qrUrl({ qr: 'http://localhost:3000/qr.png' }), 'http://localhost:3000/qr.png');
  assert.equal(qrUrl({ qr: '/assets/qr.png' }), '/assets/qr.png');
  assert.equal(qrUrl({ qr: 'javascript:alert(1)' }), '');
  assert.equal(qrUrl({ qr: 'JAVASCRIPT:alert(1)', bankCode: 'VCB', number: '123' }), '');
  assert.equal(qrUrl({ qr: 'data:text/html,<script>alert(1)</script>' }), '');
  assert.equal(qrUrl({ qr: 'vbscript:msgbox(1)' }), '');
  assert.equal(qrUrl({ qr: '//evil.com/qr.png' }), '');
  assert.match(qrUrl({ qr: '   ', bankCode: 'VCB', number: '123', name: 'A' }, 'Mung'), /^https:\/\/img\.vietqr\.io\//);
});

test('renderDocument() sanitizes theme.fonts, rejects unsafe font chars, safely emits themeUrl & tabindex="-1"', () => {
  const badFontTheme = defineTheme({
    id: 't5-font',
    name: 'T5 Font',
    version: '1.0.0',
    fonts: 'javascript:alert(1)',
    scenes: [
      { id: 'bia', kind: 'gate', render: () => '<button data-open>Mở</button>' },
      { id: 'main', provides: ['when', 'where', 'rsvp'], render: () => '<p>Nội dung</p>' },
    ],
  });

  const htmlBadFont = renderDocument(badFontTheme, baseInvite, {
    themeUrl: "/demo'x/</script>/",
    engineUrl: '/_e/engine/',
  });
  assert.doesNotMatch(htmlBadFont, /javascript:alert\(1\)/);
  assert.doesNotMatch(htmlBadFont, /&#39;theme\.js/);
  assert.match(htmlBadFont, /import theme from "\/demo'x\/\\u003c\/script>\/theme\.js";/);
  assert.equal((htmlBadFont.match(/<\/script>/g) || []).length, (htmlBadFont.match(/<script/g) || []).length);
  assert.match(htmlBadFont, /<section class="sh-scene sh-content" id="main" data-scene="main" data-kind="content" tabindex="-1">/);

  // Quotes/backslash/whitespace in fonts URL must be stripped
  const quoteFontTheme = defineTheme({
    id: 't5-qfont',
    name: 'T5 QFont',
    version: '1.0.0',
    fonts: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro'onload=alert(1)",
    scenes: [{ id: 'main', provides: ['when', 'where', 'rsvp'], render: () => '<p>OK</p>' }],
  });
  const htmlQuoteFont = renderDocument(quoteFontTheme, baseInvite);
  assert.doesNotMatch(htmlQuoteFont, /onload=alert\(1\)/);

  const bsFontTheme = defineTheme({
    id: 't5-bsfont',
    name: 'T5 BSFont',
    version: '1.0.0',
    fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro\\test',
    scenes: [{ id: 'main', provides: ['when', 'where', 'rsvp'], render: () => '<p>OK</p>' }],
  });
  const htmlBsFont = renderDocument(bsFontTheme, baseInvite);
  assert.doesNotMatch(htmlBsFont, /\\test/);
});

test('buildEarlyScript validates ?tier= allowlist and preserves prefers-reduced-motion in catch fallback', () => {
  const t = defineTheme({
    id: 't5-early',
    name: 'T5 Early',
    version: '1.0.0',
    topics: [{ id: 'a', name: 'A', vars: { '--sh-bg': '#111' }, themeColor: '#111111' }],
    scenes: [{ id: 'main', provides: ['when', 'where', 'rsvp'], render: () => '<p>OK</p>' }],
  });
  const doc = renderDocument(t, baseInvite);
  const m = /<link rel="modulepreload"[^>]+>\s*<script>([\s\S]*?)<\/script>/.exec(doc);
  assert.ok(m, 'Missing early inline script');

  const execEarly = (search, reduced, throwQuery = false) => {
    const root = { dataset: {}, style: { setProperty: () => {} } };
    vm.runInNewContext(m[1], {
      URLSearchParams,
      location: { search },
      matchMedia: () => ({ matches: reduced }),
      navigator: {},
      document: {
        documentElement: root,
        head: { appendChild: () => {} },
        querySelector: () => {
          if (throwQuery) throw new Error('boom');
          return null;
        },
      },
    });
    return root.dataset.motion;
  };

  assert.equal(execEarly('?tier=bogus', false), 'standard');
  assert.equal(execEarly('?tier=bogus', true), 'lite');
  assert.equal(execEarly('?tier=cinematic', true), 'cinematic');
  assert.equal(execEarly('?topic=a', true, true), 'lite');
  assert.equal(execEarly('?topic=a', false, true), 'standard');
});

test('services.js countdown handles NaN / invalid date without rendering "NaN"', () => {
  const makeCdEl = (target, done) => {
    const classes = new Set();
    const unitEls = [0, 1, 2, 3].map(u => ({ dataset: { u: String(u) }, textContent: '00' }));
    return {
      dataset: { target, done },
      textContent: '',
      classList: { add: c => classes.add(c), has: c => classes.has(c) },
      querySelectorAll: () => unitEls,
    };
  };

  const invalidCd = makeCdEl('invalid-date', 'Đã tới ngày vui');
  const missingCd = makeCdEl('', 'Hôm nay');
  const prevAddEventListener = globalThis.addEventListener;
  const prevSetInterval = globalThis.setInterval;
  globalThis.addEventListener = () => {};
  globalThis.setInterval = () => 0;
  try {
    bindServices({
      querySelectorAll: sel => (sel === '[data-sh=countdown]' ? [invalidCd, missingCd] : []),
      querySelector: () => null,
    }, {
      say: () => '',
      data: { slug: 't5', events: [] },
      wishes: [],
      on: () => {},
      emit: () => {},
      backend: { send: async () => {} },
    });
  } finally {
    globalThis.addEventListener = prevAddEventListener;
    globalThis.setInterval = prevSetInterval;
  }

  assert.equal(invalidCd.textContent, 'Đã tới ngày vui');
  assert.equal(invalidCd.classList.has('is-done'), true);
  assert.doesNotMatch(invalidCd.textContent, /NaN/);
  assert.equal(missingCd.textContent, 'Hôm nay');
  assert.equal(missingCd.classList.has('is-done'), true);
});
