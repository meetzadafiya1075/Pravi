"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Shield, ArrowRight, Lock, Mail } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const DEMO_PRESETS = [
  { role: "SUPER_ADMIN", email: "admin@gov.internal", label: "State Authority Admin", desc: "Apex state administration & policy oversight" },
  { role: "DEPARTMENT_ADMIN", email: "pwd.director@gov.internal", label: "PWD Chief Engineer", desc: "Capital tenders, projects & lifecycle signoffs" },
  { role: "DISTRICT_OFFICER", email: "district.officer@gov.internal", label: "District Officer (Ahmedabad)", desc: "Zonal jurisdiction & inter-district transfers" },
  { role: "INSPECTOR", email: "inspector.patel@gov.internal", label: "Infrastructure Inspector", desc: "Structural audits & physical condition grading" },
  { role: "MAINTENANCE_OFFICER", email: "maintenance.eng@gov.internal", label: "Public Works Engineer", desc: "Work order dispatch & repair certification" },
  { role: "CONTRACTOR", email: "contractor.rep@lt-infra.internal", label: "Contractor Rep (L&T)", desc: "Assigned infrastructure schemes & milestone logs" },
  { role: "AUDITOR", email: "auditor.vigilance@gov.internal", label: "Vigilance & State Auditor", desc: "Statutory compliance & immutable audit logs" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("admin@gov.internal");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    setError("");
    setLoading(true);

    try {
      const targetEmail = customEmail || email;
      const targetPassword = customPassword || password;
      const res = await apiClient.post("/api/v1/auth/login", {
        email: targetEmail,
        password: targetPassword,
      });
      login(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials. Please verify your officer credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password123!");
    handleLogin(undefined, presetEmail, "Password123!");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "#FAF8F2" }}>
      <div style={{ width: "100%", maxWidth: "1000px", display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: "24px", alignItems: "stretch" }}>
        
        {/* Left: Login Form */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E6E0D2", borderRadius: "8px", padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
            <div style={{ background: "#B45309", width: "40px", height: "40px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Landmark size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1C1917", letterSpacing: "-0.01em" }}>GovInfra Portal</div>
              <div style={{ fontSize: "0.68rem", color: "#B45309", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Government Infrastructure ALM</div>
            </div>
          </div>

          <h2 style={{ fontSize: "1.25rem", marginBottom: "4px", color: "#1C1917" }}>Officer Portal Sign-In</h2>
          <p style={{ color: "#78716C", fontSize: "0.84rem", marginBottom: "20px" }}>
            Authorized personnel only. Authenticate with official credentials.
          </p>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: "6px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "0.82rem", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(e);
            }}
          >
            <div className="form-group">
              <label className="form-label">Official Email</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={16} color="#A8A29E" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  style={{ width: "100%", paddingLeft: "36px" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={16} color="#A8A29E" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "8px", padding: "10px" }} disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to Authority"}
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Right: Quick Role Selector */}
        <div style={{ background: "#F5F2EB", border: "1px solid #E6E0D2", borderRadius: "8px", padding: "30px 28px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Shield size={18} color="#B45309" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1C1917" }}>1-Click Role Access</h3>
          </div>
          <p style={{ color: "#78716C", fontSize: "0.80rem", marginBottom: "16px" }}>
            Select an administrative role below to evaluate scoped workflows:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1 }}>
            {DEMO_PRESETS.map((p) => (
              <div
                key={p.role}
                onClick={() => handlePresetSelect(p.email)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "#FFFFFF",
                  border: "1px solid #E6E0D2",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FEF3C7";
                  e.currentTarget.style.borderColor = "#FDE68A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#E6E0D2";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.84rem", color: "#1C1917" }}>{p.label}</span>
                  <span style={{ fontSize: "0.68rem", color: "#92400E", fontWeight: 700, background: "#FEF3C7", padding: "2px 6px", borderRadius: "4px", border: "1px solid #FDE68A" }}>
                    {p.role}
                  </span>
                </div>
                <div style={{ fontSize: "0.74rem", color: "#78716C" }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
