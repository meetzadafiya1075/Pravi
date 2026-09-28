from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    DomainException,
    InvalidStateTransitionError,
    ResourceNotFoundError,
)
from app.models.asset import Asset, AssetStatusHistory
from app.models.auth import User
from app.models.operations import AssetAssignment
from app.services.audit_service import AuditService

VALID_TRANSITIONS: Dict[str, List[str]] = {
    "PLANNED": ["ORDERED"],
    "ORDERED": ["RECEIVED"],
    "RECEIVED": ["IN_STOCK"],
    "IN_STOCK": ["ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"],
    "ASSIGNED": ["IN_USE", "IN_STOCK"],
    "IN_USE": ["IN_STOCK", "UNDER_MAINTENANCE", "TRANSFERRED", "RETIRED"],
    "UNDER_MAINTENANCE": ["IN_STOCK", "IN_USE", "RETIRED"],
    "TRANSFERRED": ["IN_USE", "IN_STOCK"],
    "RETIRED": ["DISPOSED"],
    "DISPOSED": [],  # Terminal state
}


class AssetLifecycleService:
    @staticmethod
    async def transition_asset(
        db: AsyncSession,
        asset_id: str,
        to_status: str,
        actor: User,
        reason: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Asset:
        to_status = to_status.upper()

        # Query asset within actor's organization
        stmt = (
            select(Asset)
            .where(Asset.id == asset_id, Asset.organization_id == actor.organization_id)
            .with_for_update()
        )
        result = await db.execute(stmt)
        asset = result.scalar_one_or_none()

        if not asset:
            raise ResourceNotFoundError("Asset", asset_id)

        from_status = asset.status
        allowed_targets = VALID_TRANSITIONS.get(from_status, [])

        if to_status not in allowed_targets:
            raise InvalidStateTransitionError(
                from_state=from_status,
                to_state=to_status,
                reason=f"Valid next states from {from_status} are: {', '.join(allowed_targets) if allowed_targets else 'None (Terminal)'}",
            )

        # Record state change in asset_status_history
        history_entry = AssetStatusHistory(
            organization_id=actor.organization_id,
            asset_id=asset.id,
            from_status=from_status,
            to_status=to_status,
            actor_id=actor.id,
            reason=reason,
            extra_metadata=extra_metadata or {},
        )
        db.add(history_entry)

        # Mutate asset
        before_state = {"status": from_status, "version": asset.version}
        asset.status = to_status
        asset.version += 1
        after_state = {"status": to_status, "version": asset.version}

        # Audit log
        await AuditService.log_action(
            db=db,
            organization_id=actor.organization_id,
            actor_id=actor.id,
            action=f"ASSET_TRANSITION_{from_status}_TO_{to_status}",
            entity_type="Asset",
            entity_id=asset.id,
            before_state=before_state,
            after_state=after_state,
        )

        await db.commit()
        await db.refresh(asset)
        return asset

    @staticmethod
    async def assign_asset(
        db: AsyncSession,
        asset_id: str,
        assigned_to_user_id: str,
        assigned_by: User,
        return_due_date: Optional[datetime] = None,
        condition_on_assignment: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> AssetAssignment:
        # 1. Lock asset row
        stmt = (
            select(Asset)
            .where(Asset.id == asset_id, Asset.organization_id == assigned_by.organization_id)
            .with_for_update()
        )
        res = await db.execute(stmt)
        asset = res.scalar_one_or_none()
        if not asset:
            raise ResourceNotFoundError("Asset", asset_id)

        if asset.status != "IN_STOCK":
            raise ConflictError(
                f"Asset cannot be assigned because its current status is '{asset.status}'. It must be 'IN_STOCK'."
            )

        # 2. Check no active assignment exists
        active_stmt = (
            select(AssetAssignment)
            .where(
                AssetAssignment.asset_id == asset_id,
                AssetAssignment.status == "ACTIVE",
            )
        )
        active_res = await db.execute(active_stmt)
        if active_res.scalar_one_or_none():
            raise ConflictError("Asset already has an active assignment.")

        # 3. Create assignment record
        assignment = AssetAssignment(
            organization_id=assigned_by.organization_id,
            asset_id=asset.id,
            assigned_to_user_id=assigned_to_user_id,
            assigned_by_user_id=assigned_by.id,
            return_due_date=return_due_date,
            condition_on_assignment=condition_on_assignment,
            status="ACTIVE",
        )
        db.add(assignment)

        # 4. Update asset status to ASSIGNED
        asset.status = "ASSIGNED"
        asset.version += 1

        # 5. Add status history
        history = AssetStatusHistory(
            organization_id=assigned_by.organization_id,
            asset_id=asset.id,
            from_status="IN_STOCK",
            to_status="ASSIGNED",
            actor_id=assigned_by.id,
            reason=f"Assigned to user {assigned_to_user_id}. {notes or ''}".strip(),
        )
        db.add(history)

        await AuditService.log_action(
            db=db,
            organization_id=assigned_by.organization_id,
            actor_id=assigned_by.id,
            action="ASSET_ASSIGNED",
            entity_type="Asset",
            entity_id=asset.id,
            after_state={"assigned_to": assigned_to_user_id},
        )

        await db.commit()
        await db.refresh(assignment)
        return assignment

    @staticmethod
    async def return_asset(
        db: AsyncSession,
        asset_id: str,
        actor: User,
        condition_on_return: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> AssetAssignment:
        # Lock asset
        stmt = (
            select(Asset)
            .where(Asset.id == asset_id, Asset.organization_id == actor.organization_id)
            .with_for_update()
        )
        res = await db.execute(stmt)
        asset = res.scalar_one_or_none()
        if not asset:
            raise ResourceNotFoundError("Asset", asset_id)

        # Find active assignment
        assign_stmt = (
            select(AssetAssignment)
            .where(
                AssetAssignment.asset_id == asset_id,
                AssetAssignment.status == "ACTIVE",
            )
            .with_for_update()
        )
        assign_res = await db.execute(assign_stmt)
        assignment = assign_res.scalar_one_or_none()
        if not assignment:
            raise ResourceNotFoundError("Active assignment for asset", asset_id)

        # Complete assignment
        assignment.status = "RETURNED"
        assignment.returned_date = datetime.now(timezone.utc)
        assignment.condition_on_return = condition_on_return

        # Return asset to IN_STOCK
        prev_status = asset.status
        asset.status = "IN_STOCK"
        asset.version += 1

        history = AssetStatusHistory(
            organization_id=actor.organization_id,
            asset_id=asset.id,
            from_status=prev_status,
            to_status="IN_STOCK",
            actor_id=actor.id,
            reason=f"Returned by employee. {notes or ''}".strip(),
        )
        db.add(history)

        await AuditService.log_action(
            db=db,
            organization_id=actor.organization_id,
            actor_id=actor.id,
            action="ASSET_RETURNED",
            entity_type="Asset",
            entity_id=asset.id,
            after_state={"status": "IN_STOCK"},
        )

        await db.commit()
        await db.refresh(assignment)
        return assignment
