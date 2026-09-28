"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ExternalLink,
  Search,
} from "lucide-react";
import { Header } from "@/components/Header";
import { apiClient } from "@/lib/api-client";

interface Asset {
  id: string;
  asset_tag: string;
  name: string;
  district?: string;
  zone?: string;
  ward?: string;
  latitude?: number;
  longitude?: number;
  condition: string;
  criticality: string;
  status: string;
  current_book_value: number;
}

export default function GISMapPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedCondition, setSelectedCondition] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await apiClient.get("/api/v1/assets");
        const items = res.data.map((a: any) => ({
          ...a,
          latitude: a.latitude || 23.0225,
          longitude: a.longitude || 72.5714,
        }));
        setAssets(items);
        if (items.length > 0) setSelectedAsset(items[0]);
      } catch (err) {
        console.error("Failed to load map assets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const getConditionBadgeStyle = (cond: string) => {
    switch (cond?.toUpperCase()) {
      case "GOOD": return { background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0" };
      case "FAIR": return { background: "#EFF6FF", color: "#0284C7", border: "1px solid #BFDBFE" };
      case "NEEDS_MAINTENANCE": return { background: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A" };
      case "POOR": return { background: "#FFF7ED", color: "#C2410C", border: "1px solid #FED7AA" };
      case "CRITICAL": return { background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" };
      default: return { background: "#F5F5F4", color: "#78716C", border: "1px solid #E7E5E4" };
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (selectedDistrict !== "ALL" && a.district?.toUpperCase() !== selectedDistrict.toUpperCase()) return false;
    if (selectedCondition !== "ALL" && a.condition?.toUpperCase() !== selectedCondition.toUpperCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.asset_tag.toLowerCase().includes(q) || (a.district && a.district.toLowerCase().includes(q));
    }
    return true;
  });

  const activeLat = selectedAsset?.latitude || 23.0305;
  const activeLng = selectedAsset?.longitude || 72.5076;
  const delta = 0.035;
  const bbox = `${activeLng - delta}%2C${activeLat - delta}%2C${activeLng + delta}%2C${activeLat + delta}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${activeLat}%2C${activeLng}`;

  return (
    <>
      <Header title="GIS Geolocation Map" />
      <div className="page-body">
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", marginBottom: "2px" }}>Geospatial Infrastructure Map</h1>
            <p style={{ color: "#78716C", fontSize: "0.82rem" }}>
              Coordinate mapping for bridges, water treatment plants, power grids, and civil facilities.
            </p>
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", color: "#57534E", background: "#FFFFFF", padding: "5px 10px", borderRadius: "6px", border: "1px solid #E6E0D2" }}>
              📍 <strong>{filteredAssets.length}</strong> Locations Mapped
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: "12px 16px", marginBottom: "18px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search asset ID, title, or ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", paddingLeft: "32px" }}
            />
            <Search size={14} color="#A8A29E" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "#78716C", fontWeight: 600 }}>DISTRICT:</span>
            <select
              className="form-input"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "0.80rem" }}
            >
              <option value="ALL">All Districts</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Gandhinagar">Gandhinagar</option>
              <option value="Surat">Surat</option>
              <option value="Rajkot">Rajkot</option>
              <option value="Vadodara">Vadodara</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "#78716C", fontWeight: 600 }}>CONDITION:</span>
            <select
              className="form-input"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "0.80rem" }}
            >
              <option value="ALL">All Conditions</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="NEEDS_MAINTENANCE">NEEDS MAINTENANCE</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        {/* Map Layout: Left Sidebar + Right Map */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "18px", height: "calc(100vh - 270px)", minHeight: "500px" }}>
          
          {/* Left: Asset List */}
          <div className="glass-panel" style={{ padding: "14px", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#78716C", textTransform: "uppercase", marginBottom: "10px", paddingBottom: "6px", borderBottom: "1px solid #E6E0D2" }}>
              Infrastructure Nodes ({filteredAssets.length})
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAssets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 8px", color: "#78716C", fontSize: "0.80rem" }}>
                  No assets match filter.
                </div>
              ) : (
                filteredAssets.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "6px",
                        background: isSelected ? "#FEF3C7" : "#FFFFFF",
                        border: isSelected ? "1px solid #FDE68A" : "1px solid #E6E0D2",
                        cursor: "pointer",
                        transition: "all 0.12s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem", fontWeight: 700, color: "#B45309" }}>
                          {asset.asset_tag}
                        </span>
                        <span style={{ fontSize: "0.66rem", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", ...getConditionBadgeStyle(asset.condition) }}>
                          {asset.condition || "GOOD"}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "#1C1917", marginBottom: "3px", lineHeight: "1.3" }}>
                        {asset.name}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#78716C" }}>
                        <span>📍 {asset.district || "State"} {asset.ward ? `• ${asset.ward}` : ""}</span>
                        <span style={{ fontFamily: "var(--font-mono)" }}>
                          {asset.latitude?.toFixed(2)}, {asset.longitude?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Natural Daylight OpenStreetMap Display */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", position: "relative" }}>
            
            <div style={{ flex: 1, width: "100%", height: "100%", background: "#FFFFFF", position: "relative" }}>
              <iframe
                title="Infrastructure Geolocation Map"
                src={osmUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              />
            </div>

            {/* Selected Asset Overlay Banner */}
            {selectedAsset && (
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  right: "16px",
                  background: "#FFFFFF",
                  padding: "14px 18px",
                  borderRadius: "8px",
                  border: "1px solid #E6E0D2",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "0.84rem", color: "#B45309" }}>
                      {selectedAsset.asset_tag}
                    </span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", ...getConditionBadgeStyle(selectedAsset.condition) }}>
                      {selectedAsset.condition || "GOOD"}
                    </span>
                    <span className={`badge badge-${selectedAsset.status}`} style={{ fontSize: "0.68rem" }}>
                      {selectedAsset.status.replace("_", " ")}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "#1C1917" }}>
                    {selectedAsset.name}
                  </h3>
                  <div style={{ fontSize: "0.76rem", color: "#78716C", marginTop: "2px" }}>
                    District: <strong>{selectedAsset.district || "State"}</strong> | Ward: <strong>{selectedAsset.ward || "Central"}</strong> | GPS: <span style={{ fontFamily: "var(--font-mono)" }}>{selectedAsset.latitude}, {selectedAsset.longitude}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <Link href={`/assets/${selectedAsset.id}`} className="btn btn-primary" style={{ padding: "6px 12px", fontSize: "0.78rem" }}>
                    <span>Inspect</span>
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </>
  );
}
