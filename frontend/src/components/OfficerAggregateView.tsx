import React, { useEffect, useState } from "react";
import { 
  Building, 
  MapPin, 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  ShieldCheck,
  RefreshCw
} from "lucide-react";

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

export function OfficerAggregateView() {
  const [data, setData] = useState<AggregateRiskData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const getFallbackRiskData = (): AggregateRiskData => ({
    village_name: "Warangal West Block",
    district: "Warangal",
    state: "Telangana",
    total_monitored_plots: 42,
    advisory_status_count: 5,
    claim_status_count: 2,
    normal_status_count: 35,
    total_claims_filed: 1,
    district_risk_percentage: 23.8
  });

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/pmfby/aggregate-risk");
      if (!res.ok) throw new Error("Failed to fetch aggregate risk report");
      const json = await res.json();
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
    const interval = setInterval(fetchRiskData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
        Loading supervisor aggregations...
      </div>
    );
  }

  const riskPct = data.district_risk_percentage;
  const isHighRisk = riskPct >= 40;
  const isMediumRisk = riskPct >= 15 && riskPct < 40;

  return (
    <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Building className="size-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Officer Supervisor Dashboard</h3>
              {isDemoMode && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[0.62rem] font-bold text-amber-400">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Regional summary reports and risk aggregates</p>
          </div>
        </div>
        
        <button
          onClick={fetchRiskData}
          disabled={loading}
          className="rounded-full px-3 py-1.5 border border-border bg-card/85 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs hover:border-primary/50"
          title="Refresh aggregates"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Reload
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Monitored */}
        <div className="rounded-lg bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Layers className="size-3 text-primary" /> Monitored Plots
          </span>
          <div className="text-3xl font-black text-foreground">{data.total_monitored_plots}</div>
          <div className="text-[0.62rem] text-muted-foreground">Active satellite polygons</div>
        </div>

        {/* Normal Status */}
        <div className="rounded-lg bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="size-3 text-emerald-400" /> Normal Health
          </span>
          <div className="text-3xl font-black text-emerald-400">{data.normal_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Stable crop canopy profiles</div>
        </div>

        {/* Active Warning Advisories */}
        <div className="rounded-lg bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-400" /> Tier 1 Advisories
          </span>
          <div className="text-3xl font-black text-amber-400">{data.advisory_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Early warning SMS sent</div>
        </div>

        {/* Claim Status */}
        <div className="rounded-lg bg-soil/75 border border-border/70 p-4 space-y-1">
          <span className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <FileText className="size-3 text-rose-500" /> PMFBY Claim Alerts
          </span>
          <div className="text-3xl font-black text-rose-500">{data.claim_status_count}</div>
          <div className="text-[0.62rem] text-muted-foreground">Claims filed: <span className="font-bold text-foreground">{data.total_claims_filed}</span></div>
        </div>
      </div>

      {/* Aggregate Block Risk Alert */}
      <div className="rounded-lg bg-soil/50 border border-border p-4 space-y-3">
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
