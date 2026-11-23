// Gửi và đọc dữ liệu khách (xác nhận, lời chúc). Pha 1: Google Sheets qua Apps Script (cùng định dạng bản 1,
// nên thiệp v2 dùng chung script đang chạy); Pha 2 thêm Supabase sau cùng giao diện này.
// Không có sheetUrl: lưu trên máy khách để thử thiệp, không gửi đi đâu.
export function createBackend({ sheetUrl = '', slug = 'thiep' } = {}) {
  const LS = 'sayhello:' + slug;
  const localGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
  const localAdd = d => { try { localStorage.setItem(LS, JSON.stringify([d, ...localGet()].slice(0, 200))); } catch {} };
  const url = params => sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams({ invite: slug, ...params });

  return {
    online: !!sheetUrl,
    async send(data) {
      if (!sheetUrl) {
        localAdd({ ...data, at: Date.now() });
        if (data.type === 'rsvp' && data.wish) localAdd({ type: 'wish', name: data.name, message: data.wish, at: Date.now() });
        return;
      }
      // text/plain để Apps Script không phải xử lý preflight CORS
      const r = await fetch(sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ invite: slug, ...data }) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
    },
    async wishes() {
      if (!sheetUrl) return localGet().filter(x => x.type === 'wish');
      try { const d = await (await fetch(url({ type: 'wishes' }))).json(); return Array.isArray(d) ? d : d.wishes || []; }
      catch { return []; }
    },
  };
}
