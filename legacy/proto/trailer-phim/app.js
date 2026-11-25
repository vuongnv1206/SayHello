// Trailer Phim: cuộn để tua cảnh, hoặc bấm Phát để trailer tự chạy (chạm là dừng).
(() => {
  const q = new URLSearchParams(location.search);
  const khach = (q.get('k') || '').trim().slice(0, 40);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const phim = document.getElementById('phim');
  const canh = [...document.querySelectorAll('[data-canh]')];
  const thanh = document.getElementById('thanh-tien-do');
  const nhac = document.getElementById('nhac');
  // Hướng máy quay của từng cảnh có ảnh: đẩy vào, lia trái, lia phải, hạ máy...
  const HUONG = [[0, 0], [-3, 0], [3, -1], [0, 0], [0, 2], [-2, -2], [0, 0], [0, 0], [2, 1]];
  canh.forEach((c, i) => { c.style.setProperty('--hx', HUONG[i]?.[0] ?? 0); c.style.setProperty('--hy', HUONG[i]?.[1] ?? 0); });

  let hienTai = -1, cho = false;
  function capNhat() {
    cho = false;
    const r = phim.getBoundingClientRect();
    const vh = innerHeight;
    const tong = canh.length;
    const t = Math.max(0, Math.min(tong - 0.001, -r.top / vh));
    const i = Math.floor(t), cuc = t - i;
    if (i !== hienTai) {
      canh.forEach((c, k) => c.classList.toggle('hien', k === i));
      hienTai = i;
    }
    if (!giam) canh[i].style.setProperty('--t', cuc.toFixed(3));
    phim.classList.toggle('mo-man', r.top < vh * 0.5 && r.bottom > 0);
    phim.style.setProperty('--tien', '0');
    thanh.parentElement.style.setProperty('--tien', (t / tong).toFixed(3));
  }
  addEventListener('scroll', () => { if (!cho) { cho = true; requestAnimationFrame(capNhat); } }, { passive: true });
  addEventListener('resize', capNhat);
  capNhat();

  // Tự chạy: mỗi cảnh khoảng 2,6 giây; chạm, cuộn tay hoặc bấm phím thì dừng
  let chay = false, truoc = 0;
  const GIAY_MOI_CANH = 2.6;
  function buoc(ts) {
    if (!chay) return;
    const dt = truoc ? (ts - truoc) / 1000 : 0; truoc = ts;
    scrollBy(0, (innerHeight / GIAY_MOI_CANH) * dt);
    const het = phim.getBoundingClientRect().bottom <= innerHeight + 1;
    if (het) { dung(); document.getElementById('thong-tin').scrollIntoView({ behavior: giam ? 'auto' : 'smooth' }); return; }
    requestAnimationFrame(buoc);
  }
  function phat() {
    nhac.volume = 0.7; nhac.play().catch(() => {});
    scrollTo({ top: phim.offsetTop, behavior: 'instant' });
    chay = true; truoc = 0; requestAnimationFrame(buoc);
  }
  function dung() { chay = false; }
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) => addEventListener(ev, (e) => {
    if (e.target.closest?.('#phat')) return;
    dung();
  }, { passive: true }));

  document.getElementById('phat').addEventListener('click', phat);
  document.getElementById('xem-lai').addEventListener('click', phat);

  // Đếm ngược tới buổi tiệc
  const ngay = new Date('2027-10-24T17:30:00+07:00');
  const con = Math.ceil((ngay - Date.now()) / 86400000);
  document.getElementById('dem-nguoc').textContent = con > 0 ? `Còn ${con} ngày nữa là khởi chiếu.` : 'Phim đã công chiếu. Cảm ơn bạn đã đến xem.';

  // Giữ vé: in vé có tên khách (bản thử, không gửi đi đâu)
  const form = document.getElementById('form-ve');
  if (khach) form.ten.value = khach;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ve = document.getElementById('ve');
    const den = form.den.value === 'co';
    document.getElementById('ve-ten').textContent = form.ten.value.trim();
    document.getElementById('ve-so').textContent = den ? form.so.value : 'Gửi lời chúc';
    document.getElementById('ve-ma').textContent = `MT${String(Math.floor(Math.random() * 9000) + 1000)}`;
    ve.hidden = false;
    form.querySelector('.nut-giu').textContent = 'Cập nhật vé';
    ve.scrollIntoView({ behavior: giam ? 'auto' : 'smooth', block: 'center' });
  });
})();
