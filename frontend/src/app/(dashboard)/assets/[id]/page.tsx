"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  FileText,
  Clock,
  UserCheck,
  RotateCcw,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Upload,
  Printer,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function AssetDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasPermission, user } = useAuth();

  const [asset, setAsset] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [assignCondition, setAssignCondition] = useState("Operational, Good Condition");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnCondition, setReturnCondition] = useState("Returned in Good Condition");

  const [showQrModal, setShowQrModal] = useState(false);

  const fetchAssetData = async () => {
    try {
      const [assetRes, histRes, qrRes] = await Promise.all([
        apiClient.get(`/api/v1/assets/${id}`),
        apiClient.get(`/api/v1/assets/${id}/history`),
        apiClient.get(`/api/v1/assets/${id}/qr`),
      ]);
      setAsset(assetRes.data);
      setHistory(histRes.data);
      setQrDataUrl(qrRes.data.qr_data_url);

      if (hasPermission("asset:assign")) {
        const uRes = await apiClient.get("/api/v1/users");
        setUsersList(uRes.data);
        if (uRes.data.length > 0) setAssigneeId(uRes.data[0].id);
      }
    } catch (err: any) {
      setError("Failed to load asset details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAssetData();
  }, [id]);

  const handleTransition = async (toStatus: string, reason: string) => {
    setActionLoading(true);
    setError("");
    try {
      await apiClient.post(`/api/v1/assets/${id}/transition`, {
        to_status: toStatus,
        reason,
      });
      await fetchAssetData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Transition failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await apiClient.post(`/api/v1/assets/${id}/assign`, {
        assigned_to_user_id: assigneeId,
        condition_on_assignment: assignCondition,
      });
      setShowAssignModal(false);
      await fetchAssetData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Assignment failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    try {
      await apiClient.post(`/api/v1/assets/${id}/return`, {
        condition_on_return: returnCondition,
      });
      setShowReturnModal(false);
      await fetchAssetData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Return failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Asset Record" />
        <div className="page-body">
          <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>Loading record...</div>
        </div>
      </>
    );
  }

  if (!asset) {
    return (
      <>
        <Header title="Asset Not Found" />
        <div className="page-body">
          <div style={{ textAlign: "center", padding: "60px", color: "var(--accent-rose)" }}>Asset not found.</div>
        </div>
      </>
    );
  }

  const formatCurrency = (val: number | string) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <>
      <Header title={`Asset: ${asset.name}`} />
      <div className="page-body">

        {/* Back Link */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Link href="/assets" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} />
            <span>Back to Inventory</span>
          </Link>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn btn-secondary" onClick={() => setShowQrModal(true)}>
              <QrCode size={16} color="var(--accent-cyan)" />
              <span>QR Label</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185", borderRadius: "8px", marginBottom: "20px", fontSize: "0.88rem" }}>
            {error}
          </div>
        )}

        {/* Hero Card */}
        <div className="glass-panel" style={{ padding: "28px 32px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>
                {asset.asset_tag}
              </span>
              <span className={`badge badge-${asset.status}`}>
                {asset.status.replace("_", " ")}
              </span>
            </div>
            <h1 style={{ fontSize: "1.7rem", marginBottom: "6px" }}>{asset.name}</h1>
            <div style={{ fontSize: "0.88rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
              Serial Number: <strong style={{ color: "var(--text-muted)" }}>{asset.serial_number}</strong>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", textTransform: "uppercase", fontWeight: 600 }}>Amortized Book Value</div>
            <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--accent-emerald)", letterSpacing: "-0.02em" }}>
              {formatCurrency(asset.current_book_value)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
              Original Cost: {formatCurrency(asset.purchase_cost)}
            </div>
          </div>
        </div>

        {/* State Machine Transition Actions Bar */}
        <div className="glass-panel" style={{ padding: "20px 24px", marginBottom: "28px", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "12px" }}>
            Lifecycle State Machine Transitions
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {asset.status === "PLANNED" && hasPermission("asset:update") && (
              <button className="btn btn-primary" onClick={() => handleTransition("ORDERED", "Purchase order issued")}>
                Mark as ORDERED
              </button>
            )}

            {asset.status === "ORDERED" && hasPermission("asset:update") && (
              <button className="btn btn-primary" onClick={() => handleTransition("RECEIVED", "Physical package received at warehouse")}>
                Mark as RECEIVED
              </button>
            )}

            {asset.status === "RECEIVED" && hasPermission("asset:update") && (
              <button className="btn btn-primary" onClick={() => handleTransition("IN_STOCK", "Inspected, tagged and stored into available inventory")}>
                Inspect & Move to IN_STOCK
              </button>
            )}

            {asset.status === "IN_STOCK" && hasPermission("asset:assign") && (
              <button className="btn btn-primary" onClick={() => setShowAssignModal(true)}>
                <UserCheck size={16} />
                <span>Assign to Employee</span>
              </button>
            )}

            {asset.status === "ASSIGNED" && (
              <button className="btn btn-primary" onClick={() => handleTransition("IN_USE", "Custody accepted and confirmed by personnel")}>
                <CheckCircle size={16} />
                <span>Accept Custody (Mark IN_USE)</span>
              </button>
            )}

            {(asset.status === "IN_USE" || asset.status === "ASSIGNED") && hasPermission("asset:assign") && (
              <button className="btn btn-secondary" onClick={() => setShowReturnModal(true)}>
                <RotateCcw size={16} />
                <span>Return to Stock</span>
              </button>
            )}

            {(asset.status === "IN_USE" || asset.status === "IN_STOCK") && hasPermission("maintenance:create") && (
              <button className="btn btn-secondary" onClick={() => handleTransition("UNDER_MAINTENANCE", "Hardware incident dispatch")}>
                <Wrench size={16} color="var(--accent-amber)" />
                <span>Dispatch Maintenance</span>
              </button>
            )}

            {asset.status === "UNDER_MAINTENANCE" && hasPermission("maintenance:update") && (
              <button className="btn btn-primary" onClick={() => handleTransition("IN_STOCK", "Maintenance repair completed and certified")}>
                <CheckCircle size={16} />
                <span>Complete Maintenance (Return to Stock)</span>
              </button>
            )}

            {(asset.status === "IN_STOCK" || asset.status === "IN_USE") && hasPermission("asset:retire") && (
              <button className="btn btn-secondary" onClick={() => handleTransition("RETIRED", "End of operational lifecycle reached")}>
                Decommission & Retire
              </button>
            )}

            {asset.status === "RETIRED" && hasPermission("asset:dispose") && (
              <button className="btn btn-danger" onClick={() => handleTransition("DISPOSED", "Scrapped and recycled via vendor")}>
                Scrap & Dispose
              </button>
            )}

            {asset.status === "DISPOSED" && (
              <div style={{ color: "var(--accent-rose)", fontSize: "0.85rem", fontWeight: 600 }}>
                This asset is in the terminal DISPOSED state. Record is immutable.
              </div>
            )}
          </div>
        </div>

        {/* Details & History Split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          
          {/* Metadata Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px" }}>Asset Specification & Location</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.88rem" }}>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Asset Category</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{asset.category_id}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Assigned Department</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{asset.department_id || "Unassigned"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Location Site</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{asset.location_id || "Main Warehouse"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Useful Life</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{asset.useful_life_months} Months</div>
              </div>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Purchase Date</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>{asset.purchase_date || "N/A"}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem" }}>Optimistic Lock Version</div>
                <div style={{ fontWeight: 600, marginTop: "2px" }}>v{asset.version}</div>
              </div>
            </div>

            {/* Custom Attributes JSONB Display */}
            {asset.custom_attributes && Object.keys(asset.custom_attributes).length > 0 && (
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ color: "var(--text-dim)", fontSize: "0.78rem", marginBottom: "8px" }}>Extended Specifications</div>
                <pre style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", fontSize: "0.8rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                  {JSON.stringify(asset.custom_attributes, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Lifecycle Status History Timeline */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="var(--primary)" />
              <span>Audit State Transition Timeline</span>
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {history.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No state changes recorded.</div>
              ) : (
                history.map((hist, idx) => (
                  <div key={hist.id} style={{ display: "flex", gap: "14px", position: "relative" }}>
                    <div style={{ width: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: idx === 0 ? "var(--primary)" : "var(--border-subtle)", boxShadow: idx === 0 ? "0 0 8px var(--primary)" : "none" }} />
                      {idx < history.length - 1 && (
                        <div style={{ width: "2px", flex: 1, background: "var(--border-subtle)", marginTop: "4px" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dim)" }}>{hist.from_status}</span>
                        <ChevronRight size={14} color="var(--text-dim)" />
                        <span className={`badge badge-${hist.to_status}`} style={{ fontSize: "0.68rem" }}>{hist.to_status}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{hist.reason || "Transition recorded"}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "4px" }}>
                        {new Date(hist.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Modal: Assign Custody */}
        {showAssignModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Assign Asset Custody</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Select personnel to assign this hardware asset to. Asset status will update to <strong>ASSIGNED</strong>.
              </p>

              <form onSubmit={handleAssignSubmit}>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="form-select" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.first_name} {u.last_name} ({u.email}) - {u.role_code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Condition on Handoff</label>
                  <input
                    type="text"
                    className="form-input"
                    value={assignCondition}
                    onChange={(e) => setAssignCondition(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    Confirm Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Return Asset */}
        {showReturnModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Return Asset to Inventory</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Confirm return inspection. Active custody assignment will be closed and status set to <strong>IN_STOCK</strong>.
              </p>

              <form onSubmit={handleReturnSubmit}>
                <div className="form-group">
                  <label className="form-label">Condition on Return</label>
                  <input
                    type="text"
                    className="form-input"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    Confirm Return
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: QR Code Label */}
        {showQrModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: "420px", textAlign: "center" }}>
              <h3 style={{ marginBottom: "4px" }}>Asset Identification QR Label</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "20px" }}>
                Scan to verify or inspect physical asset
              </p>

              <div style={{ background: "#fff", padding: "20px", borderRadius: "12px", display: "inline-block", marginBottom: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                {qrDataUrl && <img src={qrDataUrl} alt="Asset QR Code" style={{ width: "200px", height: "200px" }} />}
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "1.1rem", color: "var(--accent-cyan)", marginBottom: "4px" }}>
                {asset.asset_tag}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "24px" }}>
                {asset.name}
              </div>

              <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQrModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={16} />
                  <span>Print Label</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
