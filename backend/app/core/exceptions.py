from typing import Any, Dict, Optional
from fastapi import HTTPException, status


class DomainException(HTTPException):
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class AuthenticationError(DomainException):
    def __init__(self, detail: str = "Invalid authentication credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class PermissionDeniedError(DomainException):
    def __init__(self, detail: str = "You do not have permission to perform this action"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class ResourceNotFoundError(DomainException):
    def __init__(self, resource_name: str = "Resource", identifier: Any = ""):
        detail = f"{resource_name} {identifier} not found" if identifier else f"{resource_name} not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )


class ConflictError(DomainException):
    def __init__(self, detail: str = "Resource conflict occurred"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


class InvalidStateTransitionError(DomainException):
    def __init__(self, from_state: str, to_state: str, reason: str = ""):
        msg = f"Cannot transition from {from_state} to {to_state}"
        if reason:
            msg += f": {reason}"
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )
