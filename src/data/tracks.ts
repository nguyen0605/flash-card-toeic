import { Deck, Word } from '../types';

export function generateGoalTracks(allWords: Word[]): Deck[] {
  // Phân chia kho từ vựng thành 3 tập RỜI RẠC HOÀN TOÀN (Zero-Overlap)
  // đảm bảo không bao giờ một từ xuất hiện ở 2 lộ trình khác nhau!
  
  // 1. Lộ trình TOEIC 500+ (Foundation): Các từ ngắn, đơn giản, thông dụng (1200 từ)
  // 2. Lộ trình TOEIC 650+ (Business Core): Các từ độ dài trung bình, công sở (1300 từ)
  // 3. Lộ trình TOEIC 800+ (Advanced Mastery): Các từ dài, học thuật, chuyên sâu (còn lại)
  
  const total = allWords.length;
  // Sắp xếp ổn định theo độ khó ước lượng (độ dài từ và cấu trúc) nhưng vẫn giữ cố định
  const sortedWords = [...allWords].sort((a, b) => {
    // Từ đơn ngắn < Từ vừa < Từ dài & cụm từ
    const aScore = a.word.trim().length + (a.word.includes(' ') ? 10 : 0);
    const bScore = b.word.trim().length + (b.word.includes(' ') ? 10 : 0);
    return aScore !== bScore ? aScore - bScore : a.id - b.id;
  });

  const part1Count = Math.floor(total * 0.35); // ~1235 từ cơ bản
  const part2Count = Math.floor(total * 0.40); // ~1411 từ trung cấp
  
  const foundationWords = sortedWords.slice(0, part1Count);
  const intermediateWords = sortedWords.slice(part1Count, part1Count + part2Count);
  const advancedWords = sortedWords.slice(part1Count + part2Count);

  const tracks: Deck[] = [
    {
      id: 'track-target-500',
      number: 1,
      title: '🎯 Lộ trình TOEIC 500+ (Nền tảng)',
      subtitle: `${foundationWords.length} từ vựng căn bản xuất hiện nhiều nhất trong đề thi`,
      wordCount: foundationWords.length,
      wordIds: foundationWords.map(w => w.id)
    },
    {
      id: 'track-target-650',
      number: 2,
      title: '🎯 Lộ trình TOEIC 650+ (Công sở & Thương mại)',
      subtitle: `${intermediateWords.length} từ vựng văn phòng, hợp đồng và dịch vụ`,
      wordCount: intermediateWords.length,
      wordIds: intermediateWords.map(w => w.id)
    },
    {
      id: 'track-target-800',
      number: 3,
      title: '🎯 Lộ trình TOEIC 800+ (Bứt phá nâng cao)',
      subtitle: `${advancedWords.length} từ vựng học thuật & cụm từ chuyên sâu Part 7`,
      wordCount: advancedWords.length,
      wordIds: advancedWords.map(w => w.id)
    }
  ];

  return tracks;
}