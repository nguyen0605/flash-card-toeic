import JSZip from 'jszip';
import { Word } from '../types';

export interface ParsedWordCandidate {
  word: string;
  pos: string;
  phonetic: string;
  meaning: string;
}

const POS_LIST = sorted([
  'modal v.', 'phr v.', 'exclamation', 'prefix', 'suffix',
  'v., n.', 'n., v.', 'adj., adv.', 'adv., prep.', 'prep., adv.',
  'adj., n.', 'n., adj.', 'adv., conj.', 'conj., adv.',
  'v.', 'adj.', 'n.', 'adv.', 'prep.', 'conj.', 'pron.', 'num.', 'det.'
], key => -key.length);

function sorted<T>(arr: T[], keyFn: (item: T) => number): T[] {
  return [...arr].sort((a, b) => keyFn(a) - keyFn(b));
}

const POS_REGEX = new RegExp('(?:^|\\s)(' + POS_LIST.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?:\\s|$)', 'i');
const VN_CHAR_REGEX = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

const SKIP_KEYWORDS = [
  'stt', 'phrasal verb', 'ý nghĩa', 'ví dụ', 'verb +', 'trường hợp', 'cách dùng',
  'ngoại lệ', 'khi phrasal verb', 'dạng thứ', 'một số giới từ', 'vai trò chủ yếu',
  'nội động từ', 'ngoại động từ', 'cách dùng phrasal verb'
];

/**
 * Phân tích 1 dòng văn bản bất kỳ thành { word, pos, phonetic, meaning }
 */
export function parseRawLine(line: string): ParsedWordCandidate | null {
  const text = line.trim();
  if (!text || text.length < 2) return null;

  const lower = text.toLowerCase();

  // Bỏ qua tiêu đề đơn ký tự (B, C, D...)
  if (/^[A-Z]$/.test(text)) return null;

  // Bỏ qua tiêu đề chương/phần (ví dụ: "4. Một số Phrasal Verbs", "4.1. Phrasal verb với TAKE")
  if (/^[0-9]+(\.[0-9]+)*\.\s+/.test(text)) return null;
  if (lower.startsWith('phrasal verb với') || lower.startsWith('phrasal verb take') || lower.startsWith('phrasal verb look') || lower.startsWith('phrasal verb fall')) {
    return null;
  }

  // Bỏ qua dòng giải thích ngữ pháp trong ngoặc đơn không có từ tiếng Anh
  if (text.startsWith('(') && text.endsWith(')') && VN_CHAR_REGEX.test(text) && !text.includes('\t')) {
    return null;
  }

  // Bỏ qua dòng tiêu đề bảng nếu chứa các từ khóa tiêu đề
  for (const sk of SKIP_KEYWORDS) {
    if (lower.includes(sk)) {
      if (text.includes('\t') && (lower.includes('stt') || lower.includes('ý nghĩa') || lower.includes('ví dụ') || lower.includes('cách dùng') || lower.includes('verb +'))) {
        return null;
      }
      if (!text.includes('\t') && text.split(/\s+/).length < 8 && (lower.includes('phrasal verb:') || lower.includes('cách dùng'))) {
        return null;
      }
    }
  }

  let word = '';
  let pos = '';
  let phonetic = '';
  let meaning = '';

  // 1. Kiểm tra dấu phân cách rõ ràng bằng Tab (thường gặp khi copy từ bảng, Excel, Word)
  const tabSplit = text.split('\t').map(p => p.trim()).filter(Boolean);
  if (tabSplit.length >= 2) {
    // Kiểm tra dòng tiêu đề bảng
    const firstCellLower = tabSplit[0].toLowerCase();
    if (firstCellLower === 'stt' || firstCellLower.includes('phrasal verb') || firstCellLower.includes('verb +') || firstCellLower.includes('trường hợp')) {
      return null;
    }

    // Nếu cột 0 là số thứ tự (1, 2, 3...)
    if (/^[0-9]+$/.test(tabSplit[0])) {
      word = tabSplit[1];
      if (tabSplit.length >= 4) {
        pos = tabSplit[2];
        meaning = tabSplit[3];
        if (tabSplit.length >= 5) {
          meaning += ` (VD: ${tabSplit.slice(4).join(' - ')})`;
        }
      } else if (tabSplit.length === 3) {
        meaning = tabSplit[2];
      } else {
        meaning = '';
      }
    } else {
      // Cột 0 là từ tiếng Anh
      word = tabSplit[0];
      meaning = tabSplit[1];
      if (tabSplit.length >= 3) {
        meaning += ` (VD: ${tabSplit.slice(2).join(' - ')})`;
      }
    }
  } else if (text.includes(' - ') || text.includes(' – ') || text.includes(' — ')) {
    const parts = text.split(/\s*[-–—]\s*/);
    word = parts[0].trim();
    meaning = parts.slice(1).join(' - ').trim();
  } else if (text.includes(' : ') || text.includes(': ')) {
    const parts = text.split(/:\s*/);
    word = parts[0].trim();
    meaning = parts.slice(1).join(': ').trim();
  } else {
    // 2. Định dạng có /phiên âm/ (như trong TOEIC docx: abandon v. /ə'bændən/ bỏ, từ bỏ)
    const slashMatch = text.match(/\/(.*?)\//);
    if (slashMatch && slashMatch.index !== undefined) {
      phonetic = `/${slashMatch[1].trim()}/`;
      const before = text.substring(0, slashMatch.index).trim();
      const after = text.substring(slashMatch.index + slashMatch[0].length).trim();

      const posMatch = before.match(POS_REGEX);
      if (posMatch && posMatch.index !== undefined) {
        word = before.substring(0, posMatch.index).trim();
        pos = posMatch[1].trim();
      } else {
        word = before.trim();
      }
      meaning = after.trim();
    } else {
      // 3. Định dạng tự do: tìm chữ tiếng Việt đầu tiên để chia đôi Từ tiếng Anh vs Nghĩa
      const vnMatch = text.match(VN_CHAR_REGEX);
      if (vnMatch && vnMatch.index !== undefined) {
        const cutIdx = vnMatch.index;
        const spaceBefore = text.lastIndexOf(' ', cutIdx);
        if (spaceBefore !== -1) {
          word = text.substring(0, spaceBefore).trim();
          meaning = text.substring(spaceBefore).trim();
        } else {
          word = text.substring(0, cutIdx).trim();
          meaning = text.substring(cutIdx).trim();
        }
      } else if (text.includes(',')) {
        // CSV thông thường
        const parts = text.split(',');
        word = parts[0].trim();
        meaning = parts.slice(1).join(',').trim();
      } else {
        word = text;
        meaning = '';
      }
    }
  }

  // Tách loại từ nếu word có chứa ngoặc đơn (ví dụ: "resilient (adj)" -> word="resilient", pos="adj")
  const parenMatch = word.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    word = parenMatch[1].trim();
    if (!pos) pos = parenMatch[2].trim();
  }

  // Làm sạch số thứ tự thừa ở đầu từ
  word = word.replace(/^[0-9]+[\.\)\-\s]+/, '').trim();
  meaning = meaning.replace(/^[-–—:;,.\s]+/, '').trim();

  // Bỏ qua nếu từ chỉ toàn số hoặc quá ngắn
  if (!word || /^[0-9]+$/.test(word) || word.length < 2) return null;

  // Tự động gán nhãn phrasal verb nếu từ có dạng động từ ghép
  if (!pos) {
    const lowerWord = word.toLowerCase();
    if (lowerWord.includes(' ') && (
      lowerWord.startsWith('to be') || lowerWord.startsWith('to ') ||
      lowerWord.startsWith('get ') || lowerWord.startsWith('take ') ||
      lowerWord.startsWith('look ') || lowerWord.startsWith('make ') ||
      lowerWord.startsWith('turn ') || lowerWord.startsWith('go ') ||
      lowerWord.startsWith('come ') || lowerWord.startsWith('put ') ||
      lowerWord.startsWith('bring ') || lowerWord.startsWith('break ') ||
      lowerWord.startsWith('fall ') || lowerWord.startsWith('hold ') ||
      lowerWord.startsWith('keep ') || lowerWord.startsWith('run ') ||
      lowerWord.startsWith('give ') || lowerWord.startsWith('call ') ||
      lowerWord.startsWith('cut ') || lowerWord.startsWith('die ') ||
      lowerWord.startsWith('drop ') || lowerWord.startsWith('hand ') ||
      lowerWord.startsWith('hang ') || lowerWord.startsWith('stay ') ||
      lowerWord.startsWith('stand ') || lowerWord.startsWith('wait ') ||
      lowerWord.startsWith('work ') || lowerWord.startsWith('wear ')
    )) {
      pos = 'phr v.';
    }
  }

  return {
    word,
    pos,
    phonetic,
    meaning
  };
}

/**
 * Trích xuất các dòng văn bản từ file Word .docx
 */
export async function extractLinesFromDocx(file: File | Blob): Promise<string[]> {
  const zip = await JSZip.loadAsync(file);
  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Tệp .docx không hợp lệ hoặc bị hỏng.');
  }

  const xmlText = await docXmlFile.async('text');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  const lines: string[] = [];

  // 1. Kiểm tra bảng (Table rows)
  const rows = xmlDoc.getElementsByTagName('w:tr');
  if (rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('w:tc');
      const cellTexts: string[] = [];
      for (let j = 0; j < cells.length; j++) {
        const text = cells[j].textContent?.trim() || '';
        if (text) cellTexts.push(text);
      }
      if (cellTexts.length > 0) {
        lines.push(cellTexts.join('\t'));
      }
    }
  } else {
    // 2. Đoạn văn thông thường (Paragraphs)
    const paras = xmlDoc.getElementsByTagName('w:p');
    for (let i = 0; i < paras.length; i++) {
      const text = paras[i].textContent?.trim();
      if (text) lines.push(text);
    }
  }

  return lines;
}

/**
 * Đọc file bất kỳ (.docx, .txt, .csv, .tsv, .json) và tự động nhận diện từ vựng
 */
export async function parseVocabularyFile(file: File): Promise<ParsedWordCandidate[]> {
  const fileName = file.name.toLowerCase();

  let rawLines: string[] = [];

  if (fileName.endsWith('.docx')) {
    rawLines = await extractLinesFromDocx(file);
  } else if (fileName.endsWith('.json')) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        word: String(item.word || item.en || item.term || '').trim(),
        pos: String(item.pos || item.type || '').trim(),
        phonetic: String(item.phonetic || item.ipa || '').trim(),
        meaning: String(item.meaning || item.vi || item.definition || '').trim()
      })).filter(w => w.word.length > 0);
    }
  } else {
    // .txt, .csv, .tsv
    const text = await file.text();
    rawLines = text.split(/\r?\n/);
  }

  const results: ParsedWordCandidate[] = [];
  for (const line of rawLines) {
    const parsed = parseRawLine(line);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}
