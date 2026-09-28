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
  const [searchQuery, setSearchQuery] = useState("");
  const { hasPermission } = useAuth();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category_id = categoryFilter;
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
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAssets();
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <>
      <Header title="Infrastructure Asset Register" />
      <div className="page-body">

        {/* Action Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Asset Master Register</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Total items tracked: <strong style={{ color: "var(--text-main)" }}>{assets.length}</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            {hasPermission("asset:create") && (
              <Link href="/assets/new" className="btn btn-primary">
                <Plus size={16} />
                <span>Register New Asset</span>
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
          <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            
            {/* Search */}
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <input
                type="text"
                className="form-input"
                style={{ width: "100%", paddingLeft: "36px" }}
                placeholder="Search tag, serial number, hardware name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} color="var(--text-dim)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            </div>

            {/* Status Filter */}
            <div style={{ minWidth: "180px" }}>
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
            <div style={{ minWidth: "180px" }}>
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

            {(statusFilter || categoryFilter || searchQuery) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStatusFilter("");
                  setCategoryFilter("");
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
                  <th>Asset Tag</th>
                  <th>Asset Name</th>
                  <th>Serial Number</th>
                  <th>Lifecycle State</th>
                  <th>Book Value</th>
                  <th>Registered</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Loading assets...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No assets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                        {asset.asset_tag}
                      </td>
                      <td style={{ fontWeight: 600 }}>{asset.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)", fontSize: "0.82rem" }}>
                        {asset.serial_number}
                      </td>
                      <td>
                        <span className={`badge badge-${asset.status}`}>
                          {asset.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(asset.current_book_value)}</td>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                        {new Date(asset.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/assets/${asset.id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                          <Eye size={14} />
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
