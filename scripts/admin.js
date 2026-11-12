const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { execFileSync } = require('node:child_process');
const {
  DEFAULT_AUTH_FILE,
  SESSION_COOKIE_NAME,
  loadAuthConfig,
  saveAuthConfig,
  verifyCredentials,
  parseCookies,
  createSessionManager,
  createRateLimiter,
  isLoopbackHost,
  isSameOrigin,
} = require('./admin-auth');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const docsDir = path.join(root, 'docs');
const articlesDir = path.join(root, 'content', 'articles');
const categoriesFile = path.join(root, 'content', 'categories', 'categories.json');

const VALID_STATUSES = new Set(['draft', 'needs_review', 'verified', 'outdated', 'disputed']);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function readCategories() {
  return JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
}

function readAllArticleFiles() {
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json')).sort();
  const articles = [];
  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) continue;
    for (const art of list) {
      articles.push({ ...art, _file: file });
    }
  }
  return { files, articles };
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    request.on('data', (chunk) => {
      total += chunk.length;
      if (total > 2 * 1024 * 1024) {
        reject(new Error('Payload quá lớn (>2MB).'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('JSON không hợp lệ.'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data, null, 2);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  response.end(body);
}

function validateArticlePayload(article, targetFile, categories) {
  const errors = [];
  if (!article || typeof article !== 'object') return ['Dữ liệu bài viết không hợp lệ.'];
  if (!String(article.id || '').trim()) errors.push('Thiếu trường id.');
  if (!String(article.slug || '').trim()) errors.push('Thiếu trường slug.');
  if (!String(article.title || '').trim()) errors.push('Thiếu tiêu đề (title).');
  if (!String(article.description || '').trim()) errors.push('Thiếu tóm tắt (description).');
  if (!categories.some((c) => c.id === article.category)) errors.push(`Danh mục không tồn tại: ${article.category}`);
  if (!VALID_STATUSES.has(article.review_status)) errors.push(`Trạng thái không hợp lệ: ${article.review_status}`);
  if (article.review_status === 'verified' && !/^\d{4}-\d{2}-\d{2}$/.test(String(article.verified_at || ''))) {
    errors.push('Bài verified cần có verified_at định dạng YYYY-MM-DD.');
  }
  if (Array.isArray(article.sources)) {
    article.sources.forEach((src, i) => {
      if (!String(src?.title || '').trim()) errors.push(`Nguồn #${i + 1}: thiếu title.`);
      if (!String(src?.url || '').trim()) errors.push(`Nguồn #${i + 1}: thiếu url.`);
    });
  }

  // Check uniqueness across other files / records
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const list = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));
    for (const existing of list) {
      if (file === targetFile && existing.id === article.id) continue;
      if (existing.id === article.id) errors.push(`ID "${article.id}" đã tồn tại trong ${file}.`);
      if (existing.slug === article.slug) errors.push(`Slug "${article.slug}" bị trùng với ${existing.id} (${file}).`);
    }
  }
  return errors;
}

function sanitizeArticleForDisk(payload) {
  const clean = { ...payload };
  delete clean._file;
  if (!Array.isArray(clean.tags)) clean.tags = [];
  if (!Array.isArray(clean.benefits)) clean.benefits = [];
  if (!Array.isArray(clean.risks)) clean.risks = [];
  if (!Array.isArray(clean.target_groups)) clean.target_groups = [];
  if (!Array.isArray(clean.sources)) clean.sources = [];
  return clean;
}

function slugifyVietnamese(text) {
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

function collectUsedIdsAndSlugs() {
  const usedIds = new Set();
  const usedSlugs = new Set();
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const list = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf8'));
    if (!Array.isArray(list)) continue;
    for (const art of list) {
      if (art.id) usedIds.add(art.id);
      if (art.slug) usedSlugs.add(art.slug);
    }
  }
  return { usedIds, usedSlugs };
}

function buildNewArticleRecord({ title, category, description }, categories) {
  const cleanTitle = String(title || '').trim();
  const cleanDesc = String(description || '').trim();
  const cleanCat = String(category || '').trim();
  if (!cleanTitle) throw new Error('Thiếu tiêu đề bài viết.');
  if (!categories.some((c) => c.id === cleanCat)) throw new Error(`Danh mục không tồn tại: ${cleanCat}`);
  if (!cleanDesc) throw new Error('Thiếu tóm tắt ngắn (description).');

  const { usedIds, usedSlugs } = collectUsedIdsAndSlugs();
  const baseSlug = slugifyVietnamese(cleanTitle);
  let slug = baseSlug;
  let seq = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${seq}`;
    seq += 1;
  }

  let id = `${cleanCat}-${baseSlug}`;
  let idSeq = 2;
  while (usedIds.has(id)) {
    id = `${cleanCat}-${baseSlug}-${idSeq}`;
    idSeq += 1;
  }

  const today = new Date().toISOString().slice(0, 10);
  const article = {
    id,
    slug,
    title: cleanTitle,
    category: cleanCat,
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
    description: cleanDesc,
    body: '',
    sources: [],
    verified_at: null,
    review_status: 'draft',
    status_label: 'Bản nháp',
    last_updated: today,
  };

  const preferredFile = `${cleanCat}.json`;
  const targetFile = fs.existsSync(path.join(articlesDir, preferredFile)) ? preferredFile : 'demo.json';
  return { article, targetFile };
}

function normalizeBatchFiles() {
  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.json')).sort();
  let updatedCount = 0;
  const touchedFiles = [];

  for (const file of files) {
    const filePath = path.join(articlesDir, file);
    const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!Array.isArray(list)) continue;
    let fileChanged = false;

    for (const art of list) {
      let changed = false;
      if (art.evidence_level === 'high') { art.evidence_level = 'A'; changed = true; }
      else if (art.evidence_level === 'medium') { art.evidence_level = 'B'; changed = true; }
      else if (art.evidence_level === 'low') { art.evidence_level = 'C'; changed = true; }

      if (art.value_level === 'high') { art.value_level = 'Cao'; changed = true; }
      else if (art.value_level === 'medium') { art.value_level = 'Trung bình'; changed = true; }
      else if (art.value_level === 'low') { art.value_level = 'Thấp'; changed = true; }

      if (changed) {
        updatedCount += 1;
        fileChanged = true;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2) + '\n', 'utf8');
      touchedFiles.push(file);
    }
  }

  return { updatedCount, touchedFiles };
}

function serveStatic(pathname, response) {
  if (pathname === '/' || pathname === '') {
    response.writeHead(302, { Location: '/admin/' });
    response.end();
    return;
  }

  // Virtual routes for live src/ serving
  if (pathname === '/data/categories/categories.json') {
    const body = fs.readFileSync(categoriesFile, 'utf8');
    response.writeHead(200, { 'Content-Type': TYPES['.json'], 'X-Content-Type-Options': 'nosniff' });
    response.end(body);
    return;
  }
  if (pathname === '/data/catalog.json') {
    const distCatalog = path.join(root, 'dist', 'data', 'catalog.json');
    if (fs.existsSync(distCatalog)) {
      response.writeHead(200, { 'Content-Type': TYPES['.json'], 'X-Content-Type-Options': 'nosniff' });
      fs.createReadStream(distCatalog).pipe(response);
      return;
    }
  }

  const baseDir = pathname.startsWith('/docs/') ? docsDir : srcDir;
  const relPath = pathname.startsWith('/docs/') ? pathname.slice('/docs/'.length) : pathname.replace(/^\/+/, '');
  let filename = path.resolve(baseDir, relPath);
  const relative = path.relative(baseDir, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    if (fs.statSync(filename).isDirectory()) filename = path.join(filename, 'index.html');
  } catch {
    /* handled below */
  }

  if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }

  const ext = path.extname(filename);
  const contentType = TYPES[ext] || 'application/octet-stream';
  if (ext === '.html') {
    const html = fs.readFileSync(filename, 'utf8').replaceAll('<!-- BASE_PATH -->', '');
    response.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' });
    response.end(html);
    return;
  }

  response.writeHead(200, { 'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(filename).pipe(response);
}

function getSessionFromRequest(request, sessions) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  const session = sessions.get(token);
  return session ? { token, ...session } : null;
}

function buildCookieHeader(value, maxAgeSec) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}`;
}

function createAdminApp(options = {}) {
  const authFile = options.authFile || process.env.ADMIN_AUTH_FILE || DEFAULT_AUTH_FILE;
  const sessions = createSessionManager(options.sessionOptions);
  const limiter = createRateLimiter(options.limiterOptions);

  function readAuth() {
    return loadAuthConfig(authFile);
  }

  async function handleRequest(request, response) {
    if (request.headers.host && !isLoopbackHost(request.headers.host)) {
      sendJson(response, 403, { ok: false, error: 'Host không hợp lệ (chỉ chấp nhận localhost/127.0.0.1).' });
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    } catch {
      sendJson(response, 400, { ok: false, error: 'Bad request' });
      return;
    }

    try {
      if (request.method === 'GET' && pathname === '/api/health') {
        let auth = null;
        let authError = null;
        try {
          auth = readAuth();
        } catch (err) {
          authError = err.message;
        }
        const session = getSessionFromRequest(request, sessions);
        sendJson(response, 200, {
          ok: true,
          mode: 'local-write',
          authRequired: true,
          configured: Boolean(auth),
          authError,
          authenticated: Boolean(session),
          username: session?.username || null,
        });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/login') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        const auth = readAuth();
        if (!auth) {
          sendJson(response, 503, {
            ok: false,
            error: 'Chưa cấu hình tài khoản Admin. Chạy: node scripts/admin.js --init-auth',
          });
          return;
        }

        const clientKey = request.socket?.remoteAddress || 'local';
        const limit = limiter.check(clientKey);
        if (!limit.allowed) {
          sendJson(response, 429, {
            ok: false,
            error: `Đăng nhập sai quá số lần quy định. Vui lòng thử lại sau ${limit.retryAfterSec} giây.`,
            retryAfterSec: limit.retryAfterSec,
          });
          return;
        }

        const body = await readJsonBody(request);
        const username = String(body?.username || '').trim();
        const password = String(body?.password || '');

        if (!verifyCredentials(username, password, auth)) {
          const fail = limiter.recordFailure(clientKey);
          const msg = fail.locked
            ? `Sai tên đăng nhập hoặc mật khẩu. Đã khóa tạm thời ${fail.retryAfterSec} giây.`
            : `Sai tên đăng nhập hoặc mật khẩu (còn ${fail.attemptsLeft} lần thử).`;
          sendJson(response, fail.locked ? 429 : 401, { ok: false, error: msg });
          return;
        }

        limiter.reset(clientKey);
        const { token, maxAgeSec } = sessions.create(auth.username);
        sendJson(
          response,
          200,
          { ok: true, username: auth.username },
          { 'Set-Cookie': buildCookieHeader(token, maxAgeSec) }
        );
        return;
      }

      if (request.method === 'POST' && pathname === '/api/logout') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        const current = getSessionFromRequest(request, sessions);
        if (current) sessions.destroy(current.token);
        sendJson(
          response,
          200,
          { ok: true },
          { 'Set-Cookie': buildCookieHeader('', 0) }
        );
        return;
      }

      const requireAuth = () => {
        const session = getSessionFromRequest(request, sessions);
        if (!session) {
          sendJson(response, 401, { ok: false, error: 'Chưa đăng nhập hoặc phiên đã hết hạn.' });
          return null;
        }
        return session;
      };

      if (request.method === 'GET' && pathname === '/api/data') {
        if (!requireAuth()) return;
        const categories = readCategories();
        const { files, articles } = readAllArticleFiles();
        sendJson(response, 200, { ok: true, categories, files, articles });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/article') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        if (!requireAuth()) return;

        const body = await readJsonBody(request);
        const targetFile = path.basename(String(body.file || ''));
        if (!targetFile.endsWith('.json')) {
          sendJson(response, 400, { ok: false, error: 'Tên file JSON không hợp lệ.' });
          return;
        }
        const targetPath = path.join(articlesDir, targetFile);
        if (!fs.existsSync(targetPath)) {
          sendJson(response, 404, { ok: false, error: `Không tìm thấy file ${targetFile}.` });
          return;
        }

        const categories = readCategories();
        const article = sanitizeArticleForDisk(body.article);
        const errors = validateArticlePayload(article, targetFile, categories);
        if (errors.length > 0) {
          sendJson(response, 400, { ok: false, errors });
          return;
        }

        const list = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        const idx = list.findIndex((item) => item.id === article.id);
        if (idx === -1) {
          sendJson(response, 404, { ok: false, error: `Không tìm thấy bài ${article.id} trong ${targetFile}.` });
          return;
        }

        list[idx] = article;
        fs.writeFileSync(targetPath, JSON.stringify(list, null, 2) + '\n', 'utf8');
        sendJson(response, 200, { ok: true, article: { ...article, _file: targetFile } });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/article/create') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        if (!requireAuth()) return;

        const body = await readJsonBody(request);
        const categories = readCategories();
        const { article, targetFile } = buildNewArticleRecord(body || {}, categories);
        const targetPath = path.join(articlesDir, targetFile);
        const list = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
        list.unshift(article);
        fs.writeFileSync(targetPath, JSON.stringify(list, null, 2) + '\n', 'utf8');
        sendJson(response, 201, { ok: true, article: { ...article, _file: targetFile } });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/normalize-batch') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        if (!requireAuth()) return;

        const result = normalizeBatchFiles();
        sendJson(response, 200, { ok: true, ...result });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/build') {
        if (!isSameOrigin(request)) {
          sendJson(response, 403, { ok: false, error: 'Origin không hợp lệ.' });
          return;
        }
        if (!requireAuth()) return;

        const syncOut = execFileSync(process.execPath, [path.join(root, 'scripts', 'sync-sources-and-validate.js')], {
          cwd: root,
          encoding: 'utf8',
        });
        const buildOut = execFileSync(process.execPath, [path.join(root, 'scripts', 'build.js')], {
          cwd: root,
          encoding: 'utf8',
        });
        sendJson(response, 200, { ok: true, log: `${syncOut.trim()}\n${buildOut.trim()}` });
        return;
      }

      if (request.method === 'GET') {
        serveStatic(pathname, response);
        return;
      }

      sendJson(response, 405, { ok: false, error: 'Method not allowed' });
    } catch (err) {
      sendJson(response, 500, { ok: false, error: err.message });
    }
  }

  return { handleRequest, sessions, limiter, readAuth };
}

function getCliFlag(name) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const prefix = `${name}=`;
  const eqArg = process.argv.find((a) => a.startsWith(prefix));
  return eqArg ? eqArg.slice(prefix.length) : '';
}

async function runInitAuthCli() {
  let username = getCliFlag('--user') || String(process.env.ADMIN_USER || '').trim();
  let password = getCliFlag('--pass') || String(process.env.ADMIN_PASS || '');

  if (!username || !password) {
    if (!process.stdin.isTTY) {
      console.error('Thiếu --user / --pass hoặc ADMIN_USER / ADMIN_PASS.');
      process.exit(1);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
      if (!username) {
        username = (await rl.question('Tên đăng nhập Admin (3–32 ký tự, vd admin): ')).trim();
      }
      if (!password) {
        password = await rl.question('Mật khẩu Admin (>= 8 ký tự): ');
      }
    } finally {
      rl.close();
    }
  }

  const saved = saveAuthConfig(username, password);
  console.log(`Đã lưu tài khoản Admin "${saved.username}" (scrypt hash) tại .admin-auth.json (đã gitignore).`);
}

if (require.main === module) {
  if (process.argv.includes('--init-auth')) {
    runInitAuthCli().catch((err) => {
      console.error('Lỗi cấu hình Admin:', err.message);
      process.exit(1);
    });
  } else {
    const app = createAdminApp();
    let existingAuth = null;
    try {
      existingAuth = app.readAuth();
    } catch (err) {
      console.warn('[CẢNH BÁO]', err.message);
    }
    if (!existingAuth) {
      console.log('Chưa có tài khoản Admin local. Chạy `npm run admin:setup` (hoặc `node scripts/admin.js --init-auth`) để tạo tài khoản trước khi đăng nhập.');
    } else {
      console.log(`Tài khoản Admin: "${existingAuth.username}" (nguồn: ${existingAuth.source === 'env' ? 'biến môi trường' : '.admin-auth.json'}).`);
    }

    const server = http.createServer(app.handleRequest);
    const port = Number(process.env.PORT || 4174);
    server.listen(port, '127.0.0.1', () => {
      console.log(`Admin server running at http://127.0.0.1:${port}/admin/`);
    });
  }
}

module.exports = { createAdminApp };
