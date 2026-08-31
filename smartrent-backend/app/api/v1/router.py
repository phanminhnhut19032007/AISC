"""API v1 router — aggregates all sub-routers."""
from fastapi import APIRouter
from app.api.v1 import auth, buildings, meter_readings, invoices, tickets, webhooks, chat

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(buildings.router)
api_router.include_router(meter_readings.router)
api_router.include_router(invoices.router)
api_router.include_router(tickets.router)
api_router.include_router(webhooks.router)
api_router.include_router(chat.router)
