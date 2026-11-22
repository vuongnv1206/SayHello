// Kết nối Google Sheets qua Apps Script (xem backend/apps-script.gs).
// Không có sheetUrl: xác nhận và lời chúc chỉ lưu trên máy của chính khách (để thử thiệp).

export function createBackend(sheetUrl, slug) {
  const LS = 'sayhello:' + slug;
  const localGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch { return []; } };
  const localAdd = d => { try { localStorage.setItem(LS, JSON.stringify([d, ...localGet()].slice(0, 200))); } catch {} };
  const url = (params) => sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams({ invite: slug, ...params });

  async function post(data, opts = {}) {
    // text/plain để Apps Script không cần xử lý preflight CORS
    const r = await fetch(sheetUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ invite: slug, ...data }), ...opts });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  }

  return {
    online: !!sheetUrl,
    async send(data) {
      if (!sheetUrl) { localAdd({ ...data, at: Date.now() }); return; }
      await post(data);
    },
    async wishes() {
      if (!sheetUrl) return localGet().filter(x => x.type === 'wish');
      try { const d = await (await fetch(url({ type: 'wishes' }))).json(); return Array.isArray(d) ? d : d.wishes || []; }
      catch { return []; }
    },
    async hearts() {
      if (!sheetUrl) return null;
      try { const d = await (await fetch(url({ type: 'hearts' }))).json(); return typeof d.hearts === 'number' ? d.hearts : null; }
      catch { return null; }
    },
    sendHearts(n) { return post({ type: 'heart', n }, { keepalive: true }); },
    storageKey: LS,
  };
}
