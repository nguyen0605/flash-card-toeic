/**
 * Text-to-Speech Service tối ưu cho Web và iOS Safari
 */

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public speak(text: string, rate: number = 0.9, lang: 'en-US' | 'en-GB' = 'en-US'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      // Hủy mọi âm thanh đang phát trước đó
      this.synth.cancel();

      // Loại bỏ các ký tự phiên âm hoặc dấu ngoặc nếu có
      const cleanText = text.replace(/[\/\[\]]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.lang = lang;

      // Tìm giọng phù hợp (ưu tiên giọng tự nhiên của iOS / Siri nếu có)
      if (this.voices.length === 0) {
        this.loadVoices();
      }

      const preferredVoice = this.voices.find(
        (v) => v.lang.startsWith(lang.substring(0, 2)) && (v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Siri') || v.name.includes('Google') || v.name.includes('Natural'))
      ) || this.voices.find((v) => v.lang.startsWith(lang.substring(0, 2)));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  // Khởi động trước audio context trên iOS khi người dùng click lần đầu
  public unlockAudio() {
    if (this.isInitialized || !this.synth) return;
    try {
      const silent = new SpeechSynthesisUtterance('');
      this.synth.speak(silent);
      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio unlock warning:', e);
    }
  }
}

export const tts = new TTSService();
