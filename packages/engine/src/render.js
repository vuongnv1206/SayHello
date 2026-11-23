// Dựng nguyên một trang thiệp thành chuỗi HTML (chạy trên máy chủ, hoặc lúc build cho thiệp mẫu).
// Trình duyệt nhận HTML đầy đủ ngay (bìa hiện không cần chờ JS), rồi client/runtime.js gắn hành vi.
import { html, raw, toStr, jsonScript } from './html.js';
import { fmt } from './date.js';
import { buildContext } from './model.js';
import { quickInfo } from './blocks.js';

/**
 * @param theme   mẫu đã qua defineTheme
 * @param invite  dữ liệu thiệp
 * @param opts.engineUrl  nơi phục vụ thư mục src/ của engine cho trình duyệt (vd. /_e/engine/)
 * @param opts.themeUrl   nơi phục vụ thư mục của mẫu (vd. /_e/themes/cuon-phim/)
 * @param opts.assetBase  gốc của ảnh tương đối trong dữ liệu thiệp
 * @param opts.url, opts.ogImage  cho thẻ xem trước khi gửi link
 */
export function renderDocument(theme, invite, opts = {}) {
  const { engineUrl = '/_e/engine/', themeUrl = `/_e/themes/${theme.id}/`, assetBase = '', url = '', ogImage = '' } = opts;
  const ctx = buildContext(theme, invite, { assetBase });
  const { names, data: d } = ctx;
  const title = d.title || `${names.pair} | ${fmt.short(d.date)}`;
  const desc = d.description || `Trân trọng mời bạn tới dự lễ cưới của ${names.pair}, ${fmt.long(d.date)}${d.city ? ' tại ' + d.city : ''}.`;
  const rsvpScene = theme.scenes.find(s => s.provides.includes('rsvp'))?.id;
  // Bảng màu cặp đôi chọn: chỉ nhận id có trong mẫu, chỉ nhận biến CSS (--ten) và giá trị màu đơn giản
  const pal = (theme.palettes || []).find(p => p.id === d.palette);
  const palStyle = Object.entries(pal?.vars || {}).filter(([k, v]) => /^--[\w-]+$/.test(k) && /^[#\w(),.% -]+$/.test(v)).map(([k, v]) => `${k}:${v}`).join(';');
  const music = d.music ? (/^(https?:|\/)/.test(d.music) ? d.music : assetBase.replace(/\/?$/, '/') + d.music.replace(/^\.\//, '')) : '';

  const scenes = theme.scenes.map(s => {
    if (s.when && !s.when(ctx)) return '';
    const body = s.render(ctx);
    if (s.kind === 'gate') return html`<div class="sh-gate" id="${s.id}" data-scene="${s.id}" data-kind="gate" role="region" aria-label="Bìa thiệp">${body}</div>`;
    return html`<section class="sh-scene sh-${s.kind}" id="${s.id}" data-scene="${s.id}" data-kind="${s.kind}"${s.label ? html` aria-label="${s.label}"` : ''}>${body}</section>`;
  });

  // Dữ liệu trình duyệt cần (không gửi lại toàn bộ invite: chỉ phần dùng cho tương tác)
  const client = {
    theme: theme.id, version: theme.version, slug: d.slug || '', sheetUrl: d.sheetUrl || '',
    voice: theme.voice, voiceText: theme.voiceText || {}, events: ctx.events.map(e => e.title), date: d.date,
    accounts: ctx.accounts.map(a => ({ who: a.who, bank: a.bank, bankCode: a.bankCode, number: a.number, name: a.name, qr: a.qr })),
    // Nhóm khách (?n=): lọc buổi lễ và lời chào riêng phía trình duyệt, để trang vẫn cache chung được
    groups: (d.guestGroups || []).filter(g => g && g.id).map(g => ({ id: String(g.id).toLowerCase(), events: (g.events || []).filter(Number.isInteger), greeting: g.greeting || '', note: g.note || '' })),
  };
  const imports = { '@sayhello/engine': engineUrl + 'index.js', '@sayhello/engine/': engineUrl };
  const hasGate = theme.scenes[0]?.kind === 'gate';

  return '<!doctype html>\n' + toStr(html`<html lang="${d.lang || 'vi'}" class="${hasGate ? 'sh-locked' : ''}" data-motion="pending" data-layout="${theme.layout}"${palStyle ? html` style="${palStyle}"` : ''}${pal ? html` data-palette="${pal.id}"` : ''}>
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
<meta name="theme-color" content="${d.themeColor || theme.themeColor || '#111111'}">
${theme.fonts ? html`<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="${theme.fonts}" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${theme.fonts}"></noscript>` : ''}
<link rel="stylesheet" href="${engineUrl}base.css">
<link rel="stylesheet" href="${themeUrl}theme.css">
<script type="importmap">${jsonScript({ imports })}</script>
<link rel="modulepreload" href="${engineUrl}client/runtime.js">
<link rel="modulepreload" href="${themeUrl}theme.js">
<script>${raw(EARLY)}</script>
<noscript><style>.sh-gate{display:none}html.sh-locked,html.sh-locked body{overflow:auto}</style></noscript>
</head>
<body class="sh theme-${theme.id}">
${scenes}
${quickInfo(ctx, { rsvpScene })}
<aside class="sh-group-note" data-sh="group-note" role="note" hidden><p></p><button type="button" class="sh-x" aria-label="${ctx.say('close')}">×</button></aside>
${music ? html`<button class="sh-music" type="button" data-sh="music" aria-pressed="false" aria-label="Bật nhạc nền"><i aria-hidden="true">♪</i></button><audio id="sh-audio" src="${music}" preload="none" loop></audio>` : ''}
<script type="application/json" id="sh-data">${jsonScript(client)}</script>
<script type="module">import { boot } from '@sayhello/engine/client/runtime.js'; import theme from '${themeUrl}theme.js'; boot(theme);</script>
</body>
</html>`);
}

// Chạy trước khi vẽ: đặt mức chuyển động sơ bộ để CSS không nhảy (runtime đo lại sức máy sau)
const EARLY = `(function(d){try{var q=new URLSearchParams(location.search).get('tier');var m=q||(matchMedia('(prefers-reduced-motion: reduce)').matches||(navigator.connection&&navigator.connection.saveData)?'lite':'standard');d.dataset.motion=m;}catch(e){d.dataset.motion='standard'}})(document.documentElement)`;
