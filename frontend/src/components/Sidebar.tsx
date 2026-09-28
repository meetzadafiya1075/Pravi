"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  ArrowLeftRight,
  Wrench,
  QrCode,
  ShieldCheck,
  Settings,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Asset Registry", href: "/assets", icon: Boxes, perm: "asset:read" },
    { label: "Transfers", href: "/transfers", icon: ArrowLeftRight, perm: "asset:read" },
    { label: "Maintenance", href: "/maintenance", icon: Wrench, perm: "maintenance:read" },
    { label: "Audits & Scans", href: "/audits", icon: ShieldCheck, perm: "audit:read" },
    { label: "QR Scanner", href: "/assets/scan", icon: QrCode },
    { label: "Settings & Users", href: "/settings", icon: Settings, perm: "user:manage" },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div style={{ background: "linear-gradient(135deg, #6366F1, #06B6D4)", width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
          <Building2 size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>AssetFlow</div>
          <div style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", fontWeight: 600, textTransform: "uppercase" }}>Enterprise ALM</div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        {navItems.map((item) => {
          if (item.perm && !hasPermission(item.perm)) return null;
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                color: isActive ? "#fff" : "var(--text-muted)",
                backgroundColor: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.9rem",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={18} color={isActive ? "#818CF8" : "#94A3B8"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {user && (
        <div style={{ padding: "16px", borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                {user.role_code}
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-dim)",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
