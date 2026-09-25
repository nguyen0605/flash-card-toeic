import React from 'react';
import { BookOpen, Brain, Search, BarChart3 } from 'lucide-react';

export type TabType = 'decks' | 'quiz' | 'dictionary' | 'stats';

interface NavbarProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onChangeTab }) => {
  const tabs = [
    { id: 'decks' as TabType, label: 'Bài học', icon: BookOpen },
    { id: 'quiz' as TabType, label: 'Luyện tập', icon: Brain },
    { id: 'dictionary' as TabType, label: 'Tra từ', icon: Search },
    { id: 'stats' as TabType, label: 'Thống kê', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 px-6 shadow-lg shadow-slate-900/5">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center transition-all duration-200 relative py-1 px-3 rounded-2xl ${
                isActive
                  ? 'text-brand-600 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-brand-50' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-1.5 h-1.5 bg-brand-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
