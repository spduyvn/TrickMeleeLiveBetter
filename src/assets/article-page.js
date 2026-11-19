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
  const readBtn = document.getElementById('ap-read-btn');
  const doneBtn = document.getElementById('ap-done-btn');
  const focusBtn = document.getElementById('ap-focus-btn');
  const audioBtn = document.getElementById('ap-audio-btn');
  const randomBtn = document.getElementById('ap-random-btn');
  const copyBtn = document.getElementById('ap-copy-btn');

  function getArticleContentItems() {
    const items = [];
    const titleEl = document.querySelector('.article-heading h1');
    if (titleEl) items.push({ text: titleEl.textContent, element: titleEl });

    const descEl = document.querySelector('.article-heading .hero-copy');
    if (descEl) items.push({ text: descEl.textContent, element: descEl });

    const metaGrid = document.querySelector('.metadata-grid');
    if (metaGrid) {
      metaGrid.querySelectorAll('div').forEach((div) => {
        const dt = div.querySelector('dt')?.textContent || '';
        const dd = div.querySelector('dd')?.textContent || '';
        if (dt && dd && dd !== '—' && !dt.includes('Thời lượng đọc')) {
          items.push({ text: `${dt}: ${dd}`, element: div });
        }
      });
    }

    const bodyEl = document.querySelector('.article-body');
    if (bodyEl) {
      bodyEl.querySelectorAll('h2, h3, p, li').forEach((el) => {
        const txt = el.textContent?.trim();
        if (txt && txt.length > 3) {
          items.push({ text: txt, element: el });
        }
      });
    }

    return items;
  }

  audioBtn?.addEventListener('click', () => {
    if (window.STHAudioReader) {
      const items = getArticleContentItems();
      const title = document.querySelector('.article-heading h1')?.textContent || 'Bài viết';
      window.STHAudioReader.playArticle({
        id: articleId,
        title,
        items,
        triggerBtn: audioBtn,
      });
    }
  });

  function syncButtons() {
    if (saveBtn) {
      const saved = tools.getSavedIds().has(articleId);
      saveBtn.setAttribute('aria-pressed', String(saved));
      saveBtn.textContent = saved ? '★ Đã lưu' : '☆ Lưu bài';
    }
    if (readBtn) {
      const isRead = tools.isRead(articleId);
      readBtn.setAttribute('aria-pressed', String(isRead));
      readBtn.textContent = isRead ? '✓ Đã đọc' : '👁️ Đánh dấu đã đọc';
    }
    if (doneBtn) {
      const done = tools.getDoneIds().has(articleId);
      doneBtn.setAttribute('aria-pressed', String(done));
      doneBtn.textContent = done ? '✓ Đã áp dụng' : 'Đánh dấu đã áp dụng';
    }
    if (focusBtn && window.SthSettings) {
      const isFocus = window.SthSettings.isFocus();
      focusBtn.setAttribute('aria-pressed', String(isFocus));
      focusBtn.classList.toggle('active', isFocus);
      focusBtn.textContent = isFocus ? '✓ Đang tập trung' : '🎯 Chế độ tập trung';
    }
  }

  focusBtn?.addEventListener('click', () => {
    if (window.SthSettings) {
      window.SthSettings.toggleFocus();
      syncButtons();
    }
  });

  document.addEventListener('sth:settings-changed', () => {
    syncButtons();
  });

  saveBtn?.addEventListener('click', () => {
    tools.toggleSaved(articleId);
    syncButtons();
  });

  readBtn?.addEventListener('click', () => {
    tools.toggleRead(articleId);
    syncButtons();
  });

  doneBtn?.addEventListener('click', () => {
    tools.toggleDone(articleId);
    syncButtons();
  });

  randomBtn?.addEventListener('click', async () => {
    try {
      let res = await fetch(`${base}/data/catalog-index.json`);
      if (!res.ok) res = await fetch(`${base}/data/catalog.json`);
      const catalog = await res.json();
      const articles = (catalog.articles || []).filter((a) => a.id !== articleId);
      const categories = catalog.categories || [];
      if (tools.openRandomModal) {
        tools.openRandomModal(articles, categories, base);
      }
    } catch {
      // fallback
    }
  });

  document.addEventListener('sth:data-changed', (ev) => {
    if (ev.detail && ev.detail.id === articleId) {
      syncButtons();
    }
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

