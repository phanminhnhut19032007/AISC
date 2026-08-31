"""MeterReading, Invoice, and Payment models."""
import enum
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime, Text, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


# ─── MeterReading ───────────────────────────────────────────────────────────

class MeterType(str, enum.Enum):
    ELECTRICITY = "ELECTRICITY"
    WATER = "WATER"


class MeterReading(UUIDBase):
    __tablename__ = "meter_readings"

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    meter_type: Mapped[MeterType] = mapped_column(SAEnum(MeterType), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    old_reading: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    new_reading: Mapped[float] = mapped_column(Float, nullable=False)
    consumption: Mapped[float] = mapped_column(Float, nullable=False)  # new - old
    ocr_image_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    ocr_raw_value: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ocr_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    is_manual: Mapped[bool] = mapped_column(default=False)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="meter_readings")  # noqa


# ─── Invoice ────────────────────────────────────────────────────────────────

class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class Invoice(UUIDBase):
    __tablename__ = "invoices"

    room_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rooms.id"), nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

    # Breakdown
    base_rent: Mapped[float] = mapped_column(Float, nullable=False)
    electricity_amount: Mapped[float] = mapped_column(Float, default=0.0)
    water_amount: Mapped[float] = mapped_column(Float, default=0.0)
    service_fees_amount: Mapped[float] = mapped_column(Float, default=0.0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)

    # Payment info
    status: Mapped[InvoiceStatus] = mapped_column(SAEnum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # VietQR
    vietqr_code: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False, server_default="0", nullable=False)

    # Relationships
    room: Mapped["Room"] = relationship("Room", back_populates="invoices")  # noqa
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="invoice")


# ─── Payment ────────────────────────────────────────────────────────────────

class PaymentChannel(str, enum.Enum):
    VIETQR = "VIETQR"
    MOMO = "MOMO"
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    OTHER = "OTHER"


class Payment(UUIDBase):
    __tablename__ = "payments"

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    channel: Mapped[PaymentChannel] = mapped_column(SAEnum(PaymentChannel), default=PaymentChannel.BANK_TRANSFER)
    gateway_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    gateway_raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Raw webhook payload
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="payments")
