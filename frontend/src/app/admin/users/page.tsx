"use client";

import { useMemo, useState } from "react";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "inactive";
  plan: "Free" | "Pro" | "Team";
  joinedAt: string;
};

const users: AdminUser[] = [
  {
    id: "u1",
    name: "Sarah Jensen",
    email: "sarah@flowio.io",
    role: "owner",
    status: "active",
    plan: "Pro",
    joinedAt: "2026-01-12",
  },
  {
    id: "u2",
    name: "Tom Cook",
    email: "tom@flowio.io",
    role: "admin",
    status: "active",
    plan: "Team",
    joinedAt: "2026-01-20",
  },
  {
    id: "u3",
    name: "Maya Lin",
    email: "maya@flowio.io",
    role: "member",
    status: "inactive",
    plan: "Free",
    joinedAt: "2025-12-05",
  },
];

export default function UsersPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || user.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-[#64748B]">Gerencie usuários e permissões.</p>
        </div>
        <button className="rounded-lg bg-[#3B82F6] px-4 py-2 text-sm font-semibold text-white shadow-sm">
          Add user
        </button>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <input
              className="w-full rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm"
              placeholder="Search users..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#64748B]">Status</span>
            <select
              className="rounded-lg border border-[#E2E8F0] px-3 py-2"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E2E8F0] text-xs uppercase tracking-wider text-[#94A3B8]">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Date Joined</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-[#E2E8F0]/60 last:border-b-0">
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#0F172A]">{user.name}</div>
                  <div className="text-xs text-[#94A3B8]">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#3B82F6]">
                    {user.plan}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        user.status === "active" ? "bg-[#22C55E]" : "bg-[#94A3B8]"
                      }`}
                    />
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 capitalize">{user.role}</td>
                <td className="px-6 py-4">{user.joinedAt}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="rounded-lg border border-[#E2E8F0] px-3 py-1 text-xs text-[#0F172A]"
                    onClick={() => setSelectedUser(user)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-center text-sm text-[#94A3B8]" colSpan={6}>
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                className="rounded-full border border-[#E2E8F0] px-3 py-1 text-xs text-[#64748B]"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-4 text-sm">
              <div>
                <p className="text-xs text-[#94A3B8]">Name</p>
                <p className="font-semibold">{selectedUser.name}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Email</p>
                <p>{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Role</p>
                <p className="capitalize">{selectedUser.role}</p>
              </div>
              <div>
                <p className="text-xs text-[#94A3B8]">Plan</p>
                <p>{selectedUser.plan}</p>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <p className="text-xs text-[#94A3B8]">Status</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedUser.status === "active" ? "bg-[#22C55E]" : "bg-[#94A3B8]"
                    }`}
                  />
                  <span className="capitalize">{selectedUser.status}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm">
                Reset Password
              </button>
              <button className="flex-1 rounded-lg bg-[#3B82F6] px-3 py-2 text-sm text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
