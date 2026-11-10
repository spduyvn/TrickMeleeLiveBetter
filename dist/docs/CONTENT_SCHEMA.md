# CONTENT_SCHEMA.md

Quy ước cho các tệp dữ liệu JSON trong `content/`. Một tệp bài viết chứa một mảng bản ghi; mỗi đối tượng là một bài. Dữ liệu được build thành JSON tĩnh để trang có thể tìm kiếm phía client.

## Bài viết

Tệp: `content/articles/*.json`.

| Trường | Kiểu | Bắt buộc | Định nghĩa |
|---|---|---:|---|
| `id` | string | Có | ID ổn định, duy nhất, ví dụ `article-001`; không đổi khi sửa tiêu đề. |
| `slug` | string | Có | Định danh URL chữ thường, dùng dấu gạch nối. |
| `title` | string | Có | Tiêu đề tiếng Việt rõ nghĩa, không khẳng định quá bằng chứng. |
| `description` | string | Có | Tóm tắt phạm vi bài viết. |
| `category` | string | Có | Một `id` trong `content/categories/categories.json`. |
| `tags` | string[] | Không | Chủ đề để tìm kiếm và lọc. |
| `reading_time` | string \| null | Không | Thời lượng đọc ước tính, ví dụ `5 phút`; không nhầm với thời gian áp dụng. |
| `cost`, `time`, `effort` | string \| number \| null | Không | Chi phí, thời gian áp dụng và công sức; nêu đơn vị, phạm vi, thời điểm nếu có. Không đoán dữ liệu. |
| `benefits`, `risks`, `target_groups` | string[] | Không | Lợi ích, rủi ro và nhóm đối tượng, có căn cứ và giới hạn phù hợp. |
| `value_level` | string \| null | Không | Đánh giá giá trị theo chính sách biên tập; ghi rõ cách đánh giá khi triển khai. |
| `evidence_level` | `A` \| `B` \| `C` \| null | Không | Mức độ tin cậy theo `docs/EVIDENCE_GRADING.md`, không phải mức phù hợp địa phương. |
| `evidence_notes` | string | Không | Phương pháp, độ nhất quán, giới hạn và mức phù hợp với người Việt Nam. |
| `body` | string | Không | Nội dung bài viết; hiện chỉ hiển thị dạng văn bản thuần, chưa hỗ trợ Markdown. |
| `sources` | Source[] | Không | Nguồn thực sự được dùng và có thể truy cập; không tạo placeholder giả. |
| `verified_at` | `YYYY-MM-DD` \| null | Không | Ngày rà soát/xác minh gần nhất, ghi rõ ý nghĩa của việc xác minh. |
| `review_status` | enum | Có | `draft`, `needs_review`, `verified`, `outdated`, `disputed`. `verified` chỉ sau khi rà soát theo quy định. |
| `status_label` | string | Không | Nhãn hiển thị tiếng Việt; nếu không có, dùng mã trạng thái. |
| `last_updated` | `YYYY-MM-DD` \| null | Không | Ngày nội dung thay đổi lần cuối. |

### Source

| Trường | Kiểu | Bắt buộc | Định nghĩa |
|---|---|---:|---|
| `title` | string | Có | Tên chính xác của tài liệu/trang. |
| `organization` | string | Có | Tác giả/tổ chức phát hành. |
| `url` | URL https | Có | URL nguồn trực tiếp, không phải đường dẫn tìm kiếm. |
| `country` | string | Có | Quốc gia/phạm vi địa lý của nguồn hoặc nghiên cứu. |
| `source_type` | string | Có | Văn bản nhà nước, hướng dẫn, tổng quan hệ thống, nghiên cứu gốc, v.v. |
| `published_at` | `YYYY-MM-DD` \| null | Có | Ngày công bố nếu biết; nếu không, null. |
| `accessed_at` | `YYYY-MM-DD` \| null | Có | Ngày nhóm biên tập đã truy cập nguồn. |

## Danh mục

`content/categories/categories.json` là mảng đối tượng: `id` (ổn định), `number` (sắp xếp/hiển thị), `name`, `description`. `article_count` được build tự động và không ghi vào nguồn.

## Nguồn tham khảo dùng chung

`content/sources/sources.json` là mảng các đối tượng Source như bảng trên. Danh mục nguồn dùng chung không thay việc gắn nguồn cụ thể vào từng bài viết.

## Trạng thái xuất bản

- `draft`: bản nháp hoặc demo; không phải kiến thức đã xác minh và không hiển thị như bài đã xuất bản.
- `needs_review`: cần rà soát chuyên môn/biên tập trước khi công bố.
- `verified`: đã qua quy trình rà soát; vẫn có phạm vi và hạn chế.
- `outdated`: có thể lỗi thời; cần cập nhật trước khi tiếp tục dùng.
- `disputed`: có bất đồng đáng kể giữa nguồn; trình bày bất định.

## Mẫu

```json
[
  {
    "id": "demo-article-001",
    "slug": "demo-chua-xuat-ban",
    "title": "DEMO — Nội dung chưa xuất bản",
    "description": "Mẫu schema, không phải lời khuyên đã xác minh.",
    "category": "health",
    "tags": ["DEMO"],
    "cost": null,
    "reading_time": null,
    "time": null,
    "effort": null,
    "benefits": [],
    "risks": [],
    "target_groups": [],
    "value_level": null,
    "evidence_level": null,
    "evidence_notes": "",
    "body": "",
    "sources": [],
    "verified_at": null,
    "review_status": "draft",
    "last_updated": null
  }
]
```
