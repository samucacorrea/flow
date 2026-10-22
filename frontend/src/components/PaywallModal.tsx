"use client";

import { useI18n } from "@/lib/i18n";

export function PaywallModal({
  open,
  onClose,
  onUpgrade,
}: {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{t("paywall.title")}</h2>
        <p className="mt-2 text-sm text-[#475569]">{t("paywall.body")}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-md border border-[#E2E8F0] px-4 py-2 text-sm text-[#0F172A]"
            onClick={onClose}
          >
            {t("paywall.close")}
          </button>
          <button
            className="rounded-lg bg-[#F2674B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#DE553C]"
            onClick={onUpgrade}
          >
            {t("paywall.upgrade")}
          </button>
        </div>
      </div>
    </div>
  );
}
