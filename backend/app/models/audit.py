from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import Date, DateTime, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, TimestampMixin
from app.models.base import UUIDPrimaryKeyMixin


class Audit(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "audits"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    audit_code: Mapped[str] = mapped_column(String(50), nullable=False)
    target_location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    target_department_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(50), default="PLANNED", nullable=False)  # PLANNED, IN_PROGRESS, RECONCILED, CLOSED
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lead_auditor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    summary_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("organization_id", "audit_code", name="uq_audit_org_code"),
    )

    # Relationships
    items: Mapped[List["AuditItem"]] = relationship("AuditItem", back_populates="audit", cascade="all, delete-orphan")


class AuditItem(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "audit_items"

    audit_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("audits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    scanned_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    scanned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)  # PENDING, VERIFIED_OK, MISSING, DAMAGED, WRONG_LOCATION
    observed_location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("audit_id", "asset_id", name="uq_audit_item_asset"),
    )

    # Relationships
    audit: Mapped["Audit"] = relationship("Audit", back_populates="items")


class AuditLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "audit_logs"

    organization_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    actor_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False)
    before_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    after_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_audit_logs_search", "organization_id", "entity_type", "entity_id", "timestamp"),
    )
