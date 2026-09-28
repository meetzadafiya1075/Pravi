import uuid
from typing import Tuple
import boto3
from botocore.client import Config

from app.core.config import settings


class StorageService:
    @staticmethod
    def get_s3_client():
        if not settings.S3_ACCESS_KEY_ID or not settings.S3_SECRET_ACCESS_KEY:
            return None

        kwargs = {
            "service_name": "s3",
            "aws_access_key_id": settings.S3_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.S3_SECRET_ACCESS_KEY,
            "config": Config(signature_version="s3v4"),
        }
        if settings.S3_ENDPOINT_URL:
            kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        if settings.S3_REGION:
            kwargs["region_name"] = settings.S3_REGION

        return boto3.client(**kwargs)

    @classmethod
    def generate_presigned_upload(
        cls,
        organization_id: str,
        filename: str,
        mime_type: str,
        expires_in: int = 900,
    ) -> Tuple[str, str]:
        unique_key = f"tenants/{organization_id}/documents/{uuid.uuid4()}-{filename}"
        s3 = cls.get_s3_client()

        if s3:
            try:
                url = s3.generate_presigned_url(
                    ClientMethod="put_object",
                    Params={
                        "Bucket": settings.S3_BUCKET_NAME,
                        "Key": unique_key,
                        "ContentType": mime_type,
                    },
                    ExpiresIn=expires_in,
                )
                return url, unique_key
            except Exception:
                pass

        # Fallback local simulated presigned URL
        return f"/api/v1/documents/mock-upload/{unique_key}", unique_key

    @classmethod
    def generate_presigned_download(
        cls,
        s3_key: str,
        expires_in: int = 900,
    ) -> str:
        s3 = cls.get_s3_client()
        if s3:
            try:
                return s3.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={
                        "Bucket": settings.S3_BUCKET_NAME,
                        "Key": s3_key,
                    },
                    ExpiresIn=expires_in,
                )
            except Exception:
                pass
        return f"/api/v1/documents/mock-download/{s3_key}"
