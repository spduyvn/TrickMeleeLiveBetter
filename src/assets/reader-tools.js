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
      checklists,
    };
  }

  function importPersonalData(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Dữ liệu JSON không hợp lệ.');
    const saved = getSavedIds();
    const done = getDoneIds();
    if (Array.isArray(payload.saved)) payload.saved.forEach((id) => saved.add(String(id)));
    if (Array.isArray(payload.done)) payload.done.forEach((id) => done.add(String(id)));
    writeJsonSet(SAVED_KEY, saved);
    writeJsonSet(DONE_KEY, done);

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
    return { savedCount: saved.size, doneCount: done.size };
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
    toggleSaved,
    toggleDone,
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

