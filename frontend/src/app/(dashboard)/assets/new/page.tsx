"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, MapPin, Landmark } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";

export default function NewAssetPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [tenderId, setTenderId] = useState("");
  const [district, setDistrict] = useState("Ahmedabad");
  const [zone, setZone] = useState("West Zone");
  const [ward, setWard] = useState("Ward 12");
  const [latitude, setLatitude] = useState("23.0305");
  const [longitude, setLongitude] = useState("72.5076");
  const [condition, setCondition] = useState("GOOD");
  const [criticality, setCriticality] = useState("MEDIUM");

  const [purchaseCost, setPurchaseCost] = useState("15000000.00");
  const [salvageValue, setSalvageValue] = useState("750000.00");
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(360);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate auto tag
    setAssetTag(`INF-${Math.floor(100000 + Math.random() * 900000)}`);
    setSerialNumber(`SN-INF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    setTenderId(`TND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

    const loadLookups = async () => {
      try {
        const [catRes, deptRes, locRes, venRes, projRes] = await Promise.all([
          apiClient.get("/api/v1/assets/categories"),
          apiClient.get("/api/v1/organizations/departments"),
          apiClient.get("/api/v1/organizations/locations"),
          apiClient.get("/api/v1/assets/vendors"),
          apiClient.get("/api/v1/projects"),
        ]);
        setCategories(catRes.data);
        if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);

        setDepartments(deptRes.data);
        if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);

        setLocations(locRes.data);
        if (locRes.data.length > 0) setLocationId(locRes.data[0].id);

        setVendors(venRes.data);
        if (venRes.data.length > 0) setVendorId(venRes.data[0].id);

        setProjects(projRes.data);
      } catch (err) {
        console.error("Failed to load form lookups", err);
      }
    };
    loadLookups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        asset_tag: assetTag,
        name,
        serial_number: serialNumber,
        category_id: categoryId,
        department_id: departmentId || null,
        location_id: locationId || null,
        vendor_id: vendorId || null,
        project_id: projectId || null,
        tender_id: tenderId || null,
        district: district || null,
        zone: zone || null,
        ward: ward || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        condition: condition.toUpperCase(),
        criticality: criticality.toUpperCase(),
        purchase_cost: parseFloat(purchaseCost),
        salvage_value: parseFloat(salvageValue),
        useful_life_months: usefulLifeMonths,
        purchase_date: new Date().toISOString().split("T")[0],
      };

      const res = await apiClient.post("/api/v1/assets", payload);
      router.push(`/assets/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to register infrastructure asset. Verify fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Register Government Infrastructure Asset" />
      <div className="page-body">
        
        <div style={{ marginBottom: "20px" }}>
          <Link href="/assets" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} />
            <span>Back to Asset Register</span>
          </Link>
        </div>

        <div className="glass-panel" style={{ maxWidth: "880px", padding: "32px" }}>
          <h2 style={{ marginBottom: "6px" }}>Public Infrastructure Specification</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
            Register new public infrastructure into the centralized state inventory. Asset initializes in <strong>PLANNED</strong> state.
          </p>

          {error && (
            <div style={{ padding: "12px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "18px" }}>
              
              <div className="form-group">
                <label className="form-label">Asset Tag / Government Code</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, fontFamily: "var(--font-mono)" }}
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAssetTag(`INF-${Math.floor(100000 + Math.random() * 900000)}`)}
                    title="Generate New Tag"
                  >
                    <Sparkles size={16} color="var(--accent-cyan)" />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serial / Unique Infrastructure Number</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: "var(--font-mono)" }}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>

            </div>

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <label className="form-label">Infrastructure Asset Name / Facility Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sardar Patel Elevated Ring Road Overbridge (6-Lane Flyover)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "18px" }}>
              <div className="form-group">
                <label className="form-label">Asset Category</label>
                <select
                  className="form-select"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Contractor / EPC Agency</label>
                <select
                  className="form-select"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">None / Departmental Execution</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Association & Tender */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "18px" }}>
              <div className="form-group">
                <label className="form-label">Associated Scheme / Project</label>
                <select
                  className="form-select"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Independent Asset (No Project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_code} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tender / Work Order Reference</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TND-PWD-2025-881"
                  value={tenderId}
                  onChange={(e) => setTenderId(e.target.value)}
                />
              </div>
            </div>

            {/* Department and Administrative Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "18px" }}>
              <div className="form-group">
                <label className="form-label">Responsible Department</label>
                <select
                  className="form-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Facility / Administrative Location</label>
                <select
                  className="form-select"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.site_code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Geographic & GIS Section */}
            <div style={{ marginTop: "10px", marginBottom: "20px", padding: "16px", background: "#FEF9EE", borderRadius: "6px", border: "1px solid #FDE68A" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 700, marginBottom: "12px", color: "#92400E" }}>
                <MapPin size={16} />
                <span>Geographic Jurisdiction & GPS Coordinates</span>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "12px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">District / Corporation</label>
                  <select
                    className="form-select"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Gandhinagar">Gandhinagar</option>
                    <option value="Surat">Surat</option>
                    <option value="Rajkot">Rajkot</option>
                    <option value="Vadodara">Vadodara</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Administrative Zone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. West Zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Municipal Ward</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ward 12"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">GPS Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">GPS Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    className="form-input"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Condition & Criticality */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div className="form-group">
                <label className="form-label">Initial Physical Condition</label>
                <select
                  className="form-select"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="GOOD">GOOD — Normal operational integrity</option>
                  <option value="FAIR">FAIR — Minor superficial wear</option>
                  <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE</option>
                  <option value="POOR">POOR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Asset Criticality Tier</label>
                <select
                  className="form-select"
                  value={criticality}
                  onChange={(e) => setCriticality(e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL — Essential public lifeline</option>
                </select>
              </div>
            </div>

            {/* Financial Valuation */}
            <div style={{ marginBottom: "24px", padding: "16px", background: "#FAF8F2", borderRadius: "6px", border: "1px solid #E6E0D2" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "12px", color: "#1C1917" }}>
                Capital Outlay & Depreciation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Procurement Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Salvage Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={salvageValue}
                    onChange={(e) => setSalvageValue(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Design Life (Months)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={usefulLifeMonths}
                    onChange={(e) => setUsefulLifeMonths(parseInt(e.target.value) || 360)}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }} disabled={loading}>
              <Save size={16} />
              <span>{loading ? "Registering..." : "Create Infrastructure Asset"}</span>
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
