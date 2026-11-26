// Album Nhạc: kéo đĩa ra khỏi bìa, kim hạ, nhạc phát, lời mời chạy từng dòng như lời bài hát.
(() => {
  const q = new URLSearchParams(location.search);
  const khach = (q.get('k') || '').trim().slice(0, 40);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lời "bài hát": chính là lời mời. Dòng có ten: true in nghiêng.
  const LOI = [
    { t: 'Mùa thu năm nay, ở Huế' },
    { t: 'có hai người hẹn nhau' },
    { t: 'về chung một nhà' },
    { t: 'Nhật Minh và Thanh Trúc', ten: true },
    { t: `Trân trọng kính mời ${khach || 'bạn'}` },
    { t: 'đến dự lễ thành hôn của tụi mình' },
    { t: '17 giờ 30, Chủ nhật 24.10.2027' },
    { t: 'Nhà hàng Bên Sông, Huế' },
    { t: 'Có bạn, bài hát này mới trọn vẹn' },
  ];
  const GIAY = 2.8;

  const loi = document.getElementById('loi');
  LOI.forEach((d) => { const p = document.createElement('p'); p.textContent = d.t; if (d.ten) p.classList.add('ten'); loi.appendChild(p); });
  const dong = [...loi.children];
  const tienDo = document.getElementById('tien-do');
  const phat = document.getElementById('dang-phat');
  const nhac = document.getElementById('nhac');
  const nutDung = document.getElementById('tam-dung');

  // Hiện 3 dòng quanh dòng đang hát cho gọn màn hình
  let i = -1, hen = 0, dangChay = false;
  function toiDong(k) {
    i = k;
    dong.forEach((p, n) => {
      p.classList.toggle('dang', n === k);
      p.classList.toggle('qua', n < k);
      p.hidden = n < k - 1 || n > k + 1;
    });
    tienDo.style.width = `${((k + 1) / dong.length) * 100}%`;
  }
  function chay() {
    dangChay = true; phat.classList.add('phat'); nutDung.textContent = '❚❚'; nutDung.setAttribute('aria-label', 'Tạm dừng');
    nhac.volume = 0.6; nhac.play().catch(() => {});
    const tiep = () => {
      if (!dangChay) return;
      if (i >= dong.length - 1) { dung(); return; }
      toiDong(i + 1);
      hen = setTimeout(tiep, (giam ? 4 : GIAY) * 1000);
    };
    tiep();
  }
  function dung() {
    dangChay = false; clearTimeout(hen); phat.classList.remove('phat'); nhac.pause();
    nutDung.textContent = '▶'; nutDung.setAttribute('aria-label', i >= dong.length - 1 ? 'Phát lại' : 'Phát tiếp');
  }
  nutDung.addEventListener('click', () => {
    if (dangChay) { dung(); return; }
    if (i >= dong.length - 1) i = -1;
    chay();
  });
  // Hiện sẵn toàn bộ lời khi chưa phát (người tắt chuyển động vẫn đọc được)
  dong.forEach((p) => { p.hidden = false; });

  // ---------- Kéo đĩa ra khỏi bìa ----------
  const cong = document.getElementById('cong');
  const dia = document.getElementById('dia');
  const bo = document.getElementById('bo-dia');
  let x0 = null, keo = 0, mo = false;
  function moAlbum() {
    if (mo) return; mo = true;
    dia.classList.remove('dang-keo');
    dia.style.setProperty('--keo', 1);
    setTimeout(() => {
      cong.classList.add('di'); document.body.classList.remove('khoa');
      setTimeout(() => { cong.hidden = true; }, giam ? 0 : 800);
      setTimeout(chay, giam ? 0 : 700);
    }, giam ? 0 : 450);
  }
  dia.addEventListener('pointerdown', (e) => { x0 = e.clientX; dia.setPointerCapture(e.pointerId); dia.classList.add('dang-keo'); });
  dia.addEventListener('pointermove', (e) => {
    if (x0 == null) return;
    keo = Math.max(0, Math.min(1, (e.clientX - x0) / (bo.offsetWidth * 0.6)));
    dia.style.setProperty('--keo', keo.toFixed(3));
    dia.setAttribute('aria-valuenow', Math.round(keo * 100));
    if (keo > 0.45) { x0 = null; moAlbum(); }
  });
  const tha = () => { if (x0 == null) return; x0 = null; dia.classList.remove('dang-keo'); if (keo < 0.45) { keo = 0; dia.style.setProperty('--keo', 0); } };
  dia.addEventListener('pointerup', tha); dia.addEventListener('pointercancel', tha);
  dia.addEventListener('click', () => { if (keo === 0) moAlbum(); });
  dia.addEventListener('keydown', (e) => { if (['Enter', ' ', 'ArrowRight'].includes(e.key)) { e.preventDefault(); moAlbum(); } });
  document.getElementById('nghe-ngay').addEventListener('click', moAlbum);

  // ---------- Hồi âm và xin một bài ----------
  const form = document.getElementById('form');
  if (khach) form.ten.value = khach;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bai = form.bai.value.trim();
    const co = form.den.value === 'co';
    document.getElementById('da-gui').textContent = (co ? `Đã giữ chỗ cho ${form.ten.value.trim()}.` : 'Đã gửi, cảm ơn bạn đã báo.') + (bai ? ` Bài “${bai}” đã vào danh sách phát của tiệc cưới.` : '');
    form.querySelector('.nut-chinh').textContent = 'Cập nhật hồi âm';
  });
})();
