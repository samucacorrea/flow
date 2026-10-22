"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getApiError, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { PaywallModal } from "@/components/PaywallModal";
import { trackCreateContent } from "@/lib/analytics";

type Board = {
  id: string;
  name: string;
  type: "mindmap" | "whiteboard";
};

export default function BoardsPage() {
  const router = useRouter();
  const { token, workspaces, refresh } = useAuth();
  const { t } = useI18n();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<"mindmap" | "whiteboard">("mindmap");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    refresh().catch(() => null);
  }, [token, refresh, router]);

  useEffect(() => {
    const stored = localStorage.getItem("flowio_workspace");
    if (stored) {
      setCurrentWorkspaceId(stored);
    }
  }, []);

  useEffect(() => {
    if (workspaces.length === 0) return;
    const exists = currentWorkspaceId
      ? workspaces.some((workspace) => workspace.id === currentWorkspaceId)
      : false;
    if (!exists) {
      const next = workspaces[0].id;
      setCurrentWorkspaceId(next);
      localStorage.setItem("flowio_workspace", next);
    }
  }, [workspaces, currentWorkspaceId]);

  const currentWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === currentWorkspaceId) || null,
    [workspaces, currentWorkspaceId]
  );

  const stats = useMemo(() => {
    const total = boards.length;
    const mindmaps = boards.filter((board) => board.type === "mindmap").length;
    const whiteboards = boards.filter((board) => board.type === "whiteboard").length;
    return { total, mindmaps, whiteboards };
  }, [boards]);

  const filteredBoards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return boards;
    return boards.filter((board) => board.name.toLowerCase().includes(query));
  }, [boards, search]);

  const loadBoards = useCallback(async (workspaceId: string) => {
    if (!token) return;
    const data = await apiFetch<{ boards: Board[] }>(
      `/workspaces/${workspaceId}/boards`,
      {},
      token
    );
    setBoards(data.boards);
  }, [token]);

  useEffect(() => {
    if (currentWorkspaceId) {
      loadBoards(currentWorkspaceId).catch(() => null);
    }
  }, [currentWorkspaceId, loadBoards]);

  const handleWorkspaceChange = (id: string) => {
    setCurrentWorkspaceId(id);
    localStorage.setItem("flowio_workspace", id);
  };

  const handleCreateBoard = async () => {
    if (!token || !currentWorkspaceId) return;
    setLoading(true);
    setBoardError(null);
    try {
      await apiFetch(
        `/workspaces/${currentWorkspaceId}/boards`,
        {
          method: "POST",
          body: JSON.stringify({ name, type }),
        },
        token
      );
      trackCreateContent("board", name);
      setName("");
      await loadBoards(currentWorkspaceId);
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError?.code === "board_limit_reached") {
        setPaywallOpen(true);
      } else if (apiError?.code === "forbidden") {
        setBoardError("Você não tem permissão para criar board neste workspace.");
      } else {
        setBoardError(apiError?.message || "Erro ao criar board.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (!token) return;
    setBoardError(null);
    try {
      await apiFetch(`/boards/${boardId}`, { method: "DELETE" }, token);
      setBoards((prev) => prev.filter((board) => board.id !== boardId));
    } catch (err) {
      const apiError = getApiError(err);
      setBoardError(apiError?.message || "Erro ao excluir board.");
    }
  };

  const handleCreateWorkspace = async (workspaceName: string) => {
    if (!token) return;
    setWorkspaceError(null);
    try {
      await apiFetch(
        "/workspaces",
        {
          method: "POST",
          body: JSON.stringify({ name: workspaceName }),
        },
        token
      );
      trackCreateContent("workspace", workspaceName);
      await refresh();
    } catch (err) {
      const apiError = getApiError(err);
      if (apiError?.code === "workspace_limit_reached") {
        setPaywallOpen(true);
      } else {
        setWorkspaceError(apiError?.message || "Erro ao criar workspace.");
      }
    }
  };

  if (!token) {
    return null;
  }

  return (
    <AppShell currentWorkspaceId={currentWorkspaceId} onWorkspaceChange={handleWorkspaceChange}>
      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUpgrade={() => router.push("/billing")}
      />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t("boards.title")}</h1>
            {currentWorkspace && (
              <p className="text-sm text-[#64748B]">
                {currentWorkspace.name} · {currentWorkspace.plan.toUpperCase()}
              </p>
            )}
          </div>
          <div className="flex flex-1 items-center gap-3 md:justify-end">
            <div className="relative w-full max-w-xs">
              <input
                className="w-full rounded-lg border border-[#E7E8EA] bg-white px-4 py-2 text-sm text-[#202123] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F2674B]/25"
                placeholder="Buscar boards..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-[#94A3B8]">
                ⌘K
              </span>
            </div>
            <button
              className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] shadow-sm"
              onClick={() => setSearch("")}
            >
              Limpar
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-[#E7E8EA] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-sm text-[#73757D]">Total de boards</div>
            <div className="mt-2 text-3xl font-semibold text-[#202123]">{stats.total}</div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F1F2F3] px-3 py-1 text-xs font-semibold text-[#686A72]">
              Ativos agora
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[#E7E8EA] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="text-sm text-[#73757D]">Mind maps</div>
            <div className="mt-2 text-3xl font-semibold text-[#202123]">{stats.mindmaps}</div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0EB] px-3 py-1 text-xs font-semibold text-[#D9563D]">
              Organização criativa
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-[#E7E8EA] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0EB] text-[#F2674B]">
                +
              </div>
              <div>
                <div className="text-sm text-[#64748B]">Whiteboards</div>
                <div className="text-2xl font-semibold text-[#0F172A]">{stats.whiteboards}</div>
              </div>
            </div>
            <button className="mt-4 w-full rounded-lg border border-dashed border-[#D8DADD] px-3 py-2 text-xs font-semibold text-[#73757D] hover:border-[#F2674B] hover:text-[#D9563D]">
              + Criar novo
            </button>
          </div>
        </div>

        {workspaces.length === 0 ? (
          <CreateWorkspace onCreate={handleCreateWorkspace} error={workspaceError} />
        ) : (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <label className="flex-1 text-sm">
                {t("boards.name")}
                <input
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <label className="text-sm">
                {t("boards.type")}
                <select
                  className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2"
                  value={type}
                  onChange={(event) => setType(event.target.value as "mindmap" | "whiteboard")}
                >
                  <option value="mindmap">Mind Map</option>
                  <option value="whiteboard">Whiteboard</option>
                </select>
              </label>
              <button
                className="rounded-lg bg-[#F2674B] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#DE553C]"
                onClick={handleCreateBoard}
                disabled={loading}
              >
                {t("boards.create")}
              </button>
            </div>
            {boardError && <p className="mt-3 text-sm text-red-600">{boardError}</p>}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredBoards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6 text-sm text-[#64748B]">
              {t("boards.empty")}
            </div>
          ) : (
            filteredBoards.map((board) => (
              <div
                key={board.id}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[#94A3B8]">
                      {board.type}
                    </div>
                    <div className="text-lg font-semibold">{board.name}</div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#FFF0EB] px-2 py-0.5 text-xs font-semibold text-[#D9563D]">
                      <span className="h-2 w-2 rounded-full bg-[#F2674B]" />
                      Ativo
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-lg border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                      onClick={() => router.push(`/boards/${board.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-[#F3B1A3] px-3 py-1 text-xs text-[#D9563D] hover:bg-[#FFF0EB]"
                      onClick={() => handleDeleteBoard(board.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

function CreateWorkspace({
  onCreate,
  error,
}: {
  onCreate: (name: string) => void;
  error: string | null;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name) return;
    setLoading(true);
    await onCreate(name);
    setName("");
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-6">
      <h2 className="text-lg font-semibold">{t("boards.firstWorkspaceTitle")}</h2>
      <p className="mt-1 text-sm text-[#64748B]">{t("boards.firstWorkspaceBody")}</p>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          className="flex-1 rounded-md border border-[#E2E8F0] px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button
          className="rounded-lg bg-[#F2674B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DE553C]"
          onClick={handleCreate}
          disabled={loading}
        >
          {t("boards.createWorkspace")}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
