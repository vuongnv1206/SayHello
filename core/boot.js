// Khởi động một thiệp: đọc invite.json cạnh trang, nạp mẫu thiệp (theme), dựng trang, gắn hiệu ứng.
import { $, html, toStr, merge, loadCss, guestName, fmt } from './util.js';
import { createFx } from './fx.js';
import { createBackend } from './backend.js';
import { createWidgets } from './widgets.js';
import { createChrome, createLightbox } from './chrome.js';
import { loadInvite, inStudio } from './content.js';

const ROOT = new URL('../', import.meta.url);

async function boot() {
  const raw = await loadInvite();
  const themeId = new URLSearchParams(location.search).get('theme') || raw.theme || 'song-hy';
  const themeUrl = new URL(`themes/${themeId}/`, ROOT);
  const theme = (await import(new URL('theme.js', themeUrl))).default;

  const data = merge(theme.defaults || {}, raw);
  const slug = data.slug || location.pathname.split('/').filter(Boolean).pop() || 'thiep';
  const [first, second] = data.order === 'bride-first' ? [data.bride, data.groom] : [data.groom, data.bride];

  const listeners = {};
  const ctx = {
    data, slug, theme, themeUrl: themeUrl.href,
    guest: guestName(),
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
  };

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
  document.body.classList.add('locked', 'theme-' + themeId);
  ctx.widgets.bind(cover); ctx.widgets.bind(main);
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
