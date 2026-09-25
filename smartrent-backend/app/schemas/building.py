"""Pydantic v2 schemas for Building and Room."""
import uuid
from typing import Optional
from pydantic import BaseModel
from app.models.building import RoomStatus


# ─── Building ────────────────────────────────────────────────────────────────

class BuildingCreate(BaseModel):
    name: str
    address: str
    building_code: Optional[str] = None
    province: Optional[str] = None
    total_floors: Optional[int] = None
    description: Optional[str] = None


class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    building_code: Optional[str] = None
    province: Optional[str] = None
    total_floors: Optional[int] = None
    description: Optional[str] = None


class BuildingOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    owner_id: uuid.UUID
    name: str
    building_code: Optional[str] = None
    address: str
    province: Optional[str] = None
    total_floors: Optional[int] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_deleted: bool = False


# ─── Room ────────────────────────────────────────────────────────────────────

class RoomCreate(BaseModel):
    building_id: uuid.UUID
    room_number: str
    room_code: Optional[str] = None
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    base_rent: float
    electricity_rate: float = 4000.0
    water_rate: float = 25000.0
    internet_fee: float = 0.0
    parking_fee: float = 0.0


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_code: Optional[str] = None
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    base_rent: Optional[float] = None
    electricity_rate: Optional[float] = None
    water_rate: Optional[float] = None
    internet_fee: Optional[float] = None
    parking_fee: Optional[float] = None
    status: Optional[RoomStatus] = None
    notes: Optional[str] = None


class RoomOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    building_id: uuid.UUID
    room_number: str
    room_code: Optional[str] = None
    floor: Optional[int] = None
    area_sqm: Optional[float] = None
    base_rent: float
    electricity_rate: float
    water_rate: float
    internet_fee: float
    parking_fee: float
    status: RoomStatus
    thumbnail_url: Optional[str] = None
