"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiError, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { trackLogin, trackPageView, trackSignUp } from "@/lib/analytics";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackPageView("/login");
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
        trackLogin("password");
      } else {
        await register(name, email, password);
        trackSignUp("password");
      }
      router.push("/boards");
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError?.message || "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-semibold">{t("auth.title")}</h1>
        <p className="mt-2 text-sm text-[#64748B]">
          {mode === "login" ? t("auth.login") : t("auth.register")}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="block text-sm">
              {t("auth.name")}
              <input
                className="mt-1 w-full rounded-md border border-[#E2E8F0] px-3 py-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
          )}
          <label className="block text-sm">
            {t("auth.email")}
            <input
              type="email"
              className="mt-1 w-full rounded-md border border-[#E2E8F0] px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm">
            {t("auth.password")}
            <input
              type="password"
              className="mt-1 w-full rounded-md border border-[#E2E8F0] px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-md bg-[#3B82F6] px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? "..." : mode === "login" ? t("auth.login") : t("auth.register")}
          </button>
        </form>
        <button
          className="mt-4 text-sm text-[#64748B]"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? t("auth.register") : t("auth.login")}
        </button>
      </div>
    </div>
  );
}
