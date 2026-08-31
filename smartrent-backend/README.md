# 🏠 REASY Backend — RESTful API & Realtime WebSocket Server

> Hệ thống máy chủ API hiệu năng cao cho nền tảng quản lý nhà trọ và căn hộ mini **REASY**, xây dựng trên nền tảng **FastAPI (Python 3.11+)**, hỗ trợ cơ sở dữ liệu **SQLite / PostgreSQL**, xác thực bảo mật **JWT**, **WebSocket Realtime Chat**, và tích hợp **VietQR chuẩn ngân hàng**.

🌐 **API Docs (Swagger UI):** [https://aisc-1.onrender.com/docs](https://aisc-1.onrender.com/docs)  
📖 **API Redoc:** [https://aisc-1.onrender.com/redoc](https://aisc-1.onrender.com/redoc)

---

## 🛠️ Danh sách Tech Stack Backend

| Hạng mục | Công nghệ / Thư viện | Phiên bản | Mục đích sử dụng |
| :--- | :--- | :--- | :--- |
| **Core Framework** | `FastAPI` | `>= 0.111.0` | Khung ứng dụng API bất đồng bộ (Async), tốc độ cao |
| **ASGI Server** | `Uvicorn[standard]` | `>= 0.30.0` | Máy chủ ASGI chạy ứng dụng FastAPI đa luồng |
| **Ngôn ngữ** | `Python` | `>= 3.10` (Khuyên dùng 3.11+) | Ngôn ngữ lập trình chính |
| **Database ORM** | `SQLAlchemy (Async)` | `>= 2.0.30` | Object Relational Mapper xử lý truy vấn bất đồng bộ |
| **Database Migration** | `Alembic` | `>= 1.13.0` | Quản lý phiên bản cấu trúc cơ sở dữ liệu |
| **Database Drivers** | `aiosqlite` / `asyncpg` | `>= 0.20.0` | Driver kết nối SQLite và PostgreSQL async |
| **Data Validation** | `Pydantic v2` / `Pydantic-Settings` | `>= 2.7.0` | Kiểm tra định dạng dữ liệu đầu vào/ra và biến môi trường |
| **Bảo mật & Auth** | `python-jose[cryptography]` | `>= 3.3.0` | Tạo và giải mã JSON Web Tokens (JWT) |
| **Mã hóa mật khẩu** | `passlib[bcrypt]` | `>= 1.7.4` | Băm và bảo mật mật khẩu người dùng chuẩn Bcrypt |
| **Giao tiếp Realtime** | `FastAPI WebSockets` | Built-in | Chat nhóm chung tòa nhà và nhắn tin riêng cư dân |
| **Thanh toán & QR** | `VietQR Engine` / `qrcode[pil]` | `>= 7.4.2` | Sinh chuỗi và mã VietQR chuẩn NAPAS tự động theo số tiền |
| **Xử lý ảnh & OCR** | `Pillow (PIL)` | `>= 10.3.0` | Xử lý ảnh chụp công tơ điện nước |
| **HTTP Client** | `httpx` | `>= 0.27.0` | Gửi request HTTP async cho webhook và dịch vụ ngoài |
| **Container & Cloud** | `Docker` / `Render Blueprint` | Latest | Đóng gói container và tự động triển khai lên Render.com |

---

## 📂 Cấu trúc thư mục Backend

```
smartrent-backend/
├── app/
│   ├── main.py                    # Điểm khởi động FastAPI, CORS & Database Lifespan
│   ├── api/
│   │   ├── deps.py                # Dependencies phân quyền (get_current_user, require_role)
│   │   └── v1/
│   │       ├── router.py          # Tổng hợp router v1
│   │       ├── auth.py            # API Đăng ký / Đăng nhập / Lấy thông tin cá nhân
│   │       ├── buildings.py       # API Quản lý Tòa nhà & Phòng
│   │       ├── invoices.py        # API Tạo, Xem & Chốt Hóa đơn dịch vụ
│   │       ├── meter_readings.py  # API Ghi chỉ số Điện & Nước
│   │       ├── tickets.py         # API Quản lý Sự cố & Báo trì
│   │       ├── chat.py            # API Lịch sử chat & WebSocket Realtime Server
│   │       ├── webhooks.py        # Webhook nhận kết quả thanh toán tự động (SePay/Casso)
│   │       └── ocr.py             # API Nhận diện chỉ số đồng hồ
│   ├── core/
│   │   ├── config.py              # Cấu hình biến môi trường & CORS
│   │   ├── database.py            # Khởi tạo SQLAlchemy Engine & Auto-seed
│   │   └── security.py            # Xử lý băm Bcrypt & sinh JWT token
│   ├── models/                    # Khai báo cấu trúc bảng cơ sở dữ liệu
│   │   ├── user.py                # Bảng Users (OWNER, TENANT, TECHNICIAN, SUPERADMIN)
│   │   ├── building.py            # Bảng Buildings & Rooms
│   │   ├── contract.py            # Bảng Contracts (Hợp đồng thuê)
│   │   ├── invoice.py             # Bảng Invoices, MeterReadings & Payments
│   │   ├── ticket.py              # Bảng Tickets & TicketRatings
│   │   └── chat.py                # Bảng ChatMessages
│   ├── schemas/                   # Pydantic Schemas validate DTO
│   └── services/                  # Business Logic Services (VietQR, Billing, Notification)
├── seed_data.py                   # Script nạp dữ liệu mẫu ban đầu
├── Dockerfile                     # Cấu hình Docker Container
├── render.yaml                    # Cấu hình Deploy Render.com
└── requirements.txt               # Danh sách thư viện cần cài đặt
```

---

## ⚡ Hướng dẫn Cài đặt & Chạy Local

### 1. Tạo môi trường ảo & cài thư viện:
```bash
cd smartrent-backend

# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường:
# Trên Windows:
.\venv\Scripts\activate
# Trên macOS / Linux:
source venv/bin/activate

# Cài đặt thư viện:
pip install -r requirements.txt
```

### 2. Khởi chạy Server:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* **Swagger API Docs:** `http://127.0.0.1:8000/docs`
* **Healthcheck:** `http://127.0.0.1:8000/`
