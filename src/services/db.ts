import { WordProgress, UserStats, DeckProgress, Deck, Word } from '../types';
import { calculateNextReview, SRSGrade } from './srs';

const STORAGE_KEY_PROGRESS = 'toeic3000_word_progress';
const STORAGE_KEY_STATS = 'toeic3000_user_stats';

const DEFAULT_STATS: UserStats = {
  streak: 0,
  lastStudyDate: '',
  totalReviews: 0,
  autoAudio: true,
  audioSpeed: 0.9,
  accent: 'en-US'
};

class StorageService {
  private progressCache: Record<number, WordProgress> | null = null;
  private statsCache: UserStats | null = null;

  public getStats(): UserStats {
    if (this.statsCache) return this.statsCache;
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      this.statsCache = data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : { ...DEFAULT_STATS };
    } catch {
      this.statsCache = { ...DEFAULT_STATS };
    }
    return this.statsCache!;
  }

  public saveStats(stats: Partial<UserStats>) {
    const current = this.getStats();
    this.statsCache = { ...current, ...stats };
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.statsCache));
    } catch (e) {
      console.error('Lỗi lưu stats:', e);
    }
  }

  public getAllProgress(): Record<number, WordProgress> {
    if (this.progressCache) return this.progressCache;
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROGRESS);
      this.progressCache = data ? JSON.parse(data) : {};
    } catch {
      this.progressCache = {};
    }
    return this.progressCache!;
  }

  public getWordProgress(wordId: number): WordProgress | undefined {
    const all = this.getAllProgress();
    return all[wordId];
  }

  public recordReview(wordId: number, grade: SRSGrade): WordProgress {
    const all = this.getAllProgress();
    const current = all[wordId];
    const updatedSRS = calculateNextReview(current, grade);

    const updated: WordProgress = {
      wordId,
      ...updatedSRS,
      lastReviewed: new Date().toISOString(),
      starred: current?.starred ?? false
    };

    all[wordId] = updated;
    this.progressCache = all;

    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(all));
    } catch (e) {
      console.error('Lỗi lưu tiến độ:', e);
    }

    // Cập nhật streak & thống kê
    this.updateStreak();

    return updated;
  }

  public toggleStar(wordId: number): boolean {
    const all = this.getAllProgress();
    const current = all[wordId] || {
      wordId,
      status: 'new',
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: new Date().toISOString().split('T')[0],
      starred: false
    };

    const newStarred = !current.starred;
    all[wordId] = {
      ...current,
      starred: newStarred
    };

    this.progressCache = all;
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(all));
    } catch (e) {
      console.error('Lỗi lưu star:', e);
    }
    return newStarred;
  }

  public getDeckProgress(deck: Deck): DeckProgress {
    const all = this.getAllProgress();
    let masteredCount = 0;
    let learningCount = 0;

    for (const wId of deck.wordIds) {
      const prog = all[wId];
      if (prog) {
        if (prog.status === 'mastered') masteredCount++;
        else if (prog.status === 'learning') learningCount++;
      }
    }

    const total = deck.wordCount;
    const percent = total > 0 ? Math.round(((masteredCount + learningCount * 0.5) / total) * 100) : 0;

    return {
      deckId: deck.id,
      totalWords: total,
      masteredWords: masteredCount,
      learningWords: learningCount,
      percent: Math.min(100, percent)
    };
  }

  private updateStreak() {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    const lastDate = stats.lastStudyDate;

    let newStreak = stats.streak;

    if (!lastDate) {
      newStreak = 1;
    } else if (lastDate === today) {
      // Đã học hôm nay, giữ nguyên streak
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastDate === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    this.saveStats({
      streak: newStreak,
      lastStudyDate: today,
      totalReviews: stats.totalReviews + 1
    });
  }

  // --- QUẢN LÝ BỘ TỪ RIÊNG DO NGƯỜI DÙNG TẢI LÊN ---
  public getCustomWords(): Word[] {
    try {
      const data = localStorage.getItem('toeic3000_custom_words');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getCustomDecks(): Deck[] {
    try {
      const data = localStorage.getItem('toeic3000_custom_decks');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addCustomDeck(
    title: string,
    candidates: { word: string; pos: string; phonetic: string; meaning: string }[]
  ): { deck: Deck; newWords: Word[] } {
    const existingWords = this.getCustomWords();
    const existingDecks = this.getCustomDecks();

    const startId = existingWords.length > 0
      ? Math.max(...existingWords.map(w => w.id)) + 1
      : 10000;

    const newWords: Word[] = candidates.map((c, i) => ({
      id: startId + i,
      stt: String(startId + i),
      word: c.word,
      pos: c.pos,
      phonetic: c.phonetic,
      meaning: c.meaning
    }));

    const chunkSize = 50;
    const createdDecks: Deck[] = [];

    if (newWords.length <= chunkSize) {
      const deckId = `custom-deck-${Date.now()}`;
      const firstWord = newWords[0]?.word || '';
      const lastWord = newWords[newWords.length - 1]?.word || '';

      createdDecks.push({
        id: deckId,
        number: existingDecks.length + 1,
        title: title.trim() || `Bộ từ riêng ${existingDecks.length + 1}`,
        subtitle: `${firstWord} → ${lastWord}`,
        wordCount: newWords.length,
        wordIds: newWords.map(w => w.id)
      });
    } else {
      const numChunks = Math.ceil(newWords.length / chunkSize);
      for (let i = 0; i < numChunks; i++) {
        const chunkWords = newWords.slice(i * chunkSize, (i + 1) * chunkSize);
        const deckId = `custom-deck-${Date.now()}-${i}`;
        const firstWord = chunkWords[0]?.word || '';
        const lastWord = chunkWords[chunkWords.length - 1]?.word || '';

        createdDecks.push({
          id: deckId,
          number: existingDecks.length + i + 1,
          title: `${title.trim() || 'Bộ từ'} (Phần ${i + 1}: ${i * chunkSize + 1} - ${Math.min((i + 1) * chunkSize, newWords.length)})`,
          subtitle: `${firstWord} → ${lastWord}`,
          wordCount: chunkWords.length,
          wordIds: chunkWords.map(w => w.id)
        });
      }
    }

    const updatedWords = [...existingWords, ...newWords];
    const updatedDecks = [...createdDecks, ...existingDecks];

    try {
      localStorage.setItem('toeic3000_custom_words', JSON.stringify(updatedWords));
      localStorage.setItem('toeic3000_custom_decks', JSON.stringify(updatedDecks));
    } catch (e) {
      console.error('Lỗi lưu custom words:', e);
    }

    return { deck: createdDecks[0], newWords };
  }

  public deleteCustomDeck(deckId: string) {
    const existingDecks = this.getCustomDecks();
    const deckToDelete = existingDecks.find(d => d.id === deckId);
    if (!deckToDelete) return;

    const toDeleteIds = new Set(deckToDelete.wordIds);
    const existingWords = this.getCustomWords().filter(w => !toDeleteIds.has(w.id));
    const updatedDecks = existingDecks.filter(d => d.id !== deckId);

    try {
      localStorage.setItem('toeic3000_custom_words', JSON.stringify(existingWords));
      localStorage.setItem('toeic3000_custom_decks', JSON.stringify(updatedDecks));
    } catch (e) {
      console.error('Lỗi xóa deck:', e);
    }
  }

  public exportBackup(): string {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
      progress: this.getAllProgress(),
      customWords: this.getCustomWords(),
      customDecks: this.getCustomDecks()
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.progress) {
        this.progressCache = data.progress;
        localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data.progress));
      }
      if (data.stats) {
        this.statsCache = { ...DEFAULT_STATS, ...data.stats };
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.statsCache));
      }
      if (data.customWords) {
        localStorage.setItem('toeic3000_custom_words', JSON.stringify(data.customWords));
      }
      if (data.customDecks) {
        localStorage.setItem('toeic3000_custom_decks', JSON.stringify(data.customDecks));
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  public resetAll(): void {
    localStorage.removeItem(STORAGE_KEY_PROGRESS);
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem('toeic3000_custom_words');
    localStorage.removeItem('toeic3000_custom_decks');
    this.progressCache = null;
    this.statsCache = null;
  }
}

export const db = new StorageService();

