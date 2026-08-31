"""User model — covers Owner, Tenant, Technician roles."""
import enum
import uuid
from typing import Optional, List
from sqlalchemy import String, Boolean, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import UUIDBase


class UserRole(str, enum.Enum):
    OWNER = "OWNER"          # Chủ trọ / Admin tòa nhà
    TENANT = "TENANT"        # Người thuê
    TECHNICIAN = "TECHNICIAN"  # Thợ sửa chữa / Đối tác
    SUPERADMIN = "SUPERADMIN"  # Platform admin


class User(UUIDBase):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    national_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.TENANT, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    zalo_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    fcm_token: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    # Relationships
    buildings: Mapped[List["Building"]] = relationship("Building", back_populates="owner")  # noqa
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="tenant")  # noqa
    tickets_created: Mapped[List["Ticket"]] = relationship(  # noqa
        "Ticket",
        foreign_keys="[Ticket.tenant_id]",
        back_populates="tenant",
    )
    tickets_assigned: Mapped[List["Ticket"]] = relationship(  # noqa
        "Ticket",
        foreign_keys="[Ticket.technician_id]",
        back_populates="technician",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} phone={self.phone} role={self.role}>"
