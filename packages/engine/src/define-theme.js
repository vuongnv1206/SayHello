// Hợp đồng khai báo một mẫu thiệp.
//
// Mẫu tự chọn cách đi qua thiệp (layout), chia thành các cảnh,
// mỗi cảnh nói rõ nó hiển thị tính năng nào (provides). Thông tin bắt buộc (ngày, địa điểm, xác nhận)
// vì thế nằm trong ẩn dụ của mẫu, còn core chỉ kiểm tra đủ hay thiếu.

export const LAYOUTS = ['scroll', 'pager', 'stage', 'hub', 'chat', 'folio', 'lookbook', 'deck', 'split', 'custom'];
export const TIERS = ['basic', 'premium', 'cinematic'];
export const SCENE_KINDS = ['gate', 'content', 'finale'];
// Tính năng mà khách cần. 'required' nghĩa là thiệp phải có chỗ cho nó, nếu mẫu quên thì core chèn ngăn kéo mặc định.
export const FEATURES = ['when', 'where', 'map', 'rsvp', 'guestbook', 'gift', 'album', 'story', 'music', 'countdown'];
const MOTION_LEVELS = ['cinematic', 'standard', 'lite'];

const fail = (id, msg) => { throw new TypeError(`Mẫu "${id ?? '?'}": ${msg}`); };
const isFn = f => typeof f === 'function';

function normalizeTopic(t, id, idx, kind = 'topics') {
  if (!t || typeof t !== 'object' || !t.id) fail(id, `${kind}[${idx}] thiếu id`);
  const vars = t.vars && typeof t.vars === 'object' ? Object.freeze({ ...t.vars }) : undefined;
  const swatch = Array.isArray(t.swatch) ? Object.freeze([...t.swatch]) : undefined;
  return Object.freeze({
    ...t,
    ...(vars ? { vars } : {}),
    ...(swatch ? { swatch } : {}),
  });
}

function normalizeMoment(m, id) {
  if (m == null) return null;
  if (typeof m !== 'object' || !m.id) fail(id, 'moment cần có id');
  if (m.durationMs != null && (typeof m.durationMs !== 'number' || m.durationMs < 0)) {
    fail(id, 'moment.durationMs phải là số không âm');
  }
  return Object.freeze({ ...m });
}

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

  const rawLayout = def.layout ?? 'scroll';
  const layout = typeof rawLayout === 'object' && rawLayout !== null ? rawLayout.id : rawLayout;
  if (!LAYOUTS.includes(layout)) fail(id, `layout "${layout}" không hợp lệ (${LAYOUTS.join(', ')})`);
  const layoutSpec = Object.freeze(typeof rawLayout === 'object' && rawLayout !== null ? { ...rawLayout } : { id: layout });

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

  const topics = Array.isArray(def.topics) ? Object.freeze(def.topics.map((t, i) => normalizeTopic(t, id, i, 'topics'))) : undefined;
  const palettes = Array.isArray(def.palettes)
    ? Object.freeze(def.palettes.map((p, i) => normalizeTopic(p, id, i, 'palettes')))
    : (topics ? topics : undefined);
  const moment = normalizeMoment(def.moment, id);

  return Object.freeze({
    ...def,
    layout,
    layoutSpec,
    tier,
    voice: def.voice ?? 'than-mat',
    ...(topics ? { topics } : {}),
    ...(palettes ? { palettes } : {}),
    ...(moment ? { moment } : {}),
    scenes: Object.freeze(scenes),
    features: Object.freeze(features),
    slots: Object.freeze({ ...(def.slots || {}) }),
    fallback: Object.freeze(fallback),
  });
}

/**
 * Kết hợp mô-đun Layout × danh sách Topic × Signature Moment thành một mẫu thiệp hoàn chỉnh đã kiểm chuẩn.
 */
export function composeInvitation(spec) {
  if (!spec || typeof spec !== 'object') throw new TypeError('composeInvitation cần một object');
  const { layout: layoutInput, topics, moment, gate, scenes: extraScenes, ...rest } = spec;
  const layoutObj = typeof layoutInput === 'object' && layoutInput !== null ? layoutInput : { id: layoutInput };
  const baseScenes = Array.isArray(layoutObj.scenes) ? layoutObj.scenes : [];
  const mergedScenes = [
    ...(gate ? [gate] : []),
    ...baseScenes,
    ...(Array.isArray(extraScenes) ? extraScenes : []),
  ];
  return defineTheme({
    ...rest,
    layout: layoutObj,
    topics: Array.isArray(topics) ? topics : rest.topics,
    moment: moment ?? rest.moment,
    scenes: mergedScenes,
  });
}

export const composeTheme = composeInvitation;
