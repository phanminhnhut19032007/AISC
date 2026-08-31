"""ChatMessage model to support real-time tenant-owner chat rooms and direct messaging."""
import uuid
from sqlalchemy import ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


class ChatMessage(UUIDBase):
    __tablename__ = "chat_messages"

    building_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("buildings.id"), nullable=False, index=True)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_recalled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    sender: Mapped["User"] = relationship("User", foreign_keys=[sender_id])  # noqa
    recipient: Mapped["User"] = relationship("User", foreign_keys=[recipient_id])  # noqa
    building: Mapped["Building"] = relationship("Building")  # noqa
