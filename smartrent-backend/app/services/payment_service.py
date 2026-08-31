"""Payment Service — Handle payment webhook and auto-reconcile invoices."""
import hmac
import hashlib
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.invoice import Invoice, InvoiceStatus, Payment, PaymentChannel
from app.schemas.invoice import SepayWebhookPayload
from app.core.config import settings


def verify_sepay_signature(raw_body: bytes, signature: str) -> bool:
    """Verify SePay HMAC-SHA256 webhook signature."""
    secret = settings.SEPAY_WEBHOOK_SECRET
    if not secret:
        return True  # Skip verification in dev/demo mode
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


async def process_payment_webhook(
    db: AsyncSession,
    payload: SepayWebhookPayload,
) -> dict:
    """
    Core auto-reconciliation logic:
    1. Extract payment_reference from webhook content/code
    2. Find matching invoice
    3. Create Payment record
    4. Update invoice status to PAID
    5. Return result for notification trigger
    """
    # Extract payment reference from SePay payload
    ref_code = payload.code or _extract_ref_from_content(payload.content or "")
    amount = payload.transferAmount or 0

    if not ref_code:
        return {"matched": False, "reason": "No reference code found"}

    # Find invoice by payment_reference
    stmt = select(Invoice).where(
        Invoice.payment_reference == ref_code,
        Invoice.status.in_([InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE]),
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()

    if not invoice:
        return {"matched": False, "reason": f"No pending invoice for ref: {ref_code}"}

    # Create Payment record
    payment = Payment(
        invoice_id=invoice.id,
        amount=amount,
        channel=PaymentChannel.VIETQR,
        gateway_ref=payload.referenceCode or str(payload.id),
        gateway_raw=str(payload.model_dump()),
        paid_at=datetime.now(timezone.utc),
    )
    db.add(payment)

    # Update invoice status
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.now(timezone.utc)
    await db.flush()

    return {
        "matched": True,
        "invoice_id": str(invoice.id),
        "room_id": str(invoice.room_id),
        "amount": amount,
        "month": invoice.month,
        "year": invoice.year,
    }


def _extract_ref_from_content(content: str) -> str:
    """Extract SmartRent reference code (starts with SR) from transfer description."""
    import re
    match = re.search(r"SR[A-Z0-9]{6,12}", content.upper())
    return match.group(0) if match else ""
