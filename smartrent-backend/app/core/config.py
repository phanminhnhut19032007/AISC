from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "RENTEASY"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # API
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./smartrent_demo.db"
    DATABASE_URL_SYNC: str = "sqlite:///./smartrent_demo.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    S3_BUCKET_NAME: str = "smartrent-uploads"
    S3_ENDPOINT_URL: str = ""
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    S3_REGION: str = "auto"

    # OCR
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GOOGLE_CLOUD_PROJECT: str = ""

    # Payment
    SEPAY_WEBHOOK_SECRET: str = ""
    CASSO_WEBHOOK_SECRET: str = ""
    PAYMENT_GATEWAY: str = "sepay"

    # Zalo ZNS
    ZALO_OA_ACCESS_TOKEN: str = ""
    ZALO_TEMPLATE_INVOICE_ID: str = ""
    ZALO_TEMPLATE_PAID_ID: str = ""
    ZALO_TEMPLATE_TICKET_ID: str = ""

    # VietQR
    VIETQR_BANK_CODE: str = "MB"
    VIETQR_ACCOUNT_NUMBER: str = ""
    VIETQR_ACCOUNT_NAME: str = ""

    # Firebase
    FIREBASE_CREDENTIALS_JSON: str = ""

    # CORS
    CORS_ORIGINS: str = '["*"]'

    def get_cors_origins(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except Exception:
            return ["*"]


settings = Settings()
