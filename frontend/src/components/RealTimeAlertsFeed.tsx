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
  MessageSquare,
  ShieldCheck,
  XCircle,
  AlertCircle
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

interface RealTimeAlertsFeedProps {
  sharedAlerts?: AlertLogItem[];
  onUpdateAlert?: (id: string, updatedFields: Partial<AlertLogItem>) => void;
  filedClaims?: any[];
  onOverrideClaim?: (ackId: string, action: string) => void;
}

export function RealTimeAlertsFeed({
  sharedAlerts,
  onUpdateAlert,
  filedClaims = [],
  onOverrideClaim
}: RealTimeAlertsFeedProps) {
  const [alerts, setAlerts] = useState<AlertLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Custom WhatsApp & SMS Dispatch Modal state
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [targetPhone, setTargetPhone] = useState("+919848022339");
  const [targetPlotId, setTargetPlotId] = useState("plot-102");
  const [targetCrop, setTargetCrop] = useState("Groundnut");
  const [targetChannel, setTargetChannel] = useState<"WHATSAPP" | "SMS" | "BOTH">("BOTH");
  const [targetLanguage, setTargetLanguage] = useState<"TE" | "HI" | "EN">("TE");
  const [targetTier, setTargetTier] = useState<"PREVENTIVE_ADVISORY" | "PMFBY_CLAIM_ALERT">("PMFBY_CLAIM_ALERT");
  const [customMsg, setCustomMsg] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleSendCustomAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingAlert(true);
    setDispatchStatus(null);

    try {
      const res = await fetch("http://localhost:8000/api/notifications/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          plot_id: targetPlotId,
          crop_type: targetCrop,
          tier: targetTier,
          language: targetLanguage,
          channel: targetChannel,
          custom_message: customMsg.trim() || undefined
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const sidInfo = data.dispatched_channels?.whatsapp?.sid || data.dispatched_channels?.sms?.sid || "MOCK-DELIVERED";
      setDispatchStatus(`✅ Alert dispatched via ${targetChannel}! SID: ${sidInfo}`);

      if (data.alerts_feed_record) {
        setAlerts((prev) => [data.alerts_feed_record, ...prev]);
      }

      setTimeout(() => {
        setShowDispatchModal(false);
        setDispatchStatus(null);
      }, 2000);

    } catch (err: any) {
      setDispatchStatus(`❌ Delivery Error: ${err.message}`);
    } finally {
      setSendingAlert(false);
    }
  };

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
    if (sharedAlerts) return; // Skip fetch if using shared parent state
    try {
      setLoading(true);
      setError(null);
      const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      if (isLocal) {
        const res = await fetch("http://localhost:8000/api/pmfby/alerts-feed");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
          setIsDemoMode(false);
          return;
        }
      }
      setAlerts(getFallbackAlerts());
      setIsDemoMode(true);
    } catch (err: any) {
      setAlerts(getFallbackAlerts());
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [sharedAlerts]);

  useEffect(() => {
    if (sharedAlerts) return;
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [sharedAlerts]);

  const handleSimulateWhatsAppApproval = async (alert: AlertLogItem) => {
    setSimulatingId(alert.id);
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const ackId = `PMFBY-TEL-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    if (sharedAlerts && onUpdateAlert && onOverrideClaim) {
      // Direct integration into unified shared React state
      onUpdateAlert(alert.id, {
        status: "CLAIM_SUBMITTED",
        acknowledgment_id: ackId
      });
      
      const claimRecord = {
        farmer_id: "FARMER-MOCK-WA",
        plot_id: alert.plot_id,
        farmer_name: alert.farmer_name,
        crop_type: alert.crop_type,
        damage_score: 0.55,
        confidence_pct: alert.confidence_score_pct,
        evidence_pdf_url: alert.evidence_pdf_url || "#",
        consent_channel: "WhatsApp Button Approval",
        consent_timestamp: new Date().toLocaleString(),
        acknowledgment_id: ackId,
        submitted_at: new Date().toLocaleString(),
        status: "APPROVED_BY_INSURER"
      };
      
      // Post to mock claim submit API on backend to keep server db aligned
      fetch("http://localhost:8000/mock/pmfby/submit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimRecord)
      }).catch(() => {});

      if (onOverrideClaim) {
        onOverrideClaim(ackId, "APPROVED_BY_INSURER");
      }
      setSimulatingId(null);
      return;
    }

    if (isDemoMode) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? {
                ...a,
                status: "CLAIM_SUBMITTED" as const,
                acknowledgment_id: ackId,
              }
            : a
        )
      );
      setSimulatingId(null);
      return;
    }

    let phone = "+919848022337";
    if (alert.plot_id === "plot-102") phone = "+919848022339";
    else if (alert.plot_id === "plot-103") phone = "+919848022338";

    try {
      const formData = new URLSearchParams();
      formData.append("Body", "Submit");
      formData.append("From", phone);

      const res = await fetch("http://localhost:8000/api/pmfby/webhook/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error("Webhook simulation failed");
      await fetchAlerts();
    } catch (err: any) {
      window.alert("Failed to simulate WhatsApp response: " + err.message);
    } finally {
      setSimulatingId(null);
    }
  };

  const activeAlerts = sharedAlerts || alerts;

  return (
    <div className="rounded-xl border border-border bg-card/65 backdrop-blur-md p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <BellRing className="size-5 text-primary animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">Real-Time Dispatch Feed</h3>
              {(isDemoMode || !sharedAlerts) && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[0.62rem] font-bold text-amber-400">
                  Demo Mode
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Alerts sent to farmers via WhatsApp, SMS, &amp; Voice</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDispatchModal(true)}
            className="rounded-xl px-3.5 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary font-bold transition-all flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
          >
            <Send className="size-3.5" />
            Dispatch WhatsApp &amp; SMS
          </button>
          {!sharedAlerts && (
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="rounded-full px-3 py-1.5 border border-border bg-card/85 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 text-xs hover:border-primary/50 cursor-pointer"
              title="Manual refresh"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* WhatsApp & SMS Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border border-primary/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Send className="size-4 text-primary" /> Dispatch Live WhatsApp &amp; SMS Alert
              </h3>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendCustomAlert} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground font-bold mb-1">Farmer Phone Number</label>
                  <input
                    type="text"
                    required
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+91 98480 22339"
                    className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold mb-1">Plot ID</label>
                  <input
                    type="text"
                    required
                    value={targetPlotId}
                    onChange={(e) => setTargetPlotId(e.target.value)}
                    placeholder="plot-102"
                    className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-muted-foreground font-bold mb-1">Channel</label>
                  <select
                    value={targetChannel}
                    onChange={(e) => setTargetChannel(e.target.value as any)}
                    className="w-full bg-soil border border-border rounded-xl px-2.5 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="BOTH">WhatsApp + SMS</option>
                    <option value="WHATSAPP">WhatsApp Only</option>
                    <option value="SMS">SMS Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold mb-1">Language</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as any)}
                    className="w-full bg-soil border border-border rounded-xl px-2.5 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="TE">🌾 తెలుగు</option>
                    <option value="HI">🇮🇳 हिंदी</option>
                    <option value="EN">🇬🇧 English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground font-bold mb-1">Alert Tier</label>
                  <select
                    value={targetTier}
                    onChange={(e) => setTargetTier(e.target.value as any)}
                    className="w-full bg-soil border border-border rounded-xl px-2.5 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="PMFBY_CLAIM_ALERT">72-Hr PMFBY Claim</option>
                    <option value="PREVENTIVE_ADVISORY">Preventive Advisory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-bold mb-1">Custom Alert Message (Optional)</label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Leave blank to automatically format vernacular template message..."
                  className="w-full bg-soil border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {dispatchStatus && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs font-semibold text-primary">
                  {dispatchStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingAlert}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {sendingAlert ? "Dispatching..." : "Send Alert Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
        {activeAlerts.map((item) => {
          const isAdvisory = item.tier === "PREVENTIVE_ADVISORY";
          const isSubmitted = item.status === "CLAIM_SUBMITTED";
          
          // Match matching submitted claim to check audit logs and manual overrides
          const matchingClaim = filedClaims.find((c) => c.plot_id === item.plot_id);
          const claimStatus = matchingClaim?.status || "APPROVED_BY_INSURER";
          
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
                        ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/30"
                        : isSubmitted
                        ? "bg-emerald-500/25 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/25 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isAdvisory ? "Tier 1: SWI Soil-Moisture Advisory" : "Tier 2: 3-Source Claim Alert"}
                  </span>

                  {/* SRS v4 3-Source Eligibility Status Badge */}
                  <span className={`ml-2 inline-block rounded px-2 py-0.5 text-[0.62rem] font-bold ${
                    !isAdvisory ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-soil/60 text-muted-foreground border border-border"
                  }`}>
                    Eligibility: {!isAdvisory ? "Applicable (2+ Sources)" : "Advisory Warning"}
                  </span>

                  <span className="text-[0.68rem] text-muted-foreground ml-2.5 font-semibold">
                    {item.farmer_name} • {item.crop_type}
                  </span>
                </div>
                <div className="text-[0.68rem] text-muted-foreground flex items-center gap-1 font-semibold">
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
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                      <span className="text-[0.68rem] text-muted-foreground bg-soil px-2 py-0.5 rounded border border-border/80 font-semibold">
                        Signal Confidence: {item.confidence_score_pct}%
                      </span>
                      {!isAdvisory && (
                        <span className="text-[0.68rem] text-muted-foreground bg-soil px-2 py-0.5 rounded border border-border/80 flex items-center gap-1 font-semibold">
                          <PhoneCall className="size-2.5 text-amber-400 animate-pulse" /> Outbound Call Active
                        </span>
                      )}
                    </div>
                    {/* Consent Audit Log info */}
                    {isSubmitted && matchingClaim && (
                      <span className="text-[10px] text-primary italic font-semibold">
                        Consent Audit: Consent obtained via {matchingClaim.consent_channel} on {matchingClaim.consent_timestamp || matchingClaim.submitted_at}
                      </span>
                    )}
                  </div>

                  {/* Action Panel */}
                  <div className="flex items-center gap-2">
                    {/* PDF download if available */}
                    <a
                      href="/FasalRakshak_Claim_Report_Sample.pdf"
                      download="FasalRakshak_Claim_Report_Sample.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1 rounded text-[0.68rem] font-bold transition-all"
                    >
                      <FileText className="size-3.5 text-amber-300" />
                      <span>📄 Download Claim Report (PDF)</span>
                    </a>

                    {/* Status / Quick Action button */}
                    {isAdvisory ? (
                      <div className="flex items-center gap-1 text-[0.68rem] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle className="size-3" />
                        Advisory Dispatched
                      </div>
                    ) : isSubmitted ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className={`flex items-center gap-1 text-[0.68rem] font-bold border px-2 py-0.5 rounded-full ${
                          claimStatus === "APPROVED_BY_INSURER"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : claimStatus === "REJECTED_BY_INSURER"
                            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                            : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}>
                          {claimStatus === "APPROVED_BY_INSURER" && "Claim Approved"}
                          {claimStatus === "REJECTED_BY_INSURER" && "Claim Rejected"}
                          {claimStatus === "DLMC_REVIEW" && "DLMC Review Pending"}
                        </div>
                        {item.acknowledgment_id && (
                          <span className="text-[0.62rem] text-muted-foreground font-mono">
                            Ref: {item.acknowledgment_id}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSimulateWhatsAppApproval(item)}
                        disabled={simulatingId === item.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-2.5 py-1 text-[0.68rem] font-bold text-white hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        <MessageSquare className="size-3 text-white" />
                        {simulatingId === item.id ? "Auto Filing..." : "Simulate WhatsApp 'Submit' Reply"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Insurer Manual Overrides panel (Kisan v3.0 feature) */}
                {isSubmitted && item.acknowledgment_id && onOverrideClaim && (
                  <div className="border-t border-border/40 pt-2.5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                      🛡️ Claim Actions (Insurer Override)
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onOverrideClaim(item.acknowledgment_id!, "APPROVED_BY_INSURER")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          claimStatus === "APPROVED_BY_INSURER"
                            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-extrabold"
                            : "bg-soil border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <ShieldCheck className="size-3" /> Approve
                      </button>
                      <button
                        onClick={() => onOverrideClaim(item.acknowledgment_id!, "REJECTED_BY_INSURER")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          claimStatus === "REJECTED_BY_INSURER"
                            ? "bg-rose-500/20 border-rose-500/30 text-rose-400 font-extrabold"
                            : "bg-soil border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <XCircle className="size-3" /> Reject
                      </button>
                      <button
                        onClick={() => onOverrideClaim(item.acknowledgment_id!, "DLMC_REVIEW")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                          claimStatus === "DLMC_REVIEW"
                            ? "bg-amber-500/20 border-amber-500/30 text-amber-400 font-extrabold"
                            : "bg-soil border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <AlertCircle className="size-3" /> Flag DLMC
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
