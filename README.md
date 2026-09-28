# Government Infrastructure Asset Lifecycle Management Platform (MERN)

[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-22.x_LTS-339933.svg?logo=node.js)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000.svg?logo=express)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_/_7.0-47A248.svg?logo=mongodb)](https://www.mongodb.com/atlas)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render)](https://render.com)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary)](https://cloudinary.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, cloud-native **Government Infrastructure Asset Lifecycle Management (ALM) Platform** built strictly on the **MERN (MongoDB, Express.js, React.js, Node.js)** technology stack. Engineered for State Governments, Municipal Corporations, Public Works Departments (PWD), Urban Development Authorities, Water Supply Boards, and Public Infrastructure Undertakings.

The platform provides a single centralized digital source of truth to manage public capital assets across their complete 30-to-50-year lifecycle—from planning, schemes, budgeting, procurement, and construction to commissioning, GIS mapping, field inspections, maintenance work orders, inter-district transfers, public grievance resolution, statutory auditing, and condemnation/disposal.

> **Disclaimer**: All government entities, departments, projects, tenders, contractors, and officer personnel references in the demonstration data are realistic but completely fictional for hackathon evaluation and technical benchmarking purposes.

---

## 🏛️ Government Use Cases & Infrastructure Scope

The system realistically models, classifies, and tracks physical public infrastructure across major categories:

* **Transportation & Highways**: Overbridges, flyovers, arterial ring roads, expressways, bus terminals, road signage, and traffic signal junctions.
* **Civil Buildings & Public Institutions**: Government hospitals, trauma & critical care centers, municipal primary schools, central secretariats, and community halls.
* **Water & Sewage Infrastructure**: Automated 50–120 MLD potable water treatment plants (WTP), SCADA pumping stations, elevated storage reservoirs, and stormwater drainage lines.
* **Electrical & Public Power**: High-mast solar LED street lighting grids, distribution transformers, substations, and standby power generators.
* **Smart City IT & Surveillance**: Traffic monitoring CCTV networks, fiber-optic sensor grids, automated weather sensors, and command-and-control operations hubs.

---

## ⚙️ Non-Negotiable MERN Architecture

```
USERS / CITIZENS / GOVERNMENT OFFICERS
                  │
                  ▼
       ┌─────────────────────┐
       │   VERCEL DEPLOYMENT │
       │      (React.js)     │
       └──────────┬──────────┘
                  │ HTTPS (REST API / JWT)
                  ▼
       ┌─────────────────────┐
       │   RENDER DEPLOYMENT │
       │  (Node.js + Express)│
       └──────────┬──────────┘
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
┌──────────────┐     ┌──────────────┐
│MongoDB Atlas │     │  Cloudinary  │
│  (Database)  │     │(Object Store)│
└──────────────┘     └──────────────┘
```

* **Frontend (React.js)**: Client-side SPA built with React 18, Next.js client pages, Axios API client with automatic token rotation, Lucide icon design system, and HTML5 QR scanner.
* **Backend (Node.js + Express.js)**: High-throughput REST API with Express 4, JWT access + refresh token rotation, RBAC permission middleware, rate-limiting, and Helmet security headers.
* **Database (MongoDB Atlas / Mongoose)**: Indexed collections with geospatial coordinates, lifecycle state history, and real-time aggregation pipelines for government KPIs.
* **File Storage (Cloudinary)**: Persistent external object storage for engineering drawings, tender documents, inspection photos, and completion certificates.

---

## 🚀 Live Deployments & URLs

| Component | Target Platform | Live URL / Swagger Docs |
|---|---|---|
| **Frontend Web App** | **Vercel** | `https://pravi-frontend-three.vercel.app` (or local `http://localhost:3000`) |
| **Backend REST API** | **Render** | `https://pravi-backend-szu0.onrender.com` (or local `http://localhost:8000`) |
| **Health Check API** | **Render** | `https://pravi-backend-szu0.onrender.com/health` (or local `http://localhost:8000/health`) |
| **Database** | **MongoDB Atlas** | Managed MongoDB Atlas 7.0 Cluster |

---

## 🔑 Pre-Seeded Evaluator & Demo Accounts

The database comes pre-seeded with test accounts across all **Government RBAC roles**. Every role has pre-loaded jurisdiction, scoped access, and permissions:

| Persona / Government Role | Email Address | Password | Scoped Jurisdiction & Purpose |
|---|---|---|---|
| **SUPER_ADMIN** | `admin@gov.internal` | `Password123!` | Apex State Infrastructure Authority administrator; state-wide analytics & global controls. |
| **DEPARTMENT_ADMIN** | `pwd.director@gov.internal` | `Password123!` | Public Works Department (PWD) Chief Engineer; capital schemes, tenders & lifecycle signoffs. |
| **DISTRICT_OFFICER** | `district.officer@gov.internal` | `Password123!` | District Officer (Ahmedabad / Surat / Rajkot); zonal oversight & inter-district transfers. |
| **ASSET_MANAGER** | `asset.manager@gov.internal` | `Password123!` | Central asset registry administrator; commissioning, custodian assignments, and transfers. |
| **INSPECTOR** | `inspector.patel@gov.internal` | `Password123!` | Infrastructure Field Inspector; non-destructive audits & physical condition grading. |
| **MAINTENANCE_OFFICER**| `maintenance.eng@gov.internal` | `Password123!` | Public Works Engineer; corrective work orders, contractor supervision & repair certification. |
| **CONTRACTOR** | `contractor.rep@lt-infra.internal` | `Password123!` | EPC Contractor (L&T Infrastructure); assigned schemes, milestones & work logs. |
| **AUDITOR** | `auditor.vigilance@gov.internal` | `Password123!` | State Vigilance & Statutory Auditor; asset reconciliation & immutable audit trail. |

> **Pro Tip**: The official sign-in screen (`/login`) includes **1-Click Quick Login Buttons** for instant evaluation without typing credentials!

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Module & Permission Code | Description | SUPER_ADMIN | DEPT_ADMIN | DISTRICT_OFFICER | ASSET_MGR | INSPECTOR | MAINT_OFFICER | CONTRACTOR | AUDITOR |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `asset:read` | View registry & GIS coords | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `asset:create` | Register new capital asset | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asset:update` | Update metadata & lifecycle | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asset:assign` | Assign custodian officer | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asset:transfer_request` | Initiate inter-dept transfer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asset:transfer_approve` | Approve jurisdictional transfer | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `asset:retire` / `dispose` | Decommission / salvage asset | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `maintenance:read` | View work orders & contractor logs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `maintenance:create` | Raise repair ticket or complaint | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `maintenance:update` | Dispatch contractor & log parts | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| `audit:read` | View statutory physical campaigns | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `audit:scan_verify` | Conduct QR physical scan check | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `audit:reconcile` | Certify audit discrepancies | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `user:manage` | Manage officers & roles | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `report:view` | View analytics & summaries | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `report:export` | Export CSV Asset Register & Logs | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 🏛️ Configurable Administrative Hierarchy

The system models multi-tiered jurisdictional governance:

$$\text{State Infrastructure Authority} \longrightarrow \text{Department} \longrightarrow \text{Division} \longrightarrow \text{District} \longrightarrow \text{Zone} \longrightarrow \text{Ward} \longrightarrow \text{Facility / Site} \longrightarrow \text{Asset}$$

* **Departments**: Public Works Department (PWD), Urban Development & Municipal Works (UDD), Water Resources & Sewerage Board (WTR), Health & Family Welfare (HLT), School Education (EDU), Energy & Public Lighting Authority (ENG).
* **Districts**: Ahmedabad, Surat, Vadodara, Rajkot, Gandhinagar.
* **Zones & Wards**: West Zone Ward 12, South Zone Ward 18, Central Zone Ward 1, East Zone Ward 7, North Zone Ward 5.

---

## 🔄 Government Infrastructure Asset Lifecycle

$$\text{PROPOSED} \longrightarrow \text{PROJECT\_APPROVED} \longrightarrow \text{PROCUREMENT} \longrightarrow \text{UNDER\_CONSTRUCTION} \longrightarrow \text{COMMISSIONED}$$
$$\downarrow$$
$$\text{DISPOSED} \longleftarrow \text{DECOMMISSIONED} \longleftarrow \text{RENOVATION} \longleftarrow \text{UNDER\_MAINTENANCE} \longleftarrow \text{OPERATIONAL}$$

Every state transition enforces:
1. Role authorization verification.
2. Immutable logging in `AssetStatusHistory`.
3. Event persistence in the `AuditLog` collection.
4. Auto-synchronization of asset condition and operational status.

---

## 📋 Complete REST API Architecture

### Authentication
* `POST /api/v1/auth/login` - Authenticate officer credentials & issue JWT token pair
* `POST /api/v1/auth/refresh` - Rotate refresh token & issue new access token
* `GET /api/v1/auth/me` - Fetch authenticated officer profile, jurisdiction, and permissions

### Dashboard & Analytics
* `GET /api/v1/dashboard/metrics` - Real-time MongoDB-aggregated KPIs (total assets, valuation, condition breakdown, district allocation, active projects, inspections due)

### Asset Registry & GIS
* `GET /api/v1/assets` - Filtered asset search by department, district, status, condition, criticality, search query
* `POST /api/v1/assets` - Register new infrastructure asset (generates QR code and initial history)
* `GET /api/v1/assets/:id` - Fetch asset details
* `GET /api/v1/assets/:id/qr` - Return high-resolution QR code data URL
* `GET /api/v1/assets/:id/history` - Return chronological lifecycle audit history
* `POST /api/v1/assets/:id/transition` - Execute government lifecycle state transition
* `POST /api/v1/assets/:id/assign` - Assign custodian officer
* `POST /api/v1/assets/:id/return` - Return from officer custody
* `GET /api/v1/assets/categories` - List asset categories
* `POST /api/v1/assets/categories` - Create asset category
* `GET /api/v1/assets/vendors` - List contractors and suppliers
* `POST /api/v1/assets/vendors` - Create contractor profile

### Capital Projects & Schemes
* `GET /api/v1/projects` - List infrastructure projects filtered by department/status
* `POST /api/v1/projects` - Create capital project with scheme, budget, and contractor
* `GET /api/v1/projects/:id` - Fetch single project details

### Field Inspections
* `GET /api/v1/inspections` - List field structural inspections
* `POST /api/v1/inspections` - Record physical inspection (automatically updates asset condition)
* `GET /api/v1/inspections/asset/:asset_id` - List inspection history for asset

### Maintenance & Work Orders
* `GET /api/v1/operations/maintenance` - List maintenance work orders
* `POST /api/v1/operations/maintenance` - Create corrective/preventative maintenance order
* `PATCH /api/v1/operations/maintenance/:id` - Update status, resolution, downtime, and contractor expenses
* `POST /api/v1/operations/maintenance/:id/history` - Append maintenance action log

### Inter-District Transfers
* `GET /api/v1/operations/transfers` - List jurisdictional transfers
* `POST /api/v1/operations/transfers` - Initiate transfer to new department/location
* `POST /api/v1/operations/transfers/:id/approve` - Approve or reject transfer

### Public Grievances / Issue Reporting
* `GET /api/v1/complaints` - List citizen and officer reported issues
* `POST /api/v1/complaints` - Log new infrastructure complaint (e.g., street light failure, pothole)
* `PATCH /api/v1/complaints/:id` - Update grievance status, assign officer, or dispatch maintenance

### Statutory Physical Audits
* `GET /api/v1/audits` - List physical audit campaigns
* `POST /api/v1/audits` - Create audit campaign & pre-populate assets
* `POST /api/v1/audits/:id/scan` - Record barcode/QR physical verification scan
* `GET /api/v1/audits/logs` - Query tamper-evident audit trail

### Reporting & Streaming Exports
* `GET /api/v1/reports/export/assets` - Stream full State Asset Register as CSV
* `GET /api/v1/reports/export/audits` - Stream immutable audit logs as CSV

### Document Storage (Cloudinary)
* `POST /api/v1/documents/presign-upload` - Generate Cloudinary upload signature
* `POST /api/v1/documents/confirm` - Store file metadata in MongoDB
* `GET /api/v1/documents` - List attached documents for asset or ticket

---

## 🛠️ Local Development & Setup

### Prerequisites
* **Node.js**: v20+ or v22 LTS
* **MongoDB**: Local MongoDB Server (v7.0) or MongoDB Atlas cluster URI

### 1. Clone & Configure Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI:
# MONGODB_URI=mongodb://127.0.0.1:27017/gov_infra
```

### 2. Seed Government Demo Data
```bash
npm run seed
```

### 3. Run Backend Server
```bash
npm start
# Server listens on http://localhost:8000
# Health check: http://localhost:8000/health
```

### 4. Run Automated Regression Test Suite
```bash
node test_regression.js
# Runs 28 automated integration tests across all endpoints
```

### 5. Launch Frontend
```bash
cd ../frontend
npm install
npm run dev
# Frontend web application opens at http://localhost:3000
```

---

## 🚢 Production Deployment Guide

### Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the service:
   * **Runtime**: `Node`
   * **Build Command**: `cd backend && npm install && npm run seed`
   * **Start Command**: `cd backend && npm start`
   * **Health Check Path**: `/health`
4. Set Environment Variables:
   * `NODE_ENV`: `production`
   * `PORT`: `10000`
   * `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/gov_infra?retryWrites=true&w=majority`
   * `JWT_SECRET`: `<generate 32+ character key>`
   * `JWT_REFRESH_SECRET`: `<generate 32+ character key>`
   * `CORS_ORIGINS`: `https://gov-infra-alm.vercel.app`
   * `CLOUDINARY_CLOUD_NAME`: `your-cloud-name`
   * `CLOUDINARY_API_KEY`: `your-api-key`
   * `CLOUDINARY_API_SECRET`: `your-api-secret`

### Frontend on Vercel
1. Import your Git repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Next.js** / **React**.
4. Set Environment Variable:
   * `NEXT_PUBLIC_API_URL`: `https://your-render-backend.onrender.com`
5. Deploy. SPA routing and client-side transitions work out of the box with `frontend/vercel.json`.

---

## 📄 License
This project is licensed under the MIT License.
