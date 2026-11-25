// Photobooth: bấm Chụp, đếm 3-2-1, nháy đèn bốn lần, dải ảnh in ra. Khách hồi âm thì in dải có tên mình.
(() => {
  const q = new URLSearchParams(location.search);
  const khach = (q.get('k') || '').trim().slice(0, 30);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANH = [1, 2, 3, 4, 5, 6].map((n) => `../../demo-tin-nhan/images/anh${n}.jpg`);

  const nut = document.getElementById('nut-chup');
  const dem = document.getElementById('dem');
  const flash = document.getElementById('flash');
  const xem = document.getElementById('xem-truoc');
  const loi = document.getElementById('loi-man');
  const khay = document.getElementById('khay');
  const cham = [...document.querySelectorAll('#dem-o i')];
  const doi = (ms) => new Promise((r) => setTimeout(r, giam ? 0 : ms));

  async function chup() {
    nut.disabled = true; loi.hidden = true;
    document.body.classList.add('dang-chup');
    khay.classList.remove('in', 'da-in');
    cham.forEach((c) => c.classList.remove('da'));
    for (let lan = 0; lan < 4; lan++) {
      xem.src = ANH[lan];
      for (const so of lan === 0 ? [3, 2, 1] : [2, 1]) {
        dem.textContent = so; dem.classList.remove('nhay'); void dem.offsetWidth; dem.classList.add('nhay');
        await doi(lan === 0 ? 800 : 450);
      }
      dem.textContent = '';
      flash.classList.remove('no'); void flash.offsetWidth; flash.classList.add('no');
      cham[lan].classList.add('da');
      await doi(500);
    }
    loi.textContent = 'Đang in dải ảnh…'; loi.hidden = false;
    document.body.classList.remove('dang-chup');
    khay.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'start' });
    await doi(350);
    khay.classList.add('in');
    await doi(2700);
    khay.classList.add('da-in');
    loi.textContent = 'Chụp xong rồi. Kéo xuống để xem dải ảnh.';
    nut.disabled = false; nut.textContent = 'Chụp lại';
  }
  nut.addEventListener('click', chup);
  document.getElementById('chup-lai').addEventListener('click', () => { scrollTo({ top: 0, behavior: giam ? 'auto' : 'smooth' }); setTimeout(chup, giam ? 0 : 700); });
  // Ai bỏ qua máy chụp vẫn thấy dải ảnh đã in sẵn
  document.querySelector('.may .bo-qua').addEventListener('click', () => khay.classList.add('in', 'da-in'));
  new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting && !document.body.classList.contains('dang-chup') && !khay.classList.contains('in')) { khay.classList.add('in', 'da-in'); io.disconnect(); } }), { threshold: 0.4 }).observe(khay);

  // ---------- In dải ảnh có tên khách lên canvas ----------
  const form = document.getElementById('form');
  if (khach) form.ten.value = khach;
  const nap = (src) => new Promise((ok, loi2) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi2; i.src = src; });
  function sangToi(hex) { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ten = form.ten.value.trim();
    const mau = form.mau.value;
    const den = form.den.value === 'co';
    const cv = document.getElementById('canvas');
    const c = cv.getContext('2d');
    const W = 600, P = 42, w = W - P * 2, h = Math.round(w * 0.75), G = 30;
    cv.height = P + 4 * h + 3 * G + 300;
    c.fillStyle = mau; c.fillRect(0, 0, W, cv.height);
    const anh = await Promise.all(ANH.slice(0, 4).map(nap));
    anh.forEach((im, k) => {
      const y = P + k * (h + G);
      const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
      c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, P, y, w, h);
    });
    await document.fonts.load('40px "Patrick Hand"');
    const chu = sangToi(mau) > 140 ? '#15171c' : '#ffffff';
    const y0 = P + 4 * h + 3 * G;
    c.fillStyle = chu; c.textAlign = 'center';
    c.font = '46px "Patrick Hand"'; c.fillText('Nhật Minh + Thanh Trúc', W / 2, y0 + 82);
    c.font = '500 24px "Be Vietnam Pro"'; c.fillText('24.10.2027, Huế', W / 2, y0 + 124);
    c.globalAlpha = 0.85;
    c.font = '36px "Patrick Hand"'; c.fillText(den ? `Có mặt: ${ten}` : `Gửi lời chúc: ${ten}`, W / 2, y0 + 196);
    c.globalAlpha = 1;
    const kq = document.getElementById('ket-qua'); kq.hidden = false;
    const tai = document.getElementById('tai');
    try { tai.href = cv.toDataURL('image/png'); } catch { tai.hidden = true; } // mở bằng file:// thì trình duyệt chặn xuất ảnh
    tai.download = `dai-anh-${ten.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\W+/g, '-').toLowerCase()}.png`;
    form.querySelector('.nut').textContent = 'In lại dải ảnh';
    kq.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'center' });
  });
})();
