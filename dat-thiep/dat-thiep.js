// Trang đặt thiệp: chọn mẫu + gói + thông tin -> tạo mã đơn, ghi vào Google Sheets (nếu có),
// hiện mã QR chuyển khoản (VietQR) với số tiền và nội dung là mã đơn để người bán đối chiếu.
// Giá, tài khoản nhận tiền, số Zalo: sửa trong /shop.json
const $ = s => document.querySelector(s);
const form = $('#order');
const q = new URLSearchParams(location.search);
const SAVED = 'sayhello:order';
const vnd = n => n.toLocaleString('vi-VN') + 'đ';

// Bỏ dấu tiếng Việt, dùng cho đường dẫn và nội dung chuyển khoản
const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
const toSlug = s => plain(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

// Mã đơn: SH + 6 ký tự dễ đọc (bỏ 0/O, 1/I)
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => 'SH' + Array.from(crypto.getRandomValues(new Uint8Array(6)), b => ABC[b % ABC.length]).join('');

let shop, themes, slugEdited = false;

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v);
  e.append(...kids.flat().filter(k => k != null));
  return e;
}

function renderChoices() {
  const want = q.get('mau'), wantPack = q.get('goi');
  $('#themes').append(...themes.map((t, i) => el('label', { class: 'opt' },
    el('input', { type: 'radio', name: 'theme', value: t.id, checked: want ? want === t.id : i === 0 }),
    el('span', { class: 'box' }, el('h3', {}, t.name), el('small', {}, t.mood), el('small', {}, t.tagline),
      el('a', { class: 'demo', href: `../${t.demo}/`, target: '_blank', rel: 'noopener' }, 'Xem thiệp mẫu →')))));
  const def = shop.packages.find(p => p.featured) || shop.packages[0];
  $('#packs').append(...shop.packages.map(p => el('label', { class: 'opt' },
    el('input', { type: 'radio', name: 'pack', value: p.id, checked: wantPack ? wantPack === p.id : p === def }),
    el('span', { class: 'box' },
      p.featured ? el('span', { class: 'badge' }, 'Được chọn nhiều') : null,
      el('h3', {}, p.name),
      el('p', { class: 'price' }, p.priceFrom ? el('span', {}, 'từ ') : null, vnd(p.price)),
      el('small', {}, p.tagline),
      el('ul', {}, p.features.map(f => el('li', {}, f)))))));
}

const chosen = () => {
  const fd = new FormData(form);
  return { theme: themes.find(t => t.id === fd.get('theme')), pack: shop.packages.find(p => p.id === fd.get('pack')), fd };
};

function updateSummary() {
  const { theme, pack } = chosen();
  $('#sum-theme').textContent = theme?.name || '…';
  $('#sum-pack').textContent = pack?.name || '…';
  $('#sum-price').textContent = pack ? (pack.priceFrom ? 'từ ' : '') + vnd(pack.price) : '…';
}

function suggestSlug() {
  if (slugEdited) return;
  const g = form.groom.value.trim(), b = form.bride.value.trim();
  form.slug.value = toSlug([g, b].filter(Boolean).join(' '));
}

function validate(o) {
  if (!o.theme) return 'Hãy chọn một mẫu thiệp.';
  if (!o.pack) return 'Hãy chọn một gói.';
  if (!o.groom || !o.bride) return 'Hãy điền tên chú rể và cô dâu.';
  if (!o.date) return 'Hãy chọn ngày cưới.';
  if (plain(o.phone).replace(/[^0-9]/g, '').length < 9) return 'Số điện thoại chưa đúng.';
  if (o.slug && !/^[a-z0-9][a-z0-9-]{1,59}$/.test(o.slug)) return 'Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch.';
  return '';
}

function qrUrl(o) {
  const b = shop.bank;
  const p = new URLSearchParams({ amount: o.price, addInfo: o.code, accountName: b.name });
  return `https://img.vietqr.io/image/${encodeURIComponent(b.bankCode)}-${encodeURIComponent(b.number)}-compact2.png?${p}`;
}

function showPayment(o, status) {
  form.hidden = true;
  const pay = $('#pay');
  pay.hidden = false;
  $('#pay-code').textContent = o.code;
  $('#pay-code2').textContent = o.code;
  const rows = [['Mẫu', o.themeName], ['Gói', o.packName], ['Số tiền', vnd(o.price) + (o.priceFrom ? ' (giá khởi điểm, phần còn lại báo sau khi trao đổi)' : '')],
    ['Ngân hàng', shop.bank.bank], ['Số tài khoản', shop.bank.number], ['Chủ tài khoản', shop.bank.name], ['Nội dung', o.code]];
  $('#pay-info').replaceChildren(...rows.flatMap(([k, v]) => [el('dt', {}, k), el('dd', {}, v)]));
  $('#qr').src = qrUrl(o);
  $('#qr-cap').textContent = `${vnd(o.price)} · ${o.code}`;
  const msg = `Chào SayHello, mình đặt thiệp mã ${o.code}: mẫu ${o.themeName}, gói ${o.packName}. ${o.groom} & ${o.bride}, cưới ngày ${o.date.split('-').reverse().join('/')}.`;
  $('#zalo').href = `https://zalo.me/${String(shop.zalo).replace(/[^0-9]/g, '')}`;
  $('#zalo').dataset.msg = msg;
  const st = $('#status');
  st.className = 'status ' + (status === 'ok' ? 'ok' : status === 'err' ? 'err' : '');
  st.textContent = status === 'ok' ? 'Đã ghi nhận đơn. Chúng mình sẽ liên hệ sớm.'
    : status === 'err' ? 'Chưa gửi được đơn lên hệ thống. Bạn vẫn chuyển khoản được, nhớ nhắn Zalo kèm mã đơn nhé.'
    : 'Nhắn Zalo kèm mã đơn sau khi chuyển khoản để chúng mình xác nhận.';
  pay.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function send(o) {
  if (!shop.orderSheetUrl) return 'local';
  try {
    const r = await fetch(shop.orderSheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ type: 'order', ...o }) });
    const d = await r.json();
    return d.ok ? 'ok' : 'err';
  } catch { return 'err'; }
}

form.addEventListener('input', e => {
  if (e.target.name === 'slug') { slugEdited = !!e.target.value; e.target.value = toSlug(e.target.value) + (e.target.value.endsWith('-') ? '-' : ''); }
  if (e.target.name === 'groom' || e.target.name === 'bride') suggestSlug();
  updateSummary();
  $('#err').textContent = '';
});
form.addEventListener('change', updateSummary);

form.addEventListener('submit', async e => {
  e.preventDefault();
  const { theme, pack, fd } = chosen();
  const o = {
    code: newCode(), theme: theme?.id, themeName: theme?.name, pack: pack?.id, packName: pack?.name, price: pack?.price, priceFrom: !!pack?.priceFrom,
    groom: fd.get('groom').trim(), bride: fd.get('bride').trim(), date: fd.get('date'), phone: fd.get('phone').trim(),
    slug: toSlug(fd.get('slug')), note: fd.get('note').trim(),
  };
  const err = validate({ ...o, theme, pack });
  if (err) { $('#err').textContent = err; return; }
  const btn = $('#submit');
  btn.disabled = true; btn.textContent = 'Đang gửi…';
  const status = await send(o);
  btn.disabled = false; btn.textContent = 'Đặt thiệp và lấy mã QR';
  try { localStorage.setItem(SAVED, JSON.stringify({ o, status })); } catch {}
  showPayment(o, status);
});

$('#copy-code').addEventListener('click', async e => {
  const b = e.currentTarget, t = b.textContent;
  try { await navigator.clipboard.writeText($('#pay-code').textContent); b.textContent = 'Đã sao chép ✓'; } catch { b.textContent = $('#pay-code').textContent; }
  setTimeout(() => (b.textContent = t), 2000);
});
// Zalo không nhận nội dung soạn sẵn qua link: sao chép lời nhắn để khách dán vào
$('#zalo').addEventListener('click', e => { navigator.clipboard?.writeText(e.currentTarget.dataset.msg).catch(() => {}); });
$('#new-order').addEventListener('click', () => {
  try { localStorage.removeItem(SAVED); } catch {}
  form.reset(); slugEdited = false; form.hidden = false; $('#pay').hidden = true; updateSummary();
  scrollTo({ top: 0, behavior: 'smooth' });
});

(async () => {
  [shop, themes] = await Promise.all([fetch('../shop.json', { cache: 'no-cache' }).then(r => r.json()), fetch('../themes/index.json').then(r => r.json())]);
  $('#draft-note').hidden = !shop.giaTam;
  $('#host').textContent = location.host + '/';
  renderChoices();
  updateSummary();
  // Quay lại trang sau khi đã đặt: hiện lại mã QR của đơn vừa đặt
  try { const s = JSON.parse(localStorage.getItem(SAVED) || 'null'); if (s?.o?.code && !q.has('moi')) showPayment(s.o, s.status); } catch {}
})();
