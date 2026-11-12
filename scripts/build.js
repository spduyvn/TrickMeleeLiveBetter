const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const basePath = normalizeBasePath(process.env.BASE_PATH || '');
const SITE_ORIGIN = 'https://spduyvn.github.io/TrickMeleeLiveBetter';

function normalizeBasePath(value) {
  if (!value || value === '/') return '';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) copyDirectory(from, to);
    else fs.copyFileSync(from, to);
  }
}

function replaceBasePath(html) {
  return html.replaceAll('<!-- BASE_PATH -->', basePath);
}

function escHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function escJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

function normalizeGrade(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'a' || v === 'high') return 'A';
  if (v === 'b' || v === 'medium') return 'B';
  if (v === 'c' || v === 'low') return 'C';
  return null;
}

function normalizeValue(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'rất cao') return 'very_high';
  if (v === 'cao' || v === 'high') return 'high';
  if (v === 'trung bình' || v === 'medium' || v === 'thấp' || v === 'low') return 'medium';
  return null;
}

function classifyCost(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'low';
  if (v === 'free' || v === '0') return 'free';
  if (v === 'high') return 'high';
  if (v === 'low' || v === 'medium') return 'low';
  if (/^(hoàn toàn )?miễn phí|không tốn|không mất|0 đồng|tiết kiệm|tránh mất/.test(v)) return 'free';
  if (/chi phí cao|tốn nhiều|đắt|vài triệu|hàng triệu|hàng chục triệu|triệu đồng/.test(v) && !/tiết kiệm|tránh mất/.test(v)) return 'high';
  return 'low';
}

function classifyTime(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'medium';
  if (v === 'quick' || v === 'low') return 'quick';
  if (v === 'habit' || v === 'high') return 'habit';
  if (v === 'medium') return 'medium';
  if (/hàng ngày|hằng ngày|mỗi ngày|suốt đời|lâu dài|nhiều năm|liên tục|định kỳ|duy trì|tháng/.test(v)) return 'habit';
  if (/giây|phút|ngay lập tức|tức thì|tức thời|nhanh|mỗi lần|tiện|1 lần|một lần/.test(v)) return 'quick';
  return 'medium';
}

function classifyEffort(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'medium';
  if (v === 'low' || /^(rất )?(thấp|dễ|nhẹ|đơn giản)/.test(v)) {
    return /trung bình/.test(v) ? 'medium' : 'low';
  }
  if (v === 'high' || /^(rất )?cao|khó|kỷ luật cao|đòi hỏi quyết tâm/.test(v)) return 'high';
  if (v === 'medium' || /trung bình/.test(v)) return 'medium';
  return 'medium';
}

function classifyAudience(groups) {
  const text = Array.isArray(groups) ? groups.join(' ').toLowerCase() : String(groups || '').toLowerCase();
  const tags = [];
  if (/trẻ|con nhỏ|sơ sinh|thai|bầu|mẹ|gia đình|hôn nhân|vợ chồng|phụ huynh/.test(text)) tags.push('family');
  if (/cao tuổi|người già|ông bà|lớn tuổi|hưu trí/.test(text)) tags.push('elderly');
  if (/phụ nữ|nữ giới|mang thai|thai kỳ|mẹ bầu|sinh nở/.test(text)) tags.push('women');
  if (/đi làm|lao động|nhân viên|văn phòng|freelancer|doanh|khởi nghiệp|nghề/.test(text)) tags.push('worker');
  if (/học sinh|sinh viên|người trẻ|thanh niên|18 tuổi|du học/.test(text)) tags.push('youth');
  if (/mạn tính|bệnh|tim mạch|tiểu đường|huyết áp|khuyết tật/.test(text)) tags.push('chronic');
  if (tags.length === 0 || /mọi người|tất cả|ai cũng|trưởng thành|cá nhân|công dân|người dùng/.test(text)) {
    tags.push('general');
  }
  return tags;
}

function buildFacets(article) {
  return {
    grade: normalizeGrade(article.evidence_level),
    value: normalizeValue(article.value_level),
    cost: classifyCost(article.cost),
    time: classifyTime(article.time),
    effort: classifyEffort(article.effort),
    audience: classifyAudience(article.target_groups),
  };
}

function pickRelatedArticles(article, pool, limit = 4) {
  const tagSet = new Set((article.tags || []).map((t) => String(t).toLowerCase()));
  const scored = [];
  for (const item of pool) {
    if (item.id === article.id || item.review_status === 'draft') continue;
    let score = 0;
    if (item.category === article.category) score += 3;
    for (const tag of item.tags || []) {
      if (tagSet.has(String(tag).toLowerCase())) score += 2;
    }
    if (item.review_status === 'verified') score += 1;
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.item);
}

function formatMetaValue(value) {
  if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
    return 'Chưa cung cấp';
  }
  return Array.isArray(value) ? value.map(escHtml).join(', ') : escHtml(value);
}

function renderReportIssueUrl(article) {
  const title = `[Báo lỗi] ${article.title || article.id}`;
  const details = [
    `- ID: ${article.id}`,
    `- Slug: ${article.slug}`,
    `- Danh mục: ${article.category}`,
    `- Trạng thái hiện tại: ${article.review_status}`,
    '',
    'Mô tả nội dung cần sửa / link nguồn thay thế:',
    '',
  ].join('\n');
  const params = new URLSearchParams({
    template: 'bao-loi-noi-dung.yml',
    title,
    article_id: article.id,
    details,
  });
  return `https://github.com/spduyvn/TrickMeleeLiveBetter/issues/new?${params.toString()}`;
}

function renderArticleHtmlPage(article, category, relatedArticles) {
  const canonicalUrl = `${SITE_ORIGIN}/bai-viet/${encodeURIComponent(article.slug)}/`;
  const statusLabel = article.status_label || article.review_status;
  const catName = category ? category.name : article.category;
  const bodyHtml = article.body
    ? String(article.body)
        .split(/\n\n+/)
        .map((para) => `<p>${escHtml(para).replace(/\n/g, '<br>')}</p>`)
        .join('')
    : '<p>Nội dung chi tiết đang được biên soạn và đối chiếu nguồn.</p>';
  const notesHtml = article.evidence_notes
    ? String(article.evidence_notes)
        .split(/\n\n+/)
        .map((para) => `<p>${escHtml(para)}</p>`)
        .join('')
    : '<p>Chưa có ghi chú bằng chứng chi tiết.</p>';
  const sourcesHtml = (article.sources || []).length
    ? article.sources
        .map(
          (src) =>
            `<li><a href="${escHtml(src.url)}" rel="noopener noreferrer" target="_blank">${escHtml(src.title)}</a> — ${escHtml(src.organization || 'Không rõ đơn vị')}, ${escHtml(src.country || 'Quốc tế')}; công bố: ${escHtml(src.published_at || 'không rõ')}; truy cập: ${escHtml(src.accessed_at || 'không rõ')}</li>`
        )
        .join('')
    : '<li>Chưa có nguồn được ghi nhận.</li>';

  const relatedHtml = relatedArticles.length
    ? `<section class="ap-related" aria-label="Bài viết liên quan"><h2>Bài viết liên quan</h2><div class="ap-related-grid">${relatedArticles
        .map(
          (rel) =>
            `<a class="ap-rel-card" href="${basePath}/bai-viet/${encodeURIComponent(rel.slug)}/"><strong>${escHtml(rel.title)}</strong><span>${escHtml(rel.description)}</span></a>`
        )
        .join('')}</div></section>`
    : '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    inLanguage: 'vi',
    url: canonicalUrl,
    dateModified: article.last_updated || undefined,
    datePublished: article.verified_at || article.last_updated || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Sống Tốt Hơn',
    },
  };

  const clientData = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    body: article.body || '',
    benefits: article.benefits || [],
    risks: article.risks || [],
    sources: article.sources || [],
  };

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0f6b58">
  <title>${escHtml(article.title)} — Sống Tốt Hơn</title>
  <meta name="description" content="${escHtml(article.description)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Sống Tốt Hơn">
  <meta property="og:title" content="${escHtml(article.title)}">
  <meta property="og:description" content="${escHtml(article.description)}">
  <meta property="og:url" content="${escHtml(canonicalUrl)}">
  <link rel="canonical" href="${escHtml(canonicalUrl)}">
  <link rel="manifest" href="${basePath}/manifest.webmanifest">
  <link rel="stylesheet" href="${basePath}/assets/styles.css">
  <script type="application/ld+json">${escJsonLd(jsonLd)}</script>
</head>
<body>
  <a class="skip-link" href="#main">Bỏ qua điều hướng</a>
  <header class="site-header">
    <a class="brand" href="${basePath}/?view=library" aria-label="Sống Tốt Hơn — Trang chủ"><span class="brand-mark" aria-hidden="true">S</span><span>Sống Tốt Hơn</span></a>
    <nav id="primary-nav" class="primary-nav" aria-label="Điều hướng chính">
      <a href="${basePath}/?view=library#kham-pha">Thư viện</a>
      <a href="${basePath}/category/?id=${encodeURIComponent(article.category)}">${escHtml(catName)}</a>
      <a href="${basePath}/sources/">Nguồn tham khảo</a>
      <a href="${basePath}/method/">Phương pháp</a>
      <a class="nav-mode-pill" href="${basePath}/guide/#item-${escHtml(article.id)}">Tra cứu nhanh</a>
    </nav>
  </header>

  <main id="main" class="section wrap article-page">
    <nav class="ap-breadcrumbs" aria-label="Đường dẫn">
      <a href="${basePath}/?view=library">Trang chủ</a>
      <span aria-hidden="true">/</span>
      <a href="${basePath}/category/?id=${encodeURIComponent(article.category)}">${escHtml(catName)}</a>
      <span aria-hidden="true">/</span>
      <span>${escHtml(article.title)}</span>
    </nav>

    <article id="pre-article" data-article-id="${escHtml(article.id)}">
      <header class="article-heading">
        <p class="eyebrow">${escHtml(catName)}</p>
        <h1>${escHtml(article.title)}</h1>
        <p class="hero-copy">${escHtml(article.description)}</p>
        <p class="article-meta">
          <span class="status status-${escHtml(article.review_status)}">${escHtml(statusLabel)}</span>
          <span>${article.verified_at ? `Xác minh: ${escHtml(article.verified_at)}` : 'Ngày xác minh: chưa có'}</span>
        </p>
        <div class="ap-actions">
          <button type="button" class="ap-btn" id="ap-save-btn" aria-pressed="false">☆ Lưu bài</button>
          <button type="button" class="ap-btn" id="ap-done-btn" aria-pressed="false">Đánh dấu đã áp dụng</button>
          <button type="button" class="ap-btn" id="ap-copy-btn">🔗 Sao chép link</button>
          <a class="ap-btn" href="${basePath}/guide/#item-${escHtml(article.id)}">Mở trên Tra cứu nhanh</a>
          <a class="ap-btn" href="${escHtml(renderReportIssueUrl(article))}" target="_blank" rel="noopener noreferrer">⚠ Báo lỗi / Sửa nguồn</a>
        </div>
      </header>

      <section class="metadata-panel">
        <h2>Thông tin áp dụng</h2>
        <dl class="metadata-grid">
          <div><dt>Thẻ</dt><dd>${formatMetaValue(article.tags)}</dd></div>
          <div><dt>Chi phí</dt><dd>${formatMetaValue(article.cost)}</dd></div>
          <div><dt>Thời lượng đọc</dt><dd>${formatMetaValue(article.reading_time)}</dd></div>
          <div><dt>Thời gian áp dụng</dt><dd>${formatMetaValue(article.time)}</dd></div>
          <div><dt>Công sức</dt><dd>${formatMetaValue(article.effort)}</dd></div>
          <div><dt>Lợi ích</dt><dd>${formatMetaValue(article.benefits)}</dd></div>
          <div><dt>Rủi ro &amp; lưu ý</dt><dd>${formatMetaValue(article.risks)}</dd></div>
          <div><dt>Đối tượng phù hợp</dt><dd>${formatMetaValue(article.target_groups)}</dd></div>
          <div><dt>Mức độ giá trị</dt><dd>${escHtml(article.value_level || 'Chưa đánh giá')}</dd></div>
          <div><dt>Mức độ bằng chứng</dt><dd>${escHtml(article.evidence_level || 'Chưa đánh giá')}</dd></div>
        </dl>
      </section>

      <section class="ap-checklist" id="ap-checklist">
        <div class="ap-cl-head">
          <h2>Checklist thực hành</h2>
          <span class="ap-cl-count">0 bước</span>
        </div>
        <div class="ap-cl-list"></div>
      </section>

      <section class="article-body">
        <h2>Nội dung chi tiết</h2>
        ${bodyHtml}
        <h2>Bằng chứng và giới hạn áp dụng</h2>
        ${notesHtml}
        <h2>Nguồn tham khảo</h2>
        <ul>${sourcesHtml}</ul>
        <p class="article-meta">Cập nhật lần cuối: ${escHtml(article.last_updated || 'Chưa cập nhật')}</p>
      </section>
    </article>

    ${relatedHtml}
  </main>

  <footer class="site-footer">
    <div class="wrap footer-inner">
      <a class="brand" href="${basePath}/?view=library"><span class="brand-mark" aria-hidden="true">S</span><span>Sống Tốt Hơn</span></a>
      <p>Kiến thức để tham khảo, không thay thế tư vấn chuyên môn.</p>
      <div><a href="${basePath}/sources/">Nguồn tham khảo</a><a href="${basePath}/method/">Phương pháp</a></div>
    </div>
  </footer>

  <script type="application/json" id="pre-article-data">${escJsonLd(clientData)}</script>
  <script src="${basePath}/assets/reader-tools.js" defer></script>
  <script src="${basePath}/assets/article-page.js" defer></script>
</body>
</html>
`;
}

function buildSitemapXml(categories, publishedArticles) {
  const staticPaths = ['/', '/guide/', '/category/', '/article/', '/sources/', '/method/', '/EVIDENCE_GRADING.html', '/CONTRIBUTING.html'];
  const urls = [];
  for (const p of staticPaths) {
    urls.push(`  <url><loc>${SITE_ORIGIN}${p}</loc></url>`);
  }
  for (const cat of categories) {
    urls.push(`  <url><loc>${SITE_ORIGIN}/category/?id=${encodeURIComponent(cat.id)}</loc></url>`);
  }
  for (const art of publishedArticles) {
    const lastmod = art.last_updated ? `<lastmod>${escHtml(art.last_updated)}</lastmod>` : '';
    urls.push(`  <url><loc>${SITE_ORIGIN}/bai-viet/${encodeURIComponent(art.slug)}/</loc>${lastmod}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
copyDirectory(path.join(root, 'src'), dist);
copyDirectory(path.join(root, 'docs'), path.join(dist, 'docs'));
copyDirectory(path.join(root, 'content', 'categories'), path.join(dist, 'data', 'categories'));
copyDirectory(path.join(root, 'content', 'articles'), path.join(dist, 'data', 'articles'));
copyDirectory(path.join(root, 'content', 'sources'), path.join(dist, 'data', 'sources'));

const categoryFile = path.join(root, 'content', 'categories', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
const categoryMap = new Map(categories.map((c) => [c.id, c]));
const articleFiles = fs.readdirSync(path.join(root, 'content', 'articles')).filter((name) => name.endsWith('.json'));
const articles = articleFiles.flatMap((name) => {
  const records = JSON.parse(fs.readFileSync(path.join(root, 'content', 'articles', name), 'utf8'));
  if (!Array.isArray(records)) throw new Error(`${name}: bài viết phải là một JSON array.`);
  return records.map((rec) => ({ ...rec, _file: name }));
});

const ids = new Set();
const slugs = new Set();
for (const article of articles) {
  if (!article.id || !article.title || !article.slug || !article.category || !article.review_status) {
    throw new Error(`Bài viết thiếu trường bắt buộc: ${article.id || article.title || '(không có id)'}`);
  }
  if (ids.has(article.id)) throw new Error(`ID bài viết bị trùng: ${article.id}`);
  if (slugs.has(article.slug)) throw new Error(`Slug bài viết bị trùng: ${article.slug}`);
  if (!categoryMap.has(article.category)) throw new Error(`${article.id}: danh mục không tồn tại: ${article.category}`);
  if (!['draft', 'needs_review', 'verified', 'outdated', 'disputed'].includes(article.review_status)) {
    throw new Error(`${article.id}: trạng thái không hợp lệ: ${article.review_status}`);
  }
  ids.add(article.id);
  slugs.add(article.slug);
}

const enrichedArticles = articles.map((article) => ({ ...article, facets: buildFacets(article) }));
const indexArticles = enrichedArticles.map((article) => {
  const lite = { ...article };
  delete lite.body;
  return lite;
});
const categoryCounts = categories.map((category) => ({
  ...category,
  article_count: enrichedArticles.filter((article) => article.category === category.id && article.review_status !== 'draft').length,
}));

// Write both lightweight index (fast initial load) and full catalog (compatibility)
fs.writeFileSync(
  path.join(dist, 'data', 'catalog-index.json'),
  JSON.stringify({ categories: categoryCounts, articles: indexArticles })
);
fs.writeFileSync(
  path.join(dist, 'data', 'catalog.json'),
  JSON.stringify({ categories: categoryCounts, articles: enrichedArticles })
);

function processHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) processHtml(target);
    else if (entry.name.endsWith('.html')) fs.writeFileSync(target, replaceBasePath(fs.readFileSync(target, 'utf8')));
  }
}
processHtml(dist);

// Pre-render static SEO pages for all non-draft articles
const publishedArticles = enrichedArticles.filter((a) => a.review_status !== 'draft');
const articlesOutDir = path.join(dist, 'bai-viet');
for (const article of publishedArticles) {
  const outDir = path.join(articlesOutDir, article.slug);
  fs.mkdirSync(outDir, { recursive: true });
  const related = pickRelatedArticles(article, publishedArticles, 4);
  const html = renderArticleHtmlPage(article, categoryMap.get(article.category), related);
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
}

// Generate full sitemap.xml
fs.writeFileSync(path.join(dist, 'sitemap.xml'), buildSitemapXml(categoryCounts, publishedArticles), 'utf8');

for (const pathname of [
  'assets/styles.css',
  'assets/app.js',
  'assets/guide.css',
  'assets/guide.js',
  'assets/admin.css',
  'assets/admin.js',
  'assets/reader-tools.js',
  'assets/article-page.js',
  'manifest.webmanifest',
  'sw.js',
  'data/catalog.json',
  'data/catalog-index.json',
  'category/index.html',
  'article/index.html',
  'guide/index.html',
  'admin/index.html',
  'sources/index.html',
  'method/index.html',
  'sitemap.xml',
]) {
  if (!fs.existsSync(path.join(dist, pathname))) throw new Error(`Thiếu đầu ra build: ${pathname}`);
}

console.log(
  `Static site built in dist/ (base path: ${basePath || '/'}, ${categories.length} danh mục, ${articles.length} bài viết, ${publishedArticles.length} trang SEO tĩnh).`
);
