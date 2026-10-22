"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

export type User = {
  id: number;
  name: string;
  email: string;
  is_admin?: boolean;
  unlimited_limits?: boolean;
};

export type Workspace = {
  id: string;
  name: string;
  plan: string;
  subscription_status: string | null;
  manual_plan?: boolean;
  pivot?: { role: string };
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  workspaces: Workspace[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setToken: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("flowio_token");
  });
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("flowio_token", token);
    } else {
      localStorage.removeItem("flowio_token");
    }
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    const data = await apiFetch<{ user: User & { workspaces?: Workspace[] } }>(
      "/me",
      {},
      token
    );
    setUser({ id: data.user.id, name: data.user.name, email: data.user.email });
    setWorkspaces(data.user.workspaces || []);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await apiFetch("/logout", { method: "POST" }, token);
    }
    setToken(null);
    setUser(null);
    setWorkspaces([]);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, workspaces, login, register, logout, refresh, setToken }),
    [token, user, workspaces, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function getApiError(error: unknown): ApiError | null {
  if (!error || typeof error !== "object") return null;
  const anyErr = error as ApiError;
  if (typeof anyErr.message === "string" && typeof anyErr.code === "string") {
    return anyErr;
  }
  return null;
}
