import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FarmPlot, INITIAL_PLOTS } from "@/lib/plots";
import { NdviAnalytics } from "@/components/NdviAnalytics";
import { PmfbyClaimCard } from "@/components/PmfbyClaimCard";
import { RealTimeAlertsFeed, AlertLogItem } from "@/components/RealTimeAlertsFeed";
import { OfficerAggregateView } from "@/components/OfficerAggregateView";
import { KisanFarmerView } from "@/components/KisanFarmerView";
import { LoginView } from "@/components/LoginView";



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
  ShieldAlert,
  FileText,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FasalRakshak 2.0 — PMFBY Crop Loss & Vernacular Early Warning System" },
      {
        name: "description",
        content:
          "Satellite-powered crop damage detection, PMFBY 72-hour claim automation, multi-signal guardrails, and vernacular Telugu WhatsApp alerts for Indian smallholder farmers.",
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
  { id: "satellite", label: "Satellite Map" },
  { id: "pmfby", label: "PMFBY Claims Hub" },
  { id: "mandi", label: "Market Intelligence" },
  { id: "onboarding", label: "System Guide" },
];

const stats = [
  { value: "72h", label: "PMFBY Mandatory Claim Window" },
  { value: "2 of 3", label: "Multi-Signal Guardrails Fusion" },
  { value: "1-Tap", label: "Vernacular WhatsApp Claim Filing" },
  { value: "100%", label: "Plain-Language Explainability" },
];

const traits = [
  {
    n: "01",
    title: "Preventive Early Warning Advisories",
    body: "Lower-tier thresholds triggering Telugu WhatsApp advisories with crop-specific irrigation guidance before damage crosses claimable levels.",
  },
  {
    n: "02",
    title: "Vernacular Multi-Channel Alerts",
    body: "Delivered in Telugu (తెలుగు) and English via WhatsApp Business, SMS fallback, and outbound voice calls for feature phones.",
  },
  {
    n: "03",
    title: "1-Tap PMFBY Claim Submission",
    body: "Pre-filled evidence reports attached to alerts allowing farmers to approve submission with a single button tap.",
  },
  {
    n: "04",
    title: "Multi-Signal False-Positive Guardrails",
    body: "Requires agreement from at least 2 of 3 signals (Sentinel-2 NDVI, Open-Meteo Weather, Geotagged Photo) with numeric confidence scoring.",
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
  const [authSession, setAuthSession] = useState<{
    role: "kisan" | "enterprise";
    name: string;
    phone?: string;
    village?: string;
    email?: string;
    district?: string;
    crop?: string;
  } | null>(null);

  const [productView, setProductView] = useState<"kisan" | "enterprise">("enterprise");
  const [plotList, setPlotList] = useState<FarmPlot[]>(INITIAL_PLOTS);
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot>(INITIAL_PLOTS[0]);
  const [showNdviOverlay, setShowNdviOverlay] = useState<boolean>(true);
  const [weatherList, setWeatherList] = useState<WeatherData[]>([]);
  const [language, setLanguage] = useState<"EN" | "HI" | "TE">("EN");
  const [activeTab, setActiveTab] = useState<"satellite" | "pmfby" | "mandi" | "onboarding">("onboarding");
  const [InteractiveMap, setInteractiveMap] = useState<any>(null);

  // Shared alerts feed log state
  const [dispatchedAlerts, setDispatchedAlerts] = useState<AlertLogItem[]>([
    {
      id: "alert-901",
      plot_id: "plot-103",
      farmer_name: "Suresh Kumar",
      crop_type: "Maize",
      tier: "PREVENTIVE_ADVISORY",
      confidence_score_pct: 82.0,
      created_at: "Today, 18:30:15",
      explainability_note: "Warning: Dry spells detected for 12 consecutive days and NDVI vegetation density dropped by 14%. Immediate irrigation recommended.",
      status: "ADVISORY_SENT"
    },
    {
      id: "alert-902",
      plot_id: "plot-102",
      farmer_name: "Kavitha Rao",
      crop_type: "Groundnut",
      tier: "PMFBY_CLAIM_ALERT",
      confidence_score_pct: 94.5,
      created_at: "Today, 19:15:30",
      explainability_note: "Critical damage detected: Satellite greenness dropped by 22% and local weather stations report a 45% cumulative monsoon deficit.",
      status: "AWAITING_CONSENT",
      evidence_pdf_url: "/static/pdf/evidence_plot-102.pdf"
    }
  ]);

  // Shared claims registry log state
  const [filedClaims, setFiledClaims] = useState<any[]>([
    {
      farmer_id: "FARMER-KAVITHA-RAO",
      plot_id: "plot-102",
      farmer_name: "Kavitha Rao",
      crop_type: "Groundnut",
      damage_score: 0.22,
      confidence_pct: 94.5,
      evidence_pdf_url: "/static/pdf/evidence_plot-102.pdf",
      consent_channel: "WhatsApp Quick Reply Button",
      consent_timestamp: "Today, 19:16:02",
      acknowledgment_id: "PMFBY-TEL-2026-78401",
      submitted_at: "Today, 19:16:02",
      status: "APPROVED_BY_INSURER"
    }
  ]);

  useEffect(() => {
    // Dynamically load the Leaflet Map component ONLY on the client to avoid SSR window errors
    import("@/components/MapContainer").then((mod) => {
      setInteractiveMap(() => mod.InteractiveMap);
    });
  }, []);

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

    // If new plot triggers claim or advisory, add to alerts queue automatically
    const threatStatus = newPlot.health_status;
    if (threatStatus !== "HEALTHY") {
      const alertId = `alert-custom-${Date.now()}`;
      const newAlert: AlertLogItem = {
        id: alertId,
        plot_id: newPlot.id,
        farmer_name: newPlot.farmer,
        crop_type: newPlot.crop_type,
        tier: threatStatus === "CRITICAL" ? "PMFBY_CLAIM_ALERT" : "PREVENTIVE_ADVISORY",
        confidence_score_pct: 92.0,
        created_at: "Just Now",
        explainability_note: threatStatus === "CRITICAL" 
          ? `Crop damage confirmed on ${newPlot.farmer}'s field: Satellite NDVI greenness dropped below threshold. Evidence ready.`
          : `Dry spell detected on ${newPlot.farmer}'s field. Preventative advisories dispatched to mitigate loss.`,
        status: threatStatus === "CRITICAL" ? "AWAITING_CONSENT" : "ADVISORY_SENT"
      };
      setDispatchedAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const handleRemovePlot = (plotId: string) => {
    if (plotList.length <= 1) return;
    const updated = plotList.filter((p) => p.id !== plotId);
    setPlotList(updated);

    if (selectedPlot.id === plotId && updated.length > 0) {
      setSelectedPlot(updated[0]);
    }
  };

  const handleUpdateAlert = (alertId: string, updatedFields: Partial<AlertLogItem>) => {
    setDispatchedAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, ...updatedFields } : a))
    );
  };

  const handleOverrideClaim = (ackId: string, action: string) => {
    setFiledClaims((prev) =>
      prev.map((c) => (c.acknowledgment_id === ackId ? { ...c, status: action } : c))
    );
    // Sync status change in alerts feed as well
    setDispatchedAlerts((prev) =>
      prev.map((a) =>
        a.acknowledgment_id === ackId
          ? { ...a, status: "CLAIM_SUBMITTED" }
          : a
      )
    );
    // Keep backend synced
    fetch("http://localhost:8000/api/pmfby/override-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acknowledgment_id: ackId, action })
    }).catch(() => {});
  };

  const handleAddClaim = (claim: any) => {
    setFiledClaims((prev) => {
      if (prev.some((c) => c.plot_id === claim.plot_id)) {
        return prev.map((c) => c.plot_id === claim.plot_id ? { ...c, ...claim } : c);
      }
      return [claim, ...prev];
    });
    // Sync alerts list status
    setDispatchedAlerts((prev) =>
      prev.map((a) =>
        a.plot_id === claim.plot_id && a.tier === "PMFBY_CLAIM_ALERT"
          ? {
              ...a,
              status: "CLAIM_SUBMITTED" as const,
              acknowledgment_id: claim.acknowledgment_id
            }
          : a
      )
    );
  };

  const handleLoginSuccess = (session: any) => {
    setAuthSession(session);
    setProductView(session.role);
    
    if (session.role === "kisan") {
      const plotId = `plot-session-${Date.now()}`;
      const name = session.name;
      const village = session.village || "Warangal";
      const crop = session.crop || "Cotton";
      
      const newPlot: FarmPlot = {
        id: plotId,
        name: `${name}'s ${crop} Field`,
        crop_type: crop,
        farmer: name,
        location: `${village}, Telangana`,
        acreage: 2.2,
        ndvi_mean: 0.72,
        health_status: "HEALTHY",
        center: [17.9784, 79.5941],
        polygon: [
          [17.9796, 79.5926],
          [17.9802, 79.5956],
          [17.9772, 79.5959],
          [17.9766, 79.5929],
        ]
      };
      
      setPlotList((prev) => {
        if (prev.some((p) => p.farmer === name)) return prev;
        return [newPlot, ...prev];
      });
      setSelectedPlot(newPlot);
    }
  };

  if (!authSession) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main className="overflow-x-hidden bg-background text-foreground min-h-screen flex flex-col">
      <Nav 
        language={language} 
        setLanguage={setLanguage} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        productView={productView}
        setProductView={setProductView}
        onLogout={() => setAuthSession(null)}
      />
      
      <div className="flex-1 pt-12">
        {productView === "kisan" ? (
          <div className="animate-fade-in">
            <KisanFarmerView
              plots={plotList}
              onAddNewPlot={handleAddNewPlot}
              onSelectPlot={setSelectedPlot}
              selectedPlot={selectedPlot}
              onAddClaim={handleAddClaim}
              filedClaims={filedClaims}
            />
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === "onboarding" && (
              <div className="animate-fade-in">
                <Hero y={y} />
                <Marquee />
                <OverviewSection y={y} />
                <StatsBand />
                <TraitsSection />
              </div>
            )}

            {activeTab === "satellite" && (
              <div className="animate-fade-in">
                <DashboardSection
                  plots={plotList}
                  selectedPlot={selectedPlot}
                  setSelectedPlot={setSelectedPlot}
                  showNdviOverlay={showNdviOverlay}
                  setShowNdviOverlay={setShowNdviOverlay}
                  weatherList={weatherList}
                  onAddNewPlot={handleAddNewPlot}
                  onRemovePlot={handleRemovePlot}
                  InteractiveMap={InteractiveMap}
                />
              </div>
            )}

            {activeTab === "pmfby" && (
              <div className="animate-fade-in">
                <PmfbySection 
                  selectedPlot={selectedPlot} 
                  onAddNewPlot={handleAddNewPlot}
                  plotCount={plotList.length}
                  dispatchedAlerts={dispatchedAlerts}
                  handleUpdateAlert={handleUpdateAlert}
                  filedClaims={filedClaims}
                  handleOverrideClaim={handleOverrideClaim}
                />
              </div>
            )}

            {activeTab === "mandi" && (
              <div className="animate-fade-in">
                <YieldSection y={y} selectedPlot={selectedPlot} />
                <MandiSection />
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

function Nav({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  productView,
  setProductView,
  onLogout
}: {
  language: "EN" | "HI" | "TE";
  setLanguage: (lang: "EN" | "HI" | "TE") => void;
  activeTab: "satellite" | "pmfby" | "mandi" | "onboarding";
  setActiveTab: (tab: "satellite" | "pmfby" | "mandi" | "onboarding") => void;
  productView: "kisan" | "enterprise";
  setProductView: (view: "kisan" | "enterprise") => void;
  onLogout: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-soil/80 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10">
        <button 
          onClick={() => setActiveTab("onboarding")} 
          className="font-sans font-extrabold text-2xl tracking-tight text-foreground flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
        >
          FasalRakshak<span className="text-primary">.</span>
        </button>

        {productView === "enterprise" && (
          <nav className="hidden items-center gap-6 lg:flex">
            {chapters.map((c) => {
              const active = activeTab === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveTab(c.id as any)}
                  className={`text-[0.7rem] font-semibold uppercase tracking-[0.24em] transition-all cursor-pointer px-3 py-1.5 rounded-full ${
                    active
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-4">
          {/* FasalRakshak v3.0 Product View Switcher Toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-full p-1 text-[11px]">
            <button
              onClick={() => {
                setProductView("enterprise");
                setActiveTab("onboarding");
              }}
              className={`rounded-full px-3 py-1 font-bold transition-all cursor-pointer ${
                productView === "enterprise"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              💼 Enterprise
            </button>
            <button
              onClick={() => setProductView("kisan")}
              className={`rounded-full px-3 py-1 font-bold transition-all cursor-pointer ${
                productView === "kisan"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🌾 Kisan
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1 text-xs">
            <Globe className="size-3 text-muted-foreground ml-1.5" />
            {(["EN", "HI", "TE"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-2.5 py-0.5 font-semibold transition-colors cursor-pointer ${
                  language === lang
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang === "EN" ? "EN" : lang === "HI" ? "हिंदी" : "తెలుగు"}
              </button>
            ))}
          </div>

          {productView === "enterprise" && (
            <button
              onClick={() => setActiveTab("satellite")}
              className="rounded-full border border-primary/60 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
            >
              Launch Map
            </button>
          )}

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="rounded-full bg-soil/60 hover:bg-rose-500/10 border border-border hover:border-rose-500/30 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-rose-400 font-bold transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ y }: { y: number }) {
  return (
    <section
      id="top"
      className="grain relative flex h-[100svh] min-h-[620px] items-end overflow-hidden"
    >
      <img
        src={heroField}
        alt="Corn stalks at night lit from below by warm light"
        width={1920}
        height={1200}
        className="absolute inset-0 h-[118%] w-full object-cover"
        style={{ transform: `translateY(${y * -0.18}px) scale(1.04)` }}
      />
      <div className="dusk-veil absolute inset-0" />
      <div className="absolute inset-0 bg-soil/35" />
      <div className="relative mx-auto w-full max-w-[1600px] px-6 pb-16 md:px-10 md:pb-24">
        <p className="eyebrow animate-rise">Chapter zero — a single kernel</p>
        <h1
          className="animate-rise mt-4 max-w-5xl text-[clamp(3.4rem,12vw,11rem)] text-foreground"
          style={{ animationDelay: "120ms" }}
        >
          The corn
          <br />
          revolution
        </h1>
        <div
          className="animate-rise mt-8 flex flex-col gap-8 border-t border-border pt-8 md:flex-row md:items-end md:justify-between"
          style={{ animationDelay: "240ms" }}
        >
          <p className="max-w-md text-base leading-relaxed text-muted-foreground">
            Every kernel is a hundred years of decisions compressed into something
            you can hold between two fingers. This is how it changed the ground
            beneath us.
          </p>
          <a
            href="#overview"
            className="group inline-flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground"
          >
            <span className="grid size-11 place-items-center rounded-full border border-primary/60 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              ↓
            </span>
            Begin the descent
          </a>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const words = [
    "PMFBY 72h Claim Window",
    "Sentinel-2 10m Resolution",
    "Telugu WhatsApp Alerts",
    "1-Tap Claim Approval",
    "2-of-3 Multi-Signal Guardrails",
    "Plain-Language Explainability",
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
            PMFBY insurance rules require crop damage to be reported within 72 hours. Smallholders often miss this deadline due to delayed detection and complex paperwork.
          </p>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            FasalRakshak 2.0 solves this with automated multi-signal detection, pre-filled evidence PDF generation, and 1-tap claim approval delivered in Telugu on WhatsApp.
          </p>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
            <div>
              <dt className="eyebrow">PMFBY Mandate Window</dt>
              <dd className="display mt-2 text-4xl text-foreground">72 Hours</dd>
            </div>
            <div>
              <dt className="eyebrow">Guardrails Confidence</dt>
              <dd className="display mt-2 text-4xl text-foreground">2 of 3 Signals</dd>
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
  InteractiveMap,
}: {
  plots: FarmPlot[];
  selectedPlot: FarmPlot;
  setSelectedPlot: (p: FarmPlot) => void;
  showNdviOverlay: boolean;
  setShowNdviOverlay: (v: boolean) => void;
  weatherList: WeatherData[];
  onAddNewPlot: (newPlot: FarmPlot) => void;
  onRemovePlot: (plotId: string) => void;
  InteractiveMap: any;
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
                Select from regional presets, search any district in India, or click directly on the map to add/remove custom fields.
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
            {InteractiveMap ? (
              <InteractiveMap
                plots={plots}
                selectedPlot={selectedPlot}
                onSelectPlot={(p) => setSelectedPlot(p)}
                showNdviOverlay={showNdviOverlay}
                onToggleNdviOverlay={() => setShowNdviOverlay(!showNdviOverlay)}
                onAddNewPlot={onAddNewPlot}
                onRemovePlot={onRemovePlot}
              />
            ) : (
              <div className="h-[540px] flex items-center justify-center bg-card border border-border rounded-xl text-xs text-muted-foreground animate-pulse">
                Loading Interactive GIS Map...
              </div>
            )}
          </div>
          <div className="lg:col-span-5">
            <NdviAnalytics plot={selectedPlot} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PmfbySection({ 
  selectedPlot, 
  onAddNewPlot,
  plotCount,
  dispatchedAlerts,
  handleUpdateAlert,
  filedClaims,
  handleOverrideClaim
}: { 
  selectedPlot: FarmPlot; 
  onAddNewPlot: (plot: FarmPlot) => void;
  plotCount: number;
  dispatchedAlerts: AlertLogItem[];
  handleUpdateAlert: (id: string, updatedFields: Partial<AlertLogItem>) => void;
  filedClaims: any[];
  handleOverrideClaim: (ackId: string, action: string) => void;
}) {
  return (
    <section id="pmfby" className="py-28 md:py-36 border-b border-border bg-soil/60">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10 space-y-10">
        <Reveal>
          <div>
            <p className="eyebrow">Chapter three — SRS v2.0 PMFBY Automation</p>
            <h2 className="mt-4 text-[clamp(2.4rem,6vw,5rem)]">
              PMFBY 72h Claims &amp; Vernacular WhatsApp Alerts
            </h2>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              Combining two-tier advisories, multi-signal false-positive guardrails, plain-language explainability, and 1-tap WhatsApp claim approval.
            </p>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-6">
              <PmfbyClaimCard plot={selectedPlot} />
            </div>
            <div className="xl:col-span-6 space-y-8">
              <OfficerAggregateView onAddNewPlot={onAddNewPlot} plotCount={plotCount} />
              <RealTimeAlertsFeed 
                sharedAlerts={dispatchedAlerts} 
                onUpdateAlert={handleUpdateAlert}
                filedClaims={filedClaims}
                onOverrideClaim={handleOverrideClaim}
              />
            </div>
          </div>
        </Reveal>
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
            Four Pillars of FasalRakshak v2.0
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
          <p className="eyebrow">Chapter four — Early Warning &amp; Yield</p>
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
          <p className="eyebrow">Chapter five — Market Integration</p>
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
        <p className="font-sans font-extrabold text-2xl tracking-tight text-foreground">
          FasalRakshak<span className="text-primary">.</span>
        </p>
        <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
          FasalRakshak 2.0 AI Precision Agriculture &amp; PMFBY Claim Automation System for Indian Smallholder Farmers. Integrating Sentinel-2, Open-Meteo, and Agmarknet open data standards.
        </p>
      </div>
    </footer>
  );
}
