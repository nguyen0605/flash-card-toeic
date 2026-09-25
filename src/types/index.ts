export interface Word {
  id: number;
  stt: string;
  word: string;
  pos: string;
  phonetic: string;
  meaning: string;
  example?: string;
  example_vi?: string;
}

export interface Deck {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  wordCount: number;
  wordIds: number[];
}

export type WordStatus = 'new' | 'learning' | 'mastered';

export interface WordProgress {
  wordId: number;
  status: WordStatus;
  interval: number; // in days
  repetitions: number;
  easeFactor: number;
  dueDate: string; // ISO date string
  lastReviewed?: string; // ISO date string
  starred?: boolean;
}

export interface DeckProgress {
  deckId: string;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
  percent: number;
}

export interface UserStats {
  streak: number;
  lastStudyDate: string; // YYYY-MM-DD
  totalReviews: number;
  autoAudio: boolean;
  audioSpeed: number; // 0.8 or 1.0
  accent: 'en-US' | 'en-GB';
}
