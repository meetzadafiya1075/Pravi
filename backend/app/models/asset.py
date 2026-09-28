from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base, TimestampMixin
from app.models.base import UUIDPrimaryKeyMixin


class AssetCategory(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "asset_categories"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("asset_categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    depreciation_method: Mapped[str] = mapped_column(String(50), default="STRAIGHT_LINE", nullable=False)
    default_useful_life_months: Mapped[int] = mapped_column(Integer, default=36, nullable=False)
    custom_field_schema: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_category_org_code"),
    )

    # Relationships
    children: Mapped[List["AssetCategory"]] = relationship("AssetCategory", backref="parent", remote_side="AssetCategory.id")
    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="category")


class Vendor(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "vendors"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_vendor_org_name"),
    )

    # Relationships
    assets: Mapped[List["Asset"]] = relationship("Asset", back_populates="vendor")


class Asset(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "assets"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    asset_tag: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("asset_categories.id"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(50), default="PLANNED", nullable=False, index=True)
    department_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    location_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    vendor_id: Mapped[Optional[str]] = mapped_column(
        String(36),
        ForeignKey("vendors.id", ondelete="SET NULL"),
        nullable=True,
    )
    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purchase_cost: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    salvage_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    useful_life_months: Mapped[int] = mapped_column(Integer, default=36, nullable=False)
    current_book_value: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)
    qr_code_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    custom_attributes: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("organization_id", "asset_tag", name="uq_asset_org_tag"),
        Index("idx_assets_org_status", "organization_id", "status"),
        Index("idx_assets_serial", "organization_id", "serial_number"),
    )

    # Relationships
    category: Mapped["AssetCategory"] = relationship("AssetCategory", back_populates="assets")
    vendor: Mapped[Optional["Vendor"]] = relationship("Vendor", back_populates="assets")
    status_history: Mapped[List["AssetStatusHistory"]] = relationship("AssetStatusHistory", back_populates="asset", cascade="all, delete-orphan")


class AssetStatusHistory(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "asset_status_history"

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    asset_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("assets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[str] = mapped_column(String(50), nullable=False)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        nullable=False,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_metadata: Mapped[dict] = mapped_column("metadata", JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_status_hist_asset", "asset_id", "created_at"),
    )

    # Relationships
    asset: Mapped["Asset"] = relationship("Asset", back_populates="status_history")
