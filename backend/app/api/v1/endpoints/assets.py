from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models.asset import Asset, AssetCategory, AssetStatusHistory, Vendor
from app.models.auth import User
from app.schemas.asset import (
    AssetCreateRequest,
    AssetResponse,
    AssetStatusHistoryResponse,
    AssetTransitionRequest,
    AssetUpdateRequest,
    CategoryCreateRequest,
    CategoryResponse,
    VendorCreateRequest,
    VendorResponse,
)
from app.schemas.operations import (
    AssetAssignRequest,
    AssetReturnRequest,
    AssignmentResponse,
)
from app.services.asset_lifecycle_service import AssetLifecycleService
from app.services.qr_service import QrService

router = APIRouter(prefix="/assets", tags=["Asset Inventory & Lifecycle"])


# Categories
@router.get("/categories", response_model=List[CategoryResponse])
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AssetCategory).where(AssetCategory.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreateRequest,
    current_user: User = Depends(require_permission("asset:create")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AssetCategory).where(
        AssetCategory.organization_id == current_user.organization_id,
        AssetCategory.code == payload.code,
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise ConflictError(f"Category code '{payload.code}' already exists")

    cat = AssetCategory(
        organization_id=current_user.organization_id,
        name=payload.name,
        code=payload.code,
        parent_id=payload.parent_id,
        depreciation_method=payload.depreciation_method,
        default_useful_life_months=payload.default_useful_life_months,
        custom_field_schema=payload.custom_field_schema,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


# Vendors
@router.get("/vendors", response_model=List[VendorResponse])
async def list_vendors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Vendor).where(Vendor.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    payload: VendorCreateRequest,
    current_user: User = Depends(require_permission("asset:create")),
    db: AsyncSession = Depends(get_db),
):
    vendor = Vendor(
        organization_id=current_user.organization_id,
        name=payload.name,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        address=payload.address,
    )
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


# Assets List & Create
@router.get("", response_model=List[AssetResponse])
async def list_assets(
    status_filter: Optional[str] = Query(None, alias="status"),
    category_id: Optional[str] = Query(None),
    department_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("asset:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Asset).where(
        Asset.organization_id == current_user.organization_id,
        Asset.is_deleted == False,
    )

    # Department manager scoping
    if current_user.role.code == "DEPARTMENT_MANAGER" and current_user.department_id:
        stmt = stmt.where(Asset.department_id == current_user.department_id)
    elif department_id:
        stmt = stmt.where(Asset.department_id == department_id)

    if status_filter:
        stmt = stmt.where(Asset.status == status_filter.upper())
    if category_id:
        stmt = stmt.where(Asset.category_id == category_id)
    if q:
        search = f"%{q}%"
        stmt = stmt.where(
            (Asset.name.ilike(search))
            | (Asset.asset_tag.ilike(search))
            | (Asset.serial_number.ilike(search))
        )

    stmt = stmt.order_by(Asset.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    payload: AssetCreateRequest,
    current_user: User = Depends(require_permission("asset:create")),
    db: AsyncSession = Depends(get_db),
):
    # Check tag uniqueness
    stmt = select(Asset).where(
        Asset.organization_id == current_user.organization_id,
        Asset.asset_tag == payload.asset_tag,
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise ConflictError(f"Asset tag '{payload.asset_tag}' already exists")

    # Initial book value equals purchase cost
    book_value = payload.purchase_cost

    asset = Asset(
        organization_id=current_user.organization_id,
        asset_tag=payload.asset_tag,
        name=payload.name,
        serial_number=payload.serial_number,
        category_id=payload.category_id,
        status="PLANNED",
        department_id=payload.department_id,
        location_id=payload.location_id,
        vendor_id=payload.vendor_id,
        purchase_date=payload.purchase_date,
        purchase_cost=payload.purchase_cost,
        salvage_value=payload.salvage_value,
        useful_life_months=payload.useful_life_months,
        current_book_value=book_value,
        custom_attributes=payload.custom_attributes,
        version=1,
    )
    db.add(asset)
    await db.flush()

    # Record initial status history
    hist = AssetStatusHistory(
        organization_id=current_user.organization_id,
        asset_id=asset.id,
        from_status="NONE",
        to_status="PLANNED",
        actor_id=current_user.id,
        reason="Asset created in registry",
    )
    db.add(hist)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.get("/{id}", response_model=AssetResponse)
async def get_asset(
    id: str,
    current_user: User = Depends(require_permission("asset:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Asset).where(
        Asset.id == id,
        Asset.organization_id == current_user.organization_id,
        Asset.is_deleted == False,
    )
    asset = (await db.execute(stmt)).scalar_one_or_none()
    if not asset:
        raise ResourceNotFoundError("Asset", id)
    return asset


@router.get("/{id}/qr")
async def get_asset_qr(
    id: str,
    current_user: User = Depends(require_permission("asset:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Asset).where(
        Asset.id == id,
        Asset.organization_id == current_user.organization_id,
    )
    asset = (await db.execute(stmt)).scalar_one_or_none()
    if not asset:
        raise ResourceNotFoundError("Asset", id)

    qr_base64 = QrService.generate_asset_qr_base64(asset.id, asset.asset_tag)
    return {"asset_id": asset.id, "asset_tag": asset.asset_tag, "qr_data_url": qr_base64}


@router.get("/{id}/history", response_model=List[AssetStatusHistoryResponse])
async def get_asset_history(
    id: str,
    current_user: User = Depends(require_permission("asset:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AssetStatusHistory)
        .where(
            AssetStatusHistory.asset_id == id,
            AssetStatusHistory.organization_id == current_user.organization_id,
        )
        .order_by(AssetStatusHistory.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/{id}/transition", response_model=AssetResponse)
async def transition_asset(
    id: str,
    payload: AssetTransitionRequest,
    current_user: User = Depends(require_permission("asset:update")),
    db: AsyncSession = Depends(get_db),
):
    return await AssetLifecycleService.transition_asset(
        db=db,
        asset_id=id,
        to_status=payload.to_status,
        actor=current_user,
        reason=payload.reason,
        extra_metadata=payload.extra_metadata,
    )


@router.post("/{id}/assign", response_model=AssignmentResponse)
async def assign_asset(
    id: str,
    payload: AssetAssignRequest,
    current_user: User = Depends(require_permission("asset:assign")),
    db: AsyncSession = Depends(get_db),
):
    return await AssetLifecycleService.assign_asset(
        db=db,
        asset_id=id,
        assigned_to_user_id=payload.assigned_to_user_id,
        assigned_by=current_user,
        return_due_date=payload.return_due_date,
        condition_on_assignment=payload.condition_on_assignment,
        notes=payload.notes,
    )


@router.post("/{id}/return", response_model=AssignmentResponse)
async def return_asset(
    id: str,
    payload: AssetReturnRequest,
    current_user: User = Depends(require_permission("asset:assign")),
    db: AsyncSession = Depends(get_db),
):
    return await AssetLifecycleService.return_asset(
        db=db,
        asset_id=id,
        actor=current_user,
        condition_on_return=payload.condition_on_return,
        notes=payload.notes,
    )
