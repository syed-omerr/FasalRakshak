import React, { useState, useEffect, useRef } from "react";
import { FarmPlot } from "../lib/plots";
import {
  Mic,
  MicOff,
  Camera,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  HelpCircle,
  Compass,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Loader2,
  FileCheck
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
  lang: "TE" | "EN";
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

  // Audio / Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"TE" | "EN">("TE");
  const [voiceQuery, setVoiceQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogue, setDialogue] = useState<Message[]>([
    {
      sender: "assistant",
      text: "నమస్కారం! నేను ఫసల్ రక్షక్ వాయిస్ అసిస్టెంట్. మీ పొలం ఆరోగ్యం తెలుసుకోవడానికి 'నా పొలం ఎలా ఉంది?' అని అడగండి.",
      translated: "Namaskaram! I am FasalRakshak Voice Assistant. To check field health, ask 'How is my field?'",
      lang: "TE"
    }
  ]);

  // Geotagged Photo Upload states
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue]);

  // Browser speech synthesis vocalizer helper
  const speakText = (text: string, langCode: "TE" | "EN") => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === "TE" ? "te-IN" : "en-IN";
      // Slightly slower speed for clearer speech
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

    // Initial greeting
    const welcomeMsg = `Welcome registered! Hello ${farmerName}, your ${cropType} plot has been onboarded in ${villageName}.`;
    const welcomeMsgTe = `రిజిస్ట్రేషన్ విజయవంతమైంది! నమస్కారం ${farmerName} గారు, మీ ${cropType} పంట నమోదు చేయబడింది.`;
    
    setDialogue([
      {
        sender: "assistant",
        text: language === "TE" ? welcomeMsgTe : welcomeMsg,
        translated: language === "TE" ? welcomeMsg : welcomeMsgTe,
        lang: language
      }
    ]);
    speakText(language === "TE" ? welcomeMsgTe : welcomeMsg, language);
  };

  const handleSendVoiceQuery = async (queryText: string) => {
    if (!queryText.trim() || !selectedPlot) return;
    
    setIsListening(false);
    setIsProcessing(true);
    
    // Add farmer speech bubble
    setDialogue((prev) => [
      ...prev,
      {
        sender: "farmer",
        text: queryText,
        lang: language
      }
    ]);

    try {
      const res = await fetch("http://localhost:8000/api/kisan/voice-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryText,
          plot_id: selectedPlot.id,
          language: language
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDialogue((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: data.text_response,
            translated: data.translated_text,
            lang: language
          }
        ]);
        
        speakText(data.text_response, language);

        // If intent was CLAIM, trigger mock claim integration locally
        if (data.intent_detected === "CLAIM") {
          const ackId = `PMFBY-TEL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
          const nowStr = new Date().toLocaleString();
          
          const claimObj = {
            farmer_id: "FARMER-KISAN",
            plot_id: selectedPlot.id,
            farmer_name: selectedPlot.farmer,
            location: selectedPlot.location,
            crop_type: selectedPlot.crop_type,
            damage_score: selectedPlot.health_status === "STRESSED" ? 0.35 : 0.65,
            confidence_pct: photoVerified ? 98.0 : 88.5,
            evidence_pdf_url: `/static/pdf/evidence_${selectedPlot.id}.pdf`,
            consent_channel: "Kisan Voice Confirmation",
            consent_timestamp: nowStr,
            acknowledgment_id: ackId,
            submitted_at: nowStr,
            status: "APPROVED_BY_INSURER"
          };
          onAddClaim(claimObj);
        }
      } else {
        throw new Error("API Offline");
      }
    } catch (err) {
      // Local High-Fidelity Voice assistant simulation if backend is offline
      setTimeout(() => {
        let textResponse = "";
        let translatedText = "";
        const qLower = queryText.toLowerCase();

        const isHealth = qLower.includes("health") || qLower.includes("field") || qLower.includes("polam") || qLower.includes("ఆరోగ్యం") || qLower.includes("పొలం");
        const isClaim = qLower.includes("claim") || qLower.includes("file") || qLower.includes("సమర్పించు") || qLower.includes("క్లెయిమ్") || qLower.includes("అప్లై");
        const isStatus = qLower.includes("status") || qLower.includes("check") || qLower.includes("స్థితి");

        if (isHealth) {
          if (selectedPlot.health_status === "HEALTHY") {
            textResponse = `మీ ${selectedPlot.crop_type} పొలం పచ్చగా మరియు క్షేమంగా ఉంది (NDVI: ${selectedPlot.ndvi_mean}). ఎటువంటి తెగులు నష్టం లేదు.`;
            translatedText = `Your ${selectedPlot.crop_type} field is healthy and safe (NDVI: ${selectedPlot.ndvi_mean}). There is no crop loss detected.`;
          } else if (selectedPlot.health_status === "MODERATE" || selectedPlot.health_status === "STRESSED") {
            textResponse = `హెచ్చరిక: మీ ${selectedPlot.crop_type} పొలంలో తేమ శాతం పడిపోయింది (NDVI: ${selectedPlot.ndvi_mean}). సలహా: నీటి తడులు త్వరగా అందించండి.`;
            translatedText = `Warning: Moisture dryness stress detected in your ${selectedPlot.crop_type} field (NDVI: ${selectedPlot.ndvi_mean}). Advisory: Please irrigate immediately.`;
          } else {
            textResponse = `తీవ్ర పంట నష్టం: పచ్చదనం సూచీ ${selectedPlot.ndvi_mean} కు పడిపోయింది. క్లెయిమ్ ఫైల్ చేయడానికి 'నా పంట నష్టం క్లెయిమ్ సమర్పించు' అని చెప్పండి.`;
            translatedText = `Critical damage: Vegetation index dropped to ${selectedPlot.ndvi_mean}. Say 'File my crop loss claim now' to submit.`;
          }
        } else if (isClaim) {
          const isFiled = filedClaims.some((c) => c.plot_id === selectedPlot.id);
          if (isFiled) {
            const registeredClaim = filedClaims.find((c) => c.plot_id === selectedPlot.id);
            textResponse = `మీ పంట నష్టం క్లెయిమ్ ఇప్పటికే సమర్పించబడింది. రిఫరెన్స్ సంఖ్య: {registeredClaim.acknowledgment_id}.`;
            translatedText = `Your crop loss claim has already been filed. Reference number is {registeredClaim.acknowledgment_id}.`;
          } else {
            const ackId = `PMFBY-TEL-2026-${Math.floor(10000 + Math.random() * 90000)}`;
            const nowStr = new Date().toLocaleString();
            textResponse = `సరే, నేను మీ క్లెయిమ్ ఫైల్ చేసాను. మీ క్లెయిమ్ రిఫరెన్స్ సంఖ్య: ${ackId}.`;
            translatedText = `Ok, I have submitted your crop loss claim. Your claim reference number is ${ackId}.`;

            const claimObj = {
              farmer_id: "FARMER-KISAN-DEMO",
              plot_id: selectedPlot.id,
              farmer_name: selectedPlot.farmer,
              location: selectedPlot.location,
              crop_type: selectedPlot.crop_type,
              damage_score: 0.65,
              confidence_pct: photoVerified ? 98.0 : 85.0,
              evidence_pdf_url: "#",
              consent_channel: "Kisan Spoken Voice (Demo)",
              consent_timestamp: nowStr,
              acknowledgment_id: ackId,
              submitted_at: nowStr,
              status: "APPROVED_BY_INSURER"
            };
            onAddClaim(claimObj);
          }
        } else if (isStatus) {
          const registeredClaim = filedClaims.find((c) => c.plot_id === selectedPlot.id);
          if (registeredClaim) {
            const status = registeredClaim.status;
            if (status === "APPROVED_BY_INSURER") {
              textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) భీమా సంస్థ ఆమోదించింది.`;
              translatedText = `Your claim (${registeredClaim.acknowledgment_id}) has been approved by the insurer.`;
            } else if (status === "REJECTED_BY_INSURER") {
              textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) భీమా సంస్థ తిరస్కరించింది. మీరు DLMC కి అప్పీలు చేయవచ్చు.`;
              translatedText = `Your claim (${registeredClaim.acknowledgment_id}) was rejected by the insurer. You can appeal to DLMC.`;
            } else {
              textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) ప్రస్తుతం DLMC కమిటీ సమీక్షలో ఉంది.`;
              translatedText = `Your claim (${registeredClaim.acknowledgment_id}) is currently under review by the DLMC committee.`;
            }
          } else {
            textResponse = `ఈ పొలానికి ఇంకా క్లెయిమ్ చేయబడలేదు. పంట నష్టం ఉంటే సమర్పించడానికి సమ్మతి ఇవ్వండి.`;
            translatedText = `No claim has been filed yet. Provide consent to submit if there is crop damage.`;
          }
        } else {
          textResponse = `క్షమించండి, నాకు అర్ధం కాలేదు. దయచేసి 'నా పొలం ఆరోగ్యం ఎలా ఉంది?' లేదా 'క్లెయిమ్ సమర్పించు' అని చెప్పండి.`;
          translatedText = `Sorry, I did not catch that. Please say 'How is my field health?' or 'File my claim'.`;
        }

        setDialogue((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: language === "TE" ? textResponse : translatedText,
            translated: language === "TE" ? translatedText : textResponse,
            lang: language
          }
        ]);
        speakText(language === "TE" ? textResponse : translatedText, language);
      }, 1000);
    } finally {
      setVoiceQuery("");
      setIsProcessing(false);
    }
  };

  const handleSimulatePhotoUpload = () => {
    setPhotoVerifying(true);
    setPhotoVerified(false);
    setUploadedPhoto("uploading");

    setTimeout(() => {
      setPhotoVerifying(false);
      setPhotoVerified(true);
      setUploadedPhoto("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=300&q=80"); // Crop loss field photo
      
      const successTe = "పంట ఫోటో మరియు జియోట్యాగ్ విజయవంతంగా ధృవీకరించబడ్డాయి! విశ్వసనీయత స్కోరు 98% కి పెరిగింది.";
      const successEn = "Geotagged field photo successfully verified! Confidence score boosted to 98%.";
      
      setDialogue((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: language === "TE" ? successTe : successEn,
          translated: language === "TE" ? successEn : successTe,
          lang: language
        }
      ]);
      speakText(language === "TE" ? successTe : successEn, language);
    }, 2000);
  };

  const currentClaim = filedClaims.find((c) => c.plot_id === selectedPlot?.id);

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-10 md:px-10 space-y-8 animate-fade-in">
      {/* Product Switcher Header Banner */}
      <div className="bg-soil/80 border border-primary/20 backdrop-blur-md rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2.5 rounded-lg border border-primary/40 text-primary">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              FasalRakshak Kisan <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">Farmer Product</span>
            </h2>
            <p className="text-xs text-muted-foreground">Spoken agronomic warning assistants and 1-tap automated crop insurance in Telugu.</p>
          </div>
        </div>

        {selectedPlot && (
          <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-1.5 rounded-lg text-xs">
            <User className="size-4 text-primary" />
            <span>Active Farmer: <strong className="text-foreground">{selectedPlot.farmer}</strong></span>
            <span className="text-muted-foreground">•</span>
            <MapPin className="size-3.5 text-muted-foreground" />
            <span>{selectedPlot.location}</span>
          </div>
        )}
      </div>

      {isOnboarding ? (
        /* guided plot onboarding setup form */
        <div className="max-w-xl mx-auto rounded-xl border border-border bg-card shadow-2xl p-6 md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-foreground"> guided Plot Onboarding</h3>
            <p className="text-xs text-muted-foreground">Register your field to get warnings in Telugu and verify PMFBY claims.</p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Farmer Full Name (రైతు పేరు)</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Reddy"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Mobile Number (మొబైల్ సంఖ్య)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98480 22339"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Village / Mandal (గ్రామము)</label>
                <input
                  type="text"
                  required
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Crop Type (పంట రకం)</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
                >
                  <option value="Cotton">Cotton (పత్తి)</option>
                  <option value="Groundnut">Groundnut (వేరుశనగ)</option>
                  <option value="Maize">Maize (మొక్కజొన్న)</option>
                  <option value="Tomato">Tomato (టమోటా)</option>
                  <option value="Rice/Paddy">Rice (వరి)</option>
                  <option value="Chilli">Chilli (మిరప)</option>
                  <option value="Turmeric">Turmeric (పసుపు)</option>
                </select>
              </div>
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Latitude</label>
                <input
                  type="text"
                  value={latCoord}
                  onChange={(e) => setLatCoord(e.target.value)}
                  className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-bold mb-1.5">Longitude</label>
                <input
                  type="text"
                  value={lonCoord}
                  onChange={(e) => setLonCoord(e.target.value)}
                  className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Onboard My Field</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      ) : (
        /* farmer view dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Visual Status, Photo upload, Claims */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Traffic Light Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">Field Health Status</h4>
              
              {selectedPlot && (
                <div className="flex items-center gap-4">
                  <div className={`size-14 rounded-full flex items-center justify-center shrink-0 border shadow-inner ${
                    selectedPlot.health_status === "HEALTHY"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : selectedPlot.health_status === "MODERATE" || selectedPlot.health_status === "STRESSED"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}>
                    {selectedPlot.health_status === "HEALTHY" ? (
                      <CheckCircle className="size-7" />
                    ) : (
                      <AlertTriangle className="size-7" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-foreground">
                      {selectedPlot.health_status === "HEALTHY" && "పొలం క్షేమం (Healthy)"}
                      {(selectedPlot.health_status === "MODERATE" || selectedPlot.health_status === "STRESSED") && "నీటి లోటు హెచ్చరిక (Stress)"}
                      {selectedPlot.health_status === "CRITICAL" && "తీవ్ర పంట నష్టం (Critical Damage)"}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedPlot.health_status === "HEALTHY" && "No action needed. Crops have optimal vegetative health and greenness."}
                      {(selectedPlot.health_status === "MODERATE" || selectedPlot.health_status === "STRESSED") && "Moisture indices dropping. Please irrigate your plot soon."}
                      {selectedPlot.health_status === "CRITICAL" && "Severe drop in greenness. PMFBY crop loss claim is ready to file."}
                    </p>
                  </div>
                </div>
              )}

              {/* Simple selector to toggle plot states for judges/farmers to test flow */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] gap-2">
                <span className="text-muted-foreground font-semibold">Simulate Plot Threat Tier:</span>
                <div className="flex gap-1.5">
                  {["HEALTHY", "STRESSED", "CRITICAL"].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        if (selectedPlot) {
                          onSelectPlot({
                            ...selectedPlot,
                            health_status: st as any,
                            ndvi_mean: st === "HEALTHY" ? 0.72 : st === "STRESSED" ? 0.52 : 0.38
                          });
                        }
                      }}
                      className={`px-2 py-1 rounded font-bold border transition-colors cursor-pointer ${
                        selectedPlot?.health_status === st
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-soil border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Geotagged Camera Upload Card */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-lg space-y-4">
              <div>
                <h4 className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">Geotagged Photo Verification</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">Corroborates satellite signals to prevent false insurance rejections.</p>
              </div>

              {!uploadedPhoto ? (
                <button
                  onClick={handleSimulatePhotoUpload}
                  className="w-full h-32 border-2 border-dashed border-border hover:border-primary/50 bg-soil/40 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group text-xs text-muted-foreground"
                >
                  <Camera className="size-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">Take/Upload Field Photo</span>
                  <span>(Simulates GPS Geotagging check)</span>
                </button>
              ) : uploadedPhoto === "uploading" ? (
                <div className="w-full h-32 bg-soil/40 border border-border rounded-xl flex flex-col items-center justify-center gap-2 text-xs">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <span className="font-semibold text-foreground">Reading metadata, checking geolocation...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative h-32 rounded-xl overflow-hidden border border-border">
                    <img src={uploadedPhoto} alt="Field verification" className="w-full h-full object-cover" />
                    <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-black px-2 py-0.5 rounded text-[10px] font-black border border-emerald-300 shadow">
                      VERIFIED
                    </div>
                  </div>
                  <div className="rounded-lg bg-soil p-3 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geotag Coordinates:</span>
                      <span className="font-mono text-foreground">{selectedPlot?.center[0].toFixed(5)}, {selectedPlot?.center[1].toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proximity Match:</span>
                      <span className="text-emerald-400 font-bold">100% (Within boundaries)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence Score Boost:</span>
                      <span className="text-primary font-bold">+13% score weight</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 1-Tap Claim submission card */}
            {selectedPlot?.health_status === "CRITICAL" && (
              <div className="rounded-xl border border-red-500/20 bg-rose-500/5 p-5 shadow-lg space-y-4 border-l-4 border-l-rose-500">
                <div className="flex items-start gap-2.5">
                  <FileCheck className="size-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">PMFBY 72h Crop Loss Claim Ready</h4>
                    <p className="text-xs text-muted-foreground">Crop damage verified by 2-out-of-3 signals. Submit before claim window closes!</p>
                  </div>
                </div>

                {currentClaim ? (
                  <div className="rounded-lg bg-soil/75 border border-border/80 p-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground">Claim Registry:</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-extrabold uppercase border border-emerald-500/30">
                        {currentClaim.status === "APPROVED_BY_INSURER" ? "Approved" : currentClaim.status === "REJECTED_BY_INSURER" ? "Rejected" : "DLMC Review"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ack Reference ID:</span>
                      <span className="font-mono font-bold text-foreground">{currentClaim.acknowledgment_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Consent channel:</span>
                      <span className="text-foreground">{currentClaim.consent_channel}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSendVoiceQuery("submit my crop loss claim now")}
                    className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <span>File My PMFBY Crop Loss Claim (1-Tap)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Voice Assistant UI */}
          <div className="lg:col-span-7 rounded-xl border border-border bg-card p-5 shadow-lg flex flex-col h-[540px]">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-sm text-foreground">Kisan voice helper (తెలుగు / EN)</h4>
              </div>

              {/* Language toggle selector */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground">Language:</span>
                <div className="flex bg-soil rounded-full p-0.5 border border-border">
                  <button
                    onClick={() => setLanguage("TE")}
                    className={`rounded-full px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                      language === "TE" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    తెలుగు
                  </button>
                  <button
                    onClick={() => setLanguage("EN")}
                    className={`rounded-full px-2 py-0.5 font-bold transition-colors cursor-pointer ${
                      language === "EN" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>

            {/* Spoken bubble logs */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {dialogue.map((msg, idx) => {
                const isAssistant = msg.sender === "assistant";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${
                      isAssistant ? "mr-auto items-start" : "ml-auto items-end"
                    }`}
                  >
                    <div className={`rounded-xl px-4 py-3 leading-relaxed shadow ${
                      isAssistant
                        ? "bg-soil border border-border text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none font-medium"
                    }`}>
                      <p>{msg.text}</p>
                      {msg.translated && (
                        <p className="text-[10px] text-muted-foreground border-t border-border/30 pt-1.5 mt-1.5 italic">
                          Translation: {msg.translated}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                      {isAssistant ? "FasalRakshak Assistant" : "You (Spoken)"}
                    </span>
                  </div>
                );
              })}
              {isProcessing && (
                <div className="flex gap-2 items-center text-xs text-muted-foreground mr-auto p-2 bg-soil rounded-xl border border-border animate-pulse">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>Processing speech...</span>
                </div>
              )}
              <div ref={dialogueEndRef} />
            </div>

            {/* Sound Wave Animation Visualizer */}
            {isListening && (
              <div className="py-2.5 flex items-center justify-center gap-1 bg-primary/5 border border-primary/20 rounded-lg mb-3">
                {[1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-primary rounded animate-pulse"
                    style={{
                      height: `${h * 4}px`,
                      animationDelay: `${i * 90}ms`,
                      animationDuration: "0.8s"
                    }}
                  />
                ))}
                <span className="text-[10px] font-bold text-primary ml-2 uppercase tracking-wider animate-pulse">Listening to voice...</span>
              </div>
            )}

            {/* Quick dialogue trigger options */}
            <div className="pb-3 border-t border-border/40 pt-3 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Demo voice triggers:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { en: "How is my field health?", te: "నా పొలం ఆరోగ్యం ఎలా ఉంది?" },
                  { en: "Check my claim status", te: "నా క్లెయిమ్ స్థితి ఏమిటి?" },
                  { en: "Submit my crop loss claim now", te: "నా పంట నష్టం క్లెయిమ్ సమర్పించు" }
                ].map((trigger, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendVoiceQuery(language === "TE" ? trigger.te : trigger.en)}
                    className="px-2.5 py-1.5 rounded-full border border-border bg-soil hover:border-primary/50 text-[11px] text-foreground hover:text-primary transition-all cursor-pointer"
                  >
                    {language === "TE" ? trigger.te : trigger.en}
                  </button>
                ))}
              </div>
            </div>

            {/* mic and input tray */}
            <div className="flex gap-2 pt-3 border-t border-border/60">
              <button
                onClick={() => {
                  if (isListening) {
                    setIsListening(false);
                  } else {
                    setIsListening(true);
                    // Mock auto speech detection
                    setTimeout(() => {
                      if (isListening) {
                        handleSendVoiceQuery(language === "TE" ? "నా పొలం ఎలా ఉంది?" : "How is my field health?");
                      }
                    }, 3500);
                  }
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-center shadow transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-red-500 border-red-400 text-white animate-pulse"
                    : "bg-soil border-border text-muted-foreground hover:text-primary hover:border-primary/50"
                }`}
                title="Tap to speak in Telugu or English"
              >
                {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendVoiceQuery(voiceQuery);
                }}
                className="flex-1 flex gap-2"
              >
                <input
                  type="text"
                  placeholder={language === "TE" ? "ఇక్కడ టైప్ చేయండి లేదా వాయిస్ అడగండి..." : "Type your voice query here..."}
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  className="flex-1 bg-soil border border-border rounded-xl px-4 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!voiceQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
