"""Pydantic v2 schemas for Auth and User."""
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole


# ─── Auth ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    password: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.TENANT

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.startswith(("0", "+84")) or len(cleaned) < 9:
            raise ValueError("Số điện thoại không hợp lệ")
        return cleaned


class LoginRequest(BaseModel):
    phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: UserRole
    full_name: str


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    full_name: str
    phone: str
    email: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class UpdateFCMToken(BaseModel):
    fcm_token: str
