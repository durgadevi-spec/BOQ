import { useAuth } from "./auth-context";

const API_BASE = "/api";

// This will be used with a hook to inject token dynamically
let globalToken: string | null = null;

export function setAuthToken(token: string | null) {
  globalToken = token;
}

export async function apiFetch(path: string, init?: RequestInit) {
  // Prefer runtime-injected token, fall back to localStorage token for
  // cases where the auth provider hasn't set the global yet (hot-reload
  // or timing race during mount).
  const tokenFromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  const token = globalToken || tokenFromStorage;
  // Log masked token info for debugging timing issues
  const masked = token ? `${token.slice(0, 8)}...${token.slice(-8)}` : null;
  console.log('[apiFetch]', path, 'globalToken set?', !!globalToken, 'fallback token?', !!tokenFromStorage, 'token masked:', masked);
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) {
    // set both cases just for extra visibility in some environments
    headers.set("Authorization", `Bearer ${token}`);
    try {
      // also set lowercase variant to ensure middleware seeing it (headers are case-insensitive,
      // but log the actual header entries we're about to send)
      headers.set("authorization", `Bearer ${token}`);
    } catch (e) {
      // ignore
    }
    console.log('[apiFetch] Authorization header set (masked):', masked);
    console.log('[apiFetch] headers to send:', Array.from(headers.entries()));
  } else {
    console.log('[apiFetch] NO TOKEN - Authorization header NOT set');
  }

  const res = await fetch(`${API_BASE}${path}`, { ...(init || {}), headers });

  if (res.status === 401) {
    console.log('[apiFetch] 401 received, clearing globalToken');
    globalToken = null;
  }

  return res;
}

export async function getJSON(path: string) {
  const res = await apiFetch(path, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export async function postJSON(path: string, body: any) {
  const res = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export default apiFetch;
