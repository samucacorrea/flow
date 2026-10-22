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
    if (pathname) trackPageView(pathname);
  }, [pathname]);

  const activeLabel = pathname?.startsWith("/billing") ? t("nav.billing") : t("nav.boards");
  const nav = (
    <nav className="flow-nav" aria-label="Navegação principal">
      <Link href="/boards" aria-current={pathname === "/boards" ? "page" : undefined} className={pathname === "/boards" ? "active" : ""}>
        <span className="flow-nav-glyph" aria-hidden="true">▦</span>{t("nav.boards")}
      </Link>
      <Link href="/billing" aria-current={pathname === "/billing" ? "page" : undefined} className={pathname === "/billing" ? "active" : ""}>
        <span className="flow-nav-glyph" aria-hidden="true">◈</span>{t("nav.billing")}
      </Link>
      {user?.is_admin && <Link href="/admin" aria-current={pathname?.startsWith("/admin") ? "page" : undefined} className={pathname?.startsWith("/admin") ? "active" : ""}><span className="flow-nav-glyph" aria-hidden="true">⌘</span>Administração</Link>}
    </nav>
  );

  if (fullBleed) {
    return (
      <div className="flow-fullbleed-shell">
        <header className="flow-fullbleed-topbar">
          <Link href="/boards" className="flow-brand"><span className="flow-brand-mark">F</span>flowio</Link>
          <div className="flow-fullbleed-links">
            <Link href="/boards">{t("nav.boards")}</Link>
            <Link href="/billing">{t("nav.billing")}</Link>
            {user?.is_admin && <Link href="/admin">Administração</Link>}
          </div>
          <div className="flow-fullbleed-tools">
            {fullBleedSecondary}
            <WorkspaceSwitcher workspaces={workspaces} value={currentWorkspaceId} onChange={onWorkspaceChange} />
            <button className="flow-quiet-button" onClick={() => setLocale(locale === "pt" ? "en" : "pt")}>{locale.toUpperCase()}</button>
            <button className="flow-quiet-button" onClick={() => void logout()}>{t("nav.logout")}</button>
          </div>
        </header>
        <main className="flow-canvas-main">{children}</main>
      </div>
    );
  }

  return (
    <div className="flow-app-shell">
      <header className="flow-topbar">
        <div className="flow-topbar-branding">
          <Link href="/boards" className="flow-brand"><span className="flow-brand-mark">F</span>flowio</Link>
          <div className="flow-workspace-pill">
            <span className="flow-workspace-icon" aria-hidden="true">▣</span>
            <WorkspaceSwitcher workspaces={workspaces} value={currentWorkspaceId} onChange={onWorkspaceChange} />
          </div>
        </div>
        {nav}
        <div className="flow-account-tools">
          <button className="flow-quiet-button flow-locale-button" onClick={() => setLocale(locale === "pt" ? "en" : "pt")} aria-label="Mudar idioma">{locale.toUpperCase()}</button>
          <button className="flow-account-pill" onClick={() => void logout()} title={t("nav.logout")}>
            <span className="flow-avatar">{user?.name?.slice(0, 2).toUpperCase() || "FL"}</span>
            <span className="flow-account-copy"><strong>{user?.name || "Flowio"}</strong><small>{user?.email || activeLabel}</small></span>
            <span className="flow-account-chevron" aria-hidden="true">⌄</span>
          </button>
        </div>
      </header>

      <div className="flow-mobile-nav">{nav}</div>
      <main className="flow-main" key={pathname}>{children}</main>
    </div>
  );
}
