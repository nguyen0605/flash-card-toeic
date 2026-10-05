import React, { useState, useMemo } from 'react';
import { 
  Play, Sparkles, Star, Clock, CheckCircle2, Search, 
  PlusCircle, Trash2, Zap, Target, Award, BookOpen, Layers
} from 'lucide-react';
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
  onStudyLearned: () => void;
  onStudyUnmastered: () => void;
  onOpenImport: () => void;
  onDeleteCustomDeck?: (deckId: string) => void;
  starredCount: number;
  dueCount: number;
  learnedCount: number;
}

export const DeckListView: React.FC<DeckListViewProps> = ({
  decks,
  words,
  progress,
  onSelectDeck,
  onStartQuiz,
  onStudyStarred,
  onStudyDue,
  onStudyLearned,
  onStudyUnmastered,
  onOpenImport,
  onDeleteCustomDeck,
  starredCount,
  dueCount,
  learnedCount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTrack, setActiveTrack] = useState<'all' | 'tracks' | 'special' | 'custom' | 'units'>('tracks');
  const [filterStatus, setFilterStatus] = useState<'all' | 'learning' | 'mastered' | 'new'>('all');

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
      const matchSearch =
        deck.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deck.number.toString().includes(searchTerm);

      if (!matchSearch) return false;

      // Lọc theo Track (tab phân loại)
      if (activeTrack === 'special') {
        if (!deck.id.startsWith('special-')) return false;
      } else if (activeTrack === 'custom') {
        if (!deck.id.startsWith('custom-')) return false;
      } else if (activeTrack === 'tracks') {
        if (!deck.id.startsWith('track-') && !deck.id.startsWith('special-')) return false;
      } else if (activeTrack === 'units') {
        if (!deck.id.startsWith('deck-')) return false;
      }

      // Lọc theo trạng thái hoàn thành
      if (filterStatus !== 'all') {
        const prog = db.getDeckProgress(deck);
        if (filterStatus === 'learning' && (prog.learningWords === 0 || prog.percent === 100)) return false;
        if (filterStatus === 'mastered' && prog.percent < 100) return false;
        if (filterStatus === 'new' && (prog.masteredWords > 0 || prog.learningWords > 0)) return false;
      }

      return true;
    });
  }, [decks, searchTerm, activeTrack, filterStatus, progress]);

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* 1. HERO CARD: ON-TAP REVIEW QUIZ (Trung tâm Spaced Repetition) */}
      <div className="bg-gradient-to-br from-indigo-700 via-brand-600 to-indigo-800 rounded-3xl p-5 text-white shadow-xl shadow-brand-600/25 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider font-bold text-blue-100 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            Lộ trình hôm nay
          </span>
          <span className="text-xs bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold">
            {overallStats.percent}% tổng kho
          </span>
        </div>

        {/* Nút One-Tap: Ôn ngay bằng QUIZ kiểm tra trắc nghiệm */}
        {dueCount > 0 ? (
          <div className="mt-3 bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                {dueCount} từ vựng đến hạn ôn tập
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Làm bài Quiz trắc nghiệm để kiểm tra trí nhớ
              </p>
            </div>
            <button
              onClick={onStudyDue}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-black text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>Ôn ngay</span>
              <Sparkles className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        ) : (
          <div className="mt-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Đã hoàn thành mục tiêu hôm nay!</div>
                <div className="text-[11px] text-blue-100">Chọn thêm một lộ trình bên dưới để rèn luyện tiếp</div>
              </div>
            </div>
          </div>
        )}

        {/* Thống kê 3 chỉ số nhanh */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-3 border-t border-white/15 text-center">
          <div>
            <div className="text-[11px] text-blue-200">Đã thành thạo</div>
            <div className="text-base font-black text-emerald-300">{overallStats.mastered}</div>
          </div>
          <button
            type="button"
            onClick={onStudyUnmastered}
            className="group py-1 px-1.5 rounded-2xl hover:bg-white/15 active:scale-95 transition-all text-center border border-transparent hover:border-amber-300/40 cursor-pointer"
            title="Lối tắt: Bấm để làm bài Quiz trắc nghiệm ngay các từ chưa thuộc"
          >
            <div className="text-[11px] text-amber-200 font-bold flex items-center justify-center gap-1">
              <span>Chưa thuộc</span>
              <span className="text-[9px] bg-amber-400/25 text-amber-200 px-1.5 py-0.5 rounded-md group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors font-extrabold">
                Quiz ngay
              </span>
            </div>
            <div className="text-base font-black text-amber-300 mt-0.5">
              {overallStats.learning}
            </div>
          </button>
          <div>
            <div className="text-[11px] text-blue-200">Tổng kho từ</div>
            <div className="text-base font-black text-white">{overallStats.total}</div>
          </div>
        </div>
      </div>

      {/* Quick Action: Flashcard Từ đã học • Từ đánh dấu • Nạp file */}
      <div className="grid grid-cols-3 gap-2">
        {/* Nút Xem Flashcard các từ đã học */}
        <button
          onClick={onStudyLearned}
          disabled={learnedCount === 0}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
            learnedCount > 0
              ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100/80 active:scale-95 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
          title="Lật flashcard xem lại toàn bộ từ vựng bạn đã từng học"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-1.5 shadow-sm shadow-brand-500/20">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">Flashcard đã học</div>
          <div className="text-[10px] text-brand-600 font-semibold mt-0.5">
            {learnedCount > 0 ? `${learnedCount} từ` : 'Chưa có'}
          </div>
        </button>

        {/* Nút Từ đánh dấu sao */}
        <button
          onClick={onStudyStarred}
          disabled={starredCount === 0}
          className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
            starredCount > 0
              ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/80 active:scale-95 shadow-xs'
              : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-1.5 shadow-sm shadow-amber-500/20">
            <Star className="w-4 h-4 fill-amber-200 text-amber-200" />
          </div>
          <div className="text-[11px] font-bold text-slate-800 leading-tight">Từ đánh dấu</div>
          <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
            {starredCount > 0 ? `${starredCount} từ` : 'Chưa có'}
          </div>
        </button>

        {/* Nút Nạp thêm từ mới */}
        <button
          onClick={onOpenImport}
          className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 text-center transition-all active:scale-95 shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm shadow-emerald-600/20">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="text-[11px] font-bold text-emerald-950 leading-tight">Thêm từ mới</div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            File / Dán
          </div>
        </button>
      </div>

      {/* 2. CHỌN LỘ TRÌNH HỌC (TRACK SELECTION) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-brand-600" />
            Lộ trình học tập
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">
            {filteredDecks.length} bộ bài
          </span>
        </div>

        {/* Tab phân loại cấp độ & chuyên đề */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'tracks', label: '🎯 Lộ trình Mục tiêu' },
            { id: 'special', label: '🔥 Chuyên đề' },
            { id: 'custom', label: '📁 Bộ từ riêng' },
            { id: 'units', label: '📚 118 Bài học gốc' },
            { id: 'all', label: `Tất cả (${decks.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTrack(tab.id as any)}
              className={`px-3 py-2 rounded-2xl font-bold shrink-0 transition-all ${
                activeTrack === tab.id
                  ? 'bg-slate-900 text-white shadow-sm shadow-slate-900/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Thanh tìm kiếm */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bộ từ hoặc từ vựng..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Danh sách các Decks */}
      <div className="space-y-3">
        {filteredDecks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 text-slate-400 text-xs">
            Không tìm thấy bài học nào phù hợp trong danh mục này.
          </div>
        ) : (
          filteredDecks.map((deck) => {
            const prog = db.getDeckProgress(deck);
            const isCompleted = prog.masteredWords === deck.wordCount && deck.wordCount > 0;
            const isCustom = deck.id.startsWith('custom-');
            const isSpecial = deck.id.startsWith('special-');
            const isTrack = deck.id.startsWith('track-');

            return (
              <div
                key={deck.id}
                className={`rounded-3xl p-4 border transition-all space-y-3 ${
                  isTrack
                    ? 'bg-gradient-to-br from-white via-indigo-50/20 to-blue-50/40 border-indigo-200 shadow-sm'
                    : isSpecial
                    ? 'bg-gradient-to-br from-white via-amber-50/30 to-amber-50/60 border-amber-300 shadow-sm'
                    : 'bg-white border-slate-200/90 shadow-2xs hover:border-brand-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                        {deck.title}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {deck.wordCount} từ
                      </span>
                      {isTrack && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-0.5">
                          <Award className="w-3 h-3" /> Mục tiêu
                        </span>
                      )}
                      {isSpecial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Chuyên đề
                        </span>
                      )}
                      {isCustom && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Bộ từ riêng
                        </span>
                      )}
                      {isCompleted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã thuộc
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium line-clamp-1">{deck.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs font-black text-slate-700">{prog.percent}%</span>
                    {isCustom && onDeleteCustomDeck && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Bạn có chắc muốn xóa bộ từ "${deck.title}"?`)) {
                            onDeleteCustomDeck(deck.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition-colors"
                        title="Xóa bộ từ này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Thanh tiến độ */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(prog.masteredWords / (deck.wordCount || 1)) * 100}%` }}
                    title={`Đã nhớ: ${prog.masteredWords}`}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${(prog.learningWords / (deck.wordCount || 1)) * 100}%` }}
                    title={`Đang học: ${prog.learningWords}`}
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    onClick={() => onSelectDeck(deck)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white font-bold text-xs shadow-xs transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Học Flashcard</span>
                  </button>

                  <button
                    onClick={() => onStartQuiz(deck)}
                    className="py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs transition-colors shrink-0"
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