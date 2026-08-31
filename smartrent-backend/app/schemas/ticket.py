"""Pydantic v2 schemas for Maintenance Tickets."""
import uuid
from datetime import datetime
import json
from typing import Optional, List
from pydantic import BaseModel, model_validator
from app.models.ticket import TicketStatus, TicketPriority


class TicketCreate(BaseModel):
    room_id: uuid.UUID
    title: str
    description: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM
    image_urls: Optional[List[str]] = None  # List of uploaded image URLs


class TicketAssign(BaseModel):
    technician_id: uuid.UUID


class TicketStatusUpdate(BaseModel):
    status: TicketStatus
    resolution_note: Optional[str] = None


class TicketRatingCreate(BaseModel):
    score: int
    comment: Optional[str] = None

    @model_validator(mode="after")
    def validate_score(self):
        if not (1 <= self.score <= 5):
            raise ValueError("Score phai tu 1 den 5")
        return self


class TicketRatingOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    ticket_id: uuid.UUID
    score: int
    comment: Optional[str] = None


class TicketOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    room_id: uuid.UUID
    tenant_id: uuid.UUID
    technician_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    status: TicketStatus
    priority: TicketPriority
    resolution_note: Optional[str] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def parse_image_urls(cls, data):
        """Parse JSON string image_urls from DB into list without mutating the ORM object."""
        if hasattr(data, "image_urls"):
            raw = data.image_urls
            if isinstance(raw, str):
                try:
                    parsed = json.loads(raw)
                except Exception:
                    parsed = []
                # Return a dict copy instead of mutating the ORM model
                d = {}
                for field in ("id", "room_id", "tenant_id", "technician_id", "title",
                              "description", "status", "priority", "resolution_note", "created_at"):
                    if hasattr(data, field):
                        d[field] = getattr(data, field)
                d["image_urls"] = parsed
                return d
        return data
