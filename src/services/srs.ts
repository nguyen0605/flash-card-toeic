import { WordProgress } from '../types';

export type SRSGrade = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

/**
 * Thuật toán SuperMemo SM-2 cải tiến tính toán chu kỳ lặp lại ngắt quãng
 */
export function calculateNextReview(
  currentProgress: WordProgress | undefined,
  grade: SRSGrade
): {
  interval: number;
  repetitions: number;
  easeFactor: number;
  dueDate: string;
  status: 'new' | 'learning' | 'mastered';
} {
  const now = new Date();

  // Giá trị khởi tạo mặc định nếu từ chưa từng học
  let repetitions = currentProgress?.repetitions ?? 0;
  let interval = currentProgress?.interval ?? 0;
  let easeFactor = currentProgress?.easeFactor ?? 2.5;

  if (grade === 1) {
    // Again: Quên hoàn toàn, học lại từ đầu
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // 2: Hard, 3: Good, 4: Easy
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = grade === 2 ? 2 : 4;
    } else {
      if (grade === 2) {
        // Hard
        interval = Math.round(interval * 1.2);
        easeFactor = Math.max(1.3, easeFactor - 0.15);
      } else if (grade === 3) {
        // Good
        interval = Math.round(interval * easeFactor);
      } else {
        // Easy
        interval = Math.round(interval * easeFactor * 1.3);
        easeFactor = Math.min(3.0, easeFactor + 0.15);
      }
    }
    repetitions += 1;
  }

  // Tính ngày cần ôn tập tiếp theo
  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + interval);

  // Phân loại trạng thái: nếu interval >= 14 ngày hoặc repetitions >= 4 thì coi như Mastered
  let status: 'new' | 'learning' | 'mastered' = 'learning';
  if (interval >= 14 || repetitions >= 4) {
    status = 'mastered';
  }

  return {
    interval,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    dueDate: nextDate.toISOString().split('T')[0],
    status
  };
}
