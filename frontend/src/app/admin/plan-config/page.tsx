"use client";

export default function PlanConfigPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Plan Configuration</h2>
        <p className="text-sm text-[#64748B]">Defina limites, storage e acessos.</p>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <label className="text-sm">
            Workspace limit
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="1" />
          </label>
          <label className="text-sm">
            Members limit
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="5" />
          </label>
          <label className="text-sm">
            Mindmaps limit
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="Unlimited" />
          </label>
          <label className="text-sm">
            Whiteboards limit
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="Unlimited" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Storage limits</h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <label className="text-sm">
            Storage per workspace (GB)
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="50" />
          </label>
          <label className="text-sm">
            File upload limit (MB)
            <input className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" placeholder="50" />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Feature access</h3>
        <div className="mt-4 grid gap-4">
          {[
            "PDF Export",
            "Version history",
            "Advanced templates",
            "Custom branding",
          ].map((feature) => (
            <div key={feature} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] px-4 py-3">
              <div>
                <div className="text-sm font-semibold">{feature}</div>
                <div className="text-xs text-[#94A3B8]">Toggle access per plan</div>
              </div>
              <button className="rounded-full bg-[#DCFCE7] px-4 py-1 text-xs font-semibold text-[#15803D]">
                Enabled
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
