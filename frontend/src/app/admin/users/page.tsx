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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#0F8A70]">Administração</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#123B39]">Usuários e permissões</h2>
          <p className="mt-1 text-sm text-[#647D79]">Controle quem administra o Flowio e quem tem limites ilimitados.</p>
        </div>
        <div className="rounded-xl border border-[#DCEAE5] bg-white px-4 py-3 text-sm text-[#45645F]">
          Usuários cadastrados <strong className="ml-2 text-[#123B39]">{total}</strong>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-[#F0C6BD] bg-[#FFF5F2] px-4 py-3 text-sm text-[#9D3F30]">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-[#DFEAE6] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0ED] p-4">
          <div>
            <h3 className="font-semibold text-[#183E3A]">Contas</h3>
            <p className="mt-1 text-xs text-[#78908C]">As alterações são aplicadas imediatamente.</p>
          </div>
          <input
            aria-label="Buscar usuário"
            className="w-full rounded-lg border border-[#D8E5E0] px-3 py-2 text-sm text-[#173C39] outline-none focus:border-[#31A98D] focus:ring-4 focus:ring-[#31A98D]/10 sm:w-72"
            placeholder="Buscar por nome ou e-mail"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-[#718985]">Carregando usuários...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#718985]">Nenhum usuário encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[#F7FAF8] text-[11px] uppercase tracking-wider text-[#77908B]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Usuário</th>
                  <th className="px-5 py-3 font-semibold">Criado em</th>
                  <th className="px-5 py-3 font-semibold">Administrador</th>
                  <th className="px-5 py-3 font-semibold">Limites ilimitados</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-[#EDF2F0]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#183E3A]">{item.name}</div>
                      <div className="mt-1 text-xs text-[#809590]">{item.email}</div>
                    </td>
                    <td className="px-5 py-4 text-[#5D7772]">{new Date(item.created_at).toLocaleDateString("pt-BR")}</td>
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

        <div className="flex items-center justify-between border-t border-[#E8F0ED] px-5 py-3 text-xs text-[#718985]">
          <span>Página {page} de {lastPage}</span>
          <div className="flex gap-2">
            <button className="rounded-md border border-[#DCE8E4] px-3 py-1.5 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</button>
            <button className="rounded-md border border-[#DCE8E4] px-3 py-1.5 disabled:opacity-40" disabled={page >= lastPage || loading} onClick={() => setPage((value) => value + 1)}>Próxima</button>
          </div>
        </div>
      </section>
    </div>
  );
}
