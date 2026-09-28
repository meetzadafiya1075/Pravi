from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.core.exceptions import DomainException
from app.models.auth import User
from app.models.system import Document
from app.schemas.system import (
    DocumentConfirmRequest,
    DocumentResponse,
    PresignedUploadRequest,
    PresignedUploadResponse,
)
from app.services.storage_service import StorageService

router = APIRouter(prefix="/documents", tags=["Documents & Storage"])

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB


@router.post("/presign-upload", response_model=PresignedUploadResponse)
async def request_presigned_upload(
    payload: PresignedUploadRequest,
    current_user: User = Depends(get_current_user),
):
    if payload.mime_type not in ALLOWED_MIME_TYPES:
        raise DomainException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{payload.mime_type}' is not allowed. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    if payload.file_size_bytes > MAX_FILE_SIZE_BYTES:
        raise DomainException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowable limit of 15 MB.",
        )

    url, s3_key = StorageService.generate_presigned_upload(
        organization_id=current_user.organization_id,
        filename=payload.file_name,
        mime_type=payload.mime_type,
    )

    return PresignedUploadResponse(upload_url=url, s3_object_key=s3_key)


@router.post("/confirm", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def confirm_document_upload(
    payload: DocumentConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = Document(
        organization_id=current_user.organization_id,
        asset_id=payload.asset_id,
        maintenance_ticket_id=payload.maintenance_ticket_id,
        file_name=payload.file_name,
        file_size_bytes=payload.file_size_bytes,
        mime_type=payload.mime_type,
        s3_object_key=payload.s3_object_key,
        uploaded_by_user_id=current_user.id,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    download_url = StorageService.generate_presigned_download(doc.s3_object_key)
    return DocumentResponse(
        id=doc.id,
        organization_id=doc.organization_id,
        asset_id=doc.asset_id,
        maintenance_ticket_id=doc.maintenance_ticket_id,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        s3_object_key=doc.s3_object_key,
        download_url=download_url,
        uploaded_by_user_id=doc.uploaded_by_user_id,
        created_at=doc.created_at,
    )


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    asset_id: Optional[str] = Query(None),
    ticket_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Document).where(Document.organization_id == current_user.organization_id)
    if asset_id:
        stmt = stmt.where(Document.asset_id == asset_id)
    if ticket_id:
        stmt = stmt.where(Document.maintenance_ticket_id == ticket_id)

    res = await db.execute(stmt)
    docs = res.scalars().all()

    return [
        DocumentResponse(
            id=d.id,
            organization_id=d.organization_id,
            asset_id=d.asset_id,
            maintenance_ticket_id=d.maintenance_ticket_id,
            file_name=d.file_name,
            file_size_bytes=d.file_size_bytes,
            mime_type=d.mime_type,
            s3_object_key=d.s3_object_key,
            download_url=StorageService.generate_presigned_download(d.s3_object_key),
            uploaded_by_user_id=d.uploaded_by_user_id,
            created_at=d.created_at,
        )
        for d in docs
    ]
