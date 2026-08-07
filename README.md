# 🌾 FasalRakshak 2.0 (ఫసల్‌రక్షక్)
> **Satellite-Powered Crop Loss Telemetry, Multi-Signal Guardrails, 1-Tap PMFBY Insurance Claims & Vernacular Voice AI Engine for Indian Smallholder Farmers**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Stack: FastAPI & React](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20%7C%20Vite-blue.svg)](https://vitejs.dev/)
[![AI: Google Gemini](https://img.shields.io/badge/AI Engine-Google%20Gemini-orange.svg)](https://ai.google.dev/)
[![Deployment: Vercel Ready](https://img.shields.io/badge/Deployment-Vercel%20Ready-black.svg)](https://vercel.com/)
[![Telangana Gazette: SRS v5.0](https://img.shields.io/badge/PMFBY%20Gazette-TS--2026-teal.svg)](#-srs-v50-claim-corroboration-engine)

---

## 📌 Executive Summary

**FasalRakshak 2.0** is an enterprise-grade agricultural intelligence and insurance automation platform engineered to bridge the gap between **Indian smallholder farmers** and the **Pradhan Mantri Fasal Bima Yojana (PMFBY)** 72-hour claim notification mandate.

By fusing **Sentinel-2 optical satellite telemetry**, **Open-Meteo microclimate weather data**, and **Geotagged EXIF photo evidence**, FasalRakshak eliminates claim submission friction for non-literate farmers while providing insurance companies and state nodal officers with automated multi-signal fraud guardrails.

---

## 🌟 Key Platform Capabilities

```
                  ┌─────────────────────────────────────────┐
                  │ 🛰️ Sentinel-2 Optical Satellite Imagery  │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Soil Moisture (SWI) │──►│ Multi-Signal Fusion  │◄──│  Open-Meteo Weather  │
│  Index Telemetry     │   │   Guardrail Engine   │   │  Precipitation Deficit│
└──────────────────────┘   └──────────┬───────────┘   └──────────────────────┘
                                      │
                                      ▼
                      ┌───────────────────────────────┐
                      │ ⚡ 1-Tap PMFBY Claim Engine    │
                      │  & Telugu WhatsApp Dispatch   │
                      └───────────────┬───────────────┘
                                      │
                                      ▼
                  ┌───────────────────────────────────────┐
                  │ 💼 Enterprise Insurer Command Center  │
                  │  (DLMC & Gazette Corroboration Queue) │
                  └───────────────────────────────────────┘
```

### 1. 🌾 Kisan Protection Portal (Farmer View)
- **1-Tap PMFBY Claim Filing**: Submit crop loss claims within the mandatory 72-hour window with a single tap. Pre-calculates estimated payouts based on mandal yield histories (`₹22,000 / Acre`).
- **Dynamic Multilingual Interface**: Real-time 1-click dynamic switching across **Telugu (తెలుగు)**, **Hindi (हिंदी)**, and **English (English)** across all dashboard cards, forms, and audio prompts.
- **Field Health & Soil Water Status**: Monitors **Soil Water Index (SWI)** moisture stress (42% deficit warnings) and **Canopy NDVI Greenness Index (68% optimal)** with voice audio playback.
- **Geotagged EXIF Photo Evidence**: Ground-truth photo capture with automatic GPS coordinate auditing and 98% image corroboration scoring.
- **Floating Google Gemini Voice AI Assistant**: Voice-activated assistant providing regional agronomic advice, weather alerts, and claim assistance in Telugu, Hindi, and English.

### 2. 🛡️ SRS v5.0 Claim Corroboration Engine (`FR-10.1` - `FR-10.6`)
- **Neighboring-Plot Cluster Agreement**: Evaluates spatial cluster density within a 5km radius (*"4 nearby plots affected in Warangal mandal"*).
- **Sowing-Date & Crop-Stage Awareness**: Evaluates crop phenology sensitivity (*Flowering & Grain Filling* vs. *Vegetative Growth*).
- **Government Gazette Lookup**: Cross-references official Telangana Government drought notifications (*`TS-GAZETTE-2026-WARANGAL-042`*).

### 3. 💼 Enterprise Insurer Command Center (Officer View)
- **District Risk Heatmaps & Risk Metrics**: Real-time aggregate block threat ratios, active advisory tracking, and claim volume monitoring.
- **Officer Claim Approval Queue**: Review claims filed by farmers in real time with interactive actions (`[ ✅ Approve Claim ]`, `[ ⚖️ DLMC Review ]`, `[ 📲 Send WhatsApp Receipt ]`).
- **Bulk CSV Plot Boundary Parsing**: Bulk onboard farmer plot polygons via CSV import (`plot_records_telangana.csv`).
- **Direct WhatsApp Alert Dispatch**: Outbound Cloud WhatsApp Business dispatches to farmers in regional languages.

### 4. ☁️ Supabase Cloud & Persistent Storage
- Seamless background sync with **Supabase Cloud** REST API endpoints (`/rest/v1/plots`, `/rest/v1/claims`).
- Automatic fallback to browser **LocalStorage** ensuring zero data loss across page refreshes or server reboots.

---

## 🛠️ Technology Stack

| Layer | Technology / Service | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 & Vite 8** | High-performance single-page web app with SSR support |
| **Routing & State** | **TanStack Router & Query** | Type-safe client routing & state management |
| **UI & Styling** | **TailwindCSS & Lucide Icons** | Modern dark-mode glassmorphism design system |
| **GIS Satellite Mapping** | **Leaflet & React-Leaflet** | Interactive Sentinel-2 NDVI overlay mapping |
| **Backend API** | **Python 3.11 & FastAPI** | High-throughput async REST microservice API |
| **AI / Voice Engine** | **Google Gemini AI (Studio)** | Vernacular agricultural chatbot & intent classifier |
| **Persistence / Database** | **Supabase & LocalStorage** | Cloud database sync & persistent local storage |
| **Messaging** | **Meta WhatsApp Cloud API & Twilio** | Outbound WhatsApp Business & SMS notifications |
| **Telemetry APIs** | **Open-Meteo Weather API** | Real-time precipitation & temperature forecasting |

---

## 📁 Repository Structure

```
fasalRakshak/
├── backend/                        # FastAPI Python Microservice
│   ├── app/
│   │   ├── api/                    # REST API Route Modules
│   │   │   ├── assistant_routes.py # Google Gemini Voice AI Chat Endpoint
│   │   │   ├── notifications_routes.py # WhatsApp & SMS Outbox Engine
│   │   │   ├── pmfby_routes.py     # Claim Processing & Corroboration API
│   │   │   └── weather_routes.py   # Open-Meteo Weather Telemetry API
│   │   ├── schemas/                # Pydantic Data Models & Validation
│   │   ├── services/               # Core Telemetry & Corroboration Logic
│   │   │   ├── pmfby.py            # SRS v5.0 Corroboration Engine
│   │   │   └── weather.py          # Weather Fetcher & Soil Water Index
│   │   └── main.py                 # FastAPI Application Entrypoint
│   └── requirements.txt            # Python Dependencies
├── frontend/                       # React 19 + Vite Web Application
│   ├── src/
│   │   ├── components/             # UI Components
│   │   │   ├── KisanFarmerView.tsx # Farmer 1-Tap Portal & Voice AI
│   │   │   ├── OfficerAggregateView.tsx # Insurer Command Center
│   │   │   ├── LoginView.tsx       # Fail-Safe Mobile Phone Login
│   │   │   ├── MapContainer.tsx    # Leaflet GIS Satellite Map
│   │   │   ├── NdviAnalytics.tsx   # Canopy NDVI & Moisture Charts
│   │   │   ├── PmfbyClaimCard.tsx  # Evidence Report Generator
│   │   │   └── RealTimeAlertsFeed.tsx # Telemetry Alerts Queue
│   │   ├── lib/
│   │   │   ├── api.ts              # Production API & Fallback Client
│   │   │   ├── plots.ts            # Farm Plot Boundaries & Metadata
│   │   │   └── supabase.ts         # Supabase & LocalStorage Persistence
│   │   └── routes/
│   │       ├── __root.tsx          # Root Layout & Title Tags
│   │       └── index.tsx           # Main Dashboard & Page Router
│   ├── vercel.json                 # Vercel Deployment Configuration
│   └── package.json                # Node.js Dependencies & Scripts
├── vercel.json                     # Monorepo Vercel Deployment Schema
└── README.md                       # Comprehensive Platform Documentation
```

---

## 🚀 Local Installation & Quickstart Guide

### Prerequisites
- **Node.js**: v18.0 or higher
- **Python**: v3.11 or higher
- **Git**: Installed locally

### 1. Clone Repository
```bash
git clone https://github.com/syed-omerr/FasalRakshak.git
cd FasalRakshak
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> Backend API will start running at `http://localhost:8000/`. OpenAPI Docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup (Vite + React)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev -- --port 8080
```
> Web Frontend will start running at `http://localhost:8080/`.

---

## 🔌 Core API Reference

### 1. PMFBY Claim Submission
```http
POST /api/pmfby/submit-claim
Content-Type: application/json

{
  "farmer_id": "Ramesh Reddy",
  "plot_id": "plot-101",
  "crop_type": "Cotton",
  "damage_score": 0.65,
  "confidence_pct": 94.5,
  "signals_used": ["Soil Moisture Deficit", "Satellite Canopy Loss"],
  "consent_channel": "1-Click Farmer Portal"
}
```

### 2. SRS v5.0 Claim Corroboration Lookup
```http
GET /api/pmfby/corroboration/{plot_id}?crop_type=Cotton&location=Warangal,%20Telangana
```

### 3. Google Gemini AI Voice Chatbot
```http
POST /api/assistant/chat
Content-Type: application/json

{
  "farmer_name": "Ramesh Reddy",
  "crop_type": "Cotton",
  "swi_mean": 0.42,
  "health_status": "STRESSED",
  "query_text": "నా పొలంలో నేల తేమ ఎంత ఉందో చెప్పండి?",
  "language": "TE"
}
```

### 4. Direct WhatsApp Message Dispatch
```http
POST /api/notifications/send-whatsapp
Content-Type: application/json

{
  "phone": "+919848022339",
  "message": "మీ PMFBY పంట క్లెయిమ్ నంబర్ PMFBY-TEL-2026-78401 ఆమోదించబడింది.",
  "plot_id": "plot-101",
  "language": "TE"
}
```

---

## ☁️ Deployment

### Deploying to Vercel
The repository includes optimized `vercel.json` configurations for zero-config Vercel static & API deployment:

1. Connect `syed-omerr/FasalRakshak` to **Vercel**.
2. Set Build Command: `cd frontend && npm run build`
3. Set Output Directory: `frontend/.output/public`
4. Add Environment Variables:
   - `VITE_GOOGLE_AI_KEY`: Your Google AI Studio API Key
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <strong>FasalRakshak 2.0</strong> — Built with ❤️ for Indian Farmers.
</p>
