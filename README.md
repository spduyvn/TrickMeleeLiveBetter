# Sống Tốt Hơn

Khung website kiến thức thực tiễn dành cho độc giả Việt Nam. Dự án tham khảo các chủ đề về sức khỏe, tài chính, thời gian, an toàn, pháp luật, quan hệ và chất lượng sống; mỗi nội dung cần được biên soạn, kiểm chứng nguồn và đặt trong bối cảnh áp dụng cụ thể tại Việt Nam.

Tài liệu Trung Quốc có trong `sources/` là tài liệu tham khảo ban đầu để định hướng chủ đề, không phải nội dung mặc định để dịch hoặc xuất bản. Nội dung hiện tại của website là khung và dữ liệu kiểm thử được gắn nhãn DEMO; chưa có bài kiến thức xác minh.

## Công nghệ và cấu trúc

- HTML, CSS và JavaScript thuần; Node.js chỉ dùng để build và preview local.
- Không dependency npm bên ngoài, backend, database hay API ngoài.
- Nội dung JSON trong `content/` được build thành static site dưới `dist/`.
- `src/`: trang và tài sản tĩnh; `scripts/`: build, preview; `docs/`: quy tắc và hướng dẫn; `sources/`: tài liệu nguồn hiện có.

## Yêu cầu

Node.js 20 trở lên và npm. Không cần cài package bên ngoài.

## Chạy local và build

```sh
npm run build
npm run preview
```

Mở URL local được lệnh preview in ra (mặc định `http://127.0.0.1:4173`). Dùng server preview thay vì mở HTML qua `file://`, vì danh mục/nội dung được tải bằng `fetch` từ JSON build.

Để build theo base path GitHub Pages (thay `song-tot-hon` bằng tên repository):

```sh
BASE_PATH=/song-tot-hon npm run build
```

PowerShell:

```powershell
$env:BASE_PATH='/song-tot-hon'; npm run build
```

Không đặt `BASE_PATH` khi website phục vụ ở domain root. Xóa dist rồi build lại cho môi trường mục tiêu.

## Deploy GitHub Pages

1. Chạy `npm run build` với `BASE_PATH=/<repository>`.
2. Deploy nội dung thư mục `dist/` lên GitHub Pages, bằng GitHub Actions hoặc công cụ publish thư mục tĩnh.
3. Thay URL mẫu `https://example.github.io/song-tot-hon/` trong canonical, Open Graph/sitemap/robots thành domain và repository thực tế trước khi phát hành.
4. Sau deploy, kiểm tra trang chủ, asset, JSON, trang danh mục/bài viết và sitemap dưới đường dẫn subpath.

Repo hiện chưa cấu hình workflow GitHub Actions tự động deploy; bước đó có thể được thêm khi biết tên repository/domain chính thức.

## Thêm nội dung

- Danh mục: `content/categories/categories.json`.
- Bài viết: `content/articles/*.json`.
- Nguồn tham khảo: `content/sources/sources.json` và nguồn gắn trực tiếp trong bài.
- Xem [`docs/CONTENT_SCHEMA.md`](docs/CONTENT_SCHEMA.md), [`docs/EDITORIAL_RULES.md`](docs/EDITORIAL_RULES.md), [`docs/SOURCE_POLICY.md`](docs/SOURCE_POLICY.md), [`docs/EVIDENCE_GRADING.md`](docs/EVIDENCE_GRADING.md), [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

Không tạo số liệu/nguồn giả. Thông tin pháp luật, y tế, giá, chính sách và dịch vụ cần nguồn đủ thẩm quyền, còn hiệu lực và đúng phạm vi. Nghiên cứu quốc tế phải ghi địa bàn, nhóm đối tượng, năm và giới hạn; không được trình bày thành dữ liệu Việt Nam. Khi chưa đủ căn cứ địa phương, để rõ tình trạng chờ xác minh và không đưa chỉ dẫn hành động thiếu căn cứ.

## SEO và kiểm thử

Trang có metadata title/description, Open Graph, canonical và sitemap/robots mẫu. Thay domain mẫu trước khi phát hành. Mục tiêu Lighthouse 90+ chưa được đo và không được xem là kết quả đạt.

Build có kiểm tra JSON, trường bắt buộc, ID duy nhất, danh mục và trạng thái bài viết. Không có test suite, lint hay kiểm thử browser tự động; cần kiểm tra thủ công navigation, tìm kiếm/bộ lọc, responsive, console và URL deploy trước khi phát hành.
