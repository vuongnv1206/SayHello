// Tường lời chúc tại sảnh tiệc: mở <thiệp>/?wall=1 trên laptop cắm màn hình LED.
// Ảnh cưới chạy nền, tên cô dâu chú rể, số tim, lời chúc mới tự hiện (hỏi Sheet mỗi 15 giây), mã QR cho khách quét gửi lời chúc.
// Lời chúc đã bị cặp đôi ẩn trên trang quản lý khách thì không hiện (máy chủ đã lọc); lời được ghim hiện trước.
import { createBackend } from './backend.js';
import { makeQr } from './qr.js';
import { fmt } from './util.js';

const POLL_MS = 15000, SHOW_MS = 8000, SLIDE_MS = 7000;

export async function showWall(data, slug) {
  const [a, b] = data.order === 'bride-first' ? [data.bride, data.groom] : [data.groom, data.bride];
  const backend = createBackend(data.sheetUrl || '', slug);
  const style = document.createElement('style');
  style.textContent = `
    html,body{margin:0;height:100%;background:#120c0a;color:#fff;overflow:hidden;font-family:'Be Vietnam Pro',system-ui,sans-serif}
    .wall{position:fixed;inset:0;display:grid;grid-template-rows:1fr auto;padding:3vmin;box-sizing:border-box}
    .wall .bg{position:absolute;inset:0;background:#120c0a center/cover no-repeat;opacity:0;transition:opacity 1.6s}
    .wall .bg.on{opacity:.55}
    .wall .shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.2) 45%,rgba(0,0,0,.75))}
    .wall .top{position:relative;text-align:center;align-self:center}
    .wall .kick{letter-spacing:.35em;font-size:2.2vmin;opacity:.8;margin:0 0 1.4vmin}
    .wall h1{font:italic 500 11vmin/1.1 Georgia,'Times New Roman',serif;margin:0;text-shadow:0 .5vmin 3vmin rgba(0,0,0,.6)}
    .wall .when{font-size:2.8vmin;margin:1.6vmin 0 0;opacity:.9}
    .wall .hearts{position:absolute;top:3vmin;right:3vmin;font-size:4vmin;background:rgba(0,0,0,.45);padding:1vmin 2.4vmin;border-radius:99px}
    .wall .hearts b{color:#ff8fa3}
    .wall .bottom{position:relative;display:flex;align-items:flex-end;justify-content:space-between;gap:3vmin;min-height:24vmin}
    .wall .wish{flex:1;max-width:70vw;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);border-left:.8vmin solid #ffd9a0;padding:2.4vmin 3vmin;border-radius:1.6vmin;opacity:0;transition:opacity .8s}
    .wall .wish.on{opacity:1}
    .wall .wish p{margin:0 0 1vmin;font-size:3.6vmin;line-height:1.35}
    .wall .wish small{font-size:2.6vmin;color:#ffd9a0}
    .wall .qr{background:#fff;color:#111;padding:1.6vmin;border-radius:1.6vmin;text-align:center;font-size:2vmin;line-height:1.3}
    .wall .qr canvas{display:block;width:18vmin;height:18vmin;image-rendering:pixelated}
  `;
  document.head.append(style);
  document.title = `${a.short} & ${b.short} · Tường lời chúc`;
  document.body.innerHTML = `<div class="wall">
    <div class="bg" data-bg="0"></div><div class="bg" data-bg="1"></div><div class="shade"></div>
    <div class="hearts" hidden>♥ <b></b></div>
    <div class="top"><p class="kick">TRÂN TRỌNG CẢM ƠN QUÝ KHÁCH</p><h1></h1><p class="when"></p></div>
    <div class="bottom"><div class="wish"><p></p><small></small></div><div class="qr"><canvas width="200" height="200"></canvas>Quét mã để gửi lời chúc</div></div>
  </div>`;
  const $ = s => document.querySelector(s);
  $('h1').textContent = `${a.short} & ${b.short}`;
  $('.when').textContent = fmt.long(data.date);

  // Mã QR trỏ về thiệp (bỏ qua bìa) để khách gửi lời chúc
  const url = (data.publicUrl ? data.publicUrl.replace(/\/$/, '') + '/' : location.origin + location.pathname) + '?open=1';
  const qr = makeQr(url, 'M'), cv = $('.qr canvas'), cell = Math.floor(200 / (qr.size + 2)), off = Math.floor((200 - cell * qr.size) / 2), c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, 200, 200); c.fillStyle = '#000';
  for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.get(x, y)) c.fillRect(off + x * cell, off + y * cell, cell, cell);

  // Ảnh nền chạy luân phiên (hai lớp để chuyển mờ)
  const photos = [data.images?.hero, ...(data.images?.album || [])].filter(Boolean);
  let slide = 0;
  const nextSlide = () => {
    if (!photos.length) return;
    const bgs = [...document.querySelectorAll('.bg')], on = bgs.find(x => x.classList.contains('on')), off2 = bgs.find(x => x !== on);
    off2.style.backgroundImage = `url("${photos[slide++ % photos.length]}")`;
    off2.classList.add('on'); on?.classList.remove('on');
  };
  nextSlide(); setInterval(nextSlide, SLIDE_MS);

  // Lời chúc: hiện lần lượt; lời mới tới thì chen lên trước
  let wishes = [], idx = 0, seen = new Set(), queue = [];
  const key = w => w.name + '\u0000' + w.message;
  const card = $('.wish');
  const show = w => {
    card.classList.remove('on');
    setTimeout(() => { card.querySelector('p').textContent = w ? '“' + w.message + '”' : 'Hãy gửi lời chúc tới cô dâu chú rể bằng cách quét mã QR.'; card.querySelector('small').textContent = w ? '— ' + w.name : ''; card.classList.add('on'); }, 500);
  };
  const tick = () => show(queue.shift() || wishes[idx++ % Math.max(1, wishes.length)] || null);
  const refresh = async () => {
    if (document.hidden) return;
    const [list, hearts] = await Promise.all([backend.wishes().catch(() => null), backend.hearts().catch(() => null)]);
    if (Array.isArray(list)) {
      if (seen.size) list.filter(w => !seen.has(key(w))).reverse().forEach(w => queue.push(w)); // lời mới
      wishes = list; seen = new Set(list.map(key));
    }
    if (typeof hearts === 'number') { $('.hearts').hidden = false; $('.hearts b').textContent = hearts.toLocaleString('vi-VN'); }
  };
  await refresh(); tick();
  setInterval(refresh, POLL_MS); setInterval(tick, SHOW_MS);
}
