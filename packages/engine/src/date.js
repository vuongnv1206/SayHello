// Ngày giờ kiểu Việt Nam. Đọc giờ địa phương ghi trong chuỗi ISO (không đổi theo múi giờ của máy chủ hay máy khách),
// nên máy chủ dựng HTML và trình duyệt luôn ra cùng một kết quả.
const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function parts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || '');
  if (!m) return null;
  const [y, mo, d, h = '00', mi = '00'] = m.slice(1);
  const wd = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
  return { y: +y, mo: +mo, d: +d, h, mi, dd: d, mm: mo, wd, weekday: WD[wd] };
}

export const fmt = {
  dots: iso => { const p = parts(iso); return p ? `${p.dd} · ${p.mm} · ${p.y}` : ''; },
  short: iso => { const p = parts(iso); return p ? `${p.dd}.${p.mm}.${p.y}` : ''; },
  long: iso => { const p = parts(iso); return p ? `${p.weekday} · ${p.d} tháng ${p.mo} năm ${p.y}` : ''; },
  time: iso => { const p = parts(iso); return p ? `${p.h}:${p.mi}` : ''; },
  full: iso => { const p = parts(iso); return p ? `${p.h}:${p.mi} · ${p.weekday}, ${p.dd}/${p.mm}/${p.y}` : ''; },
};

// Link "Thêm vào Google Calendar" cho một buổi lễ (mặc định dài 3 giờ)
export function gcalUrl({ title, date, place = '', details = '' }) {
  const start = new Date(date);
  if (Number.isNaN(+start)) return '';
  const end = new Date(+start + 3 * 3600e3);
  const z = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${z(start)}/${z(end)}`, location: place, details });
  return 'https://calendar.google.com/calendar/render?' + q;
}
