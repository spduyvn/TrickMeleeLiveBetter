/**
 * settings.js — Cài đặt hỗ trợ đọc (Reader Accessibility Settings):
 *   - Màu nền & Chủ đề: Sáng (Giấy ấm), Tối, Sepia (Vàng sách báo), Tự động (OS)
 *   - Cỡ chữ: 90% (Nhỏ), 100% (Chuẩn), 115% (Lớn), 130% (Rất lớn)
 *   - Độ tương phản chữ: Chuẩn (Dịu mắt), Tương phản cao (Đen sâu)
 *   - Kiểu phông: Không chân (Inter), Có chân (Merriweather)
 *   - Giao diện mặc định: Thư viện (library), Tra cứu nhanh (guide)
 */
(function (global) {
  'use strict';

  const SETTINGS_KEY = 'sth-reader-settings';
  const DEFAULT_SETTINGS = {
    theme: 'auto',          // 'light' | 'dark' | 'sepia' | 'auto'
    fontSize: '100',        // '90' | '100' | '115' | '130'
    contrast: 'normal',     // 'normal' | 'high'
    fontFamily: 'sans',     // 'sans' | 'serif'
    defaultView: 'library', // 'library' | 'guide'
  };

  function readSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        // Hỗ trợ cấu hình cũ
        const oldMode = localStorage.getItem('sth-ui-mode');
        return {
          ...DEFAULT_SETTINGS,
          defaultView: oldMode === 'guide' ? 'guide' : 'library',
        };
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function writeSettings(s) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      localStorage.setItem('sth-ui-mode', s.defaultView);
    } catch (_) {}
  }

  function applySettings(s) {
    const root = document.documentElement;

    // 1. Theme
    let effectiveTheme = s.theme;
    if (effectiveTheme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = prefersDark ? 'dark' : 'light';
    }

    root.classList.toggle('dark', effectiveTheme === 'dark');
    root.classList.toggle('sepia', effectiveTheme === 'sepia');

    // 2. Cỡ chữ
    root.setAttribute('data-font-size', s.fontSize || '100');

    // 3. Tương phản
    root.classList.toggle('contrast-high', s.contrast === 'high');

    // 4. Phông chữ
    root.setAttribute('data-font', s.fontFamily || 'sans');
  }

  // Khởi động tức thời để tránh giật giao diện (FOUC)
  const initialSettings = readSettings();
  applySettings(initialSettings);

  // Theo dõi đổi theme hệ thống khi chọn 'auto'
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const s = readSettings();
      if (s.theme === 'auto') applySettings(s);
    });
  }

  // HTML Popup Modal
  function createModalHtml() {
    return `
      <div class="sth-modal-overlay" id="sth-modal-overlay" hidden role="dialog" aria-modal="true" aria-labelledby="sth-modal-h">
        <div class="sth-modal-card">
          <header class="sth-modal-top">
            <h2 id="sth-modal-h">Tùy chỉnh hiển thị &amp; Trải nghiệm đọc</h2>
            <button type="button" class="sth-modal-x" id="sth-modal-x" aria-label="Đóng cửa sổ">×</button>
          </header>

          <div class="sth-modal-content">
            <!-- 1. Theme -->
            <div class="sth-setting-block">
              <span class="sth-setting-label">Màu nền &amp; Chủ đề</span>
              <div class="sth-segmented" id="sth-theme-options">
                <button type="button" data-val="light">☀️ Sáng</button>
                <button type="button" data-val="dark">🌙 Tối</button>
                <button type="button" data-val="sepia">📖 Vàng ấm (Sepia)</button>
                <button type="button" data-val="auto">💻 Tự động</button>
              </div>
            </div>

            <!-- 2. Cỡ chữ -->
            <div class="sth-setting-block">
              <span class="sth-setting-label">Cỡ chữ hiển thị</span>
              <div class="sth-segmented" id="sth-size-options">
                <button type="button" data-val="90">90% <small>(Nhỏ)</small></button>
                <button type="button" data-val="100">100% <small>(Chuẩn)</small></button>
                <button type="button" data-val="115">115% <small>(Lớn)</small></button>
                <button type="button" data-val="130">130% <small>(Rất lớn)</small></button>
              </div>
            </div>

            <!-- 3. Độ tương phản & Phông chữ -->
            <div class="sth-setting-grid">
              <div class="sth-setting-block">
                <span class="sth-setting-label">Độ tương phản chữ</span>
                <div class="sth-segmented" id="sth-contrast-options">
                  <button type="button" data-val="normal">Dịu mắt</button>
                  <button type="button" data-val="high">Tương phản cao</button>
                </div>
              </div>

              <div class="sth-setting-block">
                <span class="sth-setting-label">Kiểu phông chữ</span>
                <div class="sth-segmented" id="sth-font-options">
                  <button type="button" data-val="sans">Không chân (Inter)</button>
                  <button type="button" data-val="serif">Có chân (Sách báo)</button>
                </div>
              </div>
            </div>

            <!-- 4. Giao diện trang chủ mặc định -->
            <div class="sth-setting-block">
              <span class="sth-setting-label">Giao diện khi mở trang chủ</span>
              <div class="sth-radio-group">
                <label class="sth-radio-label">
                  <input type="radio" name="sth-default-view" value="library">
                  <span><strong>Thư viện bài viết</strong> (Khám phá theo danh mục tạp chí)</span>
                </label>
                <label class="sth-radio-label">
                  <input type="radio" name="sth-default-view" value="guide">
                  <span><strong>Tra cứu nhanh</strong> (Bảng lọc đa chiều, xem nhanh checklist)</span>
                </label>
              </div>
            </div>
          </div>

          <footer class="sth-modal-bot">
            <button type="button" class="sth-btn-reset" id="sth-btn-reset">Đặt lại mặc định</button>
            <button type="button" class="sth-btn-done" id="sth-btn-done">Hoàn tất</button>
          </footer>
        </div>
      </div>
    `;
  }

  function syncModal(modal, s) {
    modal.querySelectorAll('#sth-theme-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === s.theme);
    });
    modal.querySelectorAll('#sth-size-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === s.fontSize);
    });
    modal.querySelectorAll('#sth-contrast-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === s.contrast);
    });
    modal.querySelectorAll('#sth-font-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === s.fontFamily);
    });
    const radio = modal.querySelector(`input[name="sth-default-view"][value="${s.defaultView}"]`);
    if (radio) radio.checked = true;
  }

  function openModal() {
    let modal = document.getElementById('sth-modal-overlay');
    if (!modal) {
      document.body.insertAdjacentHTML('beforeend', createModalHtml());
      modal = document.getElementById('sth-modal-overlay');
      wireModalEvents(modal);
    }
    const s = readSettings();
    syncModal(modal, s);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('sth-modal-overlay');
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  function wireModalEvents(modal) {
    modal.querySelector('#sth-modal-x')?.addEventListener('click', closeModal);
    modal.querySelector('#sth-btn-done')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (ev) => {
      if (ev.target.id === 'sth-modal-overlay') closeModal();
    });

    // Theme buttons
    modal.querySelectorAll('#sth-theme-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.theme = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModal(modal, s);
      });
    });

    // Font size buttons
    modal.querySelectorAll('#sth-size-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.fontSize = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModal(modal, s);
      });
    });

    // Contrast buttons
    modal.querySelectorAll('#sth-contrast-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.contrast = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModal(modal, s);
      });
    });

    // Font family buttons
    modal.querySelectorAll('#sth-font-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.fontFamily = btn.dataset.val;
        writeSettings(s);
        applySettings(s);
        syncModal(modal, s);
      });
    });

    // Default view radio
    modal.querySelectorAll('input[name="sth-default-view"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const s = readSettings();
        s.defaultView = radio.value;
        writeSettings(s);
        syncModal(modal, s);
      });
    });

    // Reset button
    modal.querySelector('#sth-btn-reset')?.addEventListener('click', () => {
      writeSettings(DEFAULT_SETTINGS);
      applySettings(DEFAULT_SETTINGS);
      syncModal(modal, DEFAULT_SETTINGS);
    });
  }

  // Phím tắt bàn phím: Alt + S hoặc Esc
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeModal();
    } else if (ev.altKey && (ev.key === 's' || ev.key === 'S')) {
      ev.preventDefault();
      const modal = document.getElementById('sth-modal-overlay');
      if (modal && !modal.hidden) closeModal();
      else openModal();
    }
  });

  // Tự động gắn sự kiện cho mọi nút có [data-open-settings]
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-open-settings]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        openModal();
      });
    });
  });

  // Export API
  global.SthSettings = {
    read: readSettings,
    write: writeSettings,
    apply: applySettings,
    open: openModal,
    close: closeModal,
  };

})(typeof window !== 'undefined' ? window : this);
