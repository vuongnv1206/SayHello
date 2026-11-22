// Nội dung thiệp = invite.json (người bán soạn) + phần cặp đôi tự sửa trong Studio (lưu ở Google Sheets).
// Cặp đôi chỉ sửa được các trường trong EDITABLE; ảnh, sheetUrl, slug luôn lấy từ invite.json.
// Nhạc: chỉ chọn được bài trong assets/music/, file .mp3 trong thư mục thiệp, hoặc 'none' (tắt nhạc).
import { merge } from './util.js';

export const EDITABLE = ['theme', 'groom', 'bride', 'order', 'date', 'city', 'families', 'events', 'places', 'story', 'texts', 'sections', 'effects', 'accounts', 'rsvp', 'music'];
const MUSIC_OK = /^(none|\.\.\/assets\/music\/[a-z0-9-]+\.mp3|[a-z0-9-]+\.mp3)$/;

export function pickEditable(obj) {
  const out = {};
  for (const k of EDITABLE) if (obj && obj[k] !== undefined) out[k] = obj[k];
  if (out.music !== undefined && !MUSIC_OK.test(out.music)) delete out.music;
  return out;
}

const params = new URLSearchParams(location.search);
export const inStudio = params.get('studio') === '1' && window.parent !== window;

// Trong Studio: trang thiệp xin dữ liệu từ khung cha, rồi dựng bằng dữ liệu đó (chưa lưu cũng xem được)
function fromStudio() {
  return new Promise(res => {
    addEventListener('message', function on(e) {
      if (e.origin !== location.origin || e.data?.type !== 'sayhello:data') return;
      removeEventListener('message', on); res(e.data.invite);
    });
    parent.postMessage({ type: 'sayhello:ready' }, location.origin);
  });
}

// Đọc phần cặp đôi đã lưu; chờ tối đa 2.5 giây để thiệp không bị treo nếu mạng chậm
async function savedEdits(sheetUrl, slug) {
  if (!sheetUrl || !slug || params.get('goc') === '1') return null;
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 2500);
  try {
    const u = sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + new URLSearchParams({ invite: slug, type: 'content' });
    const d = await (await fetch(u, { signal: ctl.signal })).json();
    return d && typeof d.content === 'object' ? d.content : null;
  } catch { return null; } finally { clearTimeout(t); }
}

export async function loadInvite() {
  const base = window.__INVITE__ || await (await fetch('invite.json', { cache: 'no-cache' })).json();
  if (inStudio) {
    const edits = await fromStudio();
    return noMusic(merge(base, pickEditable(edits)));
  }
  const edits = await savedEdits(base.sheetUrl, base.slug);
  return noMusic(edits ? merge(base, pickEditable(edits)) : base);
}

const noMusic = d => (d.music === 'none' && (d.music = ''), d);
