import uuid
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String


def generate_uuid() -> str:
    return str(uuid.uuid4())


class UUIDPrimaryKeyMixin:
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=generate_uuid,
        nullable=False,
    )
