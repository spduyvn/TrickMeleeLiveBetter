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
const categoryCounts = categories.map((category) => ({ ...category, article_count: articles.filter((article) => article.category === category.id && article.review_status !== 'draft').length }));
fs.writeFileSync(path.join(dist, 'data', 'catalog.json'), JSON.stringify({ categories: categoryCounts, articles }, null, 2) + '\n');

function processHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) processHtml(target);
    else if (entry.name.endsWith('.html')) fs.writeFileSync(target, replaceBasePath(fs.readFileSync(target, 'utf8')));
  }
}
processHtml(dist);

for (const pathname of ['assets/styles.css', 'assets/app.js', 'data/catalog.json', 'category/index.html', 'article/index.html', 'sources/index.html', 'method/index.html']) {
  if (!fs.existsSync(path.join(dist, pathname))) throw new Error(`Thiếu đầu ra build: ${pathname}`);
}
console.log(`Static site built in dist/ (base path: ${basePath || '/'}, ${categories.length} danh mục, ${articles.length} bài viết).`);
