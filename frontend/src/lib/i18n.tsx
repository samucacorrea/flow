"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Locale = "pt" | "en";

type Dictionary = Record<string, Record<Locale, string>>;

const dictionary: Dictionary = {
  "nav.boards": { pt: "Boards", en: "Boards" },
  "nav.billing": { pt: "Plano", en: "Billing" },
  "nav.logout": { pt: "Sair", en: "Logout" },
  "auth.title": { pt: "Entrar no Flowio", en: "Sign in to Flowio" },
  "auth.email": { pt: "Email", en: "Email" },
  "auth.password": { pt: "Senha", en: "Password" },
  "auth.name": { pt: "Nome", en: "Name" },
  "auth.login": { pt: "Entrar", en: "Sign In" },
  "auth.register": { pt: "Criar conta", en: "Create account" },
  "boards.title": { pt: "Seus Boards", en: "Your Boards" },
  "boards.create": { pt: "Criar board", en: "Create board" },
  "boards.empty": { pt: "Nenhum board ainda.", en: "No boards yet." },
  "boards.name": { pt: "Nome", en: "Name" },
  "boards.type": { pt: "Tipo", en: "Type" },
  "boards.firstWorkspaceTitle": { pt: "Crie seu primeiro workspace", en: "Create your first workspace" },
  "boards.firstWorkspaceBody": { pt: "Dê um nome para começar a criar boards.", en: "Give it a name to start creating boards." },
  "boards.createWorkspace": { pt: "Criar workspace", en: "Create workspace" },
  "billing.title": { pt: "Plano & Billing", en: "Plan & Billing" },
  "billing.upgradePro": { pt: "Upgrade Pro", en: "Upgrade Pro" },
  "billing.upgradeTeam": { pt: "Upgrade Team", en: "Upgrade Team" },
  "billing.portal": { pt: "Abrir portal", en: "Open portal" },
  "billing.proDesc": { pt: "1 workspace · até 5 membros · PDF", en: "1 workspace · up to 5 members · PDF" },
  "billing.teamDesc": { pt: "workspaces ilimitados · membros ilimitados · PDF", en: "unlimited workspaces · unlimited members · PDF" },
  "billing.portalTitle": { pt: "Portal", en: "Portal" },
  "billing.portalBody": { pt: "Gerencie sua assinatura diretamente no Stripe.", en: "Manage your subscription in Stripe." },
  "billing.success": { pt: "Upgrade iniciado com sucesso. Atualize o status em instantes.", en: "Upgrade started successfully. Status will update shortly." },
  "billing.cancel": { pt: "Checkout cancelado.", en: "Checkout canceled." },
  "workspace.switch": { pt: "Workspace", en: "Workspace" },
  "paywall.title": { pt: "Limite atingido", en: "Limit reached" },
  "paywall.body": { pt: "Faça upgrade para continuar.", en: "Upgrade to continue." },
  "paywall.close": { pt: "Fechar", en: "Close" },
  "paywall.upgrade": { pt: "Upgrade", en: "Upgrade" },
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof dictionary) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "pt";
    const stored = localStorage.getItem("flowio_locale") as Locale | null;
    if (stored === "pt" || stored === "en") {
      return stored;
    }
    return "pt";
  });

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("flowio_locale", next);
  };

  const t = useCallback(
    (key: keyof typeof dictionary) => dictionary[key]?.[locale] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useI18n must be used within LocaleProvider");
  }
  return context;
}
