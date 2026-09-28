from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_access_token
from app.models.auth import Role, User

security = HTTPBearer(auto_error=False)


async def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not auth or not auth.credentials:
        raise AuthenticationError("Authorization header is missing")

    token = auth.credentials
    payload = decode_access_token(token)
    if not payload:
        raise AuthenticationError("Invalid or expired access token")

    user_id = payload.get("sub")
    org_id = payload.get("org_id")
    if not user_id or not org_id:
        raise AuthenticationError("Token payload is malformed")

    # Fetch user along with role and permissions
    stmt = (
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.id == user_id, User.organization_id == org_id, User.is_active == True)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User not found or account is deactivated")

    return user


def require_permission(permission_code: str) -> Callable:
    async def permission_dependency(
        current_user: User = Depends(get_current_user),
    ) -> User:
        # SUPER_ADMIN bypasses granular checks
        if current_user.role.code == "SUPER_ADMIN":
            return current_user

        user_permissions = {p.code for p in current_user.role.permissions}
        if permission_code not in user_permissions:
            raise PermissionDeniedError(
                f"Missing required permission: '{permission_code}'"
            )
        return current_user

    return permission_dependency
