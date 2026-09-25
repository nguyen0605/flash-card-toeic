import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { parseVocabularyFile, parseRawLine, ParsedWordCandidate } from '../services/importer';
import { db } from '../services/db';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (deckTitle: string, wordCount: number) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [deckTitle, setDeckTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [parsedWords, setParsedWords] = useState<ParsedWordCandidate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fileName, setFileName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    setFileName(file.name);

    // Đặt tên mặc định cho bộ từ theo tên file
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!deckTitle) {
      setDeckTitle(cleanName);
    }

    try {
      const results = await parseVocabularyFile(file);
      if (results.length === 0) {
        setErrorMessage('Không nhận diện được từ vựng nào từ tệp này. Hãy kiểm tra lại nội dung.');
      } else {
        setParsedWords(results);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Lỗi đọc tệp tin.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const lines = pastedText.split(/\r?\n/);
      const results: ParsedWordCandidate[] = [];
      for (const line of lines) {
        const parsed = parseRawLine(line);
        if (parsed) results.push(parsed);
      }

      if (results.length === 0) {
        setErrorMessage('Không nhận diện được từ vựng nào từ văn bản đã dán.');
      } else {
        setParsedWords(results);
      }
    } catch (err: any) {
      setErrorMessage('Lỗi xử lý văn bản.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDeck = () => {
    if (parsedWords.length === 0) return;

    const title = deckTitle.trim() || 'Bộ từ tự tạo';
    db.addCustomDeck(title, parsedWords);
    onImportSuccess(title, parsedWords.length);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setParsedWords([]);
    setDeckTitle('');
    setPastedText('');
    setFileName('');
    setErrorMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thêm Bộ Từ Vựng Mới</h2>
            <p className="text-xs text-slate-500">Tự động nhận diện từ file Word, CSV, Text</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tên bộ từ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên bài học / Bộ từ
            </label>
            <input
              type="text"
              placeholder="Ví dụ: IELTS Reading Unit 1, Chuyên ngành IT..."
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          {/* Tab chọn cách nạp từ */}
          {parsedWords.length === 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('file')}
                  className={`py-2 rounded-xl transition-all ${
                    activeTab === 'file' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Tải file (.docx, .txt, .csv)
                </button>
                <button
                  onClick={() => setActiveTab('paste')}
                  className={`py-2 rounded-xl transition-all ${
                    activeTab === 'paste' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Dán văn bản trực tiếp
                </button>
              </div>

              {activeTab === 'file' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50/60 hover:bg-brand-50/30 rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 group-hover:bg-brand-100 text-brand-600 flex items-center justify-center mb-3 transition-colors shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm">
                    {fileName ? fileName : 'Bấm để chọn file từ máy'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1 max-w-[280px]">
                    Hỗ trợ tệp <strong>.docx</strong> (bảng hoặc đoạn văn), <strong>.csv</strong>, <strong>.txt</strong>, <strong>.json</strong>
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".docx,.txt,.csv,.tsv,.json"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    placeholder="Dán nội dung từ vựng vào đây, ví dụ:&#10;abandon v. /ə'bændən/ từ bỏ&#10;resilient - kiên cường&#10;accommodate : cung cấp nơi ở..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    onClick={handleParsePastedText}
                    disabled={!pastedText.trim() || isProcessing}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all"
                  >
                    Phân tích từ vựng
                  </button>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="py-8 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Đang tự động bóc tách và phân loại từ vựng...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Kết quả nhận diện (Live Preview) */}
          {parsedWords.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">
                    Đã nhận diện thành công <strong>{parsedWords.length}</strong> từ vựng!
                  </span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                >
                  Chọn file khác
                </button>
              </div>

              {/* Danh sách xem trước */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Từ tiếng Anh</th>
                      <th className="py-2 px-2">Loại</th>
                      <th className="py-2 px-3">Nghĩa tiếng Việt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedWords.slice(0, 30).map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {w.word}
                          {w.phonetic && <span className="block text-[10px] text-slate-400 font-normal">{w.phonetic}</span>}
                        </td>
                        <td className="py-2 px-2">
                          {w.pos && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">{w.pos}</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-700">{w.meaning || '(Chưa có nghĩa)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedWords.length > 30 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Và {parsedWords.length - 30} từ vựng khác...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Đóng
          </button>

          {parsedWords.length > 0 && (
            <button
              onClick={handleSaveDeck}
              className="py-2.5 px-5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition-all"
            >
              Lưu vào bài học <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
