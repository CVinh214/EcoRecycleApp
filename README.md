# DaLat-Hallym

## Website (AWS EC2)
http://13.250.137.25:5000/

## Prototype (Figma)
https://www.figma.com/make/pKNhnnHiiBFu3kXOC7cvG9/Main-Dashboard-UI-Design?t=Hh4wXIBqf9ZgBezD-1

---

# 🌱 Eco Recycling App

---

## 🇻🇳 Hướng dẫn cài đặt (Tiếng Việt)

### Yêu cầu hệ thống
- Node.js phiên bản 18 trở lên
- npm (đi kèm với Node.js)

### Các bước cài đặt

**Bước 1:** Clone repository về máy
```bash
git clone https://github.com/CVinh214/EcoRecycleApp.git
cd DaLat-Hallym
```

**Bước 2:** Cài đặt các thư viện
```bash
npm install
```

**Bước 3:** Tạo file cấu hình môi trường
```bash
cp .env.example .env
```

**Bước 4:** Điền API key vào file `.env`
```
VITE_GEMINI_API_KEY=your_api_key_here
```
> ⚠️ **Lưu ý:** Liên hệ trưởng nhóm để nhận API key

**Bước 5:** Chạy ứng dụng
```bash
npm run dev
```

**Bước 6:** Mở trình duyệt và truy cập
```
http://localhost:5173
```

### Các lệnh hữu ích
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy server phát triển |
| `npm run build` | Build ứng dụng cho production |

---

## 🇰🇷 설치 가이드 (한국어)

### 시스템 요구 사항
- Node.js 버전 18 이상
- npm (Node.js와 함께 제공됨)

### 설치 단계

**1단계:** 저장소 복제
```bash
git clone https://github.com/CVinh214/EcoRecycleApp.git
cd DaLat-Hallym
```

**2단계:** 라이브러리 설치
```bash
npm install
```

**3단계:** 환경 설정 파일 생성
```bash
cp .env.example .env
```

**4단계:** `.env` 파일에 API 키 입력
```
VITE_GEMINI_API_KEY=your_api_key_here
```
> ⚠️ **참고:** API 키는 팀 리더에게 문의하세요

**5단계:** 애플리케이션 실행
```bash
npm run dev
```

**6단계:** 브라우저에서 접속
```
http://localhost:5173
```

### 유용한 명령어
| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션용 빌드 |

---

## 📁 Cấu trúc dự án / 프로젝트 구조

```
src/
├── components/     # React components
├── contexts/       # State management (Context API)
├── services/       # API services (AI, User data)
└── styles/         # Global styles
```

---

## 🔒 Bảo mật / 보안

- **KHÔNG** commit file `.env` lên GitHub
- `.env` 파일을 GitHub에 커밋하지 **마세요**


