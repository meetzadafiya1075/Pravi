from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.dependencies import get_current_user, require_permission
from app.core.database import get_db
from app.core.exceptions import ConflictError, ResourceNotFoundError
from app.core.security import get_password_hash
from app.models.auth import Role, User
from app.schemas.auth import RoleResponse, UserCreateRequest, UserSummaryResponse

router = APIRouter(prefix="/users", tags=["Users & Roles"])


@router.get("", response_model=List[UserSummaryResponse])
async def list_users(
    department_id: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.organization_id == current_user.organization_id)
    )
    if department_id:
        stmt = stmt.where(User.department_id == department_id)

    res = await db.execute(stmt)
    users = res.scalars().all()

    return [
        UserSummaryResponse(
            id=u.id,
            organization_id=u.organization_id,
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            role_code=u.role.code,
            department_id=u.department_id,
            phone=u.phone,
            is_active=u.is_active,
            permissions=[p.code for p in u.role.permissions],
        )
        for u in users
    ]


@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Role)
        .options(selectinload(Role.permissions))
        .where(
            (Role.organization_id == current_user.organization_id)
            | (Role.is_system == True)
        )
    )
    res = await db.execute(stmt)
    roles = res.scalars().all()
    return roles


@router.post("", response_model=UserSummaryResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: UserCreateRequest,
    current_user: User = Depends(require_permission("user:manage")),
    db: AsyncSession = Depends(get_db),
):
    # Check email duplicate
    stmt = select(User).where(
        User.organization_id == current_user.organization_id,
        User.email == payload.email,
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise ConflictError(f"User with email '{payload.email}' already exists")

    # Fetch role
    role_stmt = select(Role).options(selectinload(Role.permissions)).where(Role.id == payload.role_id)
    role = (await db.execute(role_stmt)).scalar_one_or_none()
    if not role:
        raise ResourceNotFoundError("Role", payload.role_id)

    new_user = User(
        organization_id=current_user.organization_id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        first_name=payload.first_name,
        last_name=payload.last_name,
        role_id=role.id,
        department_id=payload.department_id,
        phone=payload.phone,
        is_active=True,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserSummaryResponse(
        id=new_user.id,
        organization_id=new_user.organization_id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        role_code=role.code,
        department_id=new_user.department_id,
        phone=new_user.phone,
        is_active=new_user.is_active,
        permissions=[p.code for p in role.permissions],
    )
