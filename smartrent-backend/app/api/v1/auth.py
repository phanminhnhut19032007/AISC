import secrets
from datetime import datetime, timezone
import httpx
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    GoogleLoginRequest,
    TokenResponse,
    UserOut,
    UserUpdate,
    ChangePasswordRequest,
    UpdateFCMToken,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DB):
    """Đăng ký tài khoản mới."""
    # Check phone uniqueness per role
    existing = await db.execute(select(User).where(User.phone == body.phone, User.role == body.role))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Số điện thoại đã được đăng ký cho vai trò này")

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
    query = select(User).where(User.phone == body.phone)
    if body.role is not None:
        query = query.where(User.role == body.role)
    result = await db.execute(query)
    users = result.scalars().all()

    # Find the user matching the provided password
    user = None
    for u in users:
        if verify_password(body.password, u.hashed_password):
            user = u
            break

    if not user:
        raise HTTPException(status_code=401, detail="Số điện thoại hoặc mật khẩu không đúng")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    # Validate building code and room code for tenant if supplied
    if user.role == UserRole.TENANT and (body.building_code or body.room_code):
        from app.models.building import Building, Room
        if body.building_code:
            b_code = body.building_code.strip().upper()
            b_res = await db.execute(select(Building).where(Building.building_code == b_code, Building.is_deleted == False))
            building = b_res.scalar_one_or_none()
            if not building:
                raise HTTPException(status_code=400, detail="Mã tòa nhà không chính xác hoặc không tồn tại")

            if body.room_code:
                r_code = body.room_code.strip().upper()
                r_res = await db.execute(
                    select(Room).where(
                        Room.building_id == building.id,
                        (Room.room_code == r_code) | (Room.room_number == body.room_code.strip())
                    )
                )
                room = r_res.scalar_one_or_none()
                if not room:
                    raise HTTPException(status_code=400, detail=f"Mã phòng '{body.room_code}' không tồn tại trong tòa {building.name}")

    token = create_access_token(str(user.id))
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        role=user.role,
        full_name=user.full_name,
    )


@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest, db: DB):
    """Đăng nhập hoặc đăng ký tài khoản qua Google OAuth Token."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": body.id_token},
            )
        except Exception:
            raise HTTPException(status_code=500, detail="Không thể kết nối đến máy chủ Google")

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Google Token không hợp lệ hoặc đã hết hạn")

    payload = resp.json()
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Tài khoản Google không cung cấp email")

    full_name = payload.get("name") or payload.get("given_name") or "Người dùng Google"
    picture = payload.get("picture")
    google_sub = payload.get("sub", "")
    target_role = body.role or UserRole.TENANT

    # 1. Look up existing user by email & role
    result = await db.execute(
        select(User).where(User.email == email, User.role == target_role)
    )
    user = result.scalar_one_or_none()

    if not user:
        # Generate a unique placeholder phone for this role
        sub_tail = google_sub[-8:] if len(google_sub) >= 8 else f"{secrets.randbelow(90000000) + 10000000}"
        alt_phone = f"09{sub_tail}"

        # Ensure uniqueness
        existing_phone = await db.execute(
            select(User).where(User.phone == alt_phone, User.role == target_role)
        )
        if existing_phone.scalar_one_or_none():
            alt_phone = f"08{secrets.randbelow(90000000) + 10000000}"

        user = User(
            full_name=full_name,
            phone=alt_phone,
            email=email,
            avatar_url=picture,
            hashed_password=hash_password(secrets.token_urlsafe(16)),
            role=target_role,
        )
        db.add(user)
        await db.flush()
    else:
        if picture and not user.avatar_url:
            user.avatar_url = picture
        if full_name and user.full_name == "Người dùng Google":
            user.full_name = full_name
        await db.flush()

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
            existing = await db.execute(select(User).where(User.phone == cleaned_phone, User.role == current_user.role, User.id != current_user.id))
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Số điện thoại này đã được sử dụng cho vai trò này")
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
