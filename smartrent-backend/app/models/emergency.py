"""Emergency SOS Alert model."""
import enum
import uuid
from typing import Optional
from sqlalchemy import String, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import UUIDBase


class EmergencyType(str, enum.Enum):
    FIRE = "FIRE"              # Hỏa hoạn / Cháy nổ
    THEFT = "THEFT"            # Đột nhập / Trộm cắp
    MEDICAL = "MEDICAL"        # Cấp cứu y tế
    GAS_LEAK = "GAS_LEAK"      # Rò rỉ khí gas / Chập điện
    OTHER = "OTHER"            # Sự cố khẩn cấp khác


class EmergencyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"                  # Đang báo động khẩn cấp
    ACKNOWLEDGED = "ACKNOWLEDGED"      # Chủ trọ đã tiếp nhận
    RESOLVED = "RESOLVED"              # Đã xử lý xong


class EmergencyAlert(UUIDBase):
    __tablename__ = "emergency_alerts"

    room_number: Mapped[str] = mapped_column(String(50), nullable=False)
    building_name: Mapped[str] = mapped_column(String(100), default="Tòa nhà REASY")
    sender_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    sender_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sender_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    emergency_type: Mapped[EmergencyType] = mapped_column(SAEnum(EmergencyType), default=EmergencyType.OTHER)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[EmergencyStatus] = mapped_column(SAEnum(EmergencyStatus), default=EmergencyStatus.ACTIVE)
    acknowledged_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
