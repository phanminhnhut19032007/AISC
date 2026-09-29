# 🏠 REASY — Nền tảng Quản lý Chuỗi Trọ Thông Minh Thế Hệ Mới

<div align="center">
  <img src="smartrent-frontend/public/logo.jpg" alt="REASY Logo" width="220" />
  <p><strong>Số hóa toàn diện quản lý phòng trọ, căn hộ mini và kết nối cộng đồng cư dân 4.0</strong></p>

  [![Vercel](https://img.shields.io/badge/Frontend-Vercel%20Live-black?style=for-the-badge&logo=vercel)](https://aisc-delta.vercel.app)
  [![Render](https://img.shields.io/badge/Backend-Render%20Live-46E3B7?style=for-the-badge&logo=render)](https://aisc-1.onrender.com/docs)
  [![Next.js](https://img.shields.io/badge/Next.js-14.2-blue?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
</div>

---

🌐 **Website Trực tuyến (Live Demo):** [https://aisc-delta.vercel.app](https://aisc-delta.vercel.app)  
⚙️ **Backend API (Swagger Docs):** [https://aisc-1.onrender.com/docs](https://aisc-1.onrender.com/docs)  
🛡️ **Cổng Quản trị Duyệt KYC:** [https://aisc-delta.vercel.app/admin/kyc](https://aisc-delta.vercel.app/admin/kyc)  
📖 **Hướng dẫn Deploy Cloud 24/7:** [HUONG_DAN_DEPLOY.md](HUONG_DAN_DEPLOY.md)

---

## 🛠️ Danh sách Công cụ & Tech Stack Toàn diện

### 🎨 1. Frontend Architecture (`smartrent-frontend/`)
| Công nghệ / Công cụ | Phiên bản | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| **Next.js (App Router)** | `14.2.5` | Framework React tối tân, Server-Side Rendering (SSR), Static Generation & API Route handling |
| **React** / **React-DOM** | `^18.3.1` | Thư viện UI cốt lõi, cơ chế Virtual DOM tối ưu và reactive state management |
| **TypeScript** | `^5.5.3` | Ngôn ngữ định kiểu tĩnh, kiểm soát an toàn type-safe xuyên suốt ứng dụng |
| **TailwindCSS** | `^3.4.4` | Framework CSS tiện ích, thiết kế giao diện Glassmorphism và Mobile-first Responsive |
| **Lucide React** | `^0.395.0` | Bộ icon SVG chuẩn hóa hiện đại, tối ưu dung lượng tải trang |
| **Axios** | `^1.7.2` | HTTP Client xử lý gọi RESTful API, tự động gắn JWT Bearer Token qua Interceptors |
| **js-cookie** | `^3.0.5` | Quản lý Cookie lưu trữ phiên xác thực Token an toàn |
| **React Hot Toast** | `^2.4.1` | Hệ thống popup thông báo trạng thái realtime mượt mà |
| **Recharts** | `^2.12.7` | Trực quan hóa dữ liệu, biểu đồ doanh thu dòng tiền và tỷ lệ lấp đầy phòng |
| **HTML5 Canvas Animation** | Native API | Hiệu ứng nền Aurora chuyển động lượn sóng và hạt nổi tương tác động |
| **Google Identity Services** | OAuth 2.0 | Tích hợp đăng nhập nhanh 1-Click bằng tài khoản Google |

---

### ⚙️ 2. Backend & Core Services (`smartrent-backend/`)
| Công nghệ / Công cụ | Phiên bản | Vai trò & Mục đích sử dụng |
| :--- | :--- | :--- |
| **FastAPI** | `>= 0.111.0` | Framework RESTful API bất đồng bộ (Asynchronous) hiệu năng cao dựa trên Starlette & Pydantic |
| **Uvicorn (ASGI Engine)** | `>= 0.30.0` | Máy chủ web ASGI đa luồng phục vụ các kết nối đồng thời và WebSockets |
| **Python** | `>= 3.11` | Ngôn ngữ lập trình xử lý logic nghiệp vụ và mô hình AI |
| **SQLAlchemy 2.0 (Async)** | `>= 2.0.30` | ORM quản lý thực thể cơ sở dữ liệu với cú pháp async/await |
| **SQLite (aiosqlite)** | `>= 0.20.0` | Cơ sở dữ liệu mặc định siêu nhẹ cho môi trường Local / Demo |
| **PostgreSQL (asyncpg)** | `>= 0.29.0` | Hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ cho môi trường Cloud Production |
| **Pydantic v2** | `>= 2.7.0` | Data validation, tự động sinh tài liệu Swagger UI & OpenAPI Specification |
| **python-jose** / **Passlib** | `>= 3.3.0` | Mã hóa bảo mật JSON Web Token (JWT) và băm mật khẩu Bcrypt |
| **WebSockets** | Built-in | Kênh giao tiếp hai chiều Realtime phục vụ phòng Chat nhóm tòa nhà và tin nhắn tức thời |
| **Pillow (PIL)** | `>= 10.3.0` | Xử lý và tiền xử lý hình ảnh chụp công tơ điện, nước và giấy tờ tùy thân |

---

### 🧠 3. AI & Tích hợp Dịch vụ Thông minh
| Công cụ / Dịch vụ | Loại hình | Vai trò & Tính năng |
| :--- | :--- | :--- |
| **AI OCR Vision Engine** | AI / Thị giác máy tính | Tự động đọc chỉ số công tơ điện/nước từ ảnh chụp $\rightarrow$ Tự tính kWh/m³ tiêu thụ |
| **CCCD & KYC Document OCR** | AI / Nhận dạng ký tự | Tự động trích xuất số định danh cá nhân 12 số trên thẻ CCCD gắn chip |
| **VietQR Dynamic Engine** | Payment Gateway | Tự động sinh mã VietQR chuẩn NAPAS 24/7 theo số tiền và mã hóa đơn chính xác |
| **SMS OTP Service** | Xác thực viễn thông | Gửi mã xác thực 6 chữ số qua SMS khi đăng ký số điện thoại mới |

---

### ☁️ 4. DevOps & Hạ tầng Triển khai (Infrastructure)
| Công cụ / Nền tảng | Vai trò |
| :--- | :--- |
| **Vercel Edge Network** | Hosting Frontend Next.js 14, tự động CI/CD từ GitHub repo, CDN toàn cầu |
| **Render.com Cloud** | Hosting Backend FastAPI & WebSockets với môi trường Docker Container |
| **Docker** | Containerization, đóng gói đồng nhất ứng dụng và các dependencies |
| **Git / GitHub** | Quản lý phiên bản mã nguồn, quy trình branching và tự động hóa |

---

## 🔑 Tài khoản Dùng thử (Demo Accounts)

Hệ thống phân định **3 vai trò tách biệt rõ ràng**:

| Vai trò | Số điện thoại | Mật khẩu | Mã phòng / Mã tòa | Quyền hạn & Cổng truy cập |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Quản trị viên Hệ thống (Admin)** | `0388430402` | `MinhNhut2007` | — | Toàn quyền quản trị, thẩm định CCCD/Sổ hồng và duyệt **Tích Xanh KYC** tại [`/admin/kyc`](https://aisc-delta.vercel.app/admin/kyc). |
| 🏢 **Chủ trọ (Quản lý phòng)** | `0388430402` | `MinhNhut1` | — | Quản lý tòa nhà, phòng trọ, chốt hóa đơn, nộp hồ sơ KYC (không có quyền admin). |
| 👥 **Cư dân / Người thuê** | `0388430402` | `MinhNhut2` | `P101A` / `MC892` | Xem hóa đơn tiền phòng, quét mã VietQR, báo hỏng sự cố & mua gói UniPack. |

---

## ⚡ Hướng dẫn Khởi chạy trên máy tính (Local)

### 🚀 CÁCH 1: Khởi chạy 1-Click (Dành cho Windows)
1. **Cài đặt môi trường:** Nhấp đúp vào file **`setup.bat`** *(Tự tạo Python `venv`, cài `requirements.txt` và `npm install`)*.
2. **Khởi chạy ứng dụng:** Nhấp đúp vào file **`run_renteasy.vbs`** $\rightarrow$ Tự động bật Backend (Port 8000), Frontend (Port 3000) và mở trình duyệt.

---

### 🛠️ CÁCH 2: Khởi chạy thủ công từng phần

#### 1. Backend (FastAPI):
```bash
cd smartrent-backend
python -m venv venv
# Kích hoạt venv (Windows: .\venv\Scripts\activate | Linux/macOS: source venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 2. Frontend (Next.js):
```bash
cd smartrent-frontend
npm install
npm run dev
```

Truy cập: **`http://localhost:3000`**

---

## 📂 Cấu trúc Repository

```
AISC/
├── smartrent-backend/       # Mã nguồn Server API FastAPI & Database
│   ├── app/                # Routers, Schemas, Models, Services
│   ├── requirements.txt    # Danh sách thư viện Python
│   ├── Dockerfile          # Cấu hình container Cloud
│   ├── render.yaml         # Blueprint Deploy Render.com
│   └── README.md           # Tài liệu chi tiết Backend
├── smartrent-frontend/      # Mã nguồn Giao diện Web Next.js 14
│   ├── src/                # App Router (/admin, /dashboard, /login,...), Components
│   ├── public/             # Logo thương hiệu REASY & Tài nguyên tĩnh
│   ├── package.json        # Danh sách thư viện Node.js
│   └── README.md           # Tài liệu chi tiết Frontend
├── setup.bat               # Script 1-Click tự động cài đặt môi trường
├── run_renteasy.vbs        # Script 1-Click khởi chạy toàn bộ hệ thống
├── kill_servers.bat        # Script dọn dẹp và giải phóng cổng 3000/8000
├── HUONG_DAN_DEPLOY.md     # Cẩm nang hướng dẫn Deploy Cloud 24/7
└── README.md               # Tài liệu tổng quan dự án
```