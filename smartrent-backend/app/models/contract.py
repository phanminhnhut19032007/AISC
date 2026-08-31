"""Contract model — links Room to Tenant with service fees."""
import enum
import uuid
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Float, ForeignKey, Date, JSON, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


class ContractStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    TERMINATED = "TERMINATED"
    PENDING = "PENDING"


class Contract(UUIDBase):
    __tablename__ = "contracts"

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    deposit_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    monthly_rent: Mapped[float] = mapped_column(Float, nullable=False)
    # Extra service fees stored as JSON: {"cleaning": 50000, "parking": 100000}
    service_fees: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[ContractStatus] = mapped_column(
        SAEnum(ContractStatus), default=ContractStatus.ACTIVE
    )
    contract_pdf_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="contracts")  # noqa
    tenant: Mapped["User"] = relationship("User", back_populates="contracts")  # noqa

    def __repr__(self) -> str:
        return f"<Contract id={self.id} room={self.room_id} tenant={self.tenant_id}>"
