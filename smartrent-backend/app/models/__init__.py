"""Models package — import all models so SQLAlchemy registers them."""
from app.models.base import UUIDBase  # noqa
from app.models.user import User, UserRole  # noqa
from app.models.building import Building, Room, RoomStatus  # noqa
from app.models.contract import Contract, ContractStatus  # noqa
from app.models.invoice import MeterReading, MeterType, Invoice, InvoiceStatus, Payment, PaymentChannel  # noqa
from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketRating  # noqa
from app.models.chat import ChatMessage  # noqa
from app.models.emergency import EmergencyAlert, EmergencyType, EmergencyStatus  # noqa
