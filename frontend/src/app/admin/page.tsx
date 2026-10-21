"use client";

const metrics = [
  {
    title: "Revenue Overview",
    value: "$92,430",
    delta: "+12%",
    tone: "from-[#3B82F6] to-[#60A5FA]",
  },
  {
    title: "Active Users",
    value: "8,430",
    delta: "+5.2%",
    tone: "from-[#8B5CF6] to-[#A78BFA]",
  },
  {
    title: "Subscription Growth",
    value: "24%",
    delta: "+2.1%",
    tone: "from-[#22C55E] to-[#86EFAC]",
  },
];

const traffic = [
  { label: "Direct", value: 45, color: "#3B82F6" },
  { label: "Referral", value: 32, color: "#8B5CF6" },
  { label: "Social", value: 23, color: "#94A3B8" },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <p className="text-sm text-[#64748B]">
          Acompanhe receitas, usuários ativos e crescimento de assinaturas.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${metric.tone} p-5 text-white shadow-lg`}
          >
            <div className="text-sm text-white/80">{metric.title}</div>
            <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
              {metric.delta} vs último mês
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue Overview</h3>
              <p className="text-sm text-[#64748B]">Últimos 6 meses</p>
            </div>
            <button className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#0F172A]">
              Last 6 Months
            </button>
          </div>
          <div className="mt-6 h-56 rounded-xl bg-gradient-to-b from-[#EFF6FF] to-transparent p-4">
            <div className="flex h-full items-end justify-between gap-2">
              {[40, 48, 44, 52, 58, 70].map((value, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-[#3B82F6] to-[#8B5CF6]"
                    style={{ height: `${value}%` }}
                  />
                  <span className="text-xs text-[#94A3B8]">
                    {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Traffic Sources</h3>
          <div className="mt-6 flex flex-col gap-4">
            {traffic.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-20 text-sm text-[#64748B]">{item.label}</div>
                <div className="flex-1 rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                  />
                </div>
                <div className="text-xs text-[#64748B]">{item.value}%</div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs text-[#3B82F6]">
            View Full Report
          </button>
        </div>
      </section>
    </div>
  );
}
