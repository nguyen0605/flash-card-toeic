import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Volume2, 
  Trophy, Sparkles, Layers, Headphones, Languages, ArrowLeftRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word, QuizQuestionType } from '../types';
import { tts } from '../services/tts';
import { db } from '../services/db';

interface QuizViewProps {
  deckTitle: string;
  words: Word[];
  allWords: Word[];
  onBack: () => void;
  enabledQuizTypes?: QuizQuestionType[];
}

type QuizMode = 'mixed' | QuizQuestionType;

interface Question {
  targetWord: Word;
  type: QuizQuestionType;
  promptLabel: string;
  displayMain: string;
  phonetic?: string;
  options: { text: string; isCorrect: boolean }[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  deckTitle,
  words,
  allWords,
  onBack,
  enabledQuizTypes
}) => {
  // Lấy danh sách các dạng bài tập được bật (từ Cài đặt hoặc prop)
  const activeTypes = useMemo<QuizQuestionType[]>(() => {
    if (enabledQuizTypes && enabledQuizTypes.length > 0) {
      return enabledQuizTypes;
    }
    const saved = db.getStats().enabledQuizTypes;
    if (saved && saved.length > 0) {
      return saved;
    }
    return ['en_to_vi', 'vi_to_en', 'listening'];
  }, [enabledQuizTypes]);

  // Chế độ: mặc định là 'mixed' (gộp tất cả các dạng đã chọn)
  const [selectedMode, setSelectedMode] = useState<QuizMode>('mixed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);
  const [quizKey, setQuizKey] = useState(0); // Để reset và xáo trộn lại

  // Lấy danh sách tối đa 15 từ ngẫu nhiên cho lượt làm bài (lọc từ hợp lệ)
  const quizWords = useMemo(() => {
    const validWords = words.filter(
      (w) => w.word && w.word.trim() !== '' && w.meaning && w.meaning.trim() !== ''
    );
    const pool = validWords.length > 0 ? validWords : words;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
  }, [words, quizKey]);

  // Tạo danh sách câu hỏi gộp nhiều dạng bài tập
  const questions = useMemo<Question[]>(() => {
    if (quizWords.length === 0) return [];

    return quizWords.map((target, idx) => {
      // Xác định dạng câu hỏi: Nếu mixed thì phân bổ đều các dạng activeTypes
      let qType: QuizQuestionType;
      if (selectedMode === 'mixed') {
        qType = activeTypes[idx % activeTypes.length];
      } else {
        qType = selectedMode;
      }

      const isMeaning = qType === 'en_to_vi';
      const targetText = (isMeaning ? target.meaning : target.word)?.trim() || '';

      // Tập hợp các đáp án để tránh trùng lặp hoặc rỗng
      const usedTexts = new Set<string>([targetText.toLowerCase()]);
      const distractorTexts: string[] = [];

      // 1. Thử lấy từ pool của bài học trước
      const shuffledLocal = [...words].sort(() => Math.random() - 0.5);
      for (const w of shuffledLocal) {
        if (w.id === target.id) continue;
        const text = (isMeaning ? w.meaning : w.word)?.trim();
        if (text && !usedTexts.has(text.toLowerCase())) {
          usedTexts.add(text.toLowerCase());
          distractorTexts.push(text);
          if (distractorTexts.length === 3) break;
        }
      }

      // 2. Nếu chưa đủ 3 từ nhiễu, bổ sung từ allWords
      if (distractorTexts.length < 3) {
        const shuffledGlobal = [...allWords].sort(() => Math.random() - 0.5);
        for (const w of shuffledGlobal) {
          if (w.id === target.id) continue;
          const text = (isMeaning ? w.meaning : w.word)?.trim();
          if (text && !usedTexts.has(text.toLowerCase())) {
            usedTexts.add(text.toLowerCase());
            distractorTexts.push(text);
            if (distractorTexts.length === 3) break;
          }
        }
      }

      let promptLabel = '';
      let displayMain = '';
      let phonetic: string | undefined = undefined;

      if (qType === 'en_to_vi') {
        promptLabel = 'Chọn nghĩa tiếng Việt đúng:';
        displayMain = target.word;
        phonetic = target.phonetic;
      } else if (qType === 'vi_to_en') {
        promptLabel = 'Chọn từ tiếng Anh phù hợp:';
        displayMain = target.meaning;
      } else {
        // Listening
        promptLabel = 'Nghe phát âm và chọn từ vựng đúng:';
        displayMain = 'Nhấn để nghe lại';
      }

      const options = [
        { text: targetText, isCorrect: true },
        ...distractorTexts.map((txt) => ({ text: txt, isCorrect: false }))
      ];

      return {
        targetWord: target,
        type: qType,
        promptLabel,
        displayMain,
        phonetic,
        options: options.sort(() => Math.random() - 0.5)
      };
    });
  }, [quizWords, selectedMode, activeTypes, words, allWords]);

  const currentQuestion = questions[currentIndex] || null;

  // Tự động phát âm ngay khi chuyển sang câu hỏi dạng Listening
  useEffect(() => {
    if (currentQuestion && currentQuestion.type === 'listening' && !isFinished) {
      const timer = setTimeout(() => {
        tts.speak(currentQuestion.targetWord.word);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, currentQuestion?.type, isFinished]);

  // Bắn pháo hoa khi hoàn thành bài quiz
  useEffect(() => {
    if (isFinished && score >= Math.ceil(quizWords.length * 0.7)) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [isFinished, score, quizWords.length]);

  const handleSelectOption = (index: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = currentQuestion.options[index].isCorrect;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      // Ghi nhận trả lời đúng vào tiến độ SRS (Good = 3) để chuyển dần sang Thành thạo
      db.recordReview(currentQuestion.targetWord.id, 3);
    } else {
      setIncorrectWords((prev) => [...prev, currentQuestion.targetWord]);
      // Trả lời sai: ghi nhận SRS (Again = 1) để tiếp tục duy trì luyện tập và đánh dấu sao
      db.recordReview(currentQuestion.targetWord.id, 1);
      db.toggleStar(currentQuestion.targetWord.id);
    }

    // Tự động chuyển câu sau 850ms
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setIsFinished(true);
      }
    }, 850);
  };

  // Đổi dạng bài tập giữa chừng mà KHÔNG bị reset câu hiện tại hay điểm số
  const handleModeChange = (newMode: QuizMode) => {
    if (newMode === selectedMode) return;
    setSelectedMode(newMode);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  // Chỉ bắt đầu lại toàn bộ bài thi khi kết thúc hoặc người dùng chủ động làm lại
  const restartQuiz = () => {
    setQuizKey((k) => k + 1);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setIncorrectWords([]);
  };

  // Màn hình kết quả khi kết thúc
  if (isFinished) {
    const percent = Math.round((score / (quizWords.length || 1)) * 100);
    return (
      <div 
        className="h-[100dvh] overflow-y-auto bg-slate-50 flex flex-col justify-between p-6 max-w-md mx-auto text-center"
        style={{ 
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)'
        }}
      >
        <div className="pt-4">
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-1">Kết Quả Quiz</h2>
          <p className="text-sm text-slate-500 font-medium">{deckTitle}</p>

          <div className="mt-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="text-4xl font-black text-brand-600">
              {score} / {quizWords.length}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {percent >= 80 
                ? '🎉 Xuất sắc! Bạn phản xạ từ vựng rất chuẩn xác.' 
                : percent >= 50 
                ? '👍 Tốt lắm! Hãy ôn lại các từ chưa đúng nhé.' 
                : '💪 Cần luyện thêm! Hãy xem lại flashcard để ghi nhớ sâu hơn.'}
            </p>
          </div>

          {incorrectWords.length > 0 && (
            <div className="mt-6 text-left bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-2">
                Các từ chưa đúng (đã tự động lưu vào ⭐ Từ đánh dấu):
              </span>
              <div className="space-y-1.5 text-sm text-rose-900 max-h-48 overflow-y-auto pr-1">
                {incorrectWords.map((w) => (
                  <div key={w.id} className="flex justify-between items-center py-0.5 border-b border-rose-100 last:border-none">
                    <span className="font-bold">{w.word}</span>
                    <span className="text-xs text-rose-700 font-medium">{w.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <button
            onClick={() => restartQuiz()}
            className="w-full py-3.5 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Làm lại bài Quiz
          </button>
          <button
            onClick={onBack}
            className="w-full py-2.5 text-slate-500 font-semibold text-sm hover:text-slate-800"
          >
            Quay về danh sách
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="h-[100dvh] bg-slate-50 flex flex-col justify-between max-w-md mx-auto select-none overflow-hidden">
      {/* Top Header với Safe Area */}
      <div 
        className="bg-white px-4 pb-3 border-b border-slate-200/80 sticky top-0 z-20 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-colors"
            aria-label="Quay về"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <h2 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[200px]">
              Quiz: {deckTitle}
            </h2>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="text-xs font-black px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            Điểm: {score}
          </div>
        </div>

        {/* Thanh chọn chế độ bài tập (Mặc định: Gộp đa dạng) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => handleModeChange('mixed')}
            className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              selectedMode === 'mixed'
                ? 'bg-white text-brand-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gộp đa dạng ({activeTypes.length})</span>
          </button>

          {activeTypes.includes('en_to_vi') && (
            <button
              onClick={() => handleModeChange('en_to_vi')}
              className={`py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                selectedMode === 'en_to_vi'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Từ → Nghĩa</span>
            </button>
          )}

          {activeTypes.includes('vi_to_en') && (
            <button
              onClick={() => handleModeChange('vi_to_en')}
              className={`py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                selectedMode === 'vi_to_en'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Nghĩa → Từ</span>
            </button>
          )}

          {activeTypes.includes('listening') && (
            <button
              onClick={() => handleModeChange('listening')}
              className={`py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
                selectedMode === 'listening'
                  ? 'bg-white text-brand-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Nghe</span>
            </button>
          )}
        </div>
      </div>

      {/* Vùng Question Card */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-center min-h-0">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center mb-5 relative">
          {/* Badge nhận diện dạng bài tập của câu hỏi này */}
          <div className="flex justify-center mb-3">
            {currentQuestion.type === 'en_to_vi' && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Languages className="w-3.5 h-3.5" /> Dạng: Từ tiếng Anh → Chọn Nghĩa
              </span>
            )}
            {currentQuestion.type === 'vi_to_en' && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Dạng: Nghĩa tiếng Việt → Chọn Từ
              </span>
            )}
            {currentQuestion.type === 'listening' && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5" /> Dạng: Nghe phát âm → Chọn Từ
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 font-semibold mb-2">
            {currentQuestion.promptLabel}
          </p>

          {/* Dạng Nghe: Loa phát âm trung tâm */}
          {currentQuestion.type === 'listening' ? (
            <div className="my-3">
              <button
                onClick={() => tts.speak(currentQuestion.targetWord.word)}
                className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex flex-col items-center justify-center hover:bg-brand-100 active:scale-95 shadow-md shadow-brand-500/20 transition-all gap-1"
                aria-label="Phát âm"
              >
                <Volume2 className="w-8 h-8 animate-pulse" />
                <span className="text-[10px] font-bold text-brand-700">Nghe lại</span>
              </button>

              {isAnswered && (
                <div className="mt-3 pt-2 border-t border-slate-100 animate-fadeIn">
                  <span className="font-extrabold text-slate-800 text-base">
                    {currentQuestion.targetWord.word}
                  </span>
                  {currentQuestion.targetWord.phonetic && (
                    <span className="text-slate-400 text-xs ml-2">
                      {currentQuestion.targetWord.phonetic}
                    </span>
                  )}
                  <p className="text-xs text-brand-600 font-semibold mt-0.5">
                    {currentQuestion.targetWord.meaning}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 my-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentQuestion.displayMain}
                </h2>
                {currentQuestion.type === 'en_to_vi' && (
                  <button
                    onClick={() => tts.speak(currentQuestion.targetWord.word)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    title="Nghe phát âm"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {currentQuestion.phonetic && (
                <p className="text-slate-400 text-xs">{currentQuestion.phonetic}</p>
              )}
            </div>
          )}
        </div>

        {/* 4 Lựa chọn phương án trả lời */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-brand-300';

            if (isAnswered) {
              if (option.isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs';
              } else if (selectedOption === idx) {
                btnStyle = 'bg-rose-50 border-rose-500 text-rose-800 font-bold shadow-xs';
              } else {
                btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-semibold text-sm sm:text-base transition-all flex items-center justify-between shadow-2xs active:scale-[0.99] ${btnStyle}`}
              >
                <span>{option.text}</span>
                {isAnswered && option.isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && !option.isCorrect && selectedOption === idx && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Safe Area */}
      <div 
        className="p-3 text-center text-xs text-slate-400 shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        Luyện phản xạ đa chiều: Nghe - Đọc - Hiểu nghĩa
      </div>
    </div>
  );
};
