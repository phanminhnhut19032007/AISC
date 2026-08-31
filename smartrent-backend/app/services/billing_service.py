"""Billing Service — Auto-calculate invoice amounts from meter readings."""
import uuid
import secrets
import string
from datetime import datetime, timezone, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invoice import Invoice, InvoiceStatus, MeterReading, MeterType
from app.models.building import Room
from app.models.contract import Contract, ContractStatus
from app.services.vietqr_service import generate_vietqr_content


def _generate_payment_reference(room_number: str, month: int, year: int) -> str:
    """Generate unique payment reference: SR-101-0825-XXXX"""
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
    return f"SR{room_number.replace(' ', '')}{month:02d}{str(year)[-2:]}{suffix}"


async def calculate_invoice_for_room(
    db: AsyncSession,
    room_id: str,
    month: int,
    year: int,
    elec_reading_id: Optional[str] = None,
    water_reading_id: Optional[str] = None,
) -> Invoice:
    """
    Core billing logic:
    1. Load room config + active contract
    2. Find meter readings for this month
    3. Calculate each component
    4. Create Invoice with VietQR reference
    """
    room = await db.get(Room, uuid.UUID(room_id))
    if not room:
        raise ValueError(f"Room {room_id} not found")

    # Get active contract for monthly rent & service fees
    contract_stmt = (
        select(Contract)
        .where(
            Contract.room_id == uuid.UUID(room_id),
            Contract.status == ContractStatus.ACTIVE,
        )
        .limit(1)
    )
    result = await db.execute(contract_stmt)
    contract = result.scalar_one_or_none()
    base_rent = contract.monthly_rent if contract else room.base_rent

    # ── Electricity ──────────────────────────────────────────────────────────
    electricity_amount = 0.0
    if elec_reading_id:
        elec_reading = await db.get(MeterReading, uuid.UUID(elec_reading_id))
        if elec_reading:
            electricity_amount = elec_reading.consumption * room.electricity_rate
    else:
        # Auto-find latest reading for this month
        stmt = select(MeterReading).where(
            MeterReading.room_id == uuid.UUID(room_id),
            MeterReading.meter_type == MeterType.ELECTRICITY,
            MeterReading.month == month,
            MeterReading.year == year,
        ).limit(1)
        res = await db.execute(stmt)
        reading = res.scalar_one_or_none()
        if reading:
            electricity_amount = reading.consumption * room.electricity_rate

    # ── Water ────────────────────────────────────────────────────────────────
    water_amount = 0.0
    if water_reading_id:
        water_reading = await db.get(MeterReading, uuid.UUID(water_reading_id))
        if water_reading:
            water_amount = water_reading.consumption * room.water_rate
    else:
        stmt = select(MeterReading).where(
            MeterReading.room_id == uuid.UUID(room_id),
            MeterReading.meter_type == MeterType.WATER,
            MeterReading.month == month,
            MeterReading.year == year,
        ).limit(1)
        res = await db.execute(stmt)
        reading = res.scalar_one_or_none()
        if reading:
            water_amount = reading.consumption * room.water_rate

    # ── Service Fees ─────────────────────────────────────────────────────────
    service_fees_amount = room.internet_fee + room.parking_fee
    if contract and contract.service_fees:
        service_fees_amount += sum(contract.service_fees.values())

    total_amount = base_rent + electricity_amount + water_amount + service_fees_amount

    # ── Generate unique payment reference ────────────────────────────────────
    payment_ref = _generate_payment_reference(room.room_number, month, year)
    vietqr_content = generate_vietqr_content(
        amount=int(total_amount),
        reference=payment_ref,
        description=f"Tien phong {room.room_number} T{month}/{year}",
    )

    # ── Create Invoice ───────────────────────────────────────────────────────
    invoice = Invoice(
        room_id=uuid.UUID(room_id),
        month=month,
        year=year,
        base_rent=base_rent,
        electricity_amount=electricity_amount,
        water_amount=water_amount,
        service_fees_amount=service_fees_amount,
        total_amount=total_amount,
        status=InvoiceStatus.DRAFT,
        due_date=datetime(year, month, 15, tzinfo=timezone.utc) + timedelta(days=30),
        payment_reference=payment_ref,
        vietqr_code=vietqr_content,
    )
    db.add(invoice)
    await db.flush()
    return invoice
