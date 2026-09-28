const BASE_URL = "http://127.0.0.1:8000";

async function runRegressionTests() {
  console.log("==================================================");
  console.log("Starting Complete MERN Backend Regression Test...");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const assert = (name, condition, details = "") => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} ${details}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert("GET /health status is ok", health.status === "ok");
    assert("GET /health stack is MERN", health.stack.includes("MERN"));

    // 2. Authentication Login
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gov.internal",
        password: "Password123!",
      }),
    });
    const loginData = await loginRes.json();
    assert("POST /api/v1/auth/login returns access_token", Boolean(loginData.access_token));
    const token = loginData.access_token;
    const refreshToken = loginData.refresh_token;

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // 3. Token refresh
    const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert("POST /api/v1/auth/refresh rotates token", Boolean(refreshData.access_token));

    // 4. Current user profile
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert("GET /api/v1/auth/me returns admin role", meData.role_code === "SUPER_ADMIN");
    assert("GET /api/v1/auth/me has permissions array", Array.isArray(meData.permissions));

    // 5. Dashboard Metrics (database-driven)
    const metricsRes = await fetch(`${BASE_URL}/api/v1/dashboard/metrics`, { headers: authHeaders });
    const metricsData = await metricsRes.json();
    assert("GET /api/v1/dashboard/metrics total_assets > 0", metricsData.total_assets > 0);
    assert("GET /api/v1/dashboard/metrics total_valuation > 0", metricsData.total_valuation > 0);
    assert("GET /api/v1/dashboard/metrics active_projects > 0", metricsData.active_projects > 0);

    // 6. Departments & Locations
    const deptsRes = await fetch(`${BASE_URL}/api/v1/organizations/departments`, { headers: authHeaders });
    const deptsData = await deptsRes.json();
    assert("GET /api/v1/organizations/departments returns list", deptsData.length >= 6);

    const locsRes = await fetch(`${BASE_URL}/api/v1/organizations/locations`, { headers: authHeaders });
    const locsData = await locsRes.json();
    assert("GET /api/v1/organizations/locations returns list", locsData.length >= 5);

    // 7. Categories & Contractors
    const catsRes = await fetch(`${BASE_URL}/api/v1/assets/categories`, { headers: authHeaders });
    const catsData = await catsRes.json();
    assert("GET /api/v1/assets/categories returns list", catsData.length >= 5);

    const vendorsRes = await fetch(`${BASE_URL}/api/v1/assets/vendors`, { headers: authHeaders });
    const vendorsData = await vendorsRes.json();
    assert("GET /api/v1/assets/vendors returns list", vendorsData.length >= 4);

    // 8. Projects
    const projectsRes = await fetch(`${BASE_URL}/api/v1/projects`, { headers: authHeaders });
    const projectsData = await projectsRes.json();
    assert("GET /api/v1/projects returns projects", projectsData.length >= 4);

    // Create a new project
    const newProjCode = `TEST-PRJ-${Date.now().toString().slice(-4)}`;
    const newProjRes = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        project_code: newProjCode,
        name: "Gujarat Coastal Highway Smart Grid",
        department_id: deptsData[0].id,
        funding_source: "Central Government Scheme",
        funding_scheme: "Sagarmala Coastal Development",
        budget_allocated: 120000000,
      }),
    });
    const newProj = await newProjRes.json();
    assert("POST /api/v1/projects creates project", newProj.project_code === newProjCode);

    // 9. Assets List & Create
    const assetsRes = await fetch(`${BASE_URL}/api/v1/assets`, { headers: authHeaders });
    const assetsData = await assetsRes.json();
    assert("GET /api/v1/assets returns assets", assetsData.length >= 8);

    // Create a new asset
    const newAssetTag = `TEST-INFRA-${Date.now().toString().slice(-5)}`;
    const newAssetRes = await fetch(`${BASE_URL}/api/v1/assets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        asset_tag: newAssetTag,
        name: "Vadodara Multimodal Bus Terminal Junction",
        serial_number: `SN-TEST-${Date.now().toString().slice(-4)}`,
        category_id: catsData[0].id,
        department_id: deptsData[0].id,
        district: "Vadodara",
        zone: "Central Zone",
        ward: "Ward 4",
        purchase_cost: 95000000,
        condition: "GOOD",
        criticality: "HIGH",
        status: "OPERATIONAL",
        latitude: 22.3072,
        longitude: 73.1812,
      }),
    });
    const newAsset = await newAssetRes.json();
    assert("POST /api/v1/assets creates asset", newAsset.asset_tag === newAssetTag);
    assert("POST /api/v1/assets generates QR url", Boolean(newAsset.qr_code_url));

    const assetId = newAsset.id;

    // 10. QR code endpoint
    const qrRes = await fetch(`${BASE_URL}/api/v1/assets/${assetId}/qr`, { headers: authHeaders });
    const qrData = await qrRes.json();
    assert("GET /api/v1/assets/:id/qr returns base64", qrData.qr_data_url.startsWith("data:image/png;base64,"));

    // 11. Asset lifecycle transition
    const transRes = await fetch(`${BASE_URL}/api/v1/assets/${assetId}/transition`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        to_status: "UNDER_MAINTENANCE",
        reason: "Scheduled pre-monsoon structural retrofit",
      }),
    });
    const transData = await transRes.json();
    assert("POST /api/v1/assets/:id/transition transitions status", transData.status === "UNDER_MAINTENANCE");

    // 12. Inspections
    const newInspCode = `TEST-INSP-${Date.now().toString().slice(-4)}`;
    const newInspRes = await fetch(`${BASE_URL}/api/v1/inspections`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        inspection_code: newInspCode,
        asset_id: assetId,
        condition: "FAIR",
        risk_level: "LOW",
        observations: "Foundation load bearing capacity verified. Minor surface cracks noted.",
      }),
    });
    const newInsp = await newInspRes.json();
    assert("POST /api/v1/inspections creates inspection", newInsp.inspection_code === newInspCode);

    // Verify asset condition was auto-updated
    const updatedAssetRes = await fetch(`${BASE_URL}/api/v1/assets/${assetId}`, { headers: authHeaders });
    const updatedAsset = await updatedAssetRes.json();
    assert("Inspection automatically updated asset condition to FAIR", updatedAsset.condition === "FAIR");

    // 13. Maintenance Work Order
    const newTicketRes = await fetch(`${BASE_URL}/api/v1/operations/maintenance`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        asset_id: assetId,
        priority: "MEDIUM",
        maintenance_type: "PREVENTATIVE",
        issue_description: "Pre-monsoon drainage line desiltation and clearance",
      }),
    });
    const newTicket = await newTicketRes.json();
    assert("POST /api/v1/operations/maintenance raises ticket", newTicket.status === "OPEN");

    // Complete ticket
    const closedTicketRes = await fetch(`${BASE_URL}/api/v1/operations/maintenance/${newTicket.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        status: "RESOLVED",
        resolution_notes: "Drainage lines completely cleared. Water flow test passed.",
        action_taken: "Jet vacuum cleaning",
        total_cost: 25000,
      }),
    });
    const closedTicket = await closedTicketRes.json();
    assert("PATCH /api/v1/operations/maintenance resolves ticket", closedTicket.status === "RESOLVED");

    // 14. Public Complaints
    const newComplaintRes = await fetch(`${BASE_URL}/api/v1/complaints`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Street light flickering near junction",
        description: "Frequent intermittent power cuts on streetlight line 4",
        district: "Vadodara",
        priority: "LOW",
      }),
    });
    const newComplaint = await newComplaintRes.json();
    assert("POST /api/v1/complaints logs citizen grievance", newComplaint.status === "REPORTED");

    // 15. Audits & Audit Logs
    const auditLogsRes = await fetch(`${BASE_URL}/api/v1/audits/logs`, { headers: authHeaders });
    const auditLogsData = await auditLogsRes.json();
    assert("GET /api/v1/audits/logs returns audit records", auditLogsData.length > 0);

    // 16. CSV Reports
    const csvRes = await fetch(`${BASE_URL}/api/v1/reports/export/assets`, { headers: authHeaders });
    const csvContentType = csvRes.headers.get("content-type") || "";
    const csvData = await csvRes.text();
    assert("GET /api/v1/reports/export/assets returns CSV stream", csvContentType.includes("csv"));
    assert("CSV contains header columns", csvData.includes("asset_tag,name,district"));

    console.log("==================================================");
    console.log(`Regression Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution failed:", err.message);
    process.exit(1);
  }
}

runRegressionTests();
