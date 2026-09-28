"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  DollarSign,
  Activity,
  Wrench,
  ShieldAlert,
  ArrowUpRight,
  Plus,
  QrCode,
  ArrowLeftRight,
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
  pending_audits: number;
  open_tickets: number;
  status_distribution: Record<string, number>;
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
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <>
      <Header title="Infrastructure Executive Dashboard" />
      <div className="page-body">
        
        {/* Welcome Banner */}
        <div className="glass-panel" style={{ padding: "28px 32px", marginBottom: "28px", background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.06))", borderColor: "rgba(99,102,241,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", marginBottom: "6px" }}>
              Welcome back, {user?.first_name} 👋
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Enterprise asset inventory, real-time custody states, maintenance dispatches, and compliance status.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/assets/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Register Asset</span>
            </Link>
            <Link href="/assets/scan" className="btn btn-secondary">
              <QrCode size={16} color="var(--accent-cyan)" />
              <span>Camera Scan</span>
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase" }}>Total Assets</span>
              <Boxes size={20} color="#818CF8" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {loading ? "..." : metrics?.total_assets || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--accent-emerald)", marginTop: "6px" }}>Active tracked inventory</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase" }}>Portfolio Book Value</span>
              <DollarSign size={20} color="#34D399" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {loading ? "..." : formatCurrency(metrics?.total_valuation || 0)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>Net amortized valuation</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase" }}>In Active Custody</span>
              <Activity size={20} color="#06B6D4" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {loading ? "..." : metrics?.assets_in_use || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", marginTop: "6px" }}>Assigned to personnel</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase" }}>In Repair / Downtime</span>
              <Wrench size={20} color="#FB923C" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {loading ? "..." : metrics?.assets_under_maintenance || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--accent-amber)", marginTop: "6px" }}>{metrics?.open_tickets || 0} open service tickets</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase" }}>Available Stock</span>
              <Boxes size={20} color="#A855F7" />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {loading ? "..." : metrics?.assets_in_stock || 0}
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--accent-purple)", marginTop: "6px" }}>Ready for deployment</div>
          </div>

        </div>

        {/* Quick Operations Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          
          <Link href="/assets" className="glass-panel" style={{ padding: "20px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "transform 0.15s ease" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>Asset Master Catalog</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Inspect lifecycle states, categories, and serial numbers</p>
            </div>
            <ArrowUpRight size={20} color="var(--primary)" />
          </Link>

          <Link href="/transfers" className="glass-panel" style={{ padding: "20px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>Departmental Transfers</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Manage and sign off hardware relocation workflows</p>
            </div>
            <ArrowLeftRight size={20} color="var(--accent-cyan)" />
          </Link>

          <Link href="/audits" className="glass-panel" style={{ padding: "20px", textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "4px" }}>Physical Inventory Audits</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Verify physical equipment with mobile camera scanner</p>
            </div>
            <ShieldAlert size={20} color="var(--accent-emerald)" />
          </Link>

        </div>

        {/* Recent Assets Table */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3>Recently Registered Hardware Assets</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>Real-time inventory register</p>
            </div>
            <Link href="/assets" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
              View All
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset Tag</th>
                  <th>Hardware Name</th>
                  <th>Serial Number</th>
                  <th>Current State</th>
                  <th>Valuation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                      No assets found. Click "Register Asset" to create the first inventory entry.
                    </td>
                  </tr>
                ) : (
                  recentAssets.map((asset) => (
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
                      <td>
                        <Link href={`/assets/${asset.id}`} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                          Inspect
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
