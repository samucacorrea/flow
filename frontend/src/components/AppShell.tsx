"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { trackPageView } from "@/lib/analytics";

export function AppShell({
  children,
  currentWorkspaceId,
  onWorkspaceChange,
  fullBleed = false,
  fullBleedSecondary,
}: {
  children: React.ReactNode;
  currentWorkspaceId: string | null;
  onWorkspaceChange: (id: string) => void;
  fullBleed?: boolean;
  fullBleedSecondary?: React.ReactNode;
}) {
  const pathname = usePathname();
  const { workspaces, logout, user } = useAuth();
  const { locale, setLocale, t } = useI18n();

  useEffect(() => {
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname]);

  if (fullBleed) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
        <header className="border-b border-[#E2E8F0] bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
            <div className="flex items-center gap-6">
              <div className="text-lg font-semibold text-[#0F172A]">Flowio</div>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/boards"
                  className={pathname === "/boards" ? "text-[#0F172A]" : "text-[#64748B]"}
                >
                  {t("nav.boards")}
                </Link>
                <Link
                  href="/billing"
                  className={pathname === "/billing" ? "text-[#0F172A]" : "text-[#64748B]"}
                >
                  {t("nav.billing")}
                </Link>
              </nav>
            </div>
            {fullBleedSecondary && (
              <div className="flex flex-1 items-center justify-between gap-4">
                {fullBleedSecondary}
              </div>
            )}
            <div className="flex items-center gap-4">
              <WorkspaceSwitcher
                workspaces={workspaces}
                value={currentWorkspaceId}
                onChange={onWorkspaceChange}
              />
              <button
                className="rounded-full border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
              >
                {locale.toUpperCase()}
              </button>
              <button className="text-sm text-[#64748B]" onClick={() => logout()}>
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </header>
        <main className="w-full px-6 py-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-[#E2E8F0] bg-white px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F97316] text-white shadow-sm">
              ◎
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#0F172A]">Flowio</span>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-1 text-sm">
            <Link
              href="/boards"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition ${
                pathname === "/boards"
                  ? "bg-[#EFF6FF] text-[#3B82F6]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              }`}
            >
              <span className="text-base">🏠</span>
              {t("nav.boards")}
            </Link>
            <Link
              href="/billing"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition ${
                pathname === "/billing"
                  ? "bg-[#EFF6FF] text-[#3B82F6]"
                  : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              }`}
            >
              <span className="text-base">💳</span>
              {t("nav.billing")}
            </Link>
            <button className="flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]">
              <span className="text-base">👥</span>
              Shared
              <span className="ml-auto rounded-full bg-[#F97316]/10 px-2 py-0.5 text-xs font-semibold text-[#F97316]">
                3
              </span>
            </button>
          </nav>
          <div className="mt-6 rounded-xl border border-[#F97316]/20 bg-[#F97316]/10 p-4">
            <div className="flex items-center justify-between text-xs text-[#F97316]">
              <span className="rounded-full bg-white px-2 py-0.5">Upgrade</span>
              <button className="text-[#F97316]/80">✕</button>
            </div>
            <h4 className="mt-2 text-sm font-semibold text-[#0F172A]">Upgrade para Pro</h4>
            <p className="mt-1 text-xs text-[#64748B]">Desbloqueie boards ilimitados e export.</p>
            <button className="mt-3 w-full rounded-lg border border-[#F97316]/20 bg-white px-3 py-2 text-xs font-semibold text-[#0F172A]">
              Ver planos
            </button>
          </div>
          <div className="mt-4 rounded-lg border border-[#E2E8F0] p-3">
            <p className="text-xs text-[#94A3B8]">Workspace</p>
            <div className="mt-2">
              <WorkspaceSwitcher
                workspaces={workspaces}
                value={currentWorkspaceId}
                onChange={onWorkspaceChange}
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button
                className="rounded-full border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                onClick={() => setLocale(locale === "pt" ? "en" : "pt")}
              >
                {locale.toUpperCase()}
              </button>
              <button className="text-xs text-[#64748B]" onClick={() => logout()}>
                {t("nav.logout")}
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#E2E8F0] p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E2E8F0] text-xs font-semibold text-[#64748B]">
              {user?.name?.slice(0, 2).toUpperCase() || "UI"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#0F172A]">
                {user?.name || "Usuário"}
              </p>
              <p className="truncate text-xs text-[#94A3B8]">{user?.email || ""}</p>
            </div>
          </div>
        </aside>
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/80 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard</h1>
                <p className="text-xs text-[#94A3B8]">Visão geral do workspace</p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="relative">
                  <input
                    className="w-64 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#0F172A] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]/30"
                    placeholder="Buscar..."
                  />
                  <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[#94A3B8]">
                    ⌘K
                  </span>
                </div>
                <button className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] shadow-sm">
                  Notificações
                </button>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
