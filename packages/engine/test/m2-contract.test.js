import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defineTheme,
  composeInvitation,
  composeTheme,
  LAYOUTS,
  buildContext,
  renderDocument,
} from '../src/index.js';

const baseInvite = {
  slug: 'm2-test',
  date: '2027-11-20T18:00:00+07:00',
  city: 'Hà Nội',
  groom: { short: 'Gia Huy' },
  bride: { short: 'Khánh Linh' },
  events: [{ title: 'Tiệc Cưới', date: '2027-11-20T18:00:00+07:00', main: true, venue: 'Sảnh A' }],
  images: {
    hero: 'images/hero.jpg',
    album: ['images/a1.jpg', 'images/a2.jpg'],
  },
};

test('LAYOUTS supports folio, lookbook, deck, split while rejecting grid', () => {
  for (const layout of ['folio', 'lookbook', 'deck', 'split']) {
    assert.ok(LAYOUTS.includes(layout), `Missing layout ${layout}`);
    const t = defineTheme({
      id: `test-${layout}`,
      name: `Test ${layout}`,
      version: '1.0.0',
      layout,
      scenes: [{ id: 's', provides: ['when', 'where', 'rsvp'], render: () => '' }],
    });
    assert.equal(t.layout, layout);
    assert.deepEqual(t.layoutSpec, { id: layout });
    assert.ok(Object.isFrozen(t.layoutSpec));
  }
  assert.throws(
    () => defineTheme({ id: 'bad', name: 'Bad', version: '1.0.0', layout: 'grid', scenes: [{ id: 's', render: () => '' }] }),
    /layout "grid"/
  );
});

test('defineTheme supports object layoutSpec, frozen moment, and topics mirrored to palettes', () => {
  const t = defineTheme({
    id: 'folio-test',
    name: 'Folio Test',
    version: '1.0.0',
    layout: { id: 'folio', spread: '2-leaf', stickyLeft: true },
    moment: {
      id: 'unseal-gleam',
      verb: 'unseal',
      verbLabel: 'Mở niêm phong',
      trigger: 'click-or-drag',
      durationMs: 450,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      reducedFallback: 'instant-fade',
    },
    topics: [
      {
        id: 'son-mai',
        name: 'Sơn Mài Khảm Trai',
        swatch: ['#4A1419', '#D6B26E'],
        vars: { '--sh-bg': '#4A1419', '--sh-font-display': "'Cormorant Garamond', serif" },
        themeColor: '#4A1419',
      },
      {
        id: 'giay-do',
        name: 'Giấy Dó & Triện Mộc',
        swatch: ['#F5F0E6', '#B22A22'],
        vars: { '--sh-bg': '#F5F0E6', '--sh-ink': '#1F2421' },
        fonts: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;600&display=swap',
        themeColor: '#F5F0E6',
      },
    ],
    scenes: [{ id: 'main', provides: ['when', 'where', 'rsvp'], render: () => '' }],
  });

  assert.equal(t.layout, 'folio');
  assert.equal(t.layoutSpec.spread, '2-leaf');
  assert.ok(Object.isFrozen(t.layoutSpec));
  assert.equal(t.moment.id, 'unseal-gleam');
  assert.ok(Object.isFrozen(t.moment));
  assert.equal(t.topics.length, 2);
  assert.ok(Object.isFrozen(t.topics) && Object.isFrozen(t.topics[0]) && Object.isFrozen(t.topics[0].vars));
  assert.equal(t.palettes.length, 2);
  assert.equal(t.palettes[1].id, 'giay-do');

  assert.throws(() => defineTheme({
    id: 'bad-moment', name: 'Bad', version: '1.0.0', moment: { id: 'x', durationMs: -10 },
    scenes: [{ id: 's', render: () => '' }],
  }), /durationMs/);
});

test('composeInvitation and composeTheme compose Layout x Topic x Moment cleanly', () => {
  assert.equal(composeTheme, composeInvitation);
  const t = composeInvitation({
    id: 'composed-folio',
    name: 'Composed Folio',
    version: '1.0.0',
    layout: {
      id: 'folio',
      scenes: [{ id: 'card', provides: ['when', 'where', 'rsvp'], render: () => '' }],
    },
    gate: { id: 'cover', kind: 'gate', render: () => '' },
    moment: { id: 'unseal-gleam', verb: 'unseal', durationMs: 450 },
    topics: [{ id: 'lua-nga', name: 'Lụa Ngà', vars: { '--sh-bg': '#FAF8F4' } }],
  });
  assert.equal(t.layout, 'folio');
  assert.equal(t.scenes[0].kind, 'gate');
  assert.equal(t.scenes[1].id, 'card');
  assert.equal(t.fallback.length, 0);
  assert.ok(Object.isFrozen(t));
});

test('buildContext imgPair returns { bg, fg } with graceful empty fg fallback', () => {
  const t = defineTheme({
    id: 'lookbook-test',
    name: 'Lookbook',
    version: '1.0.0',
    layout: 'lookbook',
    scenes: [{ id: 's', provides: ['when', 'where', 'rsvp'], render: () => '' }],
  });

  const ctxNoCutout = buildContext(t, baseInvite, { assetBase: '/_e/themes/chieu-sau/' });
  assert.deepEqual(ctxNoCutout.imgPair('hero', 0), { bg: '/_e/themes/chieu-sau/images/hero.jpg', fg: '' });

  const ctxWithCutouts = buildContext(t, {
    ...baseInvite,
    images: {
      ...baseInvite.images,
      cutouts: { hero: 'images/hero-nguoi.webp' },
      albumCutouts: ['', 'images/a2-nguoi.webp'],
    },
  }, { assetBase: '/_e/themes/chieu-sau/' });

  assert.deepEqual(ctxWithCutouts.imgPair('hero', 0), {
    bg: '/_e/themes/chieu-sau/images/hero.jpg',
    fg: '/_e/themes/chieu-sau/images/hero-nguoi.webp',
  });
  assert.deepEqual(ctxWithCutouts.imgPair('missing', 1), {
    bg: '/_e/themes/chieu-sau/images/a2.jpg',
    fg: '/_e/themes/chieu-sau/images/a2-nguoi.webp',
  });
});

test('renderDocument resolves topics, opts.topic, font vars, theme-color, and rejects XSS in CSS vars', () => {
  const t = defineTheme({
    id: 'topic-render',
    name: 'Topic Render',
    version: '1.0.0',
    layout: 'split',
    moment: { id: 'seam-converge', verb: 'converge', durationMs: 450 },
    fonts: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600&display=swap',
    topics: [
      {
        id: 'gom-su',
        name: 'Gốm Sứ',
        vars: {
          '--sh-bg': '#F6F4EF',
          '--sh-font-display': "'Playfair Display', serif",
          '--bad-xss': 'red;}body{display:none',
          '--sh-font-bad': 'Arial";alert(1)',
        },
        themeColor: '#1E3250',
      },
      {
        id: 'hai-thanh-pho',
        name: 'Hai Thành Phố',
        vars: { '--sh-bg': '#F5F2EC' },
        fonts: 'https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500&display=swap',
        themeColor: '#3D5A4C',
      },
    ],
    scenes: [{ id: 's', provides: ['when', 'where', 'rsvp'], render: () => '<p>OK</p>' }],
  });

  const defaultDoc = renderDocument(t, baseInvite);
  assert.match(defaultDoc, /data-layout="split"/);
  assert.match(defaultDoc, /data-moment="seam-converge"/);
  assert.match(defaultDoc, /data-topic="gom-su"/);
  assert.match(defaultDoc, /data-palette="gom-su"/);
  assert.match(defaultDoc, /--sh-font-display:&#39;Playfair Display&#39;, serif/);
  assert.doesNotMatch(defaultDoc, /body\{display/);
  assert.doesNotMatch(defaultDoc, /alert\(1\)/);
  assert.match(defaultDoc, /<meta name="theme-color" content="#1E3250">/);

  const topicDoc = renderDocument(t, baseInvite, { topic: 'hai-thanh-pho' });
  assert.match(topicDoc, /data-topic="hai-thanh-pho"/);
  assert.match(topicDoc, /<meta name="theme-color" content="#3D5A4C">/);
  assert.match(topicDoc, /Newsreader:opsz/);

  const unknownDoc = renderDocument(t, { ...baseInvite, topic: 'khong-ton-tai' });
  assert.doesNotMatch(unknownDoc, /data-topic=/);
  assert.doesNotMatch(unknownDoc, /data-palette=/);

  const clientData = JSON.parse(/id="sh-data">(.*?)<\/script>/s.exec(defaultDoc)[1]);
  assert.equal(clientData.topics.length, 2);
  assert.equal(clientData.topics[1].id, 'hai-thanh-pho');
});
