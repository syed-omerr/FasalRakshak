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

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:8000/api/pmfby/alerts-feed");
      if (!res.ok) throw new Error("Failed to fetch alerts feed");
      const data = await res.json();
      setAlerts(data);
    } catch (err: any) {
      setError(err.message || "Unable to connect to backend API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll alerts feed every 10 seconds for real-time demonstration
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateWhatsAppApproval = async (alert: AlertLogItem) => {
    // Map plot_id to seeded phone numbers
    let phone = "+919848022337";
    if (alert.plot_id === "plot-102") phone = "+919848022339";
    else if (alert.plot_id === "plot-103") phone = "+919848022338";

    try {
      setSimulatingId(alert.id);
      
      // Submit approval reply to WhatsApp webhook
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
      
      // Refresh alert feed to show updated claim state
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
            <h3 className="text-lg font-bold text-foreground">Real-Time Dispatch Feed</h3>
            <p className="text-xs text-muted-foreground">Alerts sent to farmers via WhatsApp, SMS, &amp; Voice</p>
          </div>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="rounded-full p-2 border border-border bg-card/85 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs hover:border-primary/50"
          title="Manual refresh"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-4 text-xs text-rose-400">
          {error}. Make sure the FastAPI backend is running on port 8000.
        </div>
      )}

      {/* List */}
      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="text-center py-10 text-xs text-muted-foreground">
            No warnings or claims have been dispatched yet.
          </div>
        ) : (
          alerts.map((item) => {
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
                      {item.evidence_pdf_url && (
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
          })
        )}
      </div>
    </div>
  );
}
