/**
 * tts-reader.js — Trình phát giọng đọc bài viết tiếng Việt (Dual-Engine TTS)
 * Đảm bảo 100% phát âm chuẩn tiếng Việt, xử lý bất đồng bộ voices,
 * tự động dự phòng và bảo vệ không bao giờ bị lỗi lướt nhanh mất tiếng.
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

  // Tách văn bản thành các câu/vế ngắn (tối đa 100 ký tự) để giọng đọc mượt và phát nhanh
  function splitIntoChunks(text, maxLen = 100) {
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
          // Tách câu dài theo dấu phẩy
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
      this.audioEl = null;
      this.engine = 'native'; // 'native' | 'online'
      this.retryCount = 0;

      this.initVoice();
      if (this.hasSpeechSynth && window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
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
          this.vietnameseVoice =
            viVoices.find((v) => /natural|google|hoaimy|namminh|linh|online/i.test(v.name)) ||
            viVoices[0];
        } else {
          // TUYỆT ĐỐI KHÔNG lấy giọng tiếng Anh
          this.vietnameseVoice = null;
        }
        return this.vietnameseVoice;
      } catch {
        this.vietnameseVoice = null;
        return null;
      }
    }

    getAudioElement() {
      if (!this.audioEl) {
        let el = document.getElementById('sth-tts-audio-node');
        if (!el) {
          el = document.createElement('audio');
          el.id = 'sth-tts-audio-node';
          el.setAttribute('preload', 'auto');
          el.setAttribute('referrerpolicy', 'no-referrer');
          el.referrerPolicy = 'no-referrer';
          if (document.body) document.body.appendChild(el);
        }
        this.audioEl = el;
      }
      return this.audioEl;
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
          const engineLabel = this.engine === 'native' ? 'Tiếng Việt' : 'Chuẩn Tiếng Việt';
          progressEl.textContent = total > 0 ? `Đoạn ${current} / ${total} · ${engineLabel}` : 'Chuẩn bị đọc…';
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

    // Engine 1: Native Web Speech API
    speakNative(chunk, voice) {
      this.engine = 'native';
      const audio = this.getAudioElement();
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
      }

      window.speechSynthesis.cancel();
      this.highlightChunk(chunk);
      this.updateDockUI();

      const utter = new SpeechSynthesisUtterance(chunk.text);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang || 'vi-VN';
      } else {
        utter.lang = 'vi-VN';
      }
      utter.rate = this.rate;

      utter.onend = () => {
        if (this.state === 'playing') {
          this.retryCount = 0;
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
        console.warn('Native speech error:', ev.error);
        // Nếu native lỗi, thử chuyển sang online một lần
        if (this.engine === 'native' && this.retryCount === 0) {
          this.retryCount = 1;
          this.speakOnline(chunk);
        } else {
          this.handlePlaybackFailure();
        }
      };

      this.state = 'playing';
      this.updateDockUI();
      window.speechSynthesis.speak(utter);
    }

    // Engine 2: Audio Stream với Google TTS Tiếng Việt
    speakOnline(chunk) {
      this.engine = 'online';
      if (this.hasSpeechSynth) {
        window.speechSynthesis.cancel();
      }

      this.highlightChunk(chunk);
      this.updateDockUI();

      const audio = this.getAudioElement();
      if (!audio) {
        this.handlePlaybackFailure();
        return;
      }

      audio.onended = null;
      audio.onerror = null;
      audio.pause();

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk.text)}&tl=vi&client=tw-ob`;
      audio.src = url;
      audio.playbackRate = this.rate;

      audio.onended = () => {
        if (this.state === 'playing') {
          this.retryCount = 0;
          this.currentIndex += 1;
          if (this.currentIndex < this.chunks.length) {
            this.speakCurrentChunk();
          } else {
            this.stop();
          }
        }
      };

      audio.onerror = (e) => {
        console.warn('Online audio stream error:', e);
        this.handlePlaybackFailure();
      };

      this.state = 'playing';
      this.updateDockUI();

      audio.play().catch((err) => {
        console.warn('Audio play failed:', err);
        this.handlePlaybackFailure();
      });
    }

    handlePlaybackFailure() {
      // Khi gặp lỗi thực sự, DỪNG LẠI và thông báo cho người dùng, KHÔNG lướt qua đoạn sau
      this.state = 'paused';
      if (this.hasSpeechSynth) window.speechSynthesis.cancel();
      const audio = this.getAudioElement();
      if (audio) audio.pause();

      this.updateDockUI('⚠️ Chưa có giọng đọc tiếng Việt trên trình duyệt này');
      if (this.dockEl) {
        const titleEl = this.dockEl.querySelector('#sth-audio-title');
        if (titleEl) titleEl.textContent = 'Khuyên dùng Edge hoặc Chrome có Speech';
      }
    }

    async speakCurrentChunk() {
      if (this.currentIndex < 0 || this.currentIndex >= this.chunks.length) {
        this.stop();
        return;
      }

      const chunk = this.chunks[this.currentIndex];
      const viVoice = await this.initVoice();

      if (viVoice) {
        // Máy có giọng tiếng Việt thực sự
        this.speakNative(chunk, viVoice);
      } else {
        // Máy không có giọng tiếng Việt (Windows tiếng Anh mặc định)
        // Thử phát qua Audio Engine Google TTS tiếng Việt
        this.speakOnline(chunk);
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
      this.retryCount = 0;

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
      this.updateDockUI('Đang tải giọng đọc Tiếng Việt…');

      await this.speakCurrentChunk();
    }

    toggle() {
      if (this.state === 'idle') return;
      if (this.state === 'playing') {
        this.state = 'paused';
        if (this.engine === 'online') {
          const audio = this.getAudioElement();
          if (audio) audio.pause();
        } else if (this.hasSpeechSynth) {
          window.speechSynthesis.pause();
        }
        this.updateDockUI();
      } else if (this.state === 'paused') {
        this.state = 'playing';
        if (this.engine === 'online') {
          const audio = this.getAudioElement();
          if (audio && audio.src) {
            audio.play().catch(() => {});
            this.updateDockUI();
          } else {
            this.speakCurrentChunk();
          }
        } else if (this.hasSpeechSynth) {
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
      const audio = this.getAudioElement();
      if (audio) {
        audio.playbackRate = this.rate;
      }
      this.updateDockUI();
      if (this.state === 'playing' && this.engine === 'native') {
        this.speakCurrentChunk();
      }
    }

    stop() {
      if (this.hasSpeechSynth) {
        window.speechSynthesis.cancel();
      }
      const audio = this.getAudioElement();
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        audio.removeAttribute('src');
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
      this.retryCount = 0;
    }
  }

  // Khởi tạo singleton
  global.STHAudioReader = new AudioReader();

})(typeof window !== 'undefined' ? window : this);
