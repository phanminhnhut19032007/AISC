"""Invoice routes — generate, list, and manage invoices."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.api.deps import DB, CurrentUser, OwnerOnly
from app.models.invoice import Invoice, InvoiceStatus
from app.models.building import Room
from app.models.contract import Contract, ContractStatus
from app.models.user import User
from app.schemas.invoice import InvoiceOut, InvoiceGenerateRequest
from app.services.billing_service import calculate_invoice_for_room
from app.services.notification_service import notify_invoice_created

router = APIRouter(prefix="/invoices", tags=["Invoices"])


@router.post("/generate", response_model=InvoiceOut, status_code=201)
async def generate_invoice(body: InvoiceGenerateRequest, db: DB, owner: OwnerOnly):
    """
    SHOWCASE FEATURE: Tự dong tinh va phat hanh hoa don.
    Tinh tien dien/nuoc/thue phong + sinh ma VietQR + gui ZNS cho nguoi thue.
    """
    invoice = await calculate_invoice_for_room(
        db=db,
        room_id=str(body.room_id),
        month=body.month,
        year=body.year,
        elec_reading_id=str(body.electricity_reading_id) if body.electricity_reading_id else None,
        water_reading_id=str(body.water_reading_id) if body.water_reading_id else None,
    )
    invoice.status = InvoiceStatus.SENT
    await db.flush()

    # Notify tenant via Zalo ZNS
    room = await db.get(Room, body.room_id)
    contract_stmt = select(Contract).where(
        Contract.room_id == body.room_id,
        Contract.status == ContractStatus.ACTIVE,
    ).limit(1)
    res = await db.execute(contract_stmt)
    contract = res.scalar_one_or_none()
    if contract and room:
        tenant = await db.get(User, contract.tenant_id)
        if tenant:
            await notify_invoice_created(
                phone=tenant.phone,
                room_number=room.room_number,
                month=body.month,
                year=body.year,
                total_amount=invoice.total_amount,
                vietqr_url=invoice.vietqr_code or "",
            )

    return InvoiceOut.model_validate(invoice)


@router.get("", response_model=List[InvoiceOut])
async def list_invoices(
    db: DB,
    current_user: CurrentUser,
    room_id: Optional[uuid.UUID] = None,
    status: Optional[InvoiceStatus] = None,
    include_deleted: bool = False,
):
    """Danh sach hoa don (loc theo phong, trang thai, va ho tro thung rac)."""
    from app.models.user import UserRole

    stmt = select(Invoice)
    if not include_deleted:
        stmt = stmt.where(Invoice.is_deleted == False)
    else:
        stmt = stmt.where(Invoice.is_deleted == True)

    # Security scope for tenants
    if current_user.role == UserRole.TENANT:
        contract_stmt = select(Contract.room_id).where(
            Contract.tenant_id == current_user.id,
            Contract.status == ContractStatus.ACTIVE
        )
        contract_res = await db.execute(contract_stmt)
        tenant_room_ids = contract_res.scalars().all()
        if not tenant_room_ids:
            return []
        stmt = stmt.where(Invoice.room_id.in_(tenant_room_ids))
    elif room_id:
        stmt = stmt.where(Invoice.room_id == room_id)

    if status:
        stmt = stmt.where(Invoice.status == status)
    stmt = stmt.order_by(Invoice.year.desc(), Invoice.month.desc())
    result = await db.execute(stmt)
    return [InvoiceOut.model_validate(inv) for inv in result.scalars().all()]


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(invoice_id: uuid.UUID, db: DB, current_user: CurrentUser):
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Khong tim thay hoa don")
    return InvoiceOut.model_validate(invoice)


@router.patch("/{invoice_id}/mark-paid", response_model=InvoiceOut)
async def manually_mark_paid(invoice_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Danh dau da thu tien mat thu cong."""
    from datetime import datetime, timezone
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Khong tim thay hoa don")
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.now(timezone.utc)
    return InvoiceOut.model_validate(invoice)


@router.delete("/{invoice_id}", status_code=204)
async def delete_invoice(invoice_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Xoa mem hoa don (chuyen vao thung rac)."""
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Khong tim thay hoa don")
    invoice.is_deleted = True
    await db.flush()
    return None


@router.post("/{invoice_id}/restore", response_model=InvoiceOut)
async def restore_invoice(invoice_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Phuc hoi hoa don da bi xoa mem."""
    invoice = await db.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(404, "Khong tim thay hoa don")
    invoice.is_deleted = False
    await db.flush()
    return InvoiceOut.model_validate(invoice)
