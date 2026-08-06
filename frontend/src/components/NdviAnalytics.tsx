import React, { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Activity, ShieldAlert, Sparkles, TrendingUp, Calendar } from "lucide-react";
import { FarmPlot } from "./MapContainer";

interface NdviAnalyticsProps {
  plot: FarmPlot;
}

const HISTORICAL_DATA: Record<string, { week: string; ndvi: number; rainfall: number }[]> = {
  "plot-101": [
    { week: "Wk 1 (Jun)", ndvi: 0.42, rainfall: 45 },
    { week: "Wk 2", ndvi: 0.48, rainfall: 12 },
    { week: "Wk 3", ndvi: 0.55, rainfall: 30 },
    { week: "Wk 4 (Jul)", ndvi: 0.62, rainfall: 8 },
    { week: "Wk 5", ndvi: 0.67, rainfall: 0 },
    { week: "Wk 6", ndvi: 0.70, rainfall: 18 },
    { week: "Wk 7 (Aug)", ndvi: 0.68, rainfall: 5 },
    { week: "Current", ndvi: 0.68, rainfall: 2 },
  ],
  "plot-102": [
    { week: "Wk 1 (Jun)", ndvi: 0.35, rainfall: 20 },
    { week: "Wk 2", ndvi: 0.40, rainfall: 5 },
    { week: "Wk 3", ndvi: 0.45, rainfall: 15 },
    { week: "Wk 4 (Jul)", ndvi: 0.58, rainfall: 0 },
    { week: "Wk 5", ndvi: 0.55, rainfall: 0 },
    { week: "Wk 6", ndvi: 0.53, rainfall: 0 },
    { week: "Wk 7 (Aug)", ndvi: 0.52, rainfall: 3 },
    { week: "Current", ndvi: 0.52, rainfall: 0 },
  ],
  "plot-103": [
    { week: "Wk 1 (Jun)", ndvi: 0.55, rainfall: 50 },
    { week: "Wk 2", ndvi: 0.58, rainfall: 40 },
    { week: "Wk 3", ndvi: 0.54, rainfall: 80 },
    { week: "Wk 4 (Jul)", ndvi: 0.48, rainfall: 95 },
    { week: "Wk 5", ndvi: 0.43, rainfall: 65 },
    { week: "Wk 6", ndvi: 0.40, rainfall: 30 },
    { week: "Wk 7 (Aug)", ndvi: 0.38, rainfall: 12 },
    { week: "Current", ndvi: 0.38, rainfall: 4 },
  ],
  "plot-104": [
    { week: "Wk 1 (Jun)", ndvi: 0.38, rainfall: 15 },
    { week: "Wk 2", ndvi: 0.46, rainfall: 25 },
    { week: "Wk 3", ndvi: 0.58, rainfall: 35 },
    { week: "Wk 4 (Jul)", ndvi: 0.65, rainfall: 10 },
    { week: "Wk 5", ndvi: 0.71, rainfall: 5 },
    { week: "Wk 6", ndvi: 0.75, rainfall: 20 },
    { week: "Wk 7 (Aug)", ndvi: 0.74, rainfall: 15 },
    { week: "Current", ndvi: 0.74, rainfall: 8 },
  ],
};

export function NdviAnalytics({ plot }: NdviAnalyticsProps) {
  const data = HISTORICAL_DATA[plot.id] || HISTORICAL_DATA["plot-101"];
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(data.length - 1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal Canopy</span>;
      case "MODERATE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Moderate Canopy</span>;
      case "STRESSED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">High Water/Disease Stress</span>;
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
            Sentinel-2 Satellite 10m Spatial Resolution • Crop: <span className="text-primary font-semibold">{plot.crop_type}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(plot.health_status)}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Mean NDVI Score</div>
          <div className="text-2xl font-black text-primary mt-1">{plot.ndvi_mean}</div>
          <div className="text-[0.65rem] text-emerald-400 flex items-center gap-1 mt-0.5">
            <TrendingUp className="size-3" /> Sentinel-2 Tile
          </div>
        </div>
        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Plot Acreage</div>
          <div className="text-2xl font-black text-foreground mt-1">{plot.acreage} Ha</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">{(plot.acreage * 2.471).toFixed(1)} Acres</div>
        </div>
        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Soil Type</div>
          <div className="text-2xl font-black text-foreground mt-1">Black Loam</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">ISRO Bhuvan Grid</div>
        </div>
        <div className="p-3 rounded-lg bg-soil/60 border border-border/80">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-semibold">Farmer ID</div>
          <div className="text-lg font-bold text-foreground mt-1 truncate">{plot.farmer}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">{plot.location}</div>
        </div>
      </div>

      {/* Recharts 8-Week Trend Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="size-4 text-primary" /> 8-Week NDVI Vegetative Health Trajectory
          </span>
          <span>Target Optimal Baseline: 0.65+</span>
        </div>
        <div className="h-[200px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <Line
                type="monotone"
                dataKey="ndvi"
                name="NDVI Index"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22c55e" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Time Slider */}
      <div className="p-3.5 rounded-lg bg-soil/80 border border-border/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Satellite Time-Slider Comparison</span>
          <span className="text-primary font-semibold">{data[selectedWeekIndex].week}</span>
        </div>
        <input
          type="range"
          min={0}
          max={data.length - 1}
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
