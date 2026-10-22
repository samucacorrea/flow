"use client";

import { Workspace } from "@/lib/auth";
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

  return (
    <label className="flex items-center gap-2 text-sm font-medium text-[#475569]">
      <span>{t("workspace.switch")}</span>
      <select
        aria-label={t("workspace.switch")}
        className="rounded-md border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" disabled>
          --
        </option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </label>
  );
}
