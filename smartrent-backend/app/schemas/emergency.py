"""Emergency SOS Pydantic schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.emergency import EmergencyType, EmergencyStatus


class EmergencyCreateRequest(BaseModel):
    room_number: Optional[str] = "101"
    building_name: Optional[str] = "Tòa nhà REASY"
    emergency_type: EmergencyType = EmergencyType.OTHER
    description: Optional[str] = None


class EmergencyAlertOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    room_number: str
    building_name: str
    sender_id: uuid.UUID
    sender_name: str
    sender_phone: str
    emergency_type: EmergencyType
    description: Optional[str] = None
    status: EmergencyStatus
    acknowledged_by: Optional[str] = None
    created_at: datetime
