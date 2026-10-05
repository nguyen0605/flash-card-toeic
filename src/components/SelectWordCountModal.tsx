import React, { useState, useMemo } from 'react';
import { X, BookOpen, Layers, Check, Sparkles, RotateCcw } from 'lucide-react';
import { Deck, Word, WordProgress } from '../types';

export type StudyMode = 'smart' | 'new_only' | 'due_only' | 'from_start';

interface SelectWordCountModalProps {
  isOpen: boolean;
  deck: Deck | null;
  words: Word[];
  progress: Record<number, WordProgress>;
  onClose: () => void;
  onConfirm: (selectedWords: Word[], sessionTitle: string) => void;
}

export const SelectWordCountModal: React.FC<SelectWordCountModalProps> = ({
  isOpen,
  deck,
  words,
  progress,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !deck) return null;

  // Lọc toàn bộ từ trong deck này, bảo lưu đúng thứ tự sắp xếp của deck
  const deckWords = useMemo(() => {
    const wordMap = new Map(words.map((w) => [w.id, w]));
    return deck.wordIds.map((id) => wordMap.get(id)).filter(Boolean) as Word[];
  }, [words, deck]);

  // Phân tích trạng thái học của các từ trong bài:
  // 1. Cần ôn tập (Đã đến ngày dueDate hoặc đã học nhưng chưa thuộc)
  // 2. Từ mới tinh (Chưa từng học bao giờ)
  // 3. Đã thuộc vững (Mastered)
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const dueWords: Word[] = [];
    const learningNotDueWords: Word[] = [];
    const newWords: Word[] = [];
    const masteredWords: Word[] = [];

    deckWords.forEach((w) => {
      const p = progress[w.id];
      if (!p || p.status === 'new' || !p.lastReviewed) {
        newWords.push(w);
      } else if (p.status === 'mastered') {
        masteredWords.push(w);
      } else {
        // status === 'learning'
        if (p.dueDate <= today) {
          dueWords.push(w); // Đến hạn ôn hôm nay
        } else {
          learningNotDueWords.push(w); // Vừa mới học hôm nay hoặc chưa đến hạn
        }
      }
    });

    return {
      dueWords,
      learningNotDueWords,
      newWords,
      masteredWords,
      total: deckWords.length
    };
  }, [deckWords, progress]);

  // Chế độ học
  const [mode, setMode] = useState<StudyMode>('smart');

  // Các mốc số lượng từ
  const presetOptions = [5, 10, 15, 20, 25, 30].filter(c => c < stats.total);
  const [selectedCount, setSelectedCount] = useState<number>(() => {
    if (presetOptions.includes(10)) return 10;
    if (presetOptions.includes(15)) return 15;
    if (presetOptions.length > 0) return presetOptions[0];
    return stats.total;
  });

  const handleStart = () => {
    let chosenWords: Word[] = [];
    let titleDetail = '';

    if (mode === 'smart') {
      // 🚀 CHẾ ĐỘ THÔNG MINH ĐÍCH THỰC (True Spaced Repetition Queue):
      // Ưu tiên 1: Từ đến hạn ôn tập hôm nay (dueWords)
      // Ưu tiên 2: Từ MỚI TINH chưa từng học (newWords) -> Đảm bảo luôn học từ mới!
      // Ưu tiên 3: Nếu đã học hết từ mới thì mới lấy đến từ đang rèn luyện hoặc đã thuộc
      const pool = [
        ...stats.dueWords,
        ...stats.newWords,
        ...stats.learningNotDueWords,
        ...stats.masteredWords
      ];
      chosenWords = pool.slice(0, selectedCount);
      titleDetail = `Tiếp tục (${chosenWords.length} từ)`;
    } else if (mode === 'new_only') {
      // Chỉ học từ mới tinh chưa từng xuất hiện
      chosenWords = stats.newWords.slice(0, selectedCount);
      titleDetail = `Từ mới tinh (${chosenWords.length} từ)`;
    } else if (mode === 'due_only') {
      // Chỉ ôn các từ đến hạn ôn tập
      const reviewPool = stats.dueWords.length > 0 ? stats.dueWords : stats.learningNotDueWords;
      chosenWords = reviewPool.slice(0, selectedCount);
      titleDetail = `Ôn lại (${chosenWords.length} từ)`;
    } else if (mode === 'from_start') {
      // Học lại từ đầu bài học
      chosenWords = deckWords.slice(0, selectedCount);
      titleDetail = `Học từ đầu (${chosenWords.length} từ)`;
    }

    if (chosenWords.length === 0) {
      chosenWords = deckWords.slice(0, selectedCount);
      titleDetail = `Bài học (${chosenWords.length} từ)`;
    }

    onConfirm(chosenWords, `${deck.title}: ${titleDetail}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tiêu đề & Thông tin tiến độ bài học */}
        <div className="text-center mb-4 pt-1">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-tight">
            Tùy chọn phiên học
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
            {deck.title} (Tổng {stats.total} từ)
          </p>

          {/* Badge tiến độ chi tiết của bài */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-center">
            <div className="bg-blue-50 rounded-xl p-1.5 border border-blue-100/80">
              <div className="text-[10px] font-bold text-blue-700">Chưa học</div>
              <div className="text-xs font-black text-blue-800">{stats.newWords.length}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-1.5 border border-amber-100/80">
              <div className="text-[10px] font-bold text-amber-700">Chưa thuộc</div>
              <div className="text-xs font-black text-amber-800">
                {stats.dueWords.length + stats.learningNotDueWords.length}
              </div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-1.5 border border-emerald-100/80">
              <div className="text-[10px] font-bold text-emerald-700">Đã thuộc</div>
              <div className="text-xs font-black text-emerald-800">{stats.masteredWords.length}</div>
            </div>
          </div>
        </div>

        {/* 1. Chọn chế độ lấy từ */}
        <div className="space-y-1.5 mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
            Chế độ học:
          </span>

          <div className="space-y-1.5">
            {/* Chế độ thông minh (Khuyên dùng) */}
            <button
              type="button"
              onClick={() => setMode('smart')}
              className={`w-full p-2.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                mode === 'smart'
                  ? 'bg-brand-50/80 border-brand-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="pr-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600 fill-brand-100" />
                  Học thông minh (Khuyên dùng)
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Ưu tiên lấy {selectedCount} từ MỚI TINH chưa học (kèm từ đến hạn ôn tập)
                </div>
              </div>
              {mode === 'smart' && <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />}
            </button>

            {/* Chỉ học từ mới */}
            {stats.newWords.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('new_only')}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                  mode === 'new_only'
                    ? 'bg-brand-50/80 border-brand-500 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <div className="pr-2">
                  <div className="text-xs font-bold text-slate-800">
                    Chỉ học các từ mới ({stats.newWords.length} từ còn lại)
                  </div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Bỏ qua từ vừa học, chỉ nạp tiếp từ mới chưa từng xem
                  </div>
                </div>
                {mode === 'new_only' && <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />}
              </button>
            )}

            {/* Học lại từ đầu */}
            <button
              type="button"
              onClick={() => setMode('from_start')}
              className={`w-full p-2.5 rounded-2xl border text-left flex items-start justify-between transition-all ${
                mode === 'from_start'
                  ? 'bg-brand-50/80 border-brand-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="pr-2">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Học lại từ đầu danh sách
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Bắt đầu lại từ từ số 1 của bài học này
                </div>
              </div>
              {mode === 'from_start' && <Check className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />}
            </button>
          </div>
        </div>

        {/* 2. Chọn số lượng từ */}
        <div className="space-y-1.5 mb-5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block px-0.5">
            Số lượng từ trong phiên này:
          </span>

          <div className="grid grid-cols-3 gap-1.5">
            {presetOptions.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setSelectedCount(count)}
                className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition-all ${
                  selectedCount === count
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {count} từ
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedCount(stats.total)}
              className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition-all ${
                selectedCount === stats.total
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Tất cả ({stats.total})
            </button>
          </div>
        </div>

        {/* Nút xác nhận bắt đầu */}
        <button
          onClick={handleStart}
          className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-brand-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          <span>Bắt đầu học ngay ({selectedCount} từ)</span>
        </button>
      </div>
    </div>
  );
};