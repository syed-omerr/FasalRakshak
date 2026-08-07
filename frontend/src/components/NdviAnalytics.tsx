import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Activity, ShieldAlert, Sparkles, TrendingUp, Calendar, Droplets } from "lucide-react";
import { FarmPlot } from "../lib/plots";

interface NdviAnalyticsProps {
  plot: FarmPlot;
}

const HISTORICAL_DATA: Record<string, { week: string; ndvi: number; swi: number; rainfall: number }[]> = {
  "plot-101": [
    { week: "Wk 1 (Jun)", ndvi: 0.42, swi: 0.70, rainfall: 45 },
    { week: "Wk 2", ndvi: 0.48, swi: 0.68, rainfall: 12 },
    { week: "Wk 3", ndvi: 0.55, swi: 0.67, rainfall: 30 },
    { week: "Wk 4 (Jul)", ndvi: 0.62, swi: 0.66, rainfall: 8 },
    { week: "Wk 5", ndvi: 0.67, swi: 0.65, rainfall: 0 },
    { week: "Wk 6", ndvi: 0.70, swi: 0.66, rainfall: 18 },
    { week: "Wk 7 (Aug)", ndvi: 0.68, swi: 0.65, rainfall: 5 },
    { week: "Current", ndvi: 0.68, swi: 0.65, rainfall: 2 },
  ],
  "plot-102": [
    { week: "Wk 1 (Jun)", ndvi: 0.35, swi: 0.55, rainfall: 20 },
    { week: "Wk 2", ndvi: 0.40, swi: 0.50, rainfall: 5 },
    { week: "Wk 3", ndvi: 0.45, swi: 0.46, rainfall: 15 },
    { week: "Wk 4 (Jul)", ndvi: 0.58, swi: 0.42, rainfall: 0 },
    { week: "Wk 5", ndvi: 0.55, swi: 0.40, rainfall: 0 },
    { week: "Wk 6", ndvi: 0.53, swi: 0.39, rainfall: 0 },
    { week: "Wk 7 (Aug)", ndvi: 0.52, swi: 0.38, rainfall: 3 },
    { week: "Current", ndvi: 0.52, swi: 0.38, rainfall: 0 },
  ],
  "plot-103": [
    { week: "Wk 1 (Jun)", ndvi: 0.55, swi: 0.60, rainfall: 50 },
    { week: "Wk 2", ndvi: 0.58, swi: 0.55, rainfall: 40 },
    { week: "Wk 3", ndvi: 0.54, swi: 0.50, rainfall: 80 },
    { week: "Wk 4 (Jul)", ndvi: 0.48, swi: 0.46, rainfall: 95 },
    { week: "Wk 5", ndvi: 0.43, swi: 0.44, rainfall: 65 },
    { week: "Wk 6", ndvi: 0.40, swi: 0.43, rainfall: 30 },
    { week: "Wk 7 (Aug)", ndvi: 0.38, swi: 0.42, rainfall: 12 },
    { week: "Current", ndvi: 0.38, swi: 0.42, rainfall: 4 },
  ],
  "plot-104": [
    { week: "Wk 1 (Jun)", ndvi: 0.38, swi: 0.75, rainfall: 15 },
    { week: "Wk 2", ndvi: 0.46, swi: 0.74, rainfall: 25 },
    { week: "Wk 3", ndvi: 0.58, swi: 0.73, rainfall: 35 },
    { week: "Wk 4 (Jul)", ndvi: 0.65, swi: 0.72, rainfall: 10 },
    { week: "Wk 5", ndvi: 0.71, swi: 0.73, rainfall: 5 },
    { week: "Wk 6", ndvi: 0.75, swi: 0.74, rainfall: 20 },
    { week: "Wk 7 (Aug)", ndvi: 0.74, swi: 0.72, rainfall: 15 },
    { week: "Current", ndvi: 0.74, swi: 0.72, rainfall: 8 },
  ],
};

export function NdviAnalytics({ plot }: NdviAnalyticsProps) {
  const chartData = HISTORICAL_DATA[plot.id] || HISTORICAL_DATA["plot-101"] || [];
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(chartData.length - 1);

  const swiVal = plot.swi_mean ?? (chartData[selectedWeekIndex]?.swi || 0.55);
  const swiTrend = plot.swi_trend_7d ?? -0.04;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal Canopy & SWI</span>;
      case "MODERATE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Moderate SWI Stress</span>;
      case "STRESSED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">High SWI Moisture Deficit</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <h3 className="text-xl font-bold tracking-tight text-foreground">{plot.name} Telemetry</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sentinel-2 Optical (NDVI) &amp; Sentinel-1 SAR Radar (Soil Water Index) • Crop: <span className="text-primary font-semibold">{plot.crop_type}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(plot.health_status)}
        </div>
      </div>

      {/* Metrics Row (Includes SRS v4 SWI Index) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Mean NDVI Score</div>
          <div className="text-2xl font-black text-primary mt-1">{plot.ndvi_mean}</div>
          <div className="text-[0.65rem] text-emerald-400 flex items-center gap-1 mt-0.5">
            <TrendingUp className="size-3" /> Sentinel-2 Tile
          </div>
        </div>

        <div className="p-3 rounded-lg bg-soil/60 border border-blue-500/30">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold flex items-center gap-1">
            <Droplets className="size-3 text-cyan-400" /> Soil Water Index (SWI)
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1">{swiVal.toFixed(2)}</div>
          <div className={`text-[0.65rem] flex items-center gap-1 mt-0.5 ${swiTrend < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            <span>7d Trend: {swiTrend >= 0 ? `+${swiTrend}` : swiTrend}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Plot Acreage</div>
          <div className="text-2xl font-black text-foreground mt-1">{plot.acreage} Ha</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">{(plot.acreage * 2.471).toFixed(1)} Acres</div>
        </div>

        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Farmer &amp; Location</div>
          <div className="text-lg font-bold text-foreground mt-1 truncate">{plot.farmer}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">{plot.location}</div>
        </div>
      </div>

      {/* Recharts Dual Timeline Chart (NDVI + SWI) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" /> 8-Week Dual Telemetry (NDVI Vegetation + SWI Moisture)
          </span>
          <span className="text-[11px] text-cyan-400">SWI Early Irrigation Warning Active</span>
        </div>
        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0.2, 0.9]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="ndvi"
                name="NDVI Greenness"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22c55e" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="swi"
                name="Soil Water Index (SWI)"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: "#06b6d4" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Time Slider */}
      <div className="p-3.5 rounded-lg bg-soil/80 border border-border/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Satellite &amp; SWI Time-Slider Comparison</span>
          <span className="text-primary font-semibold">{chartData[selectedWeekIndex]?.week || "Current"}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(0, chartData.length - 1)}
          value={selectedWeekIndex}
          onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />
        <div className="flex justify-between text-[0.65rem] text-muted-foreground">
          <span>Week 1 (Planting stage)</span>
          <span>Current Week (Satellite sync)</span>
        </div>
      </div>
    </div>
  );
}
