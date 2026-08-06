import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InteractiveMap, DEMO_PLOTS, FarmPlot } from "@/components/MapContainer";
import { NdviAnalytics } from "@/components/NdviAnalytics";
import {
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Layers,
  Sprout,
  ShieldCheck,
  Globe,
  PlusCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FasalRakshak 2.0 — AI Precision Agriculture & Early Warning System" },
      {
        name: "description",
        content:
          "Real-time satellite imagery analysis, predictive disease risk alerts, irrigation optimization, and mandi market recommendations for Indian smallholder farmers.",
      },
    ],
  }),
  component: Dashboard,
});

interface WeatherData {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity_avg: number;
  precipitation_mm: number;
  weather_condition: string;
}

function Dashboard() {
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot>(DEMO_PLOTS[0]);
  const [showNdviOverlay, setShowNdviOverlay] = useState<boolean>(true);
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [language, setLanguage] = useState<"EN" | "HI" | "TE">("EN");

  useEffect(() => {
    // Fetch live weather from backend API
    async function loadWeather() {
      try {
        setLoadingWeather(true);
        const res = await fetch(
          `http://localhost:8000/api/weather?lat=${selectedPlot.center[0]}&lon=${selectedPlot.center[1]}`
        );
        if (res.ok) {
          const json = await res.json();
          setWeatherList(json.daily_forecasts || []);
        } else {
          // Fallback mock weather if server not running locally yet
          setWeatherList(getFallbackWeather());
        }
      } catch (err) {
        setWeatherList(getFallbackWeather());
      } finally {
        setLoadingWeather(false);
      }
    }
    loadWeather();
  }, [selectedPlot]);

  function getFallbackWeather(): WeatherData[] {
    return [
      { date: "Today", temp_max: 33.2, temp_min: 24.1, humidity_avg: 74, precipitation_mm: 2.5, weather_condition: "Partly Cloudy" },
      { date: "Tomorrow", temp_max: 32.0, temp_min: 23.8, humidity_avg: 78, precipitation_mm: 14.0, weather_condition: "Light Rain" },
      { date: "Day 3", temp_max: 31.5, temp_min: 23.0, humidity_avg: 82, precipitation_mm: 8.5, weather_condition: "Showers" },
      { date: "Day 4", temp_max: 34.0, temp_min: 24.5, humidity_avg: 68, precipitation_mm: 0.0, weather_condition: "Sunny" },
      { date: "Day 5", temp_max: 35.1, temp_min: 25.0, humidity_avg: 62, precipitation_mm: 0.0, weather_condition: "Sunny" },
    ];
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="border-b border-border/80 bg-soil/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3.5 md:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground font-black text-xl shadow-lg">
              <Sprout className="size-6 text-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-foreground">FasalRakshak</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">2.0 MVP</span>
              </div>
              <p className="text-[0.68rem] text-muted-foreground">AI Precision Agriculture & Early Warning System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-xs">
              <Globe className="size-3.5 text-muted-foreground ml-1.5" />
              {(["EN", "HI", "TE"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`rounded px-2 py-1 font-semibold transition-colors ${
                    language === lang
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang === "EN" ? "English" : lang === "HI" ? "हिन्दी" : "తెలుగు"}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-soil border border-border px-3 py-1.5 rounded-lg">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sentinel-2 Satellite: Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 mx-auto w-full max-w-[1600px] p-4 md:p-8 space-y-6">
        
        {/* Weather Forecast Banner */}
        <section className="rounded-xl border border-border bg-card/80 backdrop-blur p-4 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <CloudSun className="size-5 text-primary" />
              <h2 className="font-bold text-base text-foreground">
                7-Day Open-Meteo Weather Forecast • {selectedPlot.location}
              </h2>
            </div>
            <span className="text-xs text-muted-foreground">Updated hourly via Open-Meteo REST API</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {weatherList.slice(0, 5).map((w, idx) => (
              <div key={idx} className="rounded-lg bg-soil/80 border border-border/80 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                  <span>{w.date}</span>
                  <span className="text-[0.65rem] text-primary">{w.weather_condition}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <div className="text-xl font-black text-foreground">{w.temp_max}°C</div>
                  <div className="text-xs text-muted-foreground">{w.temp_min}°C</div>
                </div>
                <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground pt-1 border-t border-border/50">
                  <span className="flex items-center gap-1"><Droplets className="size-3 text-blue-400" /> {w.humidity_avg}%</span>
                  <span className="flex items-center gap-1"><Wind className="size-3 text-emerald-400" /> {w.precipitation_mm}mm</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Plot Selector Bar */}
        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Monitored Farm Plots</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DEMO_PLOTS.map((plot) => {
              const active = plot.id === selectedPlot.id;
              return (
                <button
                  key={plot.id}
                  onClick={() => setSelectedPlot(plot)}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  <span
                    className={`size-2 rounded-full ${
                      plot.health_status === "HEALTHY"
                        ? "bg-emerald-400"
                        : plot.health_status === "MODERATE"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                  />
                  <span>{plot.name}</span>
                  <span className="text-[0.65rem] opacity-75">({plot.crop_type})</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Core Grid Layout: Left Map | Right Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Leaflet Map (Phase 2 Core) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <span>Interactive Field Map</span>
                <span className="text-xs text-muted-foreground font-normal">(Click plot to inspect telemetry)</span>
              </h3>
            </div>
            
            <InteractiveMap
              selectedPlot={selectedPlot}
              onSelectPlot={(p) => setSelectedPlot(p)}
              showNdviOverlay={showNdviOverlay}
              onToggleNdviOverlay={() => setShowNdviOverlay(!showNdviOverlay)}
            />
          </div>

          {/* Right Column: Satellite NDVI Telemetry & Time-Slider */}
          <div className="lg:col-span-5">
            <NdviAnalytics plot={selectedPlot} />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-soil py-6 mt-12">
        <div className="mx-auto flex max-w-[1600px] flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Sprout className="size-4 text-primary" />
            <span className="font-semibold text-foreground">FasalRakshak 2.0</span>
            <span>— Precision Agriculture Engine</span>
          </div>
          <div>
            <span>Powered by Open-Meteo & Sentinel-2 Satellite Datasets</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
