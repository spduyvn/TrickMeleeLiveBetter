/**
 * settings.js — Quản lý cấu hình giao diện & Popup Modal Cài đặt toàn hệ thống:
 *   - Quản lý chế độ giao diện mặc định (library, guide, reader, compact)
 *   - Quản lý Theme (light, dark, auto)
 *   - Quản lý cỡ chữ (90%, 100%, 115%, 130%)
 *   - Quản lý phông chữ (sans-serif, serif)
 *   - Quản lý màu nhấn (emerald, ocean, amber)
 *   - Sao lưu / Khôi phục dữ liệu cá nhân (JSON)
 */
(function (global) {
  'use strict';

  const SETTINGS_KEY = 'sth-settings';
  const DEFAULT_SETTINGS = {
    defaultView: 'library', // 'library' | 'guide' | 'reader' | 'compact'
    autoRedirect: false,
    theme: 'auto',          // 'light' | 'dark' | 'auto'
    fontSize: '100',        // '90' | '100' | '115' | '130'
    fontFamily: 'sans',     // 'sans' | 'serif'
    accent: 'emerald',      // 'emerald' | 'ocean' | 'amber'
  };

  function readSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        // Hỗ trợ migrate từ cấu hình cũ sth-ui-mode
        const oldMode = localStorage.getItem('sth-ui-mode');
        if (oldMode === 'guide') {
          return { ...DEFAULT_SETTINGS, defaultView: 'guide', autoRedirect: true };
        }
        return { ...DEFAULT_SETTINGS };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function writeSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      if (settings.autoRedirect && settings.defaultView) {
        localStorage.setItem('sth-ui-mode', settings.defaultView);
      } else {
        localStorage.removeItem('sth-ui-mode');
      }
    } catch (_) {}
  }

  function applySettings(settings) {
    const root = document.documentElement;

    // 1. Theme
    let isDark = false;
    if (settings.theme === 'dark') isDark = true;
    else if (settings.theme === 'light') isDark = false;
    else isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', isDark);

    // 2. Font size
    root.setAttribute('data-sth-font-size', settings.fontSize || '100');

    // 3. Font family
    root.setAttribute('data-sth-font', settings.fontFamily || 'sans');

    // 4. Accent
    root.setAttribute('data-sth-accent', settings.accent || 'emerald');
  }

  // Khởi tạo ngay lập tức để tránh FOUC (chớp giao diện)
  const currentSettings = readSettings();
  applySettings(currentSettings);

  // Lắng nghe đổi theme OS
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const s = readSettings();
      if (s.theme === 'auto') applySettings(s);
    });
  }

  // Helper tìm BASE_PATH từ manifest hoặc link
  function getBasePath() {
    if (global.__STH_BASE_PATH__) return global.__STH_BASE_PATH__;
    const link = document.querySelector('link[rel="manifest"]');
    if (link && link.getAttribute('href')) {
      const href = link.getAttribute('href');
      const idx = href.indexOf('/manifest.webmanifest');
      if (idx !== -1) return href.slice(0, idx);
    }
    return '';
  }

  // Tạo Popup Modal
  function createModalHtml() {
    const basePath = getBasePath();
    return `
      <div class="sth-settings-modal" id="sth-settings-modal" hidden role="dialog" aria-modal="true" aria-labelledby="sth-modal-title">
        <div class="sth-modal-backdrop" id="sth-modal-backdrop"></div>
        <div class="sth-modal-content">
          <header class="sth-modal-header">
            <div class="sth-modal-title-wrap">
              <span class="sth-modal-icon" aria-hidden="true">⚙️</span>
              <h2 id="sth-modal-title">Cài đặt giao diện &amp; Trải nghiệm</h2>
            </div>
            <button type="button" class="sth-modal-close" id="sth-modal-close" aria-label="Đóng cửa sổ">×</button>
          </header>

          <div class="sth-modal-body">
            <!-- Section 1: Giao diện mặc định -->
            <section class="sth-setting-section">
              <h3>Chế độ giao diện</h3>
              <p class="sth-setting-desc">Chọn phong cách hiển thị phù hợp với nhu cầu đọc của bạn:</p>
              
              <div class="sth-ui-cards" id="sth-ui-cards">
                <label class="sth-ui-card">
                  <input type="radio" name="sth-view" value="library">
                  <div class="sth-ui-card-in">
                    <span class="sth-ui-badge">Thư viện</span>
                    <strong>Dạng cổng thông tin</strong>
                    <span>Bản đồ chủ đề, thẻ card trực quan, duyệt khám phá tổng thể.</span>
                    <a href="${basePath}/?view=library" class="sth-quick-link">Mở ngay →</a>
                  </div>
                </label>

                <label class="sth-ui-card">
                  <input type="radio" name="sth-view" value="guide">
                  <div class="sth-ui-card-in">
                    <span class="sth-ui-badge">Tra cứu</span>
                    <strong>Bảng điều khiển đa chiều</strong>
                    <span>Lọc chi phí, thời gian, bằng chứng, checklist thực hành.</span>
                    <a href="${basePath}/guide/" class="sth-quick-link">Mở ngay →</a>
                  </div>
                </label>

                <label class="sth-ui-card">
                  <input type="radio" name="sth-view" value="reader">
                  <div class="sth-ui-card-in">
                    <span class="sth-ui-badge">Đọc sâu</span>
                    <strong>Tối giản (Reader Mode)</strong>
                    <span>Bố cục 1 cột tối giản, thanh tiến trình đọc, loại bỏ phân tâm.</span>
                    <a href="${basePath}/reader/" class="sth-quick-link">Mở ngay →</a>
                  </div>
                </label>

                <label class="sth-ui-card">
                  <input type="radio" name="sth-view" value="compact">
                  <div class="sth-ui-card-in">
                    <span class="sth-ui-badge">Bảng nén / Thẻ</span>
                    <strong>Dữ liệu nén &amp; Flashcard</strong>
                    <span>Duyệt 100+ bài dạng bảng hoặc lật thẻ ghi nhớ hành động.</span>
                    <a href="${basePath}/compact/" class="sth-quick-link">Mở ngay →</a>
                  </div>
                </label>
              </div>

              <label class="sth-checkbox-row">
                <input type="checkbox" id="sth-auto-redirect">
                <span>Tự động chuyển vào giao diện đã chọn khi truy cập trang chủ</span>
              </label>
            </section>

            <!-- Section 2: Màu sắc & Theme -->
            <section class="sth-setting-section">
              <h3>Chế độ màu &amp; Giao diện</h3>
              <div class="sth-option-grid">
                <div>
                  <label class="sth-field-label">Chế độ màu</label>
                  <div class="sth-seg-control" id="sth-theme-seg">
                    <button type="button" data-val="light">☀️ Sáng</button>
                    <button type="button" data-val="dark">🌙 Tối</button>
                    <button type="button" data-val="auto">💻 Tự động</button>
                  </div>
                </div>

                <div>
                  <label class="sth-field-label">Tông màu nhấn</label>
                  <div class="sth-color-row" id="sth-accent-row">
                    <button type="button" class="sth-color-btn sth-c-emerald" data-accent="emerald" title="Xanh ngọc lục bảo (Mặc định)"></button>
                    <button type="button" class="sth-color-btn sth-c-ocean" data-accent="ocean" title="Xanh đại dương"></button>
                    <button type="button" class="sth-color-btn sth-c-amber" data-accent="amber" title="Cam đất ấm"></button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 3: Typography -->
            <section class="sth-setting-section">
              <h3>Trải nghiệm đọc (Typography)</h3>
              <div class="sth-option-grid">
                <div>
                  <label class="sth-field-label">Cỡ chữ</label>
                  <div class="sth-seg-control" id="sth-font-size-seg">
                    <button type="button" data-val="90">90%</button>
                    <button type="button" data-val="100">100%</button>
                    <button type="button" data-val="115">115%</button>
                    <button type="button" data-val="130">130%</button>
                  </div>
                </div>

                <div>
                  <label class="sth-field-label">Kiểu phông chữ</label>
                  <div class="sth-seg-control" id="sth-font-family-seg">
                    <button type="button" data-val="sans">Không chân (Inter)</button>
                    <button type="button" data-val="serif">Có chân (Serif)</button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Section 4: Dữ liệu cá nhân -->
            <section class="sth-setting-section">
              <h3>Dữ liệu cá nhân</h3>
              <div class="sth-data-box">
                <div class="sth-data-stats">
                  <span>★ Bài đã lưu: <strong id="sth-stat-saved">0</strong></span>
                  <span>✔ Đã áp dụng: <strong id="sth-stat-done">0</strong></span>
                </div>
                <div class="sth-data-actions">
                  <button type="button" class="sth-btn-outline" id="sth-export-data">Sao lưu (JSON)</button>
                  <label class="sth-btn-outline sth-btn-upload">
                    Khôi phục (JSON)
                    <input type="file" id="sth-import-data" accept=".json" hidden>
                  </label>
                  <button type="button" class="sth-btn-text-danger" id="sth-reset-data">Đặt lại cài đặt</button>
                </div>
              </div>
            </section>
          </div>

          <footer class="sth-modal-footer">
            <span class="sth-modal-hint"><kbd>Esc</kbd> để đóng · Phím tắt mở nhanh: <kbd>Alt</kbd> + <kbd>S</kbd></span>
            <button type="button" class="sth-btn-primary" id="sth-modal-save">Hoàn tất</button>
          </footer>
        </div>
      </div>
    `;
  }

  function syncModalUI(modal, settings) {
    // 1. Radio view
    const radio = modal.querySelector(`input[name="sth-view"][value="${settings.defaultView}"]`);
    if (radio) radio.checked = true;

    // 2. Checkbox redirect
    const chk = modal.querySelector('#sth-auto-redirect');
    if (chk) chk.checked = !!settings.autoRedirect;

    // 3. Theme
    modal.querySelectorAll('#sth-theme-seg button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === settings.theme);
    });

    // 4. Accent
    modal.querySelectorAll('#sth-accent-row button').forEach(b => {
      b.classList.toggle('active', b.dataset.accent === settings.accent);
    });

    // 5. Font size
    modal.querySelectorAll('#sth-font-size-seg button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === settings.fontSize);
    });

    // 6. Font family
    modal.querySelectorAll('#sth-font-family-seg button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === settings.fontFamily);
    });

    // Stats
    try {
      const saved = JSON.parse(localStorage.getItem('sth-saved-ids') || '[]');
      const done = JSON.parse(localStorage.getItem('sth-done-ids') || '[]');
      const elSaved = modal.querySelector('#sth-stat-saved');
      const elDone = modal.querySelector('#sth-stat-done');
      if (elSaved) elSaved.textContent = String(saved.length || 0);
      if (elDone) elDone.textContent = String(done.length || 0);
    } catch (_) {}
  }

  function openSettingsModal() {
    let modal = document.getElementById('sth-settings-modal');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', createModalHtml());
      modal = document.getElementById('sth-settings-modal');
      wireModalEvents(modal);
    }
    const settings = readSettings();
    syncModalUI(modal, settings);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeSettingsModal() {
    const modal = document.getElementById('sth-settings-modal');
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  function wireModalEvents(modal) {
    // Close events
    modal.querySelector('#sth-modal-close')?.addEventListener('click', closeSettingsModal);
    modal.querySelector('#sth-modal-backdrop')?.addEventListener('click', closeSettingsModal);
    modal.querySelector('#sth-modal-save')?.addEventListener('click', closeSettingsModal);

    // View radio
    modal.querySelectorAll('input[name="sth-view"]').forEach(input => {
      input.addEventListener('change', () => {
        const s = readSettings();
        s.defaultView = input.value;
        writeSettings(s);
        applySettings(s);
      });
    });

    // Auto redirect
    modal.querySelector('#sth-auto-redirect')?.addEventListener('change', (ev) => {
      const s = readSettings();
      s.autoRedirect = ev.target.checked;
      writeSettings(s);
      applySettings(s);
    });

    // Theme seg
    modal.querySelectorAll('#sth-theme-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.theme = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModalUI(modal, s);
      });
    });

    // Accent
    modal.querySelectorAll('#sth-accent-row button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.accent = btn.dataset.accent;
        writeSettings(s);
        applySettings(s);
        syncModalUI(modal, s);
      });
    });

    // Font size
    modal.querySelectorAll('#sth-font-size-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.fontSize = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModalUI(modal, s);
      });
    });

    // Font family
    modal.querySelectorAll('#sth-font-family-seg button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.fontFamily = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModalUI(modal, s);
      });
    });

    // Export Data
    modal.querySelector('#sth-export-data')?.addEventListener('click', () => {
      try {
        const payload = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          settings: readSettings(),
          savedIds: JSON.parse(localStorage.getItem('sth-saved-ids') || '[]'),
          doneIds: JSON.parse(localStorage.getItem('sth-done-ids') || '[]'),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `song-tot-hon-data-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (err) {
        alert('Lỗi xuất dữ liệu: ' + err.message);
      }
    });

    // Import Data
    modal.querySelector('#sth-import-data')?.addEventListener('change', async (ev) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.settings) writeSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        if (Array.isArray(data.savedIds)) localStorage.setItem('sth-saved-ids', JSON.stringify(data.savedIds));
        if (Array.isArray(data.doneIds)) localStorage.setItem('sth-done-ids', JSON.stringify(data.doneIds));
        applySettings(readSettings());
        syncModalUI(modal, readSettings());
        alert('Khôi phục dữ liệu thành công!');
      } catch (err) {
        alert('File không hợp lệ: ' + err.message);
      }
    });

    // Reset Data
    modal.querySelector('#sth-reset-data')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt giao diện về mặc định?')) {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem('sth-ui-mode');
        applySettings(DEFAULT_SETTINGS);
        syncModalUI(modal, DEFAULT_SETTINGS);
      }
    });
  }

  // Keyboard shortcut: Alt + S hoặc Escape để đóng
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeSettingsModal();
    } else if (ev.altKey && (ev.key === 's' || ev.key === 'S')) {
      ev.preventDefault();
      const modal = document.getElementById('sth-settings-modal');
      if (modal && !modal.hidden) closeSettingsModal();
      else openSettingsModal();
    }
  });

  // Tự động gắn sự kiện cho các nút mở Settings có attribute data-open-settings
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-open-settings]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        openSettingsModal();
      });
    });
  });

  // Export API ra global
  global.SthSettings = {
    read: readSettings,
    write: writeSettings,
    apply: applySettings,
    open: openSettingsModal,
    close: closeSettingsModal,
  };

})(typeof window !== 'undefined' ? window : this);

