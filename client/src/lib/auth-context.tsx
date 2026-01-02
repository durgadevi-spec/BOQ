import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { setAuthToken } from "./api";

export type UserRole = "admin" | "supplier" | "user" | "purchase_team" | "software_team" | null;

interface User {
  id: string;
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update global token whenever token state changes; persist to localStorage
  // Restore token from localStorage on mount so login persists across page refreshes
  useEffect(() => {
    const stored = localStorage.getItem('authToken');
    console.log('[AuthProvider] mount: stored token?', !!stored, 'length:', stored?.length || 0);
    if (stored) {
      console.log('[AuthProvider] restoring token from localStorage');
      setToken(stored);
      setAuthToken(stored);
    }
  }, []);

  // Update global token whenever token state changes; persist to localStorage.
  // Do NOT remove the stored token automatically when `token` becomes null during mount
  // (that could clear a restored token). Only persist when a real token is set.
  useEffect(() => {
    console.log('[AuthProvider] token state changed, token?', !!token, 'calling setAuthToken');
    setAuthToken(token);
    if (token) {
      console.log('[AuthProvider] saving token to localStorage');
      localStorage.setItem('authToken', token);
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const { user: userObj, token: authToken } = await res.json();
      setUser(userObj);
      setToken(authToken);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string, role: UserRole) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: role || 'user' })
      });
      if (!res.ok) throw new Error('Signup failed');
      const { user: userObj, token: authToken } = await res.json();
      setUser(userObj);
      setToken(authToken);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try { localStorage.removeItem('authToken'); } catch (e) { /* ignore */ }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, signup, logout, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
