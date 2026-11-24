// Khối dùng chung dựng sẵn (chạy được trên máy chủ). Mẫu dùng nguyên hoặc tự vẽ markup riêng:
// dịch vụ phía trình duyệt chỉ cần form có data-sh="rsvp" / "wish" và các trường đúng tên dưới đây.
//   rsvp: name, attend (Có|Không), guests, side, ev (nhiều ô, chỉ số buổi lễ), note, wish
//   wish: name, message
import { html, br } from './html.js';
import { fmt } from './date.js';

// note/wish: false để bỏ ô ghi chú, ô lời chúc (mẫu có chỗ viết lời chúc riêng, form gọn còn ≤ 3 ô chính)
export function rsvpForm(ctx, { yes, no, submit, cls = '', maxGuests, sides, note = true, wish = true } = {}) {
  const { say, data: d, events } = ctx, r = d.rsvp || {};
  const max = maxGuests || r.maxGuests || 5;
  const sideList = sides || r.sides || ['Khách nhà trai', 'Khách nhà gái'];
  return html`
  <form class="sh-form ${cls}" data-sh="rsvp" novalidate>
    <label class="sh-field"><span>${say('namePh')}</span><input name="name" required maxlength="60" autocomplete="name" data-guest-value></label>
    <fieldset class="sh-choice"><legend class="sh-sr">${say('submitRsvp')}</legend>
      <label><input type="radio" name="attend" value="Có" checked><span>${yes || say('attendYes')}</span></label>
      <label><input type="radio" name="attend" value="Không"><span>${no || say('attendNo')}</span></label>
    </fieldset>
    <div class="sh-row" data-when-attend>
      <label class="sh-field"><span>Số người</span><select name="guests">${Array.from({ length: max }, (_, i) => html`<option value="${i + 1}">${i + 1} người${i + 1 === max ? ' trở lên' : ''}</option>`)}</select></label>
      <label class="sh-field"><span>${say('sideLabel')}</span><select name="side">${sideList.map(s => html`<option>${s}</option>`)}</select></label>
    </div>
    ${events.length > 1 && r.pickEvents !== false ? html`
    <fieldset class="sh-pick" data-when-attend><legend>${say('pickEvents')}</legend>
      ${events.map((e, i) => html`<label data-ev="${i}"><input type="checkbox" name="ev" value="${i}" checked><span>${e.title}</span></label>`)}
    </fieldset>` : ''}
    ${r.note !== false && note ? html`<label class="sh-field"><span>Ghi chú</span><input name="note" maxlength="160" placeholder="Ăn chay, đi cùng em bé, cần xe đưa đón…"></label>` : ''}
    ${wish ? html`<label class="sh-field"><span>Lời chúc (không bắt buộc)</span><textarea name="wish" maxlength="500" rows="2" placeholder="${say('wishPh')}"></textarea></label>` : ''}
    <button class="sh-btn" type="submit">${submit || say('submitRsvp')}</button>
    <p class="sh-msg" role="status" aria-live="polite"></p>
  </form>`;
}

export function wishForm(ctx, { submit, placeholder, cls = '' } = {}) {
  const { say } = ctx;
  return html`
  <form class="sh-form ${cls}" data-sh="wish" novalidate>
    <label class="sh-field"><span>${say('namePh')}</span><input name="name" required maxlength="60" autocomplete="name" data-guest-value></label>
    <label class="sh-field"><span>Lời chúc</span><textarea name="message" required maxlength="500" rows="3" placeholder="${placeholder || say('wishPh')}"></textarea></label>
    <button class="sh-btn" type="submit">${submit || say('submitWish')}</button>
    <p class="sh-msg" role="status" aria-live="polite"></p>
  </form>`;
}

// Danh sách lời chúc: trình duyệt đổ dữ liệu vào; mẫu tự trang trí .sh-wish
export const wishList = (ctx, { cls = '' } = {}) => html`<div class="sh-wishes ${cls}" data-sh="wishes" data-empty="${ctx.say('firstWish')}"></div>`;

// Đếm ngược: trình duyệt cập nhật các ô [data-u]
export const countdown = (ctx, { labels = ['Ngày', 'Giờ', 'Phút', 'Giây'], done } = {}) => html`
  <div class="sh-cd" data-sh="countdown" data-target="${ctx.date}" data-done="${done || ctx.say('countdownDone')}" role="timer">
    ${labels.map((l, i) => html`<div class="u"><b data-u="${i}">00</b><span>${l}</span></div>`)}
  </div>`;

// Ngăn kéo "Thông tin nhanh": luôn có trên mọi thiệp, kể cả mẫu lạ nhất. Người lớn tuổi, trình đọc màn hình
// và người bật giảm chuyển động vẫn xem được giờ, đường đi và xác nhận ngay.
export function quickInfo(ctx, { rsvpScene } = {}) {
  const { say, events, places, names } = ctx;
  return html`
  <button class="sh-quick-btn" type="button" data-sh="quick-open" aria-haspopup="dialog" aria-controls="sh-quick">${say('quickInfo')}</button>
  <dialog class="sh-quick" id="sh-quick" aria-labelledby="sh-quick-t">
    <div class="sh-quick-in">
      <header><h2 id="sh-quick-t">${say('quickTitle')}</h2><button type="button" class="sh-x" data-sh="quick-close" aria-label="${say('close')}">×</button></header>
      <p class="sh-quick-names">${names.pair}</p>
      <ul class="sh-quick-events">
        ${events.map((e, i) => html`<li data-ev="${i}">
          <b>${e.title}</b>
          <span>${fmt.full(e.date)}</span>
          ${e.lunar ? html`<span class="sh-dim">${e.lunar}</span>` : ''}
          ${e.venue ? html`<span>${e.venue}</span>` : ''}
          ${e.address ? html`<span class="sh-dim">${br(e.address)}</span>` : ''}
          <span class="sh-links">${e.gcal ? html`<a href="${e.gcal}" target="_blank" rel="noopener">${say('addCalendar')}</a>` : ''}</span>
        </li>`)}
      </ul>
      ${places.length ? html`<p class="sh-links">${places.map(p => html`<a href="${p.url}" target="_blank" rel="noopener">${say('openMap')}: ${p.label}</a>`)}</p>` : ''}
      ${rsvpScene ? html`<a class="sh-btn" href="#${rsvpScene}" data-sh="quick-close">${say('submitRsvp')}</a>` : rsvpForm(ctx, { cls: 'sh-quick-rsvp' })}
    </div>
  </dialog>`;
}
