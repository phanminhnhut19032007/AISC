"""Pydantic v2 schemas for Chat messages."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    message: str
    recipient_id: Optional[uuid.UUID] = None


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    building_id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: Optional[uuid.UUID] = None
    sender_name: str
    sender_role: str
    recipient_name: Optional[str] = None
    message: str
    is_recalled: bool
    created_at: datetime
