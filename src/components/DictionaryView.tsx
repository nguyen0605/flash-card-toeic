import React, { useState, useMemo } from 'react';
import { Search, Volume2, Star, Filter, BookOpen } from 'lucide-react';
import { Word, WordProgress } from '../types';
import { tts } from '../services/tts';
import { db } from '../services/db';

interface DictionaryViewProps {
  words: Word[];
  progress: Record<number, WordProgress>;
  onStudyWordList?: (words: Word[], title: string) => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  words,
  progress,
  onStudyWordList
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [refreshKey, setRefreshKey] = useState(0);

  // Lọc danh sách từ vựng
  const filteredWords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return words.filter((w) => {
      // Lọc từ đánh dấu
      if (filterType === 'starred') {
        const p = progress[w.id];
        if (!p?.starred) return false;
      } else if (filterType === 'phr v.') {
        if (!w.pos.toLowerCase().includes('phr v.') && !w.pos.toLowerCase().includes('phr')) return false;
      } else if (filterType === 'phrases') {
        if (!w.word.trim().includes(' ') || w.pos.toLowerCase().includes('phr v.')) return false;
      } else if (filterType !== 'all') {
        if (!w.pos.toLowerCase().includes(filterType)) return false;
      }

      if (!term) return true;
      return (
        w.word.toLowerCase().includes(term) ||
        w.meaning.toLowerCase().includes(term) ||
        w.stt === term
      );
    });
  }, [words, searchTerm, filterType, progress, refreshKey]);

  const displayedList = filteredWords.slice(0, displayLimit);

  const handleToggleStar = (wId: number) => {
    db.toggleStar(wId);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tra cứu từ tiếng Anh hoặc nghĩa tiếng Việt..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDisplayLimit(50);
            }}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
          />
        </div>

        {/* Filter tags */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'all', label: 'Tất cả 3.500+ từ' },
            { id: 'phr v.', label: '🔥 Phrasal Verbs' },
            { id: 'phrases', label: '💡 Cụm từ / Idioms' },
            { id: 'starred', label: '⭐ Đã đánh dấu' },
            { id: 'v.', label: 'Động từ (v.)' },
            { id: 'n.', label: 'Danh từ (n.)' },
            { id: 'adj.', label: 'Tính từ (adj.)' },
            { id: 'adv.', label: 'Trạng từ (adv.)' },
          ].map((tag) => (
            <button
              key={tag.id}
              onClick={() => {
                setFilterType(tag.id);
                setDisplayLimit(50);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-colors ${
                filterType === tag.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header kết quả & Nút học danh sách này */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-slate-500">
          Tìm thấy <strong className="text-slate-800">{filteredWords.length}</strong> từ vựng
        </span>

        {filteredWords.length > 0 && onStudyWordList && (
          <button
            onClick={() => onStudyWordList(filteredWords.slice(0, 50), `Tìm kiếm (${filteredWords.length} từ)`)}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" /> Học danh sách này
          </button>
        )}
      </div>

      {/* Danh sách từ vựng */}
      <div className="space-y-2">
        {displayedList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 text-slate-400">
            Không tìm thấy từ vựng nào phù hợp
          </div>
        ) : (
          displayedList.map((item) => {
            const isStarred = progress[item.id]?.starred ?? false;
            const status = progress[item.id]?.status ?? 'new';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-extrabold text-slate-900 text-base">{item.word}</span>
                    {item.pos && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {item.pos}
                      </span>
                    )}
                    {status === 'mastered' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã thuộc" />
                    )}
                  </div>

                  {item.phonetic && (
                    <div className="text-xs text-slate-400 font-medium mb-1">
                      {item.phonetic}
                    </div>
                  )}

                  <div className="text-xs sm:text-sm font-medium text-slate-700 leading-snug">
                    {item.meaning}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => tts.speak(item.word)}
                    className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-600 flex items-center justify-center active:scale-95 transition-all"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStar(item.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                      isStarred
                        ? 'bg-amber-50 text-amber-500'
                        : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                    }`}
                    title="Đánh dấu sao"
                  >
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Nút Xem thêm nếu danh sách dài */}
      {displayedList.length < filteredWords.length && (
        <button
          onClick={() => setDisplayLimit((prev) => prev + 50)}
          className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs rounded-2xl shadow-xs active:scale-98 transition-all"
        >
          Tải thêm 50 từ (còn lại {filteredWords.length - displayedList.length} từ)
        </button>
      )}
    </div>
  );
};
