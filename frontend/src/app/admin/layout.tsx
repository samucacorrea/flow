"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const navItems = [
  { href: "/admin", label: "Painel", glyph: "▦" },
  { href: "/admin/users", label: "Usuários e planos", glyph: "◎" },
  { href: "/admin/plans", label: "Planos", glyph: "◇" },
  { href: "/admin/payments", label: "Pagamentos", glyph: "▤" },
  { href: "/admin/plan-config", label: "Configuração", glyph: "☷" },
  { href: "/admin/email", label: "E-mail", glyph: "✉" },
  { href: "/admin/site-settings", label: "Site", glyph: "⌘" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [access, setAccess] = useState<"checking" | "granted" | "denied">("checking");

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }
    apiFetch<{ is_admin: boolean }>("/admin/access", {}, token)
      .then(({ is_admin }) => setAccess(is_admin ? "granted" : "denied"))
      .catch(() => setAccess("denied"));
  }, [token, router]);

  if (!token || access === "checking") {
    return <div className="admin-gate">Validando acesso administrativo...</div>;
  }
  if (access !== "granted") {
    return <div className="admin-gate">Esta área é restrita a administradores.</div>;
  }

  return (
    <div className="flow-admin-shell">
      <header className="flow-topbar admin-topbar">
        <div className="flow-topbar-branding">
          <Link href="/boards" className="flow-brand"><span className="flow-brand-mark">F</span>flowio</Link>
          <span className="admin-context-pill">ADMINISTRAÇÃO</span>
        </div>
        <nav className="flow-nav admin-nav" aria-label="Navegação administrativa">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""} aria-current={pathname === item.href ? "page" : undefined}>
              <span className="flow-nav-glyph" aria-hidden="true">{item.glyph}</span>{item.label}
            </Link>
          ))}
        </nav>
        <button className="flow-account-pill" onClick={() => void logout()} title="Sair">
          <span className="flow-avatar">{user?.name?.slice(0, 2).toUpperCase() || "AD"}</span>
          <span className="flow-account-copy"><strong>{user?.name || "Administrador"}</strong><small>Admin · Sair</small></span>
          <span className="flow-account-chevron" aria-hidden="true">⌄</span>
        </button>
      </header>
      <div className="flow-admin-mobile-nav">
        <nav className="flow-nav" aria-label="Navegação administrativa">
          {navItems.slice(0, 4).map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>{item.label}</Link>)}
        </nav>
      </div>
      <main className="flow-admin-main" key={pathname}>{children}</main>
    </div>
  );
}
