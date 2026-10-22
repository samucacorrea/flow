"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getApiError, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { trackBeginCheckout, trackPurchase, trackViewItem } from "@/lib/analytics";

export default function BillingPage() {
  const router = useRouter();
  const { token, workspaces, refresh } = useAuth();
  const { t } = useI18n();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    refresh().catch(() => null);
  }, [token, refresh, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const plan = params.get("plan");
    if (status === "success") {
      setSuccess(t("billing.success"));
      if (plan) {
        trackPurchase(plan);
      }
    }
    if (status === "cancel") {
      setError(t("billing.cancel"));
    }
  }, [t]);

  useEffect(() => {
    const stored = localStorage.getItem("flowio_workspace");
    if (stored) {
      setCurrentWorkspaceId(stored);
    }
  }, []);

  useEffect(() => {
    if (!currentWorkspaceId && workspaces.length > 0) {
      const next = workspaces[0].id;
      setCurrentWorkspaceId(next);
      localStorage.setItem("flowio_workspace", next);
    }
  }, [workspaces, currentWorkspaceId]);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  );

  const handleWorkspaceChange = (id: string) => {
    setCurrentWorkspaceId(id);
    localStorage.setItem("flowio_workspace", id);
  };

  const startCheckout = async (plan: "pro" | "team") => {
    if (!token || !currentWorkspaceId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      trackBeginCheckout(plan);
      const data = await apiFetch<{ url: string }>(
        `/workspaces/${currentWorkspaceId}/checkout`,
        {
          method: "POST",
          body: JSON.stringify({ plan }),
        },
        token
      );
      window.location.href = data.url;
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError?.message || "Erro ao iniciar checkout.");
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    if (!token || !currentWorkspaceId) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (currentWorkspace?.plan) {
        trackViewItem(currentWorkspace.plan);
      }
      const data = await apiFetch<{ url: string }>(
        `/workspaces/${currentWorkspaceId}/portal`,
        {},
        token
      );
      window.location.href = data.url;
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError?.message || "Erro ao abrir portal.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <AppShell currentWorkspaceId={currentWorkspaceId} onWorkspaceChange={handleWorkspaceChange}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#D9563D]">Workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#202123]">{t("billing.title")}</h1>
          {currentWorkspace && (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#73757D]">
              <span>{currentWorkspace.name} · {currentWorkspace.plan.toUpperCase()} · {currentWorkspace.subscription_status || "-"}</span>
              {currentWorkspace.manual_plan && <span className="rounded-full bg-[#FFF0EB] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#D9563D]">Plano manual</span>}
            </div>
          )}
        </div>

        {success && (
          <div className="rounded-2xl border border-[#CBE9DC] bg-[#EFF9F4] p-4 text-sm text-[#17684F]">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold text-[#202123]">Pro</h2>{currentWorkspace?.plan === "pro" && <span className="rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-semibold text-[#D9563D]">Plano atual</span>}</div>
            <p className="mt-2 text-sm text-[#64748B]">{t("billing.proDesc")}</p>
            <button
              className="mt-4 rounded-lg bg-[#F2674B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#DE553C]"
              onClick={() => startCheckout("pro")}
              disabled={loading || currentWorkspace?.manual_plan}
            >
              {currentWorkspace?.manual_plan ? "Gerenciado pelo admin" : t("billing.upgradePro")}
            </button>
          </div>
          <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold text-[#202123]">Team</h2>{currentWorkspace?.plan === "team" && <span className="rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-semibold text-[#D9563D]">Plano atual</span>}</div>
            <p className="mt-2 text-sm text-[#64748B]">{t("billing.teamDesc")}</p>
            <button
              className="mt-4 rounded-lg bg-[#202123] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#3B3C40]"
              onClick={() => startCheckout("team")}
              disabled={loading || currentWorkspace?.manual_plan}
            >
              {currentWorkspace?.manual_plan ? "Gerenciado pelo admin" : t("billing.upgradeTeam")}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">{t("billing.portalTitle")}</h2>
          <p className="mt-2 text-sm text-[#64748B]">{t("billing.portalBody")}</p>
          <button
            className="mt-4 rounded-lg border border-[#E2E8EA] px-4 py-2 text-sm font-medium text-[#202123] hover:bg-[#F7F8F9]"
            onClick={openPortal}
            disabled={loading || currentWorkspace?.manual_plan}
          >
            {currentWorkspace?.manual_plan ? "Cobrança gerenciada pelo administrador" : t("billing.portal")}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </AppShell>
  );
}
