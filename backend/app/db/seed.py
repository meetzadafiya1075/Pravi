import asyncio
from datetime import date, datetime, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.asset import Asset, AssetCategory, AssetStatusHistory, Vendor
from app.models.auth import Organization, Permission, Role, RolePermission, User
from app.models.operations import AssetAssignment, MaintenanceTicket, Warranty
from app.models.organization import Department, Location

PERMISSIONS_DATA = [
    # Asset
    ("asset:create", "ASSET", "Create new assets in catalog"),
    ("asset:read", "ASSET", "View asset inventory details"),
    ("asset:update", "ASSET", "Update asset metadata and details"),
    ("asset:delete", "ASSET", "Remove or soft-delete asset"),
    ("asset:assign", "ASSET", "Assign asset custody or process returns"),
    ("asset:transfer_request", "ASSET", "Initiate inter-department asset transfer"),
    ("asset:transfer_approve", "ASSET", "Approve or reject departmental transfer"),
    ("asset:retire", "ASSET", "Decommission and retire asset"),
    ("asset:dispose", "ASSET", "Dispose and scrap retired asset"),
    # Maintenance
    ("maintenance:create", "MAINTENANCE", "Raise incident or preventative maintenance tickets"),
    ("maintenance:read", "MAINTENANCE", "View maintenance tickets and history"),
    ("maintenance:update", "MAINTENANCE", "Update tickets, log work hours, parts and costs"),
    # Audit
    ("audit:create", "AUDIT", "Create and initiate physical inventory audit campaigns"),
    ("audit:read", "AUDIT", "View audit campaigns and reports"),
    ("audit:scan_verify", "AUDIT", "Scan QR codes and verify physical assets"),
    ("audit:reconcile", "AUDIT", "Reconcile audit discrepancies and finalize reports"),
    # Administration
    ("user:manage", "ADMIN", "Manage organization users, departments, and roles"),
    ("report:view", "REPORT", "View financial and inventory analytics reports"),
    ("report:export", "REPORT", "Export reports and bulk data to CSV or Excel"),
]

ROLE_PERMISSIONS_MAPPING = {
    "SUPER_ADMIN": [p[0] for p in PERMISSIONS_DATA],
    "ASSET_MANAGER": [
        "asset:create", "asset:read", "asset:update", "asset:assign",
        "asset:transfer_request", "asset:transfer_approve", "asset:retire", "asset:dispose",
        "maintenance:create", "maintenance:read", "maintenance:update",
        "audit:create", "audit:read", "audit:scan_verify", "audit:reconcile",
        "user:manage", "report:view", "report:export",
    ],
    "DEPARTMENT_MANAGER": [
        "asset:read", "asset:transfer_request", "asset:transfer_approve",
        "maintenance:create", "maintenance:read", "report:view",
    ],
    "EMPLOYEE": [
        "asset:read", "maintenance:create", "maintenance:read",
    ],
    "AUDITOR": [
        "asset:read", "audit:read", "audit:scan_verify", "audit:reconcile",
        "report:view", "report:export",
    ],
    "TECHNICIAN": [
        "asset:read", "maintenance:create", "maintenance:read", "maintenance:update",
    ],
}


async def seed_database():
    print("[*] Starting database seeding...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # 1. Seed Permissions
        perm_map = {}
        for code, module, desc in PERMISSIONS_DATA:
            stmt = select(Permission).where(Permission.code == code)
            perm = (await db.execute(stmt)).scalar_one_or_none()
            if not perm:
                perm = Permission(code=code, module=module, description=desc)
                db.add(perm)
                await db.flush()
            perm_map[code] = perm

        # 2. Seed Default Organization
        org_stmt = select(Organization).where(Organization.slug == "acme-infra")
        org = (await db.execute(org_stmt)).scalar_one_or_none()
        if not org:
            org = Organization(
                name="Acme Global Infrastructure",
                slug="acme-infra",
                plan_type="ENTERPRISE",
            )
            db.add(org)
            await db.flush()

        # 3. Seed Roles
        role_map = {}
        for role_code, perm_codes in ROLE_PERMISSIONS_MAPPING.items():
            role_stmt = select(Role).where(
                Role.organization_id == org.id,
                Role.code == role_code,
            )
            role = (await db.execute(role_stmt)).scalar_one_or_none()
            if not role:
                role = Role(
                    organization_id=org.id,
                    name=role_code.replace("_", " ").title(),
                    code=role_code,
                    is_system=True,
                )
                db.add(role)
                await db.flush()

                # Add permissions
                for p_code in perm_codes:
                    if p_code in perm_map:
                        rp = RolePermission(role_id=role.id, permission_id=perm_map[p_code].id)
                        db.add(rp)
            role_map[role_code] = role

        # 4. Seed Departments
        dept_engineering = Department(organization_id=org.id, name="Engineering", code="ENG")
        dept_it_ops = Department(organization_id=org.id, name="IT Operations", code="OPS")
        dept_facilities = Department(organization_id=org.id, name="Facilities", code="FAC")
        for d in [dept_engineering, dept_it_ops, dept_facilities]:
            if not (await db.execute(select(Department).where(Department.organization_id == org.id, Department.code == d.code))).scalar_one_or_none():
                db.add(d)
        await db.flush()

        # 5. Seed Locations
        loc_dc = Location(organization_id=org.id, name="Primary Data Center", site_code="DC-01", building="Bldg A", room="Server Rm 101")
        loc_hq = Location(organization_id=org.id, name="Headquarters Office", site_code="HQ-01", building="Bldg B", floor="Floor 4")
        for l in [loc_dc, loc_hq]:
            if not (await db.execute(select(Location).where(Location.organization_id == org.id, Location.site_code == l.site_code))).scalar_one_or_none():
                db.add(l)
        await db.flush()

        # 6. Seed Categories
        cat_servers = AssetCategory(organization_id=org.id, name="Servers & Racks", code="SRV", default_useful_life_months=48)
        cat_laptops = AssetCategory(organization_id=org.id, name="Laptops & Workstations", code="LAP", default_useful_life_months=36)
        cat_network = AssetCategory(organization_id=org.id, name="Networking Hardware", code="NET", default_useful_life_months=60)
        for c in [cat_servers, cat_laptops, cat_network]:
            if not (await db.execute(select(AssetCategory).where(AssetCategory.organization_id == org.id, AssetCategory.code == c.code))).scalar_one_or_none():
                db.add(c)
        await db.flush()

        # 7. Seed Vendors
        vendor_dell = Vendor(organization_id=org.id, name="Dell Enterprise", contact_person="Sarah Connor", email="support@dell-enterprise.com")
        vendor_cisco = Vendor(organization_id=org.id, name="Cisco Systems", contact_person="John Matrix", email="cisco-rep@cisco.com")
        for v in [vendor_dell, vendor_cisco]:
            if not (await db.execute(select(Vendor).where(Vendor.organization_id == org.id, Vendor.name == v.name))).scalar_one_or_none():
                db.add(v)
        await db.flush()

        # 8. Seed Demo Users for All 6 Roles
        demo_users = [
            ("admin@platform.internal", "Super", "Admin", "SUPER_ADMIN", None),
            ("manager@acme.corp", "Marcus", "Vance", "ASSET_MANAGER", dept_it_ops.id),
            ("dept.head@acme.corp", "Elena", "Rostova", "DEPARTMENT_MANAGER", dept_engineering.id),
            ("john.dev@acme.corp", "John", "Developer", "EMPLOYEE", dept_engineering.id),
            ("auditor@compliance.org", "Rachel", "Green", "AUDITOR", None),
            ("tech@support.internal", "Toby", "Flenderson", "TECHNICIAN", dept_it_ops.id),
        ]

        user_objects = {}
        for email, fn, ln, r_code, d_id in demo_users:
            stmt = select(User).where(User.organization_id == org.id, User.email == email)
            existing_user = (await db.execute(stmt)).scalar_one_or_none()
            if not existing_user:
                new_u = User(
                    organization_id=org.id,
                    email=email,
                    hashed_password=get_password_hash("Password123!"),
                    first_name=fn,
                    last_name=ln,
                    role_id=role_map[r_code].id,
                    department_id=d_id,
                    is_active=True,
                )
                db.add(new_u)
                await db.flush()
                user_objects[r_code] = new_u
            else:
                user_objects[r_code] = existing_user

        # 9. Seed Demo Assets Across Varied Lifecycles
        demo_assets = [
            ("AST-00101", "Dell PowerEdge R750 Server", "SN-DELL-88219", cat_servers.id, "IN_USE", dept_it_ops.id, loc_dc.id, Decimal("8500.00")),
            ("AST-00102", "Apple MacBook Pro 16 M3 Max", "SN-APPL-99214", cat_laptops.id, "ASSIGNED", dept_engineering.id, loc_hq.id, Decimal("3499.00")),
            ("AST-00103", "Cisco Catalyst 9300 Switch", "SN-CSCO-11204", cat_network.id, "IN_STOCK", dept_it_ops.id, loc_dc.id, Decimal("4200.00")),
            ("AST-00104", "Dell Precision 5820 Tower", "SN-DELL-77312", cat_laptops.id, "UNDER_MAINTENANCE", dept_engineering.id, loc_hq.id, Decimal("2800.00")),
            ("AST-00105", "Lenovo ThinkPad P1 Gen 6", "SN-LNV-44109", cat_laptops.id, "IN_STOCK", dept_engineering.id, loc_hq.id, Decimal("2200.00")),
        ]

        for tag, name, sn, c_id, st, d_id, l_id, cost in demo_assets:
            ast_stmt = select(Asset).where(Asset.organization_id == org.id, Asset.asset_tag == tag)
            if not (await db.execute(ast_stmt)).scalar_one_or_none():
                ast = Asset(
                    organization_id=org.id,
                    asset_tag=tag,
                    name=name,
                    serial_number=sn,
                    category_id=c_id,
                    status=st,
                    department_id=d_id,
                    location_id=l_id,
                    purchase_date=date(2025, 1, 15),
                    purchase_cost=cost,
                    salvage_value=cost * Decimal("0.10"),
                    useful_life_months=36,
                    current_book_value=cost * Decimal("0.85"),
                    custom_attributes={"rack_unit": "U12", "ip_address": "10.0.1.50"} if "Server" in name else {},
                )
                db.add(ast)
                await db.flush()

                # If ASSIGNED, create active assignment for John Developer
                if st == "ASSIGNED":
                    assign = AssetAssignment(
                        organization_id=org.id,
                        asset_id=ast.id,
                        assigned_to_user_id=user_objects["EMPLOYEE"].id,
                        assigned_by_user_id=user_objects["ASSET_MANAGER"].id,
                        status="ACTIVE",
                        condition_on_assignment="Brand new sealed in box",
                    )
                    db.add(assign)

                # If UNDER_MAINTENANCE, create open ticket
                if st == "UNDER_MAINTENANCE":
                    ticket = MaintenanceTicket(
                        organization_id=org.id,
                        ticket_number=f"TICK-SEED-{ast.id[:4]}",
                        asset_id=ast.id,
                        requested_by_user_id=user_objects["EMPLOYEE"].id,
                        assigned_technician_id=user_objects["TECHNICIAN"].id,
                        priority="HIGH",
                        maintenance_type="CORRECTIVE",
                        issue_description="GPU fan emitting loud grinding noise and thermal throttling during CAD renders.",
                        status="OPEN",
                    )
                    db.add(ticket)

        await db.commit()
        print("[OK] Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
