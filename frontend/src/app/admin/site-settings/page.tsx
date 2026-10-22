"use client";

export default function SiteSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Site Settings</h2>
        <p className="text-sm text-[#73757D]">Branding, domínios e recursos.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Branding</h3>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">
              Logo upload
              <input type="file" className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
            </label>
            <label className="text-sm">
              Primary color
              <input type="color" className="mt-1 h-10 w-20 rounded-lg border border-[#E7E8EA] p-1" />
            </label>
            <label className="text-sm">
              Accent color
              <input type="color" className="mt-1 h-10 w-20 rounded-lg border border-[#E7E8EA] p-1" />
            </label>
            <button className="w-max rounded-lg bg-[#F2674B] px-4 py-2 text-sm text-white">
              Save branding
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Feature toggles</h3>
          <div className="mt-4 flex flex-col gap-3 text-sm">
            {["Public sharing", "Offline mode", "Audit logs"].map((feature) => (
              <div key={feature} className="flex items-center justify-between rounded-xl border border-[#E7E8EA] px-3 py-2">
                <span>{feature}</span>
                <button className="rounded-full bg-[#E1F4EA] px-3 py-1 text-xs font-semibold text-[#17684F]">
                  Enabled
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Domain configuration</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm">
            Custom domain
            <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" placeholder="app.seudominio.com" />
          </label>
          <label className="text-sm">
            CNAME target
            <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" placeholder="flowio.hosting.com" />
          </label>
        </div>
        <button className="mt-4 w-max rounded-lg border border-[#E7E8EA] px-4 py-2 text-sm">
          Verify domain
        </button>
      </div>
    </div>
  );
}
