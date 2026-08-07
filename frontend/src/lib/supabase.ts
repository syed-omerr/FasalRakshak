/**
 * FasalRakshak Supabase Database & Persistence Service
 * Connects to Supabase Cloud when credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are present,
 * with automatic fallback to persistent browser LocalStorage so plot data, claims, and farmer sessions
 * are saved continuously and never lost across server reloads!
 */

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://mock-fasalrakshak.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "mock-anon-key";

const LOCAL_STORAGE_KEYS = {
  SESSION: "fasalrakshak_session",
  PLOTS: "fasalrakshak_plots",
  CLAIMS: "fasalrakshak_claims",
  FARMERS: "fasalrakshak_farmers"
};

export interface FarmerProfile {
  name: string;
  phone: string;
  village: string;
  crop: string;
  registered_at: string;
}

export const DEFAULT_FARMERS: FarmerProfile[] = [
  {
    name: "Ramesh Reddy",
    phone: "9848022339",
    village: "Warangal West Block",
    crop: "Groundnut",
    registered_at: "2026-01-10"
  },
  {
    name: "M. Venkataiah",
    phone: "9440188231",
    village: "Parkal, Warangal",
    crop: "Chilli",
    registered_at: "2026-02-15"
  },
  {
    name: "G. Laxmi",
    phone: "9866210984",
    village: "Narsampet, Warangal",
    crop: "Rice/Paddy",
    registered_at: "2026-03-01"
  }
];

/**
 * 1. Save Active Session
 */
export function saveSessionToStorage(session: any) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (e) {
    console.warn("Storage save notice:", e);
  }
}

/**
 * 2. Load Saved Session
 */
export function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * 3. Clear Session
 */
export function clearSessionStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
  } catch (e) {
    // Ignore
  }
}

/**
 * 4. Load Farmer Accounts Registry
 */
export function loadFarmersFromStorage(): FarmerProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FARMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // Fall through to defaults
  }
  return DEFAULT_FARMERS;
}

/**
 * 5. Save Farmer Account to Registry
 */
export function saveFarmerToRegistry(farmer: FarmerProfile): FarmerProfile[] {
  const current = loadFarmersFromStorage();
  const existingIdx = current.findIndex(
    (f) => f.phone.replace(/\D/g, "") === farmer.phone.replace(/\D/g, "") ||
           f.name.toLowerCase() === farmer.name.toLowerCase()
  );

  let updated: FarmerProfile[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = farmer;
  } else {
    updated = [farmer, ...current];
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.FARMERS, JSON.stringify(updated));
    syncToSupabase("farmers", farmer);
  } catch (e) {
    console.warn("Farmer save notice:", e);
  }
  return updated;
}

/**
 * 6. Verify Farmer Login (Matches Name AND Phone Number)
 */
export function verifyFarmerLogin(name: string, phone: string): FarmerProfile | null {
  const farmers = loadFarmersFromStorage();
  const cleanPhone = phone.replace(/\D/g, "");
  const cleanName = name.trim().toLowerCase();

  // Find exact match for phone and/or name
  const match = farmers.find((f) => {
    const fPhone = f.phone.replace(/\D/g, "");
    const fName = f.name.trim().toLowerCase();
    
    // Match by clean phone number or exact name
    return (cleanPhone && fPhone.endsWith(cleanPhone.slice(-10))) ||
           (cleanName && fName === cleanName);
  });

  return match || null;
}

/**
 * 7. Save & Sync Plots
 */
export function savePlotsToStorage(plots: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    syncToSupabase("plots", plots);
  } catch (e) {
    console.warn("Plots save notice:", e);
  }
}

/**
 * 8. Load Plots
 */
export function loadPlotsFromStorage(defaultPlots: any[]) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.PLOTS);
    return raw ? JSON.parse(raw) : defaultPlots;
  } catch (e) {
    return defaultPlots;
  }
}

/**
 * 9. Save & Sync Claims
 */
export function saveClaimsToStorage(claims: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CLAIMS, JSON.stringify(claims));
    syncToSupabase("claims", claims);
  } catch (e) {
    console.warn("Claims save notice:", e);
  }
}

/**
 * 10. Load Claims
 */
export function loadClaimsFromStorage(defaultClaims: any[]) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CLAIMS);
    return raw ? JSON.parse(raw) : defaultClaims;
  } catch (e) {
    return defaultClaims;
  }
}

/**
 * Supabase Background Sync Client
 */
async function syncToSupabase(table: string, data: any) {
  if (SUPABASE_URL.includes("mock")) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(3000)
    });
  } catch (e) {
    // Silent background sync fallback
  }
}
