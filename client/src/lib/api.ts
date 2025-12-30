import { useAuth } from "./auth-context";

const API_BASE = "/api";

// This will be used with a hook to inject token dynamically
let globalToken: string | null = null;

export function setAuthToken(token: string | null) {
  globalToken = token;
}

export async function apiFetch(path: string, init?: RequestInit) {
  const token = globalToken;
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...(init || {}), headers });

  if (res.status === 401) {
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
