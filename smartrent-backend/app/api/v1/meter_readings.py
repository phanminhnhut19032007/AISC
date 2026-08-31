"""Meter Reading routes with OCR upload support."""
import uuid
from typing import List, Annotated
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user, DB, CurrentUser, OwnerOnly
from app.models.invoice import MeterReading, MeterType
from app.models.user import User
from app.schemas.invoice import MeterReadingOut, MeterReadingCreate
from app.services.ocr_service import extract_meter_reading

router = APIRouter(prefix="/meter-readings", tags=["Meter Readings"])


@router.post("/ocr-upload", summary="Upload ảnh đồng hồ để OCR")
async def upload_meter_image(
    room_id: str = Form(...),
    meter_type: MeterType = Form(...),
    month: int = Form(...),
    year: int = Form(...),
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    🔑 SHOWCASE FEATURE: Upload ảnh đồng hồ → OCR → trả về chỉ số tự động.
    Sau khi xác nhận, gọi POST /meter-readings để lưu vào DB.
    """
    if image.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, "Chỉ chấp nhận file ảnh JPEG/PNG/WebP")

    image_bytes = await image.read()
    ocr_result = await extract_meter_reading(image_bytes)

    if not ocr_result:
        return {
            "success": False,
            "message": "Không nhận diện được chỉ số. Vui lòng nhập thủ công.",
            "suggested_reading": None,
        }

    # Fetch previous reading for this room/type to show consumption estimate
    stmt = select(MeterReading).where(
        MeterReading.room_id == uuid.UUID(room_id),
        MeterReading.meter_type == meter_type,
    ).order_by(MeterReading.year.desc(), MeterReading.month.desc()).limit(1)
    res = await db.execute(stmt)
    prev = res.scalar_one_or_none()
    prev_reading = prev.new_reading if prev else 0

    consumption = max(0, ocr_result.value - prev_reading)

    return {
        "success": True,
        "suggested_reading": ocr_result.value,
        "ocr_confidence": ocr_result.confidence,
        "ocr_raw_text": ocr_result.raw_text,
        "previous_reading": prev_reading,
        "estimated_consumption": consumption,
    }


@router.post("", response_model=MeterReadingOut, status_code=201)
async def create_meter_reading(
    body: MeterReadingCreate,
    db: DB,
    current_user: CurrentUser,
):
    """Lưu chỉ số đồng hồ (sau khi xác nhận hoặc nhập thủ công)."""
    # Re-parse body with proper schema if called via FastAPI DI
    stmt = select(MeterReading).where(
      MeterReading.room_id == body.room_id,
      MeterReading.meter_type == body.meter_type,
    ).order_by(MeterReading.year.desc(), MeterReading.month.desc()).limit(1)
    res = await db.execute(stmt)
    prev = res.scalar_one_or_none()
    old_reading = prev.new_reading if prev else 0

    reading = MeterReading(
      room_id=body.room_id,
        meter_type=body.meter_type,
        month=body.month,
        year=body.year,
        old_reading=old_reading,
        new_reading=body.new_reading,
        consumption=max(0, body.new_reading - old_reading),
        ocr_image_url=body.ocr_image_url,
        ocr_raw_value=body.ocr_raw_value,
        ocr_confidence=body.ocr_confidence,
        is_manual=body.is_manual,
    )
    db.add(reading)
    await db.flush()
    return MeterReadingOut.model_validate(reading)


@router.get("/room/{room_id}", response_model=List[MeterReadingOut])
async def list_meter_readings(room_id: str, db: DB, current_user: CurrentUser):
    """Lịch sử chỉ số đồng hồ theo phòng."""
    stmt = (
        select(MeterReading)
        .where(MeterReading.room_id == uuid.UUID(room_id))
        .order_by(MeterReading.year.desc(), MeterReading.month.desc())
    )
    result = await db.execute(stmt)
    return [MeterReadingOut.model_validate(r) for r in result.scalars().all()]
