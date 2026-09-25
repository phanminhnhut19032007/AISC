"""Building and Room CRUD routes."""
import uuid
from typing import List
from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.api.deps import DB, OwnerOnly, CurrentUser
from app.models.building import Building, Room
from app.models.user import UserRole
from app.models.contract import Contract, ContractStatus
from app.schemas.building import (
    BuildingCreate, BuildingUpdate, BuildingOut,
    RoomCreate, RoomUpdate, RoomOut,
)

router = APIRouter(tags=["Buildings & Rooms"])


import secrets
import string

def generate_5char_code(prefix: str = "") -> str:
    chars = string.ascii_uppercase + string.digits
    body_len = max(1, 5 - len(prefix))
    code = prefix + "".join(secrets.choice(chars) for _ in range(body_len))
    return code[:5].upper()


# ─── Buildings ───────────────────────────────────────────────────────────────

@router.post("/buildings", response_model=BuildingOut, status_code=201)
async def create_building(body: BuildingCreate, db: DB, owner: OwnerOnly):
    """Tạo tòa nhà mới."""
    data = body.model_dump()
    if not data.get("building_code"):
        # Auto-generate 5-character building code
        data["building_code"] = generate_5char_code()
    else:
        data["building_code"] = data["building_code"].upper()[:5]

    building = Building(**data, owner_id=owner.id)
    db.add(building)
    await db.flush()
    return BuildingOut.model_validate(building)


@router.get("/buildings", response_model=List[BuildingOut])
async def list_buildings(
    db: DB,
    current_user: CurrentUser,
    include_deleted: bool = False,
):
    """Danh sách tòa nhà của chủ trọ hoặc người thuê."""
    if current_user.role in (UserRole.OWNER, UserRole.SUPERADMIN):
        stmt = select(Building).where(Building.owner_id == current_user.id)
        if not include_deleted:
            stmt = stmt.where(Building.is_deleted == False)
        else:
            stmt = stmt.where(Building.is_deleted == True)
    elif current_user.role == UserRole.TENANT:
        stmt = (
            select(Building)
            .join(Room, Room.building_id == Building.id)
            .join(Contract, Contract.room_id == Room.id)
            .where(
                Contract.tenant_id == current_user.id,
                Contract.status == ContractStatus.ACTIVE,
                Building.is_deleted == False
            )
            .distinct()
        )
    else:
        return []

    result = await db.execute(stmt)
    buildings = result.scalars().all()
    # Backfill missing building codes
    for b in buildings:
        if not b.building_code:
            b.building_code = generate_5char_code()
    await db.flush()
    return [BuildingOut.model_validate(b) for b in buildings]



@router.get("/buildings/{building_id}", response_model=BuildingOut)
async def get_building(building_id: uuid.UUID, db: DB, current_user: CurrentUser):
    building = await db.get(Building, building_id)
    if not building:
        raise HTTPException(404, "Không tìm thấy tòa nhà")
    if not building.building_code:
        building.building_code = generate_5char_code()
        await db.flush()
    return BuildingOut.model_validate(building)


@router.patch("/buildings/{building_id}", response_model=BuildingOut)
async def update_building(building_id: uuid.UUID, body: BuildingUpdate, db: DB, owner: OwnerOnly):
    building = await db.get(Building, building_id)
    if not building or building.owner_id != owner.id:
        raise HTTPException(404, "Không tìm thấy tòa nhà")
    for k, v in body.model_dump(exclude_none=True).items():
        if k == "building_code" and v:
            v = v.upper()[:5]
        setattr(building, k, v)
    return BuildingOut.model_validate(building)


# ─── Rooms ───────────────────────────────────────────────────────────────────

@router.post("/rooms", response_model=RoomOut, status_code=201)
async def create_room(body: RoomCreate, db: DB, owner: OwnerOnly):
    """Thêm phòng mới vào tòa nhà."""
    data = body.model_dump()
    if not data.get("room_code"):
        pfx = f"P{data['room_number']}" if len(data.get("room_number", "")) <= 4 else "P"
        data["room_code"] = generate_5char_code(prefix=pfx)
    else:
        data["room_code"] = data["room_code"].upper()[:5]

    room = Room(**data)
    db.add(room)
    await db.flush()
    return RoomOut.model_validate(room)


@router.get("/buildings/{building_id}/rooms", response_model=List[RoomOut])
async def list_rooms(building_id: uuid.UUID, db: DB, current_user: CurrentUser):
    """Danh sách phòng của một tòa nhà."""
    stmt = select(Room).where(Room.building_id == building_id)
    result = await db.execute(stmt)
    rooms = result.scalars().all()
    # Backfill missing room codes
    for r in rooms:
        if not r.room_code:
            pfx = f"P{r.room_number}" if len(r.room_number) <= 4 else "P"
            r.room_code = generate_5char_code(prefix=pfx)
    await db.flush()
    return [RoomOut.model_validate(r) for r in rooms]


@router.get("/rooms/{room_id}", response_model=RoomOut)
async def get_room(room_id: uuid.UUID, db: DB, current_user: CurrentUser):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(404, "Không tìm thấy phòng")
    return RoomOut.model_validate(room)


@router.patch("/rooms/{room_id}", response_model=RoomOut)
async def update_room(room_id: uuid.UUID, body: RoomUpdate, db: DB, owner: OwnerOnly):
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(404, "Không tìm thấy phòng")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(room, k, v)
    return RoomOut.model_validate(room)


@router.delete("/buildings/{building_id}", status_code=204)
async def delete_building(building_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Xóa mềm tòa nhà và tất cả phòng đi kèm."""
    building = await db.get(Building, building_id)
    if not building or building.owner_id != owner.id:
        raise HTTPException(404, "Không tìm thấy tòa nhà")
    building.is_deleted = True
    await db.flush()
    return None


@router.post("/buildings/{building_id}/restore", response_model=BuildingOut)
async def restore_building(building_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Phục hồi tòa nhà đã xóa mềm."""
    building = await db.get(Building, building_id)
    if not building or building.owner_id != owner.id:
        raise HTTPException(404, "Không tìm thấy tòa nhà")
    building.is_deleted = False
    await db.flush()
    return BuildingOut.model_validate(building)


@router.delete("/rooms/{room_id}", status_code=204)
async def delete_room(room_id: uuid.UUID, db: DB, owner: OwnerOnly):
    """Xóa một phòng cụ thể."""
    room = await db.get(Room, room_id)
    if not room:
        raise HTTPException(404, "Không tìm thấy phòng")
    await db.delete(room)
    return None
