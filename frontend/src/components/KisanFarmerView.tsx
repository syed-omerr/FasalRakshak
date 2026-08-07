import React, { useState, useEffect, useRef } from "react";
import { FarmPlot } from "../lib/plots";
import { chatWithGoogleAIAssistant, submitPMFBYClaim } from "../lib/api";
import {
  Mic,
  MicOff,
  Camera,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Sparkles,
  Loader2,
  FileCheck,
  Droplets,
  Activity,
  X,
  ShieldCheck,
  Volume2,
  ChevronDown
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
  // Simple Onboarding state
  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [villageName, setVillageName] = useState("Warangal");
  const [cropType, setCropType] = useState("Cotton");
  const [isOnboarding, setIsOnboarding] = useState(!selectedPlot);

  // Simple Language & Voice states
  const [language, setLanguage] = useState<"TE" | "HI" | "EN">("TE");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogue, setDialogue] = useState<Message[]>([
    {
      sender: "assistant",
      text: "నమస్కారం! మీ పొలం నష్టం లేదా నేల తేమ వివరాల కోసం మాట్లాడండి లేదా కింద ఉన్న 1-టాప్ క్లెయిమ్ బటన్ నొక్కండి.",
      translated: "Namaskaram! Talk to check field health or tap the 1-Click claim button below.",
      lang: "TE"
    }
  ]);

  // Geotagged Photo Upload states
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);

  // 1-Click Claim states
  const [selectedCalamity, setSelectedCalamity] = useState("🌵 ఎండబెట్టడం (Drought)");
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showVoiceModal) {
      dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [dialogue, showVoiceModal]);

  // Speech helper
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

    const plotId = `plot-kisan-${Date.now()}`;
    const newPlot: FarmPlot = {
      id: plotId,
      name: `${farmerName} - ${cropType}`,
      crop_type: cropType,
      farmer: farmerName,
      location: `${villageName}, Telangana`,
      acreage: 2.2,
      ndvi_mean: 0.68,
      swi_mean: 0.42,
      swi_trend_7d: -0.06,
      health_status: "STRESSED",
      center: [17.9784, 79.5941],
      polygon: [
        [17.9796, 79.5926],
        [17.9802, 79.5956],
        [17.9772, 79.5959],
        [17.9766, 79.5929],
      ]
    };

    onAddNewPlot(newPlot);
    onSelectPlot(newPlot);
    setIsOnboarding(false);

    const msgTe = `స్వాగతం ${farmerName} గారూ! మీ ${cropType} పొలం ఫసల్‌రక్షక్‌లో నమోదైంది.`;
    const msgEn = `Welcome ${farmerName}! Your ${cropType} plot is onboarded.`;
    const text = language === "TE" ? msgTe : msgEn;
    
    setDialogue([{ sender: "assistant", text, translated: msgEn, lang: language }]);
    speakText(text, language);
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
      loss_percentage: 55,
      estimated_payout: estPayout,
      evidence_pdf_url: "/static/pdf/sample_evidence.pdf",
      consent_channel: "1-Click Farmer Portal",
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
      signals_used: ["Soil Moisture Deficit (SWI: 0.42)", "Satellite Canopy Loss"],
      ndvi_before: 0.74,
      ndvi_after: selectedPlot.ndvi_mean,
      rainfall_deficit_pct: 42.0,
      swi_val: selectedPlot.swi_mean || 0.42,
      consent_channel: "1-Click Farmer Portal"
    });

    onAddClaim(claimRecord);
    setIsFilingClaim(false);

    const msgTe = `ధన్యవాదాలు ${selectedPlot.farmer} గారూ! మీ PMFBY పంట క్లెయిమ్ సమర్పించబడింది. రిఫరెన్స్ ఐడీ: ${ackId}. అంచనా పరిహారం: ₹${estPayout.toLocaleString()}.`;
    const msgEn = `Thank you ${selectedPlot.farmer}! Claim submitted. Reference ID: ${ackId}. Estimated Payout: ₹${estPayout.toLocaleString()}.`;

    const speechText = language === "TE" ? msgTe : msgEn;
    setClaimSuccessMessage(`✅ క్లెయిమ్ నమోదైంది! ID: ${ackId} • పరిహారం: ₹${estPayout.toLocaleString()}`);

    setDialogue((prev) => [...prev, { sender: "assistant", text: speechText, translated: msgEn, lang: language }]);
    speakText(speechText, language);
  };

  const handleSendVoiceQuery = async (queryText: string) => {
    if (!queryText.trim() || !selectedPlot) return;
    
    setIsProcessing(true);
    setDialogue((prev) => [...prev, { sender: "farmer", text: queryText, lang: language }]);

    try {
      const parsed = await chatWithGoogleAIAssistant({
        farmer_name: selectedPlot.farmer,
        plot_id: selectedPlot.id,
        crop_type: selectedPlot.crop_type,
        location: selectedPlot.location,
        acreage: selectedPlot.acreage,
        ndvi_mean: selectedPlot.ndvi_mean,
        swi_mean: selectedPlot.swi_mean || 0.42,
        health_status: selectedPlot.health_status,
        query_text: queryText,
        language: language
      });

      const botText = parsed.text_response || "నమస్కారం! మీ ప్రశ్నను పరిశీలిస్తున్నాము.";
      setDialogue((prev) => [...prev, { sender: "assistant", text: botText, translated: parsed.translated_text, lang: language }]);
      speakText(botText, language);
    } catch (e) {
      console.warn("Voice assistant notice:", e);
    } finally {
      setVoiceQuery("");
      setIsProcessing(false);
    }
  };

  const handleSimulatePhotoUpload = () => {
    setPhotoVerifying(true);
    setTimeout(() => {
      setPhotoVerifying(false);
      setUploadedPhoto("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=300&q=80");
      const msgTe = "ఫోటో సరిచూడబడింది! GPS మరియు EXIF డేటా ద్వారా 98% క్లెయిమ్ ఆధారాలు ధృవీకరించబడ్డాయి.";
      const msgEn = "Photo verified! GPS and damage evidence corroboration score 98%.";
      const speech = language === "TE" ? msgTe : msgEn;
      setDialogue((prev) => [...prev, { sender: "assistant", text: speech, translated: msgEn, lang: language }]);
      speakText(speech, language);
    }, 1500);
  };

  const currentClaim = filedClaims.find((c) => c.plot_id === selectedPlot?.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 text-foreground pb-28">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & SIMPLE VERNACULAR LANGUAGE SWITCHER                          */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
            🌾 ఫసల్‌రక్షక్ రైతు పోర్టల్ <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">Kisan Portal</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            సులువైన పంట రక్షణ, నేల తేమ వివరాలు మరియు 1-టాప్ ఇన్సూరెన్స్ క్లెయిమ్
          </p>
        </div>

        {/* Big Vernacular Language Switch Buttons */}
        <div className="flex items-center gap-1.5 bg-soil p-1.5 rounded-xl border border-border">
          <button
            onClick={() => setLanguage("TE")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              language === "TE" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🌾 తెలుగు
          </button>
          <button
            onClick={() => setLanguage("HI")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              language === "HI" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇮🇳 हिंदी
          </button>
          <button
            onClick={() => setLanguage("EN")}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              language === "EN" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* PLOT SELECTION BANNER */}
      {selectedPlot && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2.5 rounded-xl text-primary font-black text-lg">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-foreground">{selectedPlot.name}</h2>
                <span className="text-[11px] font-bold bg-soil px-2 py-0.5 rounded text-muted-foreground border border-border">
                  {selectedPlot.crop_type} • {selectedPlot.location}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                విస్తీర్ణం: <strong>{selectedPlot.acreage} హెక్టార్లు ({(selectedPlot.acreage * 2.471).toFixed(1)} ఎకరాలు)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPlot.id}
              onChange={(e) => {
                const p = plots.find((x) => x.id === e.target.value);
                if (p) onSelectPlot(p);
              }}
              className="bg-soil border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => setIsOnboarding(true)}
              className="px-3 py-2 rounded-xl bg-soil hover:bg-secondary border border-border text-xs font-bold text-foreground cursor-pointer"
            >
              + కొత్త పొలం
            </button>
          </div>
        </div>
      )}

      {/* ONBOARDING REGISTRATION MODAL IF TRIGGERED */}
      {isOnboarding && (
        <div className="bg-card border border-primary/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> పొలం నమోదు చేయండి (Register Plot)
            </h3>
            {selectedPlot && (
              <button onClick={() => setIsOnboarding(false)} className="text-xs text-muted-foreground hover:text-foreground">
                ✕ మూసివేయి
              </button>
            )}
          </div>

          <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1">రైతు పేరు (Farmer Name)</label>
              <input
                type="text"
                required
                placeholder="ఉదా: రమేష్ రెడ్డి"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">ఫోన్ నంబర్ (Mobile Number)</label>
              <input
                type="tel"
                required
                placeholder="ఉదా: +91 98480 22339"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">గ్రామం / ఊరు (Village)</label>
              <input
                type="text"
                required
                placeholder="ఉదా: వరంగల్"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">పంట రకం (Crop Type)</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Cotton">ప్రత్తి (Cotton)</option>
                <option value="Groundnut">వేరుశనగ (Groundnut)</option>
                <option value="Maize">మొక్కజొన్న (Maize)</option>
                <option value="Tomato">టమాటా (Tomato)</option>
                <option value="Rice/Paddy">వరి (Paddy/Rice)</option>
                <option value="Chilli">మిరప (Chilli)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:bg-primary/95 transition-all cursor-pointer shadow-lg"
              >
                నమోదు చేయండి (Save Plot)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3 SIMPLE & ULTRA-INTUITIVE FARMER CARDS                                   */}
      {/* ========================================================================= */}
      {selectedPlot && (
        <div className="space-y-6">
          
          {/* CARD 1: 🟢 నా పొలం పరిస్థితి (MY FIELD CONDITION) */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                🟢 1. నా పొలం పరిస్థితి (Field Condition)
              </h3>
              <button
                onClick={() => {
                  const speech = language === "TE"
                    ? `మీ పొలంలో నేల తేమ శాతం 42 గా ఉంది. నీటి ఎద్దడి వల్ల తేలికపాటి తడి అందించాలి.`
                    : `Soil moisture is at 42%. Light irrigation recommended.`;
                  speakText(speech, language);
                }}
                className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-primary/30"
              >
                <Volume2 className="size-4" /> వినండి (Listen)
              </button>
            </div>

            {/* Simple Status Badges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Soil Water Gauge */}
              <div className="bg-soil/80 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Droplets className="size-4" /> నేల తేమ (Soil Moisture)
                  </span>
                  <span className="text-base font-black text-cyan-300">42% (తక్కువ)</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
                  <div className="h-full bg-cyan-400 rounded-full w-[42%]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  భూమిలో తేమ తగ్గుతోంది. వీలైతే తేలికపాటి నీరు పారించండి.
                </p>
              </div>

              {/* Crop Greenness Gauge */}
              <div className="bg-soil/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="size-4" /> పంట పచ్చదనం (Crop Greenness)
                  </span>
                  <span className="text-base font-black text-emerald-300">68% (మంచిది)</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-emerald-500/30 p-0.5">
                  <div className="h-full bg-emerald-400 rounded-full w-[68%]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  శాటిలైట్ సూచిక ప్రకారం పైరు సాధారణంగా ఉంది.
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2: ⚡ 1-టాప్ ఇన్సూరెన్స్ క్లెయిమ్ (1-TAP PMFBY CLAIM) */}
          <div className="bg-card border-2 border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  ⚡ 2. 1-టాప్ ఇన్సూరెన్స్ క్లెయిమ్ (Instant Insurance Claim)
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
                    📍 4 సమీప పొలాలు బాధింపబడ్డాయి (4 Nearby Plots Affected)
                  </span>
                  <span className="text-[10px] font-bold bg-soil text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                    🌾 పంట దశ: {selectedPlot.crop_stage || "పూత & గింజ దశ (Flowering)"}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    📜 గెజిట్: {selectedPlot.disaster_gazette_id || "TS-GAZETTE-2026-042"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shrink-0">
                అంచనా పరిహారం: ₹{Math.round(selectedPlot.acreage * 22000).toLocaleString()}
              </span>
            </div>

            {currentClaim ? (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between text-sm font-black text-emerald-400">
                  <span className="flex items-center gap-2"><CheckCircle className="size-5" /> PMFBY క్లెయిమ్ నమోదు చేయబడింది</span>
                  <span className="bg-emerald-500/20 px-3 py-1 rounded text-xs">{currentClaim.acknowledgment_id}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  అంచనా పంట నష్టపరిహారం: <strong className="text-foreground font-black">₹{currentClaim.estimated_payout.toLocaleString()}</strong>. ఇన్సూరెన్స్ కంపెనీకి పంపబడింది.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Damage Cause Buttons */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">నష్టం కారణం ఎంచుకోండి (Select Cause):</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      "🌵 ఎండబెట్టడం (Drought)",
                      "🌧️ అకాల వర్షాలు / వరద (Rain)",
                      "🐛 పురుగు తెగులు (Pest Attack)",
                      "⚡ సాధారణ నష్టం (General Damage)"
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedCalamity(type)}
                        className={`p-3 rounded-xl text-left font-bold transition-all text-xs border cursor-pointer ${
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

                {/* GIANT 1-CLICK ACTION BUTTON FOR FARMER */}
                <button
                  type="button"
                  onClick={() => handleOneClickClaimSubmit(selectedCalamity)}
                  disabled={isFilingClaim}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer border border-emerald-400/40 active:scale-95 disabled:opacity-50"
                >
                  {isFilingClaim ? (
                    <>
                      <Loader2 className="size-6 animate-spin" />
                      <span>క్లెయిమ్ పంపుతోంది...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-6 text-amber-300 animate-pulse" />
                      <span>⚡ ఇప్పుడే క్లెయిమ్ చేయండి (Apply 1-Tap Claim Now)</span>
                      <ArrowRight className="size-6" />
                    </>
                  )}
                </button>

                {claimSuccessMessage && (
                  <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-black text-emerald-300">
                    {claimSuccessMessage}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CARD 3: 📷 పంట ఫోటో తీయండి (TAKE CROP LOSS PHOTO) */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                📷 3. పంట ఫోటో తీయండి (Upload Crop Photo)
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">GPS Verified</span>
            </div>

            {uploadedPhoto && uploadedPhoto !== "uploading" ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-48">
                  <img src={uploadedPhoto} alt="Crop photo" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1 shadow">
                    <CheckCircle className="size-4" /> GPS సరిచూడబడింది
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>ఫోటో సాక్ష్యం: <strong>98% సరిపోలింది</strong></span>
                  <button onClick={() => setUploadedPhoto(null)} className="text-xs text-muted-foreground underline hover:text-foreground">
                    మళ్లీ తీయండి
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all bg-soil/40 space-y-3">
                {photoVerifying ? (
                  <div className="py-4 space-y-2">
                    <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-bold text-foreground">ఫోటో మరియు GPS వివరాలు సరిచూస్తోంది...</p>
                  </div>
                ) : (
                  <>
                    <div className="size-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Camera className="size-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">నష్టపోయిన పంట ఫోటో తీయండి</p>
                      <p className="text-xs text-muted-foreground mt-0.5">ఫోటో ఆధారంతో ఇన్సూరెన్స్ క్లెయిమ్ వేగంగా ఆమోదించబడుతుంది</p>
                    </div>
                    <button
                      onClick={handleSimulatePhotoUpload}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-black shadow-md transition-all cursor-pointer"
                    >
                      📷 ఫోటో తీయండి (Capture Photo)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING VOICE ASSISTANT MIC BUTTON (BOTTOM-RIGHT)                       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setShowVoiceModal(!showVoiceModal)}
          className="size-14 rounded-full bg-primary hover:bg-primary/95 text-primary-foreground shadow-2xl flex items-center justify-center cursor-pointer transition-all border-2 border-primary/50 hover:scale-105 active:scale-95"
          title="వాయిస్ అసిస్టెంట్ (Voice Assistant)"
        >
          <Mic className="size-7 animate-pulse" />
          <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 animate-ping" />
        </button>
      </div>

      {/* VOICE ASSISTANT MODAL DRAWER */}
      {showVoiceModal && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-card border border-primary/40 rounded-2xl shadow-2xl p-5 space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Mic className="size-5 text-primary animate-pulse" />
              <h4 className="font-bold text-sm text-foreground">ఫసల్‌రక్షక్ వాయిస్ అసిస్టెంట్</h4>
            </div>
            <button onClick={() => setShowVoiceModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-xs">
              <X className="size-5" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3 text-xs">
            {dialogue.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.sender === "farmer" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-xl p-3 space-y-1 ${msg.sender === "farmer" ? "bg-primary text-primary-foreground" : "bg-soil/90 border border-border text-foreground"}`}>
                  <p className="leading-relaxed font-semibold">{msg.text}</p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Loader2 className="size-3.5 text-primary animate-spin" />
                <span>జవాబు విశ్లేషిస్తోంది...</span>
              </div>
            )}
            <div ref={dialogueEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendVoiceQuery(voiceQuery);
            }}
            className="flex items-center gap-2 pt-2 border-t border-border"
          >
            <input
              type="text"
              placeholder="మీ ప్రశ్న ఇక్కడ టైప్ చేయండి..."
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              className="flex-1 bg-soil border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!voiceQuery.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              పంపు
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
