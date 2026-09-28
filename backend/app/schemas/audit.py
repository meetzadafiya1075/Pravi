from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AuditCreateRequest(BaseModel):
    title: str
    audit_code: str
    target_location_id: Optional[str] = None
    target_department_id: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    summary_notes: Optional[str] = None


class AuditScanRequest(BaseModel):
    asset_tag: str
    verification_status: str  # VERIFIED_OK, MISSING, DAMAGED, WRONG_LOCATION
    observed_location_id: Optional[str] = None
    remarks: Optional[str] = None


class AuditItemResponse(BaseModel):
    id: str
    audit_id: str
    asset_id: str
    scanned_by_user_id: Optional[str] = None
    scanned_at: Optional[datetime] = None
    verification_status: str
    observed_location_id: Optional[str] = None
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class AuditResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    audit_code: str
    target_location_id: Optional[str] = None
    target_department_id: Optional[str] = None
    status: str
    start_date: date
    end_date: Optional[date] = None
    lead_auditor_id: str
    summary_notes: Optional[str] = None
    created_at: datetime
    items: List[AuditItemResponse] = []

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: str
    organization_id: str
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
