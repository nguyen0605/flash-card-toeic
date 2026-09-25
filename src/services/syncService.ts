import { supabase } from './supabase';
import { db } from './db';
import { WordProgress, Word, Deck } from '../types';

class SyncService {
  private isSyncing = false;

  public async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  public async syncAll(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) return { success: false, error: 'Đang trong quá trình đồng bộ' };
    const user = await this.getCurrentUser();
    if (!user) return { success: false, error: 'Chưa đăng nhập' };

    this.isSyncing = true;
    try {
      const localStats = db.getStats();
      const localProgress = db.getAllProgress();
      const localWords = db.getCustomWords();
      const localDecks = db.getCustomDecks();

      // 1. Đồng bộ User Profiles
      const { data: remoteProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (remoteProfile) {
        const mergedStreak = Math.max(localStats.streak, remoteProfile.streak || 0);
        const mergedDate = (localStats.lastStudyDate > (remoteProfile.last_studied_date || '')) 
          ? localStats.lastStudyDate 
          : remoteProfile.last_studied_date;
        
        db.saveStats({ streak: mergedStreak, lastStudyDate: mergedDate });

        await supabase.from('user_profiles').upsert({
          id: user.id,
          streak: mergedStreak,
          last_studied_date: mergedDate,
          updated_at: new Date().toISOString()
        });
      } else {
        await supabase.from('user_profiles').insert({
          id: user.id,
          streak: localStats.streak,
          last_studied_date: localStats.lastStudyDate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // 2. Đồng bộ Custom Decks & Words
      const { data: remoteDecks } = await supabase
        .from('custom_decks')
        .select('*')
        .eq('user_id', user.id);

      const { data: remoteWords } = await supabase
        .from('custom_words')
        .select('*')
        .eq('user_id', user.id);

      const deckMap = new Map<string, Deck>();
      (remoteDecks || []).forEach((rd: any) => {
        deckMap.set(rd.id, {
          id: rd.id,
          number: 0,
          title: rd.title,
          subtitle: rd.description || '',
          wordCount: 0,
          wordIds: []
        });
      });
      localDecks.forEach(ld => {
        deckMap.set(ld.id, ld);
      });

      const wordMap = new Map<number, Word>();
      (remoteWords || []).forEach((rw: any) => {
        const idNum = parseInt(rw.id, 10) || Date.now();
        wordMap.set(idNum, {
          id: idNum,
          stt: String(idNum),
          word: rw.word,
          phonetic: rw.phonetic || '',
          pos: rw.pos || '',
          meaning: rw.meaning,
          example: rw.example,
          example_vi: rw.example_vi
        });
      });
      localWords.forEach(lw => {
        wordMap.set(lw.id, lw);
      });

      const mergedWords = Array.from(wordMap.values());
      const mergedDecks = Array.from(deckMap.values()).map((deck, idx) => {
        const wordsInDeck = mergedWords.filter(w => deck.wordIds.includes(w.id));
        const firstWord = wordsInDeck[0]?.word || '';
        const lastWord = wordsInDeck[wordsInDeck.length - 1]?.word || '';
        return {
          ...deck,
          number: idx + 1,
          wordCount: wordsInDeck.length || deck.wordCount,
          subtitle: wordsInDeck.length > 0 ? (firstWord + ' -> ' + lastWord) : deck.subtitle
        };
      });

      localStorage.setItem('toeic3000_custom_words', JSON.stringify(mergedWords));
      localStorage.setItem('toeic3000_custom_decks', JSON.stringify(mergedDecks));

      if (mergedDecks.length > 0) {
        const deckPayload = mergedDecks.map(d => ({
          id: d.id,
          user_id: user.id,
          title: d.title,
          description: d.subtitle,
          category: 'Custom'
        }));
        await supabase.from('custom_decks').upsert(deckPayload);
      }

      if (mergedWords.length > 0) {
        const wordPayload = mergedWords.map(w => {
          const parentDeck = mergedDecks.find(d => d.wordIds.includes(w.id));
          return {
            id: String(w.id),
            user_id: user.id,
            deck_id: parentDeck ? parentDeck.id : null,
            word: w.word,
            phonetic: w.phonetic,
            pos: w.pos,
            meaning: w.meaning,
            example: w.example || null,
            example_vi: w.example_vi || null
          };
        });
        await supabase.from('custom_words').upsert(wordPayload);
      }

      // 3. Đồng bộ User Progress (SM-2)
      const { data: remoteProgress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      const progressMap: Record<number, WordProgress> = { ...localProgress };
      if (remoteProgress) {
        remoteProgress.forEach((rp: any) => {
          const wId = parseInt(rp.word_id, 10);
          if (!isNaN(wId)) {
            const localP = progressMap[wId];
            if (!localP) {
              progressMap[wId] = {
                wordId: wId,
                status: rp.interval >= 21 ? 'mastered' : rp.repetitions > 0 ? 'learning' : 'new',
                interval: rp.interval,
                repetitions: rp.repetitions,
                easeFactor: rp.ease_factor,
                dueDate: new Date(rp.next_review_date).toISOString().split('T')[0],
                starred: rp.is_starred
              };
            } else {
              progressMap[wId] = {
                ...localP,
                starred: localP.starred || rp.is_starred,
                interval: Math.max(localP.interval, rp.interval),
                repetitions: Math.max(localP.repetitions, rp.repetitions),
                status: (Math.max(localP.interval, rp.interval) >= 21) ? 'mastered' : 'learning'
              };
            }
          }
        });
      }

      localStorage.setItem('toeic3000_word_progress', JSON.stringify(progressMap));

      const progressEntries = Object.values(progressMap);
      if (progressEntries.length > 0) {
        const batchSize = 200;
        for (let i = 0; i < progressEntries.length; i += batchSize) {
          const batch = progressEntries.slice(i, i + batchSize).map(p => ({
            user_id: user.id,
            word_id: String(p.wordId),
            interval: p.interval,
            repetitions: p.repetitions,
            ease_factor: p.easeFactor,
            next_review_date: new Date(p.dueDate).getTime() || Date.now(),
            is_starred: p.starred,
            updated_at: new Date().toISOString()
          }));
          await supabase.from('user_progress').upsert(batch);
        }
      }

      localStorage.setItem('toeic3000_last_synced', new Date().toISOString());
      return { success: true };
    } catch (err: any) {
      console.error('Lỗi đồng bộ Supabase:', err);
      return { success: false, error: err.message || 'Lỗi không xác định khi đồng bộ' };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
