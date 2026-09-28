"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ShieldAlert,
  Clock,
  X,
  Boxes,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Inspection {
  id: string;
  inspection_code: string;
  asset_id: string;
  inspector_id: string;
  inspection_date: string;
  condition: string;
  risk_level: string;
  observations: string;
  recommended_action?: string;
  next_inspection_date?: string;
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { hasPermission } = useAuth();

  // Form fields
  const [assetId, setAssetId] = useState("");
  const [inspectionCode, setInspectionCode] = useState("");
  const [condition, setCondition] = useState("GOOD");
  const [riskLevel, setRiskLevel] = useState("LOW");
  const [observations, setObservations] = useState("");
  const [recommendedAction, setRecommendedAction] = useState("");
  const [nextInspectionDate, setNextInspectionDate] = useState(
    new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );

  const fetchInspections = async () => {
    try {
      const [inspRes, assetRes] = await Promise.all([
        apiClient.get("/api/v1/inspections"),
        apiClient.get("/api/v1/assets"),
      ]);
      setInspections(inspRes.data);
      setAssets(assetRes.data);
      if (assetRes.data.length > 0) setAssetId(assetRes.data[0].id);
    } catch (err) {
      console.error("Failed to load inspections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const openCreateModal = () => {
    setInspectionCode(`INSP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setShowModal(true);
  };

  const handleRecordInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiClient.post("/api/v1/inspections", {
        asset_id: assetId,
        inspection_code: inspectionCode,
        condition,
        risk_level: riskLevel,
        observations,
        recommended_action: recommendedAction || null,
        next_inspection_date: nextInspectionDate || null,
      });
      setShowModal(false);
      setObservations("");
      setRecommendedAction("");
      await fetchInspections();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to record field inspection.");
    } finally {
      setSubmitting(false);
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

  const getRiskBadgeStyle = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case "LOW": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" };
      case "MEDIUM": return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
      case "HIGH": return { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" };
      case "CRITICAL": return { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" };
      default: return { background: "#F5F5F4", color: "#78716C", border: "1px solid #E7E5E4" };
    }
  };

  const getAssetName = (aId: string) => {
    const a = assets.find((item) => item.id === aId);
    return a ? `${a.asset_tag} - ${a.name}` : aId;
  };

  const criticalCount = inspections.filter((i) => i.condition === "CRITICAL" || i.risk_level === "CRITICAL").length;

  return (
    <>
      <Header title="Field Inspections & Condition Grading" />
      <div className="page-body">
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>Infrastructure Field Inspections</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Structural health reports and condition grading logs.
            </p>
          </div>
          {hasPermission("audit:scan_verify") && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={15} />
              <span>Record Inspection</span>
            </button>
          )}
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Total Inspections</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#1C1917" }}>
              {loading ? "..." : inspections.length}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#A8A29E" }}>Certified reports</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px", background: criticalCount ? "#FEF2F2" : "#FFFFFF", borderColor: criticalCount ? "#FECACA" : "#E6E0D2" }}>
            <div style={{ fontSize: "0.72rem", color: "#B91C1C", textTransform: "uppercase", fontWeight: 700 }}>Critical Findings</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#B91C1C" }}>
              {loading ? "..." : criticalCount}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#B91C1C" }}>Urgent remediation</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Good / Fair Assets</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#15803D" }}>
              {loading ? "..." : inspections.filter((i) => i.condition === "GOOD" || i.condition === "FAIR").length}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#15803D" }}>Structurally certified</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Action Required</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#B45309" }}>
              {loading ? "..." : inspections.filter((i) => i.condition === "NEEDS_MAINTENANCE").length}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#A8A29E" }}>Maintenance orders</div>
          </div>
        </div>

        {/* Inspections Table */}
        <div className="glass-panel" style={{ padding: "0" }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Audit Ref</th>
                  <th>Infrastructure Asset</th>
                  <th>Date</th>
                  <th>Condition</th>
                  <th>Risk Rating</th>
                  <th>Observations & Remediation</th>
                  <th>Next Due</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "#78716C" }}>
                      {loading ? "Loading..." : "No field inspections recorded."}
                    </td>
                  </tr>
                ) : (
                  inspections.map((insp) => (
                    <tr key={insp.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#B45309" }}>
                        {insp.inspection_code}
                      </td>
                      <td style={{ fontWeight: 600, color: "#1C1917", maxWidth: "240px" }}>
                        {getAssetName(insp.asset_id)}
                      </td>
                      <td style={{ fontSize: "0.80rem", color: "#57534E" }}>
                        {insp.inspection_date}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", ...getConditionBadgeStyle(insp.condition) }}>
                          {insp.condition}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", ...getRiskBadgeStyle(insp.risk_level) }}>
                          {insp.risk_level}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", color: "#1C1917", maxWidth: "340px" }}>
                          {insp.observations}
                        </div>
                        {insp.recommended_action && (
                          <div style={{ fontSize: "0.75rem", color: "#B45309", marginTop: "2px", fontWeight: 600 }}>
                            Action: {insp.recommended_action}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.80rem", color: "#78716C" }}>
                        {insp.next_inspection_date || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Record Inspection */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <div style={{ background: "#FFFFFF", border: "1px solid #E6E0D2", borderRadius: "8px", width: "100%", maxWidth: "600px", padding: "26px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C1917" }}>Record Field Inspection</h3>
                  <p style={{ color: "#78716C", fontSize: "0.78rem" }}>Condition grading for public asset</p>
                </div>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "#78716C", cursor: "pointer" }}>
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "0.80rem", marginBottom: "14px" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRecordInspection}>
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Asset</label>
                  <select
                    className="form-input"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    required
                  >
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} — {a.name} ({a.district || "State"})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Inspection Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={inspectionCode}
                      onChange={(e) => setInspectionCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Next Scheduled Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={nextInspectionDate}
                      onChange={(e) => setNextInspectionDate(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Condition</label>
                    <select
                      className="form-input"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      required
                    >
                      <option value="GOOD">GOOD — Normal</option>
                      <option value="FAIR">FAIR — Minor wear</option>
                      <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE</option>
                      <option value="POOR">POOR</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Risk Rating</label>
                    <select
                      className="form-input"
                      value={riskLevel}
                      onChange={(e) => setRiskLevel(e.target.value)}
                      required
                    >
                      <option value="LOW">LOW Risk</option>
                      <option value="MEDIUM">MEDIUM Risk</option>
                      <option value="HIGH">HIGH Risk</option>
                      <option value="CRITICAL">CRITICAL Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Observations</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Findings, crack readings, structural stability..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label className="form-label">Recommended Remediation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Schedule repair, seal replacement, grouting..."
                    value={recommendedAction}
                    onChange={(e) => setRecommendedAction(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Certify & Save"}
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
