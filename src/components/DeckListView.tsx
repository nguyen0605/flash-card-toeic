import React, { useState, useMemo } from 'react';
import { Play, Sparkles, Star, Clock, CheckCircle2, ChevronRight, Search, PlusCircle, Trash2, FolderPlus } from 'lucide-react';
import { Deck, Word, WordProgress } from '../types';
import { db } from '../services/db';

interface DeckListViewProps {
  decks: Deck[];
  words: Word[];
  progress: Record<number, WordProgress>;
  onSelectDeck: (deck: Deck) => void;
  onStartQuiz: (deck: Deck) => void;
  onStudyStarred: () => void;
  onStudyDue: () => void;
  onOpenImport: () => void;
  onDeleteCustomDeck?: (deckId: string) => void;
  starredCount: number;
  dueCount: number;
}

export const DeckListView: React.FC<DeckListViewProps> = ({
  decks,
  words,
  progress,
  onSelectDeck,
  onStartQuiz,
  onStudyStarred,
  onStudyDue,
  onOpenImport,
  onDeleteCustomDeck,
  starredCount,
  dueCount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'special' | 'custom' | 'learning' | 'mastered' | 'new'>('all');

  // Thống kê nhanh toàn bộ
  const overallStats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    Object.values(progress).forEach((p) => {
      if (p.status === 'mastered') mastered++;
      else if (p.status === 'learning') learning++;
    });
    const total = words.length;
    const percent = total > 0 ? Math.round(((mastered + learning * 0.5) / total) * 100) : 0;
    return { mastered, learning, total, percent };
  }, [progress, words.length]);

  // Lọc danh sách bài học
  const filteredDecks = useMemo(() => {
    return decks.filter((deck) => {
      // Tìm kiếm theo số bài hoặc từ vựng trong subtitle
      const matchSearch =
        deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.number.toString().includes(searchTerm);

      if (!matchSearch) return false;

      if (filter === 'special') return deck.id.startsWith('special-');
      if (filter === 'custom') return deck.id.startsWith('custom-');

      const deckProg = db.getDeckProgress(deck);
      if (filter === 'mastered') return deckProg.masteredWords === deck.wordCount;
      if (filter === 'learning') return deckProg.learningWords > 0 || (deckProg.masteredWords > 0 && deckProg.masteredWords < deck.wordCount);
      if (filter === 'new') return deckProg.masteredWords === 0 && deckProg.learningWords === 0;

      return true;
    });
  }, [decks, searchTerm, filter, progress]);

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Banner Tổng quan Tiến độ */}
      <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-700 rounded-3xl p-5 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tiến độ TOEIC 3000
          </span>
          <span className="text-xl font-black">{overallStats.percent}%</span>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-black/20 rounded-full h-2.5 mb-4 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallStats.percent}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/15 text-center">
          <div>
            <div className="text-xs text-brand-200">Đã nhớ vững</div>
            <div className="text-lg font-bold text-emerald-300">{overallStats.mastered}</div>
          </div>
          <div>
            <div className="text-xs text-brand-200">Đang rèn luyện</div>
            <div className="text-lg font-bold text-amber-300">{overallStats.learning}</div>
          </div>
          <div>
            <div className="text-xs text-brand-200">Tổng từ vựng</div>
            <div className="text-lg font-bold">{overallStats.total}</div>
          </div>
        </div>
      </div>

      {/* Quick Action: Ôn tập hôm nay & Từ đã đánh dấu */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onStudyDue}
          disabled={dueCount === 0}
          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
            dueCount > 0
              ? 'bg-amber-50 border-amber-200 active:scale-95 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-slate-500 font-medium">Cần ôn hôm nay</div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {dueCount > 0 ? `${dueCount} từ đến hạn` : 'Đã xong'}
            </div>
          </div>
        </button>

        <button
          onClick={onStudyStarred}
          disabled={starredCount === 0}
          className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
            starredCount > 0
              ? 'bg-indigo-50 border-indigo-200 active:scale-95 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/30">
            <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-slate-500 font-medium">Từ đánh dấu</div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {starredCount > 0 ? `${starredCount} từ quan trọng` : 'Chưa có'}
            </div>
          </div>
        </button>
      </div>

      {/* Nút thêm file từ vựng mới */}
      <button
        onClick={onOpenImport}
        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
      >
        <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
        Thêm bộ từ mới (Nạp file .docx, .csv hoặc dán)
      </button>

      {/* Tìm kiếm & Bộ lọc */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm bài học (ví dụ: Bài 1, abandon...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: `Tất cả (${decks.length})` },
            { id: 'special', label: '🔥 Chuyên đề TOEIC' },
            { id: 'custom', label: '📁 Bộ từ riêng' },
            { id: 'learning', label: 'Đang học' },
            { id: 'mastered', label: 'Đã xong' },
            { id: 'new', label: 'Chưa học' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                filter === tab.id
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách các Decks */}
      <div className="space-y-3">
        {filteredDecks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 text-slate-400">
            Không tìm thấy bài học phù hợp
          </div>
        ) : (
          filteredDecks.map((deck) => {
            const prog = db.getDeckProgress(deck);
            const isCompleted = prog.masteredWords === deck.wordCount && deck.wordCount > 0;
            const isCustom = deck.id.startsWith('custom-');
            const isSpecial = deck.id.startsWith('special-');

            return (
              <div
                key={deck.id}
                className={`rounded-2xl p-4 border transition-all space-y-3 ${
                  isSpecial
                    ? 'bg-gradient-to-br from-white via-amber-50/30 to-amber-50/70 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200/90 shadow-xs hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-base">{deck.title}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {deck.wordCount} từ
                      </span>
                      {isSpecial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                          Chuyên đề
                        </span>
                      )}
                      {isCustom && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                          Bộ từ riêng
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã thuộc
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{deck.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">{prog.percent}%</span>
                    {isCustom && onDeleteCustomDeck && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Bạn có chắc muốn xóa bộ từ "${deck.title}"?`)) {
                            onDeleteCustomDeck(deck.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Xóa bộ từ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(prog.masteredWords / deck.wordCount) * 100}%` }}
                    title={`Đã nhớ: ${prog.masteredWords}`}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${(prog.learningWords / deck.wordCount) * 100}%` }}
                    title={`Đang học: ${prog.learningWords}`}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onSelectDeck(deck)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-semibold text-xs shadow-sm shadow-brand-500/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Học Flashcard
                  </button>
                  <button
                    onClick={() => onStartQuiz(deck)}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs transition-colors"
                  >
                    Làm Quiz
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
