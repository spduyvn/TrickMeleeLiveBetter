# Sống Tốt Hơn

Website cẩm nang kiến thức thực tiễn dành cho độc giả Việt Nam, bao quát các chủ đề sức khỏe, tài chính, thời gian, an toàn, pháp luật, quan hệ, phát triển bản thân và chất lượng sống. Mỗi bài viết trình bày tóm tắt, chi phí, lợi ích, rủi ro, mức độ bằng chứng (`A`/`B`/`C`) và nguồn tham khảo để đối chiếu theo bối cảnh Việt Nam.

## Công nghệ và cấu trúc

- HTML, CSS và JavaScript thuần; Node.js (>= 20) dùng để kiểm tra dữ liệu, build static site và chạy máy chủ quản trị cục bộ.
- Không phụ thuộc package npm bên ngoài.
- Dữ liệu nguồn tại `content/categories/`, `content/articles/` và `content/sources/`.
- Giao diện người đọc song song:
  - `/` — Giao diện Thư viện.
  - `/guide/` — Giao diện Tra cứu nhanh đa chiều (lọc theo đối tượng, bằng chứng, chi phí, thời gian, công sức, tủ bài cá nhân, checklist thực hành, công cụ tính nhanh VND và hỗ trợ PWA offline).
  - `/bai-viet/<slug>/` — Các trang HTML tĩnh pre-rendered chuẩn SEO (Open Graph, JSON-LD, `sitemap.xml`).
- Giao diện quản trị `/admin/` (được bảo vệ bằng đăng nhập tài khoản cục bộ hoặc GitHub Fine-grained PAT trên GitHub Pages).

## Lệnh sử dụng

```sh
npm run validate      # Kiểm tra ID/slug duy nhất và đồng bộ content/sources/sources.json
npm run build         # Build static site vào dist/ (gồm catalog-index.json, các trang /bai-viet/<slug>/ và sitemap.xml)
npm run preview       # Xem thử bản build tại http://127.0.0.1:4173
npm run admin:setup   # Tạo tài khoản Admin local (.admin-auth.json, đã được gitignore)
npm run admin         # Chạy server Admin local tại http://127.0.0.1:4174/admin/
npm run check:links   # Kiểm tra liên kết nguồn tham khảo trong content/sources/sources.json
```

Build cho GitHub Pages (subpath `/TrickMeleeLiveBetter`):

```sh
BASE_PATH=/TrickMeleeLiveBetter npm run build
```

PowerShell:

```powershell
$env:BASE_PATH='/TrickMeleeLiveBetter'; node scripts/build.js
```

## Tự động hóa & Deploy (GitHub Actions)

- `.github/workflows/pages.yml`: tự động chạy `node scripts/sync-sources-and-validate.js`, build `dist/` với `BASE_PATH=/TrickMeleeLiveBetter` và deploy lên GitHub Pages khi push lên `main`.
- `.github/workflows/check-links.yml`: kiểm tra định kỳ các URL nguồn tham khảo hằng tuần và xuất báo cáo trong Actions.
- Thư mục `dist/` được build tự động trên CI và được bỏ qua trong `.gitignore`.

## Quy chuẩn biên tập

- Xem [`docs/CONTENT_SCHEMA.md`](docs/CONTENT_SCHEMA.md), [`docs/EDITORIAL_RULES.md`](docs/EDITORIAL_RULES.md), [`docs/SOURCE_POLICY.md`](docs/SOURCE_POLICY.md), [`docs/EVIDENCE_GRADING.md`](docs/EVIDENCE_GRADING.md), [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).
- Không tạo số liệu hay nguồn giả; luôn phân biệt dữ liệu quốc tế và thực tế áp dụng tại Việt Nam.
