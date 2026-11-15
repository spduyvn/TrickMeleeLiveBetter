/**
 * reader-tools.js — Tiện ích cho người đọc:
 *   - Tủ bài cá nhân (Đã lưu / Đã áp dụng) lưu trong localStorage
 *   - Checklist thực hành tương tác cho từng bài
 *   - Xuất/Nhập dữ liệu cá nhân (JSON)
 *   - Gợi ý bài liên quan & Link báo lỗi nội dung (GitHub Issue)
 *   - Đăng ký Service Worker đọc Offline
 */
(function (global) {
  'use strict';

  const SAVED_KEY = 'sth-saved-ids';
  const DONE_KEY = 'sth-done-ids';
  const READ_KEY = 'sth-read-ids';
  const CHECKLIST_PREFIX = 'sth-checklist-';
  const GITHUB_REPO = 'spduyvn/TrickMeleeLiveBetter';

  function readJsonSet(key) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function writeJsonSet(key, set) {
    try {
      localStorage.setItem(key, JSON.stringify([...set]));
    } catch {
      /* ignore quota errors */
    }
  }

  function getSavedIds() {
    return readJsonSet(SAVED_KEY);
  }

  function getDoneIds() {
    return readJsonSet(DONE_KEY);
  }

  function getReadIds() {
    return readJsonSet(READ_KEY);
  }

  function toggleSaved(id) {
    const set = getSavedIds();
    const key = String(id);
    const active = !set.has(key);
    if (active) set.add(key);
    else set.delete(key);
    writeJsonSet(SAVED_KEY, set);
    return { active, count: set.size };
  }

  function toggleDone(id) {
    const set = getDoneIds();
    const key = String(id);
    const active = !set.has(key);
    if (active) set.add(key);
    else set.delete(key);
    writeJsonSet(DONE_KEY, set);
    return { active, count: set.size };
  }

  function toggleRead(id) {
    const set = getReadIds();
    const key = String(id);
    const active = !set.has(key);
    if (active) set.add(key);
    else set.delete(key);
    writeJsonSet(READ_KEY, set);
    return { active, count: set.size };
  }

  function isRead(id) {
    return getReadIds().has(String(id));
  }

  function getRandomArticle(pool, prioritizeUnread = true) {
    const list = getRandomArticles(pool, { count: 1, prioritizeUnread });
    return list[0] || null;
  }

  function getRandomArticles(pool, options = {}) {
    if (!Array.isArray(pool) || !pool.length) return [];
    const count = Math.max(1, Number(options.count) || 5);
    const category = String(options.category || '').trim();
    const includeRead = Boolean(options.includeRead);
    const excludeIds = new Set(Array.isArray(options.excludeIds) ? options.excludeIds.map(String) : []);

    let candidates = pool.filter((a) => a && a.review_status !== 'draft' && !excludeIds.has(String(a.id)));
    if (category) {
      candidates = candidates.filter((a) => a.category === category);
    }

    if (!candidates.length) return [];

    const readSet = getReadIds();
    let unreadList = candidates.filter((a) => !readSet.has(String(a.id)));

    let finalPool = [];
    if (includeRead) {
      finalPool = candidates;
    } else {
      finalPool = unreadList.length > 0 ? unreadList : candidates;
    }

    // Shuffle Fisher-Yates
    const shuffled = [...finalPool];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  }

  function getChecklistState(articleId) {
    try {
      const raw = localStorage.getItem(`${CHECKLIST_PREFIX}${articleId}`);
      const obj = raw ? JSON.parse(raw) : {};
      return obj && typeof obj === 'object' ? obj : {};
    } catch {
      return {};
    }
  }

  function setChecklistStep(articleId, index, checked) {
    const current = getChecklistState(articleId);
    current[String(index)] = Boolean(checked);
    try {
      localStorage.setItem(`${CHECKLIST_PREFIX}${articleId}`, JSON.stringify(current));
    } catch {
      /* ignore */
    }
    return current;
  }

  function extractChecklistSteps(article) {
    const steps = [];
    const seen = new Set();
    const pushStep = (text) => {
      const clean = String(text || '').replace(/^[-*•\d.)\s]+/, '').trim();
      if (!clean || clean.length < 8) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      steps.push(clean);
    };

    const bodyLines = String(article?.body || '').split(/\n+/);
    for (const line of bodyLines) {
      if (/^\s*(?:[-*•]|\d+[.)])\s+/.test(line)) {
        pushStep(line);
      }
      if (steps.length >= 6) break;
    }

    if (steps.length < 4 && Array.isArray(article?.benefits)) {
      for (const b of article.benefits) {
        pushStep(`Mục tiêu áp dụng: ${b}`);
        if (steps.length >= 6) break;
      }
    }

    if (steps.length < 4 && Array.isArray(article?.risks) && article.risks.length) {
      pushStep(`Kiểm tra giới hạn/rủi ro: ${article.risks[0]}`);
    }

    if (Array.isArray(article?.sources) && article.sources.length) {
      pushStep('Đối chiếu lại nguồn tham khảo chính thức nếu áp dụng cho trường hợp đặc thù.');
    }

    return steps.slice(0, 6);
  }

  function getRelatedArticles(article, pool, limit = 4) {
    if (!article || !Array.isArray(pool)) return [];
    const tags = new Set((article.tags || []).map((t) => String(t).toLowerCase()));
    const candidates = [];

    for (const item of pool) {
      if (!item || item.id === article.id || item.review_status === 'draft') continue;
      let score = 0;
      if (item.category === article.category) score += 3;
      for (const t of item.tags || []) {
        if (tags.has(String(t).toLowerCase())) score += 2;
      }
      if (item.review_status === 'verified') score += 1;
      if (score > 0) candidates.push({ item, score });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit).map((c) => c.item);
  }

  function buildReportIssueUrl(article) {
    const title = `[Báo lỗi] ${article?.title || article?.id || 'Bài viết'}`;
    const details = [
      `- ID: ${article?.id || ''}`,
      `- Slug: ${article?.slug || ''}`,
      `- Danh mục: ${article?.category || ''}`,
      `- Trạng thái hiện tại: ${article?.review_status || ''}`,
      '',
      'Mô tả nội dung cần sửa / link nguồn thay thế:',
      '',
    ].join('\n');

    const params = new URLSearchParams({
      template: 'bao-loi-noi-dung.yml',
      title,
      article_id: article?.id || '',
      details,
    });
    return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
  }

  function exportPersonalData() {
    const checklists = {};
    try {
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CHECKLIST_PREFIX)) {
          checklists[k.slice(CHECKLIST_PREFIX.length)] = JSON.parse(localStorage.getItem(k) || '{}');
        }
      }
    } catch {
      /* ignore */
    }
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      saved: [...getSavedIds()],
      done: [...getDoneIds()],
      read: [...getReadIds()],
      checklists,
    };
  }

  function importPersonalData(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Dữ liệu JSON không hợp lệ.');
    const saved = getSavedIds();
    const done = getDoneIds();
    const read = getReadIds();
    if (Array.isArray(payload.saved)) payload.saved.forEach((id) => saved.add(String(id)));
    if (Array.isArray(payload.done)) payload.done.forEach((id) => done.add(String(id)));
    if (Array.isArray(payload.read)) payload.read.forEach((id) => read.add(String(id)));
    writeJsonSet(SAVED_KEY, saved);
    writeJsonSet(DONE_KEY, done);
    writeJsonSet(READ_KEY, read);

    if (payload.checklists && typeof payload.checklists === 'object') {
      for (const [id, map] of Object.entries(payload.checklists)) {
        if (!map || typeof map !== 'object') continue;
        const merged = { ...getChecklistState(id), ...map };
        try {
          localStorage.setItem(`${CHECKLIST_PREFIX}${id}`, JSON.stringify(merged));
        } catch {
          /* ignore */
        }
      }
    }
    return { savedCount: saved.size, doneCount: done.size, readCount: read.size };
  }

  function createRandomModalHtml(categories = [], basePath = '') {
    const catOptions = categories.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
    return `
      <div class="sth-rnd-modal" id="sth-rnd-modal" hidden role="dialog" aria-modal="true" aria-labelledby="sth-rnd-title">
        <div class="sth-rnd-card">
          <header class="sth-rnd-head">
            <h2 id="sth-rnd-title">🎲 Khám phá 5 bài viết ngẫu nhiên</h2>
            <button type="button" class="sth-rnd-x" id="sth-rnd-x" aria-label="Đóng cửa sổ">×</button>
          </header>
          <div class="sth-rnd-filter-bar">
            <div>
              <label for="sth-rnd-cat" style="margin-right:6px;font-weight:600;">Chủ đề:</label>
              <select id="sth-rnd-cat">
                <option value="">Tất cả chủ đề</option>
                ${catOptions}
              </select>
            </div>
            <label class="sth-rnd-chk">
              <input type="checkbox" id="sth-rnd-include-read">
              <span>Bao gồm bài đã đọc</span>
            </label>
          </div>
          <div class="sth-rnd-body" id="sth-rnd-body">
            <p style="color:var(--muted);text-align:center;padding:20px;">Đang chọn 5 bài ngẫu nhiên…</p>
          </div>
          <footer class="sth-rnd-foot">
            <button type="button" class="sth-rnd-btn-roll" id="sth-rnd-btn-roll">Đổi 5 bài khác 🎲</button>
            <button type="button" class="sth-rnd-btn-close" id="sth-rnd-btn-close">Đóng</button>
          </footer>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openRandomModal(allArticles = [], categories = [], basePath = '', onArticleClick = null) {
    let modal = document.getElementById('sth-rnd-modal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', createRandomModalHtml(categories, basePath));
      modal = document.getElementById('sth-rnd-modal');
      wireRandomModal(modal, allArticles, categories, basePath, onArticleClick);
    }
    renderRandomModalList(modal, allArticles, basePath, onArticleClick);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeRandomModal() {
    const modal = document.getElementById('sth-rnd-modal');
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  function renderRandomModalList(modal, allArticles, basePath, onArticleClick) {
    const bodyEl = modal.querySelector('#sth-rnd-body');
    const catSelect = modal.querySelector('#sth-rnd-cat');
    const includeReadChk = modal.querySelector('#sth-rnd-include-read');
    if (!bodyEl) return;

    const selectedCategory = catSelect ? catSelect.value : '';
    const includeRead = includeReadChk ? includeReadChk.checked : false;

    const items = getRandomArticles(allArticles, {
      count: 5,
      category: selectedCategory,
      includeRead,
    });

    if (!items.length) {
      bodyEl.innerHTML = `<p style="color:var(--muted);text-align:center;padding:30px;">Không tìm thấy bài viết phù hợp với bộ lọc hiện tại. Hãy thử bật "Bao gồm bài đã đọc" hoặc chọn tất cả chủ đề.</p>`;
      return;
    }

    const savedSet = getSavedIds();
    const readSet = getReadIds();

    bodyEl.innerHTML = items.map((art) => {
      const isSaved = savedSet.has(String(art.id));
      const isReadItem = readSet.has(String(art.id));
      const link = `${basePath}/bai-viet/${encodeURIComponent(art.slug || art.id)}/`;
      return `
        <article class="sth-rnd-item" data-rnd-id="${escapeHtml(art.id)}">
          <div class="sth-rnd-item-top">
            <span class="cat-pill">${escapeHtml(art.category || 'Chung')}</span>
            <span class="status status-${escapeHtml(art.review_status)}">Mức ${escapeHtml(art.evidence_level || 'B')}</span>
          </div>
          <h3><a href="${link}" data-rnd-link="${escapeHtml(art.id)}">${escapeHtml(art.title)}</a></h3>
          <p>${escapeHtml(art.description || '')}</p>
          <div class="sth-rnd-item-acts">
            <a href="${link}" class="ap-btn" data-rnd-read="${escapeHtml(art.id)}">Đọc bài ↗</a>
            <button type="button" class="btn-card-read ${isReadItem ? 'active' : ''}" data-rnd-toggle-read="${escapeHtml(art.id)}">
              ${isReadItem ? '✓ Đã đọc' : '👁️ Đã đọc'}
            </button>
            <button type="button" class="ap-btn" data-rnd-toggle-save="${escapeHtml(art.id)}" aria-pressed="${isSaved}">
              ${isSaved ? '★ Đã lưu' : '☆ Lưu'}
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Bắt sự kiện toggle read / save ngay trong modal
    bodyEl.querySelectorAll('[data-rnd-toggle-read]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-rnd-toggle-read');
        const res = toggleRead(id);
        btn.classList.toggle('active', res.active);
        btn.textContent = res.active ? '✓ Đã đọc' : '👁️ Đã đọc';
        document.dispatchEvent(new CustomEvent('sth:data-changed', { detail: { type: 'read', id, active: res.active } }));
      });
    });

    bodyEl.querySelectorAll('[data-rnd-toggle-save]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-rnd-toggle-save');
        const res = toggleSaved(id);
        btn.setAttribute('aria-pressed', String(res.active));
        btn.textContent = res.active ? '★ Đã lưu' : '☆ Lưu';
        document.dispatchEvent(new CustomEvent('sth:data-changed', { detail: { type: 'saved', id, active: res.active } }));
      });
    });

    if (typeof onArticleClick === 'function') {
      bodyEl.querySelectorAll('[data-rnd-link], [data-rnd-read]').forEach((linkEl) => {
        linkEl.addEventListener('click', (ev) => {
          ev.preventDefault();
          const artId = linkEl.getAttribute('data-rnd-link') || linkEl.getAttribute('data-rnd-read');
          closeRandomModal();
          onArticleClick(artId);
        });
      });
    }
  }

  function wireRandomModal(modal, allArticles, categories, basePath, onArticleClick) {
    modal.querySelector('#sth-rnd-x')?.addEventListener('click', closeRandomModal);
    modal.querySelector('#sth-rnd-btn-close')?.addEventListener('click', closeRandomModal);
    modal.addEventListener('click', (ev) => {
      if (ev.target.id === 'sth-rnd-modal') closeRandomModal();
    });

    modal.querySelector('#sth-rnd-cat')?.addEventListener('change', () => {
      renderRandomModalList(modal, allArticles, basePath, onArticleClick);
    });

    modal.querySelector('#sth-rnd-include-read')?.addEventListener('change', () => {
      renderRandomModalList(modal, allArticles, basePath, onArticleClick);
    });

    modal.querySelector('#sth-rnd-btn-roll')?.addEventListener('click', () => {
      renderRandomModalList(modal, allArticles, basePath, onArticleClick);
    });
  }

  function registerServiceWorker(basePath = '') {
    if (!('serviceWorker' in navigator)) return;
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !isLocal) return;
    navigator.serviceWorker.register(`${basePath}/sw.js`).catch(() => {});
  }

  global.STHReader = {
    getSavedIds,
    getDoneIds,
    getReadIds,
    toggleSaved,
    toggleDone,
    toggleRead,
    isRead,
    getRandomArticle,
    getRandomArticles,
    openRandomModal,
    closeRandomModal,
    getChecklistState,
    setChecklistStep,
    extractChecklistSteps,
    getRelatedArticles,
    buildReportIssueUrl,
    exportPersonalData,
    importPersonalData,
    registerServiceWorker,
  };
})(window);

