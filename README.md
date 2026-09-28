# AssetFlow Enterprise: Infrastructure Asset Lifecycle Management Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg?logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_ACID-336791.svg?logo=postgresql)](https://www.postgresql.org)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, cloud-native **Infrastructure Asset Lifecycle Management (ALM) Platform** designed for ISO 55000 compliance. Manages physical and digital hardware assets across 12 deterministic lifecycle states—from planning, procurement, barcode tagging, and employee custody to inter-departmental transfers, preventative maintenance, physical inventory audits with mobile camera QR scanning, and final decommissioning/disposal.

---

## 🚀 Live Deployments

| Component | Target Platform | Live URL / Swagger Docs |
|---|---|---|
| **Frontend Web App** | **Vercel** | `https://asset-platform.vercel.app` (or local `http://localhost:3000`) |
| **Backend REST API** | **Render** | `https://asset-api.onrender.com` (or local `http://localhost:8000`) |
| **API Interactive Docs** | **Render Swagger** | `https://asset-api.onrender.com/docs` |
| **Health Check API** | **Render** | `https://asset-api.onrender.com/api/v1/health` |

---

## 🔑 Pre-Seeded Evaluator & Demo Accounts

The database comes pre-seeded with test accounts across all **6 RBAC roles**. Every role has pre-loaded context and permissions:

| Persona / Role | Email Address | Password | Scoped Permissions & Purpose |
|---|---|---|---|
| **ASSET_MANAGER** | `manager@acme.corp` | `Password123!` | Full procurement, asset registration, write-offs, approvals, and audits. |
| **EMPLOYEE** | `john.dev@acme.corp` | `Password123!` | View assigned equipment, accept custody, and raise break-fix tickets. |
| **TECHNICIAN** | `tech@support.internal` | `Password123!` | Diagnostic work orders, itemized parts, labor costs, and repair certifications. |
| **AUDITOR** | `auditor@compliance.org` | `Password123!` | Physical floor audits, continuous QR barcode camera verification. |
| **DEPARTMENT_MANAGER**| `dept.head@acme.corp` | `Password123!` | Approves equipment transfers and departmental equipment requests. |
| **SUPER_ADMIN** | `admin@platform.internal` | `Password123!` | Global organization settings, role definitions, and system-wide audit logs. |

> **Pro Tip**: The login screen (`/login`) includes **1-Click Evaluator Buttons** for instant authentication without typing.

---

## 🏛️ System Architecture

```
+--------------------------------------------------------------------------------------------------------+
|                                              CLIENT TIER                                               |
|      Desktop / Tablet Browser (Managers, Admins)         Mobile Device Camera (Auditors, Staff)        |
+--------------------------------------------------------------------------------------------------------+
                                                    │
                                                    │ HTTPS (Port 443)
                                                    ▼
+--------------------------------------------------------------------------------------------------------+
|                                        FRONTEND HOSTING: VERCEL                                        |
|   Next.js 14 (App Router)                                                                              |
|   ├── Responsive Dark-Mode Design System & Glassmorphic Dashboard                                      |
|   ├── Client Camera QR/Barcode Viewfinder Scanner (html5-qrcode)                                       |
|   ├── Axios API Client with Auto-Bearer Injection & 401 Refresh Token Rotation                         |
|   └── Role-Based Component Guard (useAuth Hook)                                                        |
+--------------------------------------------------------------------------------------------------------+
                                                    │
                                                    │ Cross-Origin REST API calls with
                                                    │ Authorization: Bearer <JWT>
                                                    ▼
+--------------------------------------------------------------------------------------------------------+
|                                        BACKEND HOSTING: RENDER                                         |
|   FastAPI Application (ASGI Web Service)                                                               |
|   ├── CORS Middleware (Configured for Vercel preview & production origins)                            |
|   ├── Multi-Tenant Dependency Guards (get_current_user, require_permission)                            |
|   ├── Service Layer (AssetLifecycleService with SELECT FOR UPDATE row-level locking)                   |
|   ├── Repository Layer (SQLAlchemy 2.0 Async ORM with automatic tenant filtering)                     |
|   └── S3 Storage Utility (Generates Presigned PUT/GET URLs for direct object uploads)                  |
+--------------------------------------------------------------------------------------------------------+
         │                                │                                           │
         │ Connection Pool                │ Enqueue Tasks                             │ Direct Presigned S3
         ▼                                ▼                                           ▼
+--------------------+        +-----------------------+                    +--------------------+
|  POSTGRESQL 16     |        |      REDIS CACHE      |                    |   OBJECT STORAGE   |
|  (Managed Render)  |        |    (Render Managed)   |                    | (Cloudflare R2/S3) |
|                    |        |                       |                    |                    |
| - ACID Data Storage|        | - Token Revocation    |                    | - Invoices & PDFs  |
| - Row-Level Lock   |        | - ARQ Task Queue      |                    | - Condition Photos |
| - 24 Entity Tables |        | - Sliding Rate Limits |                    | - Exported Reports |
+--------------------+        +-----------------------+                    +--------------------+
                                          ▲                                           ▲
                                          │ Consumes Async Tasks                      │ Direct Upload
                                          ▼                                           │
                              +-----------------------+                               │
                              |   RENDER BACKGROUND   |───────────────────────────────┘
                              |        WORKER         |
                              | (Python ARQ Worker)   |
                              | - Warranty Alerts     |
                              | - Email Dispatch      |
                              +-----------------------+
```

---

## 🔄 12-State Asset Lifecycle State Machine

```
   [ PLANNED ]
        │ (asset:create / PO issued)
        ▼
   [ ORDERED ]
        │ (asset:receive / Warehouse delivery)
        ▼
   [ RECEIVED ]
        │ (asset:inspect / Tagging & Inspection passed)
        ▼
┌──> [ IN_STOCK ] <───────────────────────────┐
│         │                                    │
│         │ (asset:assign / Assigned to staff) │
│         ▼                                    │
│   [ ASSIGNED ]                               │ (asset:return /
│         │                                    │  Maintenance completed)
│         │ (asset:accept / Confirmed custody) │
│         ▼                                    │
│     [ IN_USE ] ──────────────────────────────┤
│      │      │                                │
│      │      └─ (asset:maintenance_start)     │
│      │                   │                   │
│      │                   ▼                   │
│      │        [ UNDER_MAINTENANCE ] ─────────┘
│      │
│      │ (asset:transfer_request)
│      ▼
│ [ TRANSFERRED ] ──> (Dual-manager signoff -> Returns to IN_STOCK / IN_USE)
│
│ (asset:retire / Declared end-of-life)
▼
[ RETIRED ]
│
│ (asset:dispose / Sold, Scrapped, or Destroyed)
▼
[ DISPOSED ] (Terminal Immutable State)
```

---

## 🗄️ Relational Database Schema (24 Tables)

1. `organizations` (Multi-tenant root boundary)
2. `users` (Argon2/bcrypt hashed credentials, org scoping)
3. `roles` (System & tenant custom roles)
4. `permissions` (Atomic granular permission strings)
5. `role_permissions` (M:N role to permission mapping)
6. `refresh_tokens` (Hashed refresh token family rotation)
7. `departments` (Hierarchical department tree & managers)
8. `locations` (Sites, buildings, floors, and rooms)
9. `asset_categories` (Hierarchical categories & JSON schemas)
10. `vendors` (Suppliers, SLA terms, contact directories)
11. `assets` (Core register, serial numbers, optimistic lock `version`, book value)
12. `asset_status_history` (Append-only state machine transition audit trail)
13. `asset_assignments` (Active custody tracking, handoff conditions)
14. `asset_transfers` (Dual-manager departmental transfer requests)
15. `maintenance_tickets` (Corrective and preventative work orders)
16. `maintenance_history` (Itemized labor hours, parts replaced, and costs)
17. `warranties` (Contract dates, coverage terms, automated 30d/7d alert flags)
18. `documents` (S3 object keys, MIME types, file sizes)
19. `audits` (Physical inventory campaigns across locations)
20. `audit_items` (Checklist verification items per audit)
21. `notifications` (In-app alerts and delivery statuses)
22. `audit_logs` (Tamper-evident system-wide security audit trail)
23. `import_jobs` (Asynchronous bulk CSV import tracking)
24. `export_jobs` (Asynchronous report generation tracking)

---

## 💻 Local Quickstart

### 1. Prerequisites
* Python 3.11+
* Node.js 18+ & npm
* Docker Desktop (optional for local PostgreSQL/Redis/MinIO)

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate   # On Windows
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run database migrations and seed demo data
python -m app.db.seed

# Start development API server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Web application will be live at `http://localhost:3000`.

### 4. Running Automated Tests
```bash
cd backend
pytest -v
```
Runs 100% of integration, RBAC, health check, and lifecycle state transition tests.

---

## 🔒 Security Architecture

* **Decoupled Cross-Domain Authentication**: Uses short-lived (15-min) JWT Access Tokens via `Authorization: Bearer` headers paired with a rotated high-entropy database-backed Refresh Token (7 days) with replay attack detection. Eliminates cross-site cookie blocking between `*.vercel.app` and `*.onrender.com`.
* **Zero Ephemeral Disk Dependence**: File uploads use direct client-to-storage **Presigned S3 URLs**, bypassing Render's ephemeral container filesystem and RAM limits.
* **Concurrency Locking**: Pessimistic row locking (`SELECT ... FOR UPDATE`) prevents simultaneous assignment or transfer race conditions.
* **Defense-in-Depth Authorization**: FastAPI dependency injection verifies both permission codes (`require_permission`) and tenancy (`organization_id`).

---

## 📝 Submission Deliverables
* **Architecture Diagram**: See Section 4 above & system blueprint.
* **ZIP Archive**: Complete project source tree with all frontend and backend modules.
* **Screen Recording**: Demonstrating end-to-end asset lifecycle (Creation -> QR generation -> Custody assignment -> Incident maintenance -> Technician sign-off -> Departmental transfer -> Floor audit scan -> Retirement).
