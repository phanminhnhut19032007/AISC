"""SmartRent — FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize database tables."""
    print(f"[RENTEASY] Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()
    print("[RENTEASY] Database initialized")
    yield
    print("[RENTEASY] Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## 🏠 SmartRent API

Nền tảng số hóa quản lý chuỗi trọ & căn hộ mini.

### Tính năng nổi bật
- **OCR Meter Reading**: Upload ảnh đồng hồ → AI bóc tách chỉ số
- **Auto Billing**: Tự động tính hóa đơn điện/nước/phòng
- **VietQR Payment**: Sinh mã VietQR động theo đúng số tiền
- **Auto-Reconciliation**: Webhook gạch nợ tự động khi khách thanh toán
- **Ticket Lifecycle**: Quản lý sự cố với state machine đầy đủ
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return JSONResponse({"status": "healthy", "service": settings.APP_NAME})
