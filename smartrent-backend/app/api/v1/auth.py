"""Auth routes — Register and Login."""
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut, UserUpdate, ChangePasswordRequest, UpdateFCMToken

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DB):
    """Đăng ký tài khoản mới."""
    # Check phone uniqueness
    existing = await db.execute(select(User).where(User.phone == body.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Số điện thoại đã được đăng ký")

    user = User(
        full_name=body.full_name,
        phone=body.phone,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    await db.flush()

    token = create_access_token(str(user.id))
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        full_name=user.full_name,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DB):
    """Đăng nhập bằng số điện thoại và mật khẩu."""
    result = await db.execute(select(User).where(User.phone == body.phone))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Số điện thoại hoặc mật khẩu không đúng")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    token = create_access_token(str(user.id))
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        full_name=user.full_name,
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser):
    """Lấy thông tin tài khoản hiện tại."""
    return UserOut.model_validate(current_user)


@router.patch("/me", response_model=UserOut)
async def update_me(body: UserUpdate, current_user: CurrentUser, db: DB):
    """Cập nhật thông tin cá nhân (họ tên, email, sđt, mật khẩu)."""
    if body.full_name is not None and body.full_name.strip():
        current_user.full_name = body.full_name.strip()
    if body.email is not None:
        current_user.email = body.email.strip() if body.email.strip() else None
    if body.phone is not None and body.phone.strip():
        cleaned_phone = body.phone.strip()
        if cleaned_phone != current_user.phone:
            existing = await db.execute(select(User).where(User.phone == cleaned_phone, User.id != current_user.id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Số điện thoại này đã được sử dụng")
            current_user.phone = cleaned_phone
    if body.password is not None and body.password.strip():
        current_user.hashed_password = hash_password(body.password.strip())

    await db.flush()
    return UserOut.model_validate(current_user)


@router.post("/change-password")
async def change_password(body: ChangePasswordRequest, current_user: CurrentUser, db: DB):
    """Đổi mật khẩu người dùng với xác thực mật khẩu hiện tại."""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mật khẩu hiện tại không chính xác")
    if len(body.new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có tối thiểu 6 ký tự")
    current_user.hashed_password = hash_password(body.new_password)
    await db.flush()
    return {"message": "Đổi mật khẩu thành công"}


@router.patch("/fcm-token")
async def update_fcm_token(body: UpdateFCMToken, current_user: CurrentUser, db: DB):
    """Cập nhật FCM token cho push notification."""
    current_user.fcm_token = body.fcm_token
    return {"ok": True}
