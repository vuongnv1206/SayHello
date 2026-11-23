// Hợp đồng khai báo một mẫu thiệp v2.
//
// Khác bản 1 (chỉ trả về {cover, main}): mẫu tự chọn cách đi qua thiệp (layout), chia thành các cảnh,
// mỗi cảnh nói rõ nó hiển thị tính năng nào (provides). Thông tin bắt buộc (ngày, địa điểm, xác nhận)
// vì thế nằm trong ẩn dụ của mẫu, còn core chỉ kiểm tra đủ hay thiếu.

export const LAYOUTS = ['scroll', 'pager', 'stage', 'hub', 'chat', 'custom'];
export const TIERS = ['basic', 'premium', 'cinematic'];
export const SCENE_KINDS = ['gate', 'content', 'finale'];
// Tính năng mà khách cần. 'required' nghĩa là thiệp phải có chỗ cho nó, nếu mẫu quên thì core chèn ngăn kéo mặc định.
export const FEATURES = ['when', 'where', 'map', 'rsvp', 'guestbook', 'gift', 'album', 'story', 'music', 'countdown'];
const MOTION_LEVELS = ['cinematic', 'standard', 'lite'];

const fail = (id, msg) => { throw new TypeError(`Mẫu "${id ?? '?'}": ${msg}`); };
const isFn = f => typeof f === 'function';

/**
 * Kiểm tra và chuẩn hoá khai báo mẫu. Trả về bản đã đóng băng (frozen) để core dùng.
 * Lỗi được báo ngay lúc nạp mẫu (và trong CI), không phải lúc khách đang xem thiệp.
 */
export function defineTheme(def) {
  if (!def || typeof def !== 'object') throw new TypeError('defineTheme cần một object');
  const { id } = def;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id || '')) fail(id, 'id phải là chữ thường không dấu, nối bằng gạch ngang');
  if (!def.name) fail(id, 'thiếu name');
  if (!/^\d+\.\d+\.\d+$/.test(def.version || '')) fail(id, 'version phải theo dạng 1.0.0');

  const layout = def.layout ?? 'scroll';
  if (!LAYOUTS.includes(layout)) fail(id, `layout "${layout}" không hợp lệ (${LAYOUTS.join(', ')})`);
  const tier = def.tier ?? 'basic';
  if (!TIERS.includes(tier)) fail(id, `tier "${tier}" không hợp lệ (${TIERS.join(', ')})`);

  if (!Array.isArray(def.scenes) || !def.scenes.length) fail(id, 'cần ít nhất một cảnh trong scenes');
  const seen = new Set();
  const scenes = def.scenes.map((s, i) => {
    const where = `cảnh #${i} (${s?.id ?? 'không tên'})`;
    if (!s?.id) fail(id, `${where} thiếu id`);
    if (seen.has(s.id)) fail(id, `trùng id cảnh "${s.id}"`);
    seen.add(s.id);
    const kind = s.kind ?? 'content';
    if (!SCENE_KINDS.includes(kind)) fail(id, `${where}: kind "${kind}" không hợp lệ`);
    if (!isFn(s.render)) fail(id, `${where} thiếu hàm render(ctx)`);
    if (s.mount != null && !isFn(s.mount)) fail(id, `${where}: mount phải là hàm`);
    const provides = s.provides ?? [];
    for (const f of provides) if (!FEATURES.includes(f)) fail(id, `${where}: provides "${f}" không có trong danh sách tính năng`);
    if (s.motion) {
      for (const k of Object.keys(s.motion)) if (!MOTION_LEVELS.includes(k)) fail(id, `${where}: motion chỉ nhận ${MOTION_LEVELS.join('/')}`);
      // Cảnh có chuyển động nặng phải có bản nhẹ cho máy yếu và người bật giảm chuyển động
      if (s.motion.cinematic && !s.motion.lite) fail(id, `${where}: có motion.cinematic thì phải có motion.lite`);
    }
    return Object.freeze({ ...s, kind, provides: Object.freeze([...provides]) });
  });
  const gates = scenes.filter(s => s.kind === 'gate');
  if (gates.length > 1) fail(id, 'chỉ được một cảnh gate (bìa)');
  if (gates.length && scenes[0].kind !== 'gate') fail(id, 'cảnh gate phải đứng đầu');

  const features = { when: 'required', where: 'required', rsvp: 'required', ...(def.features || {}) };
  for (const [k, v] of Object.entries(features)) {
    if (!FEATURES.includes(k)) fail(id, `features.${k} không có trong danh sách tính năng`);
    if (!['required', 'optional', 'off'].includes(v)) fail(id, `features.${k} phải là required/optional/off`);
  }
  const provided = new Set(scenes.flatMap(s => s.provides));
  // Tính năng bắt buộc mà không cảnh nào hiển thị: core sẽ chèn ngăn kéo "Thông tin & Xác nhận"
  const fallback = Object.entries(features).filter(([k, v]) => v === 'required' && !provided.has(k)).map(([k]) => k);

  return Object.freeze({
    ...def,
    layout, tier, voice: def.voice ?? 'than-mat',
    scenes: Object.freeze(scenes),
    features: Object.freeze(features),
    slots: Object.freeze({ ...(def.slots || {}) }),
    fallback: Object.freeze(fallback),
  });
}
