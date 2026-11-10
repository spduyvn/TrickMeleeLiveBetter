const BASE = document.querySelector('link[href*="/assets/styles.css"]')?.getAttribute('href')?.replace(/\/assets\/styles\.css$/, '') || '';
const state = { categories: [], articles: [], query: '', category: '', status: '', sort: 'title' };
const normalize = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function renderCategories() {
  const list = document.querySelector('#category-list');
  const filter = document.querySelector('#filter-category');
  list.innerHTML = state.categories.map((category) => `
    <a class="category-card" href="${BASE}/category/?id=${encodeURIComponent(category.id)}">
      <span class="category-index">${escapeHtml(category.number)}</span><h3>${escapeHtml(category.name)}</h3>
      <p>${escapeHtml(category.description)}</p><span class="category-count">${category.article_count || 0} bài viết</span>
    </a>`).join('');
  filter.insertAdjacentHTML('beforeend', state.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join(''));
}

function renderArticles() {
  const list = document.querySelector('#article-list');
  const empty = document.querySelector('#empty-state');
  const categoryNames = Object.fromEntries(state.categories.map((item) => [item.id, item.name]));
  let articles = state.articles.filter((article) => {
    const haystack = normalize([article.title, article.description, ...(article.tags || []), categoryNames[article.category]].join(' '));
    return article.review_status !== 'draft' && (!state.query || haystack.includes(normalize(state.query))) && (!state.category || article.category === state.category) && (!state.status || article.review_status === state.status);
  });
  articles.sort((a, b) => state.sort === 'updated' ? String(b.last_updated || '').localeCompare(String(a.last_updated || '')) : a.title.localeCompare(b.title, 'vi'));
  document.querySelector('#result-count').textContent = `${articles.length} nội dung trong ${state.articles.length} mục đã lập hồ sơ. Bản nháp không phải kiến thức đã xác minh.`;
  empty.hidden = articles.length > 0;
  list.innerHTML = articles.map((article) => `<article class="article-card">
    <div class="article-meta"><span>${escapeHtml(categoryNames[article.category] || 'Chưa phân loại')}</span><span class="status status-${escapeHtml(article.review_status)}">${escapeHtml(article.status_label || article.review_status)}</span></div>
    <h3><a href="${BASE}/article/?id=${encodeURIComponent(article.id)}">${escapeHtml(article.title)}</a></h3>
    <p>${escapeHtml(article.description)}</p><div class="tag-list">${(article.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
  </article>`).join('');
}

async function init() {
  try {
    const response = await fetch(`${BASE}/data/catalog.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    state.categories = catalog.categories || [];
    state.articles = catalog.articles || [];
    renderCategories(); renderArticles();
  } catch (error) {
    document.querySelector('#category-list').innerHTML = '<p class="error-state">Không tải được danh mục. Hãy chạy website qua lệnh preview, không mở trực tiếp bằng file://.</p>';
    document.querySelector('#article-list').innerHTML = '<p class="error-state">Không tải được danh sách nội dung.</p>';
    console.error('Không thể tải dữ liệu website:', error);
  }
  const form = document.querySelector('.search-form');
  form.addEventListener('submit', (event) => event.preventDefault());
  document.querySelector('#search').addEventListener('input', (event) => { state.query = event.target.value.trim(); renderArticles(); document.querySelector('#search-status').textContent = `Đang hiển thị ${document.querySelectorAll('.article-card').length} kết quả.`; });
  document.querySelector('#filter-category').addEventListener('change', (event) => { state.category = event.target.value; renderArticles(); });
  document.querySelector('#filter-status').addEventListener('change', (event) => { state.status = event.target.value; renderArticles(); });
  document.querySelector('#sort-order').addEventListener('change', (event) => { state.sort = event.target.value; renderArticles(); });
  const toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => { const expanded = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!expanded)); document.querySelector('#primary-nav').classList.toggle('is-open', !expanded); });
}
init();
