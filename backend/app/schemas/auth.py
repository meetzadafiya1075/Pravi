from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserSummaryResponse"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class PermissionResponse(BaseModel):
    id: str
    code: str
    module: str
    description: str

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    is_system: bool = False
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class UserSummaryResponse(BaseModel):
    id: str
    organization_id: str
    email: str
    first_name: str
    last_name: str
    role_code: str
    department_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    permissions: List[str] = []

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    role_id: str
    department_id: Optional[str] = None
    phone: Optional[str] = None


class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_id: Optional[str] = None
    department_id: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


TokenResponse.model_rebuild()
