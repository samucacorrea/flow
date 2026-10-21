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
          <h1 className="text-2xl font-semibold">{t("billing.title")}</h1>
          {currentWorkspace && (
            <p className="text-sm text-[#64748B]">
              {currentWorkspace.name} · {currentWorkspace.plan.toUpperCase()} · {currentWorkspace.subscription_status || "-"}
            </p>
          )}
        </div>

        {success && (
          <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-sm text-[#166534]">
            {success}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="mt-2 text-sm text-[#64748B]">{t("billing.proDesc")}</p>
            <button
              className="mt-4 rounded-md bg-[#3B82F6] px-4 py-2 text-sm text-white"
              onClick={() => startCheckout("pro")}
              disabled={loading}
            >
              {t("billing.upgradePro")}
            </button>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <h2 className="text-lg font-semibold">Team</h2>
            <p className="mt-2 text-sm text-[#64748B]">{t("billing.teamDesc")}</p>
            <button
              className="mt-4 rounded-md bg-[#8B5CF6] px-4 py-2 text-sm text-white"
              onClick={() => startCheckout("team")}
              disabled={loading}
            >
              {t("billing.upgradeTeam")}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
          <h2 className="text-lg font-semibold">{t("billing.portalTitle")}</h2>
          <p className="mt-2 text-sm text-[#64748B]">{t("billing.portalBody")}</p>
          <button
            className="mt-4 rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#0F172A]"
            onClick={openPortal}
            disabled={loading}
          >
            {t("billing.portal")}
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </AppShell>
  );
}
