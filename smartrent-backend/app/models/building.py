"""Building & Room models."""
import enum
import uuid
from typing import Optional, List
from sqlalchemy import String, Float, Integer, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


class RoomStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"    # Phòng trống
    OCCUPIED = "OCCUPIED"      # Đang có người thuê
    MAINTENANCE = "MAINTENANCE"  # Đang bảo trì


class Building(UUIDBase):
    __tablename__ = "buildings"

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    building_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    province: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_floors: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, server_default="0", nullable=False)

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="buildings")  # noqa
    rooms: Mapped[List["Room"]] = relationship("Room", back_populates="building", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Building id={self.id} name={self.name} code={self.building_code}>"


class Room(UUIDBase):
    __tablename__ = "rooms"

    building_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buildings.id"), nullable=False, index=True)
    room_number: Mapped[str] = mapped_column(String(20), nullable=False)
    room_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, index=True)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    area_sqm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    base_rent: Mapped[float] = mapped_column(Float, nullable=False)
    electricity_rate: Mapped[float] = mapped_column(Float, default=4000.0)  # VNĐ/kWh
    water_rate: Mapped[float] = mapped_column(Float, default=25000.0)       # VNĐ/m³
    internet_fee: Mapped[float] = mapped_column(Float, default=0.0)
    parking_fee: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[RoomStatus] = mapped_column(SAEnum(RoomStatus), default=RoomStatus.AVAILABLE)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    building: Mapped["Building"] = relationship("Building", back_populates="rooms")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="room")  # noqa
    meter_readings: Mapped[List["MeterReading"]] = relationship("MeterReading", back_populates="room")  # noqa
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="room")  # noqa
    tickets: Mapped[List["Ticket"]] = relationship("Ticket", back_populates="room")  # noqa

    def __repr__(self) -> str:
        return f"<Room id={self.id} number={self.room_number}>"
