"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, AlertTriangle, XCircle, Search, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";

function extractAssetIdentifier(input: string): { tag?: string; id?: string; raw: string } {
  if (!input) return { raw: "" };
  const trimmed = input.trim();

  // 1. Try parsing JSON
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        tag: parsed.tag || parsed.asset_tag,
        id: parsed.id || parsed.asset_id || parsed._id,
        raw: trimmed,
      };
    } catch (e) {
      // not full valid json, fallback to regex
    }
  }

  // Fallback regex for partial or unescaped JSON
  if (trimmed.includes('"id"') || trimmed.includes('"tag"')) {
    const tagMatch = trimmed.match(/"(?:tag|asset_tag)"\s*:\s*"([^"]+)"/);
    const idMatch = trimmed.match(/"(?:id|asset_id|_id)"\s*:\s*"([^"]+)"/);
    if (tagMatch || idMatch) {
      return {
        tag: tagMatch ? tagMatch[1] : undefined,
        id: idMatch ? idMatch[1] : undefined,
        raw: trimmed,
      };
    }
  }

  // 2. Try parsing URL query parameter ?tag=...
  if (trimmed.includes("tag=")) {
    const match = trimmed.match(/[?&]tag=([^&]+)/);
    if (match && match[1]) {
      return { tag: decodeURIComponent(match[1]), raw: trimmed };
    }
  }

  // 3. Try parsing URL path e.g. /assets/UUID or /assets/TAG
  if (trimmed.includes("/assets/")) {
    const parts = trimmed.split("/assets/")[1]?.split(/[?#/]/)[0];
    if (parts && parts !== "scan") {
      return { id: parts, tag: parts, raw: trimmed };
    }
  }

  // 4. Fallback: treat as raw identifier
  return { tag: trimmed, id: trimmed, raw: trimmed };
}

export default function ScanPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = searchParams.get("audit_id");
  const initialTag = searchParams.get("tag");

  const [scannedTag, setScannedTag] = useState(initialTag || "");
  const [assetData, setAssetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<any>(null);

  const lookupAsset = async (rawInput: string) => {
    if (!rawInput || !rawInput.trim()) return;
    setLoading(true);
    setScanStatus(null);

    const { tag, id, raw } = extractAssetIdentifier(rawInput);
    const displayIdentifier = tag || id || raw;
    setScannedTag(displayIdentifier);

    try {
      let foundAsset: any = null;

      // 1. If we have an ID (UUID or asset_tag lookup on /api/v1/assets/:id)
      if (id) {
        try {
          const directRes = await apiClient.get(`/api/v1/assets/${encodeURIComponent(id)}`);
          if (directRes.data && (directRes.data.id || directRes.data._id || directRes.data.asset_tag)) {
            foundAsset = directRes.data;
          }
        } catch (e) {
          // Fallback to query
        }
      }

      // 2. Query registry by tag or display identifier if not found yet
      if (!foundAsset) {
        const queryTerm = tag || id || displayIdentifier;
        const res = await apiClient.get("/api/v1/assets", { params: { q: queryTerm } });
        const list = Array.isArray(res.data) ? res.data : [];

        foundAsset = list.find((a: any) =>
          (tag && a.asset_tag?.toUpperCase() === tag.toUpperCase()) ||
          (id && (a.id === id || a._id === id)) ||
          a.asset_tag?.toUpperCase() === queryTerm.toUpperCase() ||
          a.id === queryTerm ||
          a._id === queryTerm
        ) || (list.length === 1 ? list[0] : null);
      }

      if (foundAsset) {
        setAssetData(foundAsset);
        setScannedTag(foundAsset.asset_tag || displayIdentifier);
      } else {
        setAssetData(null);
        setScanStatus(`Asset tag '${displayIdentifier}' not found in inventory registry`);
      }
    } catch (err) {
      setScanStatus("Failed to query asset registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTag) {
      lookupAsset(initialTag);
    }
  }, [initialTag]);

  const startCamera = async () => {
    setCameraError("");
    setCameraActive(true);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          lookupAsset(decodedText);
          html5QrCode.stop().then(() => setCameraActive(false));
        },
        () => {}
      );
    } catch (err: any) {
      setCameraError("Camera access unavailable or permission denied. Please enter tag manually below.");
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
    }
    setCameraActive(false);
  };

  const handleAuditVerification = async (verificationStatus: string) => {
    if (!auditId || !assetData) return;
    try {
      await apiClient.post(`/api/v1/audits/${auditId}/scan`, {
        asset_tag: assetData.asset_tag,
        verification_status: verificationStatus,
        remarks: `Scanned on ${new Date().toLocaleTimeString()}`,
      });
      setScanStatus(`Audit item logged as ${verificationStatus}!`);
    } catch (err: any) {
      alert("Failed to submit audit verification");
    }
  };

  return (
    <>
      <Header title="Mobile Asset QR Scanner" />
      <div className="page-body">

        <div style={{ marginBottom: "20px" }}>
          <Link href="/assets" className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
            <ArrowLeft size={16} />
            <span>Back</span>
          </Link>
        </div>

        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          
          {/* Scanner Card */}
          <div className="glass-panel" style={{ padding: "32px", textAlign: "center", marginBottom: "24px" }}>
            <h2 style={{ marginBottom: "6px" }}>Camera Barcode & QR Scanner</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
              Align the physical asset QR tag within the viewfinder frame to verify hardware.
            </p>

            {/* Video Viewport Container */}
            <div
              id="qr-reader"
              style={{
                width: "100%",
                maxWidth: "360px",
                height: cameraActive ? "300px" : "180px",
                margin: "0 auto 20px",
                background: "rgba(0,0,0,0.5)",
                border: "2px dashed var(--border-subtle)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {!cameraActive && (
                <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "20px" }}>
                  <Camera size={36} color="var(--primary)" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "0.85rem" }}>Camera Viewfinder Inactive</div>
                </div>
              )}
            </div>

            {cameraError && (
              <div style={{ padding: "10px", background: "rgba(244,63,94,0.12)", color: "#FB7185", borderRadius: "8px", fontSize: "0.82rem", marginBottom: "16px" }}>
                {cameraError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "24px" }}>
              {!cameraActive ? (
                <button className="btn btn-primary" onClick={startCamera}>
                  <Camera size={16} />
                  <span>Start Camera Viewfinder</span>
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={stopCamera}>
                  Stop Camera
                </button>
              )}
            </div>

            {/* Manual Tag Lookup Fallback */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "12px" }}>
                Or manually enter Asset Tag:
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupAsset(scannedTag);
                }}
                style={{ display: "flex", gap: "8px", maxWidth: "420px", margin: "0 auto" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, fontFamily: "var(--font-mono)", textAlign: "center" }}
                  placeholder="e.g. INFRA-AMD-RD-001 or scan payload"
                  value={scannedTag}
                  onChange={(e) => setScannedTag(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary">
                  <Search size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Scanned Result Card */}
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>Scanning registry...</div>
          ) : assetData ? (
            <div className="glass-panel" style={{ padding: "28px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent-cyan)", fontSize: "1.1rem" }}>
                    {assetData.asset_tag}
                  </span>
                  <h3 style={{ fontSize: "1.3rem", marginTop: "4px" }}>{assetData.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                    Serial: {assetData.serial_number}
                  </div>
                </div>
                <span className={`badge badge-${assetData.status}`}>
                  {assetData.status.replace("_", " ")}
                </span>
              </div>

              {scanStatus && (
                <div style={{ padding: "10px", background: "rgba(52,211,153,0.15)", color: "#34D399", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px", textAlign: "center" }}>
                  {scanStatus}
                </div>
              )}

              {/* Audit Verification Actions (If in Audit mode) */}
              {auditId ? (
                <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dim)", marginBottom: "12px", textTransform: "uppercase" }}>
                    Log Audit Campaign Verification
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <button className="btn btn-primary" onClick={() => handleAuditVerification("VERIFIED_OK")}>
                      <CheckCircle2 size={16} />
                      <span>Verified OK</span>
                    </button>
                    <button className="btn btn-secondary" style={{ color: "var(--accent-amber)" }} onClick={() => handleAuditVerification("DAMAGED")}>
                      <AlertTriangle size={16} />
                      <span>Damaged</span>
                    </button>
                    <button className="btn btn-danger" onClick={() => handleAuditVerification("MISSING")}>
                      <XCircle size={16} />
                      <span>Missing</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                  <Link href={`/assets/${assetData.id}`} className="btn btn-primary">
                    <Eye size={16} />
                    <span>View Full Asset Record</span>
                  </Link>
                </div>
              )}
            </div>
          ) : scanStatus ? (
            <div className="glass-panel" style={{ padding: "20px", textAlign: "center", color: "var(--accent-rose)" }}>
              {scanStatus}
            </div>
          ) : null}

        </div>

      </div>
    </>
  );
}
