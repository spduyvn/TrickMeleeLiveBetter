const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const defaultSourcesFile = path.join(root, 'content', 'sources', 'sources.json');

function collectUniqueUrls(sources) {
  const byUrl = new Map();
  for (const src of Array.isArray(sources) ? sources : []) {
    const raw = String(src?.url || '').trim();
    if (!/^https?:\/\//i.test(raw)) continue;
    if (!byUrl.has(raw)) {
      byUrl.set(raw, { url: raw, title: src.title || '', organization: src.organization || '' });
    }
  }
  return Array.from(byUrl.values());
}

function classifyStatus(statusCode, errorMessage = '') {
  if (errorMessage) return 'broken';
  if (statusCode >= 200 && statusCode < 400) return 'ok';
  if (statusCode === 401 || statusCode === 403 || statusCode === 405 || statusCode === 429) {
    return 'warn_blocked';
  }
  return 'broken';
}

async function probeUrl(url, timeoutMs = 8000) {
  const headers = {
    'User-Agent': 'SongTotHon-LinkChecker/1.0 (+https://github.com/spduyvn/TrickMeleeLiveBetter)',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  for (const method of ['HEAD', 'GET']) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers,
      });
      clearTimeout(timer);
      if (method === 'HEAD' && (resp.status === 405 || resp.status === 403 || resp.status >= 500)) {
        continue;
      }
      const state = classifyStatus(resp.status);
      return { url, status: resp.status, state, error: '' };
    } catch (err) {
      clearTimeout(timer);
      if (method === 'HEAD') continue;
      const msg = err?.name === 'AbortError' ? `Timeout (${timeoutMs}ms)` : err?.message || 'Fetch error';
      return { url, status: 0, state: 'broken', error: msg };
    }
  }
  return { url, status: 0, state: 'broken', error: 'Unknown probe failure' };
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const idx = nextIndex;
      nextIndex += 1;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length || 1) }, () => runWorker());
  await Promise.all(workers);
  return results;
}

function buildMarkdownReport(results) {
  const ok = results.filter((r) => r.state === 'ok');
  const warned = results.filter((r) => r.state === 'warn_blocked');
  const broken = results.filter((r) => r.state === 'broken');

  const lines = [
    '# Báo cáo kiểm tra liên kết nguồn tham khảo',
    '',
    `- Thời gian: ${new Date().toISOString()}`,
    `- Tổng URL kiểm tra: **${results.length}**`,
    `- Hợp lệ (2xx/3xx): **${ok.length}**`,
    `- Bị chặn bot / giới hạn tốc độ (403/429): **${warned.length}**`,
    `- Nghi ngờ lỗi (404/5xx/timeout/DNS): **${broken.length}**`,
    '',
  ];

  if (broken.length > 0) {
    lines.push('## Liên kết lỗi cần rà soát', '');
    for (const item of broken) {
      lines.push(`- \`${item.status || 'ERR'}\` ${item.url}${item.error ? ` — ${item.error}` : ''} (${item.title || 'Không rõ tiêu đề'})`);
    }
    lines.push('');
  }

  if (warned.length > 0) {
    lines.push('## Liên kết chặn bot (cần mở kiểm tra tay nếu nghi ngờ)', '');
    for (const item of warned.slice(0, 50)) {
      lines.push(`- \`${item.status}\` ${item.url} (${item.title || 'Không rõ tiêu đề'})`);
    }
    if (warned.length > 50) lines.push(`- … và ${warned.length - 50} liên kết khác.`);
    lines.push('');
  }

  return lines.join('\n');
}

function parseFlag(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  const prefix = `${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : fallback;
}

async function main() {
  const sourcesPath = path.resolve(parseFlag('--sources', defaultSourcesFile));
  const concurrency = Math.max(1, Number(parseFlag('--concurrency', 8)));
  const timeoutMs = Math.max(1000, Number(parseFlag('--timeout', 8000)));
  const limit = Number(parseFlag('--limit', 0));
  const outFile = parseFlag('--out', '');
  const strict = process.argv.includes('--strict');

  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  let urls = collectUniqueUrls(sources);
  if (limit > 0) urls = urls.slice(0, limit);

  console.log(`Đang kiểm tra ${urls.length} URL duy nhất (concurrency=${concurrency}, timeout=${timeoutMs}ms)...`);
  const results = await runPool(urls, concurrency, async (entry) => {
    const probed = await probeUrl(entry.url, timeoutMs);
    return { ...entry, ...probed };
  });

  const report = buildMarkdownReport(results);
  if (outFile) {
    fs.writeFileSync(path.resolve(outFile), report + '\n', 'utf8');
    console.log(`Đã xuất báo cáo tại ${outFile}`);
  } else {
    console.log(report);
  }

  const brokenCount = results.filter((r) => r.state === 'broken').length;
  console.log(`Hoàn tất: ${results.length} URL, ${brokenCount} lỗi.`);
  if (strict && brokenCount > 0) process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Lỗi kiểm tra link:', err.message);
    process.exit(1);
  });
}

module.exports = { collectUniqueUrls, classifyStatus, buildMarkdownReport, probeUrl };

