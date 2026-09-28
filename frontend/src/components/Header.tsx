"use client";

import Link from "next/link";
import { QrCode, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Header({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>{title}</h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Link href="/assets/scan" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.82rem" }}>
          <QrCode size={15} color="#06B6D4" />
          <span>Quick Scan</span>
        </Link>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "4px 10px",
                borderRadius: "20px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818CF8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                fontWeight: 600,
              }}
            >
              {user.role_code}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
