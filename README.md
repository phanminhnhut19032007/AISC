# 🏠 REASY — Nền tảng Quản lý Chuỗi Trọ Thông Minh

> Hệ thống số hóa quản lý phòng trọ, căn hộ mini và dịch vụ cư dân hiện đại với **FastAPI**, **Next.js 14**, **SQLite/PostgreSQL**, tích hợp **VietQR tự động**, **Báo cáo sự cố Realtime**, và **Kênh Chat chung tòa nhà**.

🌐 **Website Trực tuyến (Live Demo):** [https://aisc-delta.vercel.app](https://aisc-delta.vercel.app)  
⚙️ **Backend API (Swagger Docs):** [https://aisc-1.onrender.com/docs](https://aisc-1.onrender.com/docs)

---

## 🔑 Tài khoản dùng thử (Demo Accounts)

| Vai trò | Số điện thoại | Mật khẩu | Mã phòng | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Chủ trọ / Quản lý** | `0901234567` | `smartrent123` | — | Quản lý tòa nhà, phòng, chốt số & doanh thu |
| 🏠 **Cư dân / Người thuê** | `0912345001` | `tenant123` | `101` | Xem hóa đơn, quét VietQR, báo sự cố & chat |

---

## 💻 Hướng dẫn Cài đặt & Chạy trên máy tính (Local)

### 📋 Yêu cầu hệ thống:
* **Node.js** (Phiên bản >= 18): [Tải tại nodejs.org](https://nodejs.org)
* **Python** (Phiên bản >= 3.10): [Tải tại python.org](https://python.org)

---

### ⚡ CÁCH 1: Khởi chạy 1-Click (Dành cho Windows)

1. Tải hoặc Clone mã nguồn về máy tính:
   ```bash
   git clone https://github.com/phanminhnhut19032007/AISC.git
   cd AISC
   ```
2. **Cài đặt lần đầu:** Nhấp đúp vào file **`setup.bat`** *(Hệ thống sẽ tự động cài đặt toàn bộ thư viện Python & Node.js)*.
3. **Khởi chạy ứng dụng:** Nhấp đúp vào file **`run_renteasy.vbs`** &rarr; Trình duyệt sẽ tự động mở trang web tại `http://localhost:3000`!

---

### 🛠️ CÁCH 2: Khởi chạy thủ công bằng dòng lệnh

#### 1. Khởi động Backend (FastAPI - Cổng 8000)
```bash
cd smartrent-backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 2. Khởi động Frontend (Next.js - Cổng 3000)
Mở một cửa sổ Terminal mới:
```bash
cd smartrent-frontend
npm install
npm run dev
```

Truy cập trình duyệt tại: **`http://localhost:3000`**

---

## 🏗️ Cấu trúc thư mục

```
AISC/
├── smartrent-backend/       # Server API (FastAPI, SQLAlchemy, SQLite/PostgreSQL)
│   ├── app/                # Mã nguồn API v1, Schemas, Models, Services
│   ├── requirements.txt    # Danh sách thư viện Python
│   ├── Dockerfile          # Cấu hình container Cloud
│   └── render.yaml         # Blueprint Deploy Render.com
├── smartrent-frontend/      # Giao diện Web (Next.js 14 App Router, TailwindCSS)
│   ├── src/app/            # Các trang Dashboard, Invoices, Tickets, Chat, Login
│   ├── public/             # Tài nguyên Logo và hình ảnh
│   └── package.json        # Cấu hình dự án Node.js
├── setup.bat               # Script tự động cài đặt môi trường 1-Click
├── run_renteasy.vbs        # Script 1-Click khởi chạy toàn bộ hệ thống
└── kill_servers.bat        # Script dọn dẹp và giải phóng cổng 3000 & 8000
```