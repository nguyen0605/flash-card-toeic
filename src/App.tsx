import React, { useState, useEffect, useMemo } from 'react';
import vocabularyData from './data/vocabulary.json';
import decksData from './data/decks.json';
import { Word, Deck, WordProgress, UserStats } from './types';
import { db } from './services/db';
import { supabase } from './services/supabase';
import { syncService } from './services/syncService';
import { Header } from './components/Header';
import { Navbar, TabType } from './components/Navbar';
import { DeckListView } from './components/DeckListView';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { DictionaryView } from './components/DictionaryView';
import { StatsView } from './components/StatsView';
import { ImportModal } from './components/ImportModal';
import { AuthModal } from './components/AuthModal';

export const App: React.FC = () => {
  const [customWords, setCustomWords] = useState<Word[]>(db.getCustomWords());
  const [customDecks, setCustomDecks] = useState<Deck[]>(db.getCustomDecks());
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Trạng thái Supabase Auth & Sync
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Kiểm tra đăng nhập và lắng nghe thay đổi session
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
        handleTriggerSync();
      } else {
        setUserEmail(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
        handleTriggerSync();
      } else {
        setUserEmail(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    const res = await syncService.syncAll();
    setIsSyncing(false);
    if (res.success) {
      refreshData();
    }
  };

  const allWords = useMemo(() => [...(vocabularyData as Word[]), ...customWords], [customWords]);

  // Bộ bài chuyên đề: Phrasal Verbs & Cụm từ thông dụng
  const specialDecks = useMemo<Deck[]>(() => {
    const phrWords = allWords.filter(w => w.pos.toLowerCase().includes('phr v.') || w.pos.toLowerCase().includes('phr'));
    const collocationWords = allWords.filter(w => w.word.trim().includes(' ') && !w.pos.toLowerCase().includes('phr v.'));

    const list: Deck[] = [];

    if (phrWords.length > 0) {
      list.push({
        id: 'special-phrasal-verbs',
        number: 0,
        title: '🔥 Chuyên đề Phrasal Verbs',
        subtitle: `${phrWords.length} cụm động từ quan trọng trong TOEIC`,
        wordCount: phrWords.length,
        wordIds: phrWords.map(w => w.id)
      });
    }

    if (collocationWords.length > 0) {
      list.push({
        id: 'special-collocations',
        number: 0,
        title: '💡 Chuyên đề Cụm từ & Collocations',
        subtitle: `${collocationWords.length} cụm từ cố định hay gặp trong đề thi`,
        wordCount: collocationWords.length,
        wordIds: collocationWords.map(w => w.id)
      });
    }

    return list;
  }, [allWords]);

  const allDecks = useMemo(() => [
    ...specialDecks,
    ...customDecks,
    ...(decksData as Deck[])
  ], [specialDecks, customDecks]);

  const [currentTab, setCurrentTab] = useState<TabType>('decks');
  const [stats, setStats] = useState<UserStats>(db.getStats());
  const [progress, setProgress] = useState<Record<number, WordProgress>>(db.getAllProgress());

  // Trạng thái phiên học hiện tại
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [activeQuizDeck, setActiveQuizDeck] = useState<Deck | null>(null);
  const [customStudy, setCustomStudy] = useState<{ words: Word[]; title: string } | null>(null);

  const refreshData = () => {
    setStats({ ...db.getStats() });
    setProgress({ ...db.getAllProgress() });
    setCustomWords(db.getCustomWords());
    setCustomDecks(db.getCustomDecks());
  };

  const handleDeleteCustomDeck = (deckId: string) => {
    db.deleteCustomDeck(deckId);
    refreshData();
    if (userEmail) handleTriggerSync();
  };

  // Tính số từ đã thuộc
  const masteredCount = useMemo(() => {
    return Object.values(progress).filter((p) => p.status === 'mastered').length;
  }, [progress]);

  // Danh sách từ đã đánh dấu sao
  const starredWords = useMemo(() => {
    const starredIds = new Set(
      Object.values(progress)
        .filter((p) => p.starred)
        .map((p) => p.wordId)
    );
    return allWords.filter((w) => starredIds.has(w.id));
  }, [progress, allWords]);

  // Danh sách từ đến hạn ôn tập hôm nay (SRS)
  const dueWords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const dueIds = new Set(
      Object.values(progress)
        .filter((p) => p.dueDate <= today && p.status !== 'new')
        .map((p) => p.wordId)
    );
    return allWords.filter((w) => dueIds.has(w.id));
  }, [progress, allWords]);

  // Bắt đầu học một Deck
  const handleSelectDeck = (deck: Deck) => {
    setActiveDeck(deck);
    setCustomStudy(null);
  };

  // Bắt đầu làm Quiz cho một Deck
  const handleStartQuiz = (deck: Deck) => {
    setActiveQuizDeck(deck);
  };

  // Học danh sách từ đã đánh dấu
  const handleStudyStarred = () => {
    if (starredWords.length === 0) return;
    setCustomStudy({
      words: starredWords,
      title: `⭐ Từ Đã Đánh Dấu (${starredWords.length} từ)`
    });
  };

  // Học danh sách từ đến hạn ôn tập
  const handleStudyDue = () => {
    if (dueWords.length === 0) return;
    setCustomStudy({
      words: dueWords,
      title: `⏰ Ôn Tập Hôm Nay (${dueWords.length} từ)`
    });
  };

  // Học danh sách tùy biến từ trang Dictionary
  const handleStudyCustomList = (words: Word[], title: string) => {
    setCustomStudy({ words, title });
  };

  // Nếu đang mở Flashcard theo Deck
  if (activeDeck) {
    const deckWords = allWords.filter((w) => activeDeck.wordIds.includes(w.id));
    return (
      <FlashcardView
        title={`${activeDeck.title}: ${activeDeck.subtitle}`}
        words={deckWords}
        onBack={() => {
          setActiveDeck(null);
          refreshData();
          if (userEmail) handleTriggerSync();
        }}
        onFinishQuiz={() => {
          const d = activeDeck;
          setActiveDeck(null);
          setActiveQuizDeck(d);
          refreshData();
          if (userEmail) handleTriggerSync();
        }}
        autoAudio={stats.autoAudio}
      />
    );
  }

  // Nếu đang mở Flashcard danh sách tùy biến (Starred, Due, Search)
  if (customStudy) {
    return (
      <FlashcardView
        title={customStudy.title}
        words={customStudy.words}
        onBack={() => {
          setCustomStudy(null);
          refreshData();
          if (userEmail) handleTriggerSync();
        }}
        autoAudio={stats.autoAudio}
      />
    );
  }

  // Nếu đang mở Quiz
  if (activeQuizDeck) {
    const quizWords = allWords.filter((w) => activeQuizDeck.wordIds.includes(w.id));
    return (
      <QuizView
        deckTitle={activeQuizDeck.title}
        words={quizWords}
        allWords={allWords}
        onBack={() => {
          setActiveQuizDeck(null);
          refreshData();
          if (userEmail) handleTriggerSync();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <Header
        stats={stats}
        masteredCount={masteredCount}
        totalWords={allWords.length}
        isLoggedIn={!!userEmail}
        isSyncing={isSyncing}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSync={handleTriggerSync}
      />

      {/* Main Tab Content */}
      <main className="flex-1">
        {currentTab === 'decks' && (
          <DeckListView
            decks={allDecks}
            words={allWords}
            progress={progress}
            onSelectDeck={handleSelectDeck}
            onStartQuiz={handleStartQuiz}
            onStudyStarred={handleStudyStarred}
            onStudyDue={handleStudyDue}
            onOpenImport={() => setIsImportOpen(true)}
            onDeleteCustomDeck={handleDeleteCustomDeck}
            starredCount={starredWords.length}
            dueCount={dueWords.length}
          />
        )}

        {currentTab === 'quiz' && (
          <div className="pt-2 px-4 max-w-md mx-auto space-y-4 pb-28">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/20">
              <h2 className="text-xl font-black mb-1">Luyện Tập & Kiểm Tra</h2>
              <p className="text-xs text-indigo-100">
                Lựa chọn một bài học bên dưới để bắt đầu bài kiểm tra 4 đáp án hoặc nghe chọn từ.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-1">
                Chọn bài kiểm tra:
              </span>
              {allDecks.slice(0, 30).map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleStartQuiz(d)}
                  className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-brand-500 active:scale-98 transition-all flex items-center justify-between text-left"
                >
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{d.title}</div>
                    <div className="text-xs text-slate-500">{d.subtitle}</div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-xl">
                    Bắt đầu Quiz →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'dictionary' && (
          <DictionaryView
            words={allWords}
            progress={progress}
            onStudyWordList={handleStudyCustomList}
          />
        )}

        {currentTab === 'stats' && (
          <StatsView
            stats={stats}
            words={allWords}
            progress={progress}
            userEmail={userEmail}
            isSyncing={isSyncing}
            onStatsUpdated={refreshData}
            onOpenAuth={() => setIsAuthOpen(true)}
            onManualSync={handleTriggerSync}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
      />

      {/* Modal Thêm file từ vựng mới */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(title, count) => {
          refreshData();
          if (userEmail) handleTriggerSync();
          alert(`Đã thêm thành công bộ từ "${title}" với ${count} từ vựng!`);
        }}
      />

      {/* Modal Đăng nhập / Đăng ký Supabase */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          handleTriggerSync();
        }}
      />
    </div>
  );
};

export default App;