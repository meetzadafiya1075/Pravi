"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Plus, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Audit Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [auditCode, setAuditCode] = useState("");
  const [targetLocationId, setTargetLocationId] = useState("");
  const [targetDeptId, setTargetDeptId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const { hasPermission } = useAuth();

  const fetchAudits = async () => {
    try {
      const [audRes, locRes, deptRes] = await Promise.all([
        apiClient.get("/api/v1/audits"),
        apiClient.get("/api/v1/organizations/locations"),
        apiClient.get("/api/v1/organizations/departments"),
      ]);
      setAudits(audRes.data);
      setLocations(locRes.data);
      setDepartments(deptRes.data);
      setAuditCode(`AUD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    } catch (err) {
      console.error("Failed to fetch audits", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await apiClient.post("/api/v1/audits", {
        title,
        audit_code: auditCode,
        target_location_id: targetLocationId || null,
        target_department_id: targetDeptId || null,
        start_date: new Date().toISOString().split("T")[0],
      });
      setShowModal(false);
      setTitle("");
      await fetchAudits();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create audit campaign");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Header title="Physical Inventory Audits & Compliance" />
      <div className="page-body">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Physical Inventory Verification</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Periodic floor checks, barcode scan verification, and discrepancy reconciliation.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href="/assets/scan" className="btn btn-secondary">
              <QrCode size={16} color="var(--accent-cyan)" />
              <span>Camera Barcode Scanner</span>
            </Link>
            {hasPermission("audit:create") && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} />
                <span>Launch Audit Campaign</span>
              </button>
            )}
          </div>
        </div>

        {/* Audits Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
          {loading ? (
            <div style={{ color: "var(--text-muted)", padding: "30px" }}>Loading audit campaigns...</div>
          ) : audits.length === 0 ? (
            <div className="glass-panel" style={{ padding: "40px", textAlign: "center", gridColumn: "1 / -1" }}>
              <ShieldCheck size={36} color="var(--text-dim)" style={{ margin: "0 auto 12px" }} />
              <h3>No Active Audit Campaigns</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>
                Click "Launch Audit Campaign" to start physical inventory scanning across rooms and sites.
              </p>
            </div>
          ) : (
            audits.map((a) => {
              const totalItems = a.items?.length || 0;
              const verifiedItems = a.items?.filter((i: any) => i.verification_status === "VERIFIED_OK").length || 0;
              const progressPct = totalItems > 0 ? Math.round((verifiedItems / totalItems) * 100) : 0;

              return (
                <div key={a.id} className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                        {a.audit_code}
                      </span>
                      <h3 style={{ fontSize: "1.15rem", marginTop: "4px" }}>{a.title}</h3>
                    </div>
                    <span className={`badge badge-${a.status === "IN_PROGRESS" ? "ORDERED" : "IN_USE"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "16px" }}>
                    Started: {new Date(a.start_date).toLocaleDateString()}
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "6px" }}>
                      <span>Reconciliation Progress</span>
                      <span>{verifiedItems} / {totalItems} Scanned ({progressPct}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#EFECE4", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${progressPct}%`, height: "100%", background: "#B45309", borderRadius: "4px", transition: "width 0.3s ease" }} />
                    </div>
                  </div>

                  {/* Checklist Items Preview */}
                  <div style={{ flex: 1, maxHeight: "180px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                    {a.items?.slice(0, 5).map((item: any) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "0.8rem" }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>
                          Asset ID: {item.asset_id.slice(0, 8)}...
                        </span>
                        <span style={{ fontSize: "0.72rem", color: item.verification_status === "VERIFIED_OK" ? "var(--accent-emerald)" : "var(--accent-amber)", fontWeight: 700 }}>
                          {item.verification_status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link href={`/assets/scan?audit_id=${a.id}`} className="btn btn-primary" style={{ width: "100%" }}>
                    <QrCode size={16} />
                    <span>Open Camera QR Scanner</span>
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Modal: New Audit */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Launch Physical Audit Campaign</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Define target location or department. System will automatically generate verification checklist items for all assigned hardware.
              </p>

              <form onSubmit={handleCreateAudit}>
                <div className="form-group">
                  <label className="form-label">Audit Campaign Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Q3 Server Room Physical Audit, Annual Hardware Check"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Code</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                    value={auditCode}
                    onChange={(e) => setAuditCode(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Target Location</label>
                    <select className="form-select" value={targetLocationId} onChange={(e) => setTargetLocationId(e.target.value)}>
                      <option value="">All Locations</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Department</label>
                    <select className="form-select" value={targetDeptId} onChange={(e) => setTargetDeptId(e.target.value)}>
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Creating..." : "Launch Campaign"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
