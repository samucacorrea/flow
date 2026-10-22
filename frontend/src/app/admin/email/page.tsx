"use client";

export default function EmailConfigPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Email Configuration</h2>
        <p className="text-sm text-[#73757D]">Configure SMTP and templates.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">SMTP Settings</h3>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">
              SMTP Host
              <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
            </label>
            <label className="text-sm">
              SMTP Port
              <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
            </label>
            <label className="text-sm">
              Username
              <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
            </label>
            <label className="text-sm">
              Password
              <input type="password" className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
            </label>
            <button className="w-max rounded-lg bg-[#F2674B] px-4 py-2 text-sm text-white">
              Save SMTP
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Template Preview</h3>
          <div className="mt-4 rounded-xl border border-dashed border-[#D8DADD] bg-[#F7F8F9] p-4 text-sm text-[#73757D]">
            Olá, este é um preview do seu template de email transacional.
          </div>
          <button className="mt-4 w-full rounded-lg border border-[#E7E8EA] px-3 py-2 text-sm">
            Send test email
          </button>
        </div>
      </div>
    </div>
  );
}
