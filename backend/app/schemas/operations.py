from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel


class AssetAssignRequest(BaseModel):
    assigned_to_user_id: str
    return_due_date: Optional[datetime] = None
    condition_on_assignment: Optional[str] = None
    notes: Optional[str] = None


class AssetReturnRequest(BaseModel):
    condition_on_return: Optional[str] = None
    notes: Optional[str] = None


class AssignmentResponse(BaseModel):
    id: str
    organization_id: str
    asset_id: str
    assigned_to_user_id: str
    assigned_by_user_id: str
    assigned_date: datetime
    return_due_date: Optional[datetime] = None
    returned_date: Optional[datetime] = None
    status: str
    condition_on_assignment: Optional[str] = None
    condition_on_return: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransferCreateRequest(BaseModel):
    asset_id: str
    target_department_id: str
    target_location_id: str
    notes: Optional[str] = None


class TransferApproveRequest(BaseModel):
    status: str  # APPROVED, REJECTED
    notes: Optional[str] = None


class TransferResponse(BaseModel):
    id: str
    organization_id: str
    asset_id: str
    source_department_id: str
    target_department_id: str
    source_location_id: Optional[str] = None
    target_location_id: str
    initiated_by_user_id: str
    approved_by_user_id: Optional[str] = None
    status: str
    notes: Optional[str] = None
    initiated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MaintenanceHistoryCreateRequest(BaseModel):
    action_taken: str
    parts_replaced: Optional[str] = None
    cost: Decimal = Decimal("0.00")


class MaintenanceHistoryResponse(BaseModel):
    id: str
    ticket_id: str
    logged_by_id: str
    action_taken: str
    parts_replaced: Optional[str] = None
    cost: Decimal
    logged_at: datetime

    class Config:
        from_attributes = True


class MaintenanceCreateRequest(BaseModel):
    asset_id: str
    priority: str = "MEDIUM"
    maintenance_type: str = "CORRECTIVE"
    issue_description: str
    assigned_technician_id: Optional[str] = None


class MaintenanceUpdateRequest(BaseModel):
    assigned_technician_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    resolution_notes: Optional[str] = None
    total_cost: Optional[Decimal] = None
    downtime_hours: Optional[Decimal] = None


class MaintenanceResponse(BaseModel):
    id: str
    organization_id: str
    ticket_number: str
    asset_id: str
    requested_by_user_id: str
    assigned_technician_id: Optional[str] = None
    priority: str
    maintenance_type: str
    issue_description: str
    resolution_notes: Optional[str] = None
    status: str
    total_cost: Decimal
    downtime_hours: Decimal
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    history_logs: List[MaintenanceHistoryResponse] = []

    class Config:
        from_attributes = True


class WarrantyCreateRequest(BaseModel):
    asset_id: str
    vendor_id: str
    contract_number: str
    coverage_details: str
    start_date: date
    end_date: date


class WarrantyResponse(BaseModel):
    id: str
    organization_id: str
    asset_id: str
    vendor_id: str
    contract_number: str
    coverage_details: str
    start_date: date
    end_date: date
    created_at: datetime

    class Config:
        from_attributes = True
