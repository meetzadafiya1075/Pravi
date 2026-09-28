"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Wrench,
  Search,
  Building,
  User,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Complaint {
  id: string;
  complaint_id: string;
  asset_id?: string;
  title: string;
  description: string;
  location?: string;
  district?: string;
  priority: string;
  reported_by_name: string;
  reported_by_phone?: string;
  department_id?: string;
  status: string;
  resolution?: string;
  createdAt: string;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetId, setAssetId] = useState("");
  const [location, setLocation] = useState("");
  const [district, setDistrict] = useState("Ahmedabad");
  const [priority, setPriority] = useState("MEDIUM");
  const [reportedByName, setReportedByName] = useState("Citizen Helpline");
  const [reportedByPhone, setReportedByPhone] = useState("+91-");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchComplaints = async () => {
    try {
      const [compRes, assetRes, deptRes] = await Promise.all([
        apiClient.get("/api/v1/complaints"),
        apiClient.get("/api/v1/assets"),
        apiClient.get("/api/v1/organizations/departments"),
      ]);
      setComplaints(compRes.data);
      setAssets(assetRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error("Failed to load complaints", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiClient.post("/api/v1/complaints", {
        title,
        description,
        asset_id: assetId || null,
        location,
        district,
        priority,
        reported_by_name: reportedByName,
        reported_by_phone: reportedByPhone,
      });
      setShowModal(false);
      setTitle("");
      setDescription("");
      setLocation("");
      await fetchComplaints();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit public issue complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string, triggerMaint = false) => {
    try {
      await apiClient.patch(`/api/v1/complaints/${id}`, {
        status: newStatus,
        trigger_maintenance: triggerMaint,
      });
      await fetchComplaints();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (districtFilter !== "ALL" && c.district?.toUpperCase() !== districtFilter.toUpperCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.complaint_id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getPriorityStyle = (p: string) => {
    switch (p?.toUpperCase()) {
      case "CRITICAL": return { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" };
      case "HIGH": return { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" };
      case "MEDIUM": return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
      default: return { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" };
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case "RESOLVED":
      case "CLOSED":
        return { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" };
      case "INSPECTION":
      case "MAINTENANCE":
        return { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" };
      default:
        return { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" };
    }
  };

  return (
    <>
      <Header title="Public Grievances & Citizen Issue Reporting" />
      <div className="page-body">
        
        {/* Title Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "3px" }}>Public Infrastructure Grievances</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Citizen complaints, field officer incident logs, and public infrastructure hazard reporting.
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={15} />
            <span>Report Public Issue</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: "14px 16px", marginBottom: "18px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
            <input
              type="text"
              className="form-input"
              style={{ width: "100%", paddingLeft: "34px" }}
              placeholder="Search by title, grievance ID, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={15} color="#A8A29E" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#78716C" }}>STATUS:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "140px" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="INSPECTION">Inspection</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#78716C" }}>DISTRICT:</label>
            <select
              className="form-select"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={{ width: "140px" }}
            >
              <option value="ALL">All Districts</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Surat">Surat</option>
              <option value="Vadodara">Vadodara</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Gandhinagar">Gandhinagar</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="glass-panel" style={{ overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#78716C" }}>Loading public grievances...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#78716C" }}>No grievances matching filter criteria.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grievance ID</th>
                  <th>Title & Description</th>
                  <th>District / Location</th>
                  <th>Priority</th>
                  <th>Reported By</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sBadge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.80rem" }}>
                        {c.complaint_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#1C1917" }}>{c.title}</div>
                        <div style={{ fontSize: "0.76rem", color: "#78716C", maxWidth: "340px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem", fontWeight: 600 }}>
                          <MapPin size={13} color="#B45309" />
                          <span>{c.district || "State Jurisdiction"}</span>
                        </div>
                        {c.location && <div style={{ fontSize: "0.72rem", color: "#78716C" }}>{c.location}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", ...getPriorityStyle(c.priority) }}>
                          {c.priority}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.80rem", fontWeight: 600 }}>{c.reported_by_name}</div>
                        {c.reported_by_phone && <div style={{ fontSize: "0.72rem", color: "#78716C" }}>{c.reported_by_phone}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.70rem", fontWeight: 700, padding: "3px 8px", borderRadius: "4px", background: sBadge.bg, color: sBadge.text, border: `1px solid ${sBadge.border}` }}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {c.status === "REPORTED" && (
                            <button
                              onClick={() => handleStatusUpdate(c.id, "ASSIGNED")}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                            >
                              Assign
                            </button>
                          )}
                          {c.status === "ASSIGNED" && (
                            <button
                              onClick={() => handleStatusUpdate(c.id, "MAINTENANCE", true)}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.72rem", color: "#B45309" }}
                            >
                              Dispatch Maint.
                            </button>
                          )}
                          {["ASSIGNED", "INSPECTION", "MAINTENANCE"].includes(c.status) && (
                            <button
                              onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                              className="btn btn-primary"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                            >
                              Resolve
                            </button>
                          )}
                          {c.status === "RESOLVED" && (
                            <button
                              onClick={() => handleStatusUpdate(c.id, "CLOSED")}
                              className="btn btn-secondary"
                              style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for Creating Public Grievance */}
        {showModal && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: "560px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Report Public Infrastructure Grievance</h3>
                <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                  <X size={18} color="#78716C" />
                </button>
              </div>

              {error && (
                <div style={{ padding: "8px 12px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", borderRadius: "6px", fontSize: "0.82rem", marginBottom: "12px" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Issue Summary / Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Traffic signal blacked out at main crossway"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description *</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide specific details regarding the hazard, malfunction, or breakdown..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">District *</label>
                    <select className="form-select" value={district} onChange={(e) => setDistrict(e.target.value)}>
                      <option value="Ahmedabad">Ahmedabad</option>
                      <option value="Surat">Surat</option>
                      <option value="Vadodara">Vadodara</option>
                      <option value="Rajkot">Rajkot</option>
                      <option value="Gandhinagar">Gandhinagar</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location / Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Near Sarkhej Crossroad, West Zone Ward 12"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Associate with Registered Asset (Optional)</label>
                  <select className="form-select" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
                    <option value="">-- General Infrastructure Issue --</option>
                    {assets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.asset_tag} - {a.name} ({a.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Reported By</label>
                    <input
                      type="text"
                      className="form-input"
                      value={reportedByName}
                      onChange={(e) => setReportedByName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={reportedByPhone}
                      onChange={(e) => setReportedByPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? "Logging..." : "Submit Grievance"}
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
