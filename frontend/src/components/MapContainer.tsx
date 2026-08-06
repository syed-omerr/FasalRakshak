import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, MapPin, Eye, AlertTriangle, CheckCircle, Flame, Search, Plus, Navigation, Trash2 } from "lucide-react";

// Fix standard Leaflet default marker icon path issue in Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface FarmPlot {
  id: string;
  name: string;
  crop_type: string;
  farmer: string;
  location: string;
  acreage: number;
  ndvi_mean: number;
  health_status: "HEALTHY" | "MODERATE" | "STRESSED" | "CRITICAL";
  center: [number, number];
  polygon: [number, number][];
}

export const INITIAL_PLOTS: FarmPlot[] = [
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
  {
    id: "plot-105",
    name: "Khammam Chilli & Rice Farm",
    crop_type: "Chilli / Rice",
    farmer: "Venkateswarlu M",
    location: "Khammam, Telangana",
    acreage: 2.9,
    ndvi_mean: 0.71,
    health_status: "HEALTHY",
    center: [17.2473, 80.1514],
    polygon: [
      [17.2485, 80.1500],
      [17.2495, 80.1530],
      [17.2460, 80.1535],
      [17.2450, 80.1505],
    ],
  },
  {
    id: "plot-106",
    name: "Nizamabad Turmeric & Paddy Field",
    crop_type: "Turmeric",
    farmer: "Gangadhar R",
    location: "Nizamabad, Telangana",
    acreage: 3.5,
    ndvi_mean: 0.63,
    health_status: "MODERATE",
    center: [18.6725, 78.0941],
    polygon: [
      [18.6738, 78.0925],
      [18.6748, 78.0955],
      [18.6712, 78.0960],
      [18.6702, 78.0930],
    ],
  },
  {
    id: "plot-107",
    name: "Guntur Chilli & Tobacco Belt",
    crop_type: "Chilli",
    farmer: "Subba Rao P",
    location: "Guntur, Andhra Pradesh",
    acreage: 4.2,
    ndvi_mean: 0.78,
    health_status: "HEALTHY",
    center: [16.3067, 80.4365],
    polygon: [
      [16.3080, 80.4350],
      [16.3090, 80.4380],
      [16.3055, 80.4385],
      [16.3045, 80.4355],
    ],
  },
];

interface MapComponentProps {
  plots: FarmPlot[];
  selectedPlot: FarmPlot;
  onSelectPlot: (plot: FarmPlot) => void;
  showNdviOverlay: boolean;
  onToggleNdviOverlay: () => void;
  onAddNewPlot: (newPlot: FarmPlot) => void;
  onRemovePlot: (plotId: string) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function InteractiveMap({
  plots,
  selectedPlot,
  onSelectPlot,
  showNdviOverlay,
  onToggleNdviOverlay,
  onAddNewPlot,
  onRemovePlot,
}: MapComponentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlotName, setNewPlotName] = useState("");
  const [newFarmerName, setNewFarmerName] = useState("");
  const [newCropType, setNewCropType] = useState("Cotton");
  const [newLocationName, setNewLocationName] = useState("Hyderabad, Telangana");
  const [newLat, setNewLat] = useState("17.3850");
  const [newLon, setNewLon] = useState("78.4867");

  const getPolygonColor = (status: string) => {
    if (!showNdviOverlay) return "#3b82f6";
    switch (status) {
      case "HEALTHY":
        return "#22c55e";
      case "MODERATE":
        return "#eab308";
      case "STRESSED":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = plots.find(
      (p) =>
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.crop_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      onSelectPlot(matched);
    } else {
      const parts = searchQuery.split(",").map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const customPlot: FarmPlot = {
          id: `custom-${Date.now()}`,
          name: `Custom Location (${parts[0].toFixed(2)}, ${parts[1].toFixed(2)})`,
          crop_type: "Cotton",
          farmer: "Local Farmer",
          location: `Coordinates ${parts[0].toFixed(2)}, ${parts[1].toFixed(2)}`,
          acreage: 2.0,
          ndvi_mean: 0.65,
          health_status: "HEALTHY",
          center: [parts[0], parts[1]],
          polygon: [
            [parts[0] + 0.001, parts[1] - 0.001],
            [parts[0] + 0.001, parts[1] + 0.001],
            [parts[0] - 0.001, parts[1] + 0.001],
            [parts[0] - 0.001, parts[1] - 0.001],
          ],
        };
        onAddNewPlot(customPlot);
      }
    }
  };

  const handleCreatePlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(newLat) || selectedPlot.center[0];
    const lonNum = parseFloat(newLon) || selectedPlot.center[1];

    const createdPlot: FarmPlot = {
      id: `plot-${Date.now()}`,
      name: newPlotName || "New Custom Field",
      crop_type: newCropType,
      farmer: newFarmerName || "Smallholder Farmer",
      location: newLocationName || "Telangana Region",
      acreage: 2.5,
      ndvi_mean: 0.66,
      health_status: "HEALTHY",
      center: [latNum, lonNum],
      polygon: [
        [latNum + 0.0012, lonNum - 0.0015],
        [latNum + 0.0018, lonNum + 0.0015],
        [latNum - 0.0012, lonNum + 0.0018],
        [latNum - 0.0018, lonNum - 0.0012],
      ],
    };

    onAddNewPlot(createdPlot);
    setShowAddModal(false);
    setNewPlotName("");
    setNewFarmerName("");
  };

  return (
    <div className="relative h-[520px] w-full overflow-hidden rounded-xl border border-border shadow-2xl bg-card flex flex-col">
      {/* Top Search & Controls Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between gap-3 bg-soil/95 backdrop-blur-md p-2.5 rounded-lg border border-border/80 shadow-lg text-xs">
        <form onSubmit={handleLocationSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search region, crop, or lat,lon..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md bg-card border border-border pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-secondary px-3 py-1.5 font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Find
          </button>
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 font-semibold transition-colors shadow-sm"
          >
            <Plus className="size-4" />
            <span>Add Custom Field</span>
          </button>

          <button
            onClick={onToggleNdviOverlay}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-all ${
              showNdviOverlay
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Flame className="size-4" />
            <span>{showNdviOverlay ? "Heatmap: ON" : "Heatmap: OFF"}</span>
          </button>
        </div>
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
            <span className="text-foreground">Stressed / Disease (&lt; 0.50)</span>
          </div>
        </div>
      )}

      {/* Leaflet Map Renderer */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={selectedPlot.center}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <RecenterMap center={selectedPlot.center} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {plots.map((plot) => {
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
                    <div className="p-1.5 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-sm text-foreground">{plot.name}</h4>
                        {plots.length > 1 && (
                          <button
                            title="Remove plot from monitoring"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePlot(plot.id);
                            }}
                            className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition-colors"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Crop: <strong className="text-foreground">{plot.crop_type}</strong> | {plot.acreage} Ha
                      </p>
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
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

      {/* Add Plot Modal Overlay */}
      {showAddModal && (
        <div className="absolute inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-soil border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Navigation className="size-5 text-primary" />
              Add Custom Farm Field
            </h3>

            <form onSubmit={handleCreatePlotSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-semibold mb-1">Field / Plot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Warangal South Cotton Plot"
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Crop Type</label>
                  <select
                    value={newCropType}
                    onChange={(e) => setNewCropType(e.target.value)}
                    className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Cotton">Cotton</option>
                    <option value="Groundnut">Groundnut</option>
                    <option value="Maize">Maize</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Rice/Paddy">Rice / Paddy</option>
                    <option value="Chilli">Chilli</option>
                    <option value="Turmeric">Turmeric</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Farmer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Reddy"
                    value={newFarmerName}
                    onChange={(e) => setNewFarmerName(e.target.value)}
                    className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-semibold mb-1">District / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Warangal, Telangana"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Latitude</label>
                  <input
                    type="text"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground font-semibold mb-1">Longitude</label>
                  <input
                    type="text"
                    value={newLon}
                    onChange={(e) => setNewLon(e.target.value)}
                    className="w-full bg-card border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded bg-card text-muted-foreground hover:text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold shadow"
                >
                  Save &amp; Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
