"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  QrCode,
  Eye,
  SlidersHorizontal,
  MapPin,
  ClipboardCheck,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { hasPermission } = useAuth();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category_id = categoryFilter;
      if (districtFilter) params.district = districtFilter;
      if (conditionFilter) params.condition = conditionFilter;
      if (searchQuery) params.q = searchQuery;

      const [assetRes, catRes] = await Promise.all([
        apiClient.get("/api/v1/assets", { params }),
        apiClient.get("/api/v1/assets/categories"),
      ]);
      setAssets(assetRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [statusFilter, categoryFilter, districtFilter, conditionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets();
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num || 0);
  };

  const getConditionColor = (cond: string) => {
    switch (cond?.toUpperCase()) {
      case "GOOD": return "#10B981";
      case "FAIR": return "#38BDF8";
      case "NEEDS_MAINTENANCE": return "#F59E0B";
      case "POOR": return "#FB923C";
      case "CRITICAL": return "#EF4444";
      default: return "#94A3B8";
    }
  };

  return (
    <>
      <Header title="National Infrastructure Asset Register" />
      <div className="page-body">

        {/* Action Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>State Public Infrastructure Inventory</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Total infrastructure units tracked: <strong style={{ color: "var(--text-main)" }}>{assets.length}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/map" className="btn btn-secondary">
              <MapPin size={16} color="#38BDF8" />
              <span>GIS Map View</span>
            </Link>
            {hasPermission("asset:create") && (
              <Link href="/assets/new" className="btn btn-primary">
                <Plus size={16} />
                <span>Register Infrastructure</span>
              </Link>
            )}
            <Link href="/assets/scan" className="btn btn-secondary">
              <QrCode size={16} color="var(--accent-cyan)" />
              <span>Camera Scan</span>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: "18px 24px", marginBottom: "24px" }}>
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
            
            {/* Search */}
            <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%", paddingLeft: "36px" }}
                placeholder="Search tag, serial number, infrastructure title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} color="var(--text-dim)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            {/* District Filter */}
            <div style={{ minWidth: "150px" }}>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
              >
                <option value="">All Districts</option>
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Gandhinagar">Gandhinagar</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Vadodara">Vadodara</option>
              </select>
            </div>

            {/* Condition Filter */}
            <div style={{ minWidth: "160px" }}>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
              >
                <option value="">All Conditions</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="NEEDS_MAINTENANCE">Needs Maintenance</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: "160px" }}>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Lifecycle States</option>
                <option value="PLANNED">Planned</option>
                <option value="ORDERED">Ordered</option>
                <option value="RECEIVED">Received</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_USE">In Use</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="TRANSFERRED">Transferred</option>
                <option value="RETIRED">Retired</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ minWidth: "160px" }}>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-secondary">
              Filter
            </button>

            {(statusFilter || categoryFilter || districtFilter || conditionFilter || searchQuery) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
                  setDistrictFilter("");
                  setConditionFilter("");
                  setSearchQuery("");
                }}
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Data Table */}
        <div className="glass-panel" style={{ padding: "0" }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Infrastructure Asset</th>
                  <th>District / Ward</th>
                  <th>Physical Condition</th>
                  <th>Lifecycle State</th>
                  <th>Book Value</th>
                  <th>Commissioned</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Loading government assets...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No infrastructure assets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B45309" }}>
                        {asset.asset_tag}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1C1917" }}>{asset.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#78716C", fontFamily: "var(--font-mono)" }}>
                          {asset.serial_number}
                        </div>
                      </td>
                      <td style={{ color: "#78716C", fontSize: "0.82rem" }}>
                        {asset.district || "State"} {asset.ward ? `• ${asset.ward}` : ""}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.70rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: asset.condition === "CRITICAL" ? "#FEF2F2" : asset.condition === "NEEDS_MAINTENANCE" ? "#FFFBEB" : "#F0FDF4",
                            color: asset.condition === "CRITICAL" ? "#B91C1C" : asset.condition === "NEEDS_MAINTENANCE" ? "#B45309" : "#15803D",
                            border: `1px solid ${asset.condition === "CRITICAL" ? "#FECACA" : asset.condition === "NEEDS_MAINTENANCE" ? "#FDE68A" : "#BBF7D0"}`,
                          }}
                        >
                          {asset.condition || "GOOD"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${asset.status}`}>
                          {asset.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#1C1917" }}>{formatCurrency(asset.current_book_value)}</td>
                      <td style={{ color: "#78716C", fontSize: "0.80rem" }}>
                        {asset.purchase_date || new Date(asset.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/assets/${asset.id}`} className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: "0.76rem" }}>
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
