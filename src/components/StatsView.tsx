import React, { useState, useRef } from 'react';
import { 
  Flame, Trophy, RotateCcw, Download, Upload,
  Smartphone, Settings, ShieldCheck,
  Cloud, LogIn, LogOut, RefreshCw, UserCheck
} from 'lucide-react';
import { UserStats, Word, WordProgress } from '../types';
import { db } from '../services/db';
import { supabase } from '../services/supabase';

interface StatsViewProps {
  stats: UserStats;
  words: Word[];
  progress: Record<number, WordProgress>;
  userEmail: string | null;
  isSyncing: boolean;
  onStatsUpdated: () => void;
  onOpenAuth: () => void;
  onManualSync: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  stats,
  words,
  progress,
  userEmail,
  isSyncing,
  onStatsUpdated,
  onOpenAuth,
  onManualSync
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Thống kê phân loại từ vựng
  let mastered = 0;
  let learning = 0;
  Object.values(progress).forEach((p) => {
    if (p.status === 'mastered') mastered++;
    else if (p.status === 'learning') learning++;
  });
  const notStarted = words.length - mastered - learning;

  const handleToggleAutoAudio = () => {
    db.saveStats({ autoAudio: !stats.autoAudio });
    onStatsUpdated();
  };

  const handleChangeSpeed = (speed: number) => {
    db.saveStats({ audioSpeed: speed });
    onStatsUpdated();
  };

  const handleChangeAccent = (accent: 'en-US' | 'en-GB') => {
    db.saveStats({ accent });
    onStatsUpdated();
  };

  const handleExportBackup = () => {
    const jsonStr = db.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toeic3000-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = db.importBackup(content);
        if (success) {
          alert('Khôi phục dữ liệu học tập thành công!');
          onStatsUpdated();
        } else {
          alert('Tệp dữ liệu không hợp lệ!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ tiến trình học và bắt đầu lại từ đầu?')) {
      db.resetAll();
      onStatsUpdated();
      alert('Đã đặt lại dữ liệu học tập thành công.');
    }
  };

  const handleSignOut = async () => {
    if (window.confirm('Bạn có muốn đăng xuất tài khoản? Dữ liệu trên máy này vẫn được giữ nguyên.')) {
      await supabase.auth.signOut();
      onStatsUpdated();
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-md mx-auto space-y-4">
      {/* Thẻ Tài khoản & Đồng bộ Đám mây */}
      <div className="bg-gradient-to-br from-brand-600 via-indigo-600 to-indigo-700 rounded-3xl p-5 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute right-[-20px] top-[-20px] opacity-10">
          <Cloud className="w-44 h-44" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Đồng bộ Đám mây (Supabase)</h3>
                <p className="text-[11px] text-blue-100">Lưu dữ liệu an toàn & học đa thiết bị</p>
              </div>
            </div>
          </div>

          {userEmail ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 space-y-2 border border-white/15">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                  <span className="truncate max-w-[180px]">{userEmail}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-[11px] text-white/70 hover:text-white flex items-center gap-1 underline"
                >
                  <LogOut className="w-3 h-3" /> Đăng xuất
                </button>
              </div>
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                className="w-full py-2 bg-white text-brand-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay bây giờ'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-blue-100">
                Chưa đăng nhập. Dữ liệu hiện chỉ lưu trên trình duyệt này.
              </p>
              <button
                onClick={onOpenAuth}
                className="w-full py-2.5 bg-white text-brand-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Đăng nhập / Đăng ký để đồng bộ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Thẻ Thống kê cá nhân */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Thành tích học tập
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-900/70">Streak liên tục</div>
              <div className="text-xl font-black text-amber-800">{stats.streak} ngày</div>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-brand-900/70">Lượt ôn tập</div>
              <div className="text-xl font-black text-brand-800">{stats.totalReviews}</div>
            </div>
          </div>
        </div>

        {/* Tiến độ từ vựng tổng quát */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Tiến độ tổng quát</span>
            <span>{Math.round((mastered / (words.length || 1)) * 100)}%</span>
          </div>

          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(mastered / words.length) * 100}%` }}
              title={`Thành thạo: ${mastered}`}
            />
            <div 
              className="bg-amber-400 h-full transition-all duration-500"
              style={{ width: `${(learning / words.length) * 100}%` }}
              title={`Đang học: ${learning}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
              <div className="text-[11px] font-semibold text-emerald-700">Thành thạo</div>
              <div className="text-sm font-black text-emerald-800">{mastered}</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 border border-amber-100">
              <div className="text-[11px] font-semibold text-amber-700">Đang học</div>
              <div className="text-sm font-black text-amber-800">{learning}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-600">Chưa học</div>
              <div className="text-sm font-black text-slate-700">{notStarted}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cài đặt âm thanh & giọng đọc */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" /> Cài đặt học tập
        </h2>

        {/* Tự động phát âm thanh */}
        <div className="flex items-center justify-between py-1">
          <div>
            <div className="text-sm font-bold text-slate-800">Tự động phát âm</div>
            <div className="text-xs text-slate-500">Phát âm ngay khi lật sang từ mới</div>
          </div>
          <button
            onClick={handleToggleAutoAudio}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
              stats.autoAudio ? 'bg-brand-600 justify-end' : 'bg-slate-200 justify-start'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                stats.autoAudio ? 'translate-x-0' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Tốc độ đọc */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Tốc độ đọc</div>
            <div className="text-xs text-slate-500">Điều chỉnh giọng đọc phát âm</div>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleChangeSpeed(0.8)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stats.audioSpeed === 0.8 ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              0.8x (Chậm)
            </button>
            <button
              onClick={() => handleChangeSpeed(1.0)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stats.audioSpeed === 1.0 ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              1.0x (Chuẩn)
            </button>
          </div>
        </div>

        {/* Giọng đọc Mỹ / Anh */}
        <div className="flex items-center justify-between py-1 border-t border-slate-100 pt-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Chất giọng</div>
            <div className="text-xs text-slate-500">Giọng đọc tiếng Anh (Anh-Mỹ hoặc Anh-Anh)</div>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleChangeAccent('en-US')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stats.accent === 'en-US' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              US (Mỹ)
            </button>
            <button
              onClick={() => handleChangeAccent('en-GB')}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                stats.accent === 'en-GB' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              UK (Anh)
            </button>
          </div>
        </div>
      </div>

      {/* Hướng dẫn cài đặt lên iPhone 13 */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
          <Smartphone className="w-5 h-5 text-brand-600" />
          Hướng dẫn cài đặt trên iPhone 13
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Để dùng app toàn màn hình như ứng dụng App Store và học offline:
        </p>
        <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4 leading-relaxed">
          <li>Mở đường link ứng dụng bằng trình duyệt <strong>Safari</strong> trên iPhone.</li>
          <li>Bấm vào nút <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng trình duyệt.</li>
          <li>Cuộn xuống và chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.</li>
          <li>App sẽ xuất hiện ngoài màn hình iPhone với đầy đủ icon và chạy độc lập!</li>
        </ol>
      </div>

      {/* Sao lưu và Khôi phục dữ liệu */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-3">
        <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-slate-600" /> Dữ liệu & Sao lưu thủ công
        </h2>
        <p className="text-xs text-slate-500">
          Bạn cũng có thể xuất file sao lưu JSON thủ công về máy tính / điện thoại.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportBackup}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất file sao lưu
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs transition-colors"
          >
            <Upload className="w-4 h-4" /> Nhập file sao lưu
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
        </div>

        <button
          onClick={handleResetData}
          className="w-full text-center text-xs text-rose-500 hover:text-rose-700 font-semibold pt-2"
        >
          Đặt lại toàn bộ tiến độ (Bắt đầu lại từ đầu)
        </button>
      </div>
    </div>
  );
};