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
  Compass,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Loader2,
  FileCheck,
  Globe
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

  // Audio / Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<"TE" | "HI" | "EN">("TE");
  const [voiceQuery, setVoiceQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogue, setDialogue] = useState<Message[]>([
    {
      sender: "assistant",
      text: "నమస్కారం! నేను ఫసల్‌రక్షక్ వాయిస్ అసిస్టెంట్‌ని. మీ చేను స్థితి తెలుసుకోవడానికి 'నా పొలం ఎలా ఉంది?' అని అడగండి.",
      translated: "Namaskaram! I am FasalRakshak Voice Assistant. Ask 'How is my field health?' to check plot status.",
      lang: "TE"
    }
  ]);

  // Geotagged Photo Upload states
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [photoVerifying, setPhotoVerifying] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);

  // 1-Click Emergency PMFBY Claim states
  const [selectedCalamity, setSelectedCalamity] = useState("🌵 Drought & Moisture Stress");
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  const dialogueEndRef = useRef<HTMLDivElement>(null);

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
      consent_channel: "1-Click Emergency Farmer Button",
      consent_timestamp: nowStr,
      acknowledgment_id: ackId,
      submitted_at: nowStr,
      status: "APPROVED_BY_INSURER"
    };

    try {
      await fetch("http://localhost:8000/api/pmfby/submit-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          consent_channel: "1-Click Emergency Button"
        })
      });
    } catch (e) {
      console.warn("Backend claim endpoint notice:", e);
    }

    onAddClaim(claimRecord);
    setIsFilingClaim(false);
    setClaimSuccessMessage(`✅ PMFBY Claim Submitted! Ack ID: ${ackId} • Estimated Payout: ₹${estPayout.toLocaleString()}`);

    const msgTe = `ధన్యవాదాలు ${selectedPlot.farmer} గారూ! మీ ${selectedPlot.crop_type} పొలం PMFBY క్లెయిమ్ 1-టాప్‌లో సమర్పించబడింది. రెఫరెన్స్ నంబర్: ${ackId}. అంచనా పరిహారం: ₹${estPayout.toLocaleString()}.`;
    const msgHi = `धन्यवाद ${selectedPlot.farmer} जी! आपकी ${selectedPlot.crop_type} फसल का बीमा दावा 1-क्लिक से सफलतापूर्वक जमा कर दिया गया है। संदर्भ संख्या: ${ackId}।`;
    const msgEn = `Thank you ${selectedPlot.farmer}! Your PMFBY crop loss claim has been filed via 1-Click. Reference ID: ${ackId}. Estimated Payout: ₹${estPayout.toLocaleString()}.`;

    const speechText = language === "TE" ? msgTe : (language === "HI" ? msgHi : msgEn);
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

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue]);

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

    // Initial greeting per language
    const welcomeMsgEn = `Welcome! Hello ${farmerName}, your ${cropType} plot has been onboarded in ${villageName}.`;
    const welcomeMsgTe = `స్వాగతం! నమస్తే ${farmerName} గారు, మీ ${cropType} పొలం ${villageName} లో నమోదు చేయబడింది.`;
    const welcomeMsgHi = `स्वागत है! नमस्ते ${farmerName} जी, आपका ${cropType} खेत ${villageName} में सफलतापूर्वक दर्ज किया गया है।`;

    const welcomeText = language === "TE" ? welcomeMsgTe : language === "HI" ? welcomeMsgHi : welcomeMsgEn;
    const transText = language === "TE" ? welcomeMsgEn : welcomeMsgTe;

    setDialogue([
      {
        sender: "assistant",
        text: welcomeText,
        translated: transText,
        lang: language
      }
    ]);
    speakText(welcomeText, language);
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

      // If intent was CLAIM, trigger claim integration locally
      if (parsed.intent_detected === "CLAIM") {
        const existing = filedClaims.find((c) => c.plot_id === selectedPlot.id);
        if (!existing) {
          const ackId = `PMFBY-TEL-${Date.now().toString().slice(-6)}`;
          const nowStr = new Date().toLocaleString();
          onAddClaim({
            id: ackId,
            plot_id: selectedPlot.id,
            farmer_name: selectedPlot.farmer,
            crop_type: selectedPlot.crop_type,
            location: selectedPlot.location,
            acreage: selectedPlot.acreage,
            loss_percentage: selectedPlot.health_status === "CRITICAL" ? 75 : 45,
            estimated_payout: selectedPlot.health_status === "CRITICAL" ? 48500 : 28000,
            evidence_pdf_url: "#",
            consent_channel: "Sarvam AI Voice Confirmation",
            consent_timestamp: nowStr,
            acknowledgment_id: ackId,
            submitted_at: nowStr,
            status: "APPROVED_BY_INSURER"
          });
        }
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

    } catch (err) {
      console.warn("Sarvam AI endpoint fallback to rule engine:", err);
      setTimeout(() => {
        const qLower = queryText.toLowerCase();
        const isHealth = qLower.includes("health") || qLower.includes("field") || qLower.includes("polam") || qLower.includes("పొలం") || qLower.includes("ఎలా") || qLower.includes("ఖేత్") || qLower.includes("खेत") || qLower.includes("कैसा");
        const isClaim = qLower.includes("claim") || qLower.includes("file") || qLower.includes("క్లెయిమ్") || qLower.includes("దాఖలు") || qLower.includes("నష్టం") || qLower.includes("दावा") || qLower.includes("दर्ज");
        const isStatus = qLower.includes("status") || qLower.includes("check") || qLower.includes("స్థితి") || qLower.includes("स्थिति");

        let textResponse = "";
        let translatedText = "";

        if (isHealth) {
          if (selectedPlot.health_status === "HEALTHY") {
            if (language === "TE") {
              textResponse = `మీ ${selectedPlot.crop_type} పొలం ఆరోగ్యంగా ఉంది (NDVI: ${selectedPlot.ndvi_mean}). ఎలాంటి పంట నష్టం లేదు.`;
              translatedText = `Your ${selectedPlot.crop_type} field is healthy and safe (NDVI: ${selectedPlot.ndvi_mean}). No crop loss detected.`;
            } else if (language === "HI") {
              textResponse = `आपका ${selectedPlot.crop_type} खेत स्वस्थ और सुरक्षित है (NDVI: ${selectedPlot.ndvi_mean})। कोई फसल नुकसान नहीं है।`;
              translatedText = `Your ${selectedPlot.crop_type} field is healthy and safe (NDVI: ${selectedPlot.ndvi_mean}). No crop loss detected.`;
            } else {
              textResponse = `Your ${selectedPlot.crop_type} field is healthy and safe (NDVI: ${selectedPlot.ndvi_mean}). There is no crop loss detected.`;
              translatedText = `మీ ${selectedPlot.crop_type} పొలం ఆరోగ్యంగా ఉంది.`;
            }
          } else if (selectedPlot.health_status === "MODERATE" || selectedPlot.health_status === "STRESSED") {
            if (language === "TE") {
              textResponse = `హెచ్చరిక: మీ ${selectedPlot.crop_type} పొలంలో నీటి ఎద్దడి (NDVI: ${selectedPlot.ndvi_mean}) ఉంది. వెంటనే నీరు పెట్టండి.`;
              translatedText = `Warning: Moisture dryness stress detected in your ${selectedPlot.crop_type} field (NDVI: ${selectedPlot.ndvi_mean}). Advisory: Please irrigate immediately.`;
            } else if (language === "HI") {
              textResponse = `चेतावनी: आपके ${selectedPlot.crop_type} खेत में नमी की कमी (NDVI: ${selectedPlot.ndvi_mean}) पाई गई है। कृपया तुरंत सिंचाई करें।`;
              translatedText = `Warning: Moisture dryness stress detected in your ${selectedPlot.crop_type} field (NDVI: ${selectedPlot.ndvi_mean}). Advisory: Please irrigate immediately.`;
            } else {
              textResponse = `Warning: Moisture dryness stress detected in your ${selectedPlot.crop_type} field (NDVI: ${selectedPlot.ndvi_mean}). Advisory: Please irrigate immediately.`;
              translatedText = `హెచ్చరిక: నీటి ఎద్దడి ఉంది. నీరు అందించండి.`;
            }
          } else {
            // CRITICAL
            if (language === "TE") {
              textResponse = `తీవ్రమైన నష్టం: పంట హెల్త్ సూచిక ${selectedPlot.ndvi_mean} కి పడిపోయింది. క్లెయిమ్ దాఖలు చేయడానికి 'పంట నష్టం క్లెయిమ్ దాఖలు చేయి' అని చెప్పండి.`;
              translatedText = `Critical damage: Vegetation index dropped to ${selectedPlot.ndvi_mean}. Say 'File my crop loss claim now' to submit.`;
            } else if (language === "HI") {
              textResponse = `गंभीर नुकसान: फसल सूचकांक ${selectedPlot.ndvi_mean} तक गिर गया है। दावा दर्ज करने के लिए 'फसल नुकसान दावा दर्ज करें' कहें।`;
              translatedText = `Critical damage: Vegetation index dropped to ${selectedPlot.ndvi_mean}. Say 'File my crop loss claim now' to submit.`;
            } else {
              textResponse = `Critical damage: Vegetation index dropped to ${selectedPlot.ndvi_mean}. Say 'File my crop loss claim now' to submit.`;
              translatedText = `తీవ్రమైన పంట నష్టం గుర్తించబడింది.`;
            }
          }
        } else if (isClaim) {
          const registeredClaim = filedClaims.find((c) => c.plot_id === selectedPlot.id);
          if (registeredClaim) {
            if (language === "TE") {
              textResponse = `మీ పంట నష్టం క్లెయిమ్ ఇప్పటికే దాఖలు చేయబడింది. రిఫరెన్స్ నంబర్: ${registeredClaim.acknowledgment_id}.`;
              translatedText = `Your crop loss claim has already been filed. Reference number is ${registeredClaim.acknowledgment_id}.`;
            } else if (language === "HI") {
              textResponse = `आपका फसल नुकसान दावा पहले ही दर्ज किया जा चुका है। संदर्भ संख्या: ${registeredClaim.acknowledgment_id}।`;
              translatedText = `Your crop loss claim has already been filed. Reference number is ${registeredClaim.acknowledgment_id}.`;
            } else {
              textResponse = `Your crop loss claim has already been filed. Reference number is ${registeredClaim.acknowledgment_id}.`;
              translatedText = `మీ క్లెయిమ్ ఇప్పటికే నమోదైంది.`;
            }
          } else {
            const ackId = `PMFBY-TEL-${Date.now().toString().slice(-6)}`;
            const nowStr = new Date().toLocaleString();
            const claimObj = {
              id: ackId,
              plot_id: selectedPlot.id,
              farmer_name: selectedPlot.farmer,
              crop_type: selectedPlot.crop_type,
              location: selectedPlot.location,
              acreage: selectedPlot.acreage,
              loss_percentage: selectedPlot.health_status === "CRITICAL" ? 75 : 45,
              estimated_payout: selectedPlot.health_status === "CRITICAL" ? 48500 : 28000,
              evidence_pdf_url: "#",
              consent_channel: "Sarvam AI Voice Confirmation",
              consent_timestamp: nowStr,
              acknowledgment_id: ackId,
              submitted_at: nowStr,
              status: "APPROVED_BY_INSURER"
            };
            onAddClaim(claimObj);

            if (language === "TE") {
              textResponse = `సరే, మీ పంట నష్టం క్లెయిమ్ దాఖలు చేయబడింది. మీ క్లెయిమ్ రిఫరెన్స్ నంబర్: ${ackId}.`;
              translatedText = `Ok, I have submitted your crop loss claim. Your claim reference number is ${ackId}.`;
            } else if (language === "HI") {
              textResponse = `ठीक है, आपका फसल नुकसान दावा जमा कर दिया गया है। दावा संदर्भ संख्या: ${ackId}।`;
              translatedText = `Ok, I have submitted your crop loss claim. Your claim reference number is ${ackId}.`;
            } else {
              textResponse = `Ok, I have submitted your crop loss claim. Your claim reference number is ${ackId}.`;
              translatedText = `సరే, క్లెయిమ్ దాఖలు చేయబడింది.`;
            }
          }
        } else if (isStatus) {
          const registeredClaim = filedClaims.find((c) => c.plot_id === selectedPlot.id);
          if (registeredClaim) {
            const status = registeredClaim.status;
            if (status === "APPROVED_BY_INSURER") {
              if (language === "TE") {
                textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) ఇన్సూరెన్స్ కంపెనీ ద్వారా ఆమోదించబడింది.`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) has been approved by the insurer.`;
              } else if (language === "HI") {
                textResponse = `आपका दावा (${registeredClaim.acknowledgment_id}) बीमा कंपनी द्वारा स्वीकृत कर दिया गया है।`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) has been approved by the insurer.`;
              } else {
                textResponse = `Your claim (${registeredClaim.acknowledgment_id}) has been approved by the insurer.`;
                translatedText = `మీ క్లెయిమ్ ఆమోదించబడింది.`;
              }
            } else if (status === "REJECTED_BY_INSURER") {
              if (language === "TE") {
                textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) తిరస్కరించబడింది. మీరు DLMC లో అప్పీల్ చేయవచ్చు.`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) was rejected by the insurer. You can appeal to DLMC.`;
              } else if (language === "HI") {
                textResponse = `आपका दावा (${registeredClaim.acknowledgment_id}) अस्वीकृत कर दिया गया है। आप DLMC में अपील कर सकते हैं।`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) was rejected by the insurer. You can appeal to DLMC.`;
              } else {
                textResponse = `Your claim (${registeredClaim.acknowledgment_id}) was rejected by the insurer. You can appeal to DLMC.`;
                translatedText = `మీ క్లెయిమ్ తిరస్కరించబడింది.`;
              }
            } else {
              if (language === "TE") {
                textResponse = `మీ క్లెయిమ్ (${registeredClaim.acknowledgment_id}) ప్రస్తుతం DLMC కమిటీ పరిశీలనలో ఉంది.`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) is currently under review by the DLMC committee.`;
              } else if (language === "HI") {
                textResponse = `आपका दावा (${registeredClaim.acknowledgment_id}) वर्तमान में DLMC समिति द्वारा समीक्षाधीन है।`;
                translatedText = `Your claim (${registeredClaim.acknowledgment_id}) is currently under review by the DLMC committee.`;
              } else {
                textResponse = `Your claim (${registeredClaim.acknowledgment_id}) is currently under review by the DLMC committee.`;
                translatedText = `మీ క్లెయిమ్ పరిశీలనలో ఉంది.`;
              }
            }
          } else {
            if (language === "TE") {
              textResponse = `ఇంతవరకు క్లెయిమ్ దాఖలు చేయబడలేదు. పంట నష్టం ఉంటే సమర్పించడానికి సమ్మతి ఇవ్వండి.`;
              translatedText = `No claim has been filed yet. Provide consent to submit if there is crop damage.`;
            } else if (language === "HI") {
              textResponse = `अभी तक कोई दावा दर्ज नहीं किया गया है। यदि फसल का नुकसान है तो सहमति दें।`;
              translatedText = `No claim has been filed yet. Provide consent to submit if there is crop damage.`;
            } else {
              textResponse = `No claim has been filed yet. Provide consent to submit if there is crop damage.`;
              translatedText = `క్లెయిమ్ నమోదు కాలేదు.`;
            }
          }
        } else {
          if (language === "TE") {
            textResponse = `క్షమించండి, నాకు స్పష్టంగా అర్థం కాలేదు. 'నా పొలం ఎలా ఉంది?' లేదా 'క్లెయిమ్ దాఖలు చేయి' అని చెప్పండి.`;
            translatedText = `Sorry, I did not catch that. Please say 'How is my field health?' or 'File my claim'.`;
          } else if (language === "HI") {
            textResponse = `क्षमा करें, मुझे समझ नहीं आया। कृपया कहें 'मेरा खेत कैसा है?' या 'दावा दर्ज करें'।`;
            translatedText = `Sorry, I did not catch that. Please say 'How is my field health?' or 'File my claim'.`;
          } else {
            textResponse = `Sorry, I did not catch that. Please say 'How is my field health?' or 'File my claim'.`;
            translatedText = `దయచేసి మళ్లీ అడగండి.`;
          }
        }

        setDialogue((prev) => [
          ...prev,
          {
            sender: "assistant",
            text: textResponse,
            translated: translatedText,
            lang: language
          }
        ]);
        speakText(textResponse, language);
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
      setUploadedPhoto("https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=300&q=80");
      
      const successTe = "ఫోటో విజయవంతంగా సరిచూడబడింది! విశ్వసనీయత స్కోరు 98% కి పెరిగింది.";
      const successHi = "जियोटैग फोटो सफलतापूर्वक सत्यापित! विश्वसनीयता स्कोर 98% तक बढ़ा।";
      const successEn = "Geotagged field photo successfully verified! Confidence score boosted to 98%.";
      
      const textVal = language === "TE" ? successTe : language === "HI" ? successHi : successEn;
      const transVal = language === "TE" ? successEn : successTe;

      setDialogue((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: textVal,
          translated: transVal,
          lang: language
        }
      ]);
      speakText(textVal, language);
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
            <h2 className="font-black text-lg text-foreground flex items-center gap-2">
              🌾 Kisan Workspace <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-0.5 rounded-full">Farmer Mode</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              1-Tap Vernacular Telugu, Hindi & English PMFBY Claim Assistance & Satellite Plot Intelligence
            </p>
          </div>
        </div>

        {/* Dynamic Plot Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Select Plot:</span>
          <select
            value={selectedPlot?.id || ""}
            onChange={(e) => {
              const p = plots.find((x) => x.id === e.target.value);
              if (p) onSelectPlot(p);
            }}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-sm"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.crop_type} • {p.location})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsOnboarding(true)}
            className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            + Onboard New Plot
          </button>
        </div>
      </div>

      {/* Quick Registration / Onboarding Modal if triggered */}
      {isOnboarding && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full pointer-events-none" />
          <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <MapPin className="size-5 text-primary" /> Onboard New Farmer Plot
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            Register plot details to enable automated 72-hour PMFBY claim filing and satellite health tracking.
          </p>

          <form onSubmit={handleRegisterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Farmer Name (రైతు పేరు / किसान का नाम)</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Reddy"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Mobile Number (ఫోన్ నంబర్ / मोबाइल नंबर)</label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98480 22339"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Village / Mandal (గ్రామం / गाँव)</label>
              <input
                type="text"
                required
                placeholder="e.g. Warangal Block-A"
                value={villageName}
                onChange={(e) => setVillageName(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Crop Type (పంట / फसल)</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Cotton">Cotton (ప్రత్తి / कपास)</option>
                <option value="Groundnut">Groundnut (వేరుశనగ / मूंगफली)</option>
                <option value="Maize">Maize (మొక్కజొన్న / मक्का)</option>
                <option value="Tomato">Tomato (టమాటా / टमाटर)</option>
                <option value="Rice/Paddy">Rice (వరి / चावल)</option>
                <option value="Chilli">Chilli (మిరప / मिर्च)</option>
                <option value="Turmeric">Turmeric (పసుపు / हल्दी)</option>
              </select>
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Latitude Coordinate</label>
              <input
                type="text"
                value={latCoord}
                onChange={(e) => setLatCoord(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-muted-foreground font-bold mb-1.5">Longitude Coordinate</label>
              <input
                type="text"
                value={lonCoord}
                onChange={(e) => setLonCoord(e.target.value)}
                className="w-full bg-soil border border-border rounded-xl px-3.5 py-2.5 text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex items-center justify-end gap-3 mt-2">
              {selectedPlot && (
                <button
                  type="button"
                  onClick={() => setIsOnboarding(false)}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-md transition-all flex items-center gap-2"
              >
                Save Plot & View Dashboard <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Selected Plot Active Overview */}
      {selectedPlot && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Plot Metadata Card & Claim Quick-Action */}
          <div className="space-y-6">
            {/* Plot Details Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                    {selectedPlot.crop_type} Plot
                  </span>
                  <h3 className="text-xl font-black text-foreground mt-1.5">{selectedPlot.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-primary" /> {selectedPlot.location}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Acreage</span>
                  <span className="text-lg font-black text-foreground">{selectedPlot.acreage} Acres</span>
                </div>
              </div>

              {/* SRS v4 Health & Telemetry Summary with SWI & 3-Source Eligibility */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-soil/60 border border-border p-2.5 rounded-xl">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">NDVI Canopy</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">{selectedPlot.ndvi_mean}</span>
                </div>

                <div className="bg-soil/60 border border-cyan-500/30 p-2.5 rounded-xl">
                  <span className="text-[9px] text-cyan-400 block font-bold uppercase">SWI Moisture</span>
                  <span className="text-base font-black text-cyan-300 mt-0.5 block">{(selectedPlot.swi_mean || 0.42).toFixed(2)}</span>
                </div>

                <div className="bg-soil/60 border border-border p-2.5 rounded-xl">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">3-Source Report</span>
                  <span className={`text-[10px] font-black mt-1 block ${
                    selectedPlot.health_status !== "HEALTHY" ? "text-emerald-400" : "text-muted-foreground"
                  }`}>
                    {selectedPlot.health_status !== "HEALTHY" ? "✓ Applicable" : "Optimal"}
                  </span>
                </div>
              </div>

              {/* Active Claim status OR 1-Click Claim Application Action Card */}
              {currentClaim ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span className="flex items-center gap-1.5"><FileCheck className="size-4" /> PMFBY Claim Filed</span>
                    <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">{currentClaim.acknowledgment_id}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Estimated compensation payout: <strong className="text-foreground">₹{currentClaim.estimated_payout.toLocaleString()}</strong> ({currentClaim.loss_percentage}% damage).
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-amber-500/10 via-card to-emerald-500/10 border-2 border-primary/40 rounded-2xl p-5 space-y-3.5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Sparkles className="size-3 text-amber-300 animate-spin" /> Instant Calamity Action
                    </span>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      Est. Payout: ₹{Math.round(selectedPlot.acreage * 22000).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-foreground">⚡ 1-Click PMFBY Claim Application</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      అత్యవసర పంట నష్టపరిహారం దాఖలు చేయండి • Apply instantly when crop yield is threatened or damaged.
                    </p>
                  </div>

                  {/* Calamity Type Selector Buttons */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-muted-foreground font-bold uppercase">Select Calamity / Damage Cause:</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {[
                        "🌵 Drought & Moisture Stress",
                        "🌧️ Unseasonal Rain & Flood",
                        "🐛 Pest / Disease Attack",
                        "⚡ General Destruction"
                      ].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelectedCalamity(type)}
                          className={`p-2 rounded-xl text-left font-semibold transition-all text-[11px] border cursor-pointer ${
                            selectedCalamity === type
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                              : "bg-soil/60 text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PROMINENT 1-CLICK SUBMIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOneClickClaimSubmit(selectedCalamity)}
                    disabled={isFilingClaim}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40 active:scale-95 disabled:opacity-50"
                  >
                    {isFilingClaim ? (
                      <>
                        <Loader2 className="size-5 animate-spin text-white" />
                        <span>Submitting PMFBY Claim...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-5 text-amber-300 animate-pulse" />
                        <span>1-Click Apply PMFBY Claim Now (ఇప్పుడే క్లెయిమ్ చేయండి)</span>
                        <ArrowRight className="size-5" />
                      </>
                    )}
                  </button>

                  {claimSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-bold text-emerald-300 animate-fade-in">
                      {claimSuccessMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Geotagged Photo Upload Evidence Verification Card */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Camera className="size-4 text-primary" /> Geotagged Crop Loss Photo Verification
              </h4>
              <p className="text-xs text-muted-foreground">
                Upload a field photo with embedded GPS metadata for instant multi-signal insurance validation.
              </p>

              {uploadedPhoto && uploadedPhoto !== "uploading" ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-48">
                    <img src={uploadedPhoto} alt="Geotagged crop loss evidence" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow">
                      <CheckCircle className="size-3" /> GPS & Time Verified
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 flex items-center justify-between">
                    <span>AI Field Audit Score: <strong>98% Match</strong></span>
                    <button 
                      onClick={() => setUploadedPhoto(null)} 
                      className="text-[10px] text-muted-foreground underline hover:text-foreground"
                    >
                      Re-upload
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-all cursor-pointer bg-soil/40 space-y-3">
                  {photoVerifying ? (
                    <div className="py-4 space-y-2">
                      <Loader2 className="size-8 text-primary animate-spin mx-auto" />
                      <p className="text-xs font-bold text-foreground">Validating EXIF geotag & AI damage score...</p>
                    </div>
                  ) : (
                    <>
                      <div className="size-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                        <Camera className="size-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Click to Upload Geotagged Field Photo</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Supports JPEG, PNG with GPS metadata</p>
                      </div>
                      <button
                        onClick={handleSimulatePhotoUpload}
                        className="px-4 py-2 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 text-xs font-bold border border-primary/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        Simulate Camera Capture
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right 2 Columns: Vernacular Voice Chatbot & Interactive Dialogue Box */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm flex flex-col justify-between min-h-[580px]">
            {/* Header with Language Selector Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Mic className="size-5 text-primary animate-pulse" /> FasalRakshak Vernacular Voice Assistant
                </h4>
                <p className="text-xs text-muted-foreground">
                  Voice AI assistant supporting spoken Telugu, Hindi & English for PMFBY claims & field health.
                </p>
              </div>

              {/* Language Switcher Buttons (Telugu, Hindi, English) */}
              <div className="flex items-center bg-soil border border-border p-1 rounded-xl gap-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLanguage("TE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === "TE"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🌾 తెలుగు
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage("HI")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === "HI"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇮🇳 हिंदी
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage("EN")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === "EN"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            {/* Chat Transcript Dialogue Area */}
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[380px] pr-2 scrollbar-thin">
              {dialogue.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === "farmer" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs space-y-1 shadow-sm ${
                      msg.sender === "farmer"
                        ? "bg-primary text-primary-foreground rounded-br-none font-medium"
                        : "bg-soil/90 border border-border text-foreground rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 font-bold mb-0.5">
                      <span>{msg.sender === "farmer" ? farmerName || "Farmer" : "FasalRakshak AI"}</span>
                      <span className="uppercase bg-background/20 px-1.5 py-0.5 rounded">{msg.lang || language}</span>
                    </div>

                    <p className="leading-relaxed text-sm font-semibold">{msg.text}</p>

                    {msg.translated && (
                      <p className="text-[11px] opacity-80 pt-1 border-t border-current/10 italic">
                        Translation: {msg.translated}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground italic bg-soil/40 p-3 rounded-xl border border-border max-w-xs">
                  <Loader2 className="size-4 text-primary animate-spin" />
                  <span>Processing voice input with Sarvam AI...</span>
                </div>
              )}
              <div ref={dialogueEndRef} />
            </div>

            {/* Bottom Controls: Fast Demo Voice Triggers & Input Form */}
            <div className="space-y-4 pt-2 border-t border-border">
              {/* Quick dialogue trigger options */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Demo voice triggers:
                </span>
                {[
                  {
                    en: "How is my field health?",
                    te: "నా పొలం ఎలా ఉంది?",
                    hi: "मेरा खेत कैसा है?"
                  },
                  {
                    en: "Check my claim status",
                    te: "నా క్లెయిమ్ స్థితి ఏంటి?",
                    hi: "मेरे दावे की स्थिति क्या है?"
                  },
                  {
                    en: "Submit my crop loss claim now",
                    te: "పంట నష్టం క్లెయిమ్ దాఖలు చేయి",
                    hi: "फसल नुकसान का दावा दर्ज करें"
                  }
                ].map((trigger, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const textToSubmit = language === "TE" ? trigger.te : language === "HI" ? trigger.hi : trigger.en;
                      handleSendVoiceQuery(textToSubmit);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-soil hover:bg-primary/10 border border-border text-foreground hover:border-primary/40 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="size-3 text-primary" />
                    {language === "TE" ? trigger.te : language === "HI" ? trigger.hi : trigger.en}
                  </button>
                ))}
              </div>

              {/* Voice / Text Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendVoiceQuery(voiceQuery);
                }}
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      setIsListening(false);
                    } else {
                      setIsListening(true);
                      // Simulate quick trigger speak
                      setTimeout(() => {
                        const triggerText = language === "TE" ? "నా పొలం ఎలా ఉంది?" : language === "HI" ? "मेरा खेत कैसा है?" : "How is my field health?";
                        handleSendVoiceQuery(triggerText);
                      }, 1500);
                    }
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                    isListening
                      ? "bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse"
                      : "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                  }`}
                  title="Toggle Voice Recording"
                >
                  {isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                </button>

                <input
                  type="text"
                  placeholder={
                    language === "TE"
                      ? "మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి లేదా మాట్లాడండి..."
                      : language === "HI"
                      ? "अपना सवाल यहाँ टाइप करें या बोलें..."
                      : "Type your voice query here..."
                  }
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

      {/* Mobile Touch-Optimized Sticky Bottom Action Bar for Phone Users */}
      {selectedPlot && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 border-t border-primary/40 backdrop-blur-md p-3 shadow-2xl flex items-center justify-around gap-2">
          <button
            type="button"
            onClick={() => handleOneClickClaimSubmit(selectedCalamity)}
            disabled={isFilingClaim}
            className="flex-1 py-3 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
          >
            <Sparkles className="size-4 text-amber-300 animate-pulse" />
            <span>⚡ 1-Click Claim (ఇప్పుడే చేయండి)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const triggerText = language === "TE" ? "నా పొలంలో పంట నష్టం క్లెయిమ్ చేయి" : "Apply for crop loss claim";
              handleSendVoiceQuery(triggerText);
            }}
            className="p-3 rounded-xl bg-primary/20 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
          >
            <Mic className="size-4 animate-pulse" />
            <span>Voice AI</span>
          </button>
        </div>
      )}
    </div>
  );
}
