"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  IndianRupee,
  Activity,
  Wrench,
  AlertTriangle,
  Plus,
  MapPin,
  FolderKanban,
  ClipboardCheck,
  Eye,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Metrics {
  total_assets: number;
  total_valuation: string;
  assets_in_use: number;
  assets_under_maintenance: number;
  assets_in_stock: number;
  critical_assets: number;
  needs_maintenance_assets: number;
  active_projects: number;
  inspections_due: number;
  open_tickets: number;
  status_distribution: Record<string, number>;
  condition_distribution: Record<string, number>;
  department_distribution: Record<string, number>;
  district_distribution: Record<string, number>;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricRes, assetRes] = await Promise.all([
          apiClient.get("/api/v1/dashboard/metrics"),
          apiClient.get("/api/v1/assets"),
        ]);
        setMetrics(metricRes.data);
        setRecentAssets(assetRes.data.slice(0, 6));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (val: string | number) => {
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
      case "GOOD": return "#15803D";
      case "FAIR": return "#0284C7";
      case "NEEDS_MAINTENANCE": return "#B45309";
      case "POOR": return "#EA580C";
      case "CRITICAL": return "#B91C1C";
      default: return "#78716C";
    }
  };

  const getConditionBadgeStyle = (cond: string) => {
    switch (cond?.toUpperCase()) {
      case "GOOD": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" };
      case "FAIR": return { background: "#EFF6FF", color: "#0284C7", border: "1px solid #BFDBFE" };
      case "NEEDS_MAINTENANCE": return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
      case "POOR": return { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" };
      case "CRITICAL": return { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" };
      default: return { background: "#F5F5F4", color: "#78716C", border: "1px solid #E7E5E4" };
    }
  };

  return (
    <>
      <Header title="Infrastructure Authority Dashboard" />
      <div className="page-body">
        
        {/* Welcome Header */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E6E0D2", borderRadius: "8px", padding: "18px 22px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
                STATE INVENTORY
              </span>
              <span style={{ fontSize: "0.82rem", color: "#78716C" }}>Authority Command</span>
            </div>
            <h1 style={{ fontSize: "1.35rem", margin: 0, color: "#1C1917" }}>
              Officer {user?.first_name} {user?.last_name} ({user?.role_code})
            </h1>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/map" className="btn btn-secondary">
              <MapPin size={15} color="#B45309" />
              <span>GIS Map</span>
            </Link>
            <Link href="/projects" className="btn btn-secondary">
              <FolderKanban size={15} color="#B45309" />
              <span>Projects</span>
            </Link>
            <Link href="/assets/new" className="btn btn-primary">
              <Plus size={15} />
              <span>Add Asset</span>
            </Link>
          </div>
        </div>

        {/* Primary KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "22px" }}>
          
          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase" }}>Total Assets</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#1C1917" }}>
              {loading ? "..." : metrics?.total_assets || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#57534E", marginTop: "2px" }}>Registered units</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase" }}>Valuation</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#15803D" }}>
              {loading ? "..." : formatCurrency(metrics?.total_valuation || 0)}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#57534E", marginTop: "2px" }}>Net asset book value</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px", background: metrics?.critical_assets ? "#FEF2F2" : "#FFFFFF", borderColor: metrics?.critical_assets ? "#FECACA" : "#E6E0D2" }}>
            <div style={{ fontSize: "0.72rem", color: "#B91C1C", fontWeight: 700, textTransform: "uppercase" }}>Critical Condition</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#B91C1C" }}>
              {loading ? "..." : metrics?.critical_assets || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#B91C1C", marginTop: "2px" }}>Urgent intervention</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase" }}>Active Projects</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#1C1917" }}>
              {loading ? "..." : metrics?.active_projects || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#57534E", marginTop: "2px" }}>Capital schemes</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase" }}>Under Maintenance</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#B45309" }}>
              {loading ? "..." : metrics?.assets_under_maintenance || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#57534E", marginTop: "2px" }}>{metrics?.open_tickets || 0} work orders</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase" }}>Inspections Due</div>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, marginTop: "4px", color: "#1C1917" }}>
              {loading ? "..." : metrics?.inspections_due || 0}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#57534E", marginTop: "2px" }}>Next 30 days</div>
          </div>

        </div>

        {/* Condition & District Panels */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "18px", marginBottom: "22px" }}>
          
          {/* Condition Breakdown */}
          <div className="glass-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Condition Breakdown</h3>
                <p style={{ color: "#78716C", fontSize: "0.76rem" }}>Physical condition ratings</p>
              </div>
              <Link href="/inspections" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.74rem" }}>
                Inspections
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {metrics && Object.entries(metrics.condition_distribution || {}).map(([cond, count]) => {
                const total = metrics.total_assets || 1;
                const pct = Math.round((count / total) * 100);
                const color = getConditionColor(cond);
                return (
                  <div key={cond}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "3px" }}>
                      <span style={{ fontWeight: 600, color: "#1C1917" }}>{cond.replace("_", " ")}</span>
                      <span style={{ color: "#78716C", fontFamily: "var(--font-mono)" }}>
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#EFECE4", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px" }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* District Breakdown */}
          <div className="glass-panel" style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>District Distribution</h3>
                <p style={{ color: "#78716C", fontSize: "0.76rem" }}>Assets across corporations</p>
              </div>
              <Link href="/map" className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.74rem" }}>
                Open Map
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
              {metrics && Object.entries(metrics.district_distribution || {}).map(([dist, count]) => (
                <div
                  key={dist}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    background: "#FAF8F2",
                    border: "1px solid #E6E0D2",
                  }}
                >
                  <div style={{ fontSize: "0.70rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>{dist}</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px", color: "#1C1917" }}>{count}</div>
                  <div style={{ fontSize: "0.68rem", color: "#A8A29E" }}>assets</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Master Asset Table */}
        <div className="glass-panel" style={{ padding: "0" }}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", background: "#FAF8F2" }}>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Recent Infrastructure Assets</h3>
            </div>
            <Link href="/assets" className="btn btn-secondary" style={{ padding: "5px 10px", fontSize: "0.76rem" }}>
              View All
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Infrastructure Asset</th>
                  <th>District / Ward</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Valuation</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "#78716C" }}>
                      No assets found.
                    </td>
                  </tr>
                ) : (
                  recentAssets.map((asset) => (
                    <tr key={asset.id}>
                      <td style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B45309" }}>
                        {asset.asset_tag}
                      </td>
                      <td style={{ fontWeight: 600, color: "#1C1917" }}>{asset.name}</td>
                      <td style={{ color: "#78716C", fontSize: "0.80rem" }}>
                        {asset.district || "State"} {asset.ward ? `• ${asset.ward}` : ""}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", ...getConditionBadgeStyle(asset.condition) }}>
                          {asset.condition || "GOOD"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${asset.status}`}>
                          {asset.status.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: "#1C1917" }}>{formatCurrency(asset.current_book_value)}</td>
                      <td style={{ textAlign: "right" }}>
                        <Link href={`/assets/${asset.id}`} className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: "0.74rem" }}>
                          <Eye size={12} />
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
