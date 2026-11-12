const base = document.querySelector('link[href*="/assets/styles.css"]')?.getAttribute('href')?.replace(/\/assets\/styles\.css$/, '') || '';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const params = new URLSearchParams(location.search);
(async () => {
  const [categoriesResponse, catalogResponse] = await Promise.all([
    fetch(`${base}/data/categories/categories.json`),
    fetch(`${base}/data/catalog-index.json`).then((r) => (r.ok ? r : fetch(`${base}/data/catalog.json`))),
  ]);
  if (!categoriesResponse.ok || !catalogResponse.ok) throw new Error('Không tải được dữ liệu danh mục.');
  const categories = await categoriesResponse.json(); const catalog = await catalogResponse.json();
  const category = categories.find((item) => item.id === params.get('id'));
  const title = document.querySelector('#category-title');
  if (!category) { title.textContent = 'Không tìm thấy danh mục'; document.querySelector('#category-description').textContent = 'Danh mục không tồn tại hoặc liên kết không hợp lệ.'; document.querySelector('#empty-state').hidden = false; return; }
  document.title = `${category.name} — Sống Tốt Hơn`; title.textContent = category.name;
  document.querySelector('meta[name="description"]').content = category.description;
  document.querySelector('#category-description').textContent = category.description;
  const articles = (catalog.articles || []).filter((article) => article.category === category.id && article.review_status !== 'draft');
  document.querySelector('#category-count').textContent = `${articles.length} bài viết đã xuất bản`;
  document.querySelector('#empty-state').hidden = articles.length > 0;
  document.querySelector('#article-list').innerHTML = articles.map((article) => `<article class="article-card"><div class="article-meta"><span>${esc(article.status_label || article.review_status)}</span></div><h3><a href="${base}/bai-viet/${encodeURIComponent(article.slug)}/">${esc(article.title)}</a></h3><p>${esc(article.description)}</p></article>`).join('');
})().catch((error) => { document.querySelector('#category-title').textContent = 'Chưa tải được danh mục'; document.querySelector('#category-description').textContent = error.message; });
