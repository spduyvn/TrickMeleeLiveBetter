const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const basePath = normalizeBasePath(process.env.BASE_PATH || '');

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

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
copyDirectory(path.join(root, 'src'), dist);
copyDirectory(path.join(root, 'docs'), path.join(dist, 'docs'));
copyDirectory(path.join(root, 'content', 'categories'), path.join(dist, 'data', 'categories'));
copyDirectory(path.join(root, 'content', 'articles'), path.join(dist, 'data', 'articles'));
copyDirectory(path.join(root, 'content', 'sources'), path.join(dist, 'data', 'sources'));

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

const categoryFile = path.join(root, 'content', 'categories', 'categories.json');
const categories = JSON.parse(fs.readFileSync(categoryFile, 'utf8'));
const articleFiles = fs.readdirSync(path.join(root, 'content', 'articles')).filter((name) => name.endsWith('.json'));
const articles = articleFiles.flatMap((name) => {
  const records = JSON.parse(fs.readFileSync(path.join(root, 'content', 'articles', name), 'utf8'));
  if (!Array.isArray(records)) throw new Error(`${name}: bài viết phải là một JSON array.`);
  return records;
});
const ids = new Set();
for (const article of articles) {
  if (!article.id || !article.title || !article.slug || !article.category || !article.review_status) throw new Error(`Bài viết thiếu trường bắt buộc: ${article.id || article.title || '(không có id)'}`);
  if (ids.has(article.id)) throw new Error(`ID bài viết bị trùng: ${article.id}`);
  if (!categories.some((category) => category.id === article.category)) throw new Error(`${article.id}: danh mục không tồn tại: ${article.category}`);
  if (!['draft', 'needs_review', 'verified', 'outdated', 'disputed'].includes(article.review_status)) throw new Error(`${article.id}: trạng thái không hợp lệ: ${article.review_status}`);
  ids.add(article.id);
}
const enrichedArticles = articles.map((article) => ({ ...article, facets: buildFacets(article) }));
const categoryCounts = categories.map((category) => ({ ...category, article_count: enrichedArticles.filter((article) => article.category === category.id && article.review_status !== 'draft').length }));
fs.writeFileSync(path.join(dist, 'data', 'catalog.json'), JSON.stringify({ categories: categoryCounts, articles: enrichedArticles }, null, 2) + '\n');

function processHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) processHtml(target);
    else if (entry.name.endsWith('.html')) fs.writeFileSync(target, replaceBasePath(fs.readFileSync(target, 'utf8')));
  }
}
processHtml(dist);

for (const pathname of ['assets/styles.css', 'assets/app.js', 'assets/guide.css', 'assets/guide.js', 'assets/admin.css', 'assets/admin.js', 'data/catalog.json', 'category/index.html', 'article/index.html', 'guide/index.html', 'admin/index.html', 'sources/index.html', 'method/index.html']) {
  if (!fs.existsSync(path.join(dist, pathname))) throw new Error(`Thiếu đầu ra build: ${pathname}`);
}
console.log(`Static site built in dist/ (base path: ${basePath || '/'}, ${categories.length} danh mục, ${articles.length} bài viết).`);
