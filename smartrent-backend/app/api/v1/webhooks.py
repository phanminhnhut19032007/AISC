"""Payment webhook routes — SePay/Casso auto-reconciliation."""
import json
import uuid
from fastapi import APIRouter, Request, HTTPException, Header
from typing import Optional
from sqlalchemy import select

from app.api.deps import DB
from app.models.invoice import Invoice
from app.models.building import Room
from app.models.contract import Contract, ContractStatus
from app.models.user import User
from app.schemas.invoice import SepayWebhookPayload
from app.services.payment_service import process_payment_webhook, verify_sepay_signature
from app.services.notification_service import notify_invoice_paid

router = APIRouter(prefix="/webhooks", tags=["Payment Webhooks"])


@router.post("/sepay", summary="🔑 SePay payment webhook (auto-reconciliation)")
async def sepay_webhook(
    request: Request,
    db: DB,
    x_sepay_signature: Optional[str] = Header(None),
):
    """
    🔑 SHOWCASE FEATURE: SePay fires this webhook when money arrives.
    → Find matching invoice → Mark PAID → Push notification → Real-time dashboard update.
    """
    raw_body = await request.body()

    # Signature verification
    if x_sepay_signature and not verify_sepay_signature(raw_body, x_sepay_signature):
        raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        payload_dict = json.loads(raw_body)
        payload = SepayWebhookPayload(**payload_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload: {e}")

    result = await process_payment_webhook(db=db, payload=payload)

    if result.get("matched"):
        # Notify tenant via ZNS after successful reconciliation
        inv_uuid = uuid.UUID(result["invoice_id"])
        invoice = await db.get(Invoice, inv_uuid)
        if invoice:
            room = await db.get(Room, invoice.room_id)
            contract_stmt = select(Contract).where(
                Contract.room_id == invoice.room_id,
                Contract.status == ContractStatus.ACTIVE,
            ).limit(1)
            res = await db.execute(contract_stmt)
            contract = res.scalar_one_or_none()
            if contract:
                tenant = await db.get(User, contract.tenant_id)
                if tenant:
                    await notify_invoice_paid(
                        phone=tenant.phone,
                        room_number=room.room_number,
                        month=invoice.month,
                        year=invoice.year,
                        amount=result["amount"],
                    )

    return {"status": "ok", "result": result}


@router.post("/casso", summary="Casso payment webhook")
async def casso_webhook(request: Request, db: DB):
    """Casso webhook — same reconciliation logic as SePay."""
    raw_body = await request.body()
    try:
        payload_dict = json.loads(raw_body)
        # Normalize Casso payload to SePay format
        normalized = SepayWebhookPayload(
            transferAmount=payload_dict.get("amount"),
            content=payload_dict.get("description", ""),
            code=_extract_code(payload_dict.get("description", "")),
            referenceCode=payload_dict.get("tid"),
        )
    except Exception as e:
        raise HTTPException(400, f"Invalid payload: {e}")

    result = await process_payment_webhook(db=db, payload=normalized)
    return {"status": "ok", "result": result}


def _extract_code(content: str) -> str:
    import re
    match = re.search(r"SR[A-Z0-9]{6,12}", content.upper())
    return match.group(0) if match else ""
