"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Shield, ArrowRight, Lock, Mail } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const DEMO_PRESETS = [
  { role: "ASSET_MANAGER", email: "manager@acme.corp", label: "Asset Manager", desc: "Full procurement, assignment, write-offs & audits" },
  { role: "EMPLOYEE", email: "john.dev@acme.corp", label: "Staff / Employee", desc: "View assigned assets, request equipment & raise tickets" },
  { role: "TECHNICIAN", email: "tech@support.internal", label: "Maintenance Tech", desc: "Diagnose repairs, log parts, labor costs & resolve tickets" },
  { role: "AUDITOR", email: "auditor@compliance.org", label: "Compliance Auditor", desc: "Physical inventory audits, camera scanning & reconciliation" },
  { role: "DEPARTMENT_MANAGER", email: "dept.head@acme.corp", label: "Dept Manager", desc: "Department asset approvals and inter-dept transfers" },
  { role: "SUPER_ADMIN", email: "admin@platform.internal", label: "Super Admin", desc: "System configuration, user provisioning & global access" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("manager@acme.corp");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const targetEmail = customEmail || email;
      const res = await apiClient.post("/api/v1/auth/login", {
        email: targetEmail,
        password: password,
      });
      login(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid login credentials. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password123!");
    handleLogin(undefined, presetEmail);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "radial-gradient(ellipse at top, #111827 0%, #090D16 100%)" }}>
      <div style={{ width: "100%", maxWidth: "980px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "32px", alignItems: "stretch" }}>
        
        {/* Left: Login Form */}
        <div className="glass-panel" style={{ padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <div style={{ background: "linear-gradient(135deg, #6366F1, #06B6D4)", width: "42px", height: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>
              <Building2 size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em" }}>AssetFlow</div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 600 }}>ENTERPRISE PLATFORM</div>
            </div>
          </div>

          <h2 style={{ marginBottom: "8px" }}>Sign In to Portal</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "24px" }}>
            Authenticate with your organizational enterprise credentials.
          </p>

          {error && (
            <div style={{ padding: "12px 14px", borderRadius: "8px", background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.3)", color: "#FB7185", fontSize: "0.85rem", marginBottom: "20px" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "38px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} color="var(--text-dim)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "38px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} color="var(--text-dim)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "12px", padding: "12px" }} disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Right: Demo Quick Logins for Hackathon Evaluators */}
        <div className="glass-panel" style={{ padding: "36px", background: "rgba(17, 24, 39, 0.4)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Shield size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>Evaluator One-Click Logins</h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "20px" }}>
            Select any persona below to test complete multi-role RBAC workflows immediately:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", flex: 1 }}>
            {DEMO_PRESETS.map((p) => (
              <div
                key={p.role}
                onClick={() => handlePresetSelect(p.email)}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)";
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-main)" }}>{p.label}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: 700, background: "rgba(99,102,241,0.15)", padding: "2px 6px", borderRadius: "4px" }}>
                    {p.role}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
