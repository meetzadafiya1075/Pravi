"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Plus, Check, X, Clock } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transfer Modal
  const [showModal, setShowModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [targetDeptId, setTargetDeptId] = useState("");
  const [targetLocId, setTargetLocId] = useState("");
  const [notes, setNotes] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");

  const { hasPermission } = useAuth();

  const fetchTransfers = async () => {
    try {
      const [tRes, aRes, dRes, lRes] = await Promise.all([
        apiClient.get("/api/v1/operations/transfers"),
        apiClient.get("/api/v1/assets"),
        apiClient.get("/api/v1/organizations/departments"),
        apiClient.get("/api/v1/organizations/locations"),
      ]);
      setTransfers(tRes.data);
      setAssets(aRes.data);
      setDepartments(dRes.data);
      setLocations(lRes.data);

      if (aRes.data.length > 0) setAssetId(aRes.data[0].id);
      if (dRes.data.length > 0) setTargetDeptId(dRes.data[0].id);
      if (lRes.data.length > 0) setTargetLocId(lRes.data[0].id);
    } catch (err) {
      console.error("Transfers fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    try {
      await apiClient.post("/api/v1/operations/transfers", {
        asset_id: assetId,
        target_department_id: targetDeptId,
        target_location_id: targetLocId,
        notes,
      });
      setShowModal(false);
      setNotes("");
      await fetchTransfers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to initiate transfer.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleApprove = async (transferId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await apiClient.post(`/api/v1/operations/transfers/${transferId}/approve`, {
        status,
        notes: `Transfer ${status.toLowerCase()} by department head`,
      });
      await fetchTransfers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update transfer");
    }
  };

  return (
    <>
      <Header title="Inter-District Infrastructure Transfers" />
      <div className="page-body">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>Infrastructure Transfer & Relocation</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Inter-district and departmental custody transfers with jurisdictional sign-off.
            </p>
          </div>

          {hasPermission("asset:transfer_request") && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} />
              <span>Initiate Transfer</span>
            </button>
          )}
        </div>

        {/* Transfers Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Source Dept</th>
                  <th>Destination Dept</th>
                  <th>Target Location</th>
                  <th>Status</th>
                  <th>Initiated</th>
                  <th style={{ textAlign: "right" }}>Authorization</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Loading transfers...
                    </td>
                  </tr>
                ) : transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No infrastructure transfers recorded. Click "Initiate Transfer" to relocate assets.
                    </td>
                  </tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#B45309" }}>
                        {t.asset_id.slice(0, 8)}...
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.source_department_id.slice(0, 8)}...</td>
                      <td style={{ fontWeight: 600 }}>{t.target_department_id.slice(0, 8)}...</td>
                      <td style={{ color: "var(--text-muted)" }}>{t.target_location_id.slice(0, 8)}...</td>
                      <td>
                        <span className={`badge badge-${t.status === "COMPLETED" ? "IN_USE" : t.status === "PENDING" ? "TRANSFERRED" : "DISPOSED"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.82rem" }}>
                        {new Date(t.initiated_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {t.status === "PENDING" && hasPermission("asset:transfer_approve") ? (
                          <div style={{ display: "inline-flex", gap: "8px" }}>
                            <button className="btn btn-primary" style={{ padding: "6px 10px", fontSize: "0.78rem" }} onClick={() => handleApprove(t.id, "APPROVED")}>
                              <Check size={14} />
                              <span>Accept</span>
                            </button>
                            <button className="btn btn-danger" style={{ padding: "6px 10px", fontSize: "0.78rem" }} onClick={() => handleApprove(t.id, "REJECTED")}>
                              <X size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
                            {t.status === "COMPLETED" ? "Approved" : t.status === "REJECTED" ? "Rejected" : "Pending Approval"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Transfer */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Initiate Hardware Transfer</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Relocate an existing asset to another department. Receiving department head will be requested to approve custody.
              </p>

              {error && (
                <div style={{ padding: "12px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185", borderRadius: "8px", marginBottom: "16px", fontSize: "0.85rem" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTransfer}>
                <div className="form-group">
                  <label className="form-label">Asset to Relocate</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} - {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Receiving Department</label>
                  <select className="form-select" value={targetDeptId} onChange={(e) => setTargetDeptId(e.target.value)} required>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination Location / Room</label>
                  <select className="form-select" value={targetLocId} onChange={(e) => setTargetLocId(e.target.value)} required>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.site_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transfer Justification Notes</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Project reallocation, office move, or team reassignment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Submitting..." : "Submit Transfer Request"}
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
