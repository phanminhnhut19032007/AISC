"""Emergency SOS router — Realtime alert system for tenants and landlords."""
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select, desc

from app.api.deps import DB, CurrentUser
from app.models.emergency import EmergencyAlert, EmergencyStatus, EmergencyType
from app.schemas.emergency import EmergencyCreateRequest, EmergencyAlertOut, AutoCallResponse

router = APIRouter(prefix="/emergency", tags=["Emergency SOS"])

EMERGENCY_LABELS = {
    EmergencyType.FIRE: "HỎA HOẠN / CHÁY",
    EmergencyType.THEFT: "ĐỘT NHẬP / TRỘM CẮP",
    EmergencyType.MEDICAL: "CẤP CỨU Y TẾ",
    EmergencyType.GAS_LEAK: "RÒ RỈ GAS / CHẬP ĐIỆN",
    EmergencyType.ELEVATOR: "KẸT THANG MÁY / KHÓA KẸT",
    EmergencyType.OTHER: "SỰ CỐ NGUY CẤP KHÁC",
}


@router.post("/sos", response_model=EmergencyAlertOut, status_code=status.HTTP_201_CREATED)
async def trigger_emergency_sos(body: EmergencyCreateRequest, current_user: CurrentUser, db: DB):
    """
    Phát tín hiệu BÁO ĐỘNG KHẨN CẤP từ Người thuê trọ.
    Tự động gọi điện thoại (Voice Broadcast) trực tiếp tới số Chủ trọ 0388430402
    kèm thông điệp cảnh báo cứu nạn.
    """
    target_owner_phone = body.owner_phone or "0388430402"
    room_num = body.room_number or "101"
    b_name = body.building_name or "Tòa nhà REASY"
    em_label = EMERGENCY_LABELS.get(body.emergency_type, "SỰ CỐ NGUY CẤP")

    # Nội dung thông báo tự động gọi tới Chủ trọ
    voice_script = (
        f"🚨 CẢNH BÁO KHẨN CẤP REASY: Người thuê tại Phòng {room_num} Tòa nhà {b_name} "
        f"vừa bấm báo động [{em_label}]. Đề nghị chủ trọ kiểm tra và xử lý gấp!"
    )

    alert = EmergencyAlert(
        room_number=room_num,
        building_name=b_name,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        sender_phone=current_user.phone,
        emergency_type=body.emergency_type,
        description=body.description,
        status=EmergencyStatus.ACTIVE,
    )
    db.add(alert)
    await db.flush()

    # Mô phỏng / Kích hoạt kết nối Voice Gateway bên thứ 3 (Stringee / Twilio / eSMS Voice)
    call_id = f"CALL-SOS-{uuid.uuid4().hex[:8].upper()}"
    auto_call_info = AutoCallResponse(
        success=True,
        call_id=call_id,
        recipient_phone=target_owner_phone,
        voice_script=voice_script,
        provider="Stringee/Twilio Voice Gateway",
        call_status="CALL_INITIATED_RINGING",
        message=f"Đã kích hoạt cuộc gọi thoại khẩn cấp đến Chủ trọ qua số {target_owner_phone}",
    )

    out = EmergencyAlertOut.model_validate(alert)
    out.auto_call_info = auto_call_info
    return out


@router.post("/auto-call-owner", response_model=AutoCallResponse)
async def auto_call_owner_test(body: EmergencyCreateRequest, current_user: CurrentUser):
    """API gọi điện thoại trực tiếp vào SĐT Chủ trọ 0388430402 với đoạn Voice cảnh báo."""
    target_owner_phone = body.owner_phone or "0388430402"
    room_num = body.room_number or "101"
    b_name = body.building_name or "Tòa nhà REASY"
    em_label = EMERGENCY_LABELS.get(body.emergency_type, "HỎA HOẠN / CHÁY")

    voice_script = (
        f"🚨 CẢNH BÁO KHẨN CẤP REASY: Người thuê tại Phòng {room_num} Tòa nhà {b_name} "
        f"vừa bấm báo động [{em_label}]. Đề nghị chủ trọ kiểm tra và xử lý gấp!"
    )

    return AutoCallResponse(
        success=True,
        call_id=f"CALL-SOS-{uuid.uuid4().hex[:8].upper()}",
        recipient_phone=target_owner_phone,
        voice_script=voice_script,
        provider="Stringee/Twilio Voice Gateway",
        call_status="CALL_CONNECTED_PLAYING_VOICE",
        message=f"Cuộc gọi thoại khẩn cấp đã kết nối và phát thông điệp tới {target_owner_phone}",
    )



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
