"""FastAPI router and WebSocket controller for real-time building chat, member listing, and DMs."""
import uuid
import json
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DB, CurrentUser, get_current_user
from app.core.database import AsyncSessionLocal
from app.models.chat import ChatMessage
from app.models.building import Building, Room
from app.models.contract import Contract, ContractStatus
from app.models.user import User, UserRole
from app.schemas.chat import ChatMessageOut, ChatMessageCreate
from app.core.security import decode_access_token

router = APIRouter(prefix="/chat", tags=["Chat"])


class ConnectionManager:
    def __init__(self):
        # building_id -> list of (user_id, WebSocket)
        self.active_connections: Dict[uuid.UUID, List[tuple[uuid.UUID, WebSocket]]] = {}

    async def connect(self, building_id: uuid.UUID, user_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        if building_id not in self.active_connections:
            self.active_connections[building_id] = []
        self.active_connections[building_id].append((user_id, websocket))

    def disconnect(self, building_id: uuid.UUID, websocket: WebSocket):
        if building_id in self.active_connections:
            self.active_connections[building_id] = [
                conn for conn in self.active_connections[building_id] if conn[1] != websocket
            ]
            if not self.active_connections[building_id]:
                del self.active_connections[building_id]

    async def broadcast(self, building_id: uuid.UUID, message: ChatMessageOut):
        if building_id in self.active_connections:
            data = {
                "type": "message",
                "id": str(message.id),
                "building_id": str(message.building_id),
                "sender_id": str(message.sender_id),
                "recipient_id": str(message.recipient_id) if message.recipient_id else None,
                "sender_name": message.sender_name,
                "sender_role": message.sender_role,
                "recipient_name": message.recipient_name,
                "message": message.message,
                "is_recalled": message.is_recalled,
                "created_at": message.created_at.isoformat(),
            }
            for user_id, connection in self.active_connections[building_id]:
                # Group message (recipient is None) or private message sent to sender/recipient
                if (message.recipient_id is None) or (user_id == message.sender_id) or (user_id == message.recipient_id):
                    try:
                        await connection.send_json(data)
                    except Exception:
                        pass

    async def broadcast_recall(self, building_id: uuid.UUID, message_id: uuid.UUID):
        if building_id in self.active_connections:
            data = {
                "type": "recall",
                "message_id": str(message_id)
            }
            for user_id, connection in self.active_connections[building_id]:
                try:
                    await connection.send_json(data)
                except Exception:
                    pass


manager = ConnectionManager()


async def check_chat_access(user: User, building_id: uuid.UUID, db) -> bool:
    if user.role in (UserRole.OWNER, UserRole.SUPERADMIN):
        building = await db.get(Building, building_id)
        if building and building.owner_id == user.id:
            return True
    elif user.role == UserRole.TENANT:
        stmt = select(Contract).join(Room).where(
            Room.building_id == building_id,
            Contract.tenant_id == user.id,
            Contract.status == ContractStatus.ACTIVE
        ).limit(1)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            return True
    return False


@router.get("/{building_id}/members")
async def list_building_members(building_id: uuid.UUID, db: DB, current_user: CurrentUser):
    """Lấy danh sách tất cả các thành viên (Chủ trọ + các Phòng đang có hợp đồng) để chat riêng."""
    has_access = await check_chat_access(current_user, building_id, db)
    if not has_access:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xem thông tin tòa nhà này")
        
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Tòa nhà không tồn tại")
        
    # Owner
    owner_stmt = select(User).where(User.id == building.owner_id)
    owner_res = await db.execute(owner_stmt)
    owner = owner_res.scalar_one_or_none()
    
    members = []
    if owner:
        members.append({
            "user_id": str(owner.id),
            "full_name": owner.full_name,
            "role": "OWNER",
            "room_number": "Chủ nhà"
        })
        
    # Active Tenants in Rooms
    tenant_stmt = (
        select(User, Room.room_number)
        .join(Contract, Contract.tenant_id == User.id)
        .join(Room, Room.id == Contract.room_id)
        .where(
            Room.building_id == building_id,
            Contract.status == ContractStatus.ACTIVE,
            User.is_active == True
        )
    )
    tenant_res = await db.execute(tenant_stmt)
    for tenant, room_number in tenant_res.all():
        # Tránh trùng lặp
        if not any(m["user_id"] == str(tenant.id) for m in members):
            members.append({
                "user_id": str(tenant.id),
                "full_name": tenant.full_name,
                "role": "TENANT",
                "room_number": f"Phòng {room_number}"
            })
        
    return members


@router.get("/{building_id}/messages", response_model=List[ChatMessageOut])
async def list_chat_messages(
    building_id: uuid.UUID,
    db: DB,
    current_user: CurrentUser,
    recipient_id: Optional[uuid.UUID] = None
):
    # Verify access
    has_access = await check_chat_access(current_user, building_id, db)
    if not has_access:
        raise HTTPException(status_code=403, detail="Bạn không có quyền truy cập kênh chat này")

    if recipient_id is None:
        # Group chats
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.building_id == building_id, ChatMessage.recipient_id == None)
            .options(selectinload(ChatMessage.sender))
            .order_by(ChatMessage.created_at.asc())
            .limit(100)
        )
    else:
        # Private DMs
        stmt = (
            select(ChatMessage)
            .where(
                ChatMessage.building_id == building_id,
                (
                    ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == recipient_id)) |
                    ((ChatMessage.sender_id == recipient_id) & (ChatMessage.recipient_id == current_user.id))
                )
            )
            .options(selectinload(ChatMessage.sender), selectinload(ChatMessage.recipient))
            .order_by(ChatMessage.created_at.asc())
            .limit(100)
        )

    result = await db.execute(stmt)
    messages = result.scalars().all()

    return [
        ChatMessageOut(
            id=m.id,
            building_id=m.building_id,
            sender_id=m.sender_id,
            recipient_id=m.recipient_id,
            sender_name=m.sender.full_name,
            sender_role=m.sender.role.value,
            recipient_name=m.recipient.full_name if m.recipient else None,
            message=m.message if not m.is_recalled else "Tin nhắn đã bị thu hồi",
            is_recalled=m.is_recalled,
            created_at=m.created_at,
        )
        for m in messages
    ]


@router.post("/{building_id}/messages", response_model=ChatMessageOut)
async def send_chat_message(building_id: uuid.UUID, body: ChatMessageCreate, db: DB, current_user: CurrentUser):
    # Verify access
    has_access = await check_chat_access(current_user, building_id, db)
    if not has_access:
        raise HTTPException(status_code=403, detail="Bạn không có quyền gửi tin nhắn đến kênh chat này")

    # Save to db
    msg = ChatMessage(
        building_id=building_id,
        sender_id=current_user.id,
        recipient_id=body.recipient_id,
        message=body.message
    )
    db.add(msg)
    await db.flush()

    # Pre-load sender details
    await db.refresh(msg, ["sender"])
    recipient_name = None
    if msg.recipient_id:
        await db.refresh(msg, ["recipient"])
        recipient_name = msg.recipient.full_name

    out_msg = ChatMessageOut(
        id=msg.id,
        building_id=msg.building_id,
        sender_id=msg.sender_id,
        recipient_id=msg.recipient_id,
        sender_name=msg.sender.full_name,
        sender_role=msg.sender.role.value,
        recipient_name=recipient_name,
        message=msg.message,
        is_recalled=msg.is_recalled,
        created_at=msg.created_at or datetime.now(),
    )

    # Broadcast
    await manager.broadcast(building_id, out_msg)

    return out_msg


@router.delete("/{building_id}/messages/{message_id}")
async def recall_chat_message(building_id: uuid.UUID, message_id: uuid.UUID, db: DB, current_user: CurrentUser):
    """Thu hồi tin nhắn."""
    msg = await db.get(ChatMessage, message_id)
    if not msg:
        raise HTTPException(status_code=404, detail="Tin nhắn không tồn tại")
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể thu hồi tin nhắn của chính mình")
        
    msg.is_recalled = True
    await db.commit()
    
    # Broadcast recall event
    await manager.broadcast_recall(building_id, message_id)
    
    return {"status": "ok", "message_id": str(message_id)}


@router.websocket("/{building_id}/ws")
async def websocket_endpoint(websocket: WebSocket, building_id: uuid.UUID, token: str = Query(...)):
    user_id = decode_access_token(token)
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    user_uuid = uuid.UUID(user_id)

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_uuid)
        if not user or not user.is_active:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        has_access = await check_chat_access(user, building_id, db)
        if not has_access:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await manager.connect(building_id, user_uuid, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            recipient_uuid = None
            text = ""
            try:
                payload = json.loads(data)
                text = payload.get("message", "").strip()
                rec_id = payload.get("recipient_id")
                if rec_id:
                    recipient_uuid = uuid.UUID(rec_id)
            except Exception:
                text = data.strip()

            if not text:
                continue

            async with AsyncSessionLocal() as db:
                user = await db.get(User, user_uuid)
                msg = ChatMessage(
                    building_id=building_id,
                    sender_id=user.id,
                    recipient_id=recipient_uuid,
                    message=text
                )
                db.add(msg)
                await db.flush()
                
                stmt_sender = select(User).where(User.id == msg.sender_id)
                res_sender = await db.execute(stmt_sender)
                sender = res_sender.scalar_one()
                
                recipient_name = None
                if msg.recipient_id:
                    stmt_rec = select(User).where(User.id == msg.recipient_id)
                    res_rec = await db.execute(stmt_rec)
                    recipient = res_rec.scalar_one_or_none()
                    if recipient:
                         recipient_name = recipient.full_name
                         
                await db.commit()
                
                out_msg = ChatMessageOut(
                    id=msg.id,
                    building_id=msg.building_id,
                    sender_id=msg.sender_id,
                    recipient_id=msg.recipient_id,
                    sender_name=sender.full_name,
                    sender_role=sender.role.value,
                    recipient_name=recipient_name,
                    message=msg.message,
                    is_recalled=msg.is_recalled,
                    created_at=msg.created_at or datetime.now(),
                )
            
            await manager.broadcast(building_id, out_msg)
    except WebSocketDisconnect:
        manager.disconnect(building_id, websocket)
    except Exception:
        manager.disconnect(building_id, websocket)
