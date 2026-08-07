import React, { useState, useEffect, useRef } from "react";
import { FarmPlot } from "../lib/plots";
import { chatWithGoogleAIAssistant, submitPMFBYClaim } from "../lib/api";
import {
  Mic,
  MicOff,
  Camera,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  FileCheck,
  Globe,
  Droplets,
  Activity,
  TrendingUp,
  X,
  ShieldCheck,
  Layers
} from "lucide-react";

interface KisanFarmerViewProps {
  plots: FarmPlot[];
  onAddNewPlot: (newPlot: FarmPlot) => void;
  onSelectPlot: (plot: FarmPlot) => void;
  selectedPlot: FarmPlot | null;
  onAddClaim: (claim: any) => void;
  filedClaims: any[];
}

interface Message {
  sender: "farmer" | "assistant";
  text: string;
  translated?: string;
  lang: "TE" | "HI" | "EN";
}

export function KisanFarmerView({
  plots,
  onAddNewPlot,
  onSelectPlot,
  selectedPlot,
  onAddClaim,
  filedClaims
}: KisanFarmerViewProps) {
  // Onboarding registration state
  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [villageName, setVillageName] = useState("Warangal");
  const [cropType, setCropType] = useState("Cotton");
  const [latCoord, setLatCoord] = useState("17.9784");
  const [lonCoord, setLonCoord] = useState("79.5941");
  const [isOnboarding, setIsOnboarding] = useState(!selectedPlot);

  // Audio / Voice Assistant Drawer state (Floating bottom-right)
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"TE" | "HI" | "EN">("TE");
  const [voiceQuery, setVoiceQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogue, setDialogue] = useState<Message[]>([
    {
      sender: "assistant",
      text: "నమస్కారం! నేను ఫసల్‌రక్షక్ వాయిస్ అసిస్టెంట్‌ని. మీ పొలం స్థితి తెలుసుకోవడానికి లేదా క్లెయిమ్ దాఖలు చేయడానికి మాట్లాడండి.",
      translated: "Namaskaram! I am FasalRakshak Voice Assistant. Talk to check plot health or submit your PMFBY claim.",
      lang: "TE"
    }
  ]);

  // Geotagged Photo Upload states
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);

  // 1-Click Emergency PMFBY Claim states
  const [selectedCalamity, setSelectedCalamity] = useState("🌵 Drought & Moisture Stress");
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showVoiceModal) {
      dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [dialogue, showVoiceModal]);

  // Browser speech synthesis vocalizer helper
  const speakText = (text: string, langCode: "TE" | "HI" | "EN") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === "TE" ? "te-IN" : langCode === "HI" ? "hi-IN" : "en-IN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerName.trim() || !mobileNumber.trim()) return;

    const latNum = parseFloat(latCoord) || 17.9784;
    const lonNum = parseFloat(lonCoord) || 79.5941;
    const plotId = `plot-kisan-${Date.now()}`;

    const newPlot: FarmPlot = {
      id: plotId,
      name: `${farmerName}'s ${cropType} Field`,
      crop_type: cropType,
      farmer: farmerName,
      location: `${villageName}, Telangana`,
      acreage: 2.2,
      ndvi_mean: 0.72,
      swi_mean: 0.65,
      swi_trend_7d: 0.01,
      health_status: "HEALTHY",
      center: [latNum, lonNum],
      polygon: [
        [latNum + 0.0012, lonNum - 0.0015],
        [latNum + 0.0018, lonNum + 0.0015],
        [latNum - 0.0012, lonNum + 0.0018],
        [latNum - 0.0018, lonNum - 0.0012],
      ]
    };

    onAddNewPlot(newPlot);
    onSelectPlot(newPlot);
    setIsOnboarding(false);

    const welcomeMsgEn = `Welcome ${farmerName}! Your ${cropType} plot in ${villageName} is now registered under 72-Hr PMFBY Protection.`;
    const welcomeMsgTe = `స్వాగతం ${farmerName} గారూ! మీ ${cropType} పొలం ${villageName} లో 72-గంటల PMFBY రక్షణలో నమోదు చేయబడింది.`;

    const welcomeText = language === "TE" ? welcomeMsgTe : welcomeMsgEn;
    setDialogue([
      {
        sender: "assistant",
        text: welcomeText,
        translated: welcomeMsgEn,
        lang: language
      }
    ]);
    speakText(welcomeText, language);
  };

  const handleOneClickClaimSubmit = async (calamityType?: string) => {
    if (!selectedPlot) return;
    const calamity = calamityType || selectedCalamity;

    setIsFilingClaim(true);
    setClaimSuccessMessage(null);

    const ackId = `PMFBY-TEL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const nowStr = new Date().toLocaleString();
    const estPayout = Math.round(selectedPlot.acreage * 22000);

    const claimRecord = {
      id: ackId,
      plot_id: selectedPlot.id,
      farmer_name: selectedPlot.farmer,
      crop_type: selectedPlot.crop_type,
      location: selectedPlot.location,
      acreage: selectedPlot.acreage,
      calamity_type: calamity,
      loss_percentage: selectedPlot.health_status === "CRITICAL" ? 75 : 55,
      estimated_payout: estPayout,
      evidence_pdf_url: "/static/pdf/sample_evidence.pdf",
      consent_channel: "1-Click Emergency Farmer Portal",
      consent_timestamp: nowStr,
      acknowledgment_id: ackId,
      submitted_at: nowStr,
      status: "APPROVED_BY_INSURER"
    };

    await submitPMFBYClaim({
      farmer_id: selectedPlot.farmer,
      plot_id: selectedPlot.id,
      crop_type: selectedPlot.crop_type,
      damage_score: 0.65,
      confidence_pct: 94.5,
      signals_used: [
        `Satellite NDVI Canopy Drop (${selectedPlot.ndvi_mean})`,
        `Soil Water Index Deficit (${selectedPlot.swi_mean || 0.42})`,
        `Calamity Reported: ${calamity}`
      ],
      ndvi_before: 0.74,
      ndvi_after: selectedPlot.ndvi_mean,
      rainfall_deficit_pct: 42.0,
      swi_val: selectedPlot.swi_mean || 0.42,
      consent_channel: "1-Click Emergency Portal"
    });

    onAddClaim(claimRecord);
    setIsFilingClaim(false);
    setClaimSuccessMessage(`✅ PMFBY Claim Submitted! Reference ID: ${ackId} • Estimated Compensation Payout: ₹${estPayout.toLocaleString()}`);

    const msgTe = `ధన్యవాదాలు ${selectedPlot.farmer} గారూ! మీ ${selectedPlot.crop_type} పొలం PMFBY క్లెయిమ్ 1-టాప్‌లో సమర్పించబడింది. రెఫరెన్స్ నంబర్: ${ackId}. అంచనా పరిహారం: ₹${estPayout.toLocaleString()}.`;
    const msgEn = `Thank you ${selectedPlot.farmer}! Your PMFBY crop loss claim has been filed via 1-Click. Reference ID: ${ackId}. Estimated Payout: ₹${estPayout.toLocaleString()}.`;

    const speechText = language === "TE" ? msgTe : msgEn;
    setDialogue((prev) => [
      ...prev,
      {
        sender: "assistant",
        text: speechText,
        translated: msgEn,
        lang: language
      }
    ]);
    speakText(speechText, language);
  };

  const handleSendVoiceQuery = async (queryText: string) => {
    if (!queryText.trim() || !selectedPlot) return;
    
    setIsListening(false);
    setIsProcessing(true);
    
    setDialogue((prev) => [
      ...prev,
      {
        sender: "farmer",
        text: queryText,
        lang: language
      }
    ]);

    try {
      const parsed = await chatWithGoogleAIAssistant({
        farmer_name: selectedPlot.farmer,
        plot_id: selectedPlot.id,
        crop_type: selectedPlot.crop_type,
        location: selectedPlot.location,
        acreage: selectedPlot.acreage,
        ndvi_mean: selectedPlot.ndvi_mean,
        swi_mean: selectedPlot.swi_mean || 0.42,
        swi_trend_7d: selectedPlot.swi_trend_7d || -0.06,
        health_status: selectedPlot.health_status,
        query_text: queryText,
        language: language
      });

      const botMessageText = parsed.text_response || "నమస్కారం! మీ ప్రశ్నను పరిశీలిస్తున్నాము.";
      const botTransText = parsed.translated_text || "Namaskaram! Processing your query.";

      if (parsed.intent_detected === "CLAIM") {
        handleOneClickClaimSubmit("Voice AI Confirmation");
      }

      setDialogue((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: botMessageText,
          translated: botTransText,
          lang: language
        }
      ]);
      speakText(botMessageText, language);
    } catch (err: any) {
      console.warn("Voice assistant query notice:", err);
    } finally {
      setVoiceQuery("");
      setIsProcessing(false);
    }
  };

  const handleSimulatePhotoUpload = () => {
    setPhotoVerifying(true);
    setUploadedPhoto("uploading");

    setTimeout(() => {
      setPhotoVerifying(false);
      setUploadedPhoto("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=300&q=80");
      
      const successTe = "ఫోటో విజయవంతంగా సరిచూడబడింది! GPS మరియు EXIF డేటా ద్వారా 98% క్లెయిమ్ ఆధారాలు నిర్ధారించబడ్డాయి.";
      const successEn = "Geotagged field photo verified! GPS & EXIF corroboration score boosted to 98%.";
      
      const textVal = language === "TE" ? successTe : successEn;

      setDialogue((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: textVal,
          translated: successEn,
          lang: language
        }
      ]);
      speakText(textVal, language);
    }, 1500);
  };

  const currentClaim = filedClaims.find((c) => c.plot_id === selectedPlot?.id);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 space-y-6 animate-fade-in relative pb-24">
      
      {/* ========================================================================= */}
      {/* 1. ENTERPRISE-STYLE HERO SECTION (Kisan Protection Portal)                */}
      {/* ========================================================================= */}
      {selectedPlot && (
        <div className="rounded-2xl border border-border bg-card/90 p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            
            {/* Title & Plot Selection */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30 flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> PMFBY 72-Hour Protection Active
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-soil text-muted-foreground border border-border">
                  {selectedPlot.location}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                🌾 {selectedPlot.name}
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground max-w-2xl">
                Precision Sentinel-2 Optical &amp; Sentinel-1 Radar Soil Water Index (SWI) Telemetry Engine • Automated PMFBY 1-Click Claim Portal
              </p>
            </div>

            {/* Quick Plot Switcher Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPlot.id}
                onChange={(e) => {
                  const p = plots.find((x) => x.id === e.target.value);
                  if (p) onSelectPlot(p);
                }}
                className="bg-soil border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-sm"
              >
                {plots.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.crop_type})
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsOnboarding(true)}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer"
              >
                + Register Plot
              </button>
            </div>
          </div>

          {/* Hero Telemetry Metric Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-soil/70 border border-border/80 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Plot Acreage</span>
              <div className="text-xl font-black text-foreground">{selectedPlot.acreage} Ha</div>
              <span className="text-[10px] text-muted-foreground">{(selectedPlot.acreage * 2.471).toFixed(1)} Acres</span>
            </div>

            <div className="bg-soil/70 border border-cyan-500/30 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Droplets className="size-3" /> Soil Water Index (SWI)
              </span>
              <div className="text-xl font-black text-cyan-300">{(selectedPlot.swi_mean || 0.42).toFixed(2)}</div>
              <span className="text-[10px] text-rose-400 font-semibold">7d Trend: -0.06 (Moisture Deficit)</span>
            </div>

            <div className="bg-soil/70 border border-emerald-500/30 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Activity className="size-3" /> Canopy NDVI Health
              </span>
              <div className="text-xl font-black text-emerald-400">{selectedPlot.ndvi_mean}</div>
              <span className="text-[10px] text-muted-foreground">Sentinel-2 Optical Sync</span>
            </div>

            <div className="bg-soil/70 border border-amber-500/30 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">3-Source Report</span>
              <div className="text-sm font-black text-emerald-400 mt-1">✓ APPLICABLE</div>
              <span className="text-[10px] text-muted-foreground">Weather + Satellite + Photo</span>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Registration Modal */}
      {isOnboarding && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> Onboard New Farmer Plot
            </h3>
            {selectedPlot && (
              <button onClick={() => setIsOnboarding(false)} className="text-muted-foreground hover:text-foreground text-xs font-bold">
                ✕ Close
              </button>
            )}
          </div>

          <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1">Farmer Name (రైతు పేరు)</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Reddy"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">Mobile Number (ఫోన్ నంబర్)</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98480 22339"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">Village / Mandal (గ్రామం)</label>
              <input
                type="text"
                required
                placeholder="e.g. Warangal Block-A"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">Crop Type (పంట)</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Cotton">Cotton (ప్రత్తి)</option>
                <option value="Groundnut">Groundnut (వేరుశనగ)</option>
                <option value="Maize">Maize (మొక్కజొన్న)</option>
                <option value="Tomato">Tomato (టమాటా)</option>
                <option value="Rice/Paddy">Rice (వరి)</option>
                <option value="Chilli">Chilli (మిరప)</option>
                <option value="Turmeric">Turmeric (పసుపు)</option>
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">Latitude Coordinate</label>
              <input
                type="text"
                value={latCoord}
                onChange={(e) => setLatCoord(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">Longitude Coordinate</label>
              <input
                type="text"
                value={lonCoord}
                onChange={(e) => setLonCoord(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 transition-all flex items-center gap-2 cursor-pointer"
              >
                Save Plot &amp; Enable PMFBY Protection <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD GRID: FOCUS ON CLAIMANCE & MONITORING (No central chat) */}
      {/* ========================================================================= */}
      {selectedPlot && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ===================================================================== */}
          {/* LEFT 7 COLUMNS: PMFBY CLAIMANCE & EMERGENCY CALAMITY ENGINE            */}
          {/* ===================================================================== */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* HERO 1-CLICK PMFBY CLAIM APPLICATION CARD */}
            <div className="bg-card border-2 border-primary/40 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-amber-400 animate-pulse" />
                  <h3 className="text-lg font-black text-foreground">
                    ⚡ 1-Click PMFBY Insurance Claim Application
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Estimated Payout: ₹{Math.round(selectedPlot.acreage * 22000).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                అత్యవసర పంట నష్టపరిహారం దాఖలు చేయండి • If your crop yield is threatened or damaged by weather anomalies, drought, or pests, submit your 1-click claim instantly.
              </p>

              {/* Active Filed Claim Status Notice OR Calamity Action Card */}
              {currentClaim ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5"><FileCheck className="size-4" /> PMFBY Claim Filed &amp; Approved</span>
                    <span className="bg-emerald-500/20 px-2.5 py-1 rounded text-xs">{currentClaim.acknowledgment_id}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Estimated compensation payout: <strong className="text-foreground font-black">₹{currentClaim.estimated_payout.toLocaleString()}</strong> ({currentClaim.loss_percentage}% damage corroborated).
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Calamity Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-muted-foreground uppercase">Select Damage Cause / Calamity:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        "🌵 Drought & Moisture Stress",
                        "🌧️ Unseasonal Rain & Flood",
                        "🐛 Pest / Disease Attack",
                        "⚡ General Crop Damage"
                      ].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedCalamity(type)}
                          className={`p-2.5 rounded-xl text-left font-bold transition-all text-xs border cursor-pointer ${
                            selectedCalamity === type
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-soil/60 text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PROMINENT 1-CLICK CLAIM ACTION BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOneClickClaimSubmit(selectedCalamity)}
                    disabled={isFilingClaim}
                    className="w-full py-4 px-5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-primary/40 active:scale-95 disabled:opacity-50"
                  >
                    {isFilingClaim ? (
                      <>
                        <Loader2 className="size-5 animate-spin" />
                        <span>Submitting PMFBY Claim to Insurer...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5 text-amber-300 animate-pulse" />
                        <span>⚡ 1-Click Apply for PMFBY Claim Now (ఇప్పుడే క్లెయిమ్ చేయండి)</span>
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </button>

                  {claimSuccessMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300">
                      {claimSuccessMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* GEOTAGGED PHOTO VERIFICATION CARD */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Camera className="size-4 text-primary" /> Geotagged Field Photo Evidence
                </h4>
                <span className="text-[11px] text-muted-foreground font-semibold">GPS &amp; EXIF Verified</span>
              </div>

              {uploadedPhoto && uploadedPhoto !== "uploading" ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-48">
                    <img src={uploadedPhoto} alt="Geotagged evidence" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow">
                      <CheckCircle className="size-3" /> GPS &amp; Time Stamp Verified
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                    <span>AI Damage Verification Score: <strong>98% Corroborated</strong></span>
                    <button onClick={() => setUploadedPhoto(null)} className="text-[10px] text-muted-foreground underline hover:text-foreground">
                      Re-upload
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-all bg-soil/40 space-y-3">
                  {photoVerifying ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                      <p className="text-xs font-bold text-foreground">Auditing EXIF GPS coordinates &amp; damage score...</p>
                    </div>
                  ) : (
                    <>
                      <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                        <Camera className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Upload Field Photo for Multi-Signal Verification</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Ground-truth evidence attached directly to your PMFBY claim packet</p>
                      </div>
                      <button
                        onClick={handleSimulatePhotoUpload}
                        className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 text-xs font-bold border border-primary/30 transition-all cursor-pointer"
                      >
                        Simulate Camera Capture
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* RIGHT 5 COLUMNS: CONTINUOUS MONITORING & TELEMETRY                    */}
          {/* ===================================================================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* TELEMETRY & SOIL MOISTURE MONITOR */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-cyan-400" /> Soil &amp; Canopy Health Monitoring
                </h4>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded font-bold border border-cyan-500/20">
                  Radar + Optical
                </span>
              </div>

              {/* SWI Soil Moisture Telemetry */}
              <div className="bg-soil/80 border border-cyan-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Droplets className="size-4" /> Soil Water Index (SWI)
                  </span>
                  <span className="text-xs font-black text-cyan-300">{(selectedPlot.swi_mean || 0.42).toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Root-zone moisture is currently at <strong>{Math.round((selectedPlot.swi_mean || 0.42) * 100)}%</strong>. 7-day trend shows a decline rate of -0.06.
                </p>
                <div className="p-2.5 rounded-lg bg-soil/90 border border-border text-[11px] font-semibold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                  <span>Early irrigation recommended before optical canopy damage increases.</span>
                </div>
              </div>

              {/* Canopy NDVI Index */}
              <div className="bg-soil/80 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="size-4" /> NDVI Canopy Greenness
                  </span>
                  <span className="text-xs font-black text-emerald-300">{selectedPlot.ndvi_mean}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sentinel-2 10m tile resolution. Soil classification: <strong>Black Loam (ISRO Bhuvan Grid)</strong>.
                </p>
              </div>

              {/* Weather Anomaly Summary */}
              <div className="bg-soil/80 border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span>Monsoon Rainfall Deficit</span>
                  <span className="text-rose-400 font-black">42.0% Deficit</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  12 consecutive dry spell days recorded for {selectedPlot.location}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FLOATING VOICE ASSISTANT MIC BUTTON (BOTTOM-RIGHT CORNER)             */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowVoiceModal(!showVoiceModal)}
          className="size-14 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-2xl flex items-center justify-center cursor-pointer transition-all border-2 border-primary/50 hover:scale-105 active:scale-95 group relative"
          title="Voice AI Assistant (మాట్లాడండి)"
        >
          <Mic className="size-6 animate-pulse" />
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* FLOATING VOICE ASSISTANT DRAWER / MODAL */}
      {showVoiceModal && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-card border border-primary/40 rounded-2xl shadow-2xl p-5 space-y-4 animate-fade-in backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Mic className="size-5 text-primary animate-pulse" />
              <h4 className="font-bold text-sm text-foreground">FasalRakshak Voice AI</h4>
            </div>
            
            {/* Language switchers */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLanguage("TE")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${language === "TE" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                🌾 తెలుగు
              </button>
              <button
                onClick={() => setLanguage("HI")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${language === "HI" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                🇮🇳 हिंदी
              </button>
              <button
                onClick={() => setLanguage("EN")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${language === "EN" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                🇬🇧 EN
              </button>
              <button onClick={() => setShowVoiceModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-xs ml-2">
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Log */}
          <div className="max-h-64 overflow-y-auto space-y-3 pr-1 text-xs">
            {dialogue.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === "farmer" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-xl p-3 space-y-1 ${msg.sender === "farmer" ? "bg-primary text-primary-foreground" : "bg-soil/90 border border-border text-foreground"}`}>
                  <p className="leading-relaxed font-semibold">{msg.text}</p>
                  {msg.translated && <p className="text-[10px] opacity-75 italic pt-1 border-t border-current/10">Translation: {msg.translated}</p>}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Loader2 className="size-3.5 text-primary animate-spin" />
                <span>Google AI processing query...</span>
              </div>
            )}
            <div ref={dialogueEndRef} />
          </div>

          {/* Quick Triggers & Mic Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendVoiceQuery(voiceQuery);
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <input
              type="text"
              placeholder={language === "TE" ? "ప్రశ్న మాట్లాడండి లేదా టైప్ చేయండి..." : "Type query or talk..."}
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              className="flex-1 bg-soil border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!voiceQuery.trim()}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
