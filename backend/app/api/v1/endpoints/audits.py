from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.models.asset import Asset
from app.models.audit import Audit, AuditItem, AuditLog
from app.models.auth import User
from app.schemas.audit import (
    AuditCreateRequest,
    AuditItemResponse,
    AuditLogResponse,
    AuditResponse,
    AuditScanRequest,
)

router = APIRouter(prefix="/audits", tags=["Audits & Compliance"])


@router.get("", response_model=List[AuditResponse])
async def list_audits(
    current_user: User = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Audit)
        .options(selectinload(Audit.items))
        .where(Audit.organization_id == current_user.organization_id)
        .order_by(Audit.created_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("", response_model=AuditResponse, status_code=status.HTTP_201_CREATED)
async def create_audit(
    payload: AuditCreateRequest,
    current_user: User = Depends(require_permission("audit:create")),
    db: AsyncSession = Depends(get_db),
):
    audit = Audit(
        organization_id=current_user.organization_id,
        title=payload.title,
        audit_code=payload.audit_code,
        target_location_id=payload.target_location_id,
        target_department_id=payload.target_department_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        lead_auditor_id=current_user.id,
        summary_notes=payload.summary_notes,
        status="IN_PROGRESS",
    )
    db.add(audit)
    await db.flush()

    # Pre-populate audit checklist with matching assets in target location/department
    asset_query = select(Asset).where(
        Asset.organization_id == current_user.organization_id,
        Asset.is_deleted == False,
    )
    if payload.target_location_id:
        asset_query = asset_query.where(Asset.location_id == payload.target_location_id)
    if payload.target_department_id:
        asset_query = asset_query.where(Asset.department_id == payload.target_department_id)

    matching_assets = (await db.execute(asset_query)).scalars().all()
    for a in matching_assets:
        item = AuditItem(
            audit_id=audit.id,
            asset_id=a.id,
            verification_status="PENDING",
        )
        db.add(item)

    await db.commit()

    refetched = await db.execute(
        select(Audit).options(selectinload(Audit.items)).where(Audit.id == audit.id)
    )
    return refetched.scalar_one()


@router.post("/{id}/scan", response_model=AuditItemResponse)
async def scan_asset_audit(
    id: str,
    payload: AuditScanRequest,
    current_user: User = Depends(require_permission("audit:scan_verify")),
    db: AsyncSession = Depends(get_db),
):
    # Find asset by tag
    asset_stmt = select(Asset).where(
        Asset.organization_id == current_user.organization_id,
        Asset.asset_tag == payload.asset_tag,
    )
    asset = (await db.execute(asset_stmt)).scalar_one_or_none()
    if not asset:
        raise ResourceNotFoundError("Asset with tag", payload.asset_tag)

    # Find audit item or create one
    item_stmt = select(AuditItem).where(
        AuditItem.audit_id == id,
        AuditItem.asset_id == asset.id,
    )
    item = (await db.execute(item_stmt)).scalar_one_or_none()
    if not item:
        item = AuditItem(
            audit_id=id,
            asset_id=asset.id,
        )
        db.add(item)

    item.verification_status = payload.verification_status.upper()
    item.scanned_by_user_id = current_user.id
    item.scanned_at = datetime.now(timezone.utc)
    item.observed_location_id = payload.observed_location_id
    item.remarks = payload.remarks

    await db.commit()
    await db.refresh(item)
    return item


@router.get("/logs", response_model=List[AuditLogResponse])
async def list_audit_logs(
    limit: int = Query(50, le=100),
    current_user: User = Depends(require_permission("audit:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AuditLog)
        .where(AuditLog.organization_id == current_user.organization_id)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()
