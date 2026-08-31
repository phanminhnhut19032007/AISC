"""Maintenance Ticket routes."""
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from sqlalchemy import select

from app.api.deps import DB, CurrentUser, OwnerOnly
from app.models.ticket import Ticket, TicketStatus, TicketRating
from app.models.user import UserRole
from app.schemas.ticket import (
    TicketCreate, TicketAssign, TicketStatusUpdate,
    TicketRatingCreate, TicketOut, TicketRatingOut,
)
from app.services.notification_service import notify_ticket_assigned

router = APIRouter(prefix="/tickets", tags=["Maintenance Tickets"])

# Valid state transitions
ALLOWED_TRANSITIONS = {
    TicketStatus.OPEN: [TicketStatus.ASSIGNED, TicketStatus.CANCELLED],
    TicketStatus.ASSIGNED: [TicketStatus.IN_PROGRESS, TicketStatus.OPEN],
    TicketStatus.IN_PROGRESS: [TicketStatus.PENDING_CONFIRM],
    TicketStatus.PENDING_CONFIRM: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
    TicketStatus.CLOSED: [],
    TicketStatus.CANCELLED: [],
}


@router.post("", response_model=TicketOut, status_code=201)
async def create_ticket(body: TicketCreate, db: DB, current_user: CurrentUser):
    """Nguoi thue tao ticket su co."""
    imgs_json = json.dumps(body.image_urls) if body.image_urls else "[]"
    ticket = Ticket(
        room_id=body.room_id,
        tenant_id=current_user.id,
        title=body.title,
        description=body.description,
        priority=body.priority,
        image_urls=imgs_json,
        status=TicketStatus.OPEN,
    )
    db.add(ticket)
    await db.flush()
    return TicketOut.model_validate(ticket)


@router.get("", response_model=List[TicketOut])
async def list_tickets(
    db: DB,
    current_user: CurrentUser,
    room_id: Optional[str] = None,
    status: Optional[TicketStatus] = None,
):
    """Danh sách ticket (theo phòng hoặc trạng thái)."""
    stmt = select(Ticket).order_by(Ticket.created_at.desc())
    if current_user.role == UserRole.TENANT:
        stmt = stmt.where(Ticket.tenant_id == current_user.id)
    elif current_user.role == UserRole.TECHNICIAN:
        stmt = stmt.where(Ticket.technician_id == current_user.id)
    if room_id:
        stmt = stmt.where(Ticket.room_id == uuid.UUID(room_id))
    if status:
        stmt = stmt.where(Ticket.status == status)
    result = await db.execute(stmt)
    return [TicketOut.model_validate(t) for t in result.scalars().all()]


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(ticket_id: str, db: DB, current_user: CurrentUser):
    ticket = await db.get(Ticket, uuid.UUID(ticket_id))
    if not ticket:
        raise HTTPException(404, "Không tìm thấy ticket")
    return TicketOut.model_validate(ticket)


@router.patch("/{ticket_id}/assign", response_model=TicketOut)
async def assign_ticket(ticket_id: str, body: TicketAssign, db: DB, owner: OwnerOnly):
    """Chủ trọ gán ticket cho thợ."""
    ticket = await db.get(Ticket, uuid.UUID(ticket_id))
    if not ticket:
        raise HTTPException(404, "Không tìm thấy ticket")
    ticket.technician_id = uuid.UUID(body.technician_id)
    ticket.status = TicketStatus.ASSIGNED

    # Notify technician
    technician = await db.get(__import__("app.models.user", fromlist=["User"]).User, uuid.UUID(body.technician_id))
    if technician:
        from app.models.building import Room
        room = await db.get(Room, ticket.room_id)
        await notify_ticket_assigned(
            technician_phone=technician.phone,
            ticket_title=ticket.title,
            room_number=room.room_number if room else "?",
        )
    await db.flush()
    return TicketOut.model_validate(ticket)


@router.patch("/{ticket_id}/status", response_model=TicketOut)
async def update_ticket_status(ticket_id: str, body: TicketStatusUpdate, db: DB, current_user: CurrentUser):
    """Cập nhật trạng thái ticket (tuân theo state machine)."""
    ticket = await db.get(Ticket, uuid.UUID(ticket_id))
    if not ticket:
        raise HTTPException(404, "Không tìm thấy ticket")

    if current_user.role not in [UserRole.OWNER, UserRole.SUPERADMIN]:
        allowed = ALLOWED_TRANSITIONS.get(ticket.status, [])
        if body.status not in allowed:
            raise HTTPException(
                400,
                f"Không thể chuyển từ {ticket.status.value} → {body.status.value}. "
                f"Cho phép: {[s.value for s in allowed]}",
            )

    ticket.status = body.status
    if body.resolution_note:
        ticket.resolution_note = body.resolution_note
    await db.flush()
    return TicketOut.model_validate(ticket)


@router.post("/{ticket_id}/rating", response_model=TicketRatingOut, status_code=201)
async def rate_ticket(ticket_id: str, body: TicketRatingCreate, db: DB, current_user: CurrentUser):
    """Người thuê đánh giá sau khi ticket đóng."""
    ticket = await db.get(Ticket, uuid.UUID(ticket_id))
    if not ticket:
        raise HTTPException(404, "Không tìm thấy ticket")
    if ticket.status != TicketStatus.CLOSED:
        raise HTTPException(400, "Chỉ được đánh giá ticket đã đóng")
    if ticket.tenant_id != current_user.id:
        raise HTTPException(403, "Chỉ người thuê tạo ticket mới được đánh giá")

    rating = TicketRating(
        ticket_id=ticket.id,
        score=body.score,
        comment=body.comment,
    )
    db.add(rating)
    await db.flush()
    return TicketRatingOut.model_validate(rating)
