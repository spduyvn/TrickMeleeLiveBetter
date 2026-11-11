/**
 * guide.js — Giao diện tra cứu nhanh cho Sống Tốt Hơn
 * Dựa trên nguồn dữ liệu chung data/catalog.json (769 bài viết Việt hóa).
 */
(function () {
  'use strict';

  const BASE =
    document.querySelector('link[href*="/assets/guide.css"]')
      ?.getAttribute('href')
      ?.replace(/\/assets\/guide\.css$/, '') || '';

  const UI_PREF_KEY = 'sth-ui-mode';
  const THEME_KEY = 'guide-theme';

  const DIMS = ['value', 'grade', 'cost', 'time', 'effort', 'audience', 'status'];

  const LABELS = {
    grade: { A: 'Bằng chứng A', B: 'Bằng chứng B', C: 'Bằng chứng C' },
    value: { very_high: 'Giá trị: Rất cao', high: 'Giá trị: Cao', medium: 'Giá trị: Trung bình' },
    cost: { free: 'Miễn phí / tiết kiệm', low: 'Chi phí thấp', high: 'Chi phí đáng kể' },
    time: { quick: 'Nhanh / 1 lần', medium: 'Vài giờ – tuần', habit: 'Duy trì dài hạn' },
    effort: { low: 'Công sức thấp', medium: 'Công sức trung bình', high: 'Công sức cao' },
    status: {
      verified: 'Đã xác minh',
      needs_review: 'Chờ rà soát',
      outdated: 'Cần cập nhật',
      disputed: 'Có tranh luận',
    },
  };

  const DOC_MAP = {
    editorial: { title: 'Quy tắc biên tập', path: 'docs/EDITORIAL_RULES.md', url: `${BASE}/method/` },
    grading: { title: 'Tiêu chí phân loại bằng chứng', path: 'docs/EVIDENCE_GRADING.md', url: `${BASE}/EVIDENCE_GRADING.html` },
    sources: { title: 'Chính sách nguồn tham khảo', path: 'docs/SOURCE_POLICY.md', url: `${BASE}/sources/` },
  };

  const state = {
    categories: [],
    categoryMap: new Map(),
    articles: [],
    sec: null,
    q: '',
    value: new Set(),
    grade: new Set(),
    cost: new Set(),
    time: new Set(),
    effort: new Set(),
    audience: new Set(),
    status: new Set(),
  };

  const CARDS = [];
  const CARD_BY_ID = new Map();
  const BLOCKS = [];
  const TOC_LINKS = new Map(); // cardId -> <a>
  const TOC_SUB = new Map(); // catId -> subEl
  const TOC_MAN = new Map(); // catId -> boolean

  let curTerms = [];
  let curKey = '';
  let spyTimer = 0;
  let spyLast = '';
  let spyOff = false;

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

  function highlightHtml(text, terms) {
    const raw = String(text ?? '');
    if (!terms.length) return esc(raw);
    const normRaw = normalize(raw);
    // Map normalized indices back when lengths match; fallback safely to direct case-insensitive match on raw
    const ranges = [];
    const lowerRaw = raw.toLowerCase();
    for (const term of terms) {
      if (!term) continue;
      let idx = 0;
      let foundInRaw = false;
      while ((idx = lowerRaw.indexOf(term, idx)) !== -1) {
        ranges.push([idx, idx + term.length]);
        idx += term.length;
        foundInRaw = true;
      }
      if (!foundInRaw && normRaw.length === raw.length) {
        let nIdx = 0;
        while ((nIdx = normRaw.indexOf(term, nIdx)) !== -1) {
          ranges.push([nIdx, nIdx + term.length]);
          nIdx += term.length;
        }
      }
    }
    if (!ranges.length) return esc(raw);
    ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    const merged = [];
    for (const r of ranges) {
      if (!merged.length || r[0] > merged[merged.length - 1][1]) {
        merged.push([r[0], r[1]]);
      } else if (r[1] > merged[merged.length - 1][1]) {
        merged[merged.length - 1][1] = r[1];
      }
    }
    let out = '';
    let pos = 0;
    for (const [s, e] of merged) {
      if (s > pos) out += esc(raw.slice(pos, s));
      out += `<mark>${esc(raw.slice(s, e))}</mark>`;
      pos = e;
    }
    if (pos < raw.length) out += esc(raw.slice(pos));
    return out;
  }

  function renderListHtml(arr, terms) {
    if (!Array.isArray(arr) || arr.length === 0) return '';
    if (arr.length === 1) return highlightHtml(arr[0], terms);
    return `<ul class="g-chunks">${arr.map((item) => `<li>${highlightHtml(item, terms)}</li>`).join('')}</ul>`;
  }

  function renderBadgesHtml(article) {
    const f = article.facets || {};
    const parts = [];
    if (f.grade && LABELS.grade[f.grade]) {
      parts.push(`<span class="g-badge ${esc(f.grade)}">${esc(LABELS.grade[f.grade])}</span>`);
    }
    if (f.value && LABELS.value[f.value]) {
      parts.push(`<span class="g-badge tip">${esc(LABELS.value[f.value])}</span>`);
    }
    if (f.cost && LABELS.cost[f.cost]) {
      parts.push(`<span class="g-badge plain">${esc(LABELS.cost[f.cost])}</span>`);
    }
    if (f.time && LABELS.time[f.time]) {
      parts.push(`<span class="g-badge plain">${esc(LABELS.time[f.time])}</span>`);
    }
    if (f.effort && LABELS.effort[f.effort]) {
      parts.push(`<span class="g-badge plain">${esc(LABELS.effort[f.effort])}</span>`);
    }
    const st = article.review_status;
    if (st && st !== 'needs_review') {
      const cls = st === 'verified' ? 'A' : st === 'disputed' ? 'danger' : 'warn';
      parts.push(`<span class="g-badge ${cls}">${esc(article.status_label || LABELS.status[st] || st)}</span>`);
    } else if (st === 'needs_review') {
      parts.push(`<span class="g-badge warn">${esc(article.status_label || 'Chờ rà soát')}</span>`);
    }
    return parts.join('');
  }

  function renderSourcesHtml(sources, terms) {
    if (!Array.isArray(sources) || sources.length === 0) {
      return '<p class="g-src-empty">Chưa có nguồn tham khảo được ghi nhận.</p>';
    }
    return `<ol>${sources
      .map((s) => {
        const meta = [s.organization, s.country, s.published_at].filter(Boolean).map((x) => highlightHtml(x, terms)).join(' · ');
        const urlDisplay = s.url ? esc(String(s.url).replace(/^https?:\/\//, '').replace(/\/$/, '')) : '';
        const link = s.url
          ? `<a class="g-url" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${urlDisplay}</a>`
          : '';
        return `<li><strong>${highlightHtml(s.title || 'Tài liệu tham khảo', terms)}</strong>${meta ? ` — ${meta}` : ''}${link}</li>`;
      })
      .join('')}</ol>`;
  }

  function renderCardBody(card, terms, key) {
    if (card.renderedKey === key) return;
    const a = card.article;
    const f = card.refs;
    f.titleBtn.innerHTML = highlightHtml(a.title, terms);
    f.human.hidden = !a.description;
    if (a.description) f.human.innerHTML = highlightHtml(a.description, terms);

    const rows = [];
    if (a.cost) rows.push(`<div class="k">Chi phí</div><div class="v">${highlightHtml(a.cost, terms)}</div>`);
    if (a.time) rows.push(`<div class="k">Thời gian</div><div class="v">${highlightHtml(a.time, terms)}</div>`);
    if (a.effort) rows.push(`<div class="k">Công sức</div><div class="v">${highlightHtml(a.effort, terms)}</div>`);
    if (a.benefits?.length) rows.push(`<div class="k">Lợi ích</div><div class="v">${renderListHtml(a.benefits, terms)}</div>`);
    if (a.risks?.length) rows.push(`<div class="k">Rủi ro &amp; lưu ý</div><div class="v note">${renderListHtml(a.risks, terms)}</div>`);
    if (a.target_groups?.length) rows.push(`<div class="k">Đối tượng</div><div class="v note">${highlightHtml(a.target_groups.join(' · '), terms)}</div>`);
    if (a.evidence_notes) rows.push(`<div class="k">Bằng chứng</div><div class="v note">${highlightHtml(a.evidence_notes, terms)}</div>`);
    f.rows.innerHTML = rows.join('');

    f.srcBody.innerHTML = renderSourcesHtml(a.sources, terms);
    if (f.srcDetails) {
      const onlyInSrc =
        terms.length > 0 &&
        terms.every((t) => card.haySrc.includes(t)) &&
        !terms.every((t) => card.hayMain.includes(t));
      f.srcDetails.open = onlyInSrc;
    }
    card.renderedKey = key;
  }

  /* ── Build DOM once ─────────────────────────────────────────── */
  function buildContentDOM() {
    const container = document.getElementById('g-sections');
    container.textContent = '';

    const byCat = new Map();
    for (const cat of state.categories) byCat.set(cat.id, []);
    for (const a of state.articles) {
      if (!byCat.has(a.category)) byCat.set(a.category, []);
      byCat.get(a.category).push(a);
    }

    const frag = document.createDocumentFragment();
    for (const cat of state.categories) {
      const list = byCat.get(cat.id) || [];
      if (!list.length) continue;

      const secEl = document.createElement('section');
      secEl.className = 'g-sec-block';
      secEl.id = `sec-${cat.id}`;

      const headEl = document.createElement('div');
      headEl.className = 'g-sec-h';
      headEl.innerHTML = `<span class="g-sec-num">${esc(cat.number)}</span><h2>${esc(cat.name)}</h2><span class="g-shown">${list.length} mục</span>`;
      secEl.appendChild(headEl);

      if (cat.description) {
        const intro = document.createElement('p');
        intro.className = 'g-intro';
        intro.textContent = cat.description;
        secEl.appendChild(intro);
      }

      const countSpan = headEl.querySelector('.g-shown');
      BLOCKS.push({ cat, el: secEl, countEl: countSpan });

      list.forEach((article, idx) => {
        const cardId = `item-${article.id}`;
        const el = document.createElement('article');
        el.className = 'g-card';
        el.id = cardId;

        const srcCount = Array.isArray(article.sources) ? article.sources.length : 0;
        el.innerHTML = `
          <div class="g-card-h">
            <span class="g-idx">${idx + 1}.</span>
            <h3><button type="button" class="g-card-title-btn" data-open-article="${esc(article.id)}">${esc(article.title)}</button></h3>
            <a class="g-anchor" href="#${esc(cardId)}" aria-label="Liên kết tới mục này">#</a>
          </div>
          <div class="g-badges">${renderBadgesHtml(article)}</div>
          <p class="g-human"></p>
          <div class="g-rows"></div>
          <div class="g-card-foot">
            <details class="g-src">
              <summary>Nguồn tham khảo <span class="g-cnt">${srcCount ? `· ${srcCount} nguồn` : '· Chưa có'}</span></summary>
              <div class="g-src-body"></div>
            </details>
            <div class="g-card-actions">
              <button type="button" class="g-read-btn" data-open-article="${esc(article.id)}">Đọc bài đầy đủ</button>
              <a class="g-ext-link" href="${BASE}/article/?id=${encodeURIComponent(article.id)}">Mở trang riêng ↗</a>
            </div>
          </div>`;

        const mainParts = [
          article.title,
          article.description,
          ...(article.tags || []),
          article.cost,
          article.time,
          article.effort,
          ...(article.benefits || []),
          ...(article.risks || []),
          ...(article.target_groups || []),
          article.evidence_notes,
          article.body,
          cat.name,
        ];
        const srcParts = (article.sources || []).flatMap((s) => [s.title, s.organization, s.country, s.url]);
        const hayMain = normalize(mainParts.join(' '));
        const haySrc = normalize(srcParts.join(' '));

        const card = {
          article,
          catId: cat.id,
          idx: idx + 1,
          el,
          vis: false,
          renderedKey: null,
          hayMain,
          haySrc,
          hay: `${hayMain} ${haySrc}`,
          refs: {
            titleBtn: el.querySelector('.g-card-title-btn'),
            human: el.querySelector('.g-human'),
            rows: el.querySelector('.g-rows'),
            srcDetails: el.querySelector('.g-src'),
            srcBody: el.querySelector('.g-src-body'),
          },
        };

        CARDS.push(card);
        CARD_BY_ID.set(cardId, card);
        secEl.appendChild(el);
      });

      frag.appendChild(secEl);
    }

    container.appendChild(frag);
  }

  /* ── Build Sidebar Category List & Sub-TOC ──────────────────── */
  function buildSidebarCategories() {
    const root = document.getElementById('g-f-sec');
    const secCount = document.getElementById('g-sec-count');
    if (secCount) secCount.textContent = `${state.categories.length} nhóm`;

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'g-sec-link all';
    allBtn.dataset.v = '';
    allBtn.setAttribute('aria-pressed', 'true');
    allBtn.innerHTML = `<span class="g-sn">✓</span><span class="g-st">Tất cả danh mục</span><i>${CARDS.length}</i>`;
    root.appendChild(allBtn);

    for (const block of BLOCKS) {
      const { cat } = block;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'g-sec-link';
      btn.dataset.v = cat.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = `<span class="g-sn">${esc(cat.number)}</span><span class="g-st">${esc(cat.name)}</span><i>0</i><span class="g-fold" role="button" tabindex="-1" aria-label="Thu gọn/mở rộng mục lục"><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      root.appendChild(btn);

      const sub = document.createElement('div');
      sub.className = 'g-toc-sub';
      sub.hidden = true;
      const catCards = CARDS.filter((c) => c.catId === cat.id);
      for (const c of catCards) {
        const a = document.createElement('a');
        a.href = `#${c.el.id}`;
        a.dataset.go = c.el.id;
        a.innerHTML = `<i>${c.idx}.</i><span>${esc(c.article.title)}</span>`;
        sub.appendChild(a);
        TOC_LINKS.set(c.el.id, a);
      }
      const none = document.createElement('p');
      none.className = 'g-toc-none';
      none.textContent = 'Không có mục khớp';
      none.hidden = true;
      sub.appendChild(none);

      TOC_SUB.set(cat.id, sub);
      root.appendChild(sub);
    }
  }

  /* ── Lazy Render via IntersectionObserver ───────────────────── */
  let cardIO = null;
  function setupCardObserver() {
    if (!('IntersectionObserver' in window)) {
      for (const c of CARDS) {
        c.vis = true;
        renderCardBody(c, curTerms, curKey);
      }
      return;
    }
    cardIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const card = CARD_BY_ID.get(entry.target.id);
          if (!card) continue;
          card.vis = entry.isIntersecting;
          if (entry.isIntersecting && !card.el.hidden) {
            renderCardBody(card, curTerms, curKey);
          }
        }
      },
      { rootMargin: '600px 0px' }
    );
    for (const c of CARDS) cardIO.observe(c.el);
  }

  /* ── Filtering & Sync ───────────────────────────────────────── */
  function matchesCard(card) {
    const f = card.article.facets || {};
    if (state.value.size && !state.value.has(f.value)) return false;
    if (state.grade.size && !state.grade.has(f.grade)) return false;
    if (state.cost.size && !state.cost.has(f.cost)) return false;
    if (state.time.size && !state.time.has(f.time)) return false;
    if (state.effort.size && !state.effort.has(f.effort)) return false;
    if (state.status.size && !state.status.has(card.article.review_status)) return false;
    if (state.audience.size) {
      const aud = f.audience || [];
      if (!aud.some((tag) => state.audience.has(tag))) return false;
    }
    if (curTerms.length && !curTerms.every((t) => card.hay.includes(t))) return false;
    return true;
  }

  function tocSync(activeId, opts = {}) {
    const follow = opts.follow !== false;
    const activeCard = activeId ? CARD_BY_ID.get(activeId) : null;
    const activeCat = activeCard ? activeCard.catId : null;

    for (const [id, link] of TOC_LINKS) {
      link.classList.toggle('on', id === activeId);
    }

    for (const [catId, sub] of TOC_SUB) {
      const btn = sub.previousElementSibling;
      let shouldOpen = false;
      if (TOC_MAN.has(catId)) {
        shouldOpen = TOC_MAN.get(catId);
      } else if (state.sec) {
        shouldOpen = state.sec === catId;
      } else if (activeCat) {
        shouldOpen = activeCat === catId;
      }
      sub.hidden = !shouldOpen;
      btn.classList.toggle('open', shouldOpen);
      if (follow && shouldOpen && activeId && activeCat === catId) {
        const activeLink = TOC_LINKS.get(activeId);
        if (activeLink) activeLink.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  function syncControls() {
    const qInput = document.getElementById('g-q');
    if (qInput && qInput.value !== state.q) qInput.value = state.q;
    document.querySelectorAll('[data-dim] [data-v]').forEach((btn) => {
      const dim = btn.closest('[data-dim]').dataset.dim;
      if (dim === 'sec') {
        const pressed = btn.dataset.v === '' ? state.sec === null : state.sec === btn.dataset.v;
        btn.setAttribute('aria-pressed', String(pressed));
      } else if (state[dim] instanceof Set) {
        btn.setAttribute('aria-pressed', String(state[dim].has(btn.dataset.v)));
      }
    });
  }

  function writeUrl() {
    const params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.sec) params.set('sec', state.sec);
    for (const dim of DIMS) {
      if (state[dim].size) params.set(dim, [...state[dim]].join(','));
    }
    const qs = params.toString();
    const hash = location.hash;
    const validHash = hash && document.getElementById(hash.slice(1))?.offsetParent ? hash : '';
    history.replaceState(history.state, '', (qs ? `?${qs}` : location.pathname) + validHash);
  }

  function readUrl() {
    const params = new URLSearchParams(location.search);
    state.q = (params.get('q') || '').trim();
    const sec = params.get('sec');
    state.sec = sec && state.categoryMap.has(sec) ? sec : null;
    for (const dim of DIMS) {
      state[dim].clear();
      const raw = params.get(dim);
      if (raw) {
        raw.split(',').forEach((v) => {
          if (v) state[dim].add(v);
        });
      }
    }
  }

  function apply() {
    curTerms = normalize(state.q).split(/\s+/).filter(Boolean);
    curKey = curTerms.join(' ');

    let shown = 0;
    let matched = 0;
    const perSec = {};
    const tocSec = {};

    for (const card of CARDS) {
      let ok = matchesCard(card);
      const tocLink = TOC_LINKS.get(card.el.id);
      if (tocLink && tocLink.hidden === ok) tocLink.hidden = !ok;
      if (ok) {
        matched++;
        tocSec[card.catId] = (tocSec[card.catId] || 0) + 1;
      }
      if (ok && state.sec && card.catId !== state.sec) ok = false;
      if (card.el.hidden === ok) card.el.hidden = !ok;
      if (ok) {
        shown++;
        perSec[card.catId] = (perSec[card.catId] || 0) + 1;
        if (card.vis && card.renderedKey !== curKey) {
          renderCardBody(card, curTerms, curKey);
        }
      }
    }

    for (const b of BLOCKS) {
      const n = perSec[b.cat.id] || 0;
      if (b.el.hidden !== (n === 0)) b.el.hidden = n === 0;
      b.countEl.textContent = `${n} mục`;
    }

    for (const [catId, sub] of TOC_SUB) {
      const count = tocSec[catId] || 0;
      const btn = sub.previousElementSibling;
      btn.querySelector('i').textContent = String(count);
      sub.lastElementChild.hidden = count !== 0;
    }

    const allCount = document.querySelector('#g-f-sec .all i');
    if (allCount) allCount.textContent = String(matched);

    const statEl = document.getElementById('g-stat');
    if (statEl) {
      statEl.innerHTML = `Đang hiển thị <b>${shown}</b> / ${CARDS.length} mục đã Việt hóa`;
    }

    const emptyEl = document.getElementById('g-empty');
    if (emptyEl) emptyEl.hidden = shown !== 0;

    syncControls();
    writeUrl();
    tocSync(spyLast);
  }

  /* ── Scroll-spy & Jump to Item ──────────────────────────────── */
  function spy() {
    if (spyOff) return;
    clearTimeout(spyTimer);
    spyTimer = setTimeout(() => {
      const line = innerHeight * 0.3;
      const firstBlock = BLOCKS.find((b) => b.el.offsetParent)?.el;
      if (firstBlock && firstBlock.getBoundingClientRect().top > line) {
        if (spyLast === '') return;
        spyLast = '';
        tocSync('');
        history.replaceState(history.state, '', location.pathname + location.search);
        return;
      }

      const navBottom = Math.max(0, document.getElementById('guide-nav').getBoundingClientRect().bottom);
      const heads = [];
      for (const c of CARDS) {
        if (!c.el.getBoundingClientRect().height) continue;
        heads.push([c.el.querySelector('.g-card-h').getBoundingClientRect().top, c.el.id]);
      }
      heads.sort((a, b) => a[0] - b[0]);
      const hit =
        heads.find(([t]) => t >= navBottom && t < innerHeight)?.[1] ||
        heads.filter(([t]) => t < navBottom).pop()?.[1] ||
        '';
      if (hit === spyLast) return;
      spyLast = hit;
      tocSync(hit);
      history.replaceState(history.state, '', location.pathname + location.search + (hit ? `#${hit}` : ''));
    }, 140);
  }

  function resetAllFilters() {
    state.q = '';
    state.sec = null;
    for (const d of DIMS) state[d].clear();
    TOC_MAN.clear();
  }

  function gotoItem(targetId) {
    const card = CARD_BY_ID.get(targetId);
    if (!card) return;
    if (card.el.hidden) {
      resetAllFilters();
      apply();
    }
    renderCardBody(card, curTerms, curKey);
    spyOff = true;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    card.el.classList.remove('flash');
    void card.el.offsetWidth;
    card.el.classList.add('flash');
    spyLast = targetId;
    tocSync(targetId);
    history.replaceState(history.state, '', `${location.pathname}${location.search}#${targetId}`);
    setTimeout(() => { spyOff = false; }, 650);
  }

  /* ── In-place Reading Modal ─────────────────────────────────── */
  const DM = {
    mask: document.getElementById('doc-mask'),
    title: document.getElementById('dm-t'),
    ext: document.getElementById('dm-ext'),
    toc: document.getElementById('dm-toc'),
    doc: document.getElementById('dm-doc'),
    heads: [],
    lastFocus: null,
  };

  function formatBodyText(text, terms) {
    const blocks = String(text || '').split(/\n\n+/).map((b) => b.trim()).filter(Boolean);
    if (!blocks.length) return '<p>Nội dung chi tiết đang được cập nhật.</p>';
    const out = [];
    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      const isBullet = lines.length > 0 && lines.every((l) => /^[-*]\s+/.test(l));
      const isOrdered = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));
      if (isBullet) {
        out.push(`<ul>${lines.map((l) => `<li>${highlightHtml(l.replace(/^[-*]\s+/, ''), terms)}</li>`).join('')}</ul>`);
      } else if (isOrdered) {
        out.push(`<ol>${lines.map((l) => `<li>${highlightHtml(l.replace(/^\d+[.)]\s+/, ''), terms)}</li>`).join('')}</ol>`);
      } else {
        out.push(`<p>${lines.map((l) => highlightHtml(l, terms)).join('<br>')}</p>`);
      }
    }
    return out.join('');
  }

  function renderMarkdownDoc(md) {
    const lines = String(md || '').split('\n');
    const out = [];
    const heads = [];
    let para = [];
    let list = null;
    let title = '';

    const inline = (s) => {
      let h = esc(s);
      h = h.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
      h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`);
      h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      return h;
    };

    const flushP = () => {
      if (para.length) {
        out.push(`<p>${inline(para.join(' '))}</p>`);
        para = [];
      }
    };
    const flushL = () => {
      if (list) {
        out.push(`</${list}>`);
        list = null;
      }
    };
    const flush = () => { flushP(); flushL(); };

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (!ln.trim()) { flush(); continue; }
      const hm = ln.match(/^(#{1,4})\s+(.*)$/);
      if (hm) {
        flush();
        const lv = hm[1].length;
        const txt = hm[2].trim();
        if (lv === 1) { title = txt; continue; }
        const id = `dm-h-${heads.length}`;
        heads.push({ id, lv, txt });
        out.push(`<h${lv} id="${id}">${inline(txt)}</h${lv}>`);
        continue;
      }
      if (ln.startsWith('|')) {
        flush();
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
        i--;
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        const sep = rows[1] && /^[\s|:-]+$/.test(rows[1]);
        const head = sep ? cells(rows[0]) : null;
        const body = rows.slice(sep ? 2 : 0).map(cells);
        let t = '<div class="dm-tw"><table>';
        if (head) t += `<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead>`;
        t += `<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
        out.push(t);
        continue;
      }
      const bm = ln.match(/^\s*[-*]\s+(.*)$/);
      const om = ln.match(/^\s*\d+\.\s+(.*)$/);
      if (bm || om) {
        flushP();
        const want = om ? 'ol' : 'ul';
        if (list !== want) { flushL(); out.push(`<${want}>`); list = want; }
        out.push(`<li>${inline((bm || om)[1])}</li>`);
        continue;
      }
      para.push(ln.trim());
    }
    flush();
    return { html: out.join('\n'), heads, title };
  }

  function dmTopOf(el) {
    return el.getBoundingClientRect().top - DM.doc.getBoundingClientRect().top + DM.doc.scrollTop;
  }

  function dmSpy() {
    const top = DM.doc.scrollTop + Math.max(80, DM.doc.clientHeight * 0.25);
    let cur = DM.heads[0];
    for (const h of DM.heads) {
      const el = document.getElementById(h.id);
      if (el && dmTopOf(el) <= top) cur = h;
    }
    for (const a of DM.toc.children) {
      a.classList.toggle('on', Boolean(cur && a.dataset.id === cur.id));
    }
  }

  function buildModalToc(heads) {
    DM.heads = heads;
    DM.toc.textContent = '';
    for (const h of heads) {
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.textContent = h.txt;
      a.dataset.id = h.id;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        const el = document.getElementById(h.id);
        const soft = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (el) DM.doc.scrollTo({ top: dmTopOf(el) - 10, behavior: soft ? 'smooth' : 'auto' });
      });
      DM.toc.appendChild(a);
    }
    dmSpy();
  }

  function showModalShell(title, extHref, fromEl) {
    DM.lastFocus = fromEl || null;
    DM.title.textContent = title;
    if (extHref) {
      DM.ext.href = extHref;
      DM.ext.hidden = false;
    } else {
      DM.ext.hidden = true;
    }
    DM.mask.hidden = false;
    document.body.style.overflow = 'hidden';
    DM.doc.scrollTop = 0;
    document.getElementById('dm-x').focus();
  }

  function openArticleModal(articleId, fromEl) {
    const card = CARD_BY_ID.get(`item-${articleId}`);
    if (!card) return;
    const a = card.article;
    const cat = state.categoryMap.get(a.category);
    showModalShell(a.title, `${BASE}/article/?id=${encodeURIComponent(a.id)}`, fromEl);

    const heads = [
      { id: 'dm-s-overview', txt: 'Thông tin áp dụng' },
      { id: 'dm-s-body', txt: 'Nội dung chi tiết' },
      { id: 'dm-s-evidence', txt: 'Bằng chứng & giới hạn' },
      { id: 'dm-s-sources', txt: 'Nguồn tham khảo' },
    ];

    const f = a.facets || {};
    const metaItems = [
      ['Danh mục', cat ? `${cat.number} · ${cat.name}` : a.category],
      ['Mức độ bằng chứng', f.grade ? LABELS.grade[f.grade] : a.evidence_level || 'Chưa đánh giá'],
      ['Giá trị thực tiễn', a.value_level || 'Chưa đánh giá'],
      ['Trạng thái', a.status_label || LABELS.status[a.review_status] || a.review_status],
      ['Chi phí', a.cost || 'Chưa cung cấp'],
      ['Thời gian áp dụng', a.time || 'Chưa cung cấp'],
      ['Công sức', a.effort || 'Chưa cung cấp'],
      ['Đối tượng phù hợp', a.target_groups?.length ? a.target_groups.join(', ') : 'Mọi người'],
    ];

    const benefitsHtml = a.benefits?.length
      ? `<h3>Lợi ích</h3><ul>${a.benefits.map((b) => `<li>${highlightHtml(b, curTerms)}</li>`).join('')}</ul>`
      : '';
    const risksHtml = a.risks?.length
      ? `<h3>Rủi ro &amp; lưu ý</h3><ul>${a.risks.map((r) => `<li>${highlightHtml(r, curTerms)}</li>`).join('')}</ul>`
      : '';

    DM.doc.innerHTML = `
      <h2 id="dm-s-overview">Thông tin áp dụng</h2>
      ${a.description ? `<p class="g-human">${highlightHtml(a.description, curTerms)}</p>` : ''}
      <dl class="dm-meta-grid">${metaItems
        .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${highlightHtml(v, curTerms)}</dd></div>`)
        .join('')}</dl>
      ${benefitsHtml}
      ${risksHtml}
      <h2 id="dm-s-body">Nội dung chi tiết</h2>
      ${formatBodyText(a.body, curTerms)}
      <h2 id="dm-s-evidence">Bằng chứng &amp; giới hạn</h2>
      ${a.evidence_notes ? `<p>${highlightHtml(a.evidence_notes, curTerms)}</p>` : '<p>Chưa có ghi chú bằng chứng.</p>'}
      <h2 id="dm-s-sources">Nguồn tham khảo</h2>
      <div class="g-src"><div class="g-src-body">${renderSourcesHtml(a.sources, curTerms)}</div></div>
      ${a.last_updated ? `<p style="margin-top:18px;font-size:12px;color:var(--t3)">Cập nhật lần cuối: ${esc(a.last_updated)}</p>` : ''}`;

    buildModalToc(heads);
  }

  async function openDocModal(docKey, fromEl) {
    const info = DOC_MAP[docKey];
    if (!info) return;
    showModalShell(info.title, info.url, fromEl);
    DM.toc.textContent = '';
    DM.doc.innerHTML = '<p>Đang tải tài liệu…</p>';
    try {
      const resp = await fetch(`${BASE}/${info.path}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const md = await resp.text();
      const rendered = renderMarkdownDoc(md);
      if (rendered.title) DM.title.textContent = rendered.title;
      DM.doc.innerHTML = rendered.html;
      buildModalToc(rendered.heads);
    } catch (err) {
      DM.doc.innerHTML = `<p>Không tải được tài liệu (${esc(err.message)}). <a href="${esc(info.url)}">Mở trang đầy đủ →</a></p>`;
    }
  }

  function closeModal() {
    if (DM.mask.hidden) return;
    DM.mask.hidden = true;
    document.body.style.overflow = '';
    DM.lastFocus?.focus?.({ preventScroll: true });
    DM.lastFocus = null;
  }

  /* ── Wire Interactive Events ────────────────────────────────── */
  function wireEvents() {
    const sidebar = document.getElementById('g-sidebar');
    const backdrop = document.getElementById('g-backdrop');
    const menuBtn = document.getElementById('g-menu');

    const setMenu = (on) => {
      sidebar.classList.toggle('open', on);
      backdrop.classList.toggle('on', on);
      menuBtn.setAttribute('aria-expanded', String(on));
    };

    const toTop = () => {
      setMenu(false);
      scrollTo({ top: 0 });
      spy();
    };

    // Sidebar chip & section clicks
    document.querySelectorAll('[data-dim]').forEach((group) => {
      group.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-v]');
        if (!btn) return;
        const dim = group.dataset.dim;
        const val = btn.dataset.v;

        if (dim === 'sec') {
          if (val && (ev.target.closest('.g-fold') || state.sec === val)) {
            const sub = TOC_SUB.get(val);
            TOC_MAN.set(val, sub ? sub.hidden : true);
            tocSync(spyLast, { follow: false });
            return;
          }
          state.sec = val === '' ? null : val;
          TOC_MAN.delete(val);
          apply();
          toTop();
          return;
        }

        const set = state[dim];
        if (!(set instanceof Set)) return;
        if (set.has(val)) set.delete(val);
        else set.add(val);
        apply();
        toTop();
      });
    });

    // Sub-TOC item click
    document.getElementById('g-f-sec').addEventListener('click', (ev) => {
      const a = ev.target.closest('a[data-go]');
      if (!a) return;
      ev.preventDefault();
      setMenu(false);
      gotoItem(a.dataset.go);
    });

    // Search input with 120ms debounce
    const qInput = document.getElementById('g-q');
    let qTimer = 0;
    qInput.addEventListener('input', () => {
      clearTimeout(qTimer);
      qTimer = setTimeout(() => {
        state.q = qInput.value.trim();
        apply();
      }, 120);
    });

    // Reset buttons
    const doReset = () => {
      resetAllFilters();
      apply();
      toTop();
    };
    document.getElementById('g-reset')?.addEventListener('click', doReset);
    document.getElementById('g-reset2')?.addEventListener('click', doReset);

    // Default UI preference toggle
    const defaultCheckbox = document.getElementById('g-default-ui');
    const defaultHint = document.getElementById('g-default-hint');
    const syncDefaultHint = (isGuide) => {
      if (defaultHint) {
        defaultHint.textContent = isGuide
          ? 'Đã ghim làm mặc định: mở trang chủ sẽ vào thẳng giao diện này.'
          : 'Khi bật, lần sau mở trang chủ sẽ vào thẳng giao diện này.';
      }
    };
    try {
      const isGuideDefault = localStorage.getItem(UI_PREF_KEY) === 'guide';
      defaultCheckbox.checked = isGuideDefault;
      syncDefaultHint(isGuideDefault);
    } catch (e) { /* ignore */ }

    defaultCheckbox?.addEventListener('change', () => {
      const checked = defaultCheckbox.checked;
      try {
        localStorage.setItem(UI_PREF_KEY, checked ? 'guide' : 'library');
      } catch (e) { /* ignore */ }
      syncDefaultHint(checked);
    });

    // Dark mode toggle
    document.getElementById('g-theme')?.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
      } catch (e) { /* ignore */ }
    });

    // Mobile drawer
    menuBtn?.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
    backdrop?.addEventListener('click', () => setMenu(false));

    // Open article / doc modals via delegation
    document.addEventListener('click', (ev) => {
      const artTrigger = ev.target.closest('[data-open-article]');
      if (artTrigger) {
        openArticleModal(artTrigger.dataset.openArticle, artTrigger);
        return;
      }
      const docTrigger = ev.target.closest('[data-doc]');
      if (docTrigger) {
        openDocModal(docTrigger.dataset.doc, docTrigger);
      }
    });

    document.getElementById('g-method-btn')?.addEventListener('click', (ev) => {
      openDocModal('editorial', ev.currentTarget);
    });

    // Modal close & scroll-spy
    document.getElementById('dm-x').addEventListener('click', closeModal);
    DM.mask.addEventListener('click', (ev) => {
      if (ev.target === DM.mask) closeModal();
    });
    let dmTick = false;
    DM.doc.addEventListener('scroll', () => {
      if (dmTick) return;
      dmTick = true;
      requestAnimationFrame(() => {
        dmTick = false;
        dmSpy();
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        if (!DM.mask.hidden) {
          closeModal();
          return;
        }
        if (document.activeElement === qInput) qInput.blur();
        setMenu(false);
        return;
      }
      if (!DM.mask.hidden) return;
      const activeTag = document.activeElement?.tagName;
      if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(activeTag)) {
        ev.preventDefault();
        qInput.focus();
      }
    });

    addEventListener('scroll', spy, { passive: true });
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function setProgress(pct, text) {
    const bar = document.getElementById('g-status-b');
    const label = document.getElementById('g-status-t');
    if (bar) bar.style.width = `${pct}%`;
    if (label && text) label.textContent = text;
  }

  async function init() {
    wireEvents();
    setProgress(20, 'Đang tải thư viện 769 bài viết…');

    try {
      if (location.protocol === 'file:') {
        throw new Error('Hãy chạy website qua lệnh npm run preview, không mở trực tiếp bằng file://.');
      }
      const resp = await fetch(`${BASE}/data/catalog.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setProgress(65, 'Đang lập chỉ mục tìm kiếm…');

      const catalog = await resp.json();
      state.categories = catalog.categories || [];
      state.categoryMap = new Map(state.categories.map((c) => [c.id, c]));
      state.articles = (catalog.articles || []).filter((a) => a.review_status !== 'draft');

      setProgress(90, 'Đang dựng giao diện…');
      buildContentDOM();
      buildSidebarCategories();
      setupCardObserver();
      readUrl();
      apply();

      if (location.hash) {
        const targetId = location.hash.slice(1);
        if (CARD_BY_ID.has(targetId)) {
          gotoItem(targetId);
        }
      }
    } catch (err) {
      console.error('[guide.js]', err);
      const container = document.getElementById('g-sections');
      if (container) {
        container.innerHTML = `<div class="g-empty"><p>Không tải được dữ liệu: ${esc(err.message)}</p></div>`;
      }
      const statEl = document.getElementById('g-stat');
      if (statEl) statEl.textContent = 'Không tải được dữ liệu.';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
