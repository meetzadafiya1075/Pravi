from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin
from app.models.base import UUIDPrimaryKeyMixin


class AssetAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "asset_assignments"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_to_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    assigned_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    assigned_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    return_due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    returned_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)  # ACTIVE, RETURNED, OVERDUE
    condition_on_assignment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    condition_on_return: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    acceptance_signature_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("idx_assign_asset_status", "asset_id", "status"),
        Index("idx_assign_user_status", "assigned_to_user_id", "status"),
    )


class AssetTransfer(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "asset_transfers"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_department_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("departments.id"),
        nullable=False,
    )
    target_department_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("departments.id"),
        nullable=False,
    )
    source_location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id"),
        nullable=True,
    )
    target_location_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("locations.id"),
        nullable=False,
    )
    initiated_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    approved_by_user_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED, COMPLETED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    initiated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_transfers_org_status", "organization_id", "status"),
    )


class MaintenanceTicket(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "maintenance_tickets"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ticket_number: Mapped[str] = mapped_column(String(50), nullable=False)
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    requested_by_user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    assigned_technician_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    priority: Mapped[str] = mapped_column(String(30), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    maintenance_type: Mapped[str] = mapped_column(String(50), default="CORRECTIVE", nullable=False)  # PREVENTATIVE, CORRECTIVE, CALIBRATION
    issue_description: Mapped[str] = mapped_column(Text, nullable=False)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="OPEN", nullable=False, index=True)  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    total_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    downtime_hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0.0"), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    history_logs: Mapped[List["MaintenanceHistory"]] = relationship("MaintenanceHistory", back_populates="ticket", cascade="all, delete-orphan")


class MaintenanceHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "maintenance_history"

    ticket_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("maintenance_tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    logged_by_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    action_taken: Mapped[str] = mapped_column(Text, nullable=False)
    parts_replaced: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    ticket: Mapped["MaintenanceTicket"] = relationship("MaintenanceTicket", back_populates="history_logs")


class Warranty(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "warranties"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vendor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("vendors.id"),
        nullable=False,
    )
    contract_number: Mapped[str] = mapped_column(String(100), nullable=False)
    coverage_details: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    alert_sent_30d: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    alert_sent_7d: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
