<div align="center">

# 🚀 TOEIC 3000 Smart Flashcards & Spaced Repetition (PWA)

### Intelligent English Vocabulary Learning PWA with Cross-Device Cloud Sync, Optimized for Mobile (iOS Native-Feel)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vite-react-six-eta-55.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[**🌐 Live Demo**](https://vite-react-six-eta-55.vercel.app) • [**✨ Features**](#-key-features) • [**🛠️ Architecture**](#-architecture--tech-stack) • [**🚀 Getting Started**](#-getting-started) • [**🇻🇳 Tiếng Việt**](#-phiên-bản-tiếng-việt)

</div>

---

## 📖 English Overview

**TOEIC 3000 Flashcards** is a modern Progressive Web App (PWA) built specifically for memorizing English vocabulary efficiently using evidence-based cognitive science.

The application comes pre-bundled with **3,529 curated TOEIC words**, organized into **118 thematic decks**, alongside dedicated decks for **Phrasal Verbs** and **Collocations**. It integrates the proven **SuperMemo SM-2 Spaced Repetition System (SRS)** to calculate optimal review intervals, maximizing long-term retention while minimizing required daily study time.

---

## ✨ Key Features

### 🎴 1. 3D Flashcards & Native Touch Gestures
- **Smooth 3D Flip Card:** Displays word, IPA phonetic transcription, part of speech, Vietnamese translation, and real-world example sentences.
- **Intuitive Swipe Gestures:** Swipe right for known words (*Good / Easy*) and swipe left for forgotten words (*Again*).
- **Flexible Navigation:** One-tap "Previous Word" button to review earlier cards anytime.
- **Natural Web Speech TTS:** Automatic pronunciation with customizable accents (US `en-US` or UK `en-GB`) and adjustable playback speeds (`0.8x` - `1.0x`).

### 🧠 2. SuperMemo SM-2 Spaced Repetition Algorithm
- Automatically calculates review intervals based on user feedback: **Again**, **Hard**, **Good**, **Easy**.
- Categorizes mastery into three stages: *New*, *Learning*, and *Mastered*.
- Filters words due for review today to help maintain daily learning streaks.

### ☁️ 3. Cross-Device Cloud Sync (Supabase Offline-First)
- **Offline-First Architecture:** Study and import custom vocabularies completely offline; data auto-syncs with the cloud whenever an internet connection is available.
- **Enterprise Security (Row Level Security - RLS):** Each user's study progress and custom decks are isolated and protected.
- Seamless sync between iPhones, Android devices, and desktop browsers.

### 📥 4. Universal Smart Vocabulary Importer
- Import vocabulary from `.docx`, `.csv`, `.tsv`, `.txt`, `.json`, or directly paste raw text.
- **Smart Parser:** Automatically detects and skips numerical index columns (STT), filters table header lines, and ignores section dividers.
- **Auto-Chunking:** Automatically splits large word lists (>50 words) into manageable sub-decks to avoid cognitive overload.

### 📱 5. Tailored for iPhone 13 & Mobile Devices (PWA)
- Full support for iOS **Safe Area Insets** (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`), preventing any notch or home-bar overlap.
- Add to Home Screen support for an edge-to-edge, distraction-free native app experience without browser URL bars.

### 📝 6. Comprehensive Quiz Engine
- **3 Practice Modes:** 
  - English $\rightarrow$ Vietnamese
  - Vietnamese $\rightarrow$ English
  - Listening $\rightarrow$ Word selection
- Instant score summaries and progress tracking after every session.

---

## 🛠️ Architecture & Tech Stack

```
flash-card/
├── public/                 # Static assets, PWA icons, manifest.json
├── scripts/
│   └── extract_vocab.py    # Python ETL pipeline (DOCX -> Clean structured JSON)
├── src/
│   ├── components/         # Modular React Components
│   │   ├── AuthModal.tsx       # Supabase Cloud Authentication Modal
│   │   ├── DeckListView.tsx    # Decks catalog, filters & importer trigger
│   │   ├── DictionaryView.tsx  # Instant search & POS classification filter
│   │   ├── FlashcardView.tsx   # 3D interactive flashcard with swipe gestures
│   │   ├── Header.tsx          # Safe-area header with streak & sync status
│   │   ├── ImportModal.tsx     # Multi-format universal importer
│   │   ├── Navbar.tsx          # iOS-style bottom tab bar
│   │   ├── QuizView.tsx        # 3-mode multiple choice & audio quiz
│   │   └── StatsView.tsx       # TTS settings, analytics & manual backup
│   ├── data/
│   │   ├── decks.json          # 118 structured thematic decks
│   │   └── vocabulary.json     # 3,529 TOEIC vocabulary entries
│   ├── services/
│   │   ├── db.ts               # LocalStorage abstraction & caching layer
│   │   ├── importer.ts         # Multi-format parsing & text processing engine
│   │   ├── srs.ts              # SuperMemo SM-2 spaced repetition algorithm
│   │   ├── supabase.ts         # Supabase client SDK
│   │   ├── syncService.ts      # Bi-directional cloud synchronization
│   │   └── tts.ts              # Web Speech Synthesis API wrapper
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces & types
│   ├── App.tsx             # Application root
│   └── main.tsx            # Application entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or later
- **npm**, **yarn**, or **pnpm**

### Installation
```bash
# 1. Clone repository
git clone https://github.com/<your-username>/flash-card.git
cd flash-card

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Edit .env and supply your Supabase credentials
```

### Development
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

---

<br/>

---

## 🇻🇳 Phiên Bản Tiếng Việt

<details open>
<summary><b>Bấm để xem nội dung Tiếng Việt chi tiết</b></summary>

### 📖 Giới Thiệu
**TOEIC 3000 Flashcards** là ứng dụng web cấp tiến (PWA) được thiết kế tối ưu cho điện thoại di động (đặc biệt là iPhone 13) và máy tính, phục vụ việc ôn luyện và ghi nhớ từ vựng tiếng Anh theo phương pháp khoa học.

Ứng dụng tích hợp sẵn kho dữ liệu **3.529 từ vựng TOEIC chuẩn**, chia thành **118 chủ đề**, cùng các chuyên đề đặc biệt như **Phrasal Verbs** và **Collocations**. Ứng dụng áp dụng thuật toán **SuperMemo SM-2 (Spaced Repetition System)** giúp tối ưu hóa khả năng ghi nhớ dài hạn với thời gian học ngắn nhất mỗi ngày.

### ✨ Các Tính Năng Chính
1. **Flashcard 3D & Cử chỉ vuốt:** Lật thẻ trực quan, vuốt sang phải khi thuộc, vuốt sang trái khi quên, có nút quay lại từ trước và phát âm chuẩn giọng Anh/Mỹ.
2. **Thuật toán Spaced Repetition (SM-2):** Tự động lên lịch ôn tập thông minh (Again, Hard, Good, Easy), phân loại tiến độ thành *Chưa học*, *Đang học* và *Thành thạo*.
3. **Đồng bộ Đám mây (Supabase):** Kiến trúc Offline-First, học offline mượt mà và tự động đồng bộ 2 chiều giữa iPhone và Máy tính qua Supabase PostgreSQL.
4. **Bộ nhập dữ liệu thông minh:** Kéo thả file `.docx`, `.csv`, `.txt`, `.json` hoặc dán văn bản; tự động bỏ qua cột STT, loại bỏ dòng rác và tự chia nhỏ bộ từ lớn (>50 từ) thành các phần vừa học.
5. **Tối ưu chuẩn iPhone 13:** Xử lý triệt để Safe Area Insets (không bị tai thỏ hay thanh Home che nút), hỗ trợ Add to Home Screen chạy toàn màn hình.
6. **Luyện tập Quiz đa dạng:** Trắc nghiệm 3 chế độ (Anh $\rightarrow$ Việt, Việt $\rightarrow$ Anh, Nghe chọn từ).

### 📱 Hướng Dẫn Cài Đặt Lên iPhone
1. Mở trình duyệt **Safari** trên iPhone và truy cập: [https://vite-react-six-eta-55.vercel.app](https://vite-react-six-eta-55.vercel.app)
2. Bấm nút **Chia sẻ (Share)** ở thanh công cụ dưới đáy Safari.
3. Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. App sẽ xuất hiện ngoài màn hình iPhone với icon riêng, mở lên học mượt mà toàn màn hình!

</details>

---

## 📄 License

This project is licensed under the **MIT License**.