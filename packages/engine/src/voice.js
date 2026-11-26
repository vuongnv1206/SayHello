// Lời văn của phần dùng chung theo giọng của mẫu. Mẫu khai báo voice: 'than-mat' (bạn / chúng mình, mặc định)
// hoặc 'trang-trong' (quý khách / chúng tôi), và ghi đè từng câu bằng voiceText. {name} được thay bằng tên khách.
export const VOICES = {
  'than-mat': {
    guest: 'bạn',
    namePh: 'Tên của bạn',
    sideLabel: 'Bạn là khách của',
    pickEvents: 'Bạn dự buổi nào?',
    attendYes: 'Mình sẽ đến',
    attendNo: 'Tiếc quá, mình bận',
    submitRsvp: 'Gửi xác nhận',
    thanksYes: 'Cảm ơn {name}! Hẹn gặp bạn trong ngày vui!',
    thanksNo: 'Cảm ơn {name} đã báo cho chúng mình. Hẹn gặp bạn dịp khác nhé!',
    thanksWish: 'Cảm ơn lời chúc của bạn!',
    wishPh: 'Lời chúc gửi cô dâu chú rể…',
    submitWish: 'Gửi lời chúc',
    sending: 'Đang gửi…',
    sendFail: 'Gửi chưa được, bạn thử lại giúp chúng mình nhé.',
    countdownDone: 'Chúng mình đã về chung một nhà',
    firstWish: 'Hãy là người đầu tiên gửi lời chúc nhé!',
    quickInfo: 'Thông tin nhanh',
    quickTitle: 'Thông tin & xác nhận',
    openMap: 'Chỉ đường',
    addCalendar: 'Lưu vào lịch',
    close: 'Đóng',
  },
  'trang-trong': {
    guest: 'quý khách',
    namePh: 'Tên của quý khách',
    sideLabel: 'Quý khách là khách của',
    pickEvents: 'Quý khách dự buổi nào?',
    attendYes: 'Sẽ tham dự',
    attendNo: 'Rất tiếc, không thể',
    submitRsvp: 'Gửi xác nhận',
    thanksYes: 'Cảm ơn {name}! Hẹn gặp quý khách trong ngày vui!',
    thanksNo: 'Cảm ơn {name} đã phản hồi. Hẹn gặp quý khách vào dịp khác!',
    thanksWish: 'Cảm ơn lời chúc của quý khách!',
    wishPh: 'Lời chúc gửi cô dâu chú rể…',
    submitWish: 'Gửi lời chúc',
    sending: 'Đang gửi…',
    sendFail: 'Gửi chưa thành công, quý khách vui lòng thử lại.',
    countdownDone: 'Chúng tôi đã về chung một nhà',
    firstWish: 'Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!',
    quickInfo: 'Thông tin nhanh',
    quickTitle: 'Thông tin & xác nhận',
    openMap: 'Chỉ đường',
    addCalendar: 'Lưu vào lịch',
    close: 'Đóng',
  },
};

export function createVoice(voice = 'than-mat', overrides = {}) {
  const dict = { ...(VOICES[voice] || VOICES['than-mat']), ...overrides };
  return (key, vars = {}) => String(dict[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
