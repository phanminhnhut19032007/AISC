"""Maintenance Ticket model."""
import enum
import uuid
from typing import Optional, List
from sqlalchemy import String, Integer, ForeignKey, Text, Enum as SAEnum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_CONFIRM = "PENDING_CONFIRM"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Ticket(UUIDBase):
    __tablename__ = "tickets"

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    technician_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_urls: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of URLs
    status: Mapped[TicketStatus] = mapped_column(SAEnum(TicketStatus), default=TicketStatus.OPEN)
    priority: Mapped[TicketPriority] = mapped_column(
        SAEnum(TicketPriority), default=TicketPriority.MEDIUM
    )
    resolution_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="tickets")  # noqa
    tenant: Mapped["User"] = relationship(
        "User", foreign_keys=[tenant_id], back_populates="tickets_created"  # noqa
    )
    technician: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[technician_id], back_populates="tickets_assigned"  # noqa
    )
    rating: Mapped[Optional["TicketRating"]] = relationship("TicketRating", back_populates="ticket", uselist=False)

    def __repr__(self) -> str:
        return f"<Ticket id={self.id} status={self.status} room={self.room_id}>"


class TicketRating(UUIDBase):
    __tablename__ = "ticket_ratings"

    ticket_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tickets.id"), nullable=False, unique=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)  # 1–5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="rating")
