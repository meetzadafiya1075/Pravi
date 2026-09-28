"use client";

import { useEffect, useState } from "react";
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [maintenanceType, setMaintenanceType] = useState("CORRECTIVE");
  const [description, setDescription] = useState("");
  const [techId, setTechId] = useState("");

  // Resolve Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [repairCost, setRepairCost] = useState("150.00");
  const [downtimeHours, setDowntimeHours] = useState("4.0");

  const [modalLoading, setModalLoading] = useState(false);
  const { hasPermission } = useAuth();

  const fetchTickets = async () => {
    try {
      const [tRes, aRes, uRes] = await Promise.all([
        apiClient.get("/api/v1/operations/maintenance"),
        apiClient.get("/api/v1/assets"),
        apiClient.get("/api/v1/users"),
      ]);
      setTickets(tRes.data);
      setAssets(aRes.data);
      if (aRes.data.length > 0) setAssetId(aRes.data[0].id);

      const techs = uRes.data.filter((u: any) => u.role_code === "TECHNICIAN" || u.role_code === "ASSET_MANAGER");
      setTechnicians(techs);
      if (techs.length > 0) setTechId(techs[0].id);
    } catch (err) {
      console.error("Failed to fetch maintenance tickets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await apiClient.post("/api/v1/operations/maintenance", {
        asset_id: assetId,
        priority,
        maintenance_type: maintenanceType,
        issue_description: description,
        assigned_technician_id: techId || null,
      });
      setShowCreateModal(false);
      setDescription("");
      await fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create maintenance ticket");
    } finally {
      setModalLoading(false);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      await apiClient.patch(`/api/v1/operations/maintenance/${selectedTicket.id}`, {
        status: "RESOLVED",
        resolution_notes: resolutionNotes,
        total_cost: parseFloat(repairCost),
        downtime_hours: parseFloat(downtimeHours),
      });
      setShowResolveModal(false);
      await fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to resolve ticket");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Header title="Public Works Maintenance & Work Orders" />
      <div className="page-body">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>Infrastructure Maintenance Orders</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Work order dispatches, contractor repairs, and defect remediation certification.
            </p>
          </div>

          {hasPermission("maintenance:create") && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={15} />
              <span>Raise Work Order</span>
            </button>
          )}
        </div>

        {/* Tickets Table */}
        <div className="glass-panel" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Asset ID</th>
                  <th>Priority</th>
                  <th>Type</th>
                  <th>Issue Description</th>
                  <th>Status</th>
                  <th>Total Cost</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Loading work orders...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No active maintenance tickets recorded.
                    </td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#B45309" }}>
                        {t.ticket_number}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                        {t.asset_id.slice(0, 8)}...
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: t.priority === "CRITICAL" || t.priority === "HIGH" ? "rgba(244,63,94,0.15)" : "rgba(251,146,60,0.15)",
                            color: t.priority === "CRITICAL" || t.priority === "HIGH" ? "#FB7185" : "#FB923C",
                          }}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>{t.maintenance_type}</td>
                      <td style={{ maxWidth: "280px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.85rem" }}>
                        {t.issue_description}
                      </td>
                      <td>
                        <span className={`badge badge-${t.status === "RESOLVED" ? "IN_USE" : t.status === "OPEN" ? "UNDER_MAINTENANCE" : "ASSIGNED"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>${parseFloat(t.total_cost || 0).toFixed(2)}</td>
                      <td style={{ textAlign: "right" }}>
                        {t.status !== "RESOLVED" && t.status !== "CLOSED" && hasPermission("maintenance:update") ? (
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 12px", fontSize: "0.78rem" }}
                            onClick={() => {
                              setSelectedTicket(t);
                              setShowResolveModal(true);
                            }}
                          >
                            <CheckCircle size={14} />
                            <span>Resolve</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)" }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Raise Ticket */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Dispatch Maintenance Ticket</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Log a break-fix incident or scheduled servicing. Target asset status will move to <strong>UNDER_MAINTENANCE</strong>.
              </p>

              <form onSubmit={handleCreateTicket}>
                <div className="form-group">
                  <label className="form-label">Asset Requiring Maintenance</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)} required>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} - {a.name} ({a.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Priority Level</label>
                    <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Maintenance Classification</label>
                    <select className="form-select" value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)}>
                      <option value="CORRECTIVE">Corrective Repair</option>
                      <option value="PREVENTATIVE">Preventative Service</option>
                      <option value="CALIBRATION">Calibration</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Technician</label>
                  <select className="form-select" value={techId} onChange={(e) => setTechId(e.target.value)}>
                    <option value="">Unassigned (Queue)</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Defect / Incident Description</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe failure symptoms, error codes, physical damage..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Dispatching..." : "Dispatch Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Resolve Ticket */}
        {showResolveModal && selectedTicket && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Certify & Resolve Ticket #{selectedTicket.ticket_number}</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Record technician labor and parts costs. Target asset will automatically return to <strong>IN_STOCK</strong>.
              </p>

              <form onSubmit={handleResolveTicket}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Total Repair / Parts Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={repairCost}
                      onChange={(e) => setRepairCost(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Downtime Duration (Hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={downtimeHours}
                      onChange={(e) => setDowntimeHours(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Technician Resolution Notes & Parts Replaced</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Details of repair action taken, components replaced, diagnostic tests executed..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResolveModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Saving..." : "Sign-off & Mark Resolved"}
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
