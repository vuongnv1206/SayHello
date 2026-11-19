// Cấu hình thiệp - sửa ở đây, không cần đụng vào main.js
const CFG = {
  // Thời điểm Lễ Thành Hôn (giờ Việt Nam) - dùng cho đếm ngược và lịch
  weddingDate: '2026-11-29T10:30:00+07:00',
  // Ngày được đánh dấu phụ trên lịch (Lễ Ăn Hỏi)
  engagementDay: 27,

  // File nhạc nền (đặt cạnh index.html). Để trống '' thì tắt nhạc.
  music: 'nhac.mp3',

  // Link Web App của Google Apps Script (xem file google-apps-script.txt).
  // Để trống '' thì xác nhận và lời chúc chỉ lưu trên máy của chính khách.
  sheetUrl: 'https://script.google.com/macros/s/AKfycbyphrpMhvLRsq_iihwtmOFFhs33gdeaBoq0sQkmBCamapSOLyjWS6-w_NizRzTqlrWW/exec',

  // Địa điểm trên bản đồ. mapLink: dán link Google Maps chính xác nếu có.
  places: [
    {
      label: 'Nhà trai · Lễ Thành Hôn',
      address: 'Số nhà 16/03, Đường 02, Thôn Phú Trung, Xã Hoằng Phú, Tỉnh Thanh Hóa',
      // coords: tọa độ ghim trên bản đồ nhúng (lấy từ link Google Maps)
      coords: '19.895305,105.801960',
      mapLink: 'https://maps.app.goo.gl/jTJ4Uu1xrQWUJtT56'
    },
    {
      label: 'Nhà gái · Lễ Ăn Hỏi',
      address: 'Dốc Gũ, Thôn Cụ Thôn, Xã Lĩnh Toại, Tỉnh Thanh Hóa',
      coords: '19.984346,105.899734',
      mapLink: 'https://maps.app.goo.gl/Dc3jKhXnXt9fBgsx7'
    }
  ],

  // Tài khoản mừng cưới. Để mảng rỗng [] thì ẩn mục Hộp quà mừng.
  // qr: ảnh QR có sẵn. Nếu không có ảnh thì bỏ qr và điền bankCode để thiệp tự tạo QR
  // (mã ngân hàng theo vietqr.io: VCB, TCB, MB, BIDV, ICB, ACB, VPB, TPB...)
  // Ví dụ: { who: 'Chú rể', bank: 'Vietcombank', bankCode: 'VCB', number: '0123456789', name: 'LE VAN A' }
  accounts: [
    { who: 'Chú rể', qr: 'images/qr-chure2.jpg', bank: 'VietinBank', number: '108003061551', name: 'LE KHAC MINH THANG' },
    { who: 'Cô dâu', qr: 'images/qr.jpg', bank: 'MBBank', number: '0918172445', name: 'NGUYEN LINH TRANG' }
  ]
};
