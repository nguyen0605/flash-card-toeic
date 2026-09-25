#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_vocab.py
Bóc tách toàn bộ 3.000+ từ vựng TOEIC từ file Word .docx, làm sạch,
ghép các dòng bị đứt quãng, chia bộ (decks) và xuất ra file JSON.
"""

import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
import sys

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

DOCX_FILE = "Danh-sach-3000-tu-vung-TOEIC.docx"
OUTPUT_DIR = os.path.join("src", "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "vocabulary.json")
OUTPUT_DECKS = os.path.join(OUTPUT_DIR, "decks.json")

# Danh sách từ loại phổ biến trong tài liệu
POS_LIST = sorted([
    'modal v.', 'phr v.', 'exclamation', 'prefix', 'suffix',
    'v., n.', 'n., v.', 'adj., adv.', 'adv., prep.', 'prep., adv.',
    'adj., n.', 'n., adj.', 'adv., conj.', 'conj., adv.',
    'v.', 'adj.', 'n.', 'adv.', 'prep.', 'conj.', 'pron.', 'num.', 'det.'
], key=lambda x: -len(x))

POS_PATTERN = re.compile(r'(?:^|\s)(' + '|'.join(re.escape(p) for p in POS_LIST) + r')(?:\s|$)')
VN_CHAR_SET = set('àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ')
VN_CHAR_REGEX = re.compile(r'[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]', re.IGNORECASE)

# Bổ sung nghĩa cho một số từ bị thiếu trong file gốc
FALLBACK_MEANINGS = {
    'unacceptable': 'không thể chấp nhận được',
    'by accident': 'tình cờ, ngẫu nhiên',
    'actively': 'tích cực, hăng hái, hoạt bát',
    'activity': 'hoạt động, sự tích cực',
    'advertisement (also ad, advert)': 'quảng cáo, mục quảng cáo',
    'advertisement': 'quảng cáo, tờ quảng cáo',
    'affection': 'tình cảm, sự yêu mến, thiện cảm',
    'alarmed': 'lo sợ, hoảng hốt',
    'backwards (also backward especially in NAmE)': 'về phía sau, ngược lại',
    'behaviour (BrE) (NAmE behavior)': 'hành vi, cách cư xử',
    'give birth (to) sinh ra': 'sinh ra, sinh con',
    'give birth (to)': 'sinh ra, sinh con',
    'CD': 'đĩa CD, đĩa nén quang học',
    'DVD': 'đĩa DVD, đĩa kỹ thuật số đa năng',
    'non-': 'tiền tố: phi, không',
    '-ish': 'hậu tố: hơi có vẻ, mang tính chất',
    'Mr (BrE) (also Mr. NAmE, BrE)': 'ông, ngài (danh xưng nam giới)',
    'Mrs (BrE) (also Mrs. NAmE, BrE)': 'bà (phụ nữ đã lập gia đình)',
    'Ms (BrE) (also Ms. NAmE, BrE)': 'cô, bà (phụ nữ nói chung)',
    'self-': 'tiền tố: tự mình, bản thân',
    'a bit': 'một chút, một tí',
    'take care (of)': 'chăm sóc, giữ gìn',
    'in case (of)': 'phòng khi, trong trường hợp',
    'in charge of': 'phụ trách, chịu trách nhiệm',
    'deal with': 'giải quyết, đối phó với',
    'due to': 'do, tại vì, nhờ có',
    'each other': 'nhau, lẫn nhau',
    'find out sth': 'tìm ra, khám phá ra điều gì',
    'grow up': 'lớn lên, trưởng thành',
    'look after (especially BrE)': 'trông nom, chăm sóc',
    'look for': 'tìm kiếm',
    'look forward to': 'trông chờ, mong đợi',
    'make sure': 'chắc chắn, đảm bảo'
}

def extract_raw_rows(docx_path):
    with zipfile.ZipFile(docx_path) as z:
        xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    rows = tree.findall('.//w:tr', namespaces)

    raw_items = []
    for r in rows[1:]:
        cells = r.findall('.//w:tc', namespaces)
        if len(cells) < 2:
            continue
        stt = ''.join(cells[0].itertext()).strip()
        text = ''.join(cells[1].itertext()).strip()
        if text:
            raw_items.append((stt, text))
    return raw_items

def merge_broken_continuations(raw_items):
    merged = []
    known_continuations = [
        'chỉ', 'dẫn', 'ngược', 'chế', 'thiệt', 'vọng..)', 'mê', 'khiển', 'bại', 'đôi',
        'đảm', 'ngang', 'tiên,', 'phía', 'nghe', 'làm', 'đó', 'kéo', 'phép', 'chuộng',
        'dương', 'bày', 'học', 'kế', 'cuối', 'khỏi,', 'chú', 'hiện,', 'sự', 'thường',
        'phải', 'đạt', 'buồm', 'hoạch', 'về', 'sinh', 'trang', 'cách,', 'chia', 'mạnh,',
        'nam', 'chuẩn', 'quan', 'nghiên', 'nghiệm', 'nhọc;', 'phương', 'gan', 'toàn',
        'các', 'ngài,', 'cái'
    ]

    for stt, raw in raw_items:
        is_cont = False
        if merged:
            first_char = raw.strip()[:1]
            first_word = raw.strip().split()[0].lower()
            if (first_char in VN_CHAR_SET or 
                raw.strip().startswith(('(', ')', '+', '473')) or
                first_word in known_continuations):
                is_cont = True

        if is_cont:
            prev_stt, prev_raw = merged[-1]
            merged[-1] = (prev_stt, prev_raw + ' ' + raw)
        else:
            merged.append((stt, raw))
    return merged

def parse_entry(stt, raw_text, index):
    slash_match = re.search(r'/(.*?)/', raw_text)
    word = ''
    pos = ''
    phonetic = ''
    meaning = ''

    if slash_match:
        phonetic = f"/{slash_match.group(1).strip()}/"
        before = raw_text[:slash_match.start()].strip()
        after = raw_text[slash_match.end():].strip()

        pos_m = POS_PATTERN.search(before)
        if pos_m:
            word = before[:pos_m.start()].strip()
            pos = pos_m.group(1).strip()
        else:
            word = before.strip()
        meaning = after.strip()
    else:
        pos_m = POS_PATTERN.search(raw_text)
        if pos_m:
            word = raw_text[:pos_m.start()].strip()
            pos = pos_m.group(1).strip()
            after_pos = raw_text[pos_m.end():].strip()
            # Kiểm tra nếu sau POS có phiên âm sót slash
            m_phon = re.search(r'^(.*?/)\s*(.*)$', after_pos)
            if m_phon and not VN_CHAR_REGEX.search(m_phon.group(1)):
                phonetic = '/' + m_phon.group(1).lstrip('/')
                meaning = m_phon.group(2).strip()
            else:
                meaning = after_pos.strip()
        else:
            m_vn = VN_CHAR_REGEX.search(raw_text)
            if m_vn:
                cut_idx = m_vn.start()
                space_before = raw_text.rfind(' ', 0, cut_idx)
                if space_before != -1:
                    word = raw_text[:space_before].strip()
                    meaning = raw_text[space_before:].strip()
                else:
                    word = raw_text[:cut_idx].strip()
                    meaning = raw_text[cut_idx:].strip()
            else:
                word = raw_text.strip()
                meaning = ''

    # Làm sạch word
    word = word.strip().rstrip('.,;')
    # Kiểm tra fallback nghĩa nếu rỗng
    if not meaning or len(meaning) < 2:
        if word in FALLBACK_MEANINGS:
            meaning = FALLBACK_MEANINGS[word]
        elif word.lower() in FALLBACK_MEANINGS:
            meaning = FALLBACK_MEANINGS[word.lower()]

    # Làm sạch meaning
    meaning = meaning.strip().lstrip('.,;: -')

    return {
        'id': index,
        'stt': stt,
        'word': word,
        'pos': pos,
        'phonetic': phonetic,
        'meaning': meaning
    }

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Đang đọc file DOCX...")
    raw_items = extract_raw_rows(DOCX_FILE)
    print(f"Tổng số dòng ban đầu: {len(raw_items)}")

    merged_items = merge_broken_continuations(raw_items)
    print(f"Sau khi ghép các dòng bị cắt: {len(merged_items)}")

    parsed_words = []
    for idx, (stt, text) in enumerate(merged_items, start=1):
        parsed = parse_entry(stt, text, idx)
        parsed_words.append(parsed)

    # Chia thành các bộ bài học (Decks), mỗi bộ 30 từ
    WORDS_PER_DECK = 30
    decks = []
    total_words = len(parsed_words)
    num_decks = (total_words + WORDS_PER_DECK - 1) // WORDS_PER_DECK

    for d_idx in range(num_decks):
        start_i = d_idx * WORDS_PER_DECK
        end_i = min((d_idx + 1) * WORDS_PER_DECK, total_words)
        deck_words = parsed_words[start_i:end_i]
        
        first_w = deck_words[0]['word']
        last_w = deck_words[-1]['word']
        
        decks.append({
            'id': f"deck-{d_idx + 1}",
            'number': d_idx + 1,
            'title': f"Bài {d_idx + 1}",
            'subtitle': f"{first_w} → {last_w}",
            'wordCount': len(deck_words),
            'wordIds': [w['id'] for w in deck_words]
        })

    # Xuất ra JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(parsed_words, f, ensure_ascii=False, indent=2)
    print(f"Đã xuất {len(parsed_words)} từ vựng sang {OUTPUT_FILE}")

    with open(OUTPUT_DECKS, 'w', encoding='utf-8') as f:
        json.dump(decks, f, ensure_ascii=False, indent=2)
    print(f"Đã xuất {len(decks)} bài học (decks) sang {OUTPUT_DECKS}")

if __name__ == "__main__":
    main()
