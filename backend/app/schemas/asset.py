from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CategoryCreateRequest(BaseModel):
    name: str
    code: str
    parent_id: Optional[str] = None
    depreciation_method: str = "STRAIGHT_LINE"
    default_useful_life_months: int = 36
    custom_field_schema: List[Dict[str, Any]] = []


class CategoryResponse(BaseModel):
    id: str
    organization_id: str
    parent_id: Optional[str] = None
    name: str
    code: str
    depreciation_method: str
    default_useful_life_months: int
    custom_field_schema: List[Dict[str, Any]] = []
    created_at: datetime

    class Config:
        from_attributes = True


class VendorCreateRequest(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class VendorResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssetCreateRequest(BaseModel):
    asset_tag: str
    name: str
    serial_number: str
    category_id: str
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Decimal = Decimal("0.00")
    salvage_value: Decimal = Decimal("0.00")
    useful_life_months: int = 36
    custom_attributes: Dict[str, Any] = {}


class AssetUpdateRequest(BaseModel):
    name: Optional[str] = None
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[Decimal] = None
    salvage_value: Optional[Decimal] = None
    useful_life_months: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = None
    version: int


class AssetTransitionRequest(BaseModel):
    to_status: str
    reason: Optional[str] = None
    extra_metadata: Dict[str, Any] = {}


class AssetStatusHistoryResponse(BaseModel):
    id: str
    from_status: str
    to_status: str
    actor_id: str
    reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssetResponse(BaseModel):
    id: str
    organization_id: str
    asset_tag: str
    name: str
    serial_number: str
    category_id: str
    status: str
    department_id: Optional[str] = None
    location_id: Optional[str] = None
    vendor_id: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Decimal
    salvage_value: Decimal
    useful_life_months: int
    current_book_value: Decimal
    qr_code_url: Optional[str] = None
    custom_attributes: Dict[str, Any] = {}
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
