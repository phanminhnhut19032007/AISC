"""Seed script — populate SmartRent database with realistic demo data for AISC presentation."""
import asyncio
import os
import sys

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./smartrent_demo.db"
os.environ["DATABASE_URL_SYNC"] = "sqlite:///./smartrent_demo.db"
sys.path.insert(0, os.path.dirname(__file__))


async def seed(reset: bool = False):
    from app.core.database import init_db, AsyncSessionLocal, engine, Base
    from app.models.user import User, UserRole
    from app.models.building import Building, Room, RoomStatus
    from app.models.contract import Contract, ContractStatus
    from app.models.invoice import Invoice, InvoiceStatus, MeterReading, MeterType, Payment, PaymentChannel
    from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketRating
    from app.models.emergency import EmergencyAlert, EmergencyStatus, EmergencyType
    from app.core.security import hash_password
    from app.services.vietqr_service import generate_vietqr_content
    import uuid
    from datetime import date, datetime, timezone, timedelta
    import secrets, string

    if reset:
        async with engine.begin() as conn:
            from app.models import base  # noqa: F401
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        print("[Seed] Database reset and tables initialized")

    async with AsyncSessionLocal() as db:
        # ── Owner ────────────────────────────────────────────────────────────
        owner = User(
            full_name="Chu tro",
            phone="0388430402",
            email="chuatro@smartrent.vn",
            hashed_password=hash_password("MinhNhut1"),
            role=UserRole.OWNER,
        )
        db.add(owner)

        # ── Tenants ──────────────────────────────────────────────────────────
        tenants = []
        tenant_data = [
            ("Minh Nhut", "0388430402", "MinhNhut2"),
            ("Le Van Nam", "0912345002", "tenant123"),
            ("Pham Thi Hoa", "0912345003", "tenant123"),
            ("Nguyen Van Binh", "0912345004", "tenant123"),
            ("Hoang Thi Lan", "0912345005", "tenant123"),
        ]
        for name, phone, passw in tenant_data:
            t = User(full_name=name, phone=phone, hashed_password=hash_password(passw), role=UserRole.TENANT)
            db.add(t)
            tenants.append(t)

        # ── Technician ───────────────────────────────────────────────────────
        tech = User(full_name="Vo Van Tho", phone="0933111222", hashed_password=hash_password("tech123"), role=UserRole.TECHNICIAN)
        db.add(tech)

        await db.flush()

        # ── Building ─────────────────────────────────────────────────────────
        building = Building(
            owner_id=owner.id,
            name="Nha Tro Minh Chau",
            building_code="MC892",
            address="45 Duong D1, P. Binh Thanh, TP.HCM",
            province="Ho Chi Minh",
            total_floors=4,
        )
        db.add(building)
        await db.flush()

        # ── Rooms ────────────────────────────────────────────────────────────
        rooms_data = [
            ("101", "P101A", 1, 3_000_000, RoomStatus.OCCUPIED),
            ("102", "P102B", 1, 3_200_000, RoomStatus.OCCUPIED),
            ("103", "P103C", 1, 2_800_000, RoomStatus.AVAILABLE),
            ("201", "P201A", 2, 3_500_000, RoomStatus.OCCUPIED),
            ("202", "P202B", 2, 3_500_000, RoomStatus.OCCUPIED),
            ("203", "P203C", 2, 3_000_000, RoomStatus.MAINTENANCE),
            ("301", "P301A", 3, 4_000_000, RoomStatus.OCCUPIED),
            ("302", "P302B", 3, 3_800_000, RoomStatus.AVAILABLE),
        ]
        rooms = []
        for number, r_code, floor, rent, status in rooms_data:
            r = Room(
                building_id=building.id,
                room_number=number,
                room_code=r_code,
                floor=floor,
                base_rent=rent,
                electricity_rate=4000,
                water_rate=25000,
                internet_fee=100_000,
                status=status,
            )
            db.add(r)
            rooms.append(r)
        await db.flush()

        # ── Contracts (for occupied rooms) ───────────────────────────────────
        occupied_rooms = [r for r in rooms if r.status == RoomStatus.OCCUPIED]
        for i, room in enumerate(occupied_rooms):
            tenant = tenants[i % len(tenants)]
            contract = Contract(
                room_id=room.id,
                tenant_id=tenant.id,
                start_date=date(2025, 1, 1),
                monthly_rent=room.base_rent,
                deposit_amount=room.base_rent * 2,
                status=ContractStatus.ACTIVE,
            )
            db.add(contract)
        await db.flush()

        # ── Meter Readings & Invoices (3 months) ─────────────────────────────
        now = datetime.now(timezone.utc)
        for month_offset in range(3):
            month = now.month - month_offset
            year = now.year
            if month <= 0:
                month += 12
                year -= 1

            for room in occupied_rooms:
                # Electricity reading
                old_e = 1200 + month_offset * 150
                new_e = old_e + 120 + (rooms.index(room) * 10)
                elec = MeterReading(
                    room_id=room.id, meter_type=MeterType.ELECTRICITY,
                    month=month, year=year,
                    old_reading=old_e, new_reading=new_e,
                    consumption=new_e - old_e, is_manual=True,
                )
                db.add(elec)

                # Water reading
                old_w = 50 + month_offset * 12
                new_w = old_w + 10 + (rooms.index(room) * 2)
                water = MeterReading(
                    room_id=room.id, meter_type=MeterType.WATER,
                    month=month, year=year,
                    old_reading=old_w, new_reading=new_w,
                    consumption=new_w - old_w, is_manual=True,
                )
                db.add(water)
                await db.flush()

                # Invoice
                elec_amt = (new_e - old_e) * room.electricity_rate
                water_amt = (new_w - old_w) * room.water_rate
                total = room.base_rent + elec_amt + water_amt + room.internet_fee

                suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
                ref = f"SR{room.room_number.replace(' ','')}{month:02d}{str(year)[-2:]}{suffix}"
                qr = generate_vietqr_content(int(total), ref, f"Tien phong {room.room_number} T{month}/{year}")

                # Paid for older months, sent for current
                is_paid = month_offset > 0
                inv = Invoice(
                    room_id=room.id, month=month, year=year,
                    base_rent=room.base_rent,
                    electricity_amount=elec_amt,
                    water_amount=water_amt,
                    service_fees_amount=room.internet_fee,
                    total_amount=total,
                    status=InvoiceStatus.PAID if is_paid else InvoiceStatus.SENT,
                    due_date=datetime(year, month, 15, tzinfo=timezone.utc) + timedelta(days=30),
                    paid_at=datetime(year, month, 20, tzinfo=timezone.utc) if is_paid else None,
                    payment_reference=ref,
                    vietqr_code=qr,
                )
                db.add(inv)
                await db.flush()

                if is_paid:
                    payment = Payment(
                        invoice_id=inv.id, amount=total,
                        channel=PaymentChannel.VIETQR,
                        gateway_ref=f"TXN{month:02d}{year}{rooms.index(room):02d}",
                        paid_at=datetime(year, month, 20, tzinfo=timezone.utc),
                    )
                    db.add(payment)

        # ── Tickets ──────────────────────────────────────────────────────────
        import json
        ticket_data = [
            (rooms[0], tenants[0], "May lanh khong mat", "May lanh phong bi hong, khong ra hoi lanh", TicketStatus.OPEN, TicketPriority.HIGH),
            (rooms[1], tenants[1], "Voi nuoc bi ri", "Voi nuoc trong toilet bi ri, nuoc chay lien tuc", TicketStatus.ASSIGNED, TicketPriority.MEDIUM),
            (rooms[3], tenants[3], "Den hanh lang hong", "Bong den hanh lang bi chay, toi qua", TicketStatus.IN_PROGRESS, TicketPriority.LOW),
            (rooms[4], tenants[4], "Cua khoa bi ket", "Khoa cua phong bi hu, khong mo duoc", TicketStatus.PENDING_CONFIRM, TicketPriority.URGENT),
            (rooms[6], tenants[0], "Bong nuoc tran lan", "San nha phong tam bi tran nuoc", TicketStatus.CLOSED, TicketPriority.HIGH),
        ]
        for room, tenant, title, desc, status, priority in ticket_data:
            ticket = Ticket(
                room_id=room.id, tenant_id=tenant.id,
                title=title, description=desc,
                status=status, priority=priority,
                image_urls=json.dumps([]),
                technician_id=tech.id if status not in [TicketStatus.OPEN] else None,
            )
            db.add(ticket)
            await db.flush()

            if status == TicketStatus.CLOSED:
                rating = TicketRating(ticket_id=ticket.id, score=4, comment="Tho sua nhanh, lich su")
                db.add(rating)

        # ── Emergency Alerts ────────────────────────────────────────────────
        alert_data = [
            ("101", tenants[0], EmergencyType.FIRE, "Có khói bốc lên gần ban công", EmergencyStatus.ACKNOWLEDGED, owner.full_name),
            ("101", tenants[0], EmergencyType.GAS_LEAK, "Mùi gas nồng nặc ở khu vực bếp", EmergencyStatus.RESOLVED, owner.full_name),
            ("201", tenants[1], EmergencyType.ELEVATOR, "Thang máy tầng 2 bị kẹt cửa", EmergencyStatus.RESOLVED, owner.full_name),
        ]
        for room_no, sender, em_type, desc, st, ack_by in alert_data:
            em = EmergencyAlert(
                room_number=room_no,
                building_name="Tòa nhà REASY",
                sender_id=sender.id,
                sender_name=sender.full_name,
                sender_phone=sender.phone,
                emergency_type=em_type,
                description=desc,
                status=st,
                acknowledged_by=ack_by,
            )
            db.add(em)

        await db.commit()

    print("[Seed] Done! Demo data seeded successfully.")
    print("[Seed] Owner login:  phone=0388430402 / pass=MinhNhut1 (Chu tro)")
    print("[Seed] Tenant login: phone=0388430402 / pass=MinhNhut2 (Minh Nhut)")
    print("[Seed] API docs: http://localhost:8000/docs")


if __name__ == "__main__":
    asyncio.run(seed(reset=True))
