// Khởi động một thiệp: đọc invite.json cạnh trang, nạp mẫu thiệp (theme), dựng trang, gắn hiệu ứng.
import { $, html, toStr, merge, loadCss, guestName, guestGroup, fmt } from './util.js';
import { createFx } from './fx.js';
import { createBackend } from './backend.js';
import { createWidgets } from './widgets.js';
import { createChrome, createLightbox } from './chrome.js';
import { loadInvite, inStudio } from './content.js';
import { isExpired, showExpired } from './expired.js';
import { showWall } from './wall.js';
import { createVoice } from './voice.js';

const ROOT = new URL('../', import.meta.url);

async function boot() {
  const raw = await loadInvite();
  if (!inStudio && isExpired(raw)) return showExpired(raw, ROOT);
  // Tường lời chúc tại sảnh tiệc: <thiệp>/?wall=1
  if (!inStudio && new URLSearchParams(location.search).get('wall') === '1')
    return showWall(raw, raw.slug || location.pathname.split('/').filter(Boolean).pop() || 'thiep');
  const themeId = new URLSearchParams(location.search).get('theme') || raw.theme || 'song-hy';
  const themeUrl = new URL(`themes/${themeId}/`, ROOT);
  const theme = (await import(new URL('theme.js', themeUrl))).default;

  const data = merge(theme.defaults || {}, raw);
  // Nhóm khách (?n=...): chỉ giữ các buổi lễ của nhóm, địa điểm của nhóm lên đầu; không khớp thì bỏ qua
  const group = (data.guestGroups || []).find(g => g && String(g.id || '').toLowerCase() === guestGroup()) || null;
  if (group) {
    const evs = (group.events || []).map(i => data.events?.[i]).filter(Boolean);
    if (evs.length) data.events = evs;
    const pl = data.places?.[group.place];
    if (pl) data.places = [pl, ...data.places.filter(x => x !== pl)];
  }
  const slug = data.slug || location.pathname.split('/').filter(Boolean).pop() || 'thiep';
  const [first, second] = data.order === 'bride-first' ? [data.bride, data.groom] : [data.groom, data.bride];

  const listeners = {};
  const ctx = {
    data, slug, theme, themeUrl: themeUrl.href, root: ROOT.href,
    guest: guestName(), group,
    names: { groom: data.groom.short, bride: data.bride.short, first: first.short, second: second.short, pair: `${first.short} & ${second.short}` },
    album: data.images?.album || [],
    img(slot, i = 0) { return data.images?.[slot] || this.album[i] || ''; },
    has(section) {
      if (section === 'gift' && !(data.accounts || []).length) return false;
      if (section === 'map' && !(data.places || []).length) return false;
      return !data.sections || data.sections.includes(section);
    },
    wishes: [],
    on(ev, fn) { (listeners[ev] ||= []).push(fn); },
    emit(ev, x) { (listeners[ev] || []).forEach(fn => fn(x)); },
    html, fmt,
    say: createVoice(theme),
  };

  // Bảng màu cặp đôi chọn trong Studio (chỉ nhận id có trong mẫu đang dùng)
  const pal = (theme.palettes || []).find(p => p.id === data.palette);
  if (pal?.vars) Object.entries(pal.vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  document.title = data.title || `${ctx.names.pair} | ${fmt.short(data.date)}`;
  document.documentElement.lang = data.lang || 'vi';
  await Promise.all([theme.fonts && loadCss(theme.fonts), loadCss(new URL('core/base.css', ROOT).href), loadCss(new URL('theme.css', themeUrl).href)]);

  ctx.backend = createBackend(data.sheetUrl || '', slug);
  ctx.fx = createFx({ ambient: data.effects?.ambient, colors: data.effects?.colors, density: data.effects?.density ?? 1 });
  ctx.lightbox = createLightbox(ctx);
  ctx.widgets = createWidgets(ctx);
  const chrome = createChrome(ctx);
  ctx.cheers = chrome.cheers; ctx.flyHeart = chrome.flyHeart;

  const view = theme.render(ctx);
  const cover = document.createElement('div');
  cover.id = 'cover'; cover.className = 'cover';
  cover.innerHTML = toStr(view.cover);
  const main = document.createElement('main');
  main.id = 'card';
  main.innerHTML = toStr(view.main);
  document.body.prepend(cover, main);
  // Sau ngày cưới (nếu cặp đôi bật trong Studio): trang kỷ niệm, ẩn form xác nhận, mở link album ảnh đầy đủ
  const aw = data.afterWedding;
  if (aw?.enabled && Date.parse(data.date) + 24 * 3600e3 < Date.now()) {
    document.body.classList.add('is-memory');
    const memo = document.createElement('aside'); memo.className = 'memory-note';
    const t = document.createElement('p'); t.textContent = aw.thankNote || 'Cảm ơn mọi người đã đến chung vui. Kỷ niệm ngày chung đôi của chúng mình.';
    memo.append(t);
    if (aw.albumUrl) { const l = document.createElement('a'); l.href = aw.albumUrl; l.target = '_blank'; l.rel = 'noopener'; l.textContent = 'Xem trọn bộ ảnh ngày cưới'; memo.append(l); }
    main.prepend(memo);
  }
  if (group && (group.greeting || group.note)) {
    const note = document.createElement('aside'); note.className = 'group-note'; note.setAttribute('role', 'note');
    const txt = document.createElement('p'); txt.textContent = [group.greeting, group.note].filter(Boolean).join(' · ');
    const all = document.createElement('a'); all.textContent = 'Xem toàn bộ lịch lễ';
    const u = new URL(location.href); u.searchParams.delete('n'); u.searchParams.delete('nhom'); u.hash = ''; all.href = u.href;
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Đóng'); x.addEventListener('click', () => note.remove());
    note.append(txt, all, x); document.body.append(note);
  }
  document.body.classList.add('locked', 'theme-' + themeId);
  if (theme.layout) document.body.dataset.layout = theme.layout;
  if (theme.bodyClass) document.body.classList.add(...[].concat(theme.bodyClass));
  ctx.widgets.bind(cover); ctx.widgets.bind(main);
  // Mở khóa nhạc ở lần chạm đầu tiên (xem chrome.unlockMusic)
  ['pointerdown', 'touchend', 'click'].forEach(t => document.addEventListener(t, () => chrome.unlockMusic(), { capture: true, once: true }));
  theme.mounted?.(ctx, { cover, main });

  ctx.backend.wishes().then(list => { ctx.wishes.splice(0, ctx.wishes.length, ...list); ctx.emit('wishes', ctx.wishes); });

  // Mở thiệp: bấm nút [data-open] trên bìa, hoặc ?open=1 để bỏ qua bìa
  let opened = false;
  const open = instant => {
    if (opened) return; opened = true;
    document.body.classList.remove('locked');
    document.body.classList.add('opened');
    chrome.onOpen(); ctx.fx.start();
    if (instant) { cover.classList.add('gone'); theme.opened?.(ctx, true); return; }
    cover.classList.add('open');
    chrome.playMusic();
    theme.opened?.(ctx, false);
    setTimeout(() => cover.classList.add('gone'), theme.coverMs ?? 2000);
  };
  ctx.open = open;
  cover.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => open(false)));
  if (new URLSearchParams(location.search).get('open') === '1' || !cover.innerHTML.trim()) open(true);
  document.body.classList.add('ready');

  // Trong Studio: giữ vị trí cuộn khi khung xem trước tải lại sau mỗi lần sửa
  if (inStudio) {
    const KEY = 'sayhello:studio-scroll';
    try { const y = +sessionStorage.getItem(KEY); if (y && document.body.classList.contains('opened')) requestAnimationFrame(() => scrollTo(0, y)); } catch {}
    addEventListener('scroll', () => { try { sessionStorage.setItem(KEY, scrollY); } catch {} }, { passive: true });
  }
}

boot().catch(err => {
  console.error(err);
  document.body.classList.remove('locked');
  const p = document.createElement('p');
  p.style.cssText = 'font:16px system-ui;padding:40px 20px;text-align:center';
  p.textContent = 'Không tải được thiệp. Nếu bạn đang mở file trực tiếp, hãy chạy qua máy chủ web (xem README).';
  document.body.append(p);
});
