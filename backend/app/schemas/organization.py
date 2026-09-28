from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DepartmentCreateRequest(BaseModel):
    name: str
    code: str
    manager_id: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    code: str
    manager_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class LocationCreateRequest(BaseModel):
    name: str
    site_code: str
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    address: Optional[str] = None


class LocationResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    site_code: str
    building: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
