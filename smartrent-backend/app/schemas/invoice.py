"""Pydantic v2 schemas for Invoice, MeterReading, and Payment."""
import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from app.models.invoice import InvoiceStatus, MeterType, PaymentChannel


# ─── MeterReading ─────────────────────────────────────────────────────────────

class MeterReadingCreate(BaseModel):
    room_id: uuid.UUID
    meter_type: MeterType
    month: int
    year: int
    new_reading: float
    ocr_image_url: Optional[str] = None
    ocr_raw_value: Optional[str] = None
    ocr_confidence: Optional[float] = None
    is_manual: bool = False


class MeterReadingOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    room_id: uuid.UUID
    meter_type: MeterType
    month: int
    year: int
    old_reading: float
    new_reading: float
    consumption: float
    ocr_image_url: Optional[str] = None
    ocr_confidence: Optional[float] = None
    is_manual: bool


# ─── Invoice ─────────────────────────────────────────────────────────────────

class InvoiceGenerateRequest(BaseModel):
    room_id: uuid.UUID
    month: int
    year: int
    electricity_reading_id: Optional[uuid.UUID] = None
    water_reading_id: Optional[uuid.UUID] = None


class InvoiceOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    room_id: uuid.UUID
    month: int
    year: int
    base_rent: float
    electricity_amount: float
    water_amount: float
    service_fees_amount: float
    total_amount: float
    status: InvoiceStatus
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    vietqr_code: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    is_deleted: bool = False


# ─── Payment Webhook ──────────────────────────────────────────────────────────

class SepayWebhookPayload(BaseModel):
    """SePay webhook payload structure."""
    id: Optional[int] = None
    gateway: Optional[str] = None
    transactionDate: Optional[str] = None
    accountNumber: Optional[str] = None
    code: Optional[str] = None         # Mã phòng / payment_reference
    content: Optional[str] = None
    transferType: Optional[str] = None
    transferAmount: Optional[float] = None
    accumulated: Optional[float] = None
    subAccId: Optional[str] = None
    referenceCode: Optional[str] = None
    description: Optional[str] = None


class PaymentOut(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    invoice_id: uuid.UUID
    amount: float
    channel: PaymentChannel
    gateway_ref: Optional[str] = None
    paid_at: datetime
