# TrickMeleeLiveBetter

Dự án Việt hóa tài liệu `高性价比人生指南` thành một trải nghiệm đọc dễ tiếp cận cho độc giả Việt Nam. Mục tiêu là giữ đúng ý nguyên tác, ghi chú riêng các đề xuất thích nghi và kiểm chứng các nội dung phụ thuộc vào luật hoặc bối cảnh Việt Nam.

## Trạng thái

Hiện repo có trang HTML tĩnh tại `index.html` và giao diện responsive trong `styles.css`, theo bố cục đọc với thanh tìm kiếm, mục lục bên trái và nội dung chính. Trang có phần giới thiệu, mục lục 34 chủ đề, bản địa hóa các mục 1–10 của chương 1 và các mục 1–20 chương 2; các nội dung Việt Nam chưa đủ căn cứ được đánh dấu chờ kiểm chứng. Bản Markdown chương 1 nằm tại `content/01-phong-tranh-rui-ro-som.md`, chương 2 tại `content/02-dung-chet-tu-tu.md`. Hai tài liệu tiếng Trung được lưu trong `sources/`. Họa tiết trống đồng được vẽ bằng SVG/CSS nội tuyến; tìm kiếm phía trình duyệt là JavaScript thuần, không phụ thuộc thư viện. Giao diện dùng Inter cho nội dung và Roboto cho tiêu đề, tải từ Google Fonts.

Quy trình làm nội dung và phát triển được hướng dẫn trong các skill:

- `.claude/skills/translate/SKILL.md` — dịch Trung–Việt, quản lý thuật ngữ và ghi chú biên tập.
- `.claude/skills/research-vn/SKILL.md` — nghiên cứu nguồn Việt Nam cho các điểm pháp lý, quy định và văn hóa.
- `.claude/skills/dev/SKILL.md` — quy ước triển khai website tĩnh nhẹ.

## Xem trang

Mở `index.html` trực tiếp trong trình duyệt. Không cần cài đặt dependencies hoặc chạy lệnh build.

## Deploy lên Vercel

Import repository vào Vercel, dùng thư mục gốc của repository làm Root Directory, để Framework Preset là **Other**, không đặt Build Command và đặt Output Directory là `.`. Đây là website tĩnh; không cần backend hay Vercel Functions.

## Nguyên tắc nội dung

- Bản địa hóa chương 1 trong `content/01-phong-tranh-rui-ro-som.md` có các mục 1–10; chương 2 trong `content/02-dung-chet-tu-tu.md` đã biên dịch các mục 1–20. Những mục tiếp theo chưa có trong bản dịch. Ngoài hai tài liệu lưu trong `sources/`, kho GitHub gốc [eternity4719/HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) là nguồn tham khảo cho README và các tệp `book/`; chương 2 có tại [`book/02-不要慢慢死.md`](https://github.com/eternity4719/HowToLiveBetter/blob/main/book/02-%E4%B8%8D%E8%A6%81%E6%85%A2%E6%85%A2%E6%AD%BB.md). Dùng các trang này để tra cứu nguyên tác, rồi kiểm tra độc lập mọi dữ kiện cần Việt hóa.
- Bản phát hành được địa phương hóa cho Việt Nam: luật, tiền tệ/giá, chính sách, dịch vụ công, số khẩn cấp, số liệu trong nước và thông tin phụ thuộc quốc gia phải thay bằng thông tin Việt Nam đã kiểm chứng.
- Không quy đổi máy móc nhân dân tệ sang đồng, không thay luật Trung Quốc bằng tên luật Việt Nam tương tự, và không đoán số điện thoại/chính sách Việt Nam. Nếu chưa tìm thấy căn cứ Việt Nam đủ tin cậy, đánh dấu “chưa xác minh tại Việt Nam” và bỏ hướng dẫn hành động không có căn cứ.
- Có thể dùng số liệu/nghiên cứu quốc tế cho những chủ đề ít có dữ liệu đáng tin cậy tại Việt Nam. Ghi rõ quốc gia/khu vực, nhóm đối tượng, năm, nguồn và giới hạn khả năng áp dụng; không trình bày chúng như số liệu hoặc khuyến nghị riêng cho Việt Nam. Với hướng dẫn hành động, pháp luật, chính sách và dịch vụ, vẫn cần căn cứ Việt Nam hoặc ghi rõ chưa xác minh. Nội dung y tế/pháp lý không thay thế tư vấn của chuyên gia.
