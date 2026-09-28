"use client";

import { useEffect, useState } from "react";
import { Users, Shield, Plus, Mail, Building, Key } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState("");

  const { hasPermission } = useAuth();

  const fetchData = async () => {
    try {
      const [uRes, rRes, dRes] = await Promise.all([
        apiClient.get("/api/v1/users"),
        apiClient.get("/api/v1/users/roles"),
        apiClient.get("/api/v1/organizations/departments"),
      ]);
      setUsersList(uRes.data);
      setRoles(rRes.data);
      setDepartments(dRes.data);
      if (rRes.data.length > 0) setRoleId(rRes.data[0].id);
    } catch (err) {
      console.error("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError("");

    try {
      await apiClient.post("/api/v1/users", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role_id: roleId,
        department_id: departmentId || null,
      });
      setShowUserModal(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create user");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Header title="Platform Settings & RBAC Administration" />
      <div className="page-body">

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem" }}>Personnel & Access Control</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Multi-tenant user directory, RBAC role assignments and organizational departments.
            </p>
          </div>

          {hasPermission("user:manage") && (
            <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>
              <Plus size={16} />
              <span>Provision User</span>
            </button>
          )}
        </div>

        {/* Users Table */}
        <div className="glass-panel" style={{ padding: 0, marginBottom: "32px" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={18} color="var(--primary)" />
            <h3>Active Organization Users</h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>RBAC Role</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                      Loading directory...
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--text-muted)" }}>{u.email}</td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "rgba(99,102,241,0.15)",
                            color: "#818CF8",
                            border: "1px solid rgba(99,102,241,0.3)",
                          }}
                        >
                          {u.role_code}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>{u.department_id ? u.department_id.slice(0, 8) : "Global / All"}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: u.is_active ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: 600 }}>
                          {u.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Roles & Permissions Breakdown */}
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={18} color="var(--accent-cyan)" />
            <h3>Configured RBAC Roles</h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {roles.map((r) => (
              <div key={r.id} style={{ padding: "16px", borderRadius: "10px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{r.name}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>{r.code}</span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "12px" }}>
                  Permissions: <strong style={{ color: "var(--text-muted)" }}>{r.permissions?.length || 0} granted</strong>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {r.permissions?.slice(0, 4).map((p: any) => (
                    <span key={p.id} style={{ fontSize: "0.68rem", padding: "2px 6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", color: "var(--text-dim)" }}>
                      {p.code}
                    </span>
                  ))}
                  {r.permissions?.length > 4 && (
                    <span style={{ fontSize: "0.68rem", padding: "2px 6px", color: "var(--primary)" }}>
                      +{r.permissions.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal: New User */}
        {showUserModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 style={{ marginBottom: "8px" }}>Provision Enterprise User</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
                Add new team member and assign organizational role.
              </p>

              {error && (
                <div style={{ padding: "10px", background: "rgba(244,63,94,0.12)", color: "#FB7185", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateUser}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Role Assignment</label>
                    <select className="form-select" value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select className="form-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                      <option value="">Global / Unassigned</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                    {modalLoading ? "Creating..." : "Provision User"}
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
