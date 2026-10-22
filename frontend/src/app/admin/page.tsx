"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Overview = {
  users: number;
  admins: number;
  unlimited_users: number;
  workspaces: number;
  manual_workspaces: number;
  plans: { free: number; pro: number; team: number };
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    apiFetch<Overview>("/admin/dashboard", {}, token).then(setOverview).catch(() => setError("Não foi possível carregar o resumo."));
  }, [token]);

  const totalPlans = overview ? overview.plans.free + overview.plans.pro + overview.plans.team : 0;
  const planCards = overview ? [
    { name: "Free", count: overview.plans.free, color: "#A8ADB2" },
    { name: "Pro", count: overview.plans.pro, color: "#F2674B" },
    { name: "Team", count: overview.plans.team, color: "#087454" },
  ] : [];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#D9563D]">Visão geral</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#202123]">Painel administrativo</h1>
          <p className="mt-1 text-sm text-[#73757D]">Acompanhe contas e planos do Flowio em um só lugar.</p>
        </div>
        <Link href="/admin/users" className="rounded-full bg-[#202123] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-[#3B3C40]">Gerenciar usuários <span aria-hidden="true">↗</span></Link>
      </div>

      {error && <p role="alert" className="rounded-xl border border-[#F0C6BD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#9D3F30]">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {[
          { label: "Usuários", value: overview?.users, note: "contas cadastradas", mark: "U" },
          { label: "Workspaces", value: overview?.workspaces, note: "espaços ativos", mark: "W" },
          { label: "Acesso ilimitado", value: overview?.unlimited_users, note: "contas liberadas", mark: "∞" },
          { label: "Planos manuais", value: overview?.manual_workspaces, note: "gerenciados pelo admin", mark: "↗" },
        ].map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-[#E7E8EA] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center justify-between text-sm text-[#73757D]"><span>{metric.label}</span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1F2F3] text-xs font-bold text-[#5C5D63]">{metric.mark}</span></div>
            <div className="mt-5 text-3xl font-semibold tracking-tight text-[#202123]">{metric.value ?? <span className="inline-block h-8 w-12 animate-pulse rounded bg-[#F1F2F3]" />}</div>
            <p className="mt-1 text-xs text-[#8B8D93]">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <article className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-semibold text-[#202123]">Distribuição de planos</h2><p className="mt-1 text-sm text-[#73757D]">Plano atual de cada workspace.</p></div>
            <Link href="/admin/users" className="text-xs font-semibold text-[#D9563D] hover:text-[#AD422F]">Editar planos <span aria-hidden="true">↗</span></Link>
          </div>
          <div className="mt-8 flex flex-col gap-5">
            {planCards.map((plan) => (
              <div key={plan.name}>
                <div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-[#34353A]">{plan.name}</span><span className="text-[#73757D]">{plan.count} <span className="text-xs">workspaces</span></span></div>
                <div className="h-2 overflow-hidden rounded-full bg-[#F0F1F2]"><div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${totalPlans ? Math.max(2, (plan.count / totalPlans) * 100) : 0}%`, backgroundColor: plan.color }} /></div>
              </div>
            ))}
          </div>
        </article>

        <article className="relative overflow-hidden rounded-2xl bg-[#1D1D20] p-6 text-white shadow-[0_14px_35px_rgba(25,25,27,.16)]">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute -right-5 -top-6 h-32 w-32 rounded-full border border-white/10" />
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#FC8A70]">Ação rápida</p>
          <h2 className="mt-4 max-w-xs text-2xl font-semibold leading-tight tracking-tight">Ajuste acesso e plano sem mexer no código.</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-white/60">Escolha o plano de cada workspace e libere limites especiais para contas específicas.</p>
          <Link href="/admin/users" className="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#202123] transition hover:-translate-y-0.5 hover:bg-[#FFF0EB]">Abrir usuários <span aria-hidden="true">↗</span></Link>
        </article>
      </section>
    </div>
  );
}
