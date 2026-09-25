import React from 'react';
import { Flame, Trophy, Cloud, Loader2, User } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  stats: UserStats;
  masteredCount: number;
  totalWords: number;
  isLoggedIn: boolean;
  isSyncing: boolean;
  onOpenAuth: () => void;
  onSync: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  stats, 
  masteredCount, 
  totalWords,
  isLoggedIn,
  isSyncing,
  onOpenAuth,
  onSync
}) => {
  return (
    <header 
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 pb-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-500/20">
            3K
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight tracking-tight">
              TOEIC 3000
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Học từ vựng thông minh
            </p>
          </div>
        </div>

        {/* Badges: Cloud Sync, Streak & Mastered */}
        <div className="flex items-center gap-2">
          {/* Cloud Sync Status / Login Button */}
          {isLoggedIn ? (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-semibold shadow-xs active:scale-95 transition-all"
              title="Đã kết nối đám mây (Bấm để đồng bộ ngay)"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>{isSyncing ? 'Đang lưu' : 'Đã đồng bộ'}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs hover:bg-slate-200 active:scale-95 transition-all"
              title="Đăng nhập để đồng bộ dữ liệu"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Đăng nhập</span>
            </button>
          )}

          {/* Streak */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-700 text-xs font-semibold shadow-xs"
            title={`${stats.streak} ngày học liên tục`}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{stats.streak}</span>
          </div>

          {/* Mastered words */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-xs font-semibold shadow-xs"
            title={`${masteredCount}/${totalWords} từ đã thành thạo`}
          >
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            <span>{masteredCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
};