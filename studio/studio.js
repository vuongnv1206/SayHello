// Studio: cặp đôi tự sửa nội dung thiệp, xem trước ngay, bấm Lưu là thiệp thật cập nhật luôn.
// Link: /studio/?thiep=<slug>&ma=<mã sửa>  (tạo bằng: npm run studio-link -- <slug>)
import { pickEditable, cleanImages } from '../core/content.js';
import { merge } from '../core/util.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const q = new URLSearchParams(location.search);
const slug = (q.get('thiep') || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
const key = q.get('ma') || '';
const DRAFT = `sayhello:draft:${slug}`;

let base = null, baseImages = {}, themes = [], themeMods = {}, state = {}, saved = '', reloadT = null;

/* ---------- Nhãn tiếng Việt ---------- */
const SECTION_NAMES = {
  invite: 'Lời mời & hai gia đình', couple: 'Cô dâu & chú rể', band: 'Dải ảnh lớn', events: 'Lịch lễ', countdown: 'Đếm ngược & lịch',
  album: 'Album ảnh', map: 'Bản đồ', rsvp: 'Xác nhận tham dự', guestbook: 'Sổ lưu bút', gift: 'Hộp quà mừng cưới', thanks: 'Lời cảm ơn',
  letter: 'Lá thư mời', date: 'Cào xem ngày & đếm ngược', families: 'Hai gia đình',
  hero: 'Mở đầu', story: 'Hành trình tình yêu', board: 'Bảng giờ bay (lịch lễ & đếm ngược)', passport: 'Hộ chiếu cô dâu chú rể & gia đình',
};
const TEXT_NAMES = {
  kicker: 'Dòng chữ nhỏ trên tên', invite: 'Câu báo tin', presence: 'Câu mời', quote: 'Câu trích dẫn', thanks: 'Lời cảm ơn cuối thiệp',
  greeting: 'Lời chào đầu thư', letter: 'Nội dung lá thư', dateTitle: 'Tiêu đề phần ngày cưới', scratch: 'Chữ trên lớp nhũ cào',
  coupleTitle: 'Tiêu đề phần cô dâu chú rể', eventsTitle: 'Tiêu đề phần lịch lễ', albumTitle: 'Tiêu đề album', albumHint: 'Hướng dẫn dưới album',
  rsvpTitle: 'Tiêu đề phần xác nhận', rsvpLead: 'Câu hỏi xác nhận', guestbookTitle: 'Tiêu đề sổ lưu bút', giftTitle: 'Tiêu đề hộp quà', closing: 'Lời kết',
  airline: 'Tên hãng bay', heroKicker: 'Dòng chữ nhỏ trên tiêu đề', heroTitle: 'Tiêu đề lớn', heroLead: 'Câu mở đầu', storyTitle: 'Tiêu đề hành trình',
  boardTitle: 'Tiêu đề bảng giờ bay', passportTitle: 'Tiêu đề phần hộ chiếu',
  lockTitle: 'Chữ trên ổ khóa (bìa)', lockHint: 'Gợi ý mã khóa', countdownTitle: 'Tiêu đề đếm ngược', coverTitle: 'Tiêu đề bìa', coverHint: 'Hướng dẫn trên bìa', thanksTitle: 'Tiêu đề lời cảm ơn',
};
const AMBIENT = [['petals', 'Cánh hoa'], ['sparkles', 'Kim tuyến'], ['hearts', 'Trái tim bay lên'], ['snow', 'Tuyết'], ['leaves', 'Lá vàng'], ['bokeh', 'Đốm sáng mờ']];
const BANKS = ['VCB', 'TCB', 'MB', 'ACB', 'BIDV', 'ICB', 'VPB', 'TPB', 'STB', 'VIB', 'HDB', 'SHB', 'MSB', 'OCB', 'AGRIBANK', 'SCB', 'EIB', 'LPB', 'NAB', 'SEAB'];

/* ---------- Đọc / ghi theo đường dẫn "groom.short" ---------- */
const get = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
function set(o, p, v) {
  const ks = p.split('.'), last = ks.pop();
  const t = ks.reduce((x, k) => (x[k] ??= {}), o);
  if (v === '' || v === undefined) delete t[last]; else t[last] = v;
}
// ISO có múi giờ <-> giá trị ô datetime-local (giữ nguyên giờ Việt Nam)
const isoToLocal = s => (s || '').slice(0, 16);
const localToIso = s => (s ? s + ':00+07:00' : '');

/* ---------- Dựng biểu mẫu ---------- */
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  e.append(...kids.flat().filter(x => x != null));
  return e;
};

function input(obj, path, { label, type = 'text', placeholder = '', hint, options, rows = 3 } = {}) {
  const v = get(obj, path);
  let ctl;
  if (type === 'textarea') ctl = el('textarea', { rows, placeholder }, v ?? '');
  else if (type === 'select') ctl = el('select', {}, options.map(([val, txt]) => el('option', { value: val, selected: v === val }, txt)));
  else if (type === 'datetime') ctl = el('input', { type: 'datetime-local', value: isoToLocal(v) });
  else ctl = el('input', { type, placeholder, value: v ?? '' });
  ctl.addEventListener('input', () => { set(obj, path, type === 'datetime' ? localToIso(ctl.value) : ctl.value); changed(); });
  return el('label', { class: 'field' }, el('span', {}, label), ctl, hint ? el('small', { class: 'hint' }, hint) : null);
}

function checkbox(obj, path, label, def = true) {
  const v = get(obj, path);
  const box = el('input', { type: 'checkbox', checked: v === undefined ? def : !!v });
  box.addEventListener('change', () => { set(obj, path, box.checked === def ? undefined : box.checked); changed(); });
  return el('label', { class: 'check' }, box, label);
}

// Danh sách (gia đình, sự kiện, địa điểm, tài khoản): thêm, xóa, đổi thứ tự
function list(arrPath, itemName, makeFields, blank) {
  const wrap = el('div', { class: 'group-body' });
  const render = () => {
    wrap.textContent = '';
    const arr = get(state, arrPath) || [];
    arr.forEach((item, i) => {
      const move = d => () => { const a = get(state, arrPath); [a[i], a[i + d]] = [a[i + d], a[i]]; render(); changed(); };
      wrap.append(el('div', { class: 'item' },
        el('div', { class: 'item-head' }, el('b', {}, `${itemName} ${i + 1}`),
          i > 0 ? el('button', { type: 'button', title: 'Lên trên', onclick: move(-1) }, '↑') : null,
          i < arr.length - 1 ? el('button', { type: 'button', title: 'Xuống dưới', onclick: move(1) }, '↓') : null,
          el('button', { type: 'button', title: 'Xóa', onclick: () => { if (confirmDelete(itemName)) { arr.splice(i, 1); render(); changed(); } } }, '✕')),
        makeFields(item)));
    });
    wrap.append(el('button', { type: 'button', class: 'add', onclick: () => { set(state, arrPath, [...(get(state, arrPath) || []), structuredClone(blank)]); render(); changed(); } }, `+ Thêm ${itemName.toLowerCase()}`));
  };
  render();
  return wrap;
}
const confirmDelete = name => window.confirm(`Xóa ${name.toLowerCase()} này?`);

function group(title, sub, body, open = false) {
  return el('details', { class: 'group', open }, el('summary', {}, title, sub ? el('small', {}, sub) : null), body);
}

async function buildForm() {
  const form = $('#form'), theme = await themeMod(state.theme);
  const def = theme.defaults || {};
  form.textContent = '';

  // Mẫu thiệp
  form.append(group('Mẫu thiệp', themes.find(t => t.id === state.theme)?.name, el('div', { class: 'group-body' },
    el('div', { class: 'themes' }, themes.map(t => el('button', {
      type: 'button', class: 'theme-card' + (t.id === state.theme ? ' on' : ''),
      onclick: () => { if (t.id === state.theme) return; state.theme = t.id; delete state.sections; buildForm(); changed(); },
    }, el('b', {}, t.name), el('small', {}, t.tagline)))),
    el('small', { class: 'hint' }, 'Đổi mẫu không làm mất nội dung đã nhập.')), true));

  // Cô dâu chú rể
  form.append(group('Cô dâu & chú rể', null, el('div', { class: 'group-body' },
    el('div', { class: 'row2' }, input(state, 'groom.short', { label: 'Tên chú rể (hiện to)' }), input(state, 'bride.short', { label: 'Tên cô dâu (hiện to)' })),
    el('div', { class: 'row2' }, input(state, 'groom.full', { label: 'Họ tên đầy đủ chú rể' }), input(state, 'bride.full', { label: 'Họ tên đầy đủ cô dâu' })),
    input(state, 'order', { label: 'Tên ai đứng trước', type: 'select', options: [['groom-first', 'Chú rể trước (thiệp nhà trai)'], ['bride-first', 'Cô dâu trước (thiệp nhà gái)']] }),
    input(state, 'groom.bio', { label: 'Đôi dòng về chú rể', type: 'textarea', rows: 2, hint: 'Hiện ở các mẫu Thư Tay, Vé Máy Bay, Khóa Tình, Đèn Lồng, Cuộn Phim, Tin Nhắn. Để trống nếu không cần.' }),
    input(state, 'bride.bio', { label: 'Đôi dòng về cô dâu', type: 'textarea', rows: 2 })), true));

  // Ảnh cưới
  form.append(group('Ảnh cưới', 'đổi ảnh, thêm ảnh album', imagesBody()));

  // Ngày cưới
  form.append(group('Ngày giờ lễ chính', null, el('div', { class: 'group-body' },
    input(state, 'date', { label: 'Ngày giờ (giờ Việt Nam)', type: 'datetime', hint: 'Dùng cho đếm ngược, lịch và nút lưu vào Google Calendar.' }),
    input(state, 'city', { label: 'Thành phố', placeholder: 'vd. Hà Nội' }))));

  // Gia đình
  form.append(group('Hai gia đình', null, list('families', 'Gia đình', f => [
    input(f, 'side', { label: 'Nhà', placeholder: 'Nhà trai / Nhà gái' }),
    el('div', { class: 'row2' }, input(f, 'father', { label: 'Tên bố (không cần chữ "Ông")' }), input(f, 'mother', { label: 'Tên mẹ (không cần chữ "Bà")' })),
    input(f, 'address', { label: 'Địa chỉ', type: 'textarea', rows: 2 }),
  ], { side: '', father: '', mother: '', address: '' })));

  // Sự kiện
  form.append(group('Lịch lễ', 'ăn hỏi, vu quy, thành hôn, tiệc', list('events', 'Sự kiện', e => [
    input(e, 'title', { label: 'Tên lễ', placeholder: 'vd. Lễ Thành Hôn' }),
    input(e, 'date', { label: 'Ngày giờ', type: 'datetime' }),
    input(e, 'lunar', { label: 'Ngày âm lịch', placeholder: 'vd. Tức ngày 3 tháng 12 năm Bính Ngọ' }),
    input(e, 'venue', { label: 'Nơi tổ chức', placeholder: 'vd. Tại tư gia nhà trai' }),
    input(e, 'address', { label: 'Địa chỉ', type: 'textarea', rows: 2 }),
    checkbox(e, 'main', 'Đây là lễ chính (làm nổi bật)', false),
  ], { title: '', date: state.date || '', venue: '', address: '' })));

  // Hành trình
  if ((def.sections || []).includes('story')) form.append(group('Hành trình tình yêu', 'các cột mốc của hai bạn', list('story', 'Cột mốc', s => [
    el('div', { class: 'row2' }, input(s, 'year', { label: 'Năm', placeholder: 'vd. 2021' }), input(s, 'title', { label: 'Tiêu đề', placeholder: 'vd. Lần đầu gặp' })),
    input(s, 'text', { label: 'Đôi dòng', type: 'textarea', rows: 2 }),
  ], { year: '', title: '', text: '' })));

  // Địa điểm
  form.append(group('Bản đồ chỉ đường', null, list('places', 'Địa điểm', p => [
    input(p, 'label', { label: 'Tên nút', placeholder: 'vd. Nhà trai · Lễ Thành Hôn' }),
    input(p, 'address', { label: 'Địa chỉ', type: 'textarea', rows: 2 }),
    input(p, 'mapLink', { label: 'Link Google Maps', placeholder: 'https://maps.app.goo.gl/...', hint: 'Mở Google Maps, chọn địa điểm, bấm Chia sẻ rồi dán link vào đây.' }),
    input(p, 'coords', { label: 'Tọa độ ghim (không bắt buộc)', placeholder: 'vd. 21.0368,105.8342' }),
  ], { label: '', address: '' })));

  // Câu chữ của mẫu
  const texts = def.texts || {};
  state.texts ??= {};
  form.append(group('Lời lẽ trên thiệp', 'để trống thì dùng câu mặc định', el('div', { class: 'group-body' },
    Object.keys(texts).map(k => input(state.texts, k, { label: TEXT_NAMES[k] || k, type: texts[k].length > 60 ? 'textarea' : 'text', placeholder: texts[k], rows: Math.min(6, Math.ceil(texts[k].length / 45)) })))));

  // Các mục
  const all = def.sections || [];
  const on = new Set(state.sections || all);
  form.append(group('Các phần hiện trên thiệp', null, el('div', { class: 'group-body' },
    all.map(s => {
      const box = el('input', { type: 'checkbox', checked: on.has(s) });
      box.addEventListener('change', () => { box.checked ? on.add(s) : on.delete(s); state.sections = all.filter(x => on.has(x)); changed(); });
      return el('label', { class: 'check' }, box, SECTION_NAMES[s] || s);
    }))));

  // Nhạc nền
  const MUSIC = [['', 'Nhạc người bán chọn sẵn'], ['../assets/music/hop-nhac.mp3', 'Hộp nhạc (trong trẻo, trẻ trung)'],
    ['../assets/music/dao-buoc.mp3', 'Dạo bước (piano valse, lãng mạn)'], ['../assets/music/binh-minh.mp3', 'Bình minh (ấm áp, trang trọng)'], ['none', 'Không có nhạc']];
  form.append(group('Nhạc nền', null, el('div', { class: 'group-body' },
    input(state, 'music', { label: 'Bài nhạc', type: 'select', options: MUSIC, hint: 'Muốn dùng bài riêng của hai bạn: gửi file mp3 cho người bán.' }))));

  // Hiệu ứng
  state.effects ??= {};
  const amb = new Set(state.effects.ambient || def.effects?.ambient || []);
  form.append(group('Hiệu ứng', null, el('div', { class: 'group-body' },
    el('div', { class: 'field' }, el('span', {}, 'Hạt bay trên màn hình'),
      el('div', { class: 'chips' }, AMBIENT.map(([id, name]) => {
        const box = el('input', { type: 'checkbox', checked: amb.has(id) });
        box.addEventListener('change', () => { box.checked ? amb.add(id) : amb.delete(id); state.effects.ambient = AMBIENT.map(a => a[0]).filter(a => amb.has(a)); changed(); });
        return el('label', {}, box, el('span', {}, name));
      }))),
    checkbox(state, 'effects.loveButton', 'Nút thả tim có bộ đếm'),
    checkbox(state, 'effects.flyingWishes', 'Lời chúc bay ngang màn hình'),
    checkbox(state, 'effects.tapHearts', 'Chạm vào thiệp thì tim bay lên'),
    checkbox(state, 'effects.progress', 'Thanh tiến độ khi cuộn'))));

  // Tài khoản mừng cưới
  form.append(group('Mừng cưới qua chuyển khoản', 'để trống thì ẩn hộp quà', list('accounts', 'Tài khoản', a => [
    input(a, 'who', { label: 'Của ai', placeholder: 'Chú rể / Cô dâu / Bố mẹ' }),
    el('div', { class: 'row2' },
      input(a, 'bank', { label: 'Tên ngân hàng', placeholder: 'vd. Vietcombank' }),
      input(a, 'bankCode', { label: 'Mã ngân hàng (để tạo QR)', type: 'select', options: [['', 'Chọn…'], ...BANKS.map(b => [b, b])] })),
    input(a, 'number', { label: 'Số tài khoản', type: 'text' }),
    input(a, 'name', { label: 'Tên chủ tài khoản (in hoa không dấu)', placeholder: 'NGUYEN VAN A' }),
  ], { who: '', bank: '', bankCode: '', number: '', name: '' })));
}

/* ---------- Ảnh: cặp đôi tải ảnh lên Google Drive của người bán (qua Apps Script) ---------- */
const SLOT_NAMES = { hero: 'Ảnh chính (mở đầu)', groom: 'Ảnh chú rể', bride: 'Ảnh cô dâu', couple: 'Ảnh hai bạn', thanks: 'Ảnh cuối thiệp' };
const UPLOAD_ERR = { key: 'Link sửa không đúng, hãy dùng đúng link được gửi.', too_big: 'Ảnh quá lớn.', type: 'Chỉ nhận ảnh JPG, PNG hoặc WEBP.', limit: 'Thiệp đã tải quá nhiều ảnh, nhắn người bán giúp nhé.' };
const canUpload = () => !!(base?.sheetUrl && key);
const imgSrc = s => (/^https:/.test(s) ? s : `../${slug}/${s}`);

// Thu nhỏ ảnh trên máy (cạnh dài 1600px, JPEG) trước khi gửi: ảnh điện thoại 5-10MB còn khoảng 300KB
async function shrink(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const c = Object.assign(document.createElement('canvas'), { width: Math.round(bmp.width * s), height: Math.round(bmp.height * s) });
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .82));
  const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  return url.slice(url.indexOf(',') + 1);
}

async function uploadOne(file) {
  const data = await shrink(file).catch(() => { throw new Error(`Không đọc được ảnh "${file.name}".`); });
  const r = await fetch(base.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ invite: slug, type: 'upload', key, mime: 'image/jpeg', data }) });
  const d = await r.json();
  if (!d.ok) throw new Error(UPLOAD_ERR[d.error] || 'Tải ảnh chưa được, vui lòng thử lại.');
  return d.url;
}

function pickFiles(multiple) {
  return new Promise(res => {
    const inp = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/heic', multiple });
    inp.addEventListener('change', () => res([...inp.files]));
    inp.click();
  });
}

// Tải lần lượt, báo tiến độ trên thanh trên cùng; trả về các link đã tải được
async function uploadFiles(files) {
  const urls = [];
  for (const [i, f] of files.entries()) {
    status(`Đang tải ảnh ${i + 1}/${files.length}…`);
    try { urls.push(await uploadOne(f)); } catch (err) { status(err.message, 'err'); break; }
  }
  return urls;
}

function imagesBody() {
  const body = el('div', { class: 'group-body' });
  const im = () => (state.images ??= {});
  const render = () => {
    body.textContent = '';
    const cur = state.images || {}, album = cur.album || [], caps = cur.captions || [];
    const done = () => { render(); changed(); status('Ảnh đã tải lên. Bấm "Lưu" để thiệp đổi ảnh.'); };
    if (!canUpload()) body.append(el('small', { class: 'hint' }, 'Chỉ tải ảnh lên được khi mở bằng link Studio có mã sửa và thiệp đã nối Google Sheets.'));
    body.append(el('div', { class: 'slots' }, Object.entries(SLOT_NAMES).map(([s, name]) => el('div', { class: 'slot' },
      el('div', { class: 'thumb' }, cur[s] ? el('img', { src: imgSrc(cur[s]), alt: name, loading: 'lazy' }) : el('span', {}, 'Đang dùng ảnh trong album')),
      el('b', {}, name),
      el('button', { type: 'button', class: 'btn small ghost', disabled: !canUpload(), onclick: async () => {
        const [url] = await uploadFiles(await pickFiles(false));
        if (url) { im()[s] = url; done(); }
      } }, 'Đổi ảnh'),
      cur[s] !== baseImages[s] ? el('button', { type: 'button', class: 'link', onclick: () => {
        if (baseImages[s]) im()[s] = baseImages[s]; else delete im()[s];
        render(); changed();
      } }, 'Dùng lại ảnh cũ') : null))));
    const swap = (i, j) => {
      const a = im().album, c = (im().captions ||= []);
      [a[i], a[j]] = [a[j], a[i]]; [c[i], c[j]] = [c[j] ?? '', c[i] ?? ''];
      render(); changed();
    };
    body.append(el('div', { class: 'field' }, el('span', {}, `Album · ${album.length} ảnh`),
      el('div', { class: 'album-ed' }, album.map((src, i) => el('figure', { class: 'ph' },
        el('img', { src: imgSrc(src), alt: `Ảnh ${i + 1}`, loading: 'lazy' }),
        el('div', { class: 'ph-tools' },
          i > 0 ? el('button', { type: 'button', title: 'Lên trước', onclick: () => swap(i, i - 1) }, '←') : null,
          i < album.length - 1 ? el('button', { type: 'button', title: 'Ra sau', onclick: () => swap(i, i + 1) }, '→') : null,
          el('button', { type: 'button', title: 'Bỏ ảnh này khỏi album', onclick: () => {
            im().album.splice(i, 1); (im().captions ||= []).splice(i, 1); render(); changed();
          } }, '✕')),
        el('input', { value: caps[i] || '', placeholder: 'Chú thích', maxlength: 80, oninput: e => {
          const c = (im().captions ||= []);
          while (c.length < i) c.push('');
          c[i] = e.target.value; changed();
        } })))),
      el('div', { class: 'album-actions' },
        el('button', { type: 'button', class: 'add', disabled: !canUpload(), onclick: async () => {
          const urls = await uploadFiles(await pickFiles(true));
          if (urls.length) { (im().album ||= []).push(...urls); done(); }
        } }, '+ Thêm ảnh vào album'),
        JSON.stringify(cleanImages({ album, captions: caps })) !== JSON.stringify(cleanImages({ album: baseImages.album || [], captions: baseImages.captions || [] }))
          ? el('button', { type: 'button', class: 'link', onclick: () => { im().album = [...(baseImages.album || [])]; im().captions = [...(baseImages.captions || [])]; render(); changed(); } }, 'Dùng lại album cũ') : null),
      el('small', { class: 'hint' }, 'Ảnh được thu nhỏ trước khi tải lên và lưu ở Google Drive của người bán. Tối đa 30 ảnh album.')));
  };
  render();
  return body;
}

/* ---------- Xem trước ---------- */
const frame = $('#frame'), wrap = $('#frameWrap');
let view = 'inside';
function previewUrl() {
  const p = new URLSearchParams({ studio: '1' });
  if (view === 'inside') p.set('open', '1');
  const g = $('#guest').value.trim();
  if (g) p.set('k', g);
  return `../${slug}/?${p}`;
}
function reloadPreview() {
  wrap.classList.add('loading');
  frame.src = previewUrl();
}
addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
  if (e.data?.type === 'sayhello:ready') {
    frame.contentWindow.postMessage({ type: 'sayhello:data', invite: structuredClone(state) }, location.origin);
    setTimeout(() => wrap.classList.remove('loading'), 300);
  }
});
$$('#device button').forEach(b => b.addEventListener('click', () => {
  $$('#device button').forEach(x => x.classList.toggle('on', x === b));
  wrap.className = 'device ' + b.dataset.v;
}));
$$('#view button').forEach(b => b.addEventListener('click', () => {
  $$('#view button').forEach(x => x.classList.toggle('on', x === b));
  view = b.dataset.v; reloadPreview();
}));
let gT;
$('#guest').addEventListener('input', () => { clearTimeout(gT); gT = setTimeout(reloadPreview, 500); });
$$('.mobile-tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.mobile-tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.pane').forEach(p => p.classList.toggle('on', p.id === b.dataset.pane));
}));

/* ---------- Thay đổi, nháp, lưu ---------- */
const status = (t, cls = '') => { const s = $('#status'); s.textContent = t; s.className = 'status ' + cls; };
const clean = o => JSON.parse(JSON.stringify(o));
function changed() {
  const now = JSON.stringify(clean(state)), dirty = now !== saved;
  $('#save').disabled = !dirty || !base.sheetUrl;
  status(dirty ? 'Chưa lưu' : 'Đã lưu', dirty ? '' : 'ok');
  try { dirty ? localStorage.setItem(DRAFT, now) : localStorage.removeItem(DRAFT); } catch {}
  clearTimeout(reloadT); reloadT = setTimeout(reloadPreview, 450);
}
addEventListener('beforeunload', e => { if (JSON.stringify(clean(state)) !== saved) e.preventDefault(); });

$('#save').addEventListener('click', async () => {
  const btn = $('#save');
  if (!state.date) { status('Cần điền ngày giờ lễ chính', 'err'); return; }
  btn.disabled = true; status('Đang lưu…');
  // Ảnh chưa đổi thì không lưu kèm, để người bán còn thay ảnh trong invite.json mà không bị bản lưu cũ đè
  const content = clean(state);
  if (JSON.stringify(cleanImages(content.images) || {}) === JSON.stringify(baseImages)) delete content.images;
  try {
    const r = await fetch(base.sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ invite: slug, type: 'content', key, content }) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.error === 'key' ? 'Link sửa không đúng. Hãy dùng đúng link được gửi.' : d.error === 'too_big' ? 'Nội dung quá dài.' : 'Lưu chưa được.');
    saved = JSON.stringify(clean(state));
    try { localStorage.removeItem(DRAFT); } catch {}
    status('Đã lưu. Khách mở thiệp sẽ thấy ngay ✓', 'ok');
  } catch (err) {
    status(err.message || 'Lưu chưa được, vui lòng thử lại.', 'err');
    btn.disabled = false;
  }
});

// Không có Google Sheets: tải nội dung về để gửi người bán
$('#download').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(merge(base, clean(state)), null, 2)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `${slug}-invite.json` }); a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

/* ---------- Khởi động ---------- */
async function themeMod(id) {
  return themeMods[id] ??= (await import(`../themes/${id}/theme.js`)).default;
}

async function start() {
  if (!slug) { $('#who').textContent = 'Link thiếu tên thiệp (?thiep=...)'; return; }
  try {
    [base, themes] = await Promise.all([
      fetch(`../${slug}/invite.json`, { cache: 'no-cache' }).then(r => { if (!r.ok) throw 0; return r.json(); }),
      fetch('../themes/index.json').then(r => r.json()),
    ]);
  } catch { $('#who').textContent = `Không tìm thấy thiệp "${slug}"`; return; }
  baseImages = cleanImages(base.images) || {};

  let edits = null;
  if (base.sheetUrl) {
    try {
      const u = base.sheetUrl + (base.sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams({ invite: slug, type: 'content' });
      edits = (await (await fetch(u)).json()).content;
    } catch { status('Không đọc được bản đã lưu, đang dùng bản gốc', 'err'); }
  } else {
    $('#download').hidden = false;
    status('Thiệp chưa nối Google Sheets: chỉ xem trước và tải file được', 'err');
  }
  if (base.sheetUrl && !key) status('Link thiếu mã sửa: chỉ xem trước được', 'err');

  state = clean(pickEditable(merge(base, pickEditable(edits || {}))));
  saved = JSON.stringify(state);

  // Bản nháp chưa lưu từ lần trước
  try {
    const d = localStorage.getItem(DRAFT);
    if (d && d !== saved) {
      $('#draft').hidden = false;
      $('#draftUse').onclick = async () => { state = JSON.parse(d); $('#draft').hidden = true; await buildForm(); changed(); };
      $('#draftDrop').onclick = () => { localStorage.removeItem(DRAFT); $('#draft').hidden = true; };
    }
  } catch {}

  const n = state.order === 'bride-first' ? [state.bride, state.groom] : [state.groom, state.bride];
  $('#who').textContent = `Thiệp của ${n[0]?.short || ''} & ${n[1]?.short || ''}`;
  $('#openLink').href = `../${slug}/`;
  await buildForm();
  reloadPreview();
  if (!$('#status').textContent) status('Đã lưu', 'ok');
}
start();

