// Góc chụp tiệc cưới: kéo rèm, đếm 3-2-1, flash cả màn hình bốn lần, dải ảnh (tấm thiệp) in ra rồi ảnh hiện dần.
(() => {
  const q = new URLSearchParams(location.search);
  const khach = (q.get('k') || '').trim().slice(0, 30);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ANH = [1, 2, 3, 4, 5, 6].map((n) => `../../demo-tin-nhan/images/anh${n}.jpg`);
  const doi = (ms) => new Promise((r) => setTimeout(r, giam ? 0 : ms));

  const may = document.querySelector('.may');
  const nut = document.getElementById('nut-chup');
  const dem = document.getElementById('dem');
  const flash = document.getElementById('flash');
  const xem = document.getElementById('xem-truoc');
  const loi = document.getElementById('loi-man');
  const khay = document.getElementById('thiep');
  const goiY = document.getElementById('goi-y');
  const cham = [...document.querySelectorAll('#cham i')];

  // Tiếng màn trập tổng hợp bằng WebAudio (không cần file)
  let am;
  function tiengChup() {
    try {
      am ||= new AudioContext();
      const t = am.currentTime, n = am.createBufferSource(), buf = am.createBuffer(1, am.sampleRate * 0.12, am.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const g = am.createGain(); g.gain.setValueAtTime(0.35, t);
      const f = am.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2200;
      n.buffer = buf; n.connect(f).connect(g).connect(am.destination); n.start(t);
    } catch { /* không có âm thanh cũng không sao */ }
  }

  function inThiep(ngay) {
    khay.classList.add('in');
    if (ngay) { khay.classList.add('hien', 'xong'); goiY.textContent = ''; return; }
    setTimeout(() => { khay.classList.add('hien'); }, giam ? 0 : 1600);
    setTimeout(() => { khay.classList.add('xong'); goiY.textContent = 'Kéo xuống để xem giờ lễ và hồi âm'; }, giam ? 0 : 4600);
  }

  async function chup() {
    nut.disabled = true;
    document.body.classList.add('dang-chup');
    khay.classList.remove('in', 'hien', 'xong');
    cham.forEach((c) => c.classList.remove('da'));
    may.classList.add('mo-rem');
    loi.textContent = 'Nhìn vào máy nhé';
    await doi(900);
    for (let lan = 0; lan < 4; lan++) {
      xem.src = ANH[lan];
      for (const so of lan === 0 ? [3, 2, 1] : [1]) {
        dem.textContent = so; dem.classList.remove('nhay'); void dem.offsetWidth; dem.classList.add('nhay');
        await doi(lan === 0 ? 750 : 600);
      }
      dem.textContent = '';
      tiengChup();
      flash.classList.remove('no'); void flash.offsetWidth; flash.classList.add('no');
      cham[lan].classList.add('da');
      await doi(650);
    }
    loi.textContent = 'Đang in thiệp của bạn';
    document.body.classList.remove('dang-chup');
    if (innerWidth < 960) khay.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'start' });
    await doi(400);
    inThiep(false);
    await doi(3200);
    loi.textContent = 'Thiệp đã in xong';
    nut.disabled = false; nut.querySelector('span').textContent = 'Chụp lại';
  }
  nut.addEventListener('click', chup);
  document.getElementById('chup-lai').addEventListener('click', () => { scrollTo({ top: 0, behavior: giam ? 'auto' : 'smooth' }); setTimeout(chup, giam ? 0 : 700); });
  // Ai bỏ qua máy chụp hoặc cuộn thẳng xuống vẫn thấy tấm thiệp đã in sẵn
  document.getElementById('bo-qua').addEventListener('click', () => inThiep(true));
  new IntersectionObserver((es, io) => es.forEach((e) => {
    if (e.isIntersecting && !document.body.classList.contains('dang-chup') && !khay.classList.contains('in')) { inThiep(true); io.disconnect(); }
  }), { threshold: 0.35 }).observe(khay);

  // ---------- Hồi âm: in dải ảnh mang tên khách ----------
  const form = document.getElementById('form');
  if (khach) form.ten.value = khach;
  const nap = (src) => new Promise((ok, loi2) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi2; i.src = src; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ten = form.ten.value.trim();
    const den = form.den.value === 'co';
    const cv = document.getElementById('canvas');
    const c = cv.getContext('2d');
    const W = 600, P = 36, w = W - P * 2, h = Math.round(w * 0.75), G = 24;
    cv.height = P + 70 + 3 * h + 2 * G + 360;
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, cv.height);
    await Promise.all([document.fonts.load('40px "Pinyon Script"'), document.fonts.load('300 40px "Noto Serif Display"')]);
    c.textAlign = 'center';
    c.fillStyle = '#b79c6b'; c.font = '300 34px "Noto Serif Display"'; c.fillText('M  và  T', W / 2, P + 40);
    const anh = await Promise.all(ANH.slice(0, 3).map(nap));
    anh.forEach((im, k) => {
      const y = P + 70 + k * (h + G);
      const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
      c.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, P, y, w, h);
    });
    const y0 = P + 70 + 3 * h + 2 * G;
    c.fillStyle = '#b79c6b'; c.font = '46px "Pinyon Script"'; c.fillText(den ? 'Hẹn gặp' : 'Cảm ơn', W / 2, y0 + 80);
    c.fillStyle = '#1e2740'; c.font = '400 40px "Noto Serif Display"'; c.fillText(ten, W / 2, y0 + 140);
    c.font = '300 52px "Noto Serif Display"'; c.fillText('Nhật Minh và Thanh Trúc', W / 2, y0 + 230);
    c.fillStyle = '#6b7183'; c.font = '400 24px "Be Vietnam Pro"'; c.fillText('24.10.2027, Huế', W / 2, y0 + 280);
    const kq = document.getElementById('ket-qua'); kq.hidden = false;
    const tai = document.getElementById('tai');
    try { tai.href = cv.toDataURL('image/png'); tai.hidden = false; } catch { tai.hidden = true; } // mở bằng file:// thì trình duyệt chặn xuất ảnh
    tai.download = `thiep-nhat-minh-thanh-truc-${ten.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\W+/g, '-').toLowerCase()}.png`;
    form.querySelector('.nut').textContent = 'Gửi lại hồi âm';
    kq.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'center' });
  });
})();
