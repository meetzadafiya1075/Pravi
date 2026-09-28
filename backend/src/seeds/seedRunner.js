require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const QrService = require("../services/qrService");

const Organization = require("../models/Organization");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const User = require("../models/User");
const Department = require("../models/Department");
const Location = require("../models/Location");
const { District, Zone, Ward } = require("../models/Hierarchy");
const Contractor = require("../models/Contractor");
const AssetCategory = require("../models/AssetCategory");
const Asset = require("../models/Asset");
const AssetStatusHistory = require("../models/AssetStatusHistory");
const InfrastructureProject = require("../models/InfrastructureProject");
const InfrastructureInspection = require("../models/InfrastructureInspection");
const { MaintenanceTicket } = require("../models/MaintenanceTicket");
const Warranty = require("../models/Warranty");
const Complaint = require("../models/Complaint");
const { Audit } = require("../models/Audit");
const AuditLog = require("../models/AuditLog");

const PERMISSIONS = [
  // Assets
  { code: "asset:create", module: "ASSET", description: "Register new infrastructure assets" },
  { code: "asset:read", module: "ASSET", description: "View public infrastructure assets and GIS coordinates" },
  { code: "asset:update", module: "ASSET", description: "Update asset metadata, GIS coordinates, and lifecycle" },
  { code: "asset:delete", module: "ASSET", description: "Decommission or remove infrastructure asset record" },
  { code: "asset:assign", module: "ASSET", description: "Assign asset custodian or department custody" },
  { code: "asset:transfer_request", module: "ASSET", description: "Initiate inter-department or inter-district asset transfer" },
  { code: "asset:transfer_approve", module: "ASSET", description: "Approve or reject jurisdictional transfer" },
  { code: "asset:retire", module: "ASSET", description: "Decommission and retire infrastructure asset" },
  { code: "asset:dispose", module: "ASSET", description: "Dispose and salvage condemned infrastructure" },
  // Maintenance
  { code: "maintenance:create", module: "MAINTENANCE", description: "Raise infrastructure maintenance requests or complaints" },
  { code: "maintenance:read", module: "MAINTENANCE", description: "View maintenance work orders and contractor logs" },
  { code: "maintenance:update", module: "MAINTENANCE", description: "Update work orders, log contractor expenses and parts" },
  // Audit & Inspection
  { code: "audit:create", module: "AUDIT", description: "Create and initiate district-wide infrastructure audit campaigns" },
  { code: "audit:read", module: "AUDIT", description: "View audit campaigns and physical condition reports" },
  { code: "audit:scan_verify", module: "AUDIT", description: "Conduct physical asset inspections and QR verification" },
  { code: "audit:reconcile", module: "AUDIT", description: "Reconcile audit discrepancies and certify infrastructure" },
  // Administration & Reporting
  { code: "user:manage", module: "ADMIN", description: "Manage government officers, departments, and roles" },
  { code: "report:view", module: "REPORT", description: "View infrastructure valuation and condition reports" },
  { code: "report:export", module: "REPORT", description: "Export state-level asset registers and audit trails to CSV/PDF" },
];

const ROLES_MAP = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.code),
  DEPARTMENT_ADMIN: [
    "asset:create", "asset:read", "asset:update", "asset:assign",
    "asset:transfer_request", "asset:transfer_approve", "asset:retire", "asset:dispose",
    "maintenance:create", "maintenance:read", "maintenance:update",
    "audit:create", "audit:read", "audit:scan_verify", "audit:reconcile",
    "user:manage", "report:view", "report:export",
  ],
  DISTRICT_OFFICER: [
    "asset:read", "asset:update", "asset:transfer_request", "asset:transfer_approve",
    "maintenance:create", "maintenance:read", "audit:read", "audit:scan_verify",
    "report:view",
  ],
  ASSET_MANAGER: [
    "asset:create", "asset:read", "asset:update", "asset:assign",
    "asset:transfer_request", "asset:transfer_approve", "asset:retire", "asset:dispose",
    "maintenance:create", "maintenance:read", "maintenance:update",
    "audit:create", "audit:read", "audit:scan_verify", "audit:reconcile",
    "user:manage", "report:view", "report:export",
  ],
  INSPECTOR: [
    "asset:read", "audit:read", "audit:scan_verify", "maintenance:create", "maintenance:read",
    "report:view",
  ],
  MAINTENANCE_OFFICER: [
    "asset:read", "maintenance:create", "maintenance:read", "maintenance:update",
    "report:view",
  ],
  CONTRACTOR: ["asset:read", "maintenance:read", "maintenance:update"],
  AUDITOR: [
    "asset:read", "audit:read", "audit:scan_verify", "audit:reconcile",
    "report:view", "report:export",
  ],
  DEPARTMENT_MANAGER: [
    "asset:read", "asset:transfer_request", "asset:transfer_approve",
    "maintenance:create", "maintenance:read", "report:view",
  ],
  EMPLOYEE: ["asset:read", "maintenance:create", "maintenance:read"],
  TECHNICIAN: ["asset:read", "maintenance:create", "maintenance:read", "maintenance:update"],
  VIEWER: ["asset:read", "report:view"],
};

async function seed() {
  console.log("==================================================");
  console.log("[GovInfra ALM] Starting MongoDB Database Seeding...");
  console.log("==================================================");

  await connectDB();

  // 1. Organization
  let org = await Organization.findOne({ slug: "gov-infra" });
  if (!org) {
    org = await Organization.create({
      name: "Gujarat State Infrastructure & Urban Development Authority",
      slug: "gov-infra",
      plan_type: "ENTERPRISE",
      settings: {
        currency: "INR",
        state: "Gujarat",
        timezone: "Asia/Kolkata",
        fiscalYearStart: "04-01",
      },
    });
  }

  // 2. Permissions
  const permDocMap = {};
  for (const p of PERMISSIONS) {
    let perm = await Permission.findOne({ code: p.code });
    if (!perm) {
      perm = await Permission.create(p);
    }
    permDocMap[p.code] = perm;
  }

  // 3. Roles
  const roleDocMap = {};
  for (const [roleCode, permCodes] of Object.entries(ROLES_MAP)) {
    let role = await Role.findOne({ organization_id: org.id, code: roleCode });
    const permIds = permCodes.map((code) => permDocMap[code]?.id).filter(Boolean);
    if (!role) {
      role = await Role.create({
        organization_id: org.id,
        name: roleCode.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        code: roleCode,
        is_system: true,
        permissions: permIds,
      });
    } else {
      role.permissions = permIds;
      await role.save();
    }
    roleDocMap[roleCode] = role;
  }

  // 4. Departments
  const depts = [
    { name: "Public Works Department", code: "PWD" },
    { name: "Urban Development & Municipal Works", code: "UDD" },
    { name: "Water Resources & Sewerage Board", code: "WTR" },
    { name: "Health & Family Welfare (Hospitals)", code: "HLT" },
    { name: "School Education Department", code: "EDU" },
    { name: "Energy & Public Lighting Authority", code: "ENG" },
    { name: "Transport & Transit Authority", code: "TRN" },
  ];
  const deptDocMap = {};
  for (const d of depts) {
    let dept = await Department.findOne({ organization_id: org.id, code: d.code });
    if (!dept) {
      dept = await Department.create({
        organization_id: org.id,
        name: d.name,
        code: d.code,
      });
    }
    deptDocMap[d.code] = dept;
  }

  // Legacy department codes for compatibility
  for (const [legName, legCode] of [["Engineering", "ENG_LEGACY"], ["IT Operations", "OPS"], ["Facilities", "FAC"]]) {
    let d = await Department.findOne({ organization_id: org.id, code: legCode });
    if (!d) {
      await Department.create({ organization_id: org.id, name: legName, code: legCode });
    }
  }

  // 5. Districts, Zones, and Wards (Hierarchy)
  const districtsData = [
    { name: "Ahmedabad", code: "AMD", headquarters: "Ahmedabad City" },
    { name: "Surat", code: "SRT", headquarters: "Surat Central" },
    { name: "Vadodara", code: "VAD", headquarters: "Vadodara City" },
    { name: "Rajkot", code: "RJK", headquarters: "Rajkot Urban" },
    { name: "Gandhinagar", code: "GND", headquarters: "Capital Complex" },
  ];
  const distDocMap = {};
  for (const d of districtsData) {
    let dist = await District.findOne({ organization_id: org.id, code: d.code });
    if (!dist) {
      dist = await District.create({
        organization_id: org.id,
        name: d.name,
        code: d.code,
        headquarters: d.headquarters,
      });
    }
    distDocMap[d.name] = dist;
  }

  // 6. Locations / Facilities
  const locationsData = [
    { name: "West Zone Ward 12 Municipal Office", site_code: "WZ-W12", building: "Zone 12 Admin Block", room: "Ahmedabad", floor: "Floor 1", district: "Ahmedabad", zone: "West Zone", ward: "Ward 12", lat: 23.0338, lng: 72.585 },
    { name: "Central Secretariat & Civil Hospital Complex", site_code: "GN-SEC", building: "Block 4 Health Wing", room: "Gandhinagar", floor: "Ground Floor", district: "Gandhinagar", zone: "Central Zone", ward: "Ward 1", lat: 23.2156, lng: 72.6369 },
    { name: "South Zone Water Treatment & Pumping Complex", site_code: "ST-WTP", building: "Plant Operations Main", room: "Surat", floor: "Control Room", district: "Surat", zone: "South Zone", ward: "Ward 18", lat: 21.1702, lng: 72.8311 },
    { name: "East Overbridge & Highway Control Station", site_code: "VD-OB", building: "Highway Monitoring Post", room: "Vadodara", floor: "Station A", district: "Vadodara", zone: "East Zone", ward: "Ward 7", lat: 22.3072, lng: 73.1812 },
    { name: "Ring Road Command & Smart City Operations Center", site_code: "RJ-RC", building: "Smart City Data Hub", room: "Rajkot", floor: "Suite 201", district: "Rajkot", zone: "North Zone", ward: "Ward 5", lat: 22.3039, lng: 70.8022 },
  ];
  const locDocMap = {};
  for (const l of locationsData) {
    let loc = await Location.findOne({ organization_id: org.id, site_code: l.site_code });
    if (!loc) {
      loc = await Location.create({
        organization_id: org.id,
        name: l.name,
        site_code: l.site_code,
        building: l.building,
        floor: l.floor,
        room: l.room,
        district: l.district,
        zone: l.zone,
        ward: l.ward,
        latitude: l.lat,
        longitude: l.lng,
        address: `${l.building}, ${l.room}, ${l.district}`,
      });
    }
    locDocMap[l.site_code] = loc;
  }

  // 7. Categories
  const categoriesData = [
    { name: "Transportation & Highways", code: "TRN", life: 360 },
    { name: "Civil Buildings & Institutions", code: "BLD", life: 600 },
    { name: "Water Infrastructure & Sewage", code: "WTR", life: 300 },
    { name: "Electrical & Power Distribution", code: "ELE", life: 240 },
    { name: "Smart City IT & Surveillance", code: "SMC", life: 84 },
  ];
  const catDocMap = {};
  for (const c of categoriesData) {
    let cat = await AssetCategory.findOne({ organization_id: org.id, code: c.code });
    if (!cat) {
      cat = await AssetCategory.create({
        organization_id: org.id,
        name: c.name,
        code: c.code,
        default_useful_life_months: c.life,
        depreciation_method: "STRAIGHT_LINE",
      });
    }
    catDocMap[c.code] = cat;
  }

  // 8. Contractors
  const contractorsData = [
    { name: "Larsen & Toubro Heavy Civil Infrastructure", contact: "P. K. Verma (VP Projects)", email: "contact@lt-infra.internal", val: 550000000 },
    { name: "Afcons Infrastructure & Bridge Engineering", contact: "K. R. Nair (Project Director)", email: "director@afcons-eng.internal", val: 320000000 },
    { name: "Tata Projects - Urban & Water Utilities", contact: "Ananya Deshmukh (Contract Mgr)", email: "ananya@tataprojects.internal", val: 240000000 },
    { name: "Gujarat State Road Development Corporation", contact: "Executive Engineer", email: "projects@gsrdc-agency.internal", val: 180000000 },
  ];
  const contractorDocMap = {};
  for (const con of contractorsData) {
    let c = await Contractor.findOne({ organization_id: org.id, name: con.name });
    if (!c) {
      c = await Contractor.create({
        organization_id: org.id,
        name: con.name,
        contact_person: con.contact,
        email: con.email,
        phone: "+91-98765-43210",
        address: "Industrial Development Zone, Gujarat",
        contract_value: con.val,
      });
    }
    contractorDocMap[con.name] = c;
  }

  // 9. Infrastructure Projects
  const projectsData = [
    {
      code: "PWD-2026-001",
      name: "Smart Ring Road & Overbridge Expansion Project",
      desc: "Four-lane flyover and grade separator project to alleviate peak congestion along arterial corridor.",
      dept: "PWD",
      contractor: "Afcons Infrastructure & Bridge Engineering",
      scheme: "Smart Cities Mission",
      source: "State Infrastructure Development Fund",
      budget: 250000000,
      start: new Date("2025-04-01"),
      end: new Date("2026-12-31"),
      status: "ACTIVE",
    },
    {
      code: "WTR-2026-004",
      name: "Suburban Potable Water Treatment & SCADA Pumping Station",
      desc: "50 MLD automated water purification plant and distribution network expansion.",
      dept: "WTR",
      contractor: "Tata Projects - Urban & Water Utilities",
      scheme: "Amrut 2.0 Water Mission",
      source: "National Water Infrastructure Program",
      budget: 185000000,
      start: new Date("2025-01-15"),
      end: new Date("2026-08-30"),
      status: "ACTIVE",
    },
    {
      code: "HLT-2026-002",
      name: "Regional Civil Hospital 500-Bed Trauma & ICU Wing",
      desc: "Multispecialty tertiary hospital trauma block with redundant oxygen and power backup.",
      dept: "HLT",
      contractor: "Larsen & Toubro Heavy Civil Infrastructure",
      scheme: "National Health Infrastructure Mission",
      source: "State Health Ministry Budget",
      budget: 420000000,
      start: new Date("2024-10-01"),
      end: new Date("2026-06-30"),
      status: "ACTIVE",
    },
    {
      code: "ELE-2026-009",
      name: "Municipal High-Efficiency Solar LED Smart Streetlight Network",
      desc: "Installation of 12,000 smart connected LED luminaires with central astronomical timer control.",
      dept: "ENG",
      contractor: "Larsen & Toubro Heavy Civil Infrastructure",
      scheme: "Urban Renewable Energy Scheme",
      source: "Municipal Green Fund",
      budget: 78000000,
      start: new Date("2025-06-01"),
      end: new Date("2026-03-31"),
      status: "ACTIVE",
    },
  ];
  const projectDocMap = {};
  for (const p of projectsData) {
    let proj = await InfrastructureProject.findOne({ organization_id: org.id, project_code: p.code });
    if (!proj) {
      proj = await InfrastructureProject.create({
        organization_id: org.id,
        project_code: p.code,
        name: p.name,
        description: p.desc,
        department_id: deptDocMap[p.dept].id,
        contractor_id: contractorDocMap[p.contractor]?.id,
        funding_source: p.source,
        funding_scheme: p.scheme,
        budget_allocated: p.budget,
        actual_expenditure: p.budget * 0.35,
        start_date: p.start,
        expected_completion: p.end,
        status: p.status,
      });
    }
    projectDocMap[p.code] = proj;
  }

  // 10. Users
  const defaultPassword = await bcrypt.hash("Password123!", 10);
  const usersData = [
    { email: "admin@gov.internal", fn: "Dr. Rajesh", ln: "Sharma", role: "SUPER_ADMIN", dept: null, dist: "Gandhinagar" },
    { email: "pwd.director@gov.internal", fn: "Sunil", ln: "Mehta", role: "DEPARTMENT_ADMIN", dept: "PWD", dist: "Ahmedabad" },
    { email: "district.officer@gov.internal", fn: "Vikram", ln: "Patel", role: "DISTRICT_OFFICER", dept: "UDD", dist: "Surat" },
    { email: "asset.manager@gov.internal", fn: "Pooja", ln: "Shah", role: "ASSET_MANAGER", dept: "UDD", dist: "Ahmedabad" },
    { email: "inspector.patel@gov.internal", fn: "Harish", ln: "Patel", role: "INSPECTOR", dept: "PWD", dist: "Vadodara" },
    { email: "maintenance.eng@gov.internal", fn: "Dinesh", ln: "Parmar", role: "MAINTENANCE_OFFICER", dept: "WTR", dist: "Surat" },
    { email: "contractor.rep@lt-infra.internal", fn: "Nitin", ln: "Desai", role: "CONTRACTOR", dept: null, dist: "Ahmedabad" },
    { email: "auditor.vigilance@gov.internal", fn: "Kavita", ln: "Iyer", role: "AUDITOR", dept: null, dist: "Gandhinagar" },
    // Backward compatibility accounts
    { email: "admin@platform.internal", fn: "Super", ln: "Admin", role: "SUPER_ADMIN", dept: null, dist: "Ahmedabad" },
    { email: "manager@acme.corp", fn: "Marcus", ln: "Vance", role: "ASSET_MANAGER", dept: "UDD", dist: "Ahmedabad" },
    { email: "dept.head@acme.corp", fn: "Elena", ln: "Rostova", role: "DEPARTMENT_MANAGER", dept: "PWD", dist: "Ahmedabad" },
    { email: "john.dev@acme.corp", fn: "John", ln: "Developer", role: "EMPLOYEE", dept: "PWD", dist: "Ahmedabad" },
    { email: "auditor@compliance.org", fn: "Rachel", ln: "Green", role: "AUDITOR", dept: null, dist: "Ahmedabad" },
    { email: "tech@support.internal", fn: "Toby", ln: "Flenderson", role: "TECHNICIAN", dept: "WTR", dist: "Surat" },
  ];
  const userDocMap = {};
  for (const u of usersData) {
    let user = await User.findOne({ organization_id: org.id, email: u.email });
    const deptId = u.dept && deptDocMap[u.dept] ? deptDocMap[u.dept].id : null;
    const roleId = roleDocMap[u.role] ? roleDocMap[u.role].id : roleDocMap["VIEWER"].id;

    if (!user) {
      user = await User.create({
        organization_id: org.id,
        email: u.email,
        hashed_password: defaultPassword,
        first_name: u.fn,
        last_name: u.ln,
        role_id: roleId,
        department_id: deptId,
        district: u.dist,
        phone: "+91-94260-11223",
        is_active: true,
      });
    }
    userDocMap[u.email] = user;
  }

  // 11. Assets
  const assetsData = [
    {
      tag: "INFRA-AMD-RD-001",
      name: "Ahmedabad S.G. Highway Express Corridor & Elevated Flyover",
      desc: "Six-lane arterial expressway section connecting Sarkhej with Gandhinagar capital corridor.",
      sn: "SN-HWY-AMD-2024-0881",
      cat: "TRN",
      dept: "PWD",
      loc: "WZ-W12",
      contractor: "Afcons Infrastructure & Bridge Engineering",
      proj: "PWD-2026-001",
      cost: 450000000,
      cond: "GOOD",
      crit: "CRITICAL",
      status: "OPERATIONAL",
      district: "Ahmedabad",
      zone: "West Zone",
      ward: "Ward 12",
      address: "S.G. Highway Corridor, Ahmedabad",
      lat: 23.0338,
      lng: 72.585,
    },
    {
      tag: "INFRA-SRT-WTP-002",
      name: "South Tapi 100 MLD Automated Water Treatment Plant",
      desc: "SCADA-controlled surface water intake, sand filtration, and chlorination treatment facility.",
      sn: "SN-WTP-SRT-2023-4412",
      cat: "WTR",
      dept: "WTR",
      loc: "ST-WTP",
      contractor: "Tata Projects - Urban & Water Utilities",
      proj: "WTR-2026-004",
      cost: 210000000,
      cond: "NEEDS_MAINTENANCE",
      crit: "CRITICAL",
      status: "UNDER_MAINTENANCE",
      district: "Surat",
      zone: "South Zone",
      ward: "Ward 18",
      address: "Tapi Riverfront Operations, Surat",
      lat: 21.1702,
      lng: 72.8311,
    },
    {
      tag: "INFRA-GND-HSP-003",
      name: "Gandhinagar Regional Civil Hospital Trauma & Diagnostics Wing",
      desc: "500-bed multispecialty tertiary inpatient block with 12 modular operating suites.",
      sn: "SN-HSP-GND-2022-9011",
      cat: "BLD",
      dept: "HLT",
      loc: "GN-SEC",
      contractor: "Larsen & Toubro Heavy Civil Infrastructure",
      proj: "HLT-2026-002",
      cost: 380000000,
      cond: "GOOD",
      crit: "HIGH",
      status: "OPERATIONAL",
      district: "Gandhinagar",
      zone: "Central Zone",
      ward: "Ward 1",
      address: "Sector 12 Hospital Complex, Gandhinagar",
      lat: 23.2156,
      lng: 72.6369,
    },
    {
      tag: "INFRA-VAD-BRG-004",
      name: "Vishwamitri River 4-Lane Pre-Stressed Concrete Bridge",
      desc: "Span bridge carrying inter-city transit linking Vadodara East to western urban centers.",
      sn: "SN-BRG-VAD-2021-3109",
      cat: "TRN",
      dept: "PWD",
      loc: "VD-OB",
      contractor: "Afcons Infrastructure & Bridge Engineering",
      proj: "PWD-2026-001",
      cost: 165000000,
      cond: "FAIR",
      crit: "HIGH",
      status: "OPERATIONAL",
      district: "Vadodara",
      zone: "East Zone",
      ward: "Ward 7",
      address: "Vishwamitri Overpass, Vadodara",
      lat: 22.3072,
      lng: 73.1812,
    },
    {
      tag: "INFRA-RJK-SLG-005",
      name: "Rajkot Smart Solar LED Highway Lighting Network (Grid-Connected)",
      desc: "Centrally monitored IoT solar lighting array spanning 45 km of arterial ring road.",
      sn: "SN-SLG-RJK-2024-7721",
      cat: "ELE",
      dept: "ENG",
      loc: "RJ-RC",
      contractor: "Larsen & Toubro Heavy Civil Infrastructure",
      proj: "ELE-2026-009",
      cost: 42000000,
      cond: "GOOD",
      crit: "MEDIUM",
      status: "OPERATIONAL",
      district: "Rajkot",
      zone: "North Zone",
      ward: "Ward 5",
      address: "150 Feet Ring Road, Rajkot",
      lat: 22.3039,
      lng: 70.8022,
    },
    {
      tag: "INFRA-AMD-SCH-006",
      name: "Government Model High School Campus & STEM Laboratory Wing",
      desc: "Three-story earthquake-resistant academic complex serving 1,400 secondary students.",
      sn: "SN-SCH-AMD-2023-1190",
      cat: "BLD",
      dept: "EDU",
      loc: "WZ-W12",
      contractor: "Gujarat State Road Development Corporation",
      proj: null,
      cost: 58000000,
      cond: "GOOD",
      crit: "MEDIUM",
      status: "OPERATIONAL",
      district: "Ahmedabad",
      zone: "West Zone",
      ward: "Ward 12",
      address: "Memnagar Education Enclave, Ahmedabad",
      lat: 23.0512,
      lng: 72.5367,
    },
    {
      tag: "INFRA-SRT-CCTV-007",
      name: "Surat Urban Surveillance Smart CCTV Camera Junction Grid",
      desc: "500 high-definition PTZ traffic surveillance cameras integrated with Command & Control.",
      sn: "SN-SMC-SRT-2024-0043",
      cat: "SMC",
      dept: "UDD",
      loc: "ST-WTP",
      contractor: "Tata Projects - Urban & Water Utilities",
      proj: null,
      cost: 34000000,
      cond: "CRITICAL",
      crit: "HIGH",
      status: "UNDER_MAINTENANCE",
      district: "Surat",
      zone: "Central Zone",
      ward: "Ward 3",
      address: "Athwa Lines Smart Junction, Surat",
      lat: 21.1895,
      lng: 72.8123,
    },
    {
      tag: "INFRA-GND-ADM-008",
      name: "State Administrative Complex & Disaster Management Center",
      desc: "Central government administrative complex with emergency coordination command room.",
      sn: "SN-ADM-GND-2020-0012",
      cat: "BLD",
      dept: "UDD",
      loc: "GN-SEC",
      contractor: "Larsen & Toubro Heavy Civil Infrastructure",
      proj: null,
      cost: 290000000,
      cond: "GOOD",
      crit: "CRITICAL",
      status: "OPERATIONAL",
      district: "Gandhinagar",
      zone: "Central Zone",
      ward: "Ward 1",
      address: "Sector 10 Administrative Zone, Gandhinagar",
      lat: 23.2201,
      lng: 72.6512,
    },
  ];

  const assetDocMap = {};
  for (const a of assetsData) {
    let asset = await Asset.findOne({ organization_id: org.id, asset_tag: a.tag });
    if (!asset) {
      asset = new Asset({
        organization_id: org.id,
        asset_tag: a.tag,
        name: a.name,
        description: a.desc,
        serial_number: a.sn,
        category_id: catDocMap[a.cat].id,
        department_id: deptDocMap[a.dept]?.id,
        location_id: locDocMap[a.loc]?.id,
        vendor_id: contractorDocMap[a.contractor]?.id,
        project_id: a.proj && projectDocMap[a.proj] ? projectDocMap[a.proj].id : null,
        purchase_cost: a.cost,
        current_book_value: a.cost * 0.92,
        salvage_value: a.cost * 0.1,
        condition: a.cond,
        criticality: a.crit,
        status: a.status,
        district: a.district,
        zone: a.zone,
        ward: a.ward,
        address: a.address,
        latitude: a.lat,
        longitude: a.lng,
        responsible_officer_id: userDocMap["pwd.director@gov.internal"]?.id,
        funding_source: "State Infrastructure Development Fund",
        funding_scheme: "Smart Cities & Urban Resilience Mission",
        purchase_date: new Date("2023-01-15"),
        commissioning_date: new Date("2024-03-31"),
      });

      const qr = await QrService.generateAssetQrBase64(asset.id, asset.asset_tag);
      asset.qr_code_url = qr;
      await asset.save();

      await AssetStatusHistory.create({
        organization_id: org.id,
        asset_id: asset.id,
        from_status: "NONE",
        to_status: a.status,
        actor_id: userDocMap["admin@gov.internal"].id,
        reason: "Initial registration into state infrastructure asset registry",
      });
    }
    assetDocMap[a.tag] = asset;
  }

  // 12. Inspections
  const inspData = [
    {
      code: "INSP-2026-0012",
      asset: "INFRA-AMD-RD-001",
      inspector: "inspector.patel@gov.internal",
      cond: "GOOD",
      risk: "LOW",
      obs: "Deck surface and expansion joints intact. Minor resurfacing recommended for Ramp C.",
      action: "Scheduled routine crack sealing during off-peak hours.",
    },
    {
      code: "INSP-2026-0034",
      asset: "INFRA-SRT-WTP-002",
      inspector: "inspector.patel@gov.internal",
      cond: "NEEDS_MAINTENANCE",
      risk: "CRITICAL",
      obs: "Primary intake pump unit #2 exhibiting high vibration readings and seal degradation.",
      action: "Immediate pump overhaul and impeller replacement required.",
    },
    {
      code: "INSP-2026-0056",
      asset: "INFRA-VAD-BRG-004",
      inspector: "inspector.patel@gov.internal",
      cond: "FAIR",
      risk: "MEDIUM",
      obs: "Scour depth around Pier #4 stable. Bearing pads show acceptable wear within tolerance limits.",
      action: "Re-inspect after monsoon drainage cycle.",
    },
  ];
  for (const insp of inspData) {
    let record = await InfrastructureInspection.findOne({ organization_id: org.id, inspection_code: insp.code });
    if (!record && assetDocMap[insp.asset]) {
      await InfrastructureInspection.create({
        organization_id: org.id,
        inspection_code: insp.code,
        asset_id: assetDocMap[insp.asset].id,
        inspector_id: userDocMap[insp.inspector]?.id || userDocMap["admin@gov.internal"].id,
        condition: insp.cond,
        risk_level: insp.risk,
        observations: insp.obs,
        recommended_action: insp.action,
        inspection_date: new Date(),
        status: "COMPLETED",
      });
    }
  }

  // 13. Maintenance Tickets
  const maintData = [
    {
      num: "TICK-884102",
      asset: "INFRA-SRT-WTP-002",
      user: "maintenance.eng@gov.internal",
      tech: "maintenance.eng@gov.internal",
      con: "Tata Projects - Urban & Water Utilities",
      pri: "CRITICAL",
      type: "CORRECTIVE",
      issue: "Emergency hydraulic actuator replacement on primary settling intake valve.",
      status: "IN_PROGRESS",
      cost: 450000,
    },
    {
      num: "TICK-721094",
      asset: "INFRA-SRT-CCTV-007",
      user: "district.officer@gov.internal",
      tech: "tech@support.internal",
      con: "Larsen & Toubro Heavy Civil Infrastructure",
      pri: "HIGH",
      type: "REPAIR",
      issue: "Optical fiber junction link severed by third-party pipeline excavation.",
      status: "OPEN",
      cost: 120000,
    },
  ];
  for (const m of maintData) {
    let ticket = await MaintenanceTicket.findOne({ organization_id: org.id, ticket_number: m.num });
    if (!ticket && assetDocMap[m.asset]) {
      await MaintenanceTicket.create({
        organization_id: org.id,
        ticket_number: m.num,
        asset_id: assetDocMap[m.asset].id,
        requested_by_user_id: userDocMap[m.user]?.id || userDocMap["admin@gov.internal"].id,
        assigned_technician_id: userDocMap[m.tech]?.id,
        contractor_id: contractorDocMap[m.con]?.id,
        priority: m.pri,
        maintenance_type: m.type,
        issue_description: m.issue,
        status: m.status,
        total_cost: m.cost,
        history_logs: [
          {
            ticket_id: m.num,
            logged_by_id: userDocMap[m.user]?.id || userDocMap["admin@gov.internal"].id,
            action_taken: "Work order assigned to maintenance contractor and site inspection completed.",
            parts_replaced: "Gasket seals, hydraulic coupling",
            cost: m.cost,
            logged_at: new Date(),
          },
        ],
      });
    }
  }

  // 14. Public Complaints / Grievances
  const grievancesData = [
    {
      cid: "GRV-301294",
      asset: "INFRA-RJK-SLG-005",
      title: "Street lights dark on arterial ring road stretch",
      desc: "5 consecutive high-mast solar luminaires not illuminating after sunset near Mavdi circle.",
      loc: "150 Feet Ring Road, Mavdi Junction",
      dist: "Rajkot",
      pri: "HIGH",
      status: "ASSIGNED",
      dept: "ENG",
    },
    {
      cid: "GRV-301295",
      asset: "INFRA-AMD-RD-001",
      title: "Pothole formation after pre-monsoon storm on Ramp B",
      desc: "Significant road surface depression causing vehicular deceleration on northbound flyover ramp.",
      loc: "S.G. Highway Northbound Ramp B",
      dist: "Ahmedabad",
      pri: "MEDIUM",
      status: "REPORTED",
      dept: "PWD",
    },
  ];
  for (const g of grievancesData) {
    let grv = await Complaint.findOne({ organization_id: org.id, complaint_id: g.cid });
    if (!grv) {
      await Complaint.create({
        organization_id: org.id,
        complaint_id: g.cid,
        asset_id: assetDocMap[g.asset]?.id,
        title: g.title,
        description: g.desc,
        location: g.loc,
        district: g.dist,
        priority: g.pri,
        department_id: deptDocMap[g.dept]?.id,
        status: g.status,
        reported_by_name: "Citizen Traffic Helpline",
        reported_by_phone: "+91-98980-00100",
      });
    }
  }

  // 15. Audit Campaigns
  let audit = await Audit.findOne({ organization_id: org.id, audit_code: "AUD-2026-Q1-AMD" });
  if (!audit) {
    audit = await Audit.create({
      organization_id: org.id,
      title: "Ahmedabad Urban Infrastructure Physical Verification 2026",
      audit_code: "AUD-2026-Q1-AMD",
      target_location_id: locDocMap["WZ-W12"]?.id,
      target_department_id: deptDocMap["PWD"]?.id,
      start_date: new Date("2026-01-10"),
      end_date: new Date("2026-03-31"),
      lead_auditor_id: userDocMap["auditor.vigilance@gov.internal"].id,
      summary_notes: "Mandatory statutory physical asset count and QR scan validation.",
      status: "IN_PROGRESS",
      items: [
        {
          audit_id: "AUD-2026-Q1-AMD",
          asset_id: assetDocMap["INFRA-AMD-RD-001"].id,
          verification_status: "VERIFIED_OK",
          scanned_by_user_id: userDocMap["auditor.vigilance@gov.internal"].id,
          scanned_at: new Date(),
          remarks: "Physical structure matches satellite GIS and tender drawing specifications.",
        },
      ],
    });
  }

  // 16. Audit Log
  await AuditLog.create({
    organization_id: org.id,
    actor_id: userDocMap["admin@gov.internal"].id,
    action: "DATABASE_INITIALIZATION",
    entity_type: "System",
    entity_id: org.id,
    before_state: null,
    after_state: { version: "MERN-2.0", authority: org.name },
    timestamp: new Date(),
  });

  console.log("==================================================");
  console.log("[GovInfra ALM] Database Seeding Completed Successfully!");
  console.log(`[GovInfra ALM] Authority: ${org.name}`);
  console.log(`[GovInfra ALM] Seeded Users: ${Object.keys(userDocMap).length}`);
  console.log(`[GovInfra ALM] Seeded Infrastructure Assets: ${Object.keys(assetDocMap).length}`);
  console.log(`[GovInfra ALM] Seeded Projects: ${Object.keys(projectDocMap).length}`);
  console.log("==================================================");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[GovInfra ALM] Seeding failed:", err);
  process.exit(1);
});
