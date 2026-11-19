/**
 * tts-reader.js — Trình phát giọng đọc bài viết (Text-to-Speech Reader)
 * Sử dụng Web Speech API chuẩn trình duyệt, hỗ trợ giọng đọc tiếng Việt,
 * tự động phân đoạn văn bản tránh ngắt tiếng và đồng bộ cuộn trang trực quan.
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

  function splitIntoChunks(text, maxLen = 140) {
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
      this.supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
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

      if (this.supported) {
        this.initVoice();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoice();
        }
      }
    }

    initVoice() {
      if (!this.supported) return;
      const voices = window.speechSynthesis.getVoices() || [];
      // 1. Tìm giọng tiếng Việt chính xác
      const viVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('vi'));
      if (viVoices.length > 0) {
        // Ưu tiên giọng tự nhiên (Google, Microsoft, Natural)
        this.vietnameseVoice =
          viVoices.find((v) => /natural|google|hoaimy|namminh|linh|online/i.test(v.name)) ||
          viVoices[0];
      } else {
        // Fallback giọng mặc định nếu máy chưa cài giọng Việt
        this.vietnameseVoice = voices.find((v) => v.default) || voices[0] || null;
      }
    }

    getVoice() {
      if (!this.vietnameseVoice) this.initVoice();
      return this.vietnameseVoice;
    }

    ensureDock() {
      let dock = document.getElementById('sth-audio-dock');
      if (!dock) {
        dock = document.createElement('div');
        dock.id = 'sth-audio-dock';
        dock.className = 'sth-audio-dock';
        dock.setAttribute('role', 'region');
        dock.setAttribute('aria-label', 'Trình phát giọng đọc');
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
        dock.querySelector('[data-act="stop"]')?.addEventListener('click', () => this.stop());
        dock.querySelector('[data-act="close"]')?.addEventListener('click', () => this.stop());
      }
      this.dockEl = dock;
      return dock;
    }

    updateDockUI() {
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
        progressEl.textContent = total > 0 ? `Đoạn ${current} / ${total}` : 'Chuẩn bị đọc…';
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
        // Cuộn nhẹ nhàng tới đoạn đang đọc
        try {
          this.activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } catch {}
      }
    }

    speakCurrentChunk() {
      if (!this.supported) return;
      if (this.currentIndex < 0 || this.currentIndex >= this.chunks.length) {
        this.stop();
        return;
      }

      window.speechSynthesis.cancel();

      const chunk = this.chunks[this.currentIndex];
      this.highlightChunk(chunk);
      this.updateDockUI();

      const utter = new SpeechSynthesisUtterance(chunk.text);
      utter.rate = this.rate;
      utter.lang = 'vi-VN';

      const voice = this.getVoice();
      if (voice) utter.voice = voice;

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
        // Nếu gặp lỗi nhỏ, thử nhảy tiếp chunk kế
        if (this.state === 'playing') {
          this.currentIndex += 1;
          this.speakCurrentChunk();
        }
      };

      this.state = 'playing';
      this.updateDockUI();
      window.speechSynthesis.speak(utter);
    }

    playArticle({ id, title, items, triggerBtn }) {
      if (!this.supported) {
        alert('Trình duyệt của bạn không hỗ trợ tính năng đọc bài (Web Speech API).');
        return;
      }

      // Nếu đang phát chính bài này
      if (this.currentArticleId === id && this.state !== 'idle') {
        this.toggle();
        return;
      }

      this.stop();
      this.currentArticleId = id;
      this.currentTitle = title || 'Bài viết';
      this.activeTriggerBtn = triggerBtn || null;

      // Xây dựng danh sách chunks
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
      this.dockEl.hidden = false;
      this.speakCurrentChunk();
    }

    toggle() {
      if (!this.supported || this.state === 'idle') return;
      if (this.state === 'playing') {
        this.state = 'paused';
        window.speechSynthesis.cancel();
        this.updateDockUI();
      } else if (this.state === 'paused') {
        this.state = 'playing';
        this.speakCurrentChunk();
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
      if (this.supported) {
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
