# SmartRent Backend

Nền tảng số hóa quản lý chuỗi trọ & căn hộ mini — Backend API (FastAPI + PostgreSQL)

## 🚀 Khởi động nhanh

### Option 1: Docker Compose (khuyến nghị)

```bash
# Clone và setup
cp .env.example .env

# Khởi động toàn bộ stack (API + PostgreSQL + Redis)
docker compose up -d

# Xem logs
docker compose logs -f api
```

API sẽ chạy tại: http://localhost:8000  
Swagger Docs: http://localhost:8000/docs

---

### Option 2: Local (không dùng Docker)

```bash
# 1. Tạo virtual environment
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # macOS/Linux

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Setup .env
cp .env.example .env
# Chỉnh sửa DATABASE_URL trong .env để trỏ đến PostgreSQL local của bạn

# 4. Chạy server
uvicorn app.main:app --reload
```

---

## 📂 Cấu trúc thư mục

```
smartrent-backend/
├── app/
│   ├── main.py                    # FastAPI entry point
│   ├── core/
│   │   ├── config.py              # Pydantic Settings (.env)
│   │   ├── database.py            # Async SQLAlchemy engine
│   │   └── security.py            # JWT + bcrypt
│   ├── models/                    # SQLAlchemy ORM models
│   │   ├── user.py                # User (Owner/Tenant/Technician)
│   │   ├── building.py            # Building + Room
│   │   ├── contract.py            # Contract
│   │   └── invoice.py             # MeterReading + Invoice + Payment
│   │   └── ticket.py              # Ticket + TicketRating
│   ├── schemas/                   # Pydantic v2 request/response schemas
│   ├── api/
│   │   ├── deps.py                # DB, Auth, RBAC dependencies
│   │   └── v1/
│   │       ├── auth.py            # Register, Login, /me
│   │       ├── buildings.py       # Building + Room CRUD
│   │       ├── meter_readings.py  # OCR Upload + readings
│   │       ├── invoices.py        # Invoice generation + management
│   │       ├── tickets.py         # Maintenance ticket lifecycle
│   │       └── webhooks.py        # SePay/Casso payment webhook
│   └── services/
│       ├── ocr_service.py         # Google Vision API OCR
│       ├── billing_service.py     # Auto-calculate invoice amounts
│       ├── vietqr_service.py      # VietQR code generation
│       ├── payment_service.py     # Auto-reconciliation logic
│       └── notification_service.py # Zalo ZNS + Firebase FCM
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## 🔑 API Endpoints chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản |
| `POST` | `/api/v1/auth/login` | Đăng nhập → JWT token |
| `GET` | `/api/v1/auth/me` | Thông tin tài khoản |
| `POST` | `/api/v1/buildings` | Tạo tòa nhà (OWNER only) |
| `POST` | `/api/v1/rooms` | Thêm phòng |
| `POST` | `/api/v1/meter-readings/ocr-upload` | 🔑 Upload ảnh đồng hồ → OCR |
| `POST` | `/api/v1/invoices/generate` | 🔑 Tự động tính & phát hành hóa đơn |
| `GET` | `/api/v1/invoices` | Danh sách hóa đơn |
| `POST` | `/api/v1/tickets` | Tạo ticket sự cố |
| `PATCH` | `/api/v1/tickets/{id}/assign` | Gán thợ |
| `PATCH` | `/api/v1/tickets/{id}/status` | Cập nhật trạng thái |
| `POST` | `/api/v1/webhooks/sepay` | 🔑 SePay payment webhook |
| `POST` | `/api/v1/webhooks/casso` | Casso payment webhook |

---

## 🎯 Demo 3 màn hình (AISC Showcase)

### 1. OCR Flow
```bash
curl -X POST http://localhost:8000/api/v1/meter-readings/ocr-upload \
  -H "Authorization: Bearer <token>" \
  -F "room_id=<room_uuid>" \
  -F "meter_type=ELECTRICITY" \
  -F "month=8" \
  -F "year=2025" \
  -F "image=@/path/to/meter_photo.jpg"
```

### 2. Generate Invoice + VietQR
```bash
curl -X POST http://localhost:8000/api/v1/invoices/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"room_id": "<uuid>", "month": 8, "year": 2025}'
```

### 3. Simulate Payment Webhook (test auto-reconciliation)
```bash
curl -X POST http://localhost:8000/api/v1/webhooks/sepay \
  -H "Content-Type: application/json" \
  -d '{
    "transferAmount": 2500000,
    "content": "Thanh toan SR101A0825ABCD tien phong thang 8",
    "code": "SR101A0825ABCD",
    "referenceCode": "TXN20250801123456"
  }'
```

→ Invoice tự động chuyển sang **PAID** ✅

---

## 🛠️ Tech Stack

- **FastAPI** 0.111 — Async Python web framework
- **SQLAlchemy 2.0** — Async ORM với PostgreSQL
- **Pydantic v2** — Validation & serialization
- **PostgreSQL 16** — Main database
- **Redis** — Cache & Celery task queue
- **Google Cloud Vision** — OCR meter reading
- **SePay / Casso** — Open Banking webhook
- **Zalo ZNS** — Payment & ticket notifications
- **VietQR** — Dynamic QR code generation
