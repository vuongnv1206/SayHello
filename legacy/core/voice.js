// Lời văn của phần dùng chung (form, đếm ngược, hộp cảm ơn) theo giọng của mẫu thiệp.
// Mẫu khai báo `voice: 'trang-trong'` (quý khách / chúng tôi) hoặc để mặc định 'than-mat' (bạn / chúng mình),
// và có thể ghi đè từng câu bằng `voiceText: { key: '...' }`. Câu có {name} sẽ được thay bằng tên khách.
const VOICES = {
  'than-mat': {
    namePh: 'Tên của bạn',
    sideLabel: 'Bạn là khách của',
    pickEvents: 'Bạn dự buổi nào?',
    thanksYes: 'Cảm ơn {name}! Hẹn gặp bạn trong ngày vui ❤',
    thanksNo: 'Cảm ơn {name} đã báo cho chúng mình. Hẹn gặp bạn dịp khác nhé!',
    thanksWish: 'Cảm ơn lời chúc của bạn ❤',
    sendFail: 'Gửi chưa được, bạn thử lại giúp chúng mình nhé.',
    countdownDone: 'Chúng mình đã về chung một nhà ❤',
    cheers: 'Lời chúc của bạn là món quà quý với chúng mình. Cùng nâng ly nào!',
    firstWish: 'Hãy là người đầu tiên gửi lời chúc nhé!',
  },
  'trang-trong': {
    namePh: 'Tên của quý khách',
    sideLabel: 'Quý khách là khách của',
    pickEvents: 'Quý khách dự buổi nào?',
    thanksYes: 'Cảm ơn {name}! Hẹn gặp quý khách trong ngày vui ❤',
    thanksNo: 'Cảm ơn {name} đã phản hồi. Hẹn gặp quý khách vào dịp khác!',
    thanksWish: 'Cảm ơn lời chúc của quý khách ❤',
    sendFail: 'Gửi chưa thành công, quý khách vui lòng thử lại.',
    countdownDone: 'Chúng tôi đã về chung một nhà ❤',
    cheers: 'Lời chúc của quý khách là món quà quý giá với chúng tôi. Xin mời cùng nâng ly chúc mừng!',
    firstWish: 'Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!',
  },
};

export function createVoice(theme = {}) {
  const base = VOICES[theme.voice] || VOICES['than-mat'];
  const dict = { ...base, ...(theme.voiceText || {}) };
  return (key, vars = {}) => String(dict[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}
