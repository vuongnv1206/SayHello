// Dựng nguyên một trang thiệp thành chuỗi HTML (chạy trên máy chủ, hoặc lúc build cho thiệp mẫu).
// Trình duyệt nhận HTML đầy đủ ngay (bìa hiện không cần chờ JS), rồi client/runtime.js gắn hành vi.
import { html, raw, toStr, jsonScript } from './html.js';
import { fmt } from './date.js';
import { buildContext } from './model.js';
import { quickInfo } from './blocks.js';

const isSafeVarKey = k => /^--[\w-]+$/.test(k);
const isSafeVarVal = (k, v) => typeof v === 'string' && (/^--sh-font-/i.test(k) ? /^[a-zA-Z0-9\s,'-]+$/.test(v) : /^[#\w(),.% -]+$/.test(v));
const sanitizeVars = vars => {
  const out = {};
  for (const [k, v] of Object.entries(vars || {})) {
    if (isSafeVarKey(k) && isSafeVarVal(k, v)) out[k] = v;
  }
  return out;
};
const sanitizeThemeColor = c => (typeof c === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(c.trim()) ? c.trim() : '');
const sanitizeFontUrl = u => (typeof u === 'string' && /^https:\/\/fonts\.googleapis\.com\/css2\?[^\s"'<>\\]+$/.test(u) ? u : '');

/**
 * @param theme   mẫu đã qua defineTheme
 * @param invite  dữ liệu thiệp
 * @param opts.engineUrl  nơi phục vụ thư mục src/ của engine cho trình duyệt (vd. /_e/engine/)
 * @param opts.themeUrl   nơi phục vụ thư mục của mẫu (vd. /_e/themes/cuon-phim/)
 * @param opts.assetBase  gốc của ảnh tương đối trong dữ liệu thiệp
 * @param opts.topic      chủ đề/bảng màu mặc định khi dựng HTML (tuỳ chọn)
 * @param opts.url, opts.ogImage  cho thẻ xem trước khi gửi link
 */
export function renderDocument(theme, invite, opts = {}) {
  const { engineUrl = '/_e/engine/', themeUrl = `/_e/themes/${theme.id}/`, assetBase = '', topic: optTopic = '', url = '', ogImage = '' } = opts;
  const ctx = buildContext(theme, invite, { assetBase });
  const { names, data: d } = ctx;
  const title = d.title || `${names.pair} | ${fmt.short(d.date)}`;
  const desc = d.description || `Trân trọng mời bạn tới dự lễ cưới của ${names.pair}, ${fmt.long(d.date)}${d.city ? ' tại ' + d.city : ''}.`;
  const rsvpScene = theme.scenes.find(s => s.provides.includes('rsvp'))?.id;

  const topics = Array.isArray(theme.topics) ? theme.topics : [];
  const palettes = Array.isArray(theme.palettes) ? theme.palettes : [];
  const variants = [...topics, ...palettes.filter(p => !topics.some(t => t.id === p.id))];
  const reqId = optTopic || d.topic || d.palette || '';
  let matchedTopic = null;
  let matchedPal = null;
  if (reqId) {
    const m = variants.find(x => x.id === reqId) || null;
    if (m) {
      if (topics.some(t => t.id === m.id)) matchedTopic = m;
      if (palettes.some(p => p.id === m.id)) matchedPal = m;
    }
  } else if (topics.length) {
    matchedTopic = topics.find(t => t.id === theme.defaultTopic) || topics[0];
    if (palettes.some(p => p.id === matchedTopic.id)) matchedPal = matchedTopic;
  }
  const activeVar = matchedTopic || matchedPal;
  const cleanVars = sanitizeVars(activeVar?.vars);
  const palStyle = Object.entries(cleanVars).map(([k, v]) => `${k}:${v}`).join(';');
  const music = d.music ? (/^(https?:|\/)/.test(d.music) ? d.music : assetBase.replace(/\/?$/, '/') + d.music.replace(/^\.\//, '')) : '';

  const scenes = theme.scenes.map(s => {
    if (s.when && !s.when(ctx)) return '';
    const body = s.render(ctx);
    if (s.kind === 'gate') return html`<div class="sh-gate" id="${s.id}" data-scene="${s.id}" data-kind="gate" role="region" aria-label="Bìa thiệp">${body}</div>`;
    return html`<section class="sh-scene sh-${s.kind}" id="${s.id}" data-scene="${s.id}" data-kind="${s.kind}" tabindex="-1"${s.label ? html` aria-label="${s.label}"` : ''}>${body}</section>`;
  });

  const clientTopics = variants.map(v => ({
    id: v.id,
    vars: sanitizeVars(v.vars),
    fonts: sanitizeFontUrl(v.fonts),
    themeColor: sanitizeThemeColor(v.themeColor),
  }));

  // Dữ liệu trình duyệt cần (không gửi lại toàn bộ invite: chỉ phần dùng cho tương tác)
  const client = {
    theme: theme.id, version: theme.version, slug: d.slug || '', sheetUrl: d.sheetUrl || '',
    voice: theme.voice, voiceText: theme.voiceText || {}, events: ctx.events.map(e => e.title), date: d.date,
    accounts: ctx.accounts.map(a => ({ who: a.who, bank: a.bank, bankCode: a.bankCode, number: a.number, name: a.name, qr: a.qr })),
    topics: clientTopics,
    defaultTopic: activeVar?.id || '',
    // Nhóm khách (?n=): lọc buổi lễ và lời chào riêng phía trình duyệt, để trang vẫn cache chung được
    groups: (d.guestGroups || []).filter(g => g && g.id).map(g => ({ id: String(g.id).toLowerCase(), events: (g.events || []).filter(Number.isInteger), greeting: g.greeting || '', note: g.note || '' })),
  };
  const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.170.0/';
  const imports = {
    '@sayhello/engine': engineUrl + 'index.js',
    '@sayhello/engine/': engineUrl,
    'three': THREE_CDN + 'build/three.module.min.js',
    'three/addons/': THREE_CDN + 'examples/jsm/',
  };
  const hasGate = theme.scenes[0]?.kind === 'gate';
  const themeFont = sanitizeFontUrl(theme.fonts);
  const extraFont = sanitizeFontUrl(activeVar?.fonts);
  const themeColor = sanitizeThemeColor(d.themeColor) || sanitizeThemeColor(activeVar?.themeColor) || sanitizeThemeColor(theme.themeColor) || '#111111';
  const earlyTopicsMap = Object.fromEntries(clientTopics.map(t => [t.id, t]));
  const earlyScript = buildEarlyScript(earlyTopicsMap);

  return '<!doctype html>\n' + toStr(html`<html lang="${d.lang || 'vi'}" class="${hasGate ? 'sh-locked' : ''}" data-motion="pending" data-layout="${theme.layout}"${theme.moment?.id ? html` data-moment="${theme.moment.id}"` : ''}${palStyle ? html` style="${palStyle}"` : ''}${matchedTopic ? html` data-topic="${matchedTopic.id}"` : ''}${matchedPal ? html` data-palette="${matchedPal.id}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="${'Thiệp cưới ' + names.pair}">
<meta property="og:description" content="${desc}">
${url ? html`<meta property="og:url" content="${url}"><link rel="canonical" href="${url}">` : ''}
${ogImage ? html`<meta property="og:image" content="${ogImage}"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="${themeColor}">
${themeFont || extraFont ? html`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` : ''}
${themeFont ? html`<link rel="preload" as="style" href="${themeFont}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${themeFont}"></noscript>` : ''}
${extraFont && extraFont !== themeFont ? html`<link rel="preload" as="style" href="${extraFont}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${extraFont}"></noscript>` : ''}
<link rel="stylesheet" href="${engineUrl}base.css">
<link rel="stylesheet" href="${themeUrl}theme.css">
<script type="importmap">${jsonScript({ imports })}</script>
<link rel="modulepreload" href="${engineUrl}client/runtime.js">
<link rel="modulepreload" href="${themeUrl}theme.js">
<script>${raw(earlyScript)}</script>
<noscript><style>.sh-gate{display:none}html.sh-locked,html.sh-locked body{overflow:auto}</style></noscript>
</head>
<body class="sh theme-${theme.id}">
${scenes}
${quickInfo(ctx, { rsvpScene })}
<aside class="sh-group-note" data-sh="group-note" role="note" hidden><p></p><button type="button" class="sh-x" aria-label="${ctx.say('close')}">×</button></aside>
${music ? html`<button class="sh-music" type="button" data-sh="music" aria-pressed="false" aria-label="Bật nhạc nền"><i aria-hidden="true">♪</i></button><audio id="sh-audio" src="${music}" preload="none" loop></audio>` : ''}
<script type="application/json" id="sh-data">${jsonScript(client)}</script>
<script type="module">import { boot } from '@sayhello/engine/client/runtime.js'; import theme from ${jsonScript(themeUrl + 'theme.js')}; boot(theme);</script>
</body>
</html>`);
}

// Chạy trước khi vẽ: đặt mức chuyển động và topic/palette (?topic= / ?p=) sơ bộ để CSS không nhảy
function buildEarlyScript(topicsMap) {
  const serialized = Object.keys(topicsMap).length ? toStr(jsonScript(topicsMap)) : '{}';
  return `(function(d){var rm=function(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches||(navigator.connection&&navigator.connection.saveData)}catch(_){return false}};try{var q=new URLSearchParams(location.search);var tr=q.get('tier');var m=(tr==='cinematic'||tr==='standard'||tr==='lite')?tr:(rm()?'lite':'standard');d.dataset.motion=m;var T=${serialized};var tp=q.get('topic')||q.get('p');if(tp&&Object.prototype.hasOwnProperty.call(T,tp)){var c=T[tp],v=c.vars||{};for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k))d.style.setProperty(k,v[k]);d.dataset.topic=tp;d.dataset.palette=tp;if(c.themeColor){var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute('content',c.themeColor);}if(c.fonts&&!document.querySelector('link[href="'+c.fonts+'"]')){var lk=document.createElement('link');lk.rel='stylesheet';lk.href=c.fonts;document.head.appendChild(lk);}}}catch(e){d.dataset.motion=rm()?'lite':'standard'}})(document.documentElement)`;
}
