"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  unlimited_limits: boolean;
  created_at: string;
  workspaces: AdminWorkspace[];
};

type AdminWorkspace = {
  id: string;
  name: string;
  plan: "free" | "pro" | "team";
  subscription_status: string | null;
  manual_plan: boolean;
};

type UserPage = { data: AdminUser[]; current_page: number; last_page: number; total: number };

export default function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<UserPage>(`/admin/users?page=${page}`, {}, token);
      setUsers(result.data);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (err) {
      setError((err as ApiError)?.message || "Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, [page, token]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(normalized));
  }, [query, users]);

  const togglePermission = async (target: AdminUser, permission: "is_admin" | "unlimited_limits") => {
    if (!token) return;
    const enabled = !target[permission];
    setBusyId(target.id);
    setError("");
    try {
      const result = await apiFetch<{ user: AdminUser }>(`/admin/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [permission]: enabled }),
      }, token);
      setUsers((current) => current.map((item) => item.id === target.id ? result.user : item));
    } catch (err) {
      setError((err as ApiError)?.message || "Não foi possível salvar a permissão.");
    } finally {
      setBusyId(null);
    }
  };

  const changeWorkspacePlan = async (owner: AdminUser, workspace: AdminWorkspace, plan: AdminWorkspace["plan"]) => {
    if (!token || plan === workspace.plan) return;
    setBusyId(owner.id);
    setError("");
    try {
      const result = await apiFetch<{ workspace: AdminWorkspace }>(`/admin/workspaces/${workspace.id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      }, token);
      setUsers((current) => current.map((item) => item.id === owner.id
        ? { ...item, workspaces: item.workspaces.map((entry) => entry.id === workspace.id ? result.workspace : entry) }
        : item));
    } catch (err) {
      setError((err as ApiError)?.message || "Não foi possível alterar o plano.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#D9563D]">Administração</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#202123]">Usuários e permissões</h2>
          <p className="mt-1 text-sm text-[#73757D]">Controle quem administra o Flowio e quem tem limites ilimitados.</p>
        </div>
        <div className="rounded-xl border border-[#E7E8EA] bg-white px-4 py-3 text-sm text-[#73757D]">
          Usuários cadastrados <strong className="ml-2 text-[#202123]">{total}</strong>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-[#F0C6BD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#9D3F30]">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-[#E7E8EA] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E8EA] p-4">
          <div>
            <h3 className="font-semibold text-[#202123]">Contas</h3>
            <p className="mt-1 text-xs text-[#73757D]">As alterações são aplicadas imediatamente.</p>
          </div>
          <input
            aria-label="Buscar usuário"
            className="w-full rounded-lg border border-[#D8DADD] px-3 py-2 text-sm text-[#202123] outline-none focus:border-[#F2674B] focus:ring-4 focus:ring-[#F2674B]/10 sm:w-72"
            placeholder="Buscar por nome ou e-mail"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#73757D]">Carregando usuários...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#73757D]">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F7FAF8] text-[11px] uppercase tracking-wider text-[#73757D]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Usuário</th>
                  <th className="px-5 py-3 font-semibold">Workspaces / plano</th>
                  <th className="px-5 py-3 font-semibold">Administrador</th>
                  <th className="px-5 py-3 font-semibold">Limites ilimitados</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[#F1F2F3]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#202123]">{item.name}</div>
                      <div className="mt-1 text-xs text-[#85868D]">{item.email}</div>
                    </td>
                    <td className="px-5 py-4">
                      {item.workspaces.length ? (
                        <div className="flex min-w-56 flex-col gap-2">
                          {item.workspaces.map((workspace) => (
                            <label key={workspace.id} className="flex items-center justify-between gap-3 text-xs text-[#73757D]">
                              <span className="flex min-w-0 items-center gap-1.5"><span className="max-w-36 truncate" title={workspace.name}>{workspace.name}</span>{workspace.manual_plan && <span className="rounded-full bg-[#FFF0EB] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#D9563D]">Manual</span>}</span>
                              <select
                                aria-label={`Plano do workspace ${workspace.name}`}
                                value={workspace.plan}
                                disabled={busyId === item.id}
                                onChange={(event) => void changeWorkspacePlan(item, workspace, event.target.value as AdminWorkspace["plan"])}
                                className="rounded-lg border border-[#E7E8EA] bg-white px-2 py-1.5 font-semibold uppercase text-[#202123] outline-none transition focus:border-[#35A98E] disabled:opacity-50"
                              >
                                <option value="free">Free</option>
                                <option value="pro">Pro</option>
                                <option value="team">Team</option>
                              </select>
                            </label>
                          ))}
                        </div>
                      ) : <span className="text-xs text-[#85868D]">Sem workspace</span>}
                      <p className="mt-2 text-[10px] text-[#85868D]">Conta criada em {new Date(item.created_at).toLocaleDateString("pt-BR")}</p>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={busyId === item.id || (item.id === currentUser?.id && item.is_admin)}
                        onClick={() => void togglePermission(item, "is_admin")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${item.is_admin ? "bg-[#DDF5EC] text-[#08795F]" : "bg-[#F0F3F2] text-[#61736F] hover:bg-[#E4EBE8]"}`}
                        title={item.id === currentUser?.id && item.is_admin ? "Não é possível remover seu próprio acesso" : "Alterar acesso administrativo"}
                      >
                        {item.is_admin ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void togglePermission(item, "unlimited_limits")}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${item.unlimited_limits ? "bg-[#DDF5EC] text-[#08795F]" : "bg-[#F0F3F2] text-[#61736F] hover:bg-[#E4EBE8]"}`}
                      >
                        {item.unlimited_limits ? "Ilimitado" : "Plano padrão"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#E7E8EA] px-5 py-3 text-xs text-[#73757D]">
          <span>Página {page} de {lastPage}</span>
          <div className="flex gap-2">
            <button className="rounded-md border border-[#E7E8EA] px-3 py-1.5 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</button>
            <button className="rounded-md border border-[#E7E8EA] px-3 py-1.5 disabled:opacity-40" disabled={page >= lastPage || loading} onClick={() => setPage((value) => value + 1)}>Próxima</button>
          </div>
        </div>
      </section>
    </div>
  );
}
