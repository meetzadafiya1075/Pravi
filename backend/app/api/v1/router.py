from fastapi import APIRouter

from app.api.v1.endpoints import (
    assets,
    audits,
    auth,
    dashboard,
    documents,
    operations,
    organizations,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(organizations.router)
api_router.include_router(assets.router)
api_router.include_router(operations.router)
api_router.include_router(audits.router)
api_router.include_router(documents.router)
api_router.include_router(dashboard.router)
