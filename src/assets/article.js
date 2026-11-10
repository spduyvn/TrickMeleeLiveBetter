const base = document.querySelector('link[href*="/assets/styles.css"]')?.getAttribute('href')?.replace(/\/assets\/styles\.css$/, '') || '';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const values = (label, value) => {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return `<div><dt>${label}</dt><dd>Chưa cung cấp</dd></div>`;
  const text = Array.isArray(value) ? value.map(esc).join(', ') : esc(value);
  return `<div><dt>${label}</dt><dd>${text || 'Chưa cung cấp'}</dd></div>`;
};
(async () => {
  const response = await fetch(`${base}/data/catalog.json`); if (!response.ok) throw new Error('Không thể tải dữ liệu bài viết.');
  const catalog = await response.json(); const article = (catalog.articles || []).find((item) => item.id === new URLSearchParams(location.search).get('id'));
  const root = document.querySelector('#article-content');
  if (!article || article.review_status === 'draft') { root.innerHTML = '<section class="notice-panel"><p class="eyebrow">CHƯA XUẤT BẢN</p><h1>Nội dung này chưa sẵn sàng</h1><p>Bài viết đang ở trạng thái bản nháp hoặc không tồn tại. Không sử dụng dữ liệu DEMO như lời khuyên hay kiến thức đã xác minh.</p><a class="text-link" href="'+base+'/#kham-pha">Xem thư viện nội dung <span aria-hidden="true">→</span></a></section>'; return; }
  document.title = `${article.title} — Sống Tốt Hơn`;
  document.querySelector('meta[name="description"]').content = article.description;
  document.querySelector('meta[property="og:title"]').content = article.title;
  document.querySelector('meta[property="og:description"]').content = article.description;
  const bodyHtml = article.body ? article.body.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join('') : '<p>Nội dung chưa được biên soạn. Trang này chỉ hiển thị sau khi bài viết được thẩm định.</p>';
  const notesHtml = article.evidence_notes ? article.evidence_notes.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join('') : '<p>Chưa có đánh giá bằng chứng được công bố.</p>';
  root.innerHTML = `<header class="article-heading"><p class="eyebrow">${esc(article.category)}</p><h1>${esc(article.title)}</h1><p class="hero-copy">${esc(article.description)}</p><p class="article-meta"><span class="status status-${esc(article.review_status)}">${esc(article.status_label || article.review_status)}</span><span>${article.verified_at ? `Xác minh: ${esc(article.verified_at)}` : 'Ngày xác minh: chưa có'}</span></p></header><section class="metadata-panel"><h2>Thông tin áp dụng</h2><dl class="metadata-grid">${values('Thẻ', article.tags)}${values('Chi phí', article.cost)}${values('Thời lượng đọc', article.reading_time)}${values('Thời gian áp dụng', article.time)}${values('Công sức', article.effort)}${values('Lợi ích', article.benefits)}${values('Rủi ro', article.risks)}${values('Đối tượng phù hợp', article.target_groups)}<div><dt>Mức độ giá trị</dt><dd>${esc(article.value_level || 'Chưa đánh giá')}</dd></div><div><dt>Mức độ bằng chứng</dt><dd>${esc(article.evidence_level || 'Chưa đánh giá')}</dd></div></dl></section><section class="article-body"><h2>Nội dung</h2>${bodyHtml}<h2>Bằng chứng và giới hạn</h2>${notesHtml}<h2>Nguồn tham khảo</h2><ul>${(article.sources || []).map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a> — ${esc(source.organization)}, ${esc(source.country)}; công bố: ${esc(source.published_at || 'không rõ')}; truy cập: ${esc(source.accessed_at || 'không rõ')}</li>`).join('') || '<li>Chưa có nguồn được ghi nhận.</li>'}</ul><p class="article-meta">Cập nhật lần cuối: ${esc(article.last_updated || 'Chưa cập nhật')}</p></section>`;
})().catch((error) => { document.querySelector('#article-content').innerHTML = `<p class="error-state">${esc(error.message)}</p>`; });
