"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/plans", label: "Plans", icon: "💼" },
  { href: "/admin/plan-config", label: "Plan Config", icon: "⚙️" },
  { href: "/admin/payments", label: "Payments", icon: "💳" },
  { href: "/admin/email", label: "Email", icon: "✉️" },
  { href: "/admin/site-settings", label: "Site Settings", icon: "🧩" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [access, setAccess] = useState<"checking" | "granted" | "denied" | "error">("checking");

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
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-sm text-[#64748B]">Verificando acesso administrativo...</div>;
  }
  if (access !== "granted") {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 text-center text-[#334155]">Esta área é restrita a administradores.</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <div className="flex min-h-screen">
        <aside
          className={`hidden border-r border-[#E2E8F0] bg-white px-4 py-6 lg:flex ${
            collapsed ? "w-20" : "w-64"
          } flex-shrink-0 flex-col`}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white shadow-sm">
                N
              </div>
              {!collapsed && <span className="text-lg font-semibold">Flowio Admin</span>}
            </div>
            <button
              className="rounded-md border border-[#E2E8F0] px-2 py-1 text-xs text-[#64748B]"
              onClick={() => setCollapsed((prev) => !prev)}
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>

          <div className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Main Menu
          </div>
          <nav className="mt-3 flex flex-1 flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-[#EFF6FF] text-[#3B82F6]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>

          {!collapsed && (
            <div className="mt-6 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div className="text-xs text-[#64748B]">Admin Tips</div>
              <div className="mt-2 text-sm font-semibold">Audit your billing config</div>
              <button className="mt-3 w-full rounded-lg bg-[#3B82F6] px-3 py-2 text-xs font-semibold text-white shadow-sm">
                Review settings
              </button>
            </div>
          )}
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white/80 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#94A3B8]">Admin</p>
                <h1 className="text-xl font-semibold">Control Center</h1>
              </div>
              <div className="flex items-center gap-3">
                <button className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] shadow-sm">
                  Notifications
                </button>
                <button className="rounded-lg bg-[#3B82F6] px-4 py-2 text-xs font-semibold text-white shadow-sm">
                  Export Report
                </button>
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
