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
  Landmark,
  FolderKanban,
  MapPin,
  ClipboardCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Asset Registry", href: "/assets", icon: Boxes, perm: "asset:read" },
    { label: "Projects & Schemes", href: "/projects", icon: FolderKanban, perm: "asset:read" },
    { label: "Field Inspections", href: "/inspections", icon: ClipboardCheck, perm: "audit:read" },
    { label: "GIS Map View", href: "/map", icon: MapPin, perm: "asset:read" },
    { label: "Maintenance Orders", href: "/maintenance", icon: Wrench, perm: "maintenance:read" },
    { label: "Public Grievances", href: "/complaints", icon: AlertCircle, perm: "asset:read" },
    { label: "Inter-District Transfers", href: "/transfers", icon: ArrowLeftRight, perm: "asset:read" },
    { label: "Statutory Audits", href: "/audits", icon: ShieldCheck, perm: "audit:read" },
    { label: "QR Scanner", href: "/assets/scan", icon: QrCode },
    { label: "Authority Settings", href: "/settings", icon: Settings, perm: "user:manage" },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: "18px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--border-subtle)", background: "#FAF8F2" }}>
        <div style={{ background: "#B45309", width: "36px", height: "36px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }}>
          <Landmark size={20} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#1C1917", letterSpacing: "-0.01em" }}>GovInfra ALM</div>
          <div style={{ fontSize: "0.68rem", color: "#78716C", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>Public Infrastructure</div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
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
                gap: "10px",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                color: isActive ? "#92400E" : "#44403C",
                backgroundColor: isActive ? "#FEF3C7" : "transparent",
                border: isActive ? "1px solid #FDE68A" : "1px solid transparent",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.85rem",
                textDecoration: "none",
                transition: "all 0.12s ease",
              }}
            >
              <Icon size={17} color={isActive ? "#B45309" : "#78716C"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      {user && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border-subtle)", background: "#EFECE4" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1C1917", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.first_name} {user.last_name}
              </div>
              <div style={{ fontSize: "0.70rem", color: "#B45309", fontWeight: 700 }}>
                {user.role_code}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: "transparent",
                border: "none",
                color: "#78716C",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "4px",
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
