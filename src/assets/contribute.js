/**
 * contribute.js — Biểu mẫu đóng góp bài viết cho Sống Tốt Hơn
 * Hỗ trợ:
 *   - Kênh 1: Gửi qua GitHub Issue Template (prefill JSON)
 *   - Kênh 2: Người không có GitHub -> Tải file JSON / Copy / Email / Form endpoint ngoài
 */
(function () {
  'use strict';

  const BASE =
    document.querySelector('link[href*="/assets/styles.css"]')
      ?.getAttribute('href')
      ?.replace(/\/assets\/styles\.css$/, '') || '';

  const GITHUB_REPO = 'spduyvn/TrickMeleeLiveBetter';
  // Tùy chọn: điền endpoint Formspree / Web3Forms / Google Apps Script nếu muốn nút "Gửi trực tiếp ngay"
  const EXTERNAL_FORM_ENDPOINT = '';
  const CONTACT_EMAIL = '';

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  const slugifyVi = (text) =>
    String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'bai-dong-gop';

  const todayISO = () => new Date().toISOString().slice(0, 10);

  function showAlert(msg, type = 'err') {
    const el = document.getElementById('c-alert');
    if (!el) return;
    el.className = `c-alert ${type}`;
    el.textContent = msg;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearAlert() {
    const el = document.getElementById('c-alert');
    if (el) el.hidden = true;
  }

  function createSourceItem(index) {
    const div = document.createElement('div');
    div.className = 'c-src-item';
    div.innerHTML = `
      <div class="c-src-top">
        <strong>Nguồn #${index + 1}</strong>
        <button type="button" class="c-btn c-btn-danger" data-rm-src>Xóa</button>
      </div>
      <div class="c-grid-2">
        <label class="c-field c-span-2">
          <span>Tên tài liệu / văn bản *</span>
          <input type="text" data-s="title" placeholder="Ví dụ: Hướng dẫn sử dụng VssID — BHXH Việt Nam">
        </label>
        <label class="c-field">
          <span>Tổ chức / Cơ quan *</span>
          <input type="text" data-s="organization" placeholder="Bảo hiểm Xã hội Việt Nam">
        </label>
        <label class="c-field">
          <span>Quốc gia</span>
          <input type="text" data-s="country" value="Việt Nam">
        </label>
        <label class="c-field">
          <span>Loại nguồn</span>
          <select data-s="source_type">
            <option value="official">Cơ quan nhà nước / chính thức</option>
            <option value="research">Nghiên cứu khoa học / y khoa</option>
            <option value="handbook">Tài liệu hướng dẫn chuyên môn</option>
            <option value="news">Báo chí chính thống</option>
          </select>
        </label>
        <label class="c-field">
          <span>Ngày/năm công bố</span>
          <input type="text" data-s="published_at" placeholder="2025">
        </label>
        <label class="c-field c-span-2">
          <span>Đường dẫn URL *</span>
          <input type="url" data-s="url" placeholder="https://baohiemxahoi.gov.vn/...">
        </label>
      </div>`;
    return div;
  }

  function renumberSources() {
    document.querySelectorAll('#c-sources-list .c-src-item strong').forEach((el, i) => {
      el.textContent = `Nguồn #${i + 1}`;
    });
  }

  function buildPayload() {
    const form = document.getElementById('c-form');
    const get = (name) => String(form.elements[name]?.value || '').trim();
    const lines = (name) =>
      get(name)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

    const title = get('title');
    const category = get('category');
    const slug = slugifyVi(title);
    const today = todayISO();

    const sources = [];
    document.querySelectorAll('#c-sources-list .c-src-item').forEach((card) => {
      const sv = (k) => String(card.querySelector(`[data-s="${k}"]`)?.value || '').trim();
      const sTitle = sv('title');
      const sUrl = sv('url');
      if (!sTitle && !sUrl) return;
      sources.push({
        title: sTitle,
        url: sUrl,
        organization: sv('organization') || 'Chưa rõ',
        country: sv('country') || 'Việt Nam',
        source_type: sv('source_type') || 'official',
        published_at: sv('published_at') || null,
        accessed_at: today,
      });
    });

    const contributor = get('contributor');
    const payload = {
      id: `${category || 'topic'}-${slug}`,
      slug,
      title,
      category,
      tags: get('tags')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      cost: get('cost') || null,
      reading_time: get('reading_time') || '3 phút',
      time: get('time') || null,
      effort: get('effort') || null,
      benefits: lines('benefits'),
      risks: lines('risks'),
      target_groups: lines('target_groups').length ? lines('target_groups') : ['Mọi người'],
      value_level: 'Cao',
      evidence_level: 'B',
      evidence_notes: get('evidence_notes'),
      description: get('description'),
      body: get('body'),
      sources,
      verified_at: null,
      review_status: 'needs_review',
      status_label: 'Chờ rà soát',
      last_updated: today,
    };

    if (contributor) payload.submitted_by = contributor;
    return payload;
  }

  function validatePayload(payload) {
    const errs = [];
    if (!payload.title || payload.title.length < 6) errs.push('Tiêu đề cần ít nhất 6 ký tự.');
    if (!payload.category) errs.push('Vui lòng chọn danh mục.');
    if (!payload.description || payload.description.length < 15) errs.push('Tóm tắt cần ít nhất 15 ký tự.');
    if (!payload.body || payload.body.length < 40) errs.push('Nội dung chi tiết cần ít nhất 40 ký tự.');
    if (!payload.sources.length) {
      errs.push('Cần ít nhất 1 nguồn tham khảo chính thống.');
    } else {
      payload.sources.forEach((s, i) => {
        if (!s.title) errs.push(`Nguồn #${i + 1}: thiếu tên tài liệu.`);
        if (!/^https?:\/\/\S+/i.test(s.url)) errs.push(`Nguồn #${i + 1}: URL phải bắt đầu bằng http:// hoặc https://.`);
      });
    }
    return errs;
  }

  function updateJsonPreview() {
    const pre = document.getElementById('c-json-pre');
    if (pre) pre.textContent = JSON.stringify(buildPayload(), null, 2);
  }

  async function init() {
    window.STHReader?.registerServiceWorker(BASE);

    const catSelect = document.getElementById('c-category');
    try {
      const resp = await fetch(`${BASE}/data/categories/categories.json`);
      if (resp.ok) {
        const categories = await resp.json();
        catSelect.innerHTML = '<option value="">-- Chọn danh mục --</option>' +
          categories.map((c) => `<option value="${esc(c.id)}">${esc(c.number)} · ${esc(c.name)}</option>`).join('');
      }
    } catch {
      catSelect.innerHTML = '<option value="health">Sức khỏe</option><option value="finance">Tài chính</option>';
    }

    const srcList = document.getElementById('c-sources-list');
    srcList.appendChild(createSourceItem(0));

    document.getElementById('c-add-src')?.addEventListener('click', () => {
      srcList.appendChild(createSourceItem(srcList.children.length));
      updateJsonPreview();
    });

    srcList.addEventListener('click', (ev) => {
      const btn = ev.target.closest('[data-rm-src]');
      if (!btn) return;
      if (srcList.children.length <= 1) {
        showAlert('Cần giữ ít nhất 1 nguồn tham khảo.', 'err');
        return;
      }
      btn.closest('.c-src-item')?.remove();
      renumberSources();
      updateJsonPreview();
    });

    document.getElementById('c-form')?.addEventListener('input', () => {
      clearAlert();
      updateJsonPreview();
    });

    const getValidatedOrAlert = () => {
      const payload = buildPayload();
      const errs = validatePayload(payload);
      if (errs.length) {
        showAlert(errs.join(' '), 'err');
        return null;
      }
      return payload;
    };

    // Channel 1: GitHub Issue
    document.getElementById('c-submit-gh')?.addEventListener('click', async () => {
      const payload = getValidatedOrAlert();
      if (!payload) return;

      const jsonText = JSON.stringify(payload, null, 2);
      const wrappedJson = `\`\`\`json\n${jsonText}\n\`\`\``;
      const baseIssueUrl = `https://github.com/${GITHUB_REPO}/issues/new`;

      const params = new URLSearchParams({
        template: 'dong-gop-bai-viet.yml',
        title: `[Đóng góp bài] ${payload.title}`,
        article_title: payload.title,
        category: payload.category,
        contributor: payload.submitted_by || 'Ẩn danh',
      });

      if (encodeURIComponent(wrappedJson).length <= 4500) {
        params.set('article_json', wrappedJson);
        window.open(`${baseIssueUrl}?${params.toString()}`, '_blank', 'noopener,noreferrer');
        showAlert('Đã mở trang GitHub Issue với đầy đủ nội dung bài viết. Bạn chỉ cần kiểm tra và bấm "Submit new issue".', 'ok');
      } else {
        try {
          await navigator.clipboard.writeText(wrappedJson);
          params.set('article_json', '(Nội dung dài — đã tự động copy JSON vào clipboard, bạn chỉ cần nhấn Ctrl+V dán vào đây)');
          showAlert('Bài viết khá dài nên hệ thống đã copy sẵn JSON vào clipboard. Hãy nhấn Ctrl+V vào ô JSON trên GitHub Issue vừa mở.', 'ok');
        } catch {
          params.set('article_json', '(Hãy tải file JSON từ trang /dong-gop/ hoặc copy ở mục Xem trước JSON để dán vào đây)');
          showAlert('Bài viết dài vượt giới hạn URL: hãy bấm "Copy JSON" bên dưới và dán vào ô JSON trên GitHub Issue.', 'ok');
        }
        window.open(`${baseIssueUrl}?${params.toString()}`, '_blank', 'noopener,noreferrer');
      }
    });

    // Channel 2a: Download JSON
    document.getElementById('c-download-json')?.addEventListener('click', () => {
      const payload = getValidatedOrAlert();
      if (!payload) return;
      const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${payload.slug}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showAlert(`Đã tải file ${payload.slug}.json. Bạn có thể gửi file này cho ban biên tập.`, 'ok');
    });

    // Channel 2b: Copy JSON
    document.getElementById('c-copy-json')?.addEventListener('click', async () => {
      const payload = getValidatedOrAlert();
      if (!payload) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        showAlert('Đã copy JSON bài viết vào clipboard.', 'ok');
      } catch {
        showAlert('Không thể copy tự động — hãy mở "Xem trước dữ liệu JSON" ở cuối trang để copy.', 'err');
      }
    });

    // Channel 2c: Mailto fallback
    document.getElementById('c-mailto-btn')?.addEventListener('click', () => {
      const payload = getValidatedOrAlert();
      if (!payload) return;
      const subject = encodeURIComponent(`[Sống Tốt Hơn - Đóng góp] ${payload.title}`);
      const body = encodeURIComponent(
        `Tiêu đề: ${payload.title}\nDanh mục: ${payload.category}\n\nJSON bài viết:\n${JSON.stringify(payload, null, 2).slice(0, 1500)}`
      );
      location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    });

    // Channel 2d: External Form Endpoint (optional, enabled when EXTERNAL_FORM_ENDPOINT is set)
    const extBtn = document.getElementById('c-submit-ext');
    if (EXTERNAL_FORM_ENDPOINT && extBtn) {
      extBtn.hidden = false;
      extBtn.addEventListener('click', async () => {
        const payload = getValidatedOrAlert();
        if (!payload) return;
        extBtn.disabled = true;
        try {
          const resp = await fetch(EXTERNAL_FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ title: payload.title, category: payload.category, article_json: payload }),
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          showAlert('Đã gửi bài đóng góp thành công! Ban biên tập sẽ rà soát sớm nhất.', 'ok');
        } catch (err) {
          showAlert(`Không gửi được qua biểu mẫu ngoài (${err.message}). Vui lòng dùng "Tải file .json".`, 'err');
        } finally {
          extBtn.disabled = false;
        }
      });
    }

    updateJsonPreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

