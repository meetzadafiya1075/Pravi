import uuid
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@acme.corp", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["role_code"] == "ASSET_MANAGER"


@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@acme.corp", "password": "WrongPassword!"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    # 1. Login to get initial tokens
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@acme.corp", "password": "Password123!"},
    )
    refresh_token = login_res.json()["refresh_token"]

    # 2. Rotate token
    rotate_res = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert rotate_res.status_code == 200
    new_data = rotate_res.json()
    assert "access_token" in new_data
    assert "refresh_token" in new_data
    assert new_data["refresh_token"] != refresh_token


@pytest.mark.asyncio
async def test_rbac_asset_creation_forbidden_for_employee(client: AsyncClient):
    # Login as EMPLOYEE (who does not have asset:create)
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "john.dev@acme.corp", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    # Try creating asset
    create_res = await client.post(
        "/api/v1/assets",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "asset_tag": f"AST-UNAUTHORIZED-{uuid.uuid4().hex[:6]}",
            "name": "Secret Server",
            "serial_number": f"SN-{uuid.uuid4().hex[:6]}",
            "category_id": "dummy",
            "purchase_cost": 1000.0,
        },
    )
    assert create_res.status_code == 403


@pytest.mark.asyncio
async def test_asset_lifecycle_state_machine_validation(client: AsyncClient):
    # Login as ASSET_MANAGER
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "manager@acme.corp", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch categories
    cat_res = await client.get("/api/v1/assets/categories", headers=headers)
    assert cat_res.status_code == 200
    cat_id = cat_res.json()[0]["id"]

    unique_tag = f"AST-TEST-{uuid.uuid4().hex[:8]}"
    unique_sn = f"SN-TEST-{uuid.uuid4().hex[:8]}"

    # 1. Create an asset in PLANNED state
    create_res = await client.post(
        "/api/v1/assets",
        headers=headers,
        json={
            "asset_tag": unique_tag,
            "name": "Lifecycle Test Terminal",
            "serial_number": unique_sn,
            "category_id": cat_id,
            "purchase_cost": 2500.0,
            "salvage_value": 250.0,
            "useful_life_months": 36,
        },
    )
    assert create_res.status_code == 201
    asset_id = create_res.json()["id"]
    assert create_res.json()["status"] == "PLANNED"

    # 2. Try an ILLEGAL transition directly to IN_USE (should fail with 400 Bad Request)
    illegal_res = await client.post(
        f"/api/v1/assets/{asset_id}/transition",
        headers=headers,
        json={"to_status": "IN_USE", "reason": "Attempting illegal jump"},
    )
    assert illegal_res.status_code == 400

    # 3. Perform valid transition sequence: PLANNED -> ORDERED -> RECEIVED -> IN_STOCK
    r1 = await client.post(
        f"/api/v1/assets/{asset_id}/transition",
        headers=headers,
        json={"to_status": "ORDERED", "reason": "PO issued"},
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "ORDERED"

    r2 = await client.post(
        f"/api/v1/assets/{asset_id}/transition",
        headers=headers,
        json={"to_status": "RECEIVED", "reason": "Box delivered"},
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "RECEIVED"

    r3 = await client.post(
        f"/api/v1/assets/{asset_id}/transition",
        headers=headers,
        json={"to_status": "IN_STOCK", "reason": "Inspected and ready"},
    )
    assert r3.status_code == 200
    assert r3.json()["status"] == "IN_STOCK"
