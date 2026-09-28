from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
from pydantic import BaseModel


class PresignedUploadRequest(BaseModel):
    file_name: str
    file_size_bytes: int
    mime_type: str
    asset_id: Optional[str] = None
    maintenance_ticket_id: Optional[str] = None


class PresignedUploadResponse(BaseModel):
    upload_url: str
    s3_object_key: str
    expires_in_seconds: int = 900


class DocumentConfirmRequest(BaseModel):
    s3_object_key: str
    file_name: str
    file_size_bytes: int
    mime_type: str
    asset_id: Optional[str] = None
    maintenance_ticket_id: Optional[str] = None


class DocumentResponse(BaseModel):
    id: str
    organization_id: str
    asset_id: Optional[str] = None
    maintenance_ticket_id: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    s3_object_key: str
    download_url: Optional[str] = None
    uploaded_by_user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardMetricsResponse(BaseModel):
    total_assets: int
    total_valuation: Decimal
    assets_in_use: int
    assets_under_maintenance: int
    assets_in_stock: int
    pending_audits: int
    open_tickets: int
    status_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
