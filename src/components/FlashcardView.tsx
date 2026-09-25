import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Volume2, RotateCcw, Check, Sparkles, Trophy, HelpCircle, ChevronLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word, WordProgress } from '../types';
import { SRSGrade } from '../services/srs';
import { db } from '../services/db';
import { tts } from '../services/tts';

interface FlashcardViewProps {
  title: string;
  words: Word[];
  onBack: () => void;
  onFinishQuiz?: () => void;
  autoAudio?: boolean;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  title,
  words,
  onBack,
  onFinishQuiz,
  autoAudio = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ wordId: number; grade: SRSGrade }[]>([]);
  
  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const currentWord = words[currentIndex];
  const currentProgress = currentWord ? db.getWordProgress(currentWord.id) : undefined;
  const isStarred = currentProgress?.starred ?? false;

  // Phát âm khi sang từ mới nếu bật autoAudio
  useEffect(() => {
    if (currentWord && !isFinished) {
      setIsFlipped(false);
      setSwipeOffset(0);
      if (autoAudio) {
        tts.speak(currentWord.word);
      }
    }
  }, [currentIndex, isFinished]);

  // Kích hoạt pháo hoa khi hoàn thành bài
  useEffect(() => {
    if (isFinished) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished]);

  const handleSpeak = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentWord) {
      tts.speak(currentWord.word);
    }
  };

  const handleToggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWord) {
      db.toggleStar(currentWord.id);
      // Buộc component render lại cập nhật star
      setCurrentIndex((prev) => prev);
    }
  };

  const handleGrade = (grade: SRSGrade) => {
    if (!currentWord) return;

    db.recordReview(currentWord.id, grade);
    setSessionResults((prev) => [...prev, { wordId: currentWord.id, grade }]);

    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // Quay về từ vựng trước
  const handlePrevWord = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setSwipeOffset(0);
      setSessionResults((prev) => prev.slice(0, -1));
    }
  };

  // Xử lý cử chỉ vuốt ngón tay trên màn hình điện thoại
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX.current;
    touchDeltaX.current = delta;
    setSwipeOffset(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null) return;
    const delta = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;

    // Nếu vuốt sang phải > 80px: Đã nhớ tốt (Good)
    if (delta > 80) {
      handleGrade(3);
    } 
    // Nếu vuốt sang trái < -80px: Chưa nhớ (Again)
    else if (delta < -80) {
      handleGrade(1);
    } else {
      setSwipeOffset(0);
    }
  };

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 mb-4">Không có từ vựng nào trong danh sách này.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Màn hình hoàn thành bài học
  if (isFinished) {
    const againCount = sessionResults.filter((r) => r.grade === 1).length;
    const goodCount = sessionResults.filter((r) => r.grade >= 3).length;

    return (
      <div 
        className="h-[100dvh] overflow-y-auto bg-slate-50 flex flex-col justify-between p-6 max-w-md mx-auto text-center"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)'
        }}
      >
        <div className="pt-4">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Xuất Sắc!</h2>
          <p className="text-sm text-slate-500">Bạn đã hoàn thành phiên học {title}</p>

          <div className="grid grid-cols-2 gap-3 mt-8">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-emerald-600">{goodCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Từ ghi nhớ tốt</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-2xl font-black text-rose-500">{againCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">Cần củng cố thêm</div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          {onFinishQuiz && (
            <button
              onClick={onFinishQuiz}
              className="w-full py-3.5 px-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              Làm bài kiểm tra Quiz ngay
            </button>
          )}

          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsFinished(false);
              setSessionResults([]);
            }}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Học lại bài này
          </button>

          <button
            onClick={onBack}
            className="w-full py-2.5 text-slate-500 font-semibold text-sm hover:text-slate-800"
          >
            Quay về danh sách bài học
          </button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="h-[100dvh] bg-slate-100 flex flex-col justify-between max-w-md mx-auto select-none overflow-hidden">
      {/* Top Header với Safe Area cho iPhone (tránh tai thỏ, giờ và pin) */}
      <div 
        className="bg-white px-4 pb-2 border-b border-slate-200/80 sticky top-0 z-20 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-transform shrink-0"
            aria-label="Quay về danh sách"
            title="Quay về danh sách bài học"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-1">
            <h2 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[170px]">{title}</h2>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              {currentIndex + 1} / {words.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Nút lùi về từ trước */}
            <button
              onClick={handlePrevWord}
              disabled={currentIndex === 0}
              className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                currentIndex > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-40'
              }`}
              aria-label="Từ trước"
              title="Quay lại từ vựng trước"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Nút đánh dấu sao */}
            <button
              onClick={handleToggleStar}
              className={`w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all ${
                isStarred
                  ? 'bg-amber-50 text-amber-500'
                  : 'bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}
              aria-label="Đánh dấu sao"
            >
              <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-brand-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 min-h-0 relative">
        {/* Swipe Feedback Overlay */}
        {swipeOffset > 40 && (
          <div className="absolute top-6 right-8 z-30 px-3 py-1 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md rotate-12 flex items-center gap-1">
            <Check className="w-4 h-4" /> ĐÃ NHỚ
          </div>
        )}
        {swipeOffset < -40 && (
          <div className="absolute top-6 left-8 z-30 px-3 py-1 bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md -rotate-12 flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> CHƯA NHỚ
          </div>
        )}

        {/* Card Component */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{
            transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
            transition: swipeOffset === 0 ? 'transform 0.25s ease' : 'none',
          }}
          className="w-full max-h-[380px] sm:max-h-[440px] aspect-[4/5] bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-300/50 border border-slate-200/90 flex flex-col justify-between cursor-pointer relative overflow-hidden"
        >
          {/* Card Top: Loại từ & Âm thanh */}
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 tracking-wide uppercase">
              {currentWord.pos || 'từ vựng'}
            </span>
            <button
              onClick={handleSpeak}
              className="w-10 h-10 rounded-2xl bg-brand-50 hover:bg-brand-100 active:scale-95 text-brand-600 flex items-center justify-center transition-all shadow-xs"
              title="Phát âm"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Card Center: Nội dung thay đổi khi Lật thẻ */}
          {!isFlipped ? (
            /* Mặt trước */
            <div className="flex-1 flex flex-col items-center justify-center text-center my-4">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                {currentWord.word}
              </h1>
              {currentWord.phonetic && (
                <p className="text-slate-500 text-base font-medium tracking-wide">
                  {currentWord.phonetic}
                </p>
              )}
            </div>
          ) : (
            /* Mặt sau: Nghĩa & chi tiết */
            <div className="flex-1 flex flex-col items-center justify-center text-center my-4 animate-flip-in">
              <h2 className="text-2xl font-extrabold text-slate-800 mb-1">
                {currentWord.word}
              </h2>
              {currentWord.phonetic && (
                <p className="text-slate-400 text-xs mb-4">{currentWord.phonetic}</p>
              )}
              
              <div className="bg-brand-50/80 border border-brand-100 rounded-2xl p-4 w-full">
                <p className="text-xl sm:text-2xl font-black text-brand-800 leading-snug">
                  {currentWord.meaning}
                </p>
              </div>
            </div>
          )}

          {/* Card Bottom: Gợi ý lật thẻ */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-400 font-medium inline-flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              {isFlipped ? 'Chạm để xem lại mặt trước' : 'Chạm vào thẻ để xem nghĩa'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Area: SRS Grading Buttons */}
      <div 
        className="bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-3 shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {!isFlipped ? (
          <div className="flex items-center gap-2">
            {currentIndex > 0 && (
              <button
                onClick={handlePrevWord}
                className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm flex items-center gap-1 transition-all shrink-0 shadow-xs"
                title="Quay lại từ trước"
              >
                <ChevronLeft className="w-4 h-4" /> Từ trước
              </button>
            )}
            <button
              onClick={() => setIsFlipped(true)}
              className="flex-1 py-3.5 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-500/25 transition-all text-center"
            >
              Hiện Nghĩa
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              {currentIndex > 0 ? (
                <button
                  onClick={handlePrevWord}
                  className="flex items-center gap-0.5 text-[11px] font-bold text-slate-600 hover:text-brand-600 active:scale-95 py-0.5 px-2 rounded-lg bg-slate-100 transition-colors"
                  title="Quay lại từ trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Từ trước
                </button>
              ) : <div className="w-12" />}
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mức độ ghi nhớ
              </span>
              <div className="w-12" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {/* 1: Quên / Chưa nhớ */}
              <button
                onClick={() => handleGrade(1)}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-700 transition-all"
              >
                <span className="text-xs font-black">Chưa nhớ</span>
                <span className="text-[10px] text-rose-500 font-medium mt-0.5">1 ngày</span>
              </button>

              {/* 2: Khó */}
              <button
                onClick={() => handleGrade(2)}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200 text-amber-700 transition-all"
              >
                <span className="text-xs font-black">Khó</span>
                <span className="text-[10px] text-amber-600 font-medium mt-0.5">2 ngày</span>
              </button>

              {/* 3: Tốt */}
              <button
                onClick={() => handleGrade(3)}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200 text-emerald-700 transition-all"
              >
                <span className="text-xs font-black">Nhớ tốt</span>
                <span className="text-[10px] text-emerald-600 font-medium mt-0.5">4 ngày</span>
              </button>

              {/* 4: Dễ */}
              <button
                onClick={() => handleGrade(4)}
                className="flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 border border-indigo-200 text-brand-700 transition-all"
              >
                <span className="text-xs font-black">Rất dễ</span>
                <span className="text-[10px] text-brand-500 font-medium mt-0.5">7 ngày</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
