/**
 * reader.js — Điều khiển Giao diện Đọc tập trung (Reader Mode):
 *   - Tải catalog bài viết (catalog-index.json hoặc catalog.json)
 *   - Hiển thị bài viết chi tiết 1 cột, tối ưu typography
 *   - Điều khiển thanh công cụ nổi (A-, A+, phông chữ, tủ bài, mục lục TOC)
 *   - Tiến trình đọc % trôi theo thanh cuộn trang
 *   - Hỗ trợ chuyển bài trước / sau mượt mà
 */
(function () {
  'use strict';

  let allArticles = [];
  let currentArticleIndex = 0;
  let filteredArticles = [];
  let currentArticle = null;

  // Tìm BASE_PATH
  function getBasePath() {
    const link = document.querySelector('link[rel="manifest"]');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      const idx = href.indexOf('/manifest.webmanifest');
      if (idx !== -1) return href.slice(0, idx);
    }
    return '';
  }

  const BASE_PATH = getBasePath();

  async function loadArticles() {
    try {
      // Ưu tiên catalog-index.json (nhẹ hơn 50%)
      let res = await fetch(`${BASE_PATH}/data/catalog-index.json`);
      if (!res.ok) res = await fetch(`${BASE_PATH}/data/catalog.json`);
      const data = await res.json();
      allArticles = Array.isArray(data) ? data : (data.articles || []);
      filteredArticles = [...allArticles];
      setupCategorySelect();
      checkUrlHashOrSelectFirst();
    } catch (err) {
      document.getElementById('reader-article-view').innerHTML = `
        <div class="empty-state">Không thể tải dữ liệu: ${err.message}.</div>
      `;
    }
  }

  function setupCategorySelect() {
    const select = document.getElementById('reader-category-select');
    if (!select) return;
    const cats = new Set(allArticles.map(a => a.category).filter(Boolean));
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  function checkUrlHashOrSelectFirst() {
    const hash = location.hash.replace(/^#/, '');
    if (hash) {
      const idx = allArticles.findIndex(a => a.slug === hash || a.id === hash);
      if (idx !== -1) {
        currentArticleIndex = idx;
        renderArticle(allArticles[idx]);
        return;
      }
    }
    if (filteredArticles.length > 0) {
      currentArticleIndex = 0;
      renderArticle(filteredArticles[0]);
    }
  }

  function renderArticle(art) {
    currentArticle = art;
    const view = document.getElementById('reader-article-view');
    const pagination = document.getElementById('reader-pagination');
    if (!art || !view) return;

    // Cập nhật hash
    if (history.replaceState) {
      history.replaceState(null, '', `#${art.slug || art.id}`);
    }

    const savedSet = (typeof getSavedIds === 'function') ? getSavedIds() : new Set();
    const doneSet = (typeof getDoneIds === 'function') ? getDoneIds() : new Set();
    const isSaved = savedSet.has(String(art.id));
    const isDone = doneSet.has(String(art.id));

    // Cập nhật nút nổi
    updateFloatingState(isSaved, isDone);

    view.innerHTML = `
      <header class="reader-article-header">
        <p class="eyebrow">${escapeHtml(art.category || 'HƯỚNG DẪN')}</p>
        <h1>${escapeHtml(art.title)}</h1>
        <div class="reader-article-meta-row">
          <span>Thời gian đọc: <strong>${escapeHtml(art.reading_time || '3 phút')}</strong></span>
          <span>Bằng chứng: <strong>Mức ${escapeHtml(art.evidence_level || 'B')}</strong></span>
          <span>Cập nhật: <strong>${escapeHtml(art.last_updated || '2026-11')}</strong></span>
        </div>
      </header>

      <p class="reader-lead">${escapeHtml(art.description || '')}</p>

      <div class="reader-spec-grid">
        <div class="reader-spec-item">
          <strong>Chi phí dự kiến</strong>
          <span>${escapeHtml(art.cost || 'Miễn phí / Tối thiểu')}</span>
        </div>
        <div class="reader-spec-item">
          <strong>Thời gian thực hiện</strong>
          <span>${escapeHtml(art.time || '15–30 phút')}</span>
        </div>
        <div class="reader-spec-item">
          <strong>Công sức bỏ ra</strong>
          <span>${escapeHtml(art.effort || 'Thấp')}</span>
        </div>
      </div>

      ${art.body ? `<div class="reader-article-body" id="reader-body-content">${formatArticleBody(art.body)}</div>` : ''}

      ${Array.isArray(art.benefits) && art.benefits.length ? `
        <section class="reader-section">
          <h2>Lợi ích thực tế</h2>
          <ul>${art.benefits.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </section>
      ` : ''}

      ${Array.isArray(art.risks) && art.risks.length ? `
        <section class="reader-section">
          <h2>Rủi ro hoặc lưu ý khi áp dụng</h2>
          <ul>${art.risks.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
        </section>
      ` : ''}

      ${Array.isArray(art.sources) && art.sources.length ? `
        <section class="reader-section">
          <h2>Nguồn tham khảo &amp; Căn cứ</h2>
          <ul>
            ${art.sources.map(s => {
              const name = typeof s === 'string' ? s : (s.name || s.title || s.url);
              const url = typeof s === 'object' ? s.url : null;
              return `<li>${url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(name)}</a>` : escapeHtml(name)}</li>`;
            }).join('')}
          </ul>
        </section>
      ` : ''}
    `;

    // Cập nhật phân trang
    if (pagination) {
      pagination.hidden = false;
      const prevBtn = document.getElementById('reader-prev-btn');
      const nextBtn = document.getElementById('reader-next-btn');
      prevBtn.disabled = currentArticleIndex <= 0;
      nextBtn.disabled = currentArticleIndex >= filteredArticles.length - 1;
    }

    // Cuộn lên đầu bài mượt mà
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Cập nhật số lượng
    const countEl = document.getElementById('reader-article-count');
    if (countEl) {
      countEl.textContent = `Bài ${currentArticleIndex + 1} / ${filteredArticles.length}`;
    }

    // Build TOC
    buildTocDrawer();
  }

  function updateFloatingState(isSaved, isDone) {
    const saveBtn = document.getElementById('rfb-save');
    const doneBtn = document.getElementById('rfb-done');
    if (saveBtn) {
      saveBtn.classList.toggle('active', isSaved);
      saveBtn.textContent = isSaved ? '★' : '☆';
    }
    if (doneBtn) {
      doneBtn.classList.toggle('active', isDone);
    }
  }

  function formatArticleBody(text) {
    if (!text) return '';
    // Xử lý xuống dòng thành các đoạn văn
    return text.split(/\n\n+/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildTocDrawer() {
    const drawer = document.getElementById('reader-toc-drawer');
    const list = document.getElementById('reader-toc-list');
    if (!drawer || !list) return;

    list.innerHTML = '';
    filteredArticles.slice(0, 50).forEach((art, idx) => {
      const a = document.createElement('a');
      a.href = `#${art.slug || art.id}`;
      a.textContent = `${idx + 1}. ${art.title}`;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        currentArticleIndex = idx;
        renderArticle(art);
        drawer.hidden = true;
      });
      list.appendChild(a);
    });
  }

  function setupEvents() {
    // Thanh tiến trình cuộn
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const b = document.body;
      const st = 'scrollTop' in h ? h.scrollTop : b.scrollTop;
      const sh = 'scrollHeight' in h ? h.scrollHeight : b.scrollHeight;
      const ch = h.clientHeight;
      const percent = Math.min(100, Math.max(0, (st / (sh - ch)) * 100));
      const bar = document.getElementById('reader-progress-bar');
      if (bar) bar.style.width = percent + '%';
    });

    // Tìm kiếm
    const searchInput = document.getElementById('reader-search');
    searchInput?.addEventListener('input', (ev) => {
      const q = ev.target.value.toLowerCase().trim();
      if (!q) {
        filteredArticles = [...allArticles];
      } else {
        filteredArticles = allArticles.filter(a =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.description && a.description.toLowerCase().includes(q))
        );
      }
      if (filteredArticles.length > 0) {
        currentArticleIndex = 0;
        renderArticle(filteredArticles[0]);
      } else {
        document.getElementById('reader-article-view').innerHTML = '<div class="empty-state">Không tìm thấy bài viết phù hợp.</div>';
        document.getElementById('reader-pagination').hidden = true;
      }
    });

    // Lọc theo chủ đề
    document.getElementById('reader-category-select')?.addEventListener('change', (ev) => {
      const cat = ev.target.value;
      if (!cat) filteredArticles = [...allArticles];
      else filteredArticles = allArticles.filter(a => a.category === cat);
      currentArticleIndex = 0;
      if (filteredArticles.length > 0) renderArticle(filteredArticles[0]);
    });

    // Nút phân trang
    document.getElementById('reader-prev-btn')?.addEventListener('click', () => {
      if (currentArticleIndex > 0) {
        currentArticleIndex -= 1;
        renderArticle(filteredArticles[currentArticleIndex]);
      }
    });

    document.getElementById('reader-next-btn')?.addEventListener('click', () => {
      if (currentArticleIndex < filteredArticles.length - 1) {
        currentArticleIndex += 1;
        renderArticle(filteredArticles[currentArticleIndex]);
      }
    });

    // Floating bar buttons
    document.getElementById('rfb-font-down')?.addEventListener('click', () => {
      const s = global.SthSettings ? global.SthSettings.read() : { fontSize: '100' };
      const sizes = ['90', '100', '115', '130'];
      let idx = sizes.indexOf(s.fontSize || '100');
      if (idx > 0) {
        s.fontSize = sizes[idx - 1];
        global.SthSettings?.write(s);
        global.SthSettings?.apply(s);
      }
    });

    document.getElementById('rfb-font-up')?.addEventListener('click', () => {
      const s = global.SthSettings ? global.SthSettings.read() : { fontSize: '100' };
      const sizes = ['90', '100', '115', '130'];
      let idx = sizes.indexOf(s.fontSize || '100');
      if (idx < sizes.length - 1) {
        s.fontSize = sizes[idx + 1];
        global.SthSettings?.write(s);
        global.SthSettings?.apply(s);
      }
    });

    document.getElementById('rfb-font-family')?.addEventListener('click', () => {
      const s = global.SthSettings ? global.SthSettings.read() : { fontFamily: 'sans' };
      s.fontFamily = s.fontFamily === 'serif' ? 'sans' : 'serif';
      global.SthSettings?.write(s);
      global.SthSettings?.apply(s);
    });

    document.getElementById('rfb-save')?.addEventListener('click', () => {
      if (!currentArticle) return;
      if (typeof toggleSaved === 'function') {
        const res = toggleSaved(currentArticle.id);
        updateFloatingState(res.active, (typeof getDoneIds === 'function') && getDoneIds().has(String(currentArticle.id)));
      }
    });

    document.getElementById('rfb-done')?.addEventListener('click', () => {
      if (!currentArticle) return;
      if (typeof toggleDone === 'function') {
        const res = toggleDone(currentArticle.id);
        updateFloatingState((typeof getSavedIds === 'function') && getSavedIds().has(String(currentArticle.id)), res.active);
      }
    });

    document.getElementById('rfb-toc')?.addEventListener('click', () => {
      const drawer = document.getElementById('reader-toc-drawer');
      if (drawer) drawer.hidden = !drawer.hidden;
    });

    document.getElementById('reader-toc-close')?.addEventListener('click', () => {
      const drawer = document.getElementById('reader-toc-drawer');
      if (drawer) drawer.hidden = true;
    });
  }

  // Khởi động
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    loadArticles();
  });

})();

