<div align="center">

# 🚀 TOEIC 3000 Smart Flashcards & Spaced Repetition (PWA)

### Ứng dụng học từ vựng tiếng Anh thông minh, đồng bộ đa thiết bị, tối ưu hóa cho di động (Mobile-First / iOS PWA)

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vite-react-six-eta-55.vercel.app)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[**Trải Nghiệm Trực Tiếp (Live Demo)**](https://vite-react-six-eta-55.vercel.app) • [**Tính Năng Chính**](#-tính-năng-nổi-bật) • [**Kiến Trúc Kỹ Thuật**](#-kiến-trúc--công-nghệ) • [**Cài Đặt & Phát Triển**](#-cài-đặt--chạy-dự-án)

</div>

---

## 📖 Giới Thiệu Tổng Quan

**TOEIC 3000 Flashcards** là ứng dụng web cấp tiến (Progressive Web App - PWA) được thiết kế chuyên biệt nhằm phục vụ việc ôn luyện và ghi nhớ từ vựng tiếng Anh theo phương pháp khoa học.

Dự án tích hợp sẵn kho dữ liệu **3.529 từ vựng TOEIC chuẩn**, chia thành **118 chủ đề/bộ từ**, cùng các chuyên đề đặc biệt như **Phrasal Verbs** và **Collocations**. Ứng dụng áp dụng thuật toán lặp lại ngắt quãng **SuperMemo SM-2 (Spaced Repetition System)**, cho phép tối đa hóa khả năng ghi nhớ dài hạn với thời gian học ngắn nhất mỗi ngày.

---

## ✨ Tính Năng Nổi Bật

### 🎴 1. Trải Nghiệm Flashcard 3D & Cử Chỉ Vuốt Native
- **Lật thẻ 3D trực quan:** Hiển thị từ vựng, phiên âm quốc tế IPA, loại từ và nghĩa tiếng Việt kèm câu ví dụ thực tế.
- **Cử chỉ cảm ứng mượt mà (Touch Gestures):** Hỗ trợ vuốt sang phải khi thuộc từ (*Good/Easy*) hoặc vuốt sang trái khi quên (*Again*).
- **Điều hướng linh hoạt:** Hỗ trợ nút quay lại từ trước (*Previous Word*) để người học xem lại bất cứ lúc nào.
- **Tích hợp Web Speech Audio:** Tự động phát âm chuẩn xác với tùy chọn giọng Anh - Mỹ (`en-US`) hoặc Anh - Anh (`en-GB`), điều chỉnh tốc độ đọc linh hoạt (`0.8x` - `1.0x`).

### 🧠 2. Thuật Toán Lặp Lại Ngắt Quãng (SuperMemo SM-2)
- Tự động tính toán chu kỳ ôn tập dựa trên mức độ đánh giá: **Quên (Again)**, **Khó (Hard)**, **Tốt (Good)**, **Dễ (Easy)**.
- Phân loại tiến độ học tập thành 3 trạng thái rõ ràng: *Chưa học (New)*, *Đang học (Learning)*, *Đã thành thạo (Mastered)*.
- Lọc danh sách từ đến hạn ôn tập trong ngày (*Due Words*) để nhắc nhở người học duy trì chuỗi học tập (Streak).

### ☁️ 3. Đồng Bộ Đa Thiết Bị Thời Gian Thực (Supabase Cloud Sync)
- **Kiến trúc Offline-First:** Học và thêm từ mượt mà ngay cả khi không có mạng; dữ liệu tự động đồng bộ lên máy chủ khi có kết nối trở lại.
- **Bảo mật cấp độ cao (Row Level Security - RLS):** Đảm bảo an toàn tuyệt đối cho dữ liệu cá nhân của từng người dùng.
- Đồng bộ liền mạch tiến độ học giữa Điện thoại (iPhone/Android) và Máy tính (PC/Laptop).

### 📥 4. Bộ Đọc Dữ Liệu Thông Minh (Universal Vocabulary Importer)
- Cho phép người dùng kéo thả file `.docx`, `.csv`, `.tsv`, `.txt`, `.json` hoặc dán trực tiếp danh sách từ vựng thô vào app.
- **Thuật toán bóc tách thông minh:** Tự động phát hiện và bỏ qua cột số thứ tự (STT), loại bỏ dòng tiêu đề và phân mục rác.
- **Tự động chia nhỏ (Auto-Chunking):** Danh sách từ vựng số lượng lớn (>50 từ) tự động được chia nhỏ thành các bộ thẻ vừa vặn để việc học không bị quá tải.

### 📱 5. Tối Ưu Hóa Riêng Cho iPhone 13 & Thiết Bị Di Động
- Hỗ trợ đầy đủ tiêu chuẩn **Safe Area Insets** (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`), không bao giờ bị tai thỏ (Notch) hay thanh vuốt Home che khuất.
- Cài đặt dạng PWA (Thêm vào Màn hình chính / Add to Home Screen) chạy độc lập toàn màn hình như native app, không hiển thị thanh địa chỉ trình duyệt.

### 📝 6. Hệ Thống Kiểm Tra Trắc Nghiệm Đa Dạng (Quiz Mode)
- **3 Chế độ kiểm tra:** 
  - Tiếng Anh $\rightarrow$ Tiếng Việt.
  - Tiếng Việt $\rightarrow$ Tiếng Anh.
  - Nghe phát âm $\rightarrow$ Đoán từ vựng.
- Tự động tổng kết kết quả học tập và hiển thị mức độ tiến bộ sau mỗi bài quiz.

---

## 🚀 Cài Đặt & Chạy Dự Án

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản 18 trở lên.
- **npm** hoặc **yarn** / **pnpm**.

### 1. Clone dự án và cài đặt dependencies
```bash
git clone https://github.com/<your-username>/flash-card.git
cd flash-card
npm install
```

### 2. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc của dự án:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Khởi chạy môi trường phát triển (Development)
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`

### 4. Build bản sản phẩm (Production)
```bash
npm run build
```

---

## 🌐 Hướng Dẫn Cài Đặt Lên iPhone (PWA)

1. Mở trình duyệt **Safari** trên iPhone và truy cập: [https://vite-react-six-eta-55.vercel.app](https://vite-react-six-eta-55.vercel.app)
2. Bấm vào nút **Chia sẻ (Share)** (biểu tượng hình vuông có mũi tên chỉ lên ở thanh công cụ phía dưới).
3. Cuộn danh sách xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Đặt tên hiển thị (ví dụ: `TOEIC 3000`) và bấm **Thêm (Add)**.
5. Biểu tượng ứng dụng sẽ xuất hiện trên màn hình iPhone, sẵn sàng sử dụng toàn màn hình không viền URL!

---

## 📄 Bản Quyền & Giấy Phép

Dự án được xây dựng và phát triển dưới giấy phép **MIT License**.