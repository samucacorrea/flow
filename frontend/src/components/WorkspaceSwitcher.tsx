"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Workspace, useAuth, getApiError } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function WorkspaceSwitcher({
  workspaces,
  value,
  onChange,
}: {
  workspaces: Workspace[];
  value: string | null;
  onChange: (id: string) => void;
}) {
  const { t } = useI18n();
  const { token, refresh } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const selected = workspaces.find((workspace) => workspace.id === value);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setCreateOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const createWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !name.trim()) return;

    setCreating(true);
    setError("");
    try {
      const result = await apiFetch<{ workspace: Workspace }>("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      }, token);
      await refresh().catch(() => undefined);
      localStorage.setItem("flowio_workspace", result.workspace.id);
      onChange(result.workspace.id);
      setName("");
      setCreateOpen(false);
      setOpen(false);
    } catch (cause) {
      const apiError = getApiError(cause);
      setError(apiError?.code === "workspace_limit_reached"
        ? "O plano atual atingiu o limite de workspaces. Peça a um administrador para ajustar o plano."
        : apiError?.message || "Não foi possível criar o workspace.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="workspace-switcher" ref={rootRef}>
        <button
          type="button"
          className="workspace-switcher-trigger"
          aria-label={t("workspace.switch")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((isOpen) => !isOpen)}
        >
          <span className="workspace-switcher-icon" aria-hidden="true">▣</span>
          <span className="workspace-switcher-name">{selected?.name || t("workspace.switch")}</span>
          <span className={`workspace-switcher-chevron${open ? " is-open" : ""}`} aria-hidden="true">⌄</span>
        </button>

        {open && (
          <div className="workspace-switcher-menu" role="menu" aria-label={t("workspace.switch")}>
            <div className="workspace-switcher-heading">Seus workspaces</div>
            <div className="workspace-switcher-list">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={workspace.id === value}
                  className={`workspace-switcher-option${workspace.id === value ? " is-selected" : ""}`}
                  onClick={() => {
                    onChange(workspace.id);
                    localStorage.setItem("flowio_workspace", workspace.id);
                    setOpen(false);
                  }}
                >
                  <span className="workspace-option-mark" aria-hidden="true">▣</span>
                  <span className="workspace-option-name">{workspace.name}</span>
                  {workspace.id === value && <span className="workspace-option-check" aria-hidden="true">✓</span>}
                </button>
              ))}
            </div>
            <div className="workspace-switcher-divider" />
            <button
              type="button"
              role="menuitem"
              className="workspace-switcher-create"
              onClick={() => {
                setError("");
                setCreateOpen(true);
              }}
            >
              <span aria-hidden="true">+</span> Criar workspace
            </button>
          </div>
        )}
      </div>
      {createOpen && typeof document !== "undefined" && createPortal(
        <div
          className="workspace-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) setCreateOpen(false);
          }}
        >
          <form
            className="workspace-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-modal-title"
            onSubmit={createWorkspace}
          >
            <div className="workspace-modal-topline">
              <span className="workspace-modal-icon" aria-hidden="true">+</span>
              <button
                type="button"
                className="workspace-modal-close"
                aria-label="Fechar"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >×</button>
            </div>
            <p className="workspace-modal-eyebrow">NOVO ESPAÇO</p>
            <h2 id="workspace-modal-title">Criar workspace</h2>
            <p className="workspace-modal-description">Dê um nome ao espaço onde seus boards ficarão organizados.</p>
            <label className="workspace-modal-label" htmlFor="new-workspace-name">Nome do workspace</label>
            <input
              autoFocus
              id="new-workspace-name"
              className="workspace-modal-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Marketing, Projeto novo"
              maxLength={120}
              required
            />
            {error && <p className="workspace-modal-error" role="alert">{error}</p>}
            <div className="workspace-modal-actions">
              <button type="button" className="workspace-modal-cancel" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</button>
              <button type="submit" className="workspace-modal-submit" disabled={creating || !name.trim()}>
                {creating ? "Criando..." : "Criar workspace"}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </>
  );
}
