/**
 * tts-reader.js — Trình phát giọng đọc bài viết tiếng Việt (Native Web Speech)
 * Tự động tìm kiếm và ưu tiên giọng đọc Tiếng Việt chuẩn (Edge Natural, Chrome, iOS Linh, Android Google Tiếng Việt),
 * phân đoạn câu mạch lạc, cuộn trang theo dõi và xử lý giao diện trực quan.
 */
(function (global) {
  'use strict';

  const RATE_KEY = 'sth-audio-rate';
  const RATES = [1.0, 1.25, 1.5, 0.85];

  function getSavedRate() {
    try {
      const v = parseFloat(localStorage.getItem(RATE_KEY));
      return RATES.includes(v) ? v : 1.0;
    } catch {
      return 1.0;
    }
  }

  function saveRate(rate) {
    try {
      localStorage.setItem(RATE_KEY, String(rate));
    } catch {}
  }

  function cleanSpeechText(text) {
    return String(text || '')
      .replace(/https?:\/\/[^\s]+/g, '') // Bỏ URL
      .replace(/[#*_~`>]/g, ' ')          // Bỏ ký tự markdown
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Tách văn bản thành các câu/vế ngắn (tối đa 110 ký tự) để giọng đọc tự nhiên
  function splitIntoChunks(text, maxLen = 110) {
    const clean = cleanSpeechText(text);
    if (!clean) return [];
    const matches = clean.match(/[^.!?;\n]+[.!?;\n]*/g) || [clean];
    const chunks = [];
    let current = '';

    for (const raw of matches) {
      const s = raw.trim();
      if (!s) continue;
      if ((current + ' ' + s).trim().length <= maxLen) {
        current = (current ? current + ' ' : '') + s;
      } else {
        if (current) chunks.push(current);
        if (s.length <= maxLen) {
          current = s;
        } else {
          const subParts = s.match(/[^,]+[,]?/g) || [s];
          let subCurrent = '';
          for (const sp of subParts) {
            const sub = sp.trim();
            if (!sub) continue;
            if ((subCurrent + ' ' + sub).trim().length <= maxLen) {
              subCurrent = (subCurrent ? subCurrent + ' ' : '') + sub;
            } else {
              if (subCurrent) chunks.push(subCurrent);
              subCurrent = sub;
            }
          }
          current = subCurrent;
        }
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  class AudioReader {
    constructor() {
      this.hasSpeechSynth = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
      this.state = 'idle'; // 'idle' | 'playing' | 'paused'
      this.chunks = [];
      this.currentIndex = -1;
      this.rate = getSavedRate();
      this.currentArticleId = null;
      this.currentTitle = '';
      this.vietnameseVoice = null;
      this.activeElement = null;
      this.activeTriggerBtn = null;
      this.dockEl = null;

      this.initVoice();
      if (this.hasSpeechSynth && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoice();
          const overlay = document.getElementById('sth-voice-modal-overlay');
          if (overlay && !overlay.hidden) this.updateGuideModalVoiceStatus(overlay);
        };
      }

      // Phím tắt Space để tạm dừng / tiếp tục khi đang nghe
      window.addEventListener('keydown', (ev) => {
        const tag = (ev.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || ev.target?.isContentEditable) return;
        if (this.state === 'idle') return;

        if (ev.code === 'Space' && !ev.altKey && !ev.ctrlKey && !ev.metaKey) {
          ev.preventDefault();
          this.toggle();
        }
      });
    }

    async initVoice() {
      if (!this.hasSpeechSynth) {
        this.vietnameseVoice = null;
        return null;
      }
      try {
        let voices = window.speechSynthesis.getVoices() || [];
        if (voices.length === 0) {
          await new Promise((resolve) => {
            const timer = setTimeout(resolve, 350);
            window.speechSynthesis.onvoiceschanged = () => {
              clearTimeout(timer);
              resolve();
            };
          });
          voices = window.speechSynthesis.getVoices() || [];
        }

        const viVoices = voices.filter((v) => {
          const lang = (v.lang || '').toLowerCase().replace('_', '-');
          const name = (v.name || '').toLowerCase();
          return lang.startsWith('vi') || name.includes('vietnam') || name.includes('tiếng việt');
        });

        if (viVoices.length > 0) {
          // Ưu tiên giọng tự nhiên (Microsoft HoaiMy / NamMinh, Google Tiếng Việt, Apple Linh)
          this.vietnameseVoice =
            viVoices.find((v) => /natural|hoaimy|namminh|google|linh|online/i.test(v.name)) ||
            viVoices[0];
        } else {
          // TUYỆT ĐỐI KHÔNG dùng giọng tiếng Anh để đọc tiếng Việt!
          this.vietnameseVoice = null;
        }
        return this.vietnameseVoice;
      } catch {
        this.vietnameseVoice = null;
        return null;
      }
    }

    getVoiceInfo() {
      const v = this.vietnameseVoice;
      if (!v) {
        return {
          available: false,
          name: '',
          label: 'Chưa phát hiện giọng Tiếng Việt',
          isNatural: false,
        };
      }
      const isNatural = /natural|online|google|apple/i.test(v.name);
      return {
        available: true,
        name: v.name,
        lang: v.lang || 'vi-VN',
        label: `${v.name}${isNatural ? ' (Giọng AI tự nhiên)' : ''}`,
        isNatural,
      };
    }

    ensureDock() {
      if (!document.body) return null;
      let dock = document.getElementById('sth-audio-dock');
      if (!dock) {
        dock = document.createElement('div');
        dock.id = 'sth-audio-dock';
        dock.className = 'sth-audio-dock';
        dock.setAttribute('role', 'region');
        dock.setAttribute('aria-label', 'Trình phát giọng đọc tiếng Việt');
        dock.innerHTML = `
          <div class="sth-audio-track"><div class="sth-audio-bar" id="sth-audio-bar"></div></div>
          <div class="sth-audio-body">
            <div class="sth-audio-info">
              <span class="sth-audio-anim" id="sth-audio-anim">🔊</span>
              <div class="sth-audio-meta">
                <strong class="sth-audio-title" id="sth-audio-title">Đang phát bài viết…</strong>
                <span class="sth-audio-progress" id="sth-audio-progress">Chuẩn bị đọc…</span>
              </div>
            </div>
            <div class="sth-audio-controls">
              <button type="button" class="sth-audio-btn" data-act="prev" title="Đoạn trước (⏮)">⏮</button>
              <button type="button" class="sth-audio-btn sth-audio-play" data-act="toggle" title="Phát / Tạm dừng (Space)">⏸</button>
              <button type="button" class="sth-audio-btn" data-act="next" title="Đoạn kế tiếp (⏭)">⏭</button>
              <button type="button" class="sth-audio-btn sth-audio-rate" data-act="rate" title="Đổi tốc độ đọc">${this.rate}x</button>
              <button type="button" class="sth-audio-btn sth-audio-help" data-act="help" title="Hướng dẫn &amp; Mẹo giọng đọc (❓)">❓</button>
              <button type="button" class="sth-audio-btn" data-act="stop" title="Dừng đọc (⏹)">⏹</button>
              <button type="button" class="sth-audio-btn sth-audio-close" data-act="close" title="Đóng thanh phát">×</button>
            </div>
          </div>
        `;
        document.body.appendChild(dock);

        dock.querySelector('[data-act="prev"]')?.addEventListener('click', () => this.prev());
        dock.querySelector('[data-act="toggle"]')?.addEventListener('click', () => this.toggle());
        dock.querySelector('[data-act="next"]')?.addEventListener('click', () => this.next());
        dock.querySelector('[data-act="rate"]')?.addEventListener('click', () => this.toggleRate());
        dock.querySelector('[data-act="help"]')?.addEventListener('click', () => this.openGuideModal());
        dock.querySelector('[data-act="stop"]')?.addEventListener('click', () => this.stop());
        dock.querySelector('[data-act="close"]')?.addEventListener('click', () => this.stop());
      }
      this.dockEl = dock;
      return dock;
    }

    updateDockUI(customStatus) {
      if (!this.dockEl) return;
      const titleEl = this.dockEl.querySelector('#sth-audio-title');
      const progressEl = this.dockEl.querySelector('#sth-audio-progress');
      const toggleBtn = this.dockEl.querySelector('[data-act="toggle"]');
      const rateBtn = this.dockEl.querySelector('[data-act="rate"]');
      const animEl = this.dockEl.querySelector('#sth-audio-anim');
      const barEl = this.dockEl.querySelector('#sth-audio-bar');

      if (titleEl) titleEl.textContent = this.currentTitle || 'Đang nghe bài viết';
      if (rateBtn) rateBtn.textContent = `${this.rate}x`;

      const total = this.chunks.length;
      const current = Math.max(1, this.currentIndex + 1);
      if (progressEl) {
        if (customStatus) {
          progressEl.textContent = customStatus;
        } else {
          const voiceName = this.vietnameseVoice?.name?.replace(/Microsoft|Google|Apple|Online|\(Natural\)|\(Vietnam\)/gi, '').trim() || 'Tiếng Việt';
          progressEl.textContent = total > 0 ? `Đoạn ${current} / ${total} · ${voiceName}` : 'Chuẩn bị đọc…';
        }
      }

      if (barEl) {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        barEl.style.width = `${pct}%`;
      }

      if (toggleBtn) {
        toggleBtn.textContent = this.state === 'playing' ? '⏸' : '▶';
        toggleBtn.setAttribute('title', this.state === 'playing' ? 'Tạm dừng' : 'Tiếp tục phát');
      }

      if (animEl) {
        animEl.classList.toggle('playing', this.state === 'playing');
      }

      // Cập nhật nút trigger ngoài trang
      if (this.activeTriggerBtn) {
        this.activeTriggerBtn.setAttribute('aria-pressed', String(this.state === 'playing'));
        this.activeTriggerBtn.classList.toggle('active', this.state !== 'idle');
        this.activeTriggerBtn.textContent =
          this.state === 'playing' ? '⏸ Tạm dừng' : this.state === 'paused' ? '▶ Tiếp tục nghe' : '🔊 Nghe đọc bài';
      }
    }

    highlightChunk(chunk) {
      if (this.activeElement) {
        this.activeElement.classList.remove('sth-tts-active');
      }
      if (chunk && chunk.elementRef) {
        this.activeElement = chunk.elementRef;
        this.activeElement.classList.add('sth-tts-active');
        try {
          this.activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch {}
      }
    }

    speakCurrentChunk() {
      if (!this.hasSpeechSynth) {
        this.showNoVoiceNotice();
        return;
      }
      if (this.currentIndex < 0 || this.currentIndex >= this.chunks.length) {
        this.stop();
        return;
      }

      const viVoice = this.vietnameseVoice;
      if (!viVoice) {
        this.showNoVoiceNotice();
        return;
      }

      window.speechSynthesis.cancel();
      const chunk = this.chunks[this.currentIndex];
      this.highlightChunk(chunk);
      this.updateDockUI();

      const utter = new SpeechSynthesisUtterance(chunk.text);
      utter.voice = viVoice;
      utter.lang = viVoice.lang || 'vi-VN';
      utter.rate = this.rate;

      utter.onend = () => {
        if (this.state === 'playing') {
          this.currentIndex += 1;
          if (this.currentIndex < this.chunks.length) {
            this.speakCurrentChunk();
          } else {
            this.stop();
          }
        }
      };

      utter.onerror = (ev) => {
        if (ev.error === 'interrupted' || ev.error === 'canceled') return;
        console.warn('Speech error:', ev.error);
        this.state = 'paused';
        this.updateDockUI('⚠️ Tạm dừng do lỗi phát');
      };

      this.state = 'playing';
      this.updateDockUI();
      window.speechSynthesis.speak(utter);
    }

    showNoVoiceNotice() {
      this.state = 'paused';
      this.ensureDock();
      if (this.dockEl) {
        this.dockEl.hidden = false;
        const titleEl = this.dockEl.querySelector('#sth-audio-title');
        const progressEl = this.dockEl.querySelector('#sth-audio-progress');
        if (titleEl) titleEl.textContent = 'Chưa có giọng đọc Tiếng Việt';
        if (progressEl) {
          progressEl.innerHTML = 'Khuyên dùng <strong>Edge</strong> hoặc điện thoại · Bấm <strong>❓</strong> xem cách bật';
        }
      }
      this.openGuideModal('⚠️ Trình duyệt hoặc máy tính của bạn hiện chưa có sẵn giọng đọc Tiếng Việt. Vui lòng xem hướng dẫn bên dưới để kích hoạt nhanh:');
    }

    openGuideModal(noticeMessage = '') {
      let overlay = document.getElementById('sth-voice-modal-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'sth-voice-modal-overlay';
        overlay.className = 'sth-voice-modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Hướng dẫn giọng đọc Tiếng Việt');
        overlay.innerHTML = `
          <div class="sth-voice-modal-card">
            <header class="sth-voice-modal-top">
              <div class="sth-voice-modal-title-wrap">
                <span class="sth-voice-modal-icon" aria-hidden="true">🎙️</span>
                <div>
                  <h2 id="sth-voice-modal-h">Hướng dẫn &amp; Mẹo giọng đọc Tiếng Việt</h2>
                  <p class="sth-voice-modal-sub">Trải nghiệm nghe đọc bài viết chuẩn ngữ điệu, mượt mà và không mỏi mắt</p>
                </div>
              </div>
              <button type="button" class="sth-voice-modal-x" id="sth-voice-modal-x" aria-label="Đóng cửa sổ">×</button>
            </header>

            <div class="sth-voice-modal-content">
              <div id="sth-voice-modal-alert" class="sth-voice-alert" ${noticeMessage ? '' : 'style="display:none;"'}>
                ${noticeMessage || ''}
              </div>

              <!-- Trạng thái giọng đọc hiện tại -->
              <div class="sth-voice-status-banner">
                <div class="sth-voice-status-left">
                  <span class="sth-voice-status-dot" id="sth-voice-dot"></span>
                  <div class="sth-voice-status-text">
                    <strong id="sth-voice-status-title">Đang kiểm tra giọng đọc…</strong>
                    <span id="sth-voice-status-desc">Hệ thống đang quét các giọng đọc có sẵn trên thiết bị của bạn</span>
                  </div>
                </div>
                <button type="button" class="sth-voice-rescan-btn" id="sth-voice-rescan-btn" title="Quét lại danh sách giọng đọc">
                  🔄 Quét lại
                </button>
              </div>

              <!-- Hướng dẫn chính: 2 lựa chọn tiện nhất -->
              <div class="sth-voice-section">
                <h3 class="sth-voice-section-title">🌟 Cách 1: Sử dụng Microsoft Edge hoặc Điện thoại (Khuyên dùng - Nhanh nhất)</h3>
                <div class="sth-voice-recom-grid">
                  <div class="sth-voice-recom-card">
                    <div class="sth-voice-recom-head">
                      <span class="sth-voice-recom-badge">Tốt nhất trên PC</span>
                      <strong>Trình duyệt Microsoft Edge</strong>
                    </div>
                    <p>Edge tích hợp sẵn 2 giọng đọc AI tiếng Việt <strong>Hoài My (Nữ)</strong> và <strong>Nam Minh (Nam)</strong> cực kỳ truyền cảm, tự nhiên như podcast. Không cần cài đặt bất cứ thứ gì!</p>
                  </div>
                  <div class="sth-voice-recom-card">
                    <div class="sth-voice-recom-head">
                      <span class="sth-voice-recom-badge">Tiện lợi</span>
                      <strong>Điện thoại iPhone / Android</strong>
                    </div>
                    <p>Tất cả smartphone đã có sẵn giọng tiếng Việt (Siri Tiếng Việt / Google Speech). Chỉ cần mở Safari hoặc Chrome trên điện thoại và bấm <strong>Nghe đọc bài</strong>.</p>
                  </div>
                </div>
              </div>

              <!-- Hướng dẫn Windows: Cho Google Chrome / Cốc Cốc -->
              <div class="sth-voice-section">
                <h3 class="sth-voice-section-title">⚙️ Cách 2: Bật giọng Tiếng Việt cho Google Chrome trên Windows (Chỉ 30s)</h3>
                <p class="sth-voice-section-desc">Mặc định Windows bản tiếng Anh chưa cài gói giọng nói Tiếng Việt. Bạn hãy bật theo 4 bước sau:</p>
                <div class="sth-voice-steps">
                  <div class="sth-voice-step">
                    <span class="sth-voice-step-num">1</span>
                    <div class="sth-voice-step-body">
                      <strong>Mở cài đặt Windows</strong>
                      <span>Nhấn phím <code>Windows + I</code> trên bàn phím &rarr; chọn <strong>Time &amp; Language</strong> &rarr; <strong>Language</strong> (hoặc <em>Language &amp; Region</em>).</span>
                    </div>
                  </div>
                  <div class="sth-voice-step">
                    <span class="sth-voice-step-num">2</span>
                    <div class="sth-voice-step-body">
                      <strong>Thêm ngôn ngữ Tiếng Việt</strong>
                      <span>Trong danh sách ngôn ngữ, nếu chưa có hãy bấm <strong>Add a language</strong> &rarr; gõ tìm <strong>Tiếng Việt</strong>.</span>
                    </div>
                  </div>
                  <div class="sth-voice-step">
                    <span class="sth-voice-step-num">3</span>
                    <div class="sth-voice-step-body">
                      <strong>Tải gói Giọng nói (Speech)</strong>
                      <span>Bấm dấu <strong>...</strong> (hoặc nút <em>Options</em>) cạnh Tiếng Việt &rarr; ở mục <strong>Speech (Giọng nói)</strong> nhấn nút <strong>Download</strong> (~15 giây).</span>
                    </div>
                  </div>
                  <div class="sth-voice-step">
                    <span class="sth-voice-step-num">4</span>
                    <div class="sth-voice-step-body">
                      <strong>Hoàn tất &amp; Trải nghiệm</strong>
                      <span>Khởi động lại Chrome hoặc bấm nút <strong>🔄 Quét lại</strong> ở trên để bắt đầu nghe đọc bài mượt mà!</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Phím tắt & Thao tác tiện ích -->
              <div class="sth-voice-section">
                <h3 class="sth-voice-section-title">⌨️ Phím tắt &amp; Mẹo khi nghe đọc</h3>
                <div class="sth-voice-tips-grid">
                  <div class="sth-voice-tip-item">
                    <kbd>Space</kbd>
                    <span>Phát hoặc Tạm dừng đọc</span>
                  </div>
                  <div class="sth-voice-tip-item">
                    <kbd>Esc</kbd>
                    <span>Dừng hẳn &amp; đóng thanh phát</span>
                  </div>
                  <div class="sth-voice-tip-item">
                    <kbd>⏮ / ⏭</kbd>
                    <span>Nhảy tới hoặc lùi từng câu</span>
                  </div>
                  <div class="sth-voice-tip-item">
                    <kbd>0.85x – 1.5x</kbd>
                    <span>Tùy chỉnh tốc độ đọc phù hợp</span>
                  </div>
                </div>
                <p class="sth-voice-note">💡 <em>Mẹo:</em> Khi giọng đọc phát đến đâu, bài viết sẽ tự động cuộn nhẹ và tô sáng đoạn đó để bạn theo dõi nội dung một cách tự nhiên.</p>
              </div>
            </div>

            <footer class="sth-voice-modal-bot">
              <button type="button" class="sth-voice-btn-close" id="sth-voice-btn-close">Đã hiểu</button>
            </footer>
          </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('#sth-voice-modal-x');
        const doneBtn = overlay.querySelector('#sth-voice-btn-close');
        const rescanBtn = overlay.querySelector('#sth-voice-rescan-btn');

        const doClose = () => {
          overlay.hidden = true;
          document.body.style.overflow = '';
        };

        closeBtn?.addEventListener('click', doClose);
        doneBtn?.addEventListener('click', doClose);
        overlay.addEventListener('click', (ev) => {
          if (ev.target === overlay) doClose();
        });

        rescanBtn?.addEventListener('click', async () => {
          rescanBtn.textContent = '⏳ Đang quét…';
          await this.initVoice();
          this.updateGuideModalVoiceStatus(overlay);
          setTimeout(() => {
            rescanBtn.textContent = '🔄 Quét lại';
          }, 400);
        });
      }

      const alertBox = overlay.querySelector('#sth-voice-modal-alert');
      if (alertBox) {
        if (noticeMessage) {
          alertBox.style.display = 'block';
          alertBox.textContent = noticeMessage;
        } else {
          alertBox.style.display = 'none';
        }
      }

      this.updateGuideModalVoiceStatus(overlay);
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    updateGuideModalVoiceStatus(overlay) {
      if (!overlay) overlay = document.getElementById('sth-voice-modal-overlay');
      if (!overlay) return;

      const dot = overlay.querySelector('#sth-voice-dot');
      const title = overlay.querySelector('#sth-voice-status-title');
      const desc = overlay.querySelector('#sth-voice-status-desc');

      const viVoice = this.vietnameseVoice;
      if (viVoice) {
        if (dot) {
          dot.className = 'sth-voice-status-dot sth-voice-dot-ok';
        }
        if (title) {
          const isAi = /natural|online|google|apple/i.test(viVoice.name);
          title.textContent = `🟢 Sẵn sàng: ${viVoice.name} ${isAi ? '· Giọng AI chất lượng cao' : ''}`;
        }
        if (desc) {
          desc.textContent = `Hệ thống đã nhận diện giọng đọc Tiếng Việt (${viVoice.lang || 'vi-VN'}). Bạn có thể nghe bài viết bất cứ lúc nào!`;
        }
      } else {
        if (dot) {
          dot.className = 'sth-voice-status-dot sth-voice-dot-warn';
        }
        if (title) {
          title.textContent = '🟡 Chưa phát hiện giọng đọc Tiếng Việt';
        }
        if (desc) {
          desc.textContent = 'Trình duyệt hiện tại chưa có sẵn gói giọng đọc Tiếng Việt. Vui lòng xem 2 cách kích hoạt bên dưới.';
        }
      }
    }

    async playArticle({ id, title, items, triggerBtn }) {
      if (this.currentArticleId === id && this.state !== 'idle') {
        this.toggle();
        return;
      }

      this.stop();
      this.currentArticleId = id;
      this.currentTitle = title || 'Bài viết';
      this.activeTriggerBtn = triggerBtn || null;

      // Kiểm tra và chờ giọng tiếng Việt
      const viVoice = await this.initVoice();
      if (!viVoice) {
        this.showNoVoiceNotice();
        return;
      }

      const parsedChunks = [];
      for (const item of items) {
        if (!item || !item.text) continue;
        const textChunks = splitIntoChunks(item.text);
        for (const tc of textChunks) {
          parsedChunks.push({
            text: tc,
            elementRef: item.element || null,
          });
        }
      }

      if (!parsedChunks.length) {
        alert('Không tìm thấy nội dung văn bản để đọc.');
        return;
      }

      this.chunks = parsedChunks;
      this.currentIndex = 0;
      this.ensureDock();
      if (this.dockEl) this.dockEl.hidden = false;
      this.speakCurrentChunk();
    }

    toggle() {
      if (this.state === 'idle') return;
      if (this.state === 'playing') {
        this.state = 'paused';
        if (this.hasSpeechSynth) {
          window.speechSynthesis.pause();
        }
        this.updateDockUI();
      } else if (this.state === 'paused') {
        this.state = 'playing';
        if (this.hasSpeechSynth) {
          window.speechSynthesis.resume();
          this.updateDockUI();
        } else {
          this.speakCurrentChunk();
        }
      }
    }

    prev() {
      if (!this.chunks.length) return;
      this.currentIndex = Math.max(0, this.currentIndex - 1);
      this.speakCurrentChunk();
    }

    next() {
      if (!this.chunks.length) return;
      this.currentIndex = Math.min(this.chunks.length - 1, this.currentIndex + 1);
      this.speakCurrentChunk();
    }

    toggleRate() {
      const idx = RATES.indexOf(this.rate);
      const nextIdx = (idx + 1) % RATES.length;
      this.rate = RATES[nextIdx];
      saveRate(this.rate);
      this.updateDockUI();
      if (this.state === 'playing') {
        this.speakCurrentChunk();
      }
    }

    stop() {
      if (this.hasSpeechSynth) {
        window.speechSynthesis.cancel();
      }
      this.state = 'idle';
      this.highlightChunk(null);
      if (this.dockEl) {
        this.dockEl.hidden = true;
      }
      if (this.activeTriggerBtn) {
        this.activeTriggerBtn.setAttribute('aria-pressed', 'false');
        this.activeTriggerBtn.classList.remove('active');
        this.activeTriggerBtn.textContent = '🔊 Nghe đọc bài';
        this.activeTriggerBtn = null;
      }
      this.currentArticleId = null;
      this.currentIndex = -1;
      this.chunks = [];
    }
  }

  // Khởi tạo singleton
  global.STHAudioReader = new AudioReader();

})(typeof window !== 'undefined' ? window : this);
