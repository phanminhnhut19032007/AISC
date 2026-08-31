import asyncio
import os
import sys
import random

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./smartrent_test.db"
os.environ["PYTHONIOENCODING"] = "utf-8"

# Use unique phone numbers per test run to avoid conflicts
RUN_ID = random.randint(1000, 9999)
OWNER_PHONE = f"09{RUN_ID}00000"
TENANT_PHONE = f"09{RUN_ID}00001"

async def run_test():
    from app.core.database import init_db
    await init_db()

    from app.main import app
    from httpx import AsyncClient, ASGITransport

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health check
        r = await client.get("/health")
        print("1. Health:", r.json()["status"])

        # 2. Register owner
        r = await client.post("/api/v1/auth/register", json={
            "full_name": "Nguyen Van An",
            "phone": OWNER_PHONE,
            "password": "smartrent123",
            "role": "OWNER",
        })
        owner = r.json()
        print(f"2. Register: HTTP {r.status_code}, role={owner.get('role')}")
        token = owner["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create building
        r = await client.post("/api/v1/buildings",
            json={"name": "Toa Nha A", "address": "123 Nguyen Trai, Q1, TP.HCM"},
            headers=headers)
        building = r.json()
        print(f"3. Building: HTTP {r.status_code}, name={building.get('name')}")

        # 4. Create room
        r = await client.post("/api/v1/rooms",
            json={"building_id": building["id"], "room_number": "101", "base_rent": 3000000,
                  "electricity_rate": 4000, "water_rate": 25000},
            headers=headers)
        room = r.json()
        print(f"4. Room: HTTP {r.status_code}, number={room.get('room_number')}, rent={room.get('base_rent')}")

        # 5. Generate invoice
        r = await client.post("/api/v1/invoices/generate",
            json={"room_id": room["id"], "month": 8, "year": 2025},
            headers=headers)
        inv = r.json()
        print(f"5. Invoice: HTTP {r.status_code}, total={inv.get('total_amount')}, status={inv.get('status')}")
        qr = inv.get("vietqr_code", "")
        print(f"   VietQR: {qr[:80]}...")
        ref = inv.get("payment_reference")
        print(f"   PayRef: {ref}")

        # 6. Simulate SePay webhook
        r = await client.post("/api/v1/webhooks/sepay", json={
            "transferAmount": inv.get("total_amount"),
            "content": f"Thanh toan {ref} tien phong 101 thang 8 2025",
            "code": ref,
            "referenceCode": "TXN20250801123456",
        })
        wh = r.json()
        matched = wh.get("result", {}).get("matched")
        print(f"6. Webhook: HTTP {r.status_code}, matched={matched}")

        # 7. Verify invoice → PAID
        inv_id = inv["id"]
        r = await client.get(f"/api/v1/invoices/{inv_id}", headers=headers)
        paid_inv = r.json()
        status = paid_inv.get("status")
        print(f"7. Invoice after webhook: status={status}")

        # 8. Create ticket
        r = await client.post("/api/v1/auth/register", json={
            "full_name": "Tran Thi B", "phone": TENANT_PHONE,
            "password": "tenant123", "role": "TENANT"
        })
        tenant = r.json()
        tenant_headers = {"Authorization": f"Bearer {tenant['access_token']}"}

        r = await client.post("/api/v1/tickets",
            json={"room_id": room["id"], "title": "May lanh hong", "priority": "HIGH",
                  "description": "May lanh khong len"},
            headers=tenant_headers)
        ticket = r.json()
        print(f"8. Ticket: HTTP {r.status_code}, status={ticket.get('status')}, title={ticket.get('title')}")

        print()
        print("=" * 40)
        print("ALL 8 TESTS PASSED!" if status == "PAID" else f"FAILED: invoice status is {status}")
        print("=" * 40)


asyncio.run(run_test())
