// Hành vi dùng chung gắn vào markup có data-sh (không sinh HTML, nên mẫu tự vẽ giao diện tuỳ ý):
//   form[data-sh=rsvp], form[data-sh=wish], [data-sh=wishes], [data-sh=countdown], ngăn kéo Thông tin nhanh
const pad = n => String(n).padStart(2, '0');

export function bindServices(root, ctx) {
  const { say, backend } = ctx;

  // Mã khách ẩn danh trên máy: hai người trùng tên không bị gộp, một người gửi lại thì cập nhật
  const guestId = () => {
    const k = 'sayhello:' + ctx.data.slug + ':gid';
    try { let v = localStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 10); localStorage.setItem(k, v); } return v; }
    catch { return Math.random().toString(36).slice(2, 10); }
  };

  function bindForm(form, build, done) {
    const msg = form.querySelector('.sh-msg'), btn = form.querySelector('[type=submit]');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const payload = build(new FormData(form));
      btn && (btn.disabled = true);
      if (msg) msg.textContent = say('sending');
      try {
        await backend.send(payload);
        if (msg) msg.textContent = done(payload);
        form.classList.add('is-sent');
        ctx.emit(payload.type === 'rsvp' ? 'rsvp' : 'wish', payload);
      } catch { if (msg) msg.textContent = say('sendFail'); }
      btn && (btn.disabled = false);
    });
  }

  root.querySelectorAll('form[data-sh=rsvp]').forEach(form => {
    const attend = () => (form.elements.attend?.value || 'Có') === 'Có';
    const sync = () => form.querySelectorAll('[data-when-attend]').forEach(el => { el.hidden = !attend(); });
    form.addEventListener('change', sync); sync();
    bindForm(form, fd => {
      const evs = attend() ? fd.getAll('ev').map(i => ctx.data.events[+i]).filter(Boolean) : [];
      const out = { type: 'rsvp', name: String(fd.get('name') || '').trim(), attend: fd.get('attend') || 'Có', guests: fd.get('guests') || '1', side: fd.get('side') || '', gid: guestId(), events: evs.join('; '), note: String(fd.get('note') || '').trim() };
      const wish = String(fd.get('wish') || '').trim();
      if (wish) out.wish = wish;
      return out;
    }, x => say(x.attend === 'Có' ? 'thanksYes' : 'thanksNo', { name: x.name }));
  });

  root.querySelectorAll('form[data-sh=wish]').forEach(form => bindForm(form,
    fd => ({ type: 'wish', name: String(fd.get('name') || '').trim(), message: String(fd.get('message') || '').trim() }),
    x => { form.elements.message.value = ''; ctx.wishes.unshift({ name: x.name, message: x.message }); ctx.emit('wishes', ctx.wishes); return say('thanksWish'); }));

  // Danh sách lời chúc: mỗi lời chúc là .sh-wish > b + p (mẫu trang trí bằng CSS, hoặc nghe ctx.on('wishes'))
  const lists = [...root.querySelectorAll('[data-sh=wishes]')];
  const renderWishes = list => lists.forEach(el => {
    el.textContent = '';
    if (!list.length) { const p = document.createElement('p'); p.className = 'sh-empty'; p.textContent = el.dataset.empty || ''; el.append(p); return; }
    for (const w of list.slice(0, 60)) {
      const item = document.createElement('div'); item.className = 'sh-wish';
      const b = document.createElement('b'); b.textContent = w.name;
      const p = document.createElement('p'); p.textContent = w.message;
      item.append(b, p); el.append(item);
    }
  });
  ctx.on('wishes', renderWishes);

  // Đếm ngược
  const cds = [...root.querySelectorAll('[data-sh=countdown]')];
  if (cds.length) {
    const tick = () => cds.forEach(el => {
      const ms = Date.parse(el.dataset.target) - Date.now();
      if (Number.isNaN(ms) || ms <= 0) { el.textContent = el.dataset.done || ''; el.classList.add('is-done'); return; }
      const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
      el.querySelectorAll('[data-u]').forEach(b => { const s = pad(v[+b.dataset.u]); if (b.textContent !== s) b.textContent = s; });
    });
    tick(); setInterval(tick, 1000);
  }

  // Ngăn kéo Thông tin nhanh (dialog gốc của trình duyệt: có sẵn bẫy focus, phím Esc)
  const dlg = root.querySelector('#sh-quick');
  root.querySelectorAll('[data-sh=quick-open]').forEach(b => b.addEventListener('click', () => dlg?.showModal?.()));
  dlg?.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-sh=quick-close]')) dlg.close(); });

  // Nút nổi ẩn khi khách cuộn xuống đọc (không che chữ), hiện lại khi cuộn lên hoặc dừng ở cuối trang
  const qb = root.querySelector('.sh-quick-btn');
  if (qb) {
    let last = scrollY, ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY, atEnd = y + innerHeight >= document.documentElement.scrollHeight - 40;
        if (Math.abs(y - last) > 6) qb.classList.toggle('is-away', y > last && y > 120 && !atEnd);
        last = y; ticking = false;
      });
    }, { passive: true });
  }
}
