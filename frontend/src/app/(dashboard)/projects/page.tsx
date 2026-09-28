"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  Plus,
  IndianRupee,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface Project {
  id: string;
  project_code: string;
  name: string;
  description: string;
  department_id: string;
  contractor_id?: string;
  funding_source: string;
  funding_scheme: string;
  budget_allocated: string | number;
  actual_expenditure: string | number;
  start_date: string;
  expected_completion: string;
  status: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { hasPermission } = useAuth();

  // Form fields
  const [projectCode, setProjectCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [fundingSource, setFundingSource] = useState("State Infrastructure Development Fund");
  const [fundingScheme, setFundingScheme] = useState("Smart Cities Mission");
  const [budgetAllocated, setBudgetAllocated] = useState("250000000");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedCompletion, setExpectedCompletion] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0]
  );

  const fetchProjects = async () => {
    try {
      const [projRes, deptRes] = await Promise.all([
        apiClient.get("/api/v1/projects"),
        apiClient.get("/api/v1/organizations/departments"),
      ]);
      setProjects(projRes.data);
      setDepartments(deptRes.data);
      if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);
    } catch (err) {
      console.error("Failed to load projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreateModal = () => {
    setProjectCode(`PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setShowModal(true);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiClient.post("/api/v1/projects", {
        project_code: projectCode,
        name,
        description,
        department_id: departmentId,
        funding_source: fundingSource,
        funding_scheme: fundingScheme,
        budget_allocated: parseFloat(budgetAllocated),
        start_date: startDate,
        expected_completion: expectedCompletion,
      });
      setShowModal(false);
      setName("");
      setDescription("");
      await fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create project scheme.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num || 0);
  };

  const totalBudget = projects.reduce((acc, p) => acc + (parseFloat(p.budget_allocated as string) || 0), 0);
  const totalExpenditure = projects.reduce((acc, p) => acc + (parseFloat(p.actual_expenditure as string) || 0), 0);

  return (
    <>
      <Header title="Infrastructure Projects & Schemes" />
      <div className="page-body">
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>Capital Infrastructure Schemes</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Capital tenders, scheme allocations, and milestone outlays.
            </p>
          </div>
          {hasPermission("asset:create") && (
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus size={15} />
              <span>New Scheme</span>
            </button>
          )}
        </div>

        {/* Project KPI summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "22px" }}>
          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Total Schemes</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#1C1917" }}>
              {loading ? "..." : projects.length}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#A8A29E" }}>Registered projects</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Total Budget</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#15803D" }}>
              {loading ? "..." : formatCurrency(totalBudget)}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#15803D" }}>Approved capital outlay</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Disbursed Expenditure</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#B45309" }}>
              {loading ? "..." : formatCurrency(totalExpenditure)}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#A8A29E" }}>Audited disbursement</div>
          </div>

          <div className="glass-panel" style={{ padding: "16px" }}>
            <div style={{ fontSize: "0.72rem", color: "#78716C", textTransform: "uppercase", fontWeight: 600 }}>Active Projects</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "2px", color: "#1C1917" }}>
              {loading ? "..." : projects.filter((p) => p.status === "ACTIVE").length}
            </div>
            <div style={{ fontSize: "0.70rem", color: "#A8A29E" }}>Under active execution</div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="glass-panel" style={{ padding: "0" }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Scheme Code</th>
                  <th>Project Name</th>
                  <th>Funding Scheme</th>
                  <th>Allocated Budget</th>
                  <th>Expenditure</th>
                  <th>Timeline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "#78716C" }}>
                      {loading ? "Loading..." : "No projects found."}
                    </td>
                  </tr>
                ) : (
                  projects.map((proj) => (
                    <tr key={proj.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#B45309" }}>
                        {proj.project_code}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1C1917" }}>{proj.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#78716C", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {proj.description}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1C1917" }}>{proj.funding_scheme}</div>
                        <div style={{ fontSize: "0.72rem", color: "#78716C" }}>{proj.funding_source}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#15803D" }}>
                        {formatCurrency(proj.budget_allocated)}
                      </td>
                      <td style={{ color: "#57534E", fontSize: "0.82rem" }}>
                        {formatCurrency(proj.actual_expenditure || 0)}
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "#57534E" }}>
                        <div>{proj.start_date} to {proj.expected_completion}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.70rem",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: proj.status === "ACTIVE" ? "#F0FDF4" : "#F5F5F4",
                            color: proj.status === "ACTIVE" ? "#15803D" : "#57534E",
                            border: `1px solid ${proj.status === "ACTIVE" ? "#BBF7D0" : "#E7E5E4"}`,
                          }}
                        >
                          {proj.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Initiate Project */}
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
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C1917" }}>New Infrastructure Scheme</h3>
                  <p style={{ color: "#78716C", fontSize: "0.78rem" }}>Create capital project allocation</p>
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

              <form onSubmit={handleCreateProject}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Project Code</label>
                    <input
                      type="text"
                      className="form-input"
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-input"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      required
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ring Road Overbridge & Drainage Construction"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Civil works scope, design parameters..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-group">
                    <label className="form-label">Funding Scheme</label>
                    <input
                      type="text"
                      className="form-input"
                      value={fundingScheme}
                      onChange={(e) => setFundingScheme(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Funding Source</label>
                    <input
                      type="text"
                      className="form-input"
                      value={fundingSource}
                      onChange={(e) => setFundingSource(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                  <div className="form-group">
                    <label className="form-label">Budget (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={budgetAllocated}
                      onChange={(e) => setBudgetAllocated(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target End</label>
                    <input
                      type="date"
                      className="form-input"
                      value={expectedCompletion}
                      onChange={(e) => setExpectedCompletion(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : "Create Scheme"}
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
