import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Volume2, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word } from '../types';
import { tts } from '../services/tts';
import { db } from '../services/db';

interface QuizViewProps {
  deckTitle: string;
  words: Word[];
  allWords: Word[];
  onBack: () => void;
}

type QuizType = 'en_to_vi' | 'vi_to_en' | 'listening';

interface Question {
  targetWord: Word;
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  deckTitle,
  words,
  allWords,
  onBack
}) => {
  const [quizType, setQuizType] = useState<QuizType>('en_to_vi');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [incorrectWords, setIncorrectWords] = useState<Word[]>([]);

  // Lấy danh sách câu hỏi xáo trộn (tối đa 15 từ cho 1 lượt quiz)
  const quizWords = useMemo(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 15);
  }, [words]);

  // Tạo câu hỏi hiện tại kèm 3 phương án nhiễu
  const currentQuestion = useMemo<Question | null>(() => {
    if (quizWords.length === 0 || currentIndex >= quizWords.length) return null;
    const target = quizWords[currentIndex];

    // Lấy 3 từ khác làm đáp án nhiễu
    const distractors = allWords
      .filter((w) => w.id !== target.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    let questionText = '';
    let options: { text: string; isCorrect: boolean }[] = [];

    if (quizType === 'en_to_vi') {
      questionText = target.word;
      options = [
        { text: target.meaning, isCorrect: true },
        ...distractors.map((d) => ({ text: d.meaning, isCorrect: false }))
      ];
    } else if (quizType === 'vi_to_en') {
      questionText = target.meaning;
      options = [
        { text: target.word, isCorrect: true },
        ...distractors.map((d) => ({ text: d.word, isCorrect: false }))
      ];
    } else {
      // Listening
      questionText = 'Nghe và chọn từ đúng';
      options = [
        { text: target.word, isCorrect: true },
        ...distractors.map((d) => ({ text: d.word, isCorrect: false }))
      ];
    }

    // Xáo trộn 4 đáp án
    options = options.sort(() => Math.random() - 0.5);

    return {
      targetWord: target,
      questionText,
      options
    };
  }, [quizWords, currentIndex, quizType, allWords]);

  // Tự động phát âm nếu là dạng câu hỏi nghe
  useEffect(() => {
    if (currentQuestion && quizType === 'listening') {
      tts.speak(currentQuestion.targetWord.word);
    }
  }, [currentQuestion, quizType]);

  // Bắn pháo hoa khi hoàn thành quiz với điểm cao
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
    } else {
      setIncorrectWords((prev) => [...prev, currentQuestion.targetWord]);
      // Tự động đánh dấu từ sai để người dùng ôn lại sau
      db.toggleStar(currentQuestion.targetWord.id);
    }

    // Tự động chuyển câu sau 800ms
    setTimeout(() => {
      if (currentIndex + 1 < quizWords.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
      } else {
        setIsFinished(true);
      }
    }, 850);
  };

  const restartQuiz = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setIncorrectWords([]);
  };

  if (isFinished) {
    const percent = Math.round((score / quizWords.length) * 100);
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
          <p className="text-sm text-slate-500">{deckTitle}</p>

          <div className="mt-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="text-4xl font-black text-brand-600">
              {score} / {quizWords.length}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              {percent >= 80 ? '🎉 Tuyệt vời! Bạn nhớ từ rất tốt.' : percent >= 50 ? '👍 Khá tốt! Hãy ôn lại các từ chưa đúng nhé.' : '💪 Cần cố gắng thêm! Hãy học lại flashcard.'}
            </p>
          </div>

          {incorrectWords.length > 0 && (
            <div className="mt-6 text-left bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block mb-2">
                Các từ chưa đúng (đã tự động lưu vào ⭐ Từ đánh dấu):
              </span>
              <div className="space-y-1 text-sm text-rose-900">
                {incorrectWords.map((w) => (
                  <div key={w.id} className="flex justify-between items-center py-0.5">
                    <span className="font-bold">{w.word}</span>
                    <span className="text-xs text-rose-700">{w.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <button
            onClick={restartQuiz}
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
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95"
            aria-label="Quay về"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center px-2">
            <h2 className="font-bold text-slate-800 text-sm leading-tight truncate max-w-[200px]">Quiz: {deckTitle}</h2>
            <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
              Câu {currentIndex + 1} / {quizWords.length}
            </span>
          </div>

          <div className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            Điểm: {score}
          </div>
        </div>

        {/* Chế độ thi */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
          <button
            onClick={() => { setQuizType('en_to_vi'); restartQuiz(); }}
            className={`py-1.5 rounded-lg transition-all ${quizType === 'en_to_vi' ? 'bg-white text-brand-600 shadow-xs' : ''}`}
          >
            Từ → Nghĩa
          </button>
          <button
            onClick={() => { setQuizType('vi_to_en'); restartQuiz(); }}
            className={`py-1.5 rounded-lg transition-all ${quizType === 'vi_to_en' ? 'bg-white text-brand-600 shadow-xs' : ''}`}
          >
            Nghĩa → Từ
          </button>
          <button
            onClick={() => { setQuizType('listening'); restartQuiz(); }}
            className={`py-1.5 rounded-lg transition-all ${quizType === 'listening' ? 'bg-white text-brand-600 shadow-xs' : ''}`}
          >
            Nghe chọn từ
          </button>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col justify-center min-h-0">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md text-center mb-6 relative">
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
            {quizType === 'listening' ? 'Nhấn loa để nghe' : 'Chọn đáp án chính xác'}
          </span>

          {quizType === 'listening' ? (
            <button
              onClick={() => tts.speak(currentQuestion.targetWord.word)}
              className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center hover:bg-brand-100 active:scale-95 shadow-md shadow-brand-500/20 my-2 transition-all"
            >
              <Volume2 className="w-8 h-8 animate-pulse" />
            </button>
          ) : (
            <h2 className="text-3xl font-black text-slate-900 tracking-tight my-2">
              {currentQuestion.questionText}
            </h2>
          )}

          {currentQuestion.targetWord.phonetic && quizType === 'en_to_vi' && (
            <p className="text-slate-400 text-xs mt-1">{currentQuestion.targetWord.phonetic}</p>
          )}
        </div>

        {/* 4 Choices */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((option, idx) => {
            let btnStyle = 'bg-white border-slate-200 text-slate-800 hover:border-slate-300';

            if (isAnswered) {
              if (option.isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold';
              } else if (selectedOption === idx) {
                btnStyle = 'bg-rose-50 border-rose-500 text-rose-800 font-bold';
              } else {
                btnStyle = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-medium text-sm sm:text-base transition-all flex items-center justify-between shadow-xs ${btnStyle}`}
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

      <div 
        className="p-3 text-center text-xs text-slate-400 shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        Câu hỏi trắc nghiệm tự động xáo trộn từ bài học
      </div>
    </div>
  );
};

