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
  Volume2
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

const LOCALIZED_TEXT = {
  TE: {
    portalTitle: "ఫసల్‌రక్షక్ రైతు పోర్టల్",
    portalSubtitle: "సులువైన పంట రక్షణ, నేల తేమ వివరాలు మరియు 1-టాప్ ఇన్సూరెన్స్ క్లెయిమ్",
    area: "విస్తీర్ణం",
    acres: "ఎకరాలు",
    hectares: "హెక్టార్లు",
    newPlot: "+ కొత్త పొలం",
    fieldConditionTitle: "🟢 1. నా పొలం పరిస్థితి",
    listenBtn: "వినండి",
    soilMoistureLabel: "నేల తేమ (Soil Moisture)",
    soilMoistureStatus: "42% (తక్కువ)",
    soilAdvice: "భూమిలో తేమ తగ్గుతోంది. వీలైతే తేలికపాటి నీరు పారించండి.",
    cropGreennessLabel: "పంట పచ్చదనం (Crop Greenness)",
    cropGreennessStatus: "68% (మంచిది)",
    cropGreennessAdvice: "శాటిలైట్ సూచిక ప్రకారం పైరు సాధారణంగా ఉంది.",
    claimCardTitle: "⚡ 2. 1-టాప్ ఇన్సూరెన్స్ క్లెయిమ్",
    claimCardSubtitle: "పంట నష్టం లేదా ఎండబెట్టడం జరిగితే బటన్ నొక్కి ఇన్సూరెన్స్ దరఖాస్తు చేయండి",
    estPayout: "అంచనా పరిహారం",
    claimFiledSuccess: "PMFBY క్లెయిమ్ నమోదు చేయబడింది",
    claimFiledMsg: "అంచనా పంట నష్టపరిహారం: ₹{payout}. ఇన్సూరెన్స్ కంపెనీకి పంపబడింది.",
    selectCause: "నష్టం కారణం ఎంచుకోండి:",
    calamities: [
      "🌵 ఎండబెట్టడం (Drought)",
      "🌧️ అకాల వర్షాలు / వరద (Rain)",
      "🐛 పురుగు తెగులు (Pest Attack)",
      "⚡ సాధారణ నష్టం (General Damage)"
    ],
    submitClaimBtn: "⚡ ఇప్పుడే క్లెయిమ్ చేయండి (Apply 1-Tap Claim)",
    submittingBtn: "క్లెయిమ్ పంపుతోంది...",
    photoTitle: "📷 3. పంట ఫోటో తీయండి",
    photoVerified: "GPS సరిచూడబడింది",
    photoSuccess: "ఫోటో సాక్ష్యం: 98% సరిపోలింది",
    retakePhoto: "మళ్లీ తీయండి",
    takePhotoSub: "నష్టపోయిన పంట ఫోటో తీయండి",
    takePhotoHint: "ఫోటో ఆధారంతో ఇన్సూరెన్స్ క్లెయిమ్ వేగంగా ఆమోదించబడుతుంది",
    takePhotoBtn: "📷 ఫోటో తీయండి (Capture Photo)",
    verifyingPhoto: "ఫోటో మరియు GPS వివరాలు సరిచూస్తోంది...",
    nearbyPlotsAffected: "4 సమీప పొలాలు బాధింపబడ్డాయి",
    cropStage: "పంట దశ",
    gazetteNotice: "గెజిట్",
    voiceTitle: "ఫసల్‌రక్షక్ వాయిస్ అసిస్టెంట్",
    voicePlaceholder: "మీ ప్రశ్న ఇక్కడ టైప్ చేయండి...",
    send: "పంపు",
    voiceProcessing: "జవాబు విశ్లేషిస్తోంది...",
    welcomeGreeting: "నమస్కారం! మీ పొలం నష్టం లేదా నేల తేమ వివరాల కోసం మాట్లాడండి లేదా కింద ఉన్న 1-టాప్ క్లెయిమ్ బటన్ నొక్కండి.",
    registerPlotTitle: "పొలం నమోదు చేయండి",
    farmerNameLabel: "రైతు పేరు",
    phoneLabel: "ఫోన్ నంబర్",
    villageLabel: "గ్రామం / ఊరు",
    cropTypeLabel: "పంట రకం",
    savePlotBtn: "నమోదు చేయండి",
    closeBtn: "మూసివేయి"
  },
  HI: {
    portalTitle: "फसलरक्षक किसान पोर्टल",
    portalSubtitle: "सरल फसल सुरक्षा, मिट्टी की नमी की जानकारी और 1-क्लिक बीमा दावा",
    area: "क्षेत्रफल",
    acres: "एकड़",
    hectares: "हेक्टेयर",
    newPlot: "+ नया खेत जोड़ें",
    fieldConditionTitle: "🟢 1. मेरे खेत की स्थिति",
    listenBtn: "सुनें",
    soilMoistureLabel: "मिट्टी की नमी (Soil Moisture)",
    soilMoistureStatus: "42% (कम)",
    soilAdvice: "मिट्टी में नमी कम हो रही है। यदि संभव हो तो हल्की सिंचाई करें।",
    cropGreennessLabel: "फसल की हरियाली (Crop Greenness)",
    cropGreennessStatus: "68% (अच्छा)",
    cropGreennessAdvice: "सैटेलाइट सूचकांक के अनुसार फसल की स्थिति सामान्य है।",
    claimCardTitle: "⚡ 2. 1-क्लिक बीमा दावा",
    claimCardSubtitle: "फसल नुकसान या सूखा होने पर तुरंत बीमा आवेदन करें",
    estPayout: "अनुमानित राशि",
    claimFiledSuccess: "PMFBY दावा दर्ज किया गया",
    claimFiledMsg: "अनुमानित फसल क्षतिपूर्ति: ₹{payout}। बीमा कंपनी को भेजा गया।",
    selectCause: "नुकसान का कारण चुनें:",
    calamities: [
      "🌵 सूखा व नमी की कमी (Drought)",
      "🌧️ बेमौसम बारिश / बाढ़ (Rain/Flood)",
      "🐛 कीड़ा व रोग का प्रकोप (Pest Attack)",
      "⚡ सामान्य फसल क्षति (General Damage)"
    ],
    submitClaimBtn: "⚡ अभी बीमा दावा दर्ज करें (Apply 1-Tap Claim)",
    submittingBtn: "दावा जमा किया जा रहा है...",
    photoTitle: "📷 3. फसल का फोटो अपलोड करें",
    photoVerified: "GPS सत्यापित",
    photoSuccess: "फोटो साक्ष्य: 98% मिलान",
    retakePhoto: "पुनः फोटो लें",
    takePhotoSub: "क्षतिग्रस्त फसल का फोटो खींचें",
    takePhotoHint: "फोटो साक्ष्य से बीमा दावा तेजी से स्वीकृत होता है",
    takePhotoBtn: "📷 फोटो खींचें (Capture Photo)",
    verifyingPhoto: "फोटो और GPS विवरण सत्यापित किया जा रहा है...",
    nearbyPlotsAffected: "4 पास के खेत प्रभावित",
    cropStage: "फसल की अवस्था",
    gazetteNotice: "राजपत्र अधिसूचना",
    voiceTitle: "फसलरक्षक वॉयस असिस्टेंट",
    voicePlaceholder: "अपना प्रश्न यहाँ टाइप करें...",
    send: "भेजें",
    voiceProcessing: "उत्तर का विश्लेषण किया जा रहा है...",
    welcomeGreeting: "नमस्ते! अपने खेत की स्थिति जानने या दावा दर्ज करने के लिए बोलें या 1-क्लिक बटन दबाएं।",
    registerPlotTitle: "खेत दर्ज करें",
    farmerNameLabel: "किसान का नाम",
    phoneLabel: "मोबाइल नंबर",
    villageLabel: "गाँव / ब्लॉक",
    cropTypeLabel: "फसल का प्रकार",
    savePlotBtn: "दर्ज करें",
    closeBtn: "बंद करें"
  },
  EN: {
    portalTitle: "FasalRakshak Kisan Protection Portal",
    portalSubtitle: "Precision Satellite & Soil Moisture Telemetry • 1-Tap PMFBY Insurance Claims Engine",
    area: "Plot Acreage",
    acres: "Acres",
    hectares: "Hectares",
    newPlot: "+ Register Plot",
    fieldConditionTitle: "🟢 1. Field Health & Soil Water Status",
    listenBtn: "Listen Audio",
    soilMoistureLabel: "Soil Water Index (SWI)",
    soilMoistureStatus: "42% (Moisture Stress)",
    soilAdvice: "Soil water deficit detected. Light irrigation recommended before canopy stress increases.",
    cropGreennessLabel: "Canopy NDVI Greenness",
    cropGreennessStatus: "68% (Optimal)",
    cropGreennessAdvice: "Sentinel-2 optical satellite data shows normal vegetation canopy index.",
    claimCardTitle: "⚡ 2. 1-Tap PMFBY Insurance Claim Application",
    claimCardSubtitle: "Apply instantly if crop yield is threatened or damaged by calamity or moisture stress.",
    estPayout: "Estimated Compensation Payout",
    claimFiledSuccess: "PMFBY Claim Filed & Submitted to Insurer",
    claimFiledMsg: "Estimated payout: ₹{payout}. Evidence packet routed to insurer queue.",
    selectCause: "Select Damage Cause / Calamity:",
    calamities: [
      "🌵 Drought & Moisture Stress",
      "🌧️ Unseasonal Rain & Flood",
      "🐛 Pest Outbreak / Blight",
      "⚡ General Crop Damage"
    ],
    submitClaimBtn: "⚡ Apply 1-Tap PMFBY Claim Now",
    submittingBtn: "Submitting claim packet to insurer...",
    photoTitle: "📷 3. Geotagged Field Photo Evidence",
    photoVerified: "GPS & Time Verified",
    photoSuccess: "Ground-truth Evidence Match: 98% Corroborated",
    retakePhoto: "Re-upload Photo",
    takePhotoSub: "Upload Geotagged Crop Loss Photo",
    takePhotoHint: "GPS EXIF photo evidence attaches directly to your PMFBY claim report",
    takePhotoBtn: "📷 Capture Field Photo",
    verifyingPhoto: "Auditing EXIF GPS coordinates and damage score...",
    nearbyPlotsAffected: "4 Nearby Plots Affected",
    cropStage: "Crop Stage",
    gazetteNotice: "Govt Gazette",
    voiceTitle: "FasalRakshak Voice AI Assistant",
    voicePlaceholder: "Type your query or talk...",
    send: "Send",
    voiceProcessing: "Google AI analyzing query...",
    welcomeGreeting: "Welcome! Speak or type to query plot health or submit your 1-Tap PMFBY claim.",
    registerPlotTitle: "Register New Plot",
    farmerNameLabel: "Farmer Name",
    phoneLabel: "Mobile Number",
    villageLabel: "Village / Mandal",
    cropTypeLabel: "Crop Type",
    savePlotBtn: "Save Plot",
    closeBtn: "Close"
  }
};

export function KisanFarmerView({
  plots,
  onAddNewPlot,
  onSelectPlot,
  selectedPlot,
  onAddClaim,
  filedClaims
}: KisanFarmerViewProps) {
  // Onboarding state
  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [villageName, setVillageName] = useState("Warangal");
  const [cropType, setCropType] = useState("Cotton");
  const [isOnboarding, setIsOnboarding] = useState(!selectedPlot);

  // Language & Voice states
  const [language, setLanguage] = useState<"TE" | "HI" | "EN">("TE");
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const t = LOCALIZED_TEXT[language];

  const [dialogue, setDialogue] = useState<Message[]>([
    {
      sender: "assistant",
      text: t.welcomeGreeting,
      translated: LOCALIZED_TEXT.EN.welcomeGreeting,
      lang: "TE"
    }
  ]);

  // Photo & Claim states
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);
  const [selectedCalamity, setSelectedCalamity] = useState(t.calamities[0]);
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  // Update calamity default when language switches
  useEffect(() => {
    setSelectedCalamity(LOCALIZED_TEXT[language].calamities[0]);
  }, [language]);

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
      sowing_date: "2026-06-15",
      crop_stage: "Flowering & Grain Filling",
      cluster_plots_affected: 4,
      disaster_gazette_id: "TS-GAZETTE-2026-WARANGAL-042",
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

    const speech = language === "TE"
      ? `స్వాగతం ${farmerName} గారూ! మీ ${cropType} పొలం ఫసల్‌రక్షక్‌లో నమోదైంది.`
      : language === "HI"
      ? `स्वागत है ${farmerName} जी! आपका ${cropType} खेत पंजीकृत हो गया है।`
      : `Welcome ${farmerName}! Your ${cropType} plot is registered.`;

    setDialogue([{ sender: "assistant", text: speech, translated: LOCALIZED_TEXT.EN.welcomeGreeting, lang: language }]);
    speakText(speech, language);
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

    const speechText = language === "TE"
      ? `ధన్యవాదాలు ${selectedPlot.farmer} గారూ! మీ PMFBY పంట క్లెయిమ్ సమర్పించబడింది. ఐడీ: ${ackId}. అంచనా పరిహారం: ₹${estPayout.toLocaleString()}.`
      : language === "HI"
      ? `धन्यवाद ${selectedPlot.farmer} जी! आपका बीमा दावा जमा कर दिया गया है। संदर्भ संख्या: ${ackId}। अनुमानित राशि: ₹${estPayout.toLocaleString()}।`
      : `Thank you ${selectedPlot.farmer}! Your PMFBY claim has been filed. Ack ID: ${ackId}. Estimated payout: ₹${estPayout.toLocaleString()}.`;

    setClaimSuccessMessage(`✅ ${t.claimFiledSuccess}! ID: ${ackId} • ₹${estPayout.toLocaleString()}`);
    setDialogue((prev) => [...prev, { sender: "assistant", text: speechText, translated: LOCALIZED_TEXT.EN.welcomeGreeting, lang: language }]);
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

      const botText = parsed.text_response || t.welcomeGreeting;
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
      const speech = t.photoSuccess;
      setDialogue((prev) => [...prev, { sender: "assistant", text: speech, translated: LOCALIZED_TEXT.EN.photoSuccess, lang: language }]);
      speakText(speech, language);
    }, 1500);
  };

  const currentClaim = filedClaims.find((c) => c.plot_id === selectedPlot?.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6 text-foreground pb-28">
      
      {/* ========================================================================= */}
      {/* TOP HEADER & FULLY DYNAMIC VERNACULAR LANGUAGE SWITCHER                    */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
            🌾 {t.portalTitle} <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">Kisan Portal</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t.portalSubtitle}
          </p>
        </div>

        {/* Dynamic Vernacular Language Switch Buttons */}
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
                {t.area}: <strong>{selectedPlot.acreage} {t.hectares} ({(selectedPlot.acreage * 2.471).toFixed(1)} {t.acres})</strong>
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
              {t.newPlot}
            </button>
          </div>
        </div>
      )}

      {/* ONBOARDING REGISTRATION MODAL IF TRIGGERED */}
      {isOnboarding && (
        <div className="bg-card border border-primary/40 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> {t.registerPlotTitle}
            </h3>
            {selectedPlot && (
              <button onClick={() => setIsOnboarding(false)} className="text-xs text-muted-foreground hover:text-foreground">
                ✕ {t.closeBtn}
              </button>
            )}
          </div>

          <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1">{t.farmerNameLabel}</label>
              <input
                type="text"
                required
                placeholder="Ramesh Reddy"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">{t.phoneLabel}</label>
              <input
                type="tel"
                required
                placeholder="+91 98480 22339"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">{t.villageLabel}</label>
              <input
                type="text"
                required
                placeholder="Warangal"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1">{t.cropTypeLabel}</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Cotton">Cotton (ప్రత్తి / कपास)</option>
                <option value="Groundnut">Groundnut (వేరుశనగ / मूंगफली)</option>
                <option value="Maize">Maize (మొక్కజొన్న / मक्का)</option>
                <option value="Tomato">Tomato (టమాటా / टमाटर)</option>
                <option value="Rice/Paddy">Rice (వరి / चावल)</option>
                <option value="Chilli">Chilli (మిరప / मिर्च)</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:bg-primary/95 transition-all cursor-pointer shadow-lg"
              >
                {t.savePlotBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DYNAMIC LOCALIZED FARMER CARDS                                            */}
      {/* ========================================================================= */}
      {selectedPlot && (
        <div className="space-y-6">
          
          {/* CARD 1: FIELD CONDITION */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                {t.fieldConditionTitle}
              </h3>
              <button
                onClick={() => {
                  speakText(t.soilAdvice, language);
                }}
                className="p-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-primary/30"
              >
                <Volume2 className="size-4" /> {t.listenBtn}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Soil Water Gauge */}
              <div className="bg-soil/80 border border-cyan-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-cyan-400 flex items-center gap-1.5">
                    <Droplets className="size-4" /> {t.soilMoistureLabel}
                  </span>
                  <span className="text-base font-black text-cyan-300">{t.soilMoistureStatus}</span>
                </div>
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-cyan-500/30 p-0.5">
                  <div className="h-full bg-cyan-400 rounded-full w-[42%]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.soilAdvice}
                </p>
              </div>

              {/* Crop Greenness Gauge */}
              <div className="bg-soil/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                    <Activity className="size-4" /> {t.cropGreennessLabel}
                  </span>
                  <span className="text-base font-black text-emerald-300">{t.cropGreennessStatus}</span>
                </div>
                <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-emerald-500/30 p-0.5">
                  <div className="h-full bg-emerald-400 rounded-full w-[68%]" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.cropGreennessAdvice}
                </p>
              </div>
            </div>
          </div>

          {/* CARD 2: 1-TAP INSURANCE CLAIM */}
          <div className="bg-card border-2 border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  {t.claimCardTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-md">
                    📍 {t.nearbyPlotsAffected}
                  </span>
                  <span className="text-[10px] font-bold bg-soil text-muted-foreground border border-border px-2 py-0.5 rounded-md">
                    🌾 {t.cropStage}: {selectedPlot.crop_stage || "Flowering & Grain Filling"}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    📜 {t.gazetteNotice}: {selectedPlot.disaster_gazette_id || "TS-GAZETTE-2026-042"}
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full shrink-0">
                {t.estPayout}: ₹{Math.round(selectedPlot.acreage * 22000).toLocaleString()}
              </span>
            </div>

            {currentClaim ? (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-5 space-y-2">
                <div className="flex items-center justify-between text-sm font-black text-emerald-400">
                  <span className="flex items-center gap-2"><CheckCircle className="size-5" /> {t.claimFiledSuccess}</span>
                  <span className="bg-emerald-500/20 px-3 py-1 rounded text-xs">{currentClaim.acknowledgment_id}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.claimFiledMsg.replace("{payout}", currentClaim.estimated_payout.toLocaleString())}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-muted-foreground">{t.selectCause}</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {t.calamities.map((type) => (
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

                <button
                  type="button"
                  onClick={() => handleOneClickClaimSubmit(selectedCalamity)}
                  disabled={isFilingClaim}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-base shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer border border-emerald-400/40 active:scale-95 disabled:opacity-50"
                >
                  {isFilingClaim ? (
                    <>
                      <Loader2 className="size-6 animate-spin" />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-6 text-amber-300 animate-pulse" />
                      <span>{t.submitClaimBtn}</span>
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

          {/* CARD 3: TAKE CROP PHOTO */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                {t.photoTitle}
              </h3>
              <span className="text-xs text-muted-foreground font-semibold">{t.photoVerified}</span>
            </div>

            {uploadedPhoto && uploadedPhoto !== "uploading" ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-48">
                  <img src={uploadedPhoto} alt="Crop photo" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1 shadow">
                    <CheckCircle className="size-4" /> {t.photoVerified}
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>{t.photoSuccess}</span>
                  <button onClick={() => setUploadedPhoto(null)} className="text-xs text-muted-foreground underline hover:text-foreground">
                    {t.retakePhoto}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/50 transition-all bg-soil/40 space-y-3">
                {photoVerifying ? (
                  <div className="py-4 space-y-2">
                    <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                    <p className="text-xs font-bold text-foreground">{t.verifyingPhoto}</p>
                  </div>
                ) : (
                  <>
                    <div className="size-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <Camera className="size-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.takePhotoSub}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.takePhotoHint}</p>
                    </div>
                    <button
                      onClick={handleSimulatePhotoUpload}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-black shadow-md transition-all cursor-pointer"
                    >
                      {t.takePhotoBtn}
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
          title={t.voiceTitle}
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
              <h4 className="font-bold text-sm text-foreground">{t.voiceTitle}</h4>
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
                <span>{t.voiceProcessing}</span>
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
              placeholder={t.voicePlaceholder}
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              className="flex-1 bg-soil border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!voiceQuery.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {t.send}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
