const BASE = document.querySelector('link[href*="/assets/styles.css"]')?.getAttribute('href')?.replace(/\/assets\/styles\.css$/, '') || '';
const state = { categories: [], articles: [], query: '', category: '', status: '', sort: 'title', onlySaved: false, showRead: false, visibleLimit: 24 };
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
  const loadMoreWrap = document.querySelector('#load-more-wrap');
  const categoryNames = Object.fromEntries(state.categories.map((item) => [item.id, item.name]));
  const savedSet = window.STHReader ? window.STHReader.getSavedIds() : new Set();
  const readSet = window.STHReader ? window.STHReader.getReadIds() : new Set();

  const savedBtn = document.querySelector('#filter-saved');
  if (savedBtn) {
    savedBtn.textContent = `★ Đã lưu (${savedSet.size})`;
    savedBtn.setAttribute('aria-pressed', String(state.onlySaved));
  }

  const readBtn = document.querySelector('#filter-read');
  if (readBtn) {
    readBtn.textContent = `👁️ Đã đọc (${readSet.size})`;
    readBtn.setAttribute('aria-pressed', String(state.showRead));
  }

  const isSearching = Boolean(state.query && state.query.trim().length > 0);

  let articles = state.articles.filter((article) => {
    const haystack = normalize([article.title, article.description, ...(article.tags || []), categoryNames[article.category]].join(' '));
    const isArticleRead = readSet.has(String(article.id));

    // Quy tắc ẩn/hiện bài đã đọc:
    // 1. Nếu đang bật lọc "Đã đọc": chỉ hiện bài đã đọc
    // 2. Nếu đang gõ tìm kiếm: hiện cả bài đã đọc lẫn chưa đọc
    // 3. Mặc định bình thường: chỉ hiện bài CHƯA ĐỌC
    if (state.showRead) {
      if (!isArticleRead) return false;
    } else if (!isSearching && isArticleRead) {
      return false;
    }

    return (
      article.review_status !== 'draft' &&
      (!state.onlySaved || savedSet.has(String(article.id))) &&
      (!state.query || haystack.includes(normalize(state.query))) &&
      (!state.category || article.category === state.category) &&
      (!state.status || article.review_status === state.status)
    );
  });
  articles.sort((a, b) => state.sort === 'updated' ? String(b.last_updated || '').localeCompare(String(a.last_updated || '')) : a.title.localeCompare(b.title, 'vi'));
  
  const totalMatches = articles.length;
  let statusText = `Hiển thị ${Math.min(state.visibleLimit, totalMatches)} trên tổng số ${totalMatches} bài viết`;
  if (!state.showRead && !isSearching && readSet.size > 0) {
    statusText += ` (đã tự động ẩn ${readSet.size} bài đã đọc)`;
  }
  document.querySelector('#result-count').textContent = statusText;
  empty.hidden = totalMatches > 0;

  const displayList = articles.slice(0, state.visibleLimit);
  list.innerHTML = displayList.map((article) => {
    const topTags = (article.tags || []).slice(0, 2);
    const isArticleRead = readSet.has(String(article.id));
    return `<article class="article-card ${isArticleRead ? 'is-read' : ''}" data-article-id="${escapeHtml(article.id)}">
      <div class="article-meta">
        <span class="cat-pill">${escapeHtml(categoryNames[article.category] || 'Chung')}</span>
        <button type="button" class="btn-card-read ${isArticleRead ? 'active' : ''}" data-read-toggle="${escapeHtml(article.id)}" title="${isArticleRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc (sẽ ẩn)'}">
          ${isArticleRead ? '✓ Đã đọc' : '👁️ Đã đọc'}
        </button>
      </div>
      <h3><a href="${BASE}/bai-viet/${encodeURIComponent(article.slug)}/">${escapeHtml(article.title)}</a></h3>
      <p>${escapeHtml(article.description)}</p>
      ${topTags.length ? `<div class="tag-list">${topTags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
    </article>`;
  }).join('');

  // Gắn sự kiện click nút Đã đọc ngay trên card
  list.querySelectorAll('[data-read-toggle]').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const id = btn.getAttribute('data-read-toggle');
      if (window.STHReader) {
        window.STHReader.toggleRead(id);
        renderArticles();
      }
    });
  });

  if (loadMoreWrap) {
    loadMoreWrap.hidden = state.visibleLimit >= totalMatches;
  }
}

async function init() {
  window.STHReader?.registerServiceWorker(BASE);
  try {
    let response = await fetch(`${BASE}/data/catalog-index.json`);
    if (!response.ok) response = await fetch(`${BASE}/data/catalog.json`);
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
  document.querySelector('#filter-category').addEventListener('change', (event) => { state.category = event.target.value; state.visibleLimit = 24; renderArticles(); });
  document.querySelector('#filter-status').addEventListener('change', (event) => { state.status = event.target.value; state.visibleLimit = 24; renderArticles(); });
  document.querySelector('#sort-order').addEventListener('change', (event) => { state.sort = event.target.value; state.visibleLimit = 24; renderArticles(); });
  document.querySelector('#filter-saved')?.addEventListener('click', () => { state.onlySaved = !state.onlySaved; state.visibleLimit = 24; renderArticles(); });
  document.querySelector('#filter-read')?.addEventListener('click', () => { state.showRead = !state.showRead; state.visibleLimit = 24; renderArticles(); });
  document.querySelector('#search').addEventListener('input', (event) => { state.query = event.target.value.trim(); state.visibleLimit = 24; renderArticles(); document.querySelector('#search-status').textContent = `Đang hiển thị ${document.querySelectorAll('.article-card').length} kết quả.`; });
  document.querySelector('#btn-load-more')?.addEventListener('click', () => {
    state.visibleLimit += 24;
    renderArticles();
  });
  document.querySelector('#btn-random-hero')?.addEventListener('click', () => {
    if (window.STHReader) {
      const art = window.STHReader.getRandomArticle(state.articles, true);
      if (art && art.slug) {
        location.href = `${BASE}/bai-viet/${encodeURIComponent(art.slug)}/`;
      }
    }
  });
  const toggle = document.querySelector('.menu-toggle');
  toggle.addEventListener('click', () => { const expanded = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!expanded)); document.querySelector('#primary-nav').classList.toggle('is-open', !expanded); });
  const defaultCheck = document.querySelector('#library-default-ui');
  if (defaultCheck) {
    try { defaultCheck.checked = localStorage.getItem('sth-ui-mode') !== 'guide'; } catch (e) {}
    defaultCheck.addEventListener('change', () => {
      try { localStorage.setItem('sth-ui-mode', defaultCheck.checked ? 'library' : 'guide'); } catch (e) {}
    });
  }
}
init();
