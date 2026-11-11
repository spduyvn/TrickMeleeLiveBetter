const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_AUTH_FILE = path.resolve(__dirname, '..', '.admin-auth.json');
const SESSION_COOKIE_NAME = 'sth_admin_session';

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest();
}

function validateCredentialsFormat(username, password) {
  const errors = [];
  const u = String(username || '').trim();
  const p = String(password || '');
  if (!/^[a-zA-Z0-9._-]{3,32}$/.test(u)) {
    errors.push('Tên đăng nhập cần dài 3–32 ký tự (chỉ gồm chữ, số, ., _, -).');
  }
  if (p.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự.');
  }
  return errors;
}

function hashPassword(password, saltHex) {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { algorithm: 'scrypt', salt, hash };
}

function verifyPassword(password, record) {
  if (!record || !record.salt || !record.hash) return false;
  const derived = crypto.scryptSync(String(password || ''), String(record.salt), 64);
  const expected = Buffer.from(String(record.hash), 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function verifyCredentials(username, password, record) {
  if (!record || !record.username) return false;
  const userMatch = crypto.timingSafeEqual(sha256(String(username || '').trim()), sha256(record.username));
  const passMatch = verifyPassword(password, record);
  return userMatch && passMatch;
}

function loadAuthConfig(authFilePath = process.env.ADMIN_AUTH_FILE || DEFAULT_AUTH_FILE) {
  const envUser = String(process.env.ADMIN_USER || '').trim();
  const envPass = String(process.env.ADMIN_PASS || '');
  if (envUser && envPass) {
    const errors = validateCredentialsFormat(envUser, envPass);
    if (errors.length > 0) {
      throw new Error(`ADMIN_USER/ADMIN_PASS không hợp lệ: ${errors.join(' ')}`);
    }
    const hashed = hashPassword(envPass);
    return {
      source: 'env',
      username: envUser,
      ...hashed,
    };
  }

  if (!fs.existsSync(authFilePath)) return null;
  const raw = JSON.parse(fs.readFileSync(authFilePath, 'utf8'));
  if (!raw || !raw.username || !raw.salt || !raw.hash) {
    throw new Error(`File cấu hình xác thực không hợp lệ: ${authFilePath}`);
  }
  return { source: 'file', path: authFilePath, ...raw };
}

function saveAuthConfig(username, password, authFilePath = process.env.ADMIN_AUTH_FILE || DEFAULT_AUTH_FILE) {
  const u = String(username || '').trim();
  const errors = validateCredentialsFormat(u, password);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
  const hashed = hashPassword(password);
  const payload = {
    username: u,
    ...hashed,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(authFilePath, JSON.stringify(payload, null, 2) + '\n', { encoding: 'utf8', mode: 0o600 });
  return payload;
}

function parseCookies(headerValue) {
  const out = {};
  if (!headerValue) return out;
  for (const part of String(headerValue).split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(val);
    } catch {
      out[key] = val;
    }
  }
  return out;
}

function createSessionManager({ ttlMs = 12 * 60 * 60 * 1000 } = {}) {
  const sessions = new Map();

  function create(username) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    sessions.set(token, { username, createdAt: now, expiresAt: now + ttlMs });
    return { token, maxAgeSec: Math.floor(ttlMs / 1000) };
  }

  function get(token) {
    if (!token) return null;
    const entry = sessions.get(token);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      sessions.delete(token);
      return null;
    }
    return entry;
  }

  function destroy(token) {
    if (token) sessions.delete(token);
  }

  return { create, get, destroy };
}

function createRateLimiter({ maxAttempts = 5, windowMs = 10 * 60 * 1000, lockMs = 5 * 60 * 1000 } = {}) {
  const buckets = new Map();

  function check(key) {
    const now = Date.now();
    const entry = buckets.get(key);
    if (!entry) return { allowed: true, retryAfterSec: 0 };
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    if (now - entry.firstAttemptAt > windowMs) {
      buckets.delete(key);
      return { allowed: true, retryAfterSec: 0 };
    }
    return { allowed: true, retryAfterSec: 0 };
  }

  function recordFailure(key) {
    const now = Date.now();
    const entry = buckets.get(key);
    if (!entry || now - entry.firstAttemptAt > windowMs || (entry.lockedUntil && now >= entry.lockedUntil)) {
      buckets.set(key, { count: 1, firstAttemptAt: now, lockedUntil: 0 });
      return { locked: false, attemptsLeft: maxAttempts - 1 };
    }
    entry.count += 1;
    if (entry.count >= maxAttempts) {
      entry.lockedUntil = now + lockMs;
      return { locked: true, retryAfterSec: Math.ceil(lockMs / 1000), attemptsLeft: 0 };
    }
    return { locked: false, attemptsLeft: maxAttempts - entry.count };
  }

  function reset(key) {
    buckets.delete(key);
  }

  return { check, recordFailure, reset };
}

function isLoopbackHost(hostHeader) {
  if (!hostHeader) return false;
  const host = String(hostHeader).toLowerCase();
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host);
}

function isSameOrigin(request) {
  const host = request.headers.host;
  if (!isLoopbackHost(host)) return false;
  const origin = request.headers.origin;
  if (origin) {
    try {
      return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
    } catch {
      return false;
    }
  }
  const referer = request.headers.referer;
  if (referer) {
    try {
      return new URL(referer).host.toLowerCase() === String(host).toLowerCase();
    } catch {
      return false;
    }
  }
  return false;
}

module.exports = {
  DEFAULT_AUTH_FILE,
  SESSION_COOKIE_NAME,
  validateCredentialsFormat,
  hashPassword,
  verifyPassword,
  verifyCredentials,
  loadAuthConfig,
  saveAuthConfig,
  parseCookies,
  createSessionManager,
  createRateLimiter,
  isLoopbackHost,
  isSameOrigin,
};

