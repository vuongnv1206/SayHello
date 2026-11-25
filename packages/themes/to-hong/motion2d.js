// Mức standard cho "Tơ Hồng": GSAP 3.13 + ScrollTrigger (nạp sau khi mở bìa), không WebGL.
// Vẽ sợi tơ đỏ SVG theo tiến độ cuộn, tạo hiệu ứng nghiêng 2.5D cho khung ảnh lụa và thắt nút đồng tâm.

export async function runMotion2d(el, ctx) {
  const root = document.documentElement;
  if (!ctx.opened || root.dataset.motion === 'lite') return;

  const { gsap, ScrollTrigger } = await ctx.lib('scroll');
  if (!ctx.opened || root.dataset.motion === 'lite') return;

  root.classList.add('th-2d');

  const cleanups = [];
  const track = el.querySelector('.th-track');
  const svgPath = el.querySelector('.th-svg-path');
  const knotStroke = el.querySelector('.th-knot-stroke');

  // 1. Sợi chỉ đỏ SVG vẽ dọc hành trình cuộn
  if (svgPath && track) {
    gsap.set(svgPath, { strokeDasharray: '1', strokeDashoffset: 1 });
    const tw = gsap.to(svgPath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: track,
        start: 'top 75%',
        end: 'bottom 85%',
        scrub: 0.45,
      },
    });
    cleanups.push(() => tw.scrollTrigger?.kill(), () => tw.kill());
  }

  // 2. Nút thắt hoa hồng cực vẽ dần ở cuối hành trình
  if (knotStroke) {
    knotStroke.setAttribute('pathLength', '1');
    gsap.set(knotStroke, { strokeDasharray: '1', strokeDashoffset: 1 });
    const ktw = gsap.to(knotStroke, {
      strokeDashoffset: 0,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: knotStroke.closest('.th-s-finale') || knotStroke,
        start: 'top 78%',
        once: true,
      },
    });
    cleanups.push(() => ktw.scrollTrigger?.kill(), () => ktw.kill());
  }

  // 3. Khung ảnh xuất hiện nhịp nhàng theo từng trạm (không ẩn tiêu đề khi giảm chuyển động)
  el.querySelectorAll('.th-frame').forEach((frame, idx) => {
    const ftw = gsap.fromTo(
      frame,
      { y: 26, rotateZ: idx % 2 ? 1.2 : -1.2 },
      {
        y: 0,
        rotateZ: 0,
        duration: 0.75,
        ease: 'power2.out',
        scrollTrigger: { trigger: frame, start: 'top 86%', once: true },
      }
    );
    cleanups.push(() => ftw.scrollTrigger?.kill(), () => ftw.kill());

    // Hiệu ứng nghiêng 2.5D khi rê chuột trên khung ảnh
    const onMove = e => {
      if (e.pointerType !== 'mouse') return;
      const r = frame.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      const ny = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
      frame.style.setProperty('--rx', `${(-ny * 5).toFixed(2)}deg`);
      frame.style.setProperty('--ry', `${(nx * 6).toFixed(2)}deg`);
    };
    const onLeave = () => {
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    };
    frame.addEventListener('pointermove', onMove, { passive: true });
    frame.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      frame.removeEventListener('pointermove', onMove);
      frame.removeEventListener('pointerleave', onLeave);
    });
  });

  // 4. Dọn sạch khi hạ cấp về lite
  ctx.on('motion', m => {
    if (m?.motion === 'lite') {
      root.classList.remove('th-2d');
      cleanups.splice(0).forEach(fn => { try { fn(); } catch {} });
      if (svgPath) svgPath.style.strokeDashoffset = '0';
      if (knotStroke) knotStroke.style.strokeDashoffset = '0';
      ScrollTrigger?.refresh?.();
    }
  });
}
