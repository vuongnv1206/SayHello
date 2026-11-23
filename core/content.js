// Nội dung thiệp = invite.json (người bán soạn) + phần cặp đôi tự sửa trong Studio (lưu ở Google Sheets).
// Cặp đôi chỉ sửa được các trường trong EDITABLE; sheetUrl, slug, ảnh xem trước luôn lấy từ invite.json.
// Nhạc: chỉ chọn được bài trong assets/music/, file .mp3 trong thư mục thiệp, hoặc 'none' (tắt nhạc).
// Ảnh: chỉ nhận ảnh trong thư mục thiệp (images/...) hoặc ảnh cặp đôi tải lên Google Drive của người bán qua Studio.
import { merge } from './util.js';

export const EDITABLE = ['theme', 'groom', 'bride', 'order', 'date', 'city', 'families', 'events', 'places', 'story', 'texts', 'sections', 'effects', 'accounts', 'rsvp', 'music', 'images', 'guestGroups', 'palette'];
const MUSIC_OK = /^(none|\.\.\/assets\/music\/[a-z0-9-]+\.mp3|[a-z0-9-]+\.mp3)$/;
export const IMAGE_OK = /^(images\/[\w.-]{1,80}|https:\/\/lh3\.googleusercontent\.com\/d\/[\w-]{10,120})$/;
export const IMAGE_SLOTS = ['hero', 'couple', 'groom', 'bride', 'band', 'portrait', 'thanks'];

// Lọc ảnh cặp đôi sửa: bỏ mọi đường dẫn lạ, giữ tối đa 30 ảnh album
export function cleanImages(im) {
  if (!im || typeof im !== 'object') return undefined;
  const out = {};
  for (const s of IMAGE_SLOTS) if (typeof im[s] === 'string' && IMAGE_OK.test(im[s])) out[s] = im[s];
  if (Array.isArray(im.album)) out.album = im.album.filter(x => typeof x === 'string' && IMAGE_OK.test(x)).slice(0, 30);
  if (Array.isArray(im.captions)) out.captions = im.captions.slice(0, 30).map(x => String(x ?? '').slice(0, 80));
  return out;
}

export function pickEditable(obj) {
  const out = {};
  for (const k of EDITABLE) if (obj && obj[k] !== undefined) out[k] = obj[k];
  if (out.music !== undefined && !MUSIC_OK.test(out.music)) delete out.music;
  if (out.palette !== undefined && !/^[a-z0-9-]{1,30}$/.test(out.palette)) delete out.palette;
  if (out.images !== undefined) out.images = cleanImages(out.images);
  if (out.images === undefined) delete out.images;
  return out;
}

const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
export const inStudio = typeof window !== 'undefined' && params.get('studio') === '1' && window.parent !== window;

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
