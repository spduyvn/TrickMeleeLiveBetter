# CONTRIBUTING.md

Cảm ơn bạn đã muốn đóng góp. Ưu tiên sửa lỗi, cải thiện khả năng truy cập, bổ sung nguồn gốc rõ ràng hoặc đề xuất nội dung có căn cứ.

## Phát triển website

- Cần Node.js 20 trở lên; không có dependency bên ngoài.
- Chạy `npm run build` để tạo static site trong `dist/`.
- Chạy `npm run preview` sau build rồi mở URL được in ra; server chỉ phục vụ local.
- Có thể kiểm tra GitHub Pages subpath bằng `BASE_PATH=/ten-repo npm run build` (PowerShell: `$env:BASE_PATH='/ten-repo'; npm run build`).

## Thêm danh mục

Sửa mảng trong `content/categories/categories.json`; `id` phải duy nhất, ổn định, chữ thường và chỉ dùng chữ/số/gạch nối. Mô tả ngắn, không biến tên danh mục thành khuyến nghị.

## Thêm bài viết

1. Thêm một tệp JSON trong `content/articles/`, chứa mảng một hoặc nhiều bài theo `docs/CONTENT_SCHEMA.md`.
2. Dùng ID duy nhất, slug ổn định, category ID đã tồn tại và một trong năm trạng thái hợp lệ.
3. Khi chưa có nội dung được kiểm chứng, giữ `review_status: "draft"`, ghi rõ DEMO nếu dùng để kiểm tra giao diện và không giả nguồn/số liệu.
4. Gắn nguồn thực sự đã đọc vào `sources`; kiểm tra ngày, thẩm quyền, phạm vi và bối cảnh Việt Nam theo `docs/SOURCE_POLICY.md`.
5. Xem lại nguyên tắc ở `docs/EDITORIAL_RULES.md` và `docs/EVIDENCE_GRADING.md`. Không tự gắn `verified` chỉ vì nội dung có trích dẫn.
6. Chạy `npm run build`, rồi kiểm tra trang trên preview desktop/mobile và link/console.

## Thêm nguồn

Thêm vào `content/sources/sources.json` theo Source schema. Nguồn dùng chung không thay việc gắn trích dẫn vào các bài thực sự sử dụng nó. Ghi URL trực tiếp và ngày truy cập thật; không tạo nguồn để lấp chỗ trống.

## Gửi thay đổi

Mô tả mục tiêu, file đã sửa, nguồn/căn cứ (nếu thay đổi nội dung), các kiểm tra đã chạy và điều còn hạn chế. Không bao gồm dữ liệu cá nhân hoặc nội dung có bản quyền không được phép chia sẻ.
