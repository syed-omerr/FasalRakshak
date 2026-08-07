import React, { useState } from "react";
import { saveSessionToStorage } from "../lib/supabase";
import { 
  User, 
  Building2, 
  Lock, 
  Sparkles, 
  UserPlus, 
  LogIn, 
  Phone, 
  MapPin, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (session: {
    role: "kisan" | "enterprise";
    name: string;
    phone?: string;
    village?: string;
    email?: string;
    district?: string;
    crop?: string;
  }) => void;
}

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [activeRole, setActiveRole] = useState<"kisan" | "enterprise">("kisan");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields - Kisan
  const [farmerName, setFarmerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [villageName, setVillageName] = useState("Warangal Block-A");
  const [cropType, setCropType] = useState("Cotton");

  // Form Fields - Enterprise
  const [email, setEmail] = useState("");
  const [officialId, setOfficialId] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("Warangal");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (activeRole === "kisan") {
        const cleanPhone = mobileNumber.trim().replace(/[^\d+]/g, "") || "9848022339";
        const resolvedName = farmerName.trim() || `Farmer (${cleanPhone})`;

        const sessionObj = {
          role: "kisan" as const,
          name: resolvedName,
          phone: cleanPhone,
          village: villageName || "Warangal West",
          crop: cropType || "Cotton"
        };

        saveSessionToStorage(sessionObj);
        onLoginSuccess(sessionObj);
      } else {
        const resolvedEmail = email.trim() || "officer@telangana.gov.in";
        const sessionObj = {
          role: "enterprise" as const,
          name: email.includes("@") ? email.split("@")[0].toUpperCase() + " (Officer)" : "ADMIN OFFICER",
          email: resolvedEmail,
          district: district || "Warangal Region"
        };

        saveSessionToStorage(sessionObj);
        onLoginSuccess(sessionObj);
      }
    }, 1000);
  };

  // Demo bypass triggers for quick evaluation
  const triggerDemoLogin = (role: "kisan" | "enterprise") => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "kisan") {
        onLoginSuccess({
          role: "kisan",
          name: "Ramesh Reddy",
          phone: "+919848022339",
          village: "Warangal West Block",
          crop: "Groundnut"
        });
      } else {
        onLoginSuccess({
          role: "enterprise",
          name: "Officer Suresh Kumar",
          email: "suresh.kumar@telangana.gov.in",
          district: "Warangal District"
        });
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-soil flex items-center justify-center px-4 py-12 relative overflow-hidden grain">
      {/* Dynamic blurred backdrop nodes for premium aesthetics */}
      <div className="absolute top-1/4 left-1/4 size-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-primary/10 border border-primary/20 p-3 rounded-2xl text-primary mb-2 shadow">
            <Sparkles className="size-8 animate-pulse" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            FasalRakshak<span className="text-primary">.</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Satellite precision monitoring, automated crop loss warnings, and 1-tap Telugu PMFBY claims processing.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/75 border border-border backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
          {/* Tab Selection (Sign In / Sign Up) */}
          <div className="flex bg-soil p-1 rounded-lg border border-border text-xs">
            <button
              onClick={() => { setIsSignUp(false); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isSignUp ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => { setIsSignUp(true); setErrorMessage(null); }}
              className={`flex-1 py-2 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isSignUp ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserPlus className="size-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Role Selection Picker (Kisan vs Enterprise) */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Select Your Workspace Role</label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => { setActiveRole("kisan"); setErrorMessage(null); }}
                className={`py-3 px-4 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center gap-2 group ${
                  activeRole === "kisan"
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/5"
                    : "bg-soil/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <User className={`size-5 ${activeRole === "kisan" ? "text-emerald-400" : "text-muted-foreground group-hover:text-foreground"}`} />
                <span>🌾 Kisan (Farmer)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveRole("enterprise"); setErrorMessage(null); }}
                className={`py-3 px-4 rounded-xl border font-bold transition-all cursor-pointer flex flex-col items-center gap-2 group ${
                  activeRole === "enterprise"
                    ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-lg shadow-blue-500/5"
                    : "bg-soil/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Building2 className={`size-5 ${activeRole === "enterprise" ? "text-blue-400" : "text-muted-foreground group-hover:text-foreground"}`} />
                <span>💼 Enterprise (Admin)</span>
              </button>
            </div>
          </div>

          {/* Error Message alert block */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-rose-400 text-xs flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dynamic input Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {activeRole === "kisan" ? (
              /* Farmer Inputs */
              <>
                {isSignUp && (
                  <div>
                    <label className="block text-muted-foreground font-bold mb-1.5">Farmer Full Name (రైతు పేరు)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Reddy"
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-emerald-500/50 text-xs"
                      required={isSignUp}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Mobile Number (మొబైల్ సంఖ్య)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="e.g. +91 98480 22339"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      className="w-full bg-soil border border-border rounded-lg pl-10 pr-3.5 py-2.5 text-foreground focus:outline-none focus:border-emerald-500/50 text-xs"
                      required
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">Village / Mandal</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={villageName}
                          onChange={(e) => setVillageName(e.target.value)}
                          className="w-full bg-soil border border-border rounded-lg pl-9 pr-3.5 py-2.5 text-foreground focus:outline-none focus:border-emerald-500/50 text-xs"
                          required={isSignUp}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">Crop Type</label>
                      <select
                        value={cropType}
                        onChange={(e) => setCropType(e.target.value)}
                        className="w-full bg-soil border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-emerald-500/50 text-xs"
                      >
                        <option value="Cotton">Cotton (పత్తి)</option>
                        <option value="Groundnut">Groundnut (వేరుశనగ)</option>
                        <option value="Maize">Maize (మొక్కజొన్న)</option>
                        <option value="Tomato">Tomato (టమోటా)</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Enterprise inputs */
              <>
                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Official Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. officer@telangana.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 text-xs"
                    required
                  />
                </div>

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">Official Agency ID</label>
                      <input
                        type="text"
                        placeholder="e.g. PMFBY-TS-409"
                        value={officialId}
                        onChange={(e) => setOfficialId(e.target.value)}
                        className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 text-xs"
                        required={isSignUp}
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground font-bold mb-1.5">Assigned District</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full bg-soil border border-border rounded-lg px-3.5 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 text-xs"
                        required={isSignUp}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-muted-foreground font-bold mb-1.5">Account Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-soil border border-border rounded-lg pl-10 pr-3.5 py-2.5 text-foreground focus:outline-none focus:border-blue-500/50 text-xs"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-extrabold text-foreground shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-6 transition-all ${
                activeRole === "kisan"
                  ? "bg-emerald-500 hover:bg-emerald-400 text-black"
                  : "bg-blue-500 hover:bg-blue-400 text-black"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span>Authenticating session...</span>
              ) : (
                <>
                  <span>{isSignUp ? "Register Account" : "Access Workspace"}</span>
                  <ChevronRight className="size-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo Fast-Pass Section */}
        <div className="bg-soil/60 border border-border rounded-xl p-4 text-xs space-y-2.5 text-center shadow-lg">
          <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Demo Fast-Pass (For Evaluators)</p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => triggerDemoLogin("kisan")}
              className="flex-1 py-2 px-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Demo Farmer Login</span>
              <ArrowRight className="size-3.5" />
            </button>
            <button
              onClick={() => triggerDemoLogin("enterprise")}
              className="flex-1 py-2 px-3 rounded-lg border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Demo Insurer Login</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
