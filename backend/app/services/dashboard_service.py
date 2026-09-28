from decimal import Decimal
from typing import Dict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.audit import Audit
from app.models.operations import MaintenanceTicket
from app.schemas.system import DashboardMetricsResponse


class DashboardService:
    @staticmethod
    async def get_metrics(db: AsyncSession, organization_id: str) -> DashboardMetricsResponse:
        # Total assets and valuation
        asset_stmt = (
            select(
                func.count(Asset.id).label("total_count"),
                func.coalesce(func.sum(Asset.current_book_value), Decimal("0.00")).label("total_valuation"),
            )
            .where(Asset.organization_id == organization_id, Asset.is_deleted == False)
        )
        asset_res = await db.execute(asset_stmt)
        total_assets, total_val = asset_res.one()

        # Status distribution
        status_stmt = (
            select(Asset.status, func.count(Asset.id))
            .where(Asset.organization_id == organization_id, Asset.is_deleted == False)
            .group_by(Asset.status)
        )
        status_res = await db.execute(status_stmt)
        status_dist: Dict[str, int] = {row[0]: row[1] for row in status_res.all()}

        # Open maintenance tickets
        ticket_stmt = (
            select(func.count(MaintenanceTicket.id))
            .where(
                MaintenanceTicket.organization_id == organization_id,
                MaintenanceTicket.status.in_(["OPEN", "IN_PROGRESS"]),
            )
        )
        open_tickets = (await db.execute(ticket_stmt)).scalar() or 0

        # Pending audits
        audit_stmt = (
            select(func.count(Audit.id))
            .where(
                Audit.organization_id == organization_id,
                Audit.status.in_(["PLANNED", "IN_PROGRESS"]),
            )
        )
        pending_audits = (await db.execute(audit_stmt)).scalar() or 0

        return DashboardMetricsResponse(
            total_assets=total_assets or 0,
            total_valuation=Decimal(str(total_val)),
            assets_in_use=status_dist.get("IN_USE", 0),
            assets_under_maintenance=status_dist.get("UNDER_MAINTENANCE", 0),
            assets_in_stock=status_dist.get("IN_STOCK", 0),
            pending_audits=pending_audits,
            open_tickets=open_tickets,
            status_distribution=status_dist,
            category_distribution={},
        )
