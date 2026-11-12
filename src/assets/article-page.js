/**
 * article-page.js — Progressive enhancement cho trang bài viết pre-rendered (/bai-viet/<slug>/)
 */
(function () {
  'use strict';

  const tools = window.STHReader;
  if (!tools) return;

  const root = document.getElementById('pre-article');
  if (!root) return;

  const base =
    document.querySelector('link[href*="/assets/styles.css"]')
      ?.getAttribute('href')
      ?.replace(/\/assets\/styles\.css$/, '') || '';

  tools.registerServiceWorker(base);

  const articleId = root.dataset.articleId || '';
  const dataEl = document.getElementById('pre-article-data');
  let articleData = {};
  try {
    articleData = JSON.parse(dataEl?.textContent || '{}');
  } catch {
    articleData = {};
  }

  const saveBtn = document.getElementById('ap-save-btn');
  const doneBtn = document.getElementById('ap-done-btn');
  const copyBtn = document.getElementById('ap-copy-btn');

  function syncButtons() {
    if (saveBtn) {
      const saved = tools.getSavedIds().has(articleId);
      saveBtn.setAttribute('aria-pressed', String(saved));
      saveBtn.textContent = saved ? '★ Đã lưu' : '☆ Lưu bài';
    }
    if (doneBtn) {
      const done = tools.getDoneIds().has(articleId);
      doneBtn.setAttribute('aria-pressed', String(done));
      doneBtn.textContent = done ? '✓ Đã áp dụng' : 'Đánh dấu đã áp dụng';
    }
  }

  saveBtn?.addEventListener('click', () => {
    tools.toggleSaved(articleId);
    syncButtons();
  });

  doneBtn?.addEventListener('click', () => {
    tools.toggleDone(articleId);
    syncButtons();
  });

  copyBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = '✓ Đã sao chép link';
      setTimeout(() => { copyBtn.textContent = '🔗 Sao chép link'; }, 1800);
    } catch {
      copyBtn.textContent = 'Không sao chép được';
    }
  });

  syncButtons();

  // Render interactive checklist
  const clWrap = document.getElementById('ap-checklist');
  if (clWrap) {
    const steps = tools.extractChecklistSteps(articleData);
    if (!steps.length) {
      clWrap.hidden = true;
    } else {
      const listEl = clWrap.querySelector('.ap-cl-list');
      const countEl = clWrap.querySelector('.ap-cl-count');

      const renderChecklist = () => {
        const savedMap = tools.getChecklistState(articleId);
        let doneCount = 0;
        listEl.innerHTML = steps
          .map((step, i) => {
            const checked = Boolean(savedMap[String(i)]);
            if (checked) doneCount += 1;
            return `<label class="ap-cl-item${checked ? ' done' : ''}"><input type="checkbox" data-step="${i}"${checked ? ' checked' : ''}><span>${step.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))}</span></label>`;
          })
          .join('');
        if (countEl) countEl.textContent = `${doneCount}/${steps.length} bước`;
      };

      listEl.addEventListener('change', (ev) => {
        const input = ev.target.closest('input[data-step]');
        if (!input) return;
        tools.setChecklistStep(articleId, input.dataset.step, input.checked);
        renderChecklist();
      });

      renderChecklist();
    }
  }
})();

