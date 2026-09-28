"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";

export default function NewAssetPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [assetTag, setAssetTag] = useState("");
  const [name, setName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("1200.00");
  const [salvageValue, setSalvageValue] = useState("120.00");
  const [usefulLifeMonths, setUsefulLifeMonths] = useState(36);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Generate auto tag
    setAssetTag(`AST-${Math.floor(100000 + Math.random() * 900000)}`);
    setSerialNumber(`SN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

    const loadLookups = async () => {
      try {
        const [catRes, deptRes, locRes, venRes] = await Promise.all([
          apiClient.get("/api/v1/assets/categories"),
          apiClient.get("/api/v1/organizations/departments"),
          apiClient.get("/api/v1/organizations/locations"),
          apiClient.get("/api/v1/assets/vendors"),
        ]);
        setCategories(catRes.data);
        if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);

        setDepartments(deptRes.data);
        if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);

        setLocations(locRes.data);
        if (locRes.data.length > 0) setLocationId(locRes.data[0].id);

        setVendors(venRes.data);
        if (venRes.data.length > 0) setVendorId(venRes.data[0].id);
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
        purchase_cost: parseFloat(purchaseCost),
        salvage_value: parseFloat(salvageValue),
        useful_life_months: usefulLifeMonths,
        purchase_date: new Date().toISOString().split("T")[0],
      };

      const res = await apiClient.post("/api/v1/assets", payload);
      router.push(`/assets/${res.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create asset. Verify fields.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Register Hardware Asset" />
      <div className="page-body">
        
        <div style={{ marginBottom: "20px" }}>
          <Link href="/assets" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} />
            <span>Back to Asset Register</span>
          </Link>
        </div>

        <div className="glass-panel" style={{ maxWidth: "800px", padding: "32px" }}>
          <h2 style={{ marginBottom: "6px" }}>New Asset Specification</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
            Register new equipment into the central inventory. Asset will initialize in <strong>PLANNED</strong> state.
          </p>

          {error && (
            <div style={{ padding: "12px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              
              <div className="form-group">
                <label className="form-label">Asset Tag (Identifier)</label>
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
                    onClick={() => setAssetTag(`AST-${Math.floor(100000 + Math.random() * 900000)}`)}
                    title="Generate New Tag"
                  >
                    <Sparkles size={16} color="var(--accent-cyan)" />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Serial Number</label>
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

            <div className="form-group">
              <label className="form-label">Hardware Name / Model</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Apple MacBook Pro 16 M3 Max, Dell Precision 5820"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
                <label className="form-label">Vendor / Supplier</label>
                <select
                  className="form-select"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">None / Direct</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Assigned Department</label>
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
                <label className="form-label">Physical Location</label>
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

            {/* Financial Valuation */}
            <div style={{ marginTop: "12px", marginBottom: "24px", padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, marginBottom: "12px", color: "var(--accent-emerald)" }}>
                Financial Amortization & Depreciation
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Purchase Cost ($)</label>
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
                  <label className="form-label">Salvage Value ($)</label>
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
                  <label className="form-label">Useful Life (Months)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={usefulLifeMonths}
                    onChange={(e) => setUsefulLifeMonths(parseInt(e.target.value) || 36)}
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "12px 24px" }} disabled={loading}>
              <Save size={16} />
              <span>{loading ? "Registering..." : "Create Asset in Register"}</span>
            </button>
          </form>
        </div>

      </div>
    </>
  );
}
