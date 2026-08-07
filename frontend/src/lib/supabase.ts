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
 * 4. Save & Sync Plots
 */
export function savePlotsToStorage(plots: any[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PLOTS, JSON.stringify(plots));
    // Asynchronously post to Supabase endpoint if available
    syncToSupabase("plots", plots);
  } catch (e) {
    console.warn("Plots save notice:", e);
  }
}

/**
 * 5. Load Plots
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
 * 6. Save & Sync Claims
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
 * 7. Load Claims
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
