// Thẻ Lên Máy Bay: bảng giờ bay lật chữ, nhận thẻ (thiệp mời có tên khách), xé cuống để xác nhận, trời đổi màu theo cuộn.
(() => {
  const q = new URLSearchParams(location.search);
  const khach = (q.get('k') || '').trim().slice(0, 40);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoa = (s) => s.toLocaleUpperCase('vi');

  // Tiếng lách cách của bảng lật chữ (Web Audio, không cần file)
  let am;
  function tach() {
    try {
      am ||= new AudioContext();
      const b = am.createBuffer(1, am.sampleRate * 0.015, am.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const s = am.createBufferSource(), g = am.createGain(); g.gain.value = 0.08;
      s.buffer = b; s.connect(g).connect(am.destination); s.start();
    } catch {}
  }

  const KY_TU = 'ABCDEGHIKLMNOPQRSTUVXY0123456789:';
  const COT = 23;
  const canDong = (s) => { const t = s.slice(0, COT); const l = Math.floor((COT - t.length) / 2); return ' '.repeat(l) + t + ' '.repeat(COT - t.length - l); };

  function veDong(el, so = COT) {
    el.innerHTML = '';
    return Array.from({ length: so }, () => { const o = document.createElement('span'); o.className = 'o-chu'; el.appendChild(o); return o; });
  }

  // Lật một hàng tới nội dung đích: mỗi ô quay vài ký tự ngẫu nhiên rồi dừng, lệch nhau từ trái sang phải
  function lat(o, dich, coTieng) {
    const chu = [...dich];
    return Promise.all(o.map((cell, i) => new Promise((xong) => {
      const muc = chu[i] ?? ' ';
      if (giam) { cell.textContent = muc; xong(); return; }
      let n = muc === ' ' ? 2 : 4 + Math.floor(Math.random() * 6) + Math.floor(i / 3);
      const buoc = () => {
        cell.classList.remove('lat'); void cell.offsetWidth; cell.classList.add('lat');
        if (--n <= 0) { cell.textContent = muc; xong(); return; }
        cell.textContent = KY_TU[Math.floor(Math.random() * KY_TU.length)];
        if (coTieng && i % 4 === 0) tach();
        setTimeout(buoc, 55);
      };
      setTimeout(buoc, i * 18);
    })));
  }

  const dong = [...document.querySelectorAll('.bb-dong')].map((el) => veDong(el));
  const chu = [...document.querySelectorAll('.bb-chu')].map((el) => veDong(el));
  const nutNhan = document.getElementById('nhan-the');
  const dongHo = document.getElementById('dong-ho');
  dongHo.textContent = new Date().toTimeString().slice(0, 5);

  async function chay() {
    await new Promise((r) => setTimeout(r, giam ? 0 : 500));
    await Promise.all([
      lat(dong[0], hoa('17:30 MT2410 HUẾ    MỜI'), true),
      lat(dong[1], hoa('18:05 VN1546 ĐÀ NẴNG ĐÚNG'), false),
      lat(dong[2], hoa('19:40 VJ0322 SÀI GÒN TRỄ'), false),
    ]);
    await lat(chu[0], canDong(hoa('NHẬT MINH VÀ THANH TRÚC')), true);
    await lat(chu[1], canDong(hoa(`MỜI ${khach || 'QUÝ KHÁCH'} LÊN TÀU`)), true);
    nutNhan.disabled = false;
    nutNhan.focus({ preventScroll: true });
  }
  chay();

  const bangBay = document.getElementById('bang-bay');
  const the = document.getElementById('the');
  nutNhan.addEventListener('click', () => {
    bangBay.classList.add('di');
    document.body.classList.remove('khoa');
    the.classList.add('ra');
    setTimeout(() => { bangBay.hidden = true; }, giam ? 0 : 950);
  });

  // Mã vạch trang trí
  const vach = document.querySelector('.ma-vach');
  let x = 0, s = '';
  while (x < 200) { const w = 1 + Math.floor(Math.random() * 3); s += `<rect x="${x}" y="0" width="${w}" height="40" fill="currentColor"/>`; x += w + 1 + Math.floor(Math.random() * 3); }
  vach.innerHTML = s;

  // Xé cuống để mở phần xác nhận
  const form = document.getElementById('form');
  if (khach) form.ten.value = khach;
  document.getElementById('nut-xe').addEventListener('click', () => {
    the.classList.add('xe');
    if (!giam) tach();
    setTimeout(() => { form.hidden = false; form.ten.focus(); form.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'center' }); }, giam ? 0 : 500);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const co = form.den.value === 'co';
    document.getElementById('da-gui').textContent = co ? `Đã giữ chỗ cho ${form.ten.value.trim()}, ${form.so.value}. Hẹn gặp ở Huế.` : 'Đã gửi. Cảm ơn bạn đã báo cho tụi mình.';
    form.querySelector('.nut-gui').textContent = 'Cập nhật';
  });

  // Trời đổi màu và độ cao tăng theo cuộn; ảnh trong cửa sổ trôi nhẹ
  const bay = document.getElementById('bay'), doCao = document.getElementById('do-cao');
  const cuaSo = [...document.querySelectorAll('.cua-so')];
  let cho = false;
  function capNhat() {
    cho = false;
    const r = bay.getBoundingClientRect(), vh = innerHeight;
    const p = Math.max(0, Math.min(1, (vh - r.top) / (r.height + vh)));
    doCao.textContent = Math.round(p * 10668).toLocaleString('vi-VN');
    bay.style.setProperty('--t1', `${20 + p * 30}%`);
    bay.style.setProperty('--t2', `${95 - p * 35}%`);
    if (!giam) cuaSo.forEach((c) => { const b = c.getBoundingClientRect(); c.style.setProperty('--p', ((b.top + b.height / 2 - vh / 2) / vh).toFixed(3)); });
  }
  addEventListener('scroll', () => { if (!cho) { cho = true; requestAnimationFrame(capNhat); } }, { passive: true });
  capNhat();
})();
