"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, AlertTriangle, XCircle, Search, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";

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

  const lookupAssetByTag = async (tag: string) => {
    if (!tag) return;
    setLoading(true);
    setScanStatus(null);
    try {
      const res = await apiClient.get("/api/v1/assets", { params: { q: tag } });
      const match = res.data.find((a: any) => a.asset_tag.toUpperCase() === tag.toUpperCase());
      if (match) {
        setAssetData(match);
      } else {
        setAssetData(null);
        setScanStatus("Asset tag not found in inventory registry");
      }
    } catch (err) {
      setScanStatus("Failed to query asset registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTag) {
      lookupAssetByTag(initialTag);
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
          // Detected QR code payload
          let tag = decodedText;
          if (decodedText.includes("tag=")) {
            const urlParams = new URLSearchParams(decodedText.split("?")[1]);
            tag = urlParams.get("tag") || decodedText;
          }
          setScannedTag(tag);
          lookupAssetByTag(tag);
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
                  lookupAssetByTag(scannedTag);
                }}
                style={{ display: "flex", gap: "8px", maxWidth: "420px", margin: "0 auto" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, fontFamily: "var(--font-mono)", textAlign: "center" }}
                  placeholder="e.g. AST-00102"
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
