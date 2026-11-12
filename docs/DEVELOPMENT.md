# Hướng dẫn phát triển (Developer Guide)

Tài liệu này dành cho lập trình viên tham gia phát triển, vận hành, kiểm duyệt nội dung và triển khai dự án **Sống Tốt Hơn**.

> Nếu bạn là độc giả muốn đọc hoặc đóng góp bài viết, hãy xem [README.md](../README.md).

## 1. Công nghệ và cấu trúc dự án

- **Frontend**: HTML, CSS và JavaScript thuần (zero external npm dependencies).
- **Tooling**: Node.js (`>= 20`) dùng để kiểm tra dữ liệu, build static site, kiểm tra liên kết nguồn và chạy máy chủ quản trị cục bộ.
- **Dữ liệu nguồn**:
  - `content/categories/` — Danh mục chủ đề.
  - `content/articles/` — Các file JSON bài viết theo từng chủ đề.
  - `content/sources/` — Kho nguồn tham khảo chuẩn hóa (`sources.json`).
- **Mã nguồn giao diện (`src/`)**:
  - `src/index.html` — Giao diện Thư viện (`/`).
  - `src/guide/index.html` — Giao diện Tra cứu nhanh đa chiều (`/guide/`, lọc theo đối tượng, bằng chứng, chi phí, thời gian, công sức, tủ bài cá nhân, checklist thực hành, công cụ tính nhanh VND, hỗ trợ PWA offline).
  - `src/dong-gop/index.html` — Trang đóng góp bài viết cho độc giả (`/dong-gop/`).
  - `src/admin/index.html` — Giao diện quản trị & duyệt bài (`/admin/`).
  - `scripts/build.js` — Build static site vào `dist/`, sinh `data/catalog-index.json`, các trang HTML tĩnh SEO `/bai-viet/<slug>/` và `sitemap.xml`.

## 2. Các lệnh phát triển thường dùng

```sh
npm run validate      # Kiểm tra ID/slug duy nhất và đồng bộ content/sources/sources.json
npm run build         # Build static site vào dist/ (gồm catalog-index.json, /bai-viet/<slug>/ và sitemap.xml)
npm run preview       # Xem thử bản build tại http://127.0.0.1:4173
npm run admin:setup   # Tạo tài khoản Admin local (.admin-auth.json, đã được gitignore)
npm run admin         # Chạy server Admin local tại http://127.0.0.1:4174/admin/
npm run check:links   # Kiểm tra liên kết nguồn tham khảo trong content/sources/sources.json
```

### Build với `BASE_PATH` (GitHub Pages subpath `/TrickMeleeLiveBetter`)

- Bash / macOS / Linux:

```sh
BASE_PATH=/TrickMeleeLiveBetter npm run build
```

- PowerShell (Windows):

```powershell
$env:BASE_PATH='/TrickMeleeLiveBetter'; node scripts/build.js
```

## 3. Quản trị nội dung & duyệt bài đóng góp (`/admin/`)

Giao diện `/admin/` hỗ trợ 2 chế độ đăng nhập:
1. **Local Admin Server** (`npm run admin:setup` rồi `npm run admin` -> `http://127.0.0.1:4174/admin/`): thao tác trực tiếp lên file trong `content/articles/`.
2. **GitHub Pages + Fine-grained PAT**: đăng nhập bằng Personal Access Token có quyền `Contents: Read and write` (và `Issues: Read` nếu tải Issue đóng góp) để chỉnh sửa và commit trực tiếp lên nhánh `main`.

### Quy trình tiếp nhận bài đóng góp từ độc giả

1. Độc giả gửi bài qua `/dong-gop/` hoặc GitHub Issue template `.github/ISSUE_TEMPLATE/dong-gop-bai-viet.yml` (nhãn `article-submission`).
2. Trong `/admin/`, bấm nút **Nhập đóng góp**:
   - **Chế độ GitHub PAT**: bấm **Tải Issue đóng góp** để lấy danh sách Issue mở có nhãn `article-submission` và nạp tự động JSON vào khung nhập.
   - **Chế độ Local hoặc file từ ngoài GitHub**: chọn file `.json` hoặc dán JSON / block ````json ... ```` vào khung nhập.
3. Bài nhập vào sẽ tự động có `review_status: "needs_review"` (`Cần rà soát`) để biên tập viên kiểm tra lại nguồn, mức bằng chứng (`A`/`B`/`C`) và bối cảnh Việt Nam trước khi xuất bản.
4. Chạy `npm run validate` và `npm run build` để kiểm tra toàn bộ dữ liệu trước khi commit.

> Ghi chú tùy chọn: trong `src/assets/contribute.js`, hằng số `EXTERNAL_FORM_ENDPOINT` có thể cấu hình URL endpoint (như Formspree hoặc Cloudflare Worker) nếu muốn nhận bài trực tiếp từ độc giả không có tài khoản GitHub mà không cần tải file `.json`.

## 4. Tự động hóa & Deploy (GitHub Actions)

- `.github/workflows/pages.yml`: tự động chạy `node scripts/sync-sources-and-validate.js`, build `dist/` với `BASE_PATH=/TrickMeleeLiveBetter` và deploy lên GitHub Pages khi push lên `main`.
- `.github/workflows/check-links.yml`: kiểm tra định kỳ các URL nguồn tham khảo hằng tuần và xuất báo cáo trong Actions.
- Thư mục `dist/` được build tự động trên CI và được bỏ qua trong `.gitignore`.

## 5. Tài liệu quy chuẩn dữ liệu & biên tập

- [`docs/CONTENT_SCHEMA.md`](CONTENT_SCHEMA.md) — Cấu trúc JSON chuẩn của bài viết, danh mục và nguồn.
- [`docs/EDITORIAL_RULES.md`](EDITORIAL_RULES.md) — Quy tắc biên tập, văn phong và đối chiếu bối cảnh Việt Nam.
- [`docs/SOURCE_POLICY.md`](SOURCE_POLICY.md) — Chính sách trích dẫn nguồn tham khảo.
- [`docs/EVIDENCE_GRADING.md`](EVIDENCE_GRADING.md) — Thang phân loại mức độ bằng chứng (`A`, `B`, `C`).
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — Quy trình cộng tác & chuẩn hóa nội dung chi tiết.

