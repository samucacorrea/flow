"use client";

export default function PaymentSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Payment Settings</h2>
        <p className="text-sm text-[#64748B]">Configure Stripe and billing settings.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Stripe Configuration</h3>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">
              Publishable key
              <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="pk_live_..." />
            </label>
            <label className="text-sm">
              Secret key
              <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="sk_live_..." />
            </label>
            <label className="text-sm">
              Webhook secret
              <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="whsec_..." />
            </label>
            <button className="mt-2 w-max rounded-lg bg-[#3B82F6] px-4 py-2 text-sm text-white">
              Save Stripe Settings
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Billing status</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Stripe Connected</span>
              <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-semibold text-[#15803D]">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Webhook health</span>
              <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#3B82F6]">
                Healthy
              </span>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs text-[#64748B]">
            Tip: Use Stripe test mode when validating checkout and webhooks.
          </div>
        </div>
      </div>
    </div>
  );
}
