"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Header({ title }: { title: string }) {
  const { user } = useAuth();

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1C1917" }}>{title}</h2>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/assets/scan" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.80rem" }}>
          <QrCode size={14} color="#B45309" />
          <span>Quick Scan</span>
        </Link>

        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "3px 10px",
                borderRadius: "4px",
                background: "#FEF3C7",
                color: "#92400E",
                border: "1px solid #FDE68A",
                fontWeight: 700,
                letterSpacing: "0.03em",
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
