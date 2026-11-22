# Nhạc nền

| File | Không khí | Hợp với |
|---|---|---|
| `hop-nhac.mp3` | Hộp nhạc trong trẻo, vòng hòa âm kiểu Canon | Vé Máy Bay, thiệp trẻ trung |
| `dao-buoc.mp3` | Piano nhịp valse nhẹ nhàng | Thư Tay, thiệp lãng mạn |
| `binh-minh.mp3` | Nền ấm + piano thưa, chậm rãi | Song Hỷ, thiệp trang trọng |

Cả 3 bài do dự án **tự sáng tác và tổng hợp bằng code** (`scripts/tao-nhac.py`), không dùng mẫu âm thanh của ai, nên dùng thoải mái cho thiệp bán ra.

Dùng: trong `invite.json` ghi `"music": "../assets/music/dao-buoc.mp3"`.

**Cặp đôi muốn bài riêng:** đặt file mp3 vào thư mục thiệp (vd. `ten-cap-doi/nhac.mp3`) rồi ghi `"music": "nhac.mp3"`. Nén còn khoảng 1–3MB (`ffmpeg -i vao.mp3 -b:a 96k -ac 1 nhac.mp3`). Nhắc cặp đôi chỉ dùng bài họ có quyền sử dụng.

**Muốn thêm nhạc có sẵn:** chỉ lấy từ nguồn cho phép dùng thương mại không cần ghi công, ví dụ thư viện nhạc của Pixabay. Ghi nguồn vào bảng trên.
