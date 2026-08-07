import React, { useEffect, useState } from "react";
import { 
  Building, 
  MapPin, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  ShieldCheck,
  RefreshCw,
  Upload,
  Database,
  CheckCircle,
  XCircle,
  Send,
  Camera,
  Search,
  ExternalLink
} from "lucide-react";
import { FarmPlot } from "../lib/plots";
import { sendWhatsAppMessage } from "../lib/api";

export interface AggregateRiskData {
  village_name: string;
  district: string;
  state: string;
  total_monitored_plots: number;
  advisory_status_count: number;
  claim_status_count: number;
  normal_status_count: number;
  total_claims_filed: number;
  district_risk_percentage: number;
}

interface OfficerAggregateViewProps {
  onAddNewPlot: (newPlot: FarmPlot) => void;
  plotCount: number;
  filedClaims: any[];
  onOverrideClaim: (ackId: string, action: string) => void;
}

export function OfficerAggregateView({ 
  onAddNewPlot, 
  plotCount, 
  filedClaims = [], 
  onOverrideClaim 
}: OfficerAggregateViewProps) {
  const [data, setData] = useState<AggregateRiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Bulk CSV import states
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // WhatsApp Sending Notification State
  const [sendingWa, setSendingWa] = useState<string | null>(null);
  const [waSentNotice, setWaSentNotice] = useState<string | null>(null);

  const getFallbackRiskData = (): AggregateRiskData => ({
    village_name: "Warangal West Block",
    district: "Warangal",
    state: "Telangana",
    total_monitored_plots: plotCount,
    advisory_status_count: 5,
    claim_status_count: filedClaims.length || 2,
    normal_status_count: Math.max(0, plotCount - 7),
    total_claims_filed: filedClaims.length || 1,
    district_risk_percentage: 23.8
  });

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/pmfby/aggregate-risk");
      if (!res.ok) throw new Error("Failed to fetch aggregate risk report");
      const json = await res.json();
      json.total_monitored_plots = plotCount;
      json.normal_status_count = Math.max(0, plotCount - json.advisory_status_count - json.claim_status_count);
      json.total_claims_filed = filedClaims.length || json.total_claims_filed;
      setData(json);
      setIsDemoMode(false);
    } catch (err: any) {
      setData(getFallbackRiskData());
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, [plotCount, filedClaims.length]);

  useEffect(() => {
    const interval = setInterval(fetchRiskData, 10000);
    return () => clearInterval(interval);
  }, [plotCount, filedClaims.length]);

  const handleImportSampleCSV = () => {
    setImporting(true);
    setImportStatus("Reading plot_records_telangana.csv...");
    
    setTimeout(() => {
      const mockPlots: FarmPlot[] = [
        {
          id: "plot-csv-101",
          name: "Venkataiah's Chilli Field",
          crop_type: "Chilli",
          farmer: "M. Venkataiah",
          location: "Parkal, Warangal",
          acreage: 3.4,
          ndvi_mean: 0.74,
          swi_mean: 0.65,
          swi_trend_7d: 0.02,
          sowing_date: "2026-06-10",
          crop_stage: "Flowering & Fruit Set",
          cluster_plots_affected: 4,
          disaster_gazette_id: "TS-GAZETTE-2026-PARKAL-011",
          health_status: "HEALTHY",
          center: [18.0125, 79.6214],
          polygon: [
            [18.0135, 79.6204],
            [18.0145, 79.6234],
            [18.0115, 79.6239],
            [18.0105, 79.6209],
          ]
        },
        {
          id: "plot-csv-102",
          name: "Laxmi's Paddy Basin",
          crop_type: "Rice/Paddy",
          farmer: "G. Laxmi",
          location: "Narsampet, Warangal",
          acreage: 4.1,
          ndvi_mean: 0.38,
          swi_mean: 0.35,
          swi_trend_7d: -0.15,
          sowing_date: "2026-06-01",
          crop_stage: "Tillering Stage",
          cluster_plots_affected: 5,
          disaster_gazette_id: "TS-GAZETTE-2026-WARANGAL-042",
          health_status: "CRITICAL",
          center: [17.9241, 79.8912],
          polygon: [
            [17.9251, 79.8902],
            [17.9261, 79.8932],
            [17.9231, 79.8937],
            [17.9221, 79.8907],
          ]
        }
      ];

      mockPlots.forEach((plot) => onAddNewPlot(plot));
      setImporting(false);
      setImportStatus("✅ Success! 2 CSV plot boundaries onboarded to GIS map.");
    }, 1200);
  };

  const handleSendWhatsAppReceipt = async (claim: any) => {
    setSendingWa(claim.acknowledgment_id);
    const msgText = `గౌరవప్రదమైన ${claim.farmer_name} గారూ, మీ PMFBY పంట ఇన్సూరెన్స్ క్లెయిమ్ (${claim.acknowledgment_id}) నష్టం వివరాలు మరియు ఆధారాలు ఇన్సూరెన్స్ కంపెనీ అధికారి ద్వారా సరిచూడబడ్డాయి. అంచనా పరిహారం: ₹${claim.estimated_payout.toLocaleString()}. - ఫసల్‌రక్షక్ సర్కార్ TELANGANA.`;
    
    await sendWhatsAppMessage("+919848022339", msgText, claim.plot_id, "TE");
    setSendingWa(null);
    setWaSentNotice(`📲 WhatsApp receipt dispatched to ${claim.farmer_name} (+91 98480 22339)!`);

    setTimeout(() => {
      setWaSentNotice(null);
    }, 5000);
  };

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-border bg-card/60 p-6 text-center text-xs text-muted-foreground animate-pulse">
        Fetching district telemetry aggregates...
      </div>
    );
  }

  if (!data) return null;

  const riskPct = data.district_risk_percentage;
  const isHighRisk = riskPct >= 20;
  const isMediumRisk = riskPct >= 10 && riskPct < 20;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-foreground flex items-center gap-2">
            <Building className="size-4 text-primary" /> Enterprise Insurer & Nodal Officer Command Center
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Real-time district risk telemetry, farmer claims verification queue, and gazette corroboration audits.
          </p>
        </div>

        <button
          onClick={fetchRiskData}
          disabled={loading}
          className="rounded-full px-3 py-1.5 border border-border bg-card/85 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs hover:border-primary/50 cursor-pointer self-start sm:self-auto"
          title="Refresh aggregates"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Reload Data
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Layers className="size-3 text-primary" /> Monitored Plots
          </span>
          <div className="text-3xl font-black text-foreground">{data.total_monitored_plots}</div>
          <div className="text-[0.62rem] text-muted-foreground">Active satellite polygons</div>
        </div>

        <div className="rounded-xl bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-400" /> Normal Health
          </span>
          <div className="text-3xl font-black text-emerald-400">{data.normal_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Stable crop canopy profiles</div>
        </div>

        <div className="rounded-xl bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-400" /> Advisories Dispatched
          </span>
          <div className="text-3xl font-black text-amber-400">{data.advisory_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Early warning SMS sent</div>
        </div>

        <div className="rounded-xl bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FileText className="size-3 text-rose-500" /> Active PMFBY Claims
          </span>
          <div className="text-3xl font-black text-rose-500">{filedClaims.length || data.claim_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Verification Queue</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REAL-TIME FARMER PMFBY CLAIMS VERIFICATION & OFFICER APPROVAL QUEUE       */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-card border-2 border-primary/30 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileText className="size-4 text-primary" /> 📋 Farmer PMFBY Claims Verification Queue
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live claims submitted by farmers in Kisan view. Inspect evidence photos, satellite corroboration, and approve payouts.
            </p>
          </div>
          <span className="text-xs font-black bg-primary/20 text-primary border border-primary/40 px-3 py-1 rounded-full shrink-0">
            {filedClaims.length} Claims Pending Review
          </span>
        </div>

        {waSentNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
            {waSentNotice}
          </div>
        )}

        {filedClaims.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No claims filed yet. When a farmer submits a 1-Tap claim in Kisan view, it will instantly appear here for verification.
          </div>
        ) : (
          <div className="space-y-4">
            {filedClaims.map((claim, idx) => (
              <div 
                key={claim.acknowledgment_id || idx}
                className="bg-soil/80 border border-border rounded-2xl p-5 space-y-4 shadow-md transition-all hover:border-primary/50"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-base font-black text-foreground">{claim.farmer_name}</h5>
                      <span className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/30 px-2.5 py-0.5 rounded">
                        {claim.crop_type} • {claim.location || "Warangal, Telangana"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ref ID: <strong className="text-foreground">{claim.acknowledgment_id}</strong> • Submitted: {claim.submitted_at || claim.consent_timestamp}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                      claim.status === "APPROVED_BY_INSURER" 
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : claim.status === "REJECTED_OVERRIDDEN"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}>
                      {claim.status === "APPROVED_BY_INSURER" ? "✅ APPROVED" : claim.status === "REJECTED_OVERRIDDEN" ? "❌ REJECTED" : "⏳ DLMC REVIEW"}
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-soil border border-border px-3 py-1 rounded-full">
                      Payout: ₹{claim.estimated_payout ? claim.estimated_payout.toLocaleString() : "48,400"}
                    </span>
                  </div>
                </div>

                {/* Evidence & Corroboration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Column 1: Captured Photo Evidence */}
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                      <Camera className="size-4 text-primary" /> Farmer Field Photo Evidence
                    </span>
                    {claim.evidence_photo_url || claim.evidence_image ? (
                      <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 max-h-36">
                        <img 
                          src={claim.evidence_photo_url || claim.evidence_image} 
                          alt="Farmer evidence" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/70 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          GPS Verified
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 bg-soil border border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-center p-2">
                        <span>📷 Photo Evidence Pending</span>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Corroboration Signals */}
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                    <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-emerald-400" /> SRS v5.0 Corroboration Signals
                    </span>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between border-b border-border pb-1">
                        <span className="text-muted-foreground">Spatial Cluster Density:</span>
                        <span className="font-bold text-foreground">4 Plots within 5km</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1">
                        <span className="text-muted-foreground">Crop Phenology Stage:</span>
                        <span className="font-bold text-foreground">Flowering & Grain Filling</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-1">
                        <span className="text-muted-foreground">Telangana Govt Gazette:</span>
                        <span className="font-bold text-emerald-400">TS-GAZETTE-2026-042</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Soil Moisture Deficit (SWI):</span>
                        <span className="font-bold text-cyan-400">42% (Moisture Stress)</span>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Interactive Officer Actions */}
                  <div className="bg-card border border-border rounded-xl p-3 space-y-2 flex flex-col justify-between">
                    <span className="font-bold text-muted-foreground">Officer Verification Actions</span>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => onOverrideClaim(claim.acknowledgment_id, "APPROVED_BY_INSURER")}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        <CheckCircle className="size-4" />
                        <span>Approve Payout</span>
                      </button>

                      <button
                        onClick={() => onOverrideClaim(claim.acknowledgment_id, "REJECTED_OVERRIDDEN")}
                        className="w-full py-2 px-3 rounded-lg bg-soil hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="size-4" />
                        <span>Reject & Request Inspection</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppReceipt(claim)}
                        disabled={sendingWa === claim.acknowledgment_id}
                        className="w-full py-2 px-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                      >
                        {sendingWa === claim.acknowledgment_id ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        <span>Send WhatsApp Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk CSV Importer Widget */}
      <div className="rounded-2xl bg-soil/50 border border-border p-4 space-y-3.5">
        <div>
          <h4 className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Upload className="size-3.5 text-primary" /> Bulk Plot Onboarding (CSV)
          </h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Upload custom CSV records to bulk register plot boundaries and farmer directories onto the GIS map.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 border border-dashed border-border rounded-lg bg-card/60 p-3 flex items-center justify-center text-[10px] text-muted-foreground text-center">
            {importStatus || "Drop plot_boundary_records.csv here to parse..."}
          </div>
          <button
            onClick={handleImportSampleCSV}
            disabled={importing}
            className="px-3.5 py-2.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {importing && <RefreshCw className="size-3 animate-spin" />}
            <span>Simulate CSV Import</span>
          </button>
        </div>
      </div>

      {/* Aggregate Block Risk Alert */}
      <div className="rounded-2xl bg-soil/50 border border-border p-4 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3 text-primary" /> Region: {data.village_name}, {data.district} ({data.state})
          </span>
          <span className={`px-2 py-0.5 rounded ${
            isHighRisk ? "bg-rose-500/20 text-rose-400" : isMediumRisk ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            Risk Level: {isHighRisk ? "CRITICAL" : isMediumRisk ? "ELEVATED" : "LOW"}
          </span>
        </div>

        {/* Risk progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[0.68rem] text-muted-foreground">
            <span>Cumulative Block Threat Ratio</span>
            <span className="font-bold">{riskPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-soil border border-border overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isHighRisk ? "bg-rose-600" : isMediumRisk ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${riskPct}%` }}
            />
          </div>
        </div>

        <p className="text-[0.7rem] text-muted-foreground leading-normal">
          * Threat ratio compiles NDVI changes, water deficits, and verification rates. Officers must conduct ground checks in red-zone zones to verify claim reports.
        </p>
      </div>
    </div>
  );
}
