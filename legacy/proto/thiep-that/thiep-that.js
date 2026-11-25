// Bản duyệt Thiệp Thật: chọn chủ đề, mở phong bì, ảnh chuyển động máy quay 2.5D, ánh kim theo độ nghiêng.
(() => {
  const q = new URLSearchParams(location.search);
  const CHU_DE = ['lua-nga', 'dong-duong', 'muc-tau', 'da-lat'];
  const chuDe = CHU_DE.includes(q.get('chu-de')) ? q.get('chu-de') : 'lua-nga';
  const body = document.body;
  body.dataset.chuDe = chuDe;
  const giam = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.duyet a').forEach((a) => {
    if (a.dataset.cd === chuDe) a.setAttribute('aria-current', 'page');
    const u = new URL(a.href); if (q.get('k')) u.searchParams.set('k', q.get('k')); a.href = u.search;
  });

  // Tên khách
  const khach = (q.get('k') || '').trim().slice(0, 40);
  if (khach) document.querySelectorAll('.ten-khach').forEach((el) => { el.textContent = khach; });

  // Âm lịch (lịch Trung Hoa gần như trùng âm lịch Việt Nam; bản thật sẽ dùng bảng âm lịch UTC+7)
  const ngay = new Date('2027-10-24T17:30:00+07:00');
  try {
    const p = new Intl.DateTimeFormat('vi-VN-u-ca-chinese', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).formatToParts(ngay);
    const d = p.find((x) => x.type === 'day')?.value, m = p.find((x) => x.type === 'month')?.value;
    const y = 2027, CAN = ['Canh', 'Tân', 'Nhâm', 'Quý', 'Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ'], CHI = ['Thân', 'Dậu', 'Tuất', 'Hợi', 'Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi'];
    if (d && m) document.getElementById('ngay-am').textContent = `Nhằm ngày ${parseInt(d, 10)} tháng ${parseInt(m, 10)} năm ${CAN[y % 10]} ${CHI[y % 12]}`;
  } catch { /* trình duyệt không có lịch âm thì bỏ dòng này */ }

  // ---------- Phong bì ----------
  const man = document.getElementById('phong-bi-man');
  const bay = document.getElementById('the-bay');
  const chinh = document.getElementById('the-chinh');
  const nutNiem = document.getElementById('dau-niem');
  const banSao = chinh.cloneNode(true);
  banSao.removeAttribute('id');
  banSao.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  banSao.querySelector('.nut-tra-loi')?.setAttribute('tabindex', '-1');
  banSao.style.transform = 'none';
  bay.appendChild(banSao);

  // Bản sao dựng đúng cỡ thiệp chính rồi thu nhỏ vào phong bì, để lúc hoà vào thiệp chính không lệch dòng chữ
  function datCoThe() {
    const w = chinh.offsetWidth, h = chinh.offsetHeight;
    banSao.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;--w:${w}px;transform-origin:0 0;transform:scale(${bay.offsetWidth / w})`;
  }

  function dong() {
    man.classList.remove('mo', 'rut', 'roi', 'xong');
    bay.style.transition = 'none'; bay.style.transform = ''; bay.style.opacity = '';
    bay.offsetWidth; bay.style.transition = '';
    body.classList.add('dang-dong');
    scrollTo(0, 0);
    requestAnimationFrame(datCoThe);
    nutNiem.focus({ preventScroll: true });
  }

  function mo() {
    if (man.classList.contains('mo')) return;
    scrollTo(0, 0);
    if (giam) { man.classList.add('xong'); body.classList.remove('dang-dong'); return; }
    man.classList.add('mo');
    setTimeout(() => man.classList.add('rut'), 650);
    setTimeout(() => {
      // Thiệp bay về đúng chỗ thiệp chính trên trang rồi hoà vào nó
      const a = bay.getBoundingClientRect(), b = chinh.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const s = b.width / a.width;
      const goc = getComputedStyle(chinh).transform.includes('matrix') && innerWidth >= 960 ? -1.2 : 0;
      man.classList.add('roi');
      bay.style.transition = 'transform .95s cubic-bezier(.45,.05,.2,1)';
      bay.style.transform = `translate(${dx}px, ${dy}px) translateY(-62%) rotate(${goc}deg) scale(${s})`;
      setTimeout(() => { man.classList.add('xong'); body.classList.remove('dang-dong'); }, 950);
    }, 1550);
  }

  nutNiem.addEventListener('click', mo);
  document.getElementById('mo-lai').addEventListener('click', dong);
  addEventListener('resize', datCoThe);
  document.fonts?.ready.then(datCoThe);
  dong();

  // ---------- Ảnh: máy quay đẩy vào, người trôi nhanh hơn nền ----------
  const anh = [...document.querySelectorAll('[data-sau]')];
  const dangThay = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? dangThay.add(e.target) : dangThay.delete(e.target))), { rootMargin: '10% 0px' });
  anh.forEach((el) => io.observe(el));
  let cho = false;
  function capNhat() {
    cho = false;
    const vh = innerHeight;
    dangThay.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
      el.style.setProperty('--p', p.toFixed(3));
    });
    // Ánh kim: khi không có con quay, độ nghiêng đi theo cuộn
    if (!coConQuay) document.documentElement.style.setProperty('--nghieng', `${50 + Math.sin(scrollY / 260) * 32}%`);
    nutNhanh.classList.toggle('hien', innerWidth < 960 && chinh.getBoundingClientRect().bottom < 0 && hoiAm.getBoundingClientRect().top > vh);
  }
  const nutNhanh = document.getElementById('tra-loi-nhanh');
  const hoiAm = document.getElementById('hoi-am');
  let coConQuay = false;
  if (!giam) {
    addEventListener('scroll', () => { if (!cho) { cho = true; requestAnimationFrame(capNhat); } }, { passive: true });
    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      document.documentElement.style.setProperty('--nghieng', `${15 + (e.clientX / innerWidth) * 70}%`);
    });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma == null) return;
      coConQuay = true;
      document.documentElement.style.setProperty('--nghieng', `${50 + Math.max(-35, Math.min(35, e.gamma)) * 1.2}%`);
    });
  }
  capNhat();

  // ---------- Mực Tàu: ảnh loang ra như mực thấm giấy khi lần đầu hiện ----------
  if (chuDe === 'muc-tau' && !giam) {
    const ioLoang = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      ioLoang.unobserve(e.target);
      const el = e.target, t0 = performance.now(), T = 1700;
      el.classList.add('loang-cho');
      const buoc = (t) => {
        const k = Math.min(1, (t - t0) / T), e2 = 1 - Math.pow(1 - k, 3);
        el.style.setProperty('--loang', e2.toFixed(3));
        if (k < 1) requestAnimationFrame(buoc); else { el.classList.remove('loang-cho'); el.style.setProperty('--loang', '2'); }
      };
      requestAnimationFrame(buoc);
    }), { threshold: 0.3 });
    anh.forEach((el) => { el.style.setProperty('--loang', '0'); ioLoang.observe(el); });
  }

  // ---------- Hồi âm (bản duyệt: không gửi đi đâu) ----------
  document.getElementById('form-hoi-am').addEventListener('submit', (e) => {
    e.preventDefault();
    const da = document.getElementById('da-gui');
    da.textContent = e.target.den.value === 'co' ? `Đã gửi. Cảm ơn ${khach || 'bạn'}, hẹn gặp ở Huế.` : `Đã gửi. Cảm ơn ${khach || 'bạn'} đã báo cho tụi mình.`;
    da.hidden = false;
    e.target.querySelector('.nut-gui').textContent = 'Đã gửi hồi âm';
  });
})();
