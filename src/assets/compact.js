/**
 * compact.js — Điều khiển Giao diện Bảng nén & Flashcard:
 *   - Tải catalog bài viết (catalog-index.json hoặc catalog.json)
 *   - Render bảng dữ liệu nén (Dense Table) kèm tìm kiếm, lọc chủ đề, bằng chứng
 *   - Render Thẻ ghi nhớ (Flashcard Flip) 3D mượt mà
 *   - Phím tắt lật thẻ (Space) và chuyển thẻ (Arrow Left / Right)
 */
(function () {
  'use strict';

  let allArticles = [];
  let filteredArticles = [];
  let currentCardIndex = 0;
  let isFlipped = false;

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

  async function loadData() {
    try {
      let res = await fetch(`${BASE_PATH}/data/catalog-index.json`);
      if (!res.ok) res = await fetch(`${BASE_PATH}/data/catalog.json`);
      const data = await res.json();
      allArticles = Array.isArray(data) ? data : (data.articles || []);
      filteredArticles = [...allArticles];
      setupFilters();
      renderTable();
      renderFlashcard();
    } catch (err) {
      document.getElementById('compact-table-body').innerHTML = `
        <tr><td colspan="7" class="error-state">Lỗi tải dữ liệu: ${err.message}</td></tr>
      `;
    }
  }

  function setupFilters() {
    const catSelect = document.getElementById('compact-cat-filter');
    if (catSelect) {
      const cats = new Set(allArticles.map(a => a.category).filter(Boolean));
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        catSelect.appendChild(opt);
      });
    }
  }

  function applyFilters() {
    const q = (document.getElementById('compact-search')?.value || '').toLowerCase().trim();
    const cat = document.getElementById('compact-cat-filter')?.value || '';
    const evLvl = document.getElementById('compact-evidence-filter')?.value || '';
    const onlySaved = document.getElementById('compact-saved-only')?.getAttribute('aria-pressed') === 'true';
    const savedSet = (typeof getSavedIds === 'function') ? getSavedIds() : new Set();

    filteredArticles = allArticles.filter(a => {
      if (cat && a.category !== cat) return false;
      if (evLvl && a.evidence_level !== evLvl) return false;
      if (onlySaved && !savedSet.has(String(a.id))) return false;
      if (q) {
        const matchTitle = a.title && a.title.toLowerCase().includes(q);
        const matchDesc = a.description && a.description.toLowerCase().includes(q);
        const matchCat = a.category && a.category.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });

    renderTable();
    currentCardIndex = 0;
    isFlipped = false;
    renderFlashcard();
  }

  function renderTable() {
    const tbody = document.getElementById('compact-table-body');
    const statusEl = document.getElementById('compact-status-bar');
    if (!tbody) return;

    if (statusEl) {
      statusEl.textContent = `Hiển thị ${filteredArticles.length} / ${allArticles.length} bài viết`;
    }

    if (filteredArticles.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Không tìm thấy hướng dẫn nào phù hợp.</td></tr>';
      return;
    }

    const savedSet = (typeof getSavedIds === 'function') ? getSavedIds() : new Set();

    tbody.innerHTML = filteredArticles.map((art, idx) => {
      const isSaved = savedSet.has(String(art.id));
      const evBadge = `<span class="status status-verified">Mức ${escapeHtml(art.evidence_level || 'B')}</span>`;
      const linkUrl = `${BASE_PATH}/bai-viet/${encodeURIComponent(art.slug || art.id)}/`;
      return `
        <tr>
          <td><span class="category-index">${idx + 1}</span></td>
          <td><span class="tag-list"><span>${escapeHtml(art.category || 'Chung')}</span></span></td>
          <td>
            <a class="ct-title" href="${linkUrl}" target="_blank">${escapeHtml(art.title)}</a>
            <span class="ct-desc">${escapeHtml(art.description || '')}</span>
          </td>
          <td>${evBadge}</td>
          <td>${escapeHtml(art.cost || 'Miễn phí')}</td>
          <td>${escapeHtml(art.time || '15–30p')}</td>
          <td>
            <div class="ct-actions">
              <button type="button" class="ct-action-btn ${isSaved ? 'active' : ''}" data-act-save="${art.id}" title="${isSaved ? 'Bỏ lưu' : 'Lưu bài'}">
                ${isSaved ? '★' : '☆'}
              </button>
              <a href="${linkUrl}" class="ct-action-btn" title="Đọc bài" target="_blank">↗</a>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Gắn sự kiện nút Lưu
    tbody.querySelectorAll('[data-act-save]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-act-save');
        if (typeof toggleSaved === 'function') {
          const res = toggleSaved(id);
          btn.classList.toggle('active', res.active);
          btn.textContent = res.active ? '★' : '☆';
          btn.title = res.active ? 'Bỏ lưu' : 'Lưu bài';
        }
      });
    });
  }

  function renderFlashcard() {
    const cardEl = document.getElementById('flashcard-card');
    const counterEl = document.getElementById('fc-counter');
    if (!cardEl) return;

    if (filteredArticles.length === 0) {
      document.getElementById('fc-front-title').textContent = 'Không có bài viết phù hợp';
      document.getElementById('fc-front-desc').textContent = 'Hãy đổi bộ lọc để tiếp tục luyện tập.';
      if (counterEl) counterEl.textContent = '0 / 0';
      return;
    }

    const art = filteredArticles[currentCardIndex];
    if (!art) return;

    if (counterEl) {
      counterEl.textContent = `${currentCardIndex + 1} / ${filteredArticles.length}`;
    }

    cardEl.classList.toggle('flipped', isFlipped);

    // Mặt trước
    document.getElementById('fc-front-cat').textContent = art.category || 'Kiến thức thực tiễn';
    document.getElementById('fc-front-title').textContent = art.title;
    document.getElementById('fc-front-desc').textContent = art.description || 'Hành động nhỏ tạo thay đổi lớn.';

    // Mặt sau
    document.getElementById('fc-back-level').textContent = `Bằng chứng: Mức ${art.evidence_level || 'B'}`;
    const actionBody = art.body
      ? art.body.slice(0, 300) + (art.body.length > 300 ? '…' : '')
      : (Array.isArray(art.benefits) && art.benefits.length ? art.benefits.join('; ') : art.description);
    document.getElementById('fc-back-body').textContent = actionBody;
    document.getElementById('fc-back-cost').textContent = `Chi phí: ${art.cost || 'Miễn phí'}`;
    document.getElementById('fc-back-time').textContent = `Thời gian: ${art.time || '15–30p'}`;
    
    const linkEl = document.getElementById('fc-view-full');
    if (linkEl) {
      linkEl.href = `${BASE_PATH}/bai-viet/${encodeURIComponent(art.slug || art.id)}/`;
    }
  }

  function flipCard() {
    isFlipped = !isFlipped;
    document.getElementById('flashcard-card')?.classList.toggle('flipped', isFlipped);
  }

  function nextCard() {
    if (filteredArticles.length === 0) return;
    isFlipped = false;
    currentCardIndex = (currentCardIndex + 1) % filteredArticles.length;
    renderFlashcard();
  }

  function prevCard() {
    if (filteredArticles.length === 0) return;
    isFlipped = false;
    currentCardIndex = (currentCardIndex - 1 + filteredArticles.length) % filteredArticles.length;
    renderFlashcard();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function setupEvents() {
    // Switch tabs View Table vs Flashcard
    const tabTable = document.getElementById('tab-table');
    const tabFc = document.getElementById('tab-flashcard');
    const secTable = document.getElementById('view-table-section');
    const secFc = document.getElementById('view-flashcard-section');

    tabTable?.addEventListener('click', () => {
      tabTable.classList.add('active');
      tabTable.setAttribute('aria-selected', 'true');
      tabFc.classList.remove('active');
      tabFc.setAttribute('aria-selected', 'false');
      secTable.hidden = false;
      secFc.hidden = true;
    });

    tabFc?.addEventListener('click', () => {
      tabFc.classList.add('active');
      tabFc.setAttribute('aria-selected', 'true');
      tabTable.classList.remove('active');
      tabTable.setAttribute('aria-selected', 'false');
      secTable.hidden = true;
      secFc.hidden = false;
      renderFlashcard();
    });

    // Filters
    document.getElementById('compact-search')?.addEventListener('input', applyFilters);
    document.getElementById('compact-cat-filter')?.addEventListener('change', applyFilters);
    document.getElementById('compact-evidence-filter')?.addEventListener('change', applyFilters);
    
    document.getElementById('compact-saved-only')?.addEventListener('click', (ev) => {
      const active = ev.currentTarget.getAttribute('aria-pressed') === 'true';
      ev.currentTarget.setAttribute('aria-pressed', !active);
      applyFilters();
    });

    // Flashcard Flip & Nav
    document.getElementById('flashcard-card')?.addEventListener('click', flipCard);
    document.getElementById('fc-next')?.addEventListener('click', nextCard);
    document.getElementById('fc-prev')?.addEventListener('click', prevCard);

    // Keyboard Shortcuts
    window.addEventListener('keydown', (ev) => {
      // Chỉ hoạt động khi đang ở tab Flashcard và không focus ô tìm kiếm
      const secFc = document.getElementById('view-flashcard-section');
      if (secFc && !secFc.hidden && document.activeElement.tagName !== 'INPUT') {
        if (ev.code === 'Space') {
          ev.preventDefault();
          flipCard();
        } else if (ev.key === 'ArrowRight') {
          ev.preventDefault();
          nextCard();
        } else if (ev.key === 'ArrowLeft') {
          ev.preventDefault();
          prevCard();
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    loadData();
  });

})();

