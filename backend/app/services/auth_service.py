import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.security import (
    create_access_token,
    generate_refresh_token_pair,
    hash_refresh_token,
    verify_password,
)
from app.models.auth import RefreshToken, Role, User
from app.schemas.auth import TokenResponse, UserSummaryResponse


class AuthService:
    @staticmethod
    async def authenticate_user(
        db: AsyncSession, email: str, password: str
    ) -> Optional[User]:
        stmt = (
            select(User)
            .options(selectinload(User.role).selectinload(Role.permissions))
            .where(User.email == email, User.is_active == True)
        )
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def create_user_tokens(
        db: AsyncSession, user: User
    ) -> TokenResponse:
        access_token = create_access_token(
            subject=user.id,
            organization_id=user.organization_id,
            role_code=user.role.code,
        )

        raw_refresh, token_hash = generate_refresh_token_pair()
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            family_id=str(uuid.uuid4()),
            is_revoked=False,
            expires_at=expires_at,
        )
        db.add(refresh_record)
        await db.commit()

        permissions = [p.code for p in user.role.permissions]
        user_summary = UserSummaryResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role_code=user.role.code,
            department_id=user.department_id,
            phone=user.phone,
            is_active=user.is_active,
            permissions=permissions,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            user=user_summary,
        )

    @staticmethod
    async def rotate_refresh_token(
        db: AsyncSession, raw_refresh_token: str
    ) -> TokenResponse:
        token_hash = hash_refresh_token(raw_refresh_token)
        stmt = (
            select(RefreshToken)
            .options(
                selectinload(RefreshToken.user)
                .selectinload(User.role)
                .selectinload(Role.permissions)
            )
            .where(RefreshToken.token_hash == token_hash)
        )
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if not record:
            raise AuthenticationError("Invalid refresh token")

        # If token was already revoked, someone is reusing it - revoke whole family (replay attack defense)
        if record.is_revoked:
            revoke_stmt = (
                select(RefreshToken)
                .where(RefreshToken.family_id == record.family_id)
            )
            family_res = await db.execute(revoke_stmt)
            for item in family_res.scalars():
                item.is_revoked = True
            await db.commit()
            raise AuthenticationError("Compromised session detected. Please log in again.")

        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            record.is_revoked = True
            await db.commit()
            raise AuthenticationError("Refresh token has expired")

        # Revoke the used token
        record.is_revoked = True

        # Generate new pair in the same family
        new_raw, new_hash = generate_refresh_token_pair()
        new_expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        new_record = RefreshToken(
            user_id=record.user_id,
            token_hash=new_hash,
            family_id=record.family_id,
            is_revoked=False,
            expires_at=new_expires_at,
        )
        db.add(new_record)
        await db.commit()

        user = record.user
        access_token = create_access_token(
            subject=user.id,
            organization_id=user.organization_id,
            role_code=user.role.code,
        )

        permissions = [p.code for p in user.role.permissions]
        user_summary = UserSummaryResponse(
            id=user.id,
            organization_id=user.organization_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role_code=user.role.code,
            department_id=user.department_id,
            phone=user.phone,
            is_active=user.is_active,
            permissions=permissions,
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=new_raw,
            token_type="bearer",
            user=user_summary,
        )
