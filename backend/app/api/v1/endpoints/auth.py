from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.models.auth import User
from app.schemas.auth import (
    LoginRequest,
    RefreshTokenRequest,
    TokenResponse,
    UserSummaryResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await AuthService.authenticate_user(db, payload.email, payload.password)
    if not user:
        raise AuthenticationError("Invalid email or password")
    return await AuthService.create_user_tokens(db, user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.rotate_refresh_token(db, payload.refresh_token)


@router.get("/me", response_model=UserSummaryResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    permissions = [p.code for p in current_user.role.permissions]
    return UserSummaryResponse(
        id=current_user.id,
        organization_id=current_user.organization_id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        role_code=current_user.role.code,
        department_id=current_user.department_id,
        phone=current_user.phone,
        is_active=current_user.is_active,
        permissions=permissions,
    )
