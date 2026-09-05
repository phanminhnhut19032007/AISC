"""Emergency SOS router — Realtime alert system for tenants and landlords."""
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, desc

from app.api.deps import DB, CurrentUser
from app.models.emergency import EmergencyAlert, EmergencyStatus, EmergencyType
from app.schemas.emergency import EmergencyCreateRequest, EmergencyAlertOut

router = APIRouter(prefix="/emergency", tags=["Emergency SOS"])


@router.post("/sos", response_model=EmergencyAlertOut, status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(body: EmergencyCreateRequest, current_user: CurrentUser, db: DB):
    """
    Phát tín hiệu BÁO ĐỘNG KHẨN CẤP từ Người thuê trọ.
    Tự động kích hoạt chuông và màn hình khẩn cấp toàn hệ thống cho Chủ trọ.
    """
    alert = EmergencyAlert(
        room_number=body.room_number or "101",
        building_name=body.building_name or "Tòa nhà REASY",
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_phone=current_user.phone,
        emergency_type=body.emergency_type,
        description=body.description,
        status=EmergencyStatus.ACTIVE,
    )
    db.add(alert)
    await db.flush()
    return EmergencyAlertOut.model_validate(alert)


@router.get("/active", response_model=List[EmergencyAlertOut])
async def get_active_emergencies(current_user: CurrentUser, db: DB):
    """
    Lấy danh sách các báo động khẩn cấp đang ACTIVE.
    Dùng để hiển thị đè toàn màn hình cho Chủ trọ.
    """
    stmt = (
        select(EmergencyAlert)
        .where(EmergencyAlert.status == EmergencyStatus.ACTIVE)
        .order_by(desc(EmergencyAlert.created_at))
    )
    result = await db.execute(stmt)
    return [EmergencyAlertOut.model_validate(a) for a in result.scalars().all()]


@router.get("/list", response_model=List[EmergencyAlertOut])
async def list_emergency_history(current_user: CurrentUser, db: DB):
    """Lấy danh sách lịch sử tin báo khẩn cấp."""
    stmt = select(EmergencyAlert).order_by(desc(EmergencyAlert.created_at)).limit(50)
    result = await db.execute(stmt)
    return [EmergencyAlertOut.model_validate(a) for a in result.scalars().all()]


@router.post("/{alert_id}/acknowledge", response_model=EmergencyAlertOut)
async def acknowledge_emergency(alert_id: uuid.UUID, current_user: CurrentUser, db: DB):
    """Chủ trọ bấm nút Xác nhận đã tiếp nhận xử lý tin khẩn cấp."""
    alert = await db.get(EmergencyAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin khẩn cấp")
    
    alert.status = EmergencyStatus.ACKNOWLEDGED
    alert.acknowledged_by = current_user.full_name
    await db.flush()
    return EmergencyAlertOut.model_validate(alert)


@router.post("/{alert_id}/resolve", response_model=EmergencyAlertOut)
async def resolve_emergency(alert_id: uuid.UUID, current_user: CurrentUser, db: DB):
    """Đánh dấu sự cố khẩn cấp đã được giải quyết an toàn."""
    alert = await db.get(EmergencyAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Không tìm thấy tin khẩn cấp")
    
    alert.status = EmergencyStatus.RESOLVED
    await db.flush()
    return EmergencyAlertOut.model_validate(alert)
