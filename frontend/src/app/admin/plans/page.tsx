"use client";

import { useState } from "react";

const plans = [
  { id: "free", name: "Free", price: "$0", users: "2 members", boards: "3 mindmaps + 3 whiteboards" },
  { id: "pro", name: "Pro", price: "$12/mo", users: "5 members", boards: "Unlimited" },
  { id: "team", name: "Team", price: "$29/mo", users: "Unlimited members", boards: "Unlimited" },
];

export default function PlansPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Plans Management</h2>
          <p className="text-sm text-[#73757D]">Crie e ajuste planos e preços.</p>
        </div>
        <button
          className="rounded-lg bg-[#F2674B] px-4 py-2 text-sm font-semibold text-white shadow-sm"
          onClick={() => setModalOpen(true)}
        >
          Create plan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-[#E7E8EA] bg-white p-6 shadow-sm">
            <div className="text-xs uppercase tracking-widest text-[#96989E]">{plan.name}</div>
            <div className="mt-2 text-2xl font-semibold">{plan.price}</div>
            <div className="mt-4 text-sm text-[#73757D]">{plan.users}</div>
            <div className="text-sm text-[#73757D]">{plan.boards}</div>
            <button className="mt-4 w-full rounded-lg border border-[#E7E8EA] px-3 py-2 text-sm">
              Edit plan
            </button>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Plan</h3>
              <button
                className="rounded-full border border-[#E7E8EA] px-3 py-1 text-xs text-[#73757D]"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              <label className="text-sm">
                Plan name
                <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
              </label>
              <label className="text-sm">
                Price
                <input className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
              </label>
              <label className="text-sm">
                Billing cycle
                <select className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2">
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </label>
              <label className="text-sm">
                Features
                <textarea className="mt-1 w-full rounded-lg border border-[#E7E8EA] px-3 py-2" />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-lg border border-[#E7E8EA] px-4 py-2 text-sm"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button className="rounded-lg bg-[#F2674B] px-4 py-2 text-sm text-white">
                Save plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
