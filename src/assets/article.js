const base = document.querySelector('link[href*="/assets/styles.css"]')?.getAttribute('href')?.replace(/\/assets\/styles\.css$/, '') || '';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const values = (label, value) => {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) return `<div><dt>${label}</dt><dd>Chưa cung cấp</dd></div>`;
  const text = Array.isArray(value) ? value.map(esc).join(', ') : esc(value);
  return `<div><dt>${label}</dt><dd>${text || 'Chưa cung cấp'}</dd></div>`;
};

(async () => {
  const tools = window.STHReader;
  tools?.registerServiceWorker(base);

  const reqId = new URLSearchParams(location.search).get('id');
  let response = await fetch(`${base}/data/catalog-index.json`);
  if (!response.ok) response = await fetch(`${base}/data/catalog.json`);
  if (!response.ok) throw new Error('Không thể tải dữ liệu bài viết.');

  const catalog = await response.json();
  const articles = catalog.articles || [];
  let article = articles.find((item) => item.id === reqId);
  const root = document.querySelector('#article-content');

  if (!article || article.review_status === 'draft') {
    root.innerHTML = `<section class="notice-panel"><p class="eyebrow">CHƯA XUẤT BẢN</p><h1>Nội dung này chưa sẵn sàng</h1><p>Bài viết đang ở trạng thái bản nháp hoặc không tồn tại.</p><a class="text-link" href="${base}/?view=library#kham-pha">Xem thư viện nội dung <span aria-hidden="true">→</span></a></section>`;
    return;
  }

  if (!article.body && article._file) {
    try {
      const catResp = await fetch(`${base}/data/articles/${encodeURIComponent(article._file)}`);
      if (catResp.ok) {
        const list = await catResp.json();
        const full = Array.isArray(list) ? list.find((it) => it.id === article.id) : null;
        if (full) article = { ...article, ...full };
      }
    } catch {
      /* fallback below */
    }
  }

  document.title = `${article.title} — Sống Tốt Hơn`;
  document.querySelector('meta[name="description"]').content = article.description;
  document.querySelector('meta[property="og:title"]').content = article.title;
  document.querySelector('meta[property="og:description"]').content = article.description;

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical && article.slug) {
    canonical.href = `https://spduyvn.github.io/TrickMeleeLiveBetter/bai-viet/${encodeURIComponent(article.slug)}/`;
  }

  const bodyHtml = article.body
    ? article.body.split(/\n\n+/).map((para) => `<p>${esc(para).replace(/\n/g, '<br>')}</p>`).join('')
    : '<p>Nội dung chưa được biên soạn.</p>';
  const notesHtml = article.evidence_notes
    ? article.evidence_notes.split(/\n\n+/).map((para) => `<p>${esc(para)}</p>`).join('')
    : '<p>Chưa có đánh giá bằng chứng được công bố.</p>';

  const related = tools ? tools.getRelatedArticles(article, articles, 4) : [];
  const reportHref = tools ? tools.buildReportIssueUrl(article) : `${base}/sources/`;
  const seoHref = article.slug ? `${base}/bai-viet/${encodeURIComponent(article.slug)}/` : `${base}/article/?id=${encodeURIComponent(article.id)}`;

  root.innerHTML = `
    <header class="article-heading">
      <p class="eyebrow">${esc(article.category)}</p>
      <h1>${esc(article.title)}</h1>
      <p class="hero-copy">${esc(article.description)}</p>
      <p class="article-meta">
        <span class="status status-${esc(article.review_status)}">${esc(article.status_label || article.review_status)}</span>
        <span>${article.verified_at ? `Xác minh: ${esc(article.verified_at)}` : 'Ngày xác minh: chưa có'}</span>
      </p>
      <div class="ap-actions">
        <button type="button" class="ap-btn" id="ap-save-btn" aria-pressed="false">☆ Lưu bài</button>
        <button type="button" class="ap-btn" id="ap-done-btn" aria-pressed="false">Đánh dấu đã áp dụng</button>
        <button type="button" class="ap-btn" id="ap-copy-btn">🔗 Sao chép link</button>
        <a class="ap-btn" href="${base}/guide/#item-${esc(article.id)}">Mở trên Tra cứu nhanh</a>
        <a class="ap-btn" href="${esc(reportHref)}" target="_blank" rel="noopener noreferrer">⚠ Báo lỗi / Sửa nguồn</a>
      </div>
    </header>
    <section class="metadata-panel">
      <h2>Thông tin áp dụng</h2>
      <dl class="metadata-grid">${values('Thẻ', article.tags)}${values('Chi phí', article.cost)}${values('Thời lượng đọc', article.reading_time)}${values('Thời gian áp dụng', article.time)}${values('Công sức', article.effort)}${values('Lợi ích', article.benefits)}${values('Rủi ro', article.risks)}${values('Đối tượng phù hợp', article.target_groups)}<div><dt>Mức độ giá trị</dt><dd>${esc(article.value_level || 'Chưa đánh giá')}</dd></div><div><dt>Mức độ bằng chứng</dt><dd>${esc(article.evidence_level || 'Chưa đánh giá')}</dd></div></dl>
    </section>
    <section class="ap-checklist" id="ap-checklist">
      <div class="ap-cl-head"><h2>Checklist thực hành</h2><span class="ap-cl-count">0 bước</span></div>
      <div class="ap-cl-list"></div>
    </section>
    <section class="article-body">
      <h2>Nội dung</h2>
      ${bodyHtml}
      <h2>Bằng chứng và giới hạn</h2>
      ${notesHtml}
      <h2>Nguồn tham khảo</h2>
      <ul>${(article.sources || []).map((source) => `<li><a href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${esc(source.title)}</a> — ${esc(source.organization)}, ${esc(source.country)}; công bố: ${esc(source.published_at || 'không rõ')}; truy cập: ${esc(source.accessed_at || 'không rõ')}</li>`).join('') || '<li>Chưa có nguồn được ghi nhận.</li>'}</ul>
      <p class="article-meta">Cập nhật lần cuối: ${esc(article.last_updated || 'Chưa cập nhật')}</p>
    </section>
    ${related.length ? `<section class="ap-related"><h2>Bài viết liên quan</h2><div class="ap-related-grid">${related.map((r) => `<a class="ap-rel-card" href="${base}/bai-viet/${encodeURIComponent(r.slug)}/"><strong>${esc(r.title)}</strong><span>${esc(r.description)}</span></a>`).join('')}</div></section>` : ''}`;

  if (tools) {
    const saveBtn = document.getElementById('ap-save-btn');
    const doneBtn = document.getElementById('ap-done-btn');
    const copyBtn = document.getElementById('ap-copy-btn');
    const syncButtons = () => {
      const saved = tools.getSavedIds().has(article.id);
      const done = tools.getDoneIds().has(article.id);
      saveBtn.setAttribute('aria-pressed', String(saved));
      saveBtn.textContent = saved ? '★ Đã lưu' : '☆ Lưu bài';
      doneBtn.setAttribute('aria-pressed', String(done));
      doneBtn.textContent = done ? '✓ Đã áp dụng' : 'Đánh dấu đã áp dụng';
    };
    saveBtn?.addEventListener('click', () => { tools.toggleSaved(article.id); syncButtons(); });
    doneBtn?.addEventListener('click', () => { tools.toggleDone(article.id); syncButtons(); });
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(new URL(seoHref, location.origin).href);
        copyBtn.textContent = '✓ Đã sao chép link';
        setTimeout(() => { copyBtn.textContent = '🔗 Sao chép link'; }, 1800);
      } catch {}
    });
    syncButtons();

    const steps = tools.extractChecklistSteps(article);
    const clWrap = document.getElementById('ap-checklist');
    if (!steps.length) {
      clWrap.hidden = true;
    } else {
      const listEl = clWrap.querySelector('.ap-cl-list');
      const countEl = clWrap.querySelector('.ap-cl-count');
      const renderChecklist = () => {
        const st = tools.getChecklistState(article.id);
        let cnt = 0;
        listEl.innerHTML = steps.map((step, i) => {
          const checked = Boolean(st[String(i)]);
          if (checked) cnt += 1;
          return `<label class="ap-cl-item${checked ? ' done' : ''}"><input type="checkbox" data-step="${i}"${checked ? ' checked' : ''}><span>${esc(step)}</span></label>`;
        }).join('');
        countEl.textContent = `${cnt}/${steps.length} bước`;
      };
      listEl.addEventListener('change', (ev) => {
        const input = ev.target.closest('input[data-step]');
        if (!input) return;
        tools.setChecklistStep(article.id, input.dataset.step, input.checked);
        renderChecklist();
      });
      renderChecklist();
    }
  }
})().catch((error) => {
  document.querySelector('#article-content').innerHTML = `<p class="error-state">${esc(error.message)}</p>`;
});
