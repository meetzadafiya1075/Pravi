from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import ConflictError
from app.models.auth import User
from app.models.organization import Department, Location
from app.schemas.organization import (
    DepartmentCreateRequest,
    DepartmentResponse,
    LocationCreateRequest,
    LocationResponse,
)

router = APIRouter(prefix="/organizations", tags=["Organization Structure"])


@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Department).where(Department.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/departments", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    payload: DepartmentCreateRequest,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Department).where(
        Department.organization_id == current_user.organization_id,
        Department.code == payload.code,
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise ConflictError(f"Department code '{payload.code}' already exists")

    dept = Department(
        organization_id=current_user.organization_id,
        name=payload.name,
        code=payload.code,
        manager_id=payload.manager_id,
    )
    db.add(dept)
    await db.commit()
    await db.refresh(dept)
    return dept


@router.get("/locations", response_model=List[LocationResponse])
async def list_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Location).where(Location.organization_id == current_user.organization_id)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.post("/locations", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    payload: LocationCreateRequest,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Location).where(
        Location.organization_id == current_user.organization_id,
        Location.site_code == payload.site_code,
    )
    if (await db.execute(stmt)).scalar_one_or_none():
        raise ConflictError(f"Location site code '{payload.site_code}' already exists")

    loc = Location(
        organization_id=current_user.organization_id,
        name=payload.name,
        site_code=payload.site_code,
        building=payload.building,
        floor=payload.floor,
        room=payload.room,
        address=payload.address,
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc
