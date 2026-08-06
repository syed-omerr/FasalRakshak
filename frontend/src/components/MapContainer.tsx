import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, MapPin, Eye, AlertTriangle, CheckCircle, Flame } from "lucide-react";

// Fix standard Leaflet default marker icon path issue in Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface FarmPlot {
  id: str;
  name: str;
  crop_type: string;
  farmer: string;
  location: string;
  acreage: number;
  ndvi_mean: number;
  health_status: "HEALTHY" | "MODERATE" | "STRESSED" | "CRITICAL";
  center: [number, number];
  polygon: [number, number][];
}

const DEMO_PLOTS: FarmPlot[] = [
  {
    id: "plot-101",
    name: "Warangal North Field",
    crop_type: "Cotton",
    farmer: "Ramesh Reddy",
    location: "Warangal, Telangana",
    acreage: 2.4,
    ndvi_mean: 0.68,
    health_status: "HEALTHY",
    center: [17.9784, 79.5941],
    polygon: [
      [17.9795, 79.5925],
      [17.9805, 79.5955],
      [17.9775, 79.5960],
      [17.9765, 79.5930],
    ],
  },
  {
    id: "plot-102",
    name: "Nalgonda East Plot",
    crop_type: "Groundnut",
    farmer: "Kavitha Rao",
    location: "Nalgonda, Telangana",
    acreage: 1.8,
    ndvi_mean: 0.52,
    health_status: "MODERATE",
    center: [17.0500, 79.2700],
    polygon: [
      [17.0515, 79.2680],
      [17.0525, 79.2715],
      [17.0490, 79.2720],
      [17.0480, 79.2685],
    ],
  },
  {
    id: "plot-103",
    name: "Karimnagar Maize Basin",
    crop_type: "Maize",
    farmer: "Suresh Kumar",
    location: "Karimnagar, Telangana",
    acreage: 3.1,
    ndvi_mean: 0.38,
    health_status: "STRESSED",
    center: [18.4386, 79.1288],
    polygon: [
      [18.4400, 79.1265],
      [18.4410, 79.1305],
      [18.4370, 79.1310],
      [18.4360, 79.1270],
    ],
  },
  {
    id: "plot-104",
    name: "Suryapet Tomato Patch",
    crop_type: "Tomato",
    farmer: "Anjaiah B",
    location: "Suryapet, Telangana",
    acreage: 1.2,
    ndvi_mean: 0.74,
    health_status: "HEALTHY",
    center: [17.1400, 79.6200],
    polygon: [
      [17.1412, 79.6185],
      [17.1420, 79.6215],
      [17.1390, 79.6220],
      [17.1382, 79.6190],
    ],
  },
];

interface MapComponentProps {
  selectedPlot: FarmPlot;
  onSelectPlot: (plot: FarmPlot) => void;
  showNdviOverlay: boolean;
  onToggleNdviOverlay: () => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function InteractiveMap({
  selectedPlot,
  onSelectPlot,
  showNdviOverlay,
  onToggleNdviOverlay,
}: MapComponentProps) {
  const getPolygonColor = (status: string) => {
    if (!showNdviOverlay) return "#3b82f6"; // standard blue boundary
    switch (status) {
      case "HEALTHY":
        return "#22c55e"; // bright green
      case "MODERATE":
        return "#eab308"; // amber yellow
      case "STRESSED":
        return "#ef4444"; // red
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-border shadow-2xl bg-card">
      {/* Map Control Bar Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-3 rounded-lg bg-soil/90 backdrop-blur-md p-2.5 border border-border/80 shadow-lg text-xs">
        <button
          onClick={onToggleNdviOverlay}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-all ${
            showNdviOverlay
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          <Flame className="size-4" />
          <span>{showNdviOverlay ? "NDVI Satellite Heatmap: ON" : "NDVI Satellite Heatmap: OFF"}</span>
        </button>
      </div>

      {/* Legend Overlay */}
      {showNdviOverlay && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg bg-soil/90 backdrop-blur-md p-3 border border-border/80 text-[0.7rem] space-y-1.5 shadow-lg">
          <div className="font-semibold text-muted-foreground uppercase tracking-wider text-[0.65rem] mb-1">
            Sentinel-2 NDVI Spectrum
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#22c55e]"></span>
            <span className="text-foreground">Healthy (0.65 - 0.90)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#eab308]"></span>
            <span className="text-foreground">Moderate (0.50 - 0.64)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#ef4444]"></span>
            <span className="text-foreground">Stressed / Disease (< 0.50)</span>
          </div>
        </div>
      )}

      {/* Leaflet Map Renderer */}
      <MapContainer
        center={selectedPlot.center}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <RecenterMap center={selectedPlot.center} />
        
        {/* OpenStreetMap Satellite Hybrid Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {DEMO_PLOTS.map((plot) => {
          const isSelected = plot.id === selectedPlot.id;
          const color = getPolygonColor(plot.health_status);

          return (
            <React.Fragment key={plot.id}>
              <Polygon
                positions={plot.polygon}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: showNdviOverlay ? 0.45 : 0.25,
                  weight: isSelected ? 3 : 1.5,
                }}
                eventHandlers={{
                  click: () => onSelectPlot(plot),
                }}
              />
              <Marker
                position={plot.center}
                eventHandlers={{
                  click: () => onSelectPlot(plot),
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <h4 className="font-bold text-sm text-foreground">{plot.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Crop: <strong className="text-foreground">{plot.crop_type}</strong> | {plot.acreage} Ha
                    </p>
                    <div className="flex items-center gap-1 text-xs pt-1">
                      <span>NDVI Index:</span>
                      <span className="font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        {plot.ndvi_mean}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

export { DEMO_PLOTS };
