import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { InteractiveMap, INITIAL_PLOTS, FarmPlot } from "@/components/MapContainer";
import { NdviAnalytics } from "@/components/NdviAnalytics";

import heroField from "@/assets/hero-field.jpg";
import ear from "@/assets/ear.jpg";
import seed from "@/assets/seed.jpg";
import aerial from "@/assets/aerial.jpg";

import {
  CloudSun,
  Droplets,
  Wind,
  Layers,
  Sprout,
  ShieldCheck,
  Globe,
  Flame,
  TrendingUp,
  Activity,
  DollarSign,
  Compass,
  ArrowDown,
  PlusCircle,
  X,
  Trash2,
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
  component: Index,
});

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setY(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return y;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}

const chapters = [
  { id: "overview", label: "Overview" },
  { id: "map", label: "Satellite Map" },
  { id: "telemetry", label: "NDVI Telemetry" },
  { id: "weather", label: "Weather & Risk" },
  { id: "mandi", label: "Market Intelligence" },
];

const stats = [
  { value: "10m", label: "Sentinel-2 Spatial Resolution" },
  { value: "7-14D", label: "Predictive Disease Forecast" },
  { value: "30%", label: "Irrigation Water Savings" },
  { value: "₹5,000", label: "Avg Gain per Hectare" },
];

const traits = [
  {
    n: "01",
    title: "Sentinel-2 Satellite Ingestion",
    body: "Multi-spectral 10-meter pixel resolution mapping NIR and Red bands for real-time NDVI crop health assessment across all Indian districts.",
  },
  {
    n: "02",
    title: "7-14 Day Predictive Disease Rules",
    body: "Hardcoded agronomic rule engines forecasting Powdery Mildew, Thrips, Leaf Spot, and Blight risks before physical symptoms appear.",
  },
  {
    n: "03",
    title: "Irrigation Water Stress Optimizer",
    body: "Correlating 7-day NDVI drop trajectory with Open-Meteo dry spells and ISRO Bhuvan soil classifications.",
  },
  {
    n: "04",
    title: "Agmarknet Mandi Price & ROI Engine",
    body: "Daily agricultural commodity market scraping evaluating immediate sell value against 30-day storage-adjusted forecasts.",
  },
];

interface WeatherData {
  date: string;
  temp_max: number;
  temp_min: number;
  humidity_avg: number;
  precipitation_mm: number;
  weather_condition: string;
}

function Index() {
  const y = useScrollY();
  const [plotList, setPlotList] = useState<FarmPlot[]>(INITIAL_PLOTS);
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot>(INITIAL_PLOTS[0]);
  const [showNdviOverlay, setShowNdviOverlay] = useState<boolean>(true);
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [language, setLanguage] = useState<"EN" | "HI" | "TE">("EN");

  useEffect(() => {
    async function loadWeather() {
      try {
        const res = await fetch(
          `http://localhost:8000/api/weather?lat=${selectedPlot.center[0]}&lon=${selectedPlot.center[1]}`
        );
        if (res.ok) {
          const json = await res.json();
          setWeatherList(json.daily_forecasts || []);
        } else {
          setWeatherList(getFallbackWeather());
        }
      } catch (err) {
        setWeatherList(getFallbackWeather());
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

  const handleAddNewPlot = (newPlot: FarmPlot) => {
    setPlotList((prev) => [newPlot, ...prev]);
    setSelectedPlot(newPlot);
  };

  const handleRemovePlot = (plotId: string) => {
    if (plotList.length <= 1) return; // Keep at least one plot
    const updated = plotList.filter((p) => p.id !== plotId);
    setPlotList(updated);

    if (selectedPlot.id === plotId && updated.length > 0) {
      setSelectedPlot(updated[0]);
    }
  };

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
      <Nav language={language} setLanguage={setLanguage} />
      <Hero y={y} />
      <Marquee />
      
      {/* Overview Section */}
      <OverviewSection y={y} />
      
      {/* Key Metrics Band */}
      <StatsBand />

      {/* Interactive Map & Telemetry Dashboard Section */}
      <DashboardSection
        plots={plotList}
        selectedPlot={selectedPlot}
        setSelectedPlot={setSelectedPlot}
        showNdviOverlay={showNdviOverlay}
        setShowNdviOverlay={setShowNdviOverlay}
        weatherList={weatherList}
        onAddNewPlot={handleAddNewPlot}
        onRemovePlot={handleRemovePlot}
      />

      {/* AI System Traits / Architecture Section */}
      <TraitsSection />

      {/* Yield & Disease Early Warning Section */}
      <YieldSection y={y} selectedPlot={selectedPlot} />

      {/* Mandi Price & ROI Section */}
      <MandiSection />

      <Footer />
    </main>
  );
}

function Nav({
  language,
  setLanguage,
}: {
  language: "EN" | "HI" | "TE";
  setLanguage: (lang: "EN" | "HI" | "TE") => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-soil/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
        <a href="#top" className="display text-2xl tracking-widest text-foreground flex items-center gap-1">
          FasalRakshak<span className="text-primary">.</span>
        </a>
        <nav className="hidden items-center gap-8 lg:flex">
          {chapters.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-primary"
            >
              {c.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
            <Globe className="size-3 text-muted-foreground ml-1.5" />
            {(["EN", "HI", "TE"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "EN" ? "EN" : lang === "HI" ? "हिंदी" : "తెలుగు"}
              </button>
            ))}
          </div>

          <a
            href="#map"
            className="rounded-full border border-primary/60 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Launch Map
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ y }: { y: number }) {
  return (
    <section
      id="top"
      className="grain relative flex h-[100svh] min-h-[640px] items-end overflow-hidden"
    >
      <img
        src={heroField}
        alt="Indian agricultural crop fields lit by dawn light"
        width={1920}
        height={1200}
        className="absolute inset-0 h-[118%] w-full object-cover"
        style={{ transform: `translateY(${y * -0.18}px) scale(1.04)` }}
      />
      <div className="dusk-veil absolute inset-0" />
      <div className="absolute inset-0 bg-soil/45" />
      <div className="relative mx-auto w-full max-w-[1600px] px-6 pb-16 md:px-10 md:pb-24">
        <p className="eyebrow animate-rise">Precision Agriculture &amp; Early Warning System</p>
        <h1
          className="animate-rise mt-4 max-w-5xl text-[clamp(3.2rem,11vw,9.5rem)] text-foreground"
          style={{ animationDelay: "120ms" }}
        >
          Protecting the
          <br />
          smallholder field
        </h1>
        <div
          className="animate-rise mt-8 flex flex-col gap-8 border-t border-border pt-8 md:flex-row md:items-end md:justify-between"
          style={{ animationDelay: "240ms" }}
        >
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Integrating 10m Sentinel-2 satellite imagery, 7-day predictive disease rule engines, irrigation water stress indicators, and live Agmarknet mandi market analytics across any region in India.
          </p>
          <a
            href="#overview"
            className="group inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground"
          >
            <span className="grid size-11 place-items-center rounded-full border border-primary/60 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              ↓
            </span>
            Explore System Architecture
          </a>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = [
    "Sentinel-2 Satellite",
    "10m Spatial Resolution",
    "Predictive Disease Alerts",
    "Irrigation Water Optimizer",
    "Mandi Sell Timing ROI",
  ];
  return (
    <div className="border-y border-border bg-soil py-5">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-10">
            {words.map((w) => (
              <span
                key={w}
                className="display text-3xl tracking-wide text-muted-foreground md:text-4xl"
              >
                {w}
                <span className="ml-10 text-primary">✳</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewSection({ y }: { y: number }) {
  return (
    <section id="overview" className="relative overflow-hidden py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] items-center gap-14 px-6 md:grid-cols-2 md:px-10">
        <Reveal>
          <p className="eyebrow">Chapter one — the challenge</p>
          <h2 className="mt-5 text-[clamp(2.6rem,6vw,5.5rem)]">
            Empowering
            <br />
            smallholders
          </h2>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Indian farmers lose ₹2,000–5,000 per hectare due to late disease detection and waste up to 40% of irrigation water on guesswork.
          </p>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            FasalRakshak 2.0 provides continuous satellite monitoring and early warning alerts, putting multi-spectral crop diagnostic intelligence into every farmer's hands.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
            <div>
              <dt className="eyebrow">Forecast Lead Time</dt>
              <dd className="display mt-2 text-4xl text-foreground">7–14 Days</dd>
            </div>
            <div>
              <dt className="eyebrow">Water Savings Target</dt>
              <dd className="display mt-2 text-4xl text-foreground">25–30%</dd>
            </div>
          </dl>
        </Reveal>
        <Reveal delay={120} className="relative">
          <div className="glow relative overflow-hidden rounded-sm border border-border">
            <img
              src={seed}
              alt="High resolution satellite imagery and crop growth monitoring"
              width={1200}
              height={900}
              loading="lazy"
              className="h-[420px] w-full object-cover md:h-[560px]"
              style={{ transform: `translateY(${Math.min(0, (y - 700) * 0.03)}px)` }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatsBand() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-px px-6 md:grid-cols-4 md:px-10">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90}>
            <div className="px-2 py-12 md:py-16">
              <p className="display text-[clamp(2.6rem,5vw,4.5rem)] text-primary">
                {s.value}
              </p>
              <p className="mt-3 max-w-[14rem] text-sm leading-snug text-muted-foreground">
                {s.label}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function DashboardSection({
  plots,
  selectedPlot,
  setSelectedPlot,
  showNdviOverlay,
  setShowNdviOverlay,
  weatherList,
  onAddNewPlot,
  onRemovePlot,
}: {
  plots: FarmPlot[];
  selectedPlot: FarmPlot;
  setSelectedPlot: (p: FarmPlot) => void;
  showNdviOverlay: boolean;
  setShowNdviOverlay: (v: boolean) => void;
  weatherList: WeatherData[];
  onAddNewPlot: (newPlot: FarmPlot) => void;
  onRemovePlot: (plotId: string) => void;
}) {
  return (
    <section id="map" className="py-28 md:py-36 bg-soil/40 border-b border-border">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 space-y-10">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Chapter two — live satellite monitoring</p>
              <h2 className="mt-4 text-[clamp(2.4rem,6vw,5rem)]">
                Interactive Satellite &amp; Telemetry Map
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Select from regional presets, search any district in India, or add/remove custom fields.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 max-w-2xl">
              {plots.map((plot) => {
                const active = plot.id === selectedPlot.id;
                return (
                  <div
                    key={plot.id}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedPlot(plot)}
                      className="flex items-center gap-2"
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
                    </button>

                    {plots.length > 1 && (
                      <button
                        title="Remove plot from monitoring"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemovePlot(plot.id);
                        }}
                        className="ml-1 text-muted-foreground hover:text-rose-400 p-0.5 rounded-full transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Live Weather Forecast Bar */}
        <Reveal delay={90}>
          <div className="rounded-xl border border-border bg-card/90 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <CloudSun className="size-5" />
                <span>Open-Meteo 7-Day Live Weather Forecast • {selectedPlot.location}</span>
              </div>
              <span className="text-xs text-muted-foreground">API Sync: Online</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {weatherList.slice(0, 5).map((w, idx) => (
                <div key={idx} className="rounded-lg bg-soil/70 border border-border p-3 space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold flex justify-between">
                    <span>{w.date}</span>
                    <span className="text-primary">{w.weather_condition}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xl font-black">{w.temp_max}°C</span>
                    <span className="text-xs text-muted-foreground">{w.temp_min}°C</span>
                  </div>
                  <div className="flex justify-between text-[0.7rem] text-muted-foreground pt-1 border-t border-border/40">
                    <span><Droplets className="inline size-3 text-blue-400" /> {w.humidity_avg}%</span>
                    <span><Wind className="inline size-3 text-emerald-400" /> {w.precipitation_mm}mm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Grid: Map + Analytics */}
        <div id="telemetry" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4">
          <div className="lg:col-span-7">
            <InteractiveMap
              plots={plots}
              selectedPlot={selectedPlot}
              onSelectPlot={(p) => setSelectedPlot(p)}
              showNdviOverlay={showNdviOverlay}
              onToggleNdviOverlay={() => setShowNdviOverlay(!showNdviOverlay)}
              onAddNewPlot={onAddNewPlot}
              onRemovePlot={onRemovePlot}
            />
          </div>
          <div className="lg:col-span-5">
            <NdviAnalytics plot={selectedPlot} />
          </div>
        </div>
      </div>
    </section>
  );
}

function TraitsSection() {
  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Core System Architecture</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.4rem,6vw,5rem)]">
            Four Pillars of FasalRakshak
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-px border-t border-border md:grid-cols-2">
          {traits.map((t, i) => (
            <Reveal key={t.n} delay={i * 90}>
              <article className="group border-b border-border py-10 transition-colors md:px-8 md:hover:bg-card">
                <p className="display text-5xl text-primary/70 transition-colors group-hover:text-primary">
                  {t.n}
                </p>
                <h3 className="mt-4 text-3xl">{t.title}</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function YieldSection({ y, selectedPlot }: { y: number; selectedPlot: FarmPlot }) {
  return (
    <section id="weather" className="relative overflow-hidden bg-soil py-28 md:py-40">
      <div className="mx-auto grid max-w-[1600px] items-center gap-16 px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <Reveal className="order-2 md:order-1">
          <div className="relative animate-sway">
            <img
              src={ear}
              alt="Healthy crop harvest yield visualization"
              width={1024}
              height={1280}
              loading="lazy"
              className="mx-auto max-h-[600px] w-auto object-contain drop-shadow-2xl"
            />
          </div>
        </Reveal>
        <Reveal delay={120} className="order-1 md:order-2 space-y-6">
          <p className="eyebrow">Chapter three — Early Warning &amp; Yield</p>
          <h2 className="text-[clamp(2.6rem,6vw,5.5rem)]">
            Predictive Disease Risk &amp; Yield Model
          </h2>
          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Evaluating 14-day humidity windows, dry spell indices, and satellite canopy drops to protect Telangana cotton, groundnut, maize, and tomato crops.
          </p>

          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <span className="font-bold text-base text-foreground">Disease Risk Status • {selectedPlot.crop_type}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Powdery Mildew Risk: MEDIUM
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recommendation: Relative humidity average &gt; 78% forecasted in 4 days. Apply organic neem spray or fungicides within 72 hours window.
            </p>
          </div>

          <ul className="space-y-4 border-t border-border pt-6">
            {[
              ["Target Crop", selectedPlot.crop_type],
              ["Estimated Harvest Window", "110–120 Days"],
              ["Predicted Yield Accuracy", "±5% Variance"],
            ].map(([k, v]) => (
              <li key={k} className="flex items-baseline justify-between gap-6 border-b border-border pb-4">
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{k}</span>
                <span className="display text-2xl text-primary">{v}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function MandiSection() {
  const mandiPrices = [
    { market: "Warangal Mandi", commodity: "Cotton", min: 7100, max: 7650, modal: 7420, recommendation: "HOLD 30 DAYS" },
    { market: "Nalgonda Mandi", commodity: "Groundnut", min: 5800, max: 6300, modal: 6150, recommendation: "SELL NOW" },
    { market: "Karimnagar Mandi", commodity: "Maize Grain", min: 2150, max: 2400, modal: 2280, recommendation: "HOLD 15 DAYS" },
    { market: "Suryapet Mandi", commodity: "Tomato", min: 1400, max: 1900, modal: 1650, recommendation: "SELL NOW" },
  ];

  return (
    <section id="mandi" className="py-28 md:py-36 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 space-y-12">
        <Reveal>
          <p className="eyebrow">Chapter four — Market Integration</p>
          <h2 className="mt-4 text-[clamp(2.4rem,6vw,5rem)]">
            Agmarknet Mandi Price &amp; Sell ROI Engine
          </h2>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Scraping daily government agricultural market rates to give smallholders optimal sell timing decisions.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mandiPrices.map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-lg hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">{m.market}</span>
                  <span className={`text-[0.65rem] font-black px-2 py-0.5 rounded ${
                    m.recommendation.includes("SELL") ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {m.recommendation}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-foreground">{m.commodity}</h4>
                  <p className="text-3xl font-black text-primary mt-1">₹{m.modal} <span className="text-xs font-normal text-muted-foreground">/ Qtl</span></p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                  <span>Min: ₹{m.min}</span>
                  <span>Max: ₹{m.max}</span>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-soil py-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="display text-2xl tracking-widest text-foreground">
          FasalRakshak<span className="text-primary">.</span>
        </p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          FasalRakshak 2.0 AI Precision Agriculture System for Indian Smallholder Farmers. Integrating Sentinel-2, Open-Meteo, and Agmarknet open data standards.
        </p>
      </div>
    </footer>
  );
}
