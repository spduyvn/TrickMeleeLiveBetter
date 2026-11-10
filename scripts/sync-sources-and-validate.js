const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const articlesDir = path.join(root, 'content', 'articles');
const sourcesFile = path.join(root, 'content', 'sources', 'sources.json');
const categoriesFile = path.join(root, 'content', 'categories', 'categories.json');

const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
const categoryIds = new Set(categories.map(c => c.id));

const articleFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
const allArticles = [];
const idSet = new Set();
const slugSet = new Set();

for (const file of articleFiles) {
  const list = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));
  for (const art of list) {
    if (!art.id) throw new Error(`${file}: Thiếu ID trong bài viết: ${art.title}`);
    if (idSet.has(art.id)) throw new Error(`Trùng ID: ${art.id}`);
    idSet.add(art.id);

    if (!art.slug) throw new Error(`${art.id}: Thiếu slug`);
    if (slugSet.has(art.slug)) throw new Error(`Trùng slug: ${art.slug} (${art.id})`);
    slugSet.add(art.slug);

    if (!categoryIds.has(art.category)) throw new Error(`${art.id}: Sai danh mục ${art.category}`);
    if (!['draft', 'needs_review', 'verified', 'outdated', 'disputed'].includes(art.review_status)) {
      throw new Error(`${art.id}: Sai review_status: ${art.review_status}`);
    }

    allArticles.push(art);
  }
}

console.log(`Validation passed: ${allArticles.length} bài viết hợp lệ, ID và slug duy nhất 100%.`);

// Sync sources
let existingSources = [];
if (fs.existsSync(sourcesFile)) {
  existingSources = JSON.parse(fs.readFileSync(sourcesFile, 'utf8'));
}

const sourceMap = new Map();
// Existing sources first
for (const s of existingSources) {
  const key = s.url || s.title;
  sourceMap.set(key, s);
}

// Add all sources from articles
let addedCount = 0;
for (const art of allArticles) {
  if (Array.isArray(art.sources)) {
    for (const s of art.sources) {
      const key = s.url || s.title;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, s);
        addedCount++;
      }
    }
  }
}

const updatedSources = Array.from(sourceMap.values());
fs.writeFileSync(sourcesFile, JSON.stringify(updatedSources, null, 2) + '\n');
console.log(`Sources synced: ${existingSources.length} -> ${updatedSources.length} sources (added ${addedCount}).`);
