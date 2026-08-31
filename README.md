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
📖 **Hướng dẫn Deploy Cloud 24/7:** [HUONG_DAN_DEPLOY.md](HUONG_DAN_DEPLOY.md)

---

## 🛠️ Danh sách Toàn bộ Tech Stack Hệ thống

### 🎨 1. Frontend Tech Stack (`smartrent-frontend/`)
| Công nghệ / Thư viện | Phiên bản | Vai trò trong hệ thống |
| :--- | :--- | :--- |
| **Next.js (App Router)** | `14.2.5` | Khung ứng dụng Web tối ưu SEO, Server-side Rendering & Client Components |
| **React** / **React-DOM** | `^18.3.1` | Thư viện UI cốt lõi xây dựng các component tương tác |
| **TypeScript** | `^5.5.3` | Ngôn ngữ định kiểu tĩnh, đảm bảo code chuẩn xác và an toàn |
| **TailwindCSS** | `^3.4.4` | Framework CSS tiện ích cho giao diện hiện đại, tinh gọn |
| **Lucide React** | `^0.395.0` | Bộ biểu tượng SVG hiện đại, tối ưu tốc độ tải trang |
| **Axios** | `^1.7.2` | Xử lý các yêu cầu HTTP API, tự động đính kèm Token xác thực |
| **js-cookie** | `^3.0.5` | Quản lý Cookie lưu trữ phiên đăng nhập an toàn |
| **React Hot Toast** | `^2.4.1` | Hệ thống popup thông báo trạng thái thao tác |
| **Recharts** | `^2.12.7` | Trực quan hóa dữ liệu và biểu đồ doanh thu dòng tiền |
| **HTML5 Canvas Particles** | Native | Hiệu ứng hạt lơ lửng Anti-gravity và chuyển động không trọng lực |
| **Mobile Drawer Navigation** | Custom | Menu trượt 3 gạch tối ưu trải nghiệm 100% trên điện thoại |

### ⚙️ 2. Backend Tech Stack (`smartrent-backend/`)
| Công nghệ / Thư viện | Phiên bản | Vai trò trong hệ thống |
| :--- | :--- | :--- |
| **FastAPI** | `>= 0.111.0` | Framework API bất đồng bộ (Async) tốc độ cao hàng đầu thế giới |
| **Uvicorn (ASGI)** | `>= 0.30.0` | Máy chủ web ASGI đa luồng phục vụ API và WebSockets |
| **Python** | `>= 3.10` (3.11+) | Ngôn ngữ lập trình xử lý logic backend |
| **SQLAlchemy (Async)** | `>= 2.0.30` | ORM quản lý dữ liệu và truy vấn bất đồng bộ |
| **SQLite (aiosqlite)** | `>= 0.20.0` | Cơ sở dữ liệu mặc định siêu nhẹ, sẵn sàng chạy ngay |
| **PostgreSQL (asyncpg)** | `>= 0.29.0` | Cơ sở dữ liệu quan hệ mạnh mẽ cho môi trường sản xuất lớn |
| **Pydantic v2** | `>= 2.7.0` | Kiểm tra định dạng dữ liệu và validate API Schemas |
| **python-jose** / **Passlib** | `>= 3.3.0` | Tạo JWT Token và băm mật khẩu chuẩn Bcrypt an toàn |
| **WebSockets** | Built-in | Kênh chat Realtime nhóm tòa nhà và tin nhắn riêng |
| **VietQR Engine** | `>= 7.4.2` | Sinh mã VietQR động theo chuẩn ISO 000201 tự động |
| **Pillow (PIL)** | `>= 10.3.0` | Xử lý ảnh công tơ điện nước và hóa đơn |
| **Docker** | Container | Đóng gói môi trường đồng nhất giữa Local và Cloud |

---

## 🔑 Tài khoản dùng thử (Demo Accounts)

| Vai trò | Số điện thoại | Mật khẩu | Mã phòng | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Chủ trọ / Quản trị** | `0901234567` | `smartrent123` | — | Quản lý tòa nhà, phòng, chốt hóa đơn, quản trị sự cố & chat |
| 🏠 **Cư dân / Người thuê** | `0912345001` | `tenant123` | `101` | Xem tiền phòng, quét VietQR, báo hỏng sự cố & chat chung |

---

## ⚡ Hướng dẫn Chạy trên máy tính (Local)

### 🚀 CÁCH 1: Khởi chạy 1-Click (Dành cho Windows)

1. **Cài đặt lần đầu:** Nhấp đúp vào file **`setup.bat`** *(Hệ thống tự tạo môi trường Python `venv`, cài `requirements.txt` và `npm install`)*.
2. **Khởi chạy ứng dụng:** Nhấp đúp vào file **`run_renteasy.vbs`** &rarr; Hệ thống tự động bật cả Backend & Frontend và mở trình duyệt tại `http://localhost:3000`.

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
│   ├── src/                # App Router, Components, Libs
│   ├── public/             # Logo thương hiệu REASY & Tài nguyên tĩnh
│   ├── package.json        # Danh sách thư viện Node.js
│   └── README.md           # Tài liệu chi tiết Frontend
├── setup.bat               # Script 1-Click tự động cài đặt môi trường
├── run_renteasy.vbs        # Script 1-Click khởi chạy toàn bộ hệ thống
├── kill_servers.bat        # Script dọn dẹp và giải phóng cổng 3000/8000
├── HUONG_DAN_DEPLOY.md     # Cẩm nang hướng dẫn Deploy Cloud 24/7
└── README.md               # Tài liệu tổng quan dự án
```