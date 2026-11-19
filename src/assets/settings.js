/**
 * settings.js — Cài đặt hỗ trợ đọc (Reader Accessibility Settings):
 *   - Màu nền & Chủ đề: Sáng (Giấy ấm), Tối, Sepia (Vàng sách báo), Tự động (OS)
 *   - Cỡ chữ: 90% (Nhỏ), 100% (Chuẩn), 115% (Lớn), 130% (Rất lớn)
 *   - Độ tương phản chữ: Chuẩn (Dịu mắt), Tương phản cao (Đen sâu)
 *   - Kiểu phông: Inter (Hiện đại), Be Vietnam Pro (Dịu mắt), Merriweather (Sách báo), Lora (Văn học)
 *   - Chế độ tập trung (Focus Mode): Ẩn xao nhãng, căn giữa dòng đọc 720px tối ưu
 *   - Giao diện mặc định: Thư viện (library), Tra cứu nhanh (guide)
 */
(function (global) {
  'use strict';

  const SETTINGS_KEY = 'sth-reader-settings';
  const DEFAULT_SETTINGS = {
    theme: 'auto',          // 'light' | 'dark' | 'sepia' | 'auto'
    fontSize: '100',        // '90' | '100' | '115' | '130'
    contrast: 'normal',     // 'normal' | 'high'
    fontFamily: 'sans',     // 'sans' | 'vietnam' | 'serif' | 'lora'
    focusMode: false,       // boolean
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

  // Quản lý thanh điều khiển nổi khi ở Chế độ tập trung (Focus Dock)
  let dockScrollTimer = 0;
  function ensureFocusDock(show) {
    let dock = document.getElementById('sth-focus-dock');
    if (!show) {
      if (dock) dock.remove();
      return;
    }
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => ensureFocusDock(true), { once: true });
      return;
    }
    if (!dock) {
      dock = document.createElement('div');
      dock.id = 'sth-focus-dock';
      dock.className = 'sth-focus-dock';
      dock.setAttribute('role', 'toolbar');
      dock.setAttribute('aria-label', 'Điều khiển chế độ tập trung');
      dock.innerHTML = `
        <span class="sth-focus-dock-badge">🎯 Tập trung</span>
        <div class="sth-focus-dock-actions">
          <button type="button" data-f-theme="light" title="Nền sáng">☀️</button>
          <button type="button" data-f-theme="dark" title="Nền tối">🌙</button>
          <button type="button" data-f-theme="sepia" title="Nền sepia">📖</button>
          <span class="sth-focus-dock-sep"></span>
          <button type="button" data-f-size="down" title="Giảm cỡ chữ">A-</button>
          <button type="button" data-f-size="up" title="Tăng cỡ chữ">A+</button>
          <span class="sth-focus-dock-sep"></span>
          <button type="button" data-f-exit class="sth-focus-dock-exit" title="Thoát chế độ tập trung (phím Esc)">✕ Thoát</button>
        </div>
      `;
      document.body.appendChild(dock);

      // Xử lý sự kiện trên Dock
      dock.querySelector('[data-f-exit]')?.addEventListener('click', () => {
        toggleFocus(false);
      });

      dock.querySelectorAll('[data-f-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = readSettings();
          s.theme = btn.dataset.fTheme;
          writeSettings(s);
          applySettings(s);
        });
      });

      const fontSizes = ['90', '100', '115', '130'];
      dock.querySelector('[data-f-size="down"]')?.addEventListener('click', () => {
        const s = readSettings();
        const curIdx = fontSizes.indexOf(s.fontSize || '100');
        if (curIdx > 0) {
          s.fontSize = fontSizes[curIdx - 1];
          writeSettings(s);
          applySettings(s);
        }
      });

      dock.querySelector('[data-f-size="up"]')?.addEventListener('click', () => {
        const s = readSettings();
        const curIdx = fontSizes.indexOf(s.fontSize || '100');
        if (curIdx !== -1 && curIdx < fontSizes.length - 1) {
          s.fontSize = fontSizes[curIdx + 1];
          writeSettings(s);
          applySettings(s);
        }
      });

      // Tự động mờ nhẹ khi cuộn để không che chữ
      window.addEventListener('scroll', () => {
        if (!document.documentElement.classList.contains('sth-focus-mode')) return;
        dock.classList.add('dimmed');
        clearTimeout(dockScrollTimer);
        dockScrollTimer = setTimeout(() => {
          dock.classList.remove('dimmed');
        }, 900);
      }, { passive: true });
    }
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

    // 4. Phông chữ (100% tiếng Việt không lỗi)
    root.setAttribute('data-font', s.fontFamily || 'sans');

    // 5. Chế độ tập trung (Focus Mode)
    const isFocus = Boolean(s.focusMode);
    root.classList.toggle('sth-focus-mode', isFocus);
    ensureFocusDock(isFocus);

    // Đồng bộ nút Focus ngoài trang nếu có
    document.querySelectorAll('[data-toggle-focus], #ap-focus-btn, #dm-focus-btn').forEach(btn => {
      btn.setAttribute('aria-pressed', String(isFocus));
      btn.classList.toggle('active', isFocus);
      btn.textContent = isFocus ? '✓ Đang tập trung' : '🎯 Chế độ tập trung';
    });

    document.dispatchEvent(new CustomEvent('sth:settings-changed', { detail: s }));
  }

  function toggleFocus(forceState) {
    const s = readSettings();
    s.focusMode = typeof forceState === 'boolean' ? forceState : !s.focusMode;
    writeSettings(s);
    applySettings(s);
    const modal = document.getElementById('sth-modal-overlay');
    if (modal && !modal.hidden) syncModal(modal, s);
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

            <!-- 3. Kiểu phông chữ (Không lỗi tiếng Việt) -->
            <div class="sth-setting-block">
              <span class="sth-setting-label">Kiểu phông chữ (Chuẩn tiếng Việt)</span>
              <div class="sth-segmented sth-segmented-wrap" id="sth-font-options">
                <button type="button" data-val="sans" class="sth-font-opt-sans">Inter <small>(Hiện đại)</small></button>
                <button type="button" data-val="vietnam" class="sth-font-opt-vietnam">Be Vietnam Pro <small>(Dịu mắt)</small></button>
                <button type="button" data-val="serif" class="sth-font-opt-serif">Merriweather <small>(Sách báo)</small></button>
                <button type="button" data-val="lora" class="sth-font-opt-lora">Lora <small>(Văn học)</small></button>
              </div>
            </div>

            <!-- 4. Độ tương phản & Chế độ tập trung -->
            <div class="sth-setting-grid">
              <div class="sth-setting-block">
                <span class="sth-setting-label">Độ tương phản chữ</span>
                <div class="sth-segmented" id="sth-contrast-options">
                  <button type="button" data-val="normal">Dịu mắt</button>
                  <button type="button" data-val="high">Tương phản cao</button>
                </div>
              </div>

              <div class="sth-setting-block">
                <span class="sth-setting-label">Chế độ tập trung <small style="font-weight:400;color:var(--sth-muted)">(Alt+F)</small></span>
                <div class="sth-segmented" id="sth-focus-options">
                  <button type="button" data-val="false">Tắt</button>
                  <button type="button" data-val="true">🎯 Bật tập trung</button>
                </div>
              </div>
            </div>

            <!-- 5. Giao diện trang chủ mặc định -->
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
    modal.querySelectorAll('#sth-focus-options button').forEach(b => {
      b.classList.toggle('active', b.dataset.val === String(Boolean(s.focusMode)));
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

    // Focus mode buttons
    modal.querySelectorAll('#sth-focus-options button').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = readSettings();
        s.focusMode = btn.dataset.val === 'true';
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

  // Phím tắt bàn phím: Alt + S (Cài đặt), Alt + F (Chế độ tập trung), hoặc Esc
  window.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      const modal = document.getElementById('sth-modal-overlay');
      if (modal && !modal.hidden) {
        closeModal();
      } else {
        const s = readSettings();
        if (s.focusMode) {
          toggleFocus(false);
        }
      }
    } else if (ev.altKey && (ev.key === 's' || ev.key === 'S')) {
      ev.preventDefault();
      const modal = document.getElementById('sth-modal-overlay');
      if (modal && !modal.hidden) closeModal();
      else openModal();
    } else if (ev.altKey && (ev.key === 'f' || ev.key === 'F')) {
      ev.preventDefault();
      toggleFocus();
    }
  });

  // Tự động gắn sự kiện cho mọi nút có [data-open-settings] và [data-toggle-focus]
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-open-settings]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        openModal();
      });
    });

    document.querySelectorAll('[data-toggle-focus]').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        toggleFocus();
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
    toggleFocus: toggleFocus,
    setFocus: (flag) => toggleFocus(Boolean(flag)),
    isFocus: () => Boolean(readSettings().focusMode),
  };

})(typeof window !== 'undefined' ? window : this);
