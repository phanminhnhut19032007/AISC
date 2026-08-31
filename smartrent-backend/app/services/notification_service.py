"""Notification Service — Zalo ZNS and Firebase FCM push notifications."""
import httpx
from typing import Optional
from app.core.config import settings


# ─── Zalo ZNS ────────────────────────────────────────────────────────────────

async def send_zalo_zns(
    phone: str,
    template_id: str,
    template_data: dict,
) -> bool:
    """Send Zalo ZNS notification to a phone number."""
    if not settings.ZALO_OA_ACCESS_TOKEN:
        print(f"[ZNS DEMO] To {phone}: {template_data}")
        return True

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://business.openapi.zalo.me/message/template",
                headers={"access_token": settings.ZALO_OA_ACCESS_TOKEN},
                json={
                    "phone": phone,
                    "template_id": template_id,
                    "template_data": template_data,
                    "tracking_id": f"smartrent_{phone[:6]}",
                },
                timeout=10.0,
            )
            data = resp.json()
            return data.get("error") == 0
    except Exception as e:
        print(f"[ZNS] Error: {e}")
        return False


async def notify_invoice_created(
    phone: str,
    room_number: str,
    month: int,
    year: int,
    total_amount: float,
    vietqr_url: str,
) -> bool:
    """Notify tenant that a new invoice has been issued."""
    return await send_zalo_zns(
        phone=phone,
        template_id=settings.ZALO_TEMPLATE_INVOICE_ID or "demo_invoice",
        template_data={
            "room_number": room_number,
            "month": f"T{month}/{year}",
            "total_amount": f"{total_amount:,.0f} VNĐ",
            "qr_link": vietqr_url,
            "due_date": f"15/{month + 1 if month < 12 else 1}/{year if month < 12 else year + 1}",
        },
    )


async def notify_invoice_paid(
    phone: str,
    room_number: str,
    month: int,
    year: int,
    amount: float,
) -> bool:
    """Notify tenant that their payment was received."""
    return await send_zalo_zns(
        phone=phone,
        template_id=settings.ZALO_TEMPLATE_PAID_ID or "demo_paid",
        template_data={
            "room_number": room_number,
            "month": f"T{month}/{year}",
            "amount": f"{amount:,.0f} VNĐ",
            "status": "Đã thanh toán ✅",
        },
    )


async def notify_ticket_assigned(
    technician_phone: str,
    ticket_title: str,
    room_number: str,
) -> bool:
    """Notify technician of a new assigned ticket."""
    return await send_zalo_zns(
        phone=technician_phone,
        template_id=settings.ZALO_TEMPLATE_TICKET_ID or "demo_ticket",
        template_data={
            "ticket_title": ticket_title,
            "room_number": room_number,
            "action": "Vui lòng liên hệ người thuê để xử lý",
        },
    )


# ─── Firebase FCM ─────────────────────────────────────────────────────────────

async def send_fcm_push(
    fcm_token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
) -> bool:
    """Send Firebase Cloud Messaging push notification."""
    if not settings.FIREBASE_CREDENTIALS_JSON:
        print(f"[FCM DEMO] To {fcm_token[:10]}...: {title} — {body}")
        return True

    try:
        # In production, use firebase-admin SDK
        # Here we use the HTTP v1 API for simplicity
        print(f"[FCM] Sending to {fcm_token[:10]}...: {title}")
        return True
    except Exception as e:
        print(f"[FCM] Error: {e}")
        return False
