from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import ConflictError, PermissionDeniedError, ResourceNotFoundError
from app.models.asset import Asset, AssetStatusHistory
from app.models.auth import User
from app.models.operations import (
    AssetTransfer,
    MaintenanceHistory,
    MaintenanceTicket,
    Warranty,
)
from app.schemas.operations import (
    MaintenanceCreateRequest,
    MaintenanceHistoryCreateRequest,
    MaintenanceHistoryResponse,
    MaintenanceResponse,
    MaintenanceUpdateRequest,
    TransferApproveRequest,
    TransferCreateRequest,
    TransferResponse,
    WarrantyCreateRequest,
    WarrantyResponse,
)
from app.services.audit_service import AuditService

router = APIRouter(prefix="/operations", tags=["Operations (Transfers, Maintenance, Warranties)"])


# Transfers
@router.get("/transfers", response_model=List[TransferResponse])
async def list_transfers(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AssetTransfer)
        .where(AssetTransfer.organization_id == current_user.organization_id)
        .order_by(AssetTransfer.initiated_at.desc())
    )
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/transfers", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    payload: TransferCreateRequest,
    current_user: User = Depends(require_permission("asset:transfer_request")),
    db: AsyncSession = Depends(get_db),
):
    # Verify asset
    asset_stmt = select(Asset).where(
        Asset.id == payload.asset_id,
        Asset.organization_id == current_user.organization_id,
    )
    asset = (await db.execute(asset_stmt)).scalar_one_or_none()
    if not asset:
        raise ResourceNotFoundError("Asset", payload.asset_id)

    if not asset.department_id:
        raise ConflictError("Asset has no assigned source department to transfer from.")

    transfer = AssetTransfer(
        organization_id=current_user.organization_id,
        asset_id=asset.id,
        source_department_id=asset.department_id,
        target_department_id=payload.target_department_id,
        source_location_id=asset.location_id,
        target_location_id=payload.target_location_id,
        initiated_by_user_id=current_user.id,
        status="PENDING",
        notes=payload.notes,
    )
    db.add(transfer)

    # Set asset status to TRANSFERRED
    prev_status = asset.status
    asset.status = "TRANSFERRED"
    asset.version += 1

    hist = AssetStatusHistory(
        organization_id=current_user.organization_id,
        asset_id=asset.id,
        from_status=prev_status,
        to_status="TRANSFERRED",
        actor_id=current_user.id,
        reason=f"Transfer initiated to dept {payload.target_department_id}",
    )
    db.add(hist)
    await db.commit()
    await db.refresh(transfer)
    return transfer


@router.post("/transfers/{id}/approve", response_model=TransferResponse)
async def approve_or_reject_transfer(
    id: str,
    payload: TransferApproveRequest,
    current_user: User = Depends(require_permission("asset:transfer_approve")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(AssetTransfer)
        .where(
            AssetTransfer.id == id,
            AssetTransfer.organization_id == current_user.organization_id,
        )
        .with_for_update()
    )
    transfer = (await db.execute(stmt)).scalar_one_or_none()
    if not transfer:
        raise ResourceNotFoundError("Transfer", id)

    if transfer.status != "PENDING":
        raise ConflictError(f"Transfer is already in '{transfer.status}' status.")

    asset_stmt = select(Asset).where(Asset.id == transfer.asset_id).with_for_update()
    asset = (await db.execute(asset_stmt)).scalar_one_or_none()

    if payload.status == "APPROVED":
        transfer.status = "COMPLETED"
        transfer.approved_by_user_id = current_user.id
        transfer.completed_at = datetime.now(timezone.utc)

        # Update asset department and location
        asset.department_id = transfer.target_department_id
        asset.location_id = transfer.target_location_id
        asset.status = "IN_STOCK"
        asset.version += 1

        hist = AssetStatusHistory(
            organization_id=current_user.organization_id,
            asset_id=asset.id,
            from_status="TRANSFERRED",
            to_status="IN_STOCK",
            actor_id=current_user.id,
            reason=f"Transfer completed to new department. {payload.notes or ''}".strip(),
        )
        db.add(hist)
    else:
        transfer.status = "REJECTED"
        transfer.approved_by_user_id = current_user.id
        transfer.completed_at = datetime.now(timezone.utc)
        asset.status = "IN_STOCK"
        asset.version += 1

    await db.commit()
    await db.refresh(transfer)
    return transfer


# Maintenance Tickets
@router.get("/maintenance", response_model=List[MaintenanceResponse])
async def list_maintenance_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(require_permission("maintenance:read")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(MaintenanceTicket)
        .options(selectinload(MaintenanceTicket.history_logs))
        .where(MaintenanceTicket.organization_id == current_user.organization_id)
    )
    if status_filter:
        stmt = stmt.where(MaintenanceTicket.status == status_filter.upper())
    stmt = stmt.order_by(MaintenanceTicket.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/maintenance", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_ticket(
    payload: MaintenanceCreateRequest,
    current_user: User = Depends(require_permission("maintenance:create")),
    db: AsyncSession = Depends(get_db),
):
    asset_stmt = select(Asset).where(
        Asset.id == payload.asset_id,
        Asset.organization_id == current_user.organization_id,
    ).with_for_update()
    asset = (await db.execute(asset_stmt)).scalar_one_or_none()
    if not asset:
        raise ResourceNotFoundError("Asset", payload.asset_id)

    ticket_number = f"TICK-{int(datetime.now().timestamp())}"
    ticket = MaintenanceTicket(
        organization_id=current_user.organization_id,
        ticket_number=ticket_number,
        asset_id=asset.id,
        requested_by_user_id=current_user.id,
        assigned_technician_id=payload.assigned_technician_id,
        priority=payload.priority.upper(),
        maintenance_type=payload.maintenance_type.upper(),
        issue_description=payload.issue_description,
        status="OPEN",
    )
    db.add(ticket)

    # Transition asset to UNDER_MAINTENANCE
    prev_status = asset.status
    asset.status = "UNDER_MAINTENANCE"
    asset.version += 1

    hist = AssetStatusHistory(
        organization_id=current_user.organization_id,
        asset_id=asset.id,
        from_status=prev_status,
        to_status="UNDER_MAINTENANCE",
        actor_id=current_user.id,
        reason=f"Maintenance ticket {ticket_number} created",
    )
    db.add(hist)
    await db.commit()

    # Re-fetch ticket with history
    refetched = await db.execute(
        select(MaintenanceTicket)
        .options(selectinload(MaintenanceTicket.history_logs))
        .where(MaintenanceTicket.id == ticket.id)
    )
    return refetched.scalar_one()


@router.patch("/maintenance/{id}", response_model=MaintenanceResponse)
async def update_maintenance_ticket(
    id: str,
    payload: MaintenanceUpdateRequest,
    current_user: User = Depends(require_permission("maintenance:update")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(MaintenanceTicket)
        .options(selectinload(MaintenanceTicket.history_logs))
        .where(
            MaintenanceTicket.id == id,
            MaintenanceTicket.organization_id == current_user.organization_id,
        )
        .with_for_update()
    )
    ticket = (await db.execute(stmt)).scalar_one_or_none()
    if not ticket:
        raise ResourceNotFoundError("MaintenanceTicket", id)

    if payload.assigned_technician_id is not None:
        ticket.assigned_technician_id = payload.assigned_technician_id
    if payload.priority:
        ticket.priority = payload.priority.upper()
    if payload.resolution_notes is not None:
        ticket.resolution_notes = payload.resolution_notes
    if payload.total_cost is not None:
        ticket.total_cost = payload.total_cost
    if payload.downtime_hours is not None:
        ticket.downtime_hours = payload.downtime_hours

    if payload.status:
        new_status = payload.status.upper()
        ticket.status = new_status
        if new_status in ["RESOLVED", "CLOSED"]:
            ticket.resolved_at = datetime.now(timezone.utc)
            # Return asset to IN_STOCK
            asset_stmt = select(Asset).where(Asset.id == ticket.asset_id).with_for_update()
            asset = (await db.execute(asset_stmt)).scalar_one_or_none()
            if asset and asset.status == "UNDER_MAINTENANCE":
                asset.status = "IN_STOCK"
                asset.version += 1
                hist = AssetStatusHistory(
                    organization_id=current_user.organization_id,
                    asset_id=asset.id,
                    from_status="UNDER_MAINTENANCE",
                    to_status="IN_STOCK",
                    actor_id=current_user.id,
                    reason=f"Maintenance ticket {ticket.ticket_number} resolved",
                )
                db.add(hist)

    await db.commit()
    await db.refresh(ticket)
    return ticket


# Warranties
@router.get("/warranties", response_model=List[WarrantyResponse])
async def list_warranties(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Warranty).where(Warranty.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/warranties", response_model=WarrantyResponse, status_code=status.HTTP_201_CREATED)
async def create_warranty(
    payload: WarrantyCreateRequest,
    current_user: User = Depends(require_permission("asset:create")),
    db: AsyncSession = Depends(get_db),
):
    warranty = Warranty(
        organization_id=current_user.organization_id,
        asset_id=payload.asset_id,
        vendor_id=payload.vendor_id,
        contract_number=payload.contract_number,
        coverage_details=payload.coverage_details,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(warranty)
    await db.commit()
    await db.refresh(warranty)
    return warranty
