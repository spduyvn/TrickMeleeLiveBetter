/**
 * admin.js — Màn hình quản trị xác minh & chỉnh sửa bài viết (có bảo mật Admin)
 * Hỗ trợ 2 chế độ:
 *   1. Local Write Mode (`node scripts/admin.js`): xác thực tài khoản cục bộ (cookie HttpOnly) & ghi vào content/articles/*.json.
 *   2. GitHub Pages Mode (`github.io`): xác thực bằng GitHub Fine-grained PAT (kiểm tra quyền push) & commit trực tiếp qua GitHub API.
 */
(function () {
  'use strict';

  const BASE =
    document.querySelector('link[href*="/assets/admin.css"]')
      ?.getAttribute('href')
      ?.replace(/\/assets\/admin\.css$/, '') || '';

  const DRAFT_KEY = 'sth-admin-drafts';
  const GH_SESSION_KEY = 'sth-admin-gh-session';
  const THEME_KEY = 'guide-theme';
  const DEFAULT_GH_REPO = 'spduyvn/TrickMeleeLiveBetter';
  const DEFAULT_GH_BRANCH = 'main';

  const STATUS_LABELS = {
    needs_review: 'Chờ rà soát',
    verified: 'Đã xác minh',
    outdated: 'Cần cập nhật',
    disputed: 'Có tranh luận',
    draft: 'Bản nháp',
  };

  const state = {
    mode: 'github', // 'local' | 'github'
    authenticated: false,
    username: null,
    gh: null, // { token, owner, repo, branch, fileShas: Map, fileLists: Map }
    categories: [],
    categoryMap: new Map(),
    files: [],
    articles: [],
    filtered: [],
    selectedId: null,
    dirty: false,
    filters: {
      q: '',
      status: '',
      category: '',
      evidence: '',
      file: '',
    },
    drafts: {},
  };

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  const normalize = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

  const todayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  function loadLocalDrafts() {
    try {
      state.drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') || {};
    } catch {
      state.drafts = {};
    }
  }

  function saveLocalDraft(article) {
    state.drafts[article.id] = article;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state.drafts));
    } catch { /* ignore quota */ }
  }

  function showToast(msg, type = 'ok') {
    const el = document.getElementById('a-toast');
    if (!el) return;
    el.className = `a-toast ${type}`;
    el.textContent = msg;
    el.hidden = false;
  }

  function clearToast() {
    const el = document.getElementById('a-toast');
    if (el) el.hidden = true;
  }

  function setDirty(flag) {
    state.dirty = flag;
    const badge = document.getElementById('a-dirty');
    if (badge) badge.hidden = !flag;
  }

  function getSelectedArticle() {
    return state.articles.find((a) => a.id === state.selectedId) || null;
  }

  /* ── Form <-> Article Serialization ─────────────────────────── */
  const linesToArr = (str) =>
    String(str || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const arrToLines = (arr) => (Array.isArray(arr) ? arr.join('\n') : '');

  function readFormAsArticle() {
    const base = getSelectedArticle();
    if (!base) return null;
    const form = document.getElementById('a-form');
    const get = (name) => form.elements[name]?.value ?? '';

    const tags = get('tags')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const sources = [];
    document.querySelectorAll('#a-sources-list .a-src-card').forEach((card) => {
      const val = (k) => card.querySelector(`[data-src="${k}"]`)?.value.trim() || '';
      const title = val('title');
      const url = val('url');
      if (!title && !url) return;
      sources.push({
        title,
        organization: val('organization'),
        url,
        country: val('country'),
        source_type: val('source_type'),
        published_at: val('published_at') || null,
        accessed_at: val('accessed_at') || null,
      });
    });

    const out = {
      ...base,
      title: get('title').trim(),
      slug: get('slug').trim(),
      category: get('category'),
      tags,
      cost: get('cost').trim() || null,
      reading_time: get('reading_time').trim() || null,
      time: get('time').trim() || null,
      effort: get('effort').trim() || null,
      benefits: linesToArr(get('benefits')),
      risks: linesToArr(get('risks')),
      target_groups: linesToArr(get('target_groups')),
      value_level: get('value_level') || null,
      evidence_level: get('evidence_level') || null,
      evidence_notes: get('evidence_notes').trim(),
      description: get('description').trim(),
      body: get('body').trim(),
      sources,
      verified_at: get('verified_at').trim() || null,
      review_status: get('review_status'),
      status_label: get('status_label').trim() || STATUS_LABELS[get('review_status')] || get('review_status'),
      last_updated: get('last_updated').trim() || null,
    };
    delete out.facets;
    return out;
  }

  function renderSourcesEditor(sources) {
    const list = document.getElementById('a-sources-list');
    list.textContent = '';
    const arr = Array.isArray(sources) ? sources : [];
    if (!arr.length) {
      list.innerHTML = '<p class="a-muted">Chưa có nguồn nào. Nhấn "+ Thêm nguồn" để bổ sung.</p>';
      return;
    }
    arr.forEach((src, i) => {
      list.appendChild(createSourceCard(src, i));
    });
  }

  function createSourceCard(src = {}, index = 0) {
    const card = document.createElement('div');
    card.className = 'a-src-card';
    const url = src.url || '';
    card.innerHTML = `
      <div class="a-src-head">
        <strong>Nguồn #${index + 1}</strong>
        <div class="a-src-actions">
          <a class="a-mini-btn" data-open-url href="${esc(url || '#')}" target="_blank" rel="noopener noreferrer" ${url ? '' : 'hidden'}>Mở link ↗</a>
          <button type="button" class="a-danger-btn" data-remove-src>Xóa</button>
        </div>
      </div>
      <div class="a-grid-2">
        <label class="a-field a-span-2">
          <span>Tên tài liệu / văn bản *</span>
          <input type="text" data-src="title" value="${esc(src.title || '')}">
        </label>
        <label class="a-field">
          <span>Cơ quan / Tạp chí phát hành</span>
          <input type="text" data-src="organization" value="${esc(src.organization || '')}">
        </label>
        <label class="a-field">
          <span>URL nguồn trực tiếp *</span>
          <input type="url" data-src="url" value="${esc(src.url || '')}" placeholder="https://...">
        </label>
        <label class="a-field">
          <span>Quốc gia / Phạm vi</span>
          <input type="text" data-src="country" value="${esc(src.country || '')}" placeholder="Việt Nam / Quốc tế">
        </label>
        <label class="a-field">
          <span>Loại hình nguồn</span>
          <input type="text" data-src="source_type" value="${esc(src.source_type || '')}" placeholder="Văn bản nhà nước, Tổng quan hệ thống...">
        </label>
        <label class="a-field">
          <span>Ngày công bố (YYYY-MM-DD)</span>
          <input type="text" data-src="published_at" value="${esc(src.published_at || '')}" placeholder="2024-01-15">
        </label>
        <label class="a-field">
          <span>Ngày truy cập (YYYY-MM-DD)</span>
          <div class="a-inline-input">
            <input type="text" data-src="accessed_at" value="${esc(src.accessed_at || '')}" placeholder="2026-11-11">
            <button type="button" class="a-mini-btn" data-src-today>Hôm nay</button>
          </div>
        </label>
      </div>`;
    return card;
  }

  function populateForm(article) {
    const form = document.getElementById('a-form');
    const set = (name, val) => {
      if (form.elements[name]) form.elements[name].value = val ?? '';
    };

    set('title', article.title);
    set('slug', article.slug);
    set('category', article.category);
    set('review_status', article.review_status);
    set('status_label', article.status_label || STATUS_LABELS[article.review_status] || '');
    set('verified_at', article.verified_at || '');
    set('last_updated', article.last_updated || '');
    set('tags', Array.isArray(article.tags) ? article.tags.join(', ') : '');
    set('description', article.description || '');
    set('evidence_level', article.evidence_level || '');
    set('value_level', article.value_level || '');
    set('reading_time', article.reading_time || '');
    set('cost', article.cost || '');
    set('time', article.time || '');
    set('effort', article.effort || '');
    set('benefits', arrToLines(article.benefits));
    set('risks', arrToLines(article.risks));
    set('target_groups', arrToLines(article.target_groups));
    set('body', article.body || '');
    set('evidence_notes', article.evidence_notes || '');

    renderSourcesEditor(article.sources);
    updateBodyStats();
    refreshInspectorViews();
  }

  function updateBodyStats() {
    const body = document.getElementById('a-form')?.elements.body?.value || '';
    const words = body.trim() ? body.trim().split(/\s+/).length : 0;
    const paras = body.trim() ? body.trim().split(/\n\n+/).length : 0;
    const el = document.getElementById('a-body-stats');
    if (el) el.textContent = `${words} từ · ${paras} đoạn`;
  }

  /* ── Editorial Checklist & Normalization ────────────────────── */
  function evaluateChecklist(art) {
    const checks = [
      {
        ok: Boolean(art.title && art.slug && art.description),
        label: 'Đủ trường bắt buộc (title, slug, description)',
        detail: 'Cần có tiêu đề, slug và mô tả ngắn rõ ràng.',
      },
      {
        ok: ['A', 'B', 'C'].includes(art.evidence_level),
        label: `Mức độ bằng chứng chuẩn hóa A/B/C (hiện tại: ${art.evidence_level || 'trống'})`,
        detail: 'Thang phân loại sử dụng A, B hoặc C (tránh để high/medium/low).',
      },
      {
        ok: ['Rất cao', 'Cao', 'Trung bình'].includes(art.value_level),
        label: `Mức độ giá trị chuẩn hóa tiếng Việt (hiện tại: ${art.value_level || 'trống'})`,
        detail: 'Dùng "Rất cao", "Cao" hoặc "Trung bình".',
      },
      {
        ok: Array.isArray(art.sources) && art.sources.length > 0 && art.sources.every((s) => /^https?:\/\//i.test(s.url || '')),
        label: `Có nguồn tham khảo hợp lệ (${art.sources?.length || 0} nguồn)`,
        detail: 'Mỗi bài cần ít nhất 1 nguồn có URL trực tiếp và đã được kiểm tra.',
      },
      {
        ok: Boolean(art.evidence_notes && art.evidence_notes.length >= 30),
        label: 'Có ghi chú bằng chứng & bối cảnh áp dụng tại Việt Nam',
        detail: 'Ghi rõ thiết kế nghiên cứu, phạm vi và giới hạn chuyển giao cho Việt Nam.',
      },
      {
        ok: Boolean(art.body && art.body.length >= 120),
        label: 'Nội dung chính (body) đầy đủ',
        detail: 'Trình bày rõ bản chất, cách làm, lợi ích và ngoại lệ.',
      },
      {
        ok: art.review_status !== 'verified' || /^\d{4}-\d{2}-\d{2}$/.test(art.verified_at || ''),
        label: 'Ngày xác minh (verified_at) hợp lệ khi đặt verified',
        detail: 'Định dạng YYYY-MM-DD.',
      },
    ];
    return checks;
  }

  function refreshInspectorViews() {
    const art = readFormAsArticle();
    if (!art) return;

    // Warnings & Normalize button
    const needsNorm =
      ['high', 'medium', 'low'].includes(art.evidence_level) ||
      ['high', 'medium'].includes(art.value_level);
    const normBtn = document.getElementById('a-normalize-btn');
    if (normBtn) normBtn.hidden = !needsNorm;

    const checks = evaluateChecklist(art);
    const failed = checks.filter((c) => !c.ok);
    const badge = document.getElementById('a-check-badge');
    if (badge) badge.textContent = `${checks.length - failed.length}/${checks.length}`;

    const warnBox = document.getElementById('a-warnings');
    if (warnBox) {
      if (failed.length) {
        warnBox.hidden = false;
        warnBox.innerHTML = `<strong>Lưu ý kiểm chứng (${failed.length} mục chưa đạt):</strong><ul>${failed
          .map((f) => `<li>${esc(f.label)}</li>`)
          .join('')}</ul>`;
      } else {
        warnBox.hidden = true;
      }
    }

    const clEl = document.getElementById('a-checklist');
    if (clEl) {
      clEl.innerHTML = checks
        .map(
          (c) => `<li class="${c.ok ? 'pass' : 'warn'}"><span class="ck-icon">${c.ok ? '✓' : '!'}</span><div><strong>${esc(c.label)}</strong><div class="a-muted">${esc(c.detail)}</div></div></li>`
        )
        .join('');
    }

    // JSON view
    const jsonEl = document.getElementById('a-json-pre');
    if (jsonEl) {
      const clean = { ...art };
      delete clean._file;
      jsonEl.textContent = JSON.stringify(clean, null, 2);
    }

    // Preview view
    const prevEl = document.getElementById('a-preview-box');
    if (prevEl) {
      const cat = state.categoryMap.get(art.category);
      const bodyParas = (art.body || '')
        .split(/\n\n+/)
        .map((p) => `<p>${esc(p)}</p>`)
        .join('');
      prevEl.innerHTML = `
        <div><span class="a-badge ${esc(art.review_status)}">${esc(art.status_label || art.review_status)}</span> <span class="a-badge ev">${esc(art.evidence_level || 'Chưa đánh giá')}</span></div>
        <h1>${esc(art.title)}</h1>
        <p class="a-muted">Danh mục: ${esc(cat ? cat.name : art.category)} · Cập nhật: ${esc(art.last_updated || 'chưa có')} · Xác minh: ${esc(art.verified_at || 'chưa có')}</p>
        <div class="a-prev-desc">${esc(art.description)}</div>
        <dl class="a-prev-meta">
          <div><dt>Chi phí</dt><dd>${esc(art.cost || 'Chưa cung cấp')}</dd></div>
          <div><dt>Thời gian</dt><dd>${esc(art.time || 'Chưa cung cấp')}</dd></div>
          <div><dt>Công sức</dt><dd>${esc(art.effort || 'Chưa cung cấp')}</dd></div>
          <div><dt>Giá trị</dt><dd>${esc(art.value_level || 'Chưa đánh giá')}</dd></div>
          <div><dt>Lợi ích</dt><dd>${(art.benefits || []).map(esc).join('<br>') || 'Chưa có'}</dd></div>
          <div><dt>Rủi ro</dt><dd>${(art.risks || []).map(esc).join('<br>') || 'Chưa có'}</dd></div>
        </dl>
        <h3>Nội dung</h3>
        ${bodyParas || '<p class="a-muted">Trống</p>'}
        <h3>Bằng chứng &amp; giới hạn</h3>
        <p>${esc(art.evidence_notes || 'Chưa có')}</p>
        <h3>Nguồn tham khảo (${art.sources?.length || 0})</h3>
        <ul>${(art.sources || [])
          .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> — ${esc(s.organization)} (${esc(s.country)})</li>`)
          .join('') || '<li>Chưa có nguồn</li>'}</ul>`;
    }
  }

  /* ── Queue & Filtering ──────────────────────────────────────── */
  function updateCounters() {
    const counts = { all: state.articles.length, needs_review: 0, verified: 0, outdated: 0, disputed: 0, draft: 0 };
    for (const a of state.articles) {
      if (counts[a.review_status] !== undefined) counts[a.review_status]++;
    }
    for (const [k, v] of Object.entries(counts)) {
      const el = document.getElementById(`cnt-${k}`);
      if (el) el.textContent = String(v);
    }
    const pct = counts.all ? Math.round((counts.verified / counts.all) * 100) : 0;
    const pText = document.getElementById('a-progress-text');
    const pFill = document.getElementById('a-progress-fill');
    if (pText) pText.textContent = `${counts.verified} / ${counts.all} đã xác minh (${pct}%)`;
    if (pFill) pFill.style.width = `${pct}%`;
  }

  function applyQueueFilters() {
    const q = normalize(state.filters.q);
    state.filtered = state.articles.filter((a) => {
      if (state.filters.status && a.review_status !== state.filters.status) return false;
      if (state.filters.category && a.category !== state.filters.category) return false;
      if (state.filters.file && a._file !== state.filters.file) return false;
      if (state.filters.evidence) {
        const ev = String(a.evidence_level || '');
        if (state.filters.evidence === 'unnormalized' && !['high', 'medium', 'low'].includes(ev)) return false;
        if (state.filters.evidence === 'none' && ev !== '') return false;
        if (['A', 'B', 'C'].includes(state.filters.evidence) && ev !== state.filters.evidence) return false;
        if (state.filters.evidence === 'no_vn_src') {
          const hasVn = (a.sources || []).some((s) => /việt nam|viet nam|^vn$/i.test(String(s.country || '')));
          if (hasVn) return false;
        }
        if (state.filters.evidence === 'no_verified_at' && a.verified_at) return false;
      }
      if (q) {
        const hay = normalize([a.id, a.slug, a.title, a.description, ...(a.tags || [])].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    renderQueueList();
  }

  function renderQueueList() {
    const list = document.getElementById('a-queue-list');
    const cnt = document.getElementById('a-queue-count');
    if (cnt) cnt.textContent = `${state.filtered.length} / ${state.articles.length} bài`;

    if (!state.filtered.length) {
      list.innerHTML = '<p class="a-muted" style="padding:16px">Không có bài nào khớp bộ lọc.</p>';
      updateToolbarNav();
      return;
    }

    const frag = document.createDocumentFragment();
    for (const art of state.filtered) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `a-qitem${art.id === state.selectedId ? ' active' : ''}`;
      btn.dataset.id = art.id;
      const evLabel = art.evidence_level || '—';
      btn.innerHTML = `
        <div class="a-qitem-top">
          <span class="a-qitem-id">${esc(art.id)}</span>
          <span class="a-badge ev">${esc(evLabel)}</span>
          <span class="a-badge ${esc(art.review_status)}">${esc(STATUS_LABELS[art.review_status] || art.review_status)}</span>
        </div>
        <div class="a-qitem-title">${esc(art.title)}</div>`;
      frag.appendChild(btn);
    }
    list.textContent = '';
    list.appendChild(frag);
    updateToolbarNav();
  }

  function updateToolbarNav() {
    const idx = state.filtered.findIndex((a) => a.id === state.selectedId);
    const posEl = document.getElementById('a-pos');
    const prevBtn = document.getElementById('a-prev');
    const nextBtn = document.getElementById('a-next');
    if (posEl) posEl.textContent = idx >= 0 ? `${idx + 1} / ${state.filtered.length}` : `0 / ${state.filtered.length}`;
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx < 0 || idx >= state.filtered.length - 1;
  }

  function selectArticle(id, skipDirtyCheck = false) {
    if (!skipDirtyCheck && state.dirty && id !== state.selectedId) {
      if (!confirm('Bài hiện tại có thay đổi chưa lưu. Chuyển sang bài khác và bỏ thay đổi?')) return;
    }
    const art = state.articles.find((a) => a.id === id);
    if (!art) return;

    state.selectedId = id;
    setDirty(false);
    clearToast();

    document.getElementById('a-empty-main').hidden = true;
    document.getElementById('a-editor-shell').hidden = false;
    document.getElementById('a-id-badge').textContent = art.id;

    const fileBadge = document.getElementById('a-file-badge');
    if (fileBadge) {
      fileBadge.textContent = art._file || '';
      fileBadge.hidden = !art._file;
    }

    const guideLink = document.getElementById('a-view-guide');
    if (guideLink) guideLink.href = `${BASE}/guide/#item-${encodeURIComponent(art.id)}`;

    document.querySelectorAll('#a-queue-list .a-qitem').forEach((el) => {
      const isAct = el.dataset.id === id;
      el.classList.toggle('active', isAct);
      if (isAct) el.scrollIntoView({ block: 'nearest' });
    });

    populateForm(art);
    updateToolbarNav();

    const params = new URLSearchParams(location.search);
    params.set('id', id);
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  }

  /* ── GitHub API Helpers (Online Auth & Commit) ──────────────── */
  function ghHeaders(token) {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 0x8000) {
      chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)));
    }
    return btoa(chunks.join(''));
  }

  function base64ToUtf8(b64) {
    const bin = atob(String(b64 || '').replace(/\s+/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  async function ghJson(url, token, options = {}) {
    const resp = await fetch(url, {
      ...options,
      headers: {
        ...ghHeaders(token),
        ...(options.headers || {}),
      },
    });
    const text = await resp.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = null;
    }
    if (!resp.ok) {
      const err = new Error(payload?.message || `GitHub API lỗi HTTP ${resp.status}`);
      err.status = resp.status;
      throw err;
    }
    return payload;
  }

  async function verifyGithubSession(repoSlug, branch, token) {
    const cleanRepo = String(repoSlug || '').trim();
    const cleanBranch = String(branch || 'main').trim() || 'main';
    const cleanToken = String(token || '').trim();

    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(cleanRepo)) {
      throw new Error('Tên kho GitHub phải đúng định dạng owner/repo (ví dụ: spduyvn/TrickMeleeLiveBetter).');
    }
    if (!cleanToken) throw new Error('Vui lòng nhập GitHub Personal Access Token.');

    const [owner, repo] = cleanRepo.split('/');
    const user = await ghJson('https://api.github.com/user', cleanToken);
    const repoInfo = await ghJson(`https://api.github.com/repos/${owner}/${repo}`, cleanToken);

    const perms = repoInfo.permissions || {};
    if (!perms.push && !perms.admin && !perms.maintain) {
      throw new Error(`Tài khoản @${user.login} không có quyền ghi (push) vào ${cleanRepo}.`);
    }

    await ghJson(
      `https://api.github.com/repos/${owner}/${repo}/branches/${encodeURIComponent(cleanBranch)}`,
      cleanToken
    );

    return { token: cleanToken, owner, repo, branch: cleanBranch, username: user.login };
  }

  async function loadGithubAdminData(ghSession) {
    const { token, owner, repo, branch } = ghSession;
    const baseApi = `https://api.github.com/repos/${owner}/${repo}`;

    const catMeta = await ghJson(
      `${baseApi}/contents/content/categories/categories.json?ref=${encodeURIComponent(branch)}`,
      token
    );
    const catJson = catMeta.content
      ? JSON.parse(base64ToUtf8(catMeta.content))
      : JSON.parse(base64ToUtf8((await ghJson(`${baseApi}/git/blobs/${catMeta.sha}`, token)).content));

    const dirEntries = await ghJson(
      `${baseApi}/contents/content/articles?ref=${encodeURIComponent(branch)}`,
      token
    );
    const jsonEntries = (Array.isArray(dirEntries) ? dirEntries : [])
      .filter((entry) => entry.type === 'file' && entry.name.endsWith('.json'))
      .sort((a, b) => a.name.localeCompare(b.name));

    const fileShas = new Map();
    const fileLists = new Map();
    const articles = [];

    const blobs = await Promise.all(
      jsonEntries.map(async (entry) => {
        const blob = await ghJson(`${baseApi}/git/blobs/${entry.sha}`, token);
        const list = JSON.parse(base64ToUtf8(blob.content));
        return { name: entry.name, sha: entry.sha, list };
      })
    );

    for (const item of blobs) {
      fileShas.set(item.name, item.sha);
      const list = Array.isArray(item.list) ? item.list : [];
      fileLists.set(item.name, list);
      for (const art of list) {
        articles.push({ ...art, _file: item.name });
      }
    }

    return {
      categories: Array.isArray(catJson) ? catJson : [],
      files: jsonEntries.map((e) => e.name),
      articles,
      fileShas,
      fileLists,
    };
  }

  /* ── Save / Verify / Build Actions ──────────────────────────── */
  async function persistArticle(updated, successMsg) {
    const idx = state.articles.findIndex((a) => a.id === updated.id);
    if (idx === -1) return;

    if (state.mode === 'local') {
      const resp = await fetch('/api/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: updated._file, article: updated }),
      });
      if (resp.status === 401) {
        showAuthLock('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        showToast('Phiên đăng nhập đã hết hạn.', 'err');
        return;
      }
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        const msg = Array.isArray(data.errors) ? data.errors.join(' ') : data.error || 'Lỗi khi lưu.';
        showToast(msg, 'err');
        return;
      }
      state.articles[idx] = data.article;
      setDirty(false);
      populateForm(data.article);
      updateCounters();
      applyQueueFilters();
      showToast(successMsg || `Đã lưu ${updated.id} vào content/articles/${updated._file}.`, 'ok');
    } else if (state.mode === 'github' && state.gh) {
      const targetFile = updated._file;
      const list = (state.gh.fileLists.get(targetFile) || []).slice();
      const fileIdx = list.findIndex((item) => item.id === updated.id);
      if (fileIdx === -1) {
        showToast(`Không tìm thấy ${updated.id} trong ${targetFile}.`, 'err');
        return;
      }

      const clean = { ...updated };
      delete clean._file;
      delete clean.facets;
      list[fileIdx] = clean;

      const saveBtn = document.getElementById('a-save-btn');
      const verifyBtn = document.getElementById('a-verify-btn');
      saveBtn.disabled = true;
      verifyBtn.disabled = true;

      try {
        const { token, owner, repo, branch } = state.gh;
        const actionVerb = clean.review_status === 'verified' ? 'verify' : 'update';
        const res = await ghJson(
          `https://api.github.com/repos/${owner}/${repo}/contents/content/articles/${encodeURIComponent(targetFile)}`,
          token,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `admin(${actionVerb}): ${clean.id} (${clean.review_status})`,
              content: utf8ToBase64(JSON.stringify(list, null, 2) + '\n'),
              sha: state.gh.fileShas.get(targetFile),
              branch,
            }),
          }
        );

        if (res?.content?.sha) state.gh.fileShas.set(targetFile, res.content.sha);
        state.gh.fileLists.set(targetFile, list);
        const stored = { ...clean, _file: targetFile };
        state.articles[idx] = stored;
        setDirty(false);
        populateForm(stored);
        updateCounters();
        applyQueueFilters();
        const shortSha = res?.commit?.sha ? ` (${res.commit.sha.slice(0, 7)})` : '';
        showToast(successMsg || `Đã commit ${updated.id} lên ${targetFile}${shortSha}.`, 'ok');
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          saveLocalDraft(updated);
          sessionStorage.removeItem(GH_SESSION_KEY);
          showAuthLock('GitHub Token hết hạn hoặc thiếu quyền ghi. Thay đổi đang được giữ tạm.');
          showToast(err.message, 'err');
        } else if (err.status === 409) {
          showToast('Tệp trên GitHub đã thay đổi do commit khác. Hãy tải lại trang để đồng bộ SHA mới.', 'err');
        } else {
          showToast(`Lỗi commit GitHub: ${err.message}`, 'err');
        }
      } finally {
        saveBtn.disabled = false;
        verifyBtn.disabled = false;
      }
    }
  }

  async function handleSave() {
    const updated = readFormAsArticle();
    if (!updated) return;
    if (!updated.last_updated) updated.last_updated = todayISO();
    await persistArticle(updated, `Đã lưu thay đổi cho ${updated.id}.`);
  }

  async function handleVerify() {
    const updated = readFormAsArticle();
    if (!updated) return;
    const today = todayISO();

    // Auto-normalize if still using English legacy values
    if (updated.evidence_level === 'high') updated.evidence_level = 'A';
    if (updated.evidence_level === 'medium') updated.evidence_level = 'B';
    if (updated.evidence_level === 'low') updated.evidence_level = 'C';
    if (updated.value_level === 'high') updated.value_level = 'Cao';
    if (updated.value_level === 'medium') updated.value_level = 'Trung bình';

    updated.review_status = 'verified';
    updated.status_label = 'Đã xác minh';
    if (!updated.verified_at) updated.verified_at = today;
    updated.last_updated = today;

    const checks = evaluateChecklist(updated);
    const failed = checks.filter((c) => !c.ok);
    if (failed.length) {
      const ok = confirm(
        `Còn ${failed.length} mục kiểm chứng chưa đạt:\n- ${failed.map((f) => f.label).join('\n- ')}\n\nBạn vẫn muốn xác minh bài này?`
      );
      if (!ok) return;
    }

    await persistArticle(updated, `✓ Đã xác minh bài ${updated.id} (${today}).`);
  }

  function handleNormalizeCurrent() {
    const form = document.getElementById('a-form');
    const ev = form.elements.evidence_level;
    const val = form.elements.value_level;
    if (ev.value === 'high') ev.value = 'A';
    else if (ev.value === 'medium') ev.value = 'B';
    else if (ev.value === 'low') ev.value = 'C';
    if (val.value === 'high') val.value = 'Cao';
    else if (val.value === 'medium') val.value = 'Trung bình';
    setDirty(true);
    refreshInspectorViews();
    showToast('Đã chuẩn hóa nhãn bằng chứng và giá trị — nhấn Lưu để ghi lại.', 'ok');
  }

  async function handleBuild() {
    const btn = document.getElementById('a-build-btn');
    btn.disabled = true;
    btn.textContent = 'Đang build…';
    try {
      const resp = await fetch('/api/build', { method: 'POST' });
      if (resp.status === 401) {
        showAuthLock('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Build thất bại');
      showToast(`Build thành công: ${data.log.replace(/\n+/g, ' | ')}`, 'ok');
    } catch (err) {
      showToast(`Lỗi build: ${err.message}`, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Build & Kiểm tra';
    }
  }

  function slugifyVi(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'bai-viet';
  }

  function closeNewArticleModal() {
    document.getElementById('a-new-modal').hidden = true;
  }

  async function handleCreateArticle(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const btn = document.getElementById('a-new-submit');
    const title = form.elements.title.value.trim();
    const category = form.elements.category.value;
    const description = form.elements.description.value.trim();
    if (!title || !category || !description) return;

    btn.disabled = true;
    btn.textContent = 'Đang tạo…';
    try {
      if (state.mode === 'local') {
        const resp = await fetch('/api/article/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, description }),
        });
        if (resp.status === 401) {
          closeNewArticleModal();
          showAuthLock('Phiên đăng nhập đã hết hạn.');
          return;
        }
        const data = await resp.json();
        if (!resp.ok || !data.ok) throw new Error(data.error || 'Không thể tạo bài viết.');
        state.articles.unshift(data.article);
        closeNewArticleModal();
        form.reset();
        updateCounters();
        applyQueueFilters();
        selectArticle(data.article.id, true);
        showToast(`Đã tạo bài mới ${data.article.id} (${data.article._file}).`, 'ok');
      } else if (state.mode === 'github' && state.gh) {
        const usedIds = new Set(state.articles.map((a) => a.id));
        const usedSlugs = new Set(state.articles.map((a) => a.slug));
        const baseSlug = slugifyVi(title);
        let slug = baseSlug;
        let seq = 2;
        while (usedSlugs.has(slug)) { slug = `${baseSlug}-${seq}`; seq += 1; }
        let id = `${category}-${baseSlug}`;
        let idSeq = 2;
        while (usedIds.has(id)) { id = `${category}-${baseSlug}-${idSeq}`; idSeq += 1; }

        const targetFile = state.files.includes(`${category}.json`) ? `${category}.json` : (state.files[0] || `${category}.json`);
        const today = todayISO();
        const newArticle = {
          id,
          slug,
          title,
          category,
          tags: [],
          cost: null,
          reading_time: '3 phút',
          time: null,
          effort: null,
          benefits: [],
          risks: [],
          target_groups: ['Mọi người'],
          value_level: 'Cao',
          evidence_level: 'B',
          evidence_notes: '',
          description,
          body: '',
          sources: [],
          verified_at: null,
          review_status: 'draft',
          status_label: 'Bản nháp',
          last_updated: today,
        };

        const list = [newArticle, ...(state.gh.fileLists.get(targetFile) || [])];
        const { token, owner, repo, branch } = state.gh;
        const res = await ghJson(
          `https://api.github.com/repos/${owner}/${repo}/contents/content/articles/${encodeURIComponent(targetFile)}`,
          token,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `admin(create): ${id}`,
              content: utf8ToBase64(JSON.stringify(list, null, 2) + '\n'),
              sha: state.gh.fileShas.get(targetFile),
              branch,
            }),
          }
        );
        if (res?.content?.sha) state.gh.fileShas.set(targetFile, res.content.sha);
        state.gh.fileLists.set(targetFile, list);
        const stored = { ...newArticle, _file: targetFile };
        state.articles.unshift(stored);
        closeNewArticleModal();
        form.reset();
        updateCounters();
        applyQueueFilters();
        selectArticle(stored.id, true);
        showToast(`Đã tạo & commit bài mới ${stored.id} lên ${targetFile}.`, 'ok');
      }
    } catch (err) {
      showToast(`Lỗi tạo bài: ${err.message}`, 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Tạo & Mở trình biên tập';
    }
  }

  async function handleBatchNormalize() {
    if (state.mode !== 'local') return;
    if (!confirm('Chuẩn hóa tất cả high/medium/low thành A/B/C và Cao/Trung bình/Thấp trên toàn bộ content/articles/*.json?')) {
      return;
    }
    const btn = document.getElementById('a-batch-normalize-btn');
    btn.disabled = true;
    try {
      const resp = await fetch('/api/normalize-batch', { method: 'POST' });
      if (resp.status === 401) {
        showAuthLock('Phiên đăng nhập đã hết hạn.');
        return;
      }
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || 'Chuẩn hóa thất bại');
      await enterLocalSession(state.username);
      showToast(`Đã chuẩn hóa ${data.updatedCount} bài trong ${data.touchedFiles?.length || 0} tệp.`, 'ok');
    } catch (err) {
      showToast(`Lỗi chuẩn hóa: ${err.message}`, 'err');
    } finally {
      btn.disabled = false;
    }
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── Wire Events ────────────────────────────────────────────── */
  function wireEvents() {
    // Mobile queue drawer
    const queue = document.getElementById('a-queue');
    const backdrop = document.getElementById('a-backdrop');
    const menuBtn = document.getElementById('a-menu');
    const setDrawer = (on) => {
      queue.classList.toggle('open', on);
      backdrop.classList.toggle('on', on);
      menuBtn.setAttribute('aria-expanded', String(on));
    };
    menuBtn?.addEventListener('click', () => setDrawer(!queue.classList.contains('open')));
    backdrop?.addEventListener('click', () => setDrawer(false));

    // Theme
    document.getElementById('a-theme')?.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch {}
    });

    // Queue filters
    let qTimer = 0;
    document.getElementById('a-q').addEventListener('input', (ev) => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        state.filters.q = ev.target.value.trim();
        applyQueueFilters();
      }, 120);
    });

    document.getElementById('a-status-pills').addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-status]');
      if (!btn) return;
      state.filters.status = btn.dataset.status;
      document.querySelectorAll('#a-status-pills .a-pill').forEach((p) => p.classList.toggle('active', p === btn));
      applyQueueFilters();
    });

    document.getElementById('a-f-cat').addEventListener('change', (ev) => {
      state.filters.category = ev.target.value;
      applyQueueFilters();
    });
    document.getElementById('a-f-ev').addEventListener('change', (ev) => {
      state.filters.evidence = ev.target.value;
      applyQueueFilters();
    });
    document.getElementById('a-f-file').addEventListener('change', (ev) => {
      state.filters.file = ev.target.value;
      applyQueueFilters();
    });
    document.getElementById('a-reset-filters').addEventListener('click', () => {
      state.filters = { q: '', status: '', category: '', evidence: '', file: '' };
      document.getElementById('a-q').value = '';
      document.getElementById('a-f-cat').value = '';
      document.getElementById('a-f-ev').value = '';
      document.getElementById('a-f-file').value = '';
      document.querySelectorAll('#a-status-pills .a-pill').forEach((p) => p.classList.toggle('active', p.dataset.status === ''));
      applyQueueFilters();
    });

    // Queue item click
    document.getElementById('a-queue-list').addEventListener('click', (ev) => {
      const btn = ev.target.closest('.a-qitem');
      if (!btn) return;
      setDrawer(false);
      selectArticle(btn.dataset.id);
    });

    // Prev / Next
    document.getElementById('a-prev').addEventListener('click', () => {
      const idx = state.filtered.findIndex((a) => a.id === state.selectedId);
      if (idx > 0) selectArticle(state.filtered[idx - 1].id);
    });
    document.getElementById('a-next').addEventListener('click', () => {
      const idx = state.filtered.findIndex((a) => a.id === state.selectedId);
      if (idx >= 0 && idx < state.filtered.length - 1) selectArticle(state.filtered[idx + 1].id);
    });

    // Tabs
    document.querySelector('.a-tabs').addEventListener('click', (ev) => {
      const tab = ev.target.closest('[data-tab]');
      if (!tab) return;
      const target = tab.dataset.tab;
      document.querySelectorAll('.a-tab').forEach((t) => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      ['edit', 'preview', 'checklist', 'json'].forEach((name) => {
        const panel = document.getElementById(`tab-${name}`);
        if (panel) panel.hidden = name !== target;
      });
      refreshInspectorViews();
    });

    // Form changes
    const form = document.getElementById('a-form');
    form.addEventListener('input', (ev) => {
      setDirty(true);
      if (ev.target.name === 'body') updateBodyStats();
      if (ev.target.dataset.src === 'url') {
        const link = ev.target.closest('.a-src-card')?.querySelector('[data-open-url]');
        if (link) {
          const val = ev.target.value.trim();
          link.href = val || '#';
          link.hidden = !val;
        }
      }
      refreshInspectorViews();
    });

    form.elements.review_status.addEventListener('change', (ev) => {
      const st = ev.target.value;
      form.elements.status_label.value = STATUS_LABELS[st] || st;
      if (st === 'verified' && !form.elements.verified_at.value) {
        form.elements.verified_at.value = todayISO();
      }
      setDirty(true);
      refreshInspectorViews();
    });

    form.addEventListener('click', (ev) => {
      const todayBtn = ev.target.closest('[data-today]');
      if (todayBtn) {
        const field = form.elements[todayBtn.dataset.today];
        if (field) {
          field.value = todayISO();
          setDirty(true);
          refreshInspectorViews();
        }
        return;
      }
      const srcToday = ev.target.closest('[data-src-today]');
      if (srcToday) {
        const input = srcToday.closest('.a-inline-input')?.querySelector('input');
        if (input) {
          input.value = todayISO();
          setDirty(true);
          refreshInspectorViews();
        }
        return;
      }
      const rmBtn = ev.target.closest('[data-remove-src]');
      if (rmBtn) {
        rmBtn.closest('.a-src-card')?.remove();
        document.querySelectorAll('#a-sources-list .a-src-card strong').forEach((s, i) => {
          s.textContent = `Nguồn #${i + 1}`;
        });
        setDirty(true);
        refreshInspectorViews();
      }
    });

    document.getElementById('a-add-source').addEventListener('click', () => {
      const list = document.getElementById('a-sources-list');
      const placeholder = list.querySelector('.a-muted');
      if (placeholder) placeholder.remove();
      const idx = list.querySelectorAll('.a-src-card').length;
      list.appendChild(createSourceCard({ accessed_at: todayISO() }, idx));
      setDirty(true);
      refreshInspectorViews();
    });

    // Action buttons
    document.getElementById('a-save-btn').addEventListener('click', handleSave);
    document.getElementById('a-verify-btn').addEventListener('click', handleVerify);
    document.getElementById('a-normalize-btn').addEventListener('click', handleNormalizeCurrent);
    document.getElementById('a-build-btn').addEventListener('click', handleBuild);

    document.getElementById('a-copy-json').addEventListener('click', async () => {
      const text = document.getElementById('a-json-pre').textContent;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Đã copy JSON bài viết vào clipboard.', 'ok');
      } catch {
        showToast('Không thể copy tự động — hãy chọn và copy trong khung JSON.', 'warn');
      }
    });

    document.getElementById('a-download-json').addEventListener('click', () => {
      const art = readFormAsArticle();
      if (!art) return;
      const clean = { ...art };
      delete clean._file;
      downloadJson(`${art.id}.json`, clean);
    });

    document.getElementById('a-download-file').addEventListener('click', () => {
      const cat = state.filters.category || readFormAsArticle()?.category || 'articles';
      const matching = state.articles
        .filter((a) => (state.filters.category ? a.category === state.filters.category : a.category === cat))
        .map((a) => {
          const clean = { ...a };
          delete clean._file;
          delete clean.facets;
          return clean;
        });
      downloadJson(`${cat}.json`, matching);
    });

    // Keyboard shortcut Ctrl+S / Cmd+S
    document.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
        ev.preventDefault();
        if (state.authenticated && state.selectedId) handleSave();
      }
    });

    // Logout & Auth forms & New article / Batch normalize
    document.getElementById('a-logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('a-auth-recheck')?.addEventListener('click', checkEnvironmentAndAuth);
    document.getElementById('a-login-local')?.addEventListener('submit', handleLocalLogin);
    document.getElementById('a-login-github')?.addEventListener('submit', handleGithubLogin);

    document.getElementById('a-new-btn')?.addEventListener('click', () => {
      document.getElementById('a-new-modal').hidden = false;
      document.getElementById('a-new-form').elements.title.focus();
    });
    document.getElementById('a-new-close')?.addEventListener('click', closeNewArticleModal);
    document.getElementById('a-new-cancel')?.addEventListener('click', closeNewArticleModal);
    document.getElementById('a-new-modal')?.addEventListener('click', (ev) => {
      if (ev.target.id === 'a-new-modal') closeNewArticleModal();
    });
    document.getElementById('a-new-form')?.addEventListener('submit', handleCreateArticle);
    document.getElementById('a-batch-normalize-btn')?.addEventListener('click', handleBatchNormalize);

    window.addEventListener('beforeunload', (ev) => {
      if (state.dirty) {
        ev.preventDefault();
        ev.returnValue = '';
      }
    });
  }

  /* ── Auth UI & Bootstrapping ────────────────────────────────── */
  function setAuthError(msg) {
    const box = document.getElementById('a-auth-error');
    if (!box) return;
    if (msg) {
      box.textContent = msg;
      box.hidden = false;
    } else {
      box.textContent = '';
      box.hidden = true;
    }
  }

  function showAuthLock(errorMsg = '') {
    state.authenticated = false;
    state.dirty = false;
    state.selectedId = null;
    state.articles = [];
    state.filtered = [];

    document.getElementById('a-layout').hidden = true;
    document.getElementById('a-auth-gate').hidden = false;
    document.getElementById('a-logout-btn').hidden = true;
    document.getElementById('a-user-badge').hidden = true;
    document.getElementById('a-build-btn').hidden = true;
    document.getElementById('a-new-btn').hidden = true;
    document.getElementById('a-batch-normalize-btn').hidden = true;
    document.getElementById('a-progress-wrap').hidden = true;

    const badge = document.getElementById('a-mode-badge');
    badge.classList.remove('local', 'static');
    badge.textContent = 'Chưa xác thực';

    const title = document.getElementById('a-auth-title');
    const sub = document.getElementById('a-auth-subtitle');
    const setupBox = document.getElementById('a-auth-setup');
    const localForm = document.getElementById('a-login-local');
    const ghForm = document.getElementById('a-login-github');

    setupBox.hidden = true;
    localForm.hidden = true;
    ghForm.hidden = true;

    if (state.mode === 'local-unconfigured') {
      title.textContent = 'Thiết lập tài khoản Admin';
      sub.textContent = 'Máy chủ cục bộ chưa có tài khoản quản trị';
      setupBox.hidden = false;
    } else if (state.mode === 'local') {
      title.textContent = 'Đăng nhập Quản trị (Local)';
      sub.textContent = 'Xác thực tài khoản máy chủ cục bộ để sửa & xác minh bài';
      localForm.hidden = false;
      localForm.elements.username.focus();
    } else {
      title.textContent = 'Đăng nhập Quản trị (GitHub Pages)';
      sub.textContent = 'Yêu cầu GitHub Token có quyền ghi (push) vào kho mã nguồn';
      ghForm.hidden = false;
      const savedRepo = ghForm.elements.repo.value.trim();
      if (!savedRepo) ghForm.elements.repo.value = DEFAULT_GH_REPO;
      if (!ghForm.elements.branch.value.trim()) ghForm.elements.branch.value = DEFAULT_GH_BRANCH;
    }

    setAuthError(errorMsg);
  }

  function hydrateWorkspace({ categories, files, articles, badgeText, badgeClass, showBuild, username }) {
    state.authenticated = true;
    state.username = username;
    state.categories = categories || [];
    state.files = files || [];
    state.articles = articles || [];
    state.categoryMap = new Map(state.categories.map((c) => [c.id, c]));

    const modeBadge = document.getElementById('a-mode-badge');
    modeBadge.classList.remove('local', 'static');
    modeBadge.textContent = badgeText;
    modeBadge.classList.add(badgeClass);

    const userBadge = document.getElementById('a-user-badge');
    userBadge.textContent = `@${username}`;
    userBadge.hidden = false;

    document.getElementById('a-logout-btn').hidden = false;
    document.getElementById('a-build-btn').hidden = !showBuild;
    document.getElementById('a-new-btn').hidden = false;
    document.getElementById('a-batch-normalize-btn').hidden = !showBuild;
    document.getElementById('a-progress-wrap').hidden = false;

    const fileSelect = document.getElementById('a-f-file');
    fileSelect.innerHTML = '<option value="">Tất cả tệp JSON</option>';
    state.files.forEach((f) => fileSelect.insertAdjacentHTML('beforeend', `<option value="${esc(f)}">${esc(f)}</option>`));
    fileSelect.hidden = state.files.length === 0;

    const fCat = document.getElementById('a-f-cat');
    const formCat = document.getElementById('f-category');
    const newCat = document.getElementById('a-new-category');
    fCat.innerHTML = '<option value="">Tất cả danh mục</option>';
    formCat.innerHTML = '';
    if (newCat) newCat.innerHTML = '';
    state.categories.forEach((c) => {
      const opt = `<option value="${esc(c.id)}">${esc(c.number)} · ${esc(c.name)}</option>`;
      fCat.insertAdjacentHTML('beforeend', opt);
      formCat.insertAdjacentHTML('beforeend', opt);
      if (newCat) newCat.insertAdjacentHTML('beforeend', opt);
    });

    document.getElementById('a-auth-gate').hidden = true;
    document.getElementById('a-layout').hidden = false;
    document.getElementById('a-editor-shell').hidden = true;
    document.getElementById('a-empty-main').hidden = false;

    updateCounters();
    applyQueueFilters();

    const reqId = new URLSearchParams(location.search).get('id');
    const initial = (reqId && state.articles.find((a) => a.id === reqId)) || state.filtered[0] || state.articles[0];
    if (initial) {
      selectArticle(initial.id, true);
    } else {
      document.getElementById('a-empty-main').innerHTML = '<p>Chưa có bài viết nào.</p>';
    }
  }

  async function enterLocalSession(username) {
    const resp = await fetch('/api/data');
    if (resp.status === 401) {
      showAuthLock('Phiên đăng nhập chưa hợp lệ.');
      return;
    }
    const data = await resp.json();
    if (!resp.ok || !data.ok) throw new Error(data.error || 'Không tải được dữ liệu cục bộ.');
    state.mode = 'local';
    hydrateWorkspace({
      categories: data.categories,
      files: data.files,
      articles: data.articles,
      badgeText: 'Ghi trực tiếp (Local)',
      badgeClass: 'local',
      showBuild: true,
      username,
    });
  }

  async function enterGithubSession(ghSession) {
    const data = await loadGithubAdminData(ghSession);
    state.mode = 'github';
    state.gh = {
      ...ghSession,
      fileShas: data.fileShas,
      fileLists: data.fileLists,
    };
    const mergedArticles = data.articles.map((a) => (state.drafts[a.id] ? { ...a, ...state.drafts[a.id] } : a));
    hydrateWorkspace({
      categories: data.categories,
      files: data.files,
      articles: mergedArticles,
      badgeText: `GitHub API (${ghSession.branch})`,
      badgeClass: 'local',
      showBuild: false,
      username: ghSession.username,
    });
  }

  async function handleLocalLogin(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const btn = document.getElementById('a-login-local-btn');
    setAuthError('');
    btn.disabled = true;
    btn.textContent = 'Đang xác thực…';

    try {
      const resp = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.elements.username.value.trim(),
          password: form.elements.password.value,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.ok) {
        setAuthError(data.error || `Đăng nhập thất bại (HTTP ${resp.status}).`);
        return;
      }
      form.elements.password.value = '';
      await enterLocalSession(data.username);
    } catch (err) {
      setAuthError(`Lỗi kết nối máy chủ: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Đăng nhập';
    }
  }

  async function handleGithubLogin(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const btn = document.getElementById('a-login-github-btn');
    setAuthError('');
    btn.disabled = true;
    btn.textContent = 'Đang kiểm tra quyền GitHub…';

    try {
      const ghSession = await verifyGithubSession(
        form.elements.repo.value,
        form.elements.branch.value,
        form.elements.token.value
      );
      sessionStorage.setItem(GH_SESSION_KEY, JSON.stringify(ghSession));
      form.elements.token.value = '';
      await enterGithubSession(ghSession);
    } catch (err) {
      sessionStorage.removeItem(GH_SESSION_KEY);
      setAuthError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Xác thực GitHub & Mở khóa';
    }
  }

  async function handleLogout() {
    if (state.dirty && !confirm('Bạn có thay đổi chưa lưu. Vẫn muốn đăng xuất?')) return;
    if (state.mode === 'local') {
      await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    } else {
      sessionStorage.removeItem(GH_SESSION_KEY);
      state.gh = null;
    }
    showAuthLock();
  }

  async function checkEnvironmentAndAuth() {
    setAuthError('');
    const health = await fetch('/api/health').then((r) => (r.ok ? r.json() : null)).catch(() => null);

    if (health?.ok && health.mode === 'local-write') {
      if (!health.configured) {
        state.mode = 'local-unconfigured';
        showAuthLock(health.authError || '');
        return;
      }
      state.mode = 'local';
      if (health.authenticated && health.username) {
        await enterLocalSession(health.username);
      } else {
        showAuthLock();
      }
      return;
    }

    state.mode = 'github';
    const rawSaved = sessionStorage.getItem(GH_SESSION_KEY);
    if (rawSaved) {
      try {
        const saved = JSON.parse(rawSaved);
        if (saved?.token && saved?.owner && saved?.repo) {
          const verified = await verifyGithubSession(`${saved.owner}/${saved.repo}`, saved.branch || DEFAULT_GH_BRANCH, saved.token);
          await enterGithubSession(verified);
          return;
        }
      } catch {
        sessionStorage.removeItem(GH_SESSION_KEY);
      }
    }
    showAuthLock();
  }

  /* ── Init ───────────────────────────────────────────────────── */
  async function init() {
    wireEvents();
    loadLocalDrafts();
    try {
      await checkEnvironmentAndAuth();
    } catch (err) {
      console.error('[admin.js]', err);
      showAuthLock(`Không khởi tạo được trang quản trị: ${err.message}`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

