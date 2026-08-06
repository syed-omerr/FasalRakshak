import React, { useEffect, useState } from "react";
import { 
  BellRing, 
  RefreshCw, 
  FileText, 
  Send, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  MessageSquare 
} from "lucide-react";

export interface AlertLogItem {
  id: string;
  plot_id: string;
  farmer_name: string;
  crop_type: string;
  tier: "PREVENTIVE_ADVISORY" | "PMFBY_CLAIM_ALERT";
  confidence_score_pct: number;
  created_at: string;
  explainability_note: string;
  status: "ADVISORY_SENT" | "AWAITING_CONSENT" | "CLAIM_SUBMITTED";
  evidence_pdf_url?: string;
  acknowledgment_id?: string;
}

export function RealTimeAlertsFeed() {
  const [alerts, setAlerts] = useState<AlertLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const getFallbackAlerts = (): AlertLogItem[] => [
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
      evidence_pdf_url: "/static/pdf/sample_evidence.pdf"
    }
  ];

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/pmfby/alerts-feed");
      if (!res.ok) throw new Error("Failed to fetch alerts feed");
      const data = await res.json();
      setAlerts(data);
      setIsDemoMode(false);
    } catch (err: any) {
      // Switch to local high-fidelity interactive fallback
      setAlerts(getFallbackAlerts());
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateWhatsAppApproval = async (alert: AlertLogItem) => {
    setSimulatingId(alert.id);
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (isDemoMode) {
      // Interactive local state update for offline demo mode
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                status: "CLAIM_SUBMITTED" as const,
                acknowledgment_id: `PMFBY-TEL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
              }
            : a
        )
      );
      setSimulatingId(null);
      return;
    }

    // Otherwise, hit real API
    let phone = "+919848022337";
    if (alert.plot_id === "plot-102") phone = "+919848022339";
    else if (alert.plot_id === "plot-103") phone = "+919848022338";

    try {
      const formData = new URLSearchParams();
      formData.append("Body", "Submit");
      formData.append("From", phone);

      const res = await fetch("http://localhost:8000/api/pmfby/webhook/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error("Webhook simulation failed");
      await fetchAlerts();
    } catch (err: any) {
      alert("Failed to simulate WhatsApp response: " + err.message);
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <BellRing className="size-5 text-primary animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Real-Time Dispatch Feed</h3>
              {isDemoMode && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[0.62rem] font-bold text-amber-400">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Alerts sent to farmers via WhatsApp, SMS, &amp; Voice</p>
          </div>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="rounded-full px-3 py-1.5 border border-border bg-card/85 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs hover:border-primary/50"
          title="Manual refresh"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </button>
      </div>

      {/* List */}
      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {alerts.map((item) => {
          const isAdvisory = item.tier === "PREVENTIVE_ADVISORY";
          const isSubmitted = item.status === "CLAIM_SUBMITTED";
          
          return (
            <div
              key={item.id}
              className={`relative rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                isAdvisory
                  ? "border-amber-500/35 bg-amber-500/[0.03] hover:border-amber-500/60"
                  : isSubmitted
                  ? "border-emerald-500/35 bg-emerald-500/[0.03] hover:border-emerald-500/60"
                  : "border-rose-500/35 bg-rose-500/[0.03] hover:border-rose-500/60"
              }`}
            >
              {/* Alert Card Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-2 mb-3">
                <div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                      isAdvisory
                        ? "bg-amber-500/25 text-amber-400 border border-amber-500/30"
                        : isSubmitted
                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/25 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isAdvisory ? "Tier 1: Early Advisory" : "Tier 2: Crop Loss Claim Alert"}
                  </span>
                  <span className="text-[0.68rem] text-muted-foreground ml-2.5 font-semibold">
                    {item.farmer_name} • {item.crop_type}
                  </span>
                </div>
                <div className="text-[0.68rem] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {item.created_at}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-foreground/90 font-medium">
                  {item.explainability_note}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <div className="flex gap-2">
                    <span className="text-[0.68rem] text-muted-foreground bg-soil px-2 py-0.5 rounded border border-border/80">
                      Signal Confidence: {item.confidence_score_pct}%
                    </span>
                    {!isAdvisory && (
                      <span className="text-[0.68rem] text-muted-foreground bg-soil px-2 py-0.5 rounded border border-border/80 flex items-center gap-1">
                        <PhoneCall className="size-2.5 text-amber-400" /> Outbound Call Active
                      </span>
                    )}
                  </div>

                  {/* Action Panel */}
                  <div className="flex items-center gap-2">
                    {/* PDF download if available */}
                    {item.evidence_pdf_url && !isDemoMode && (
                      <a
                        href={`http://localhost:8000${item.evidence_pdf_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[0.68rem] text-primary hover:underline font-bold"
                      >
                        <FileText className="size-3.5" />
                        View Evidence Report (PDF)
                      </a>
                    )}
                    
                    {item.evidence_pdf_url && isDemoMode && (
                      <button
                        onClick={() => alert("PDF downloads require the FastAPI backend to be running. This works dynamically when online!")}
                        className="inline-flex items-center gap-1 text-[0.68rem] text-primary hover:underline font-bold"
                      >
                        <FileText className="size-3.5" />
                        View Evidence Report (PDF)
                      </button>
                    )}

                    {/* Status / Quick Action button */}
                    {isAdvisory ? (
                      <div className="flex items-center gap-1 text-[0.68rem] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="size-3" />
                        Advisory Dispatched
                      </div>
                    ) : isSubmitted ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 text-[0.68rem] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle className="size-3" />
                          Claim Registered
                        </div>
                        {item.acknowledgment_id && (
                          <span className="text-[0.62rem] text-muted-foreground font-mono">
                            ID: {item.acknowledgment_id}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulateWhatsAppApproval(item)}
                        disabled={simulatingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-[0.68rem] font-bold text-white hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <MessageSquare className="size-3 text-white" />
                        {simulatingId === item.id ? "Auto Filing..." : "Simulate WhatsApp 'Submit' Reply"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
