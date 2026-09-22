"use client";

import { useEffect, useState } from "react";
import { getMunicipalStats, getCases, getContractors } from "@/lib/api";
import type { ApiStats, ApiCase } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, casesData, contractorsData] = await Promise.all([
          getMunicipalStats().catch(() => null),
          getCases().catch(() => []),
          getContractors().catch(() => []),
        ]);
        if (statsData) setStats(statsData);
        setCases(casesData.slice(0, 5)); // recent 5
        setContractors(contractorsData.slice(0, 3)); // top 3
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Active Cases" value={stats?.totalActive} border="border-l-teal-500" />
        <StatCard title="Pending AI Verification" value={stats?.pendingVerification} border="border-l-rose-500" />
        <StatCard title="Under Repair" value={stats?.underRepair} border="border-l-amber-500" />
        <StatCard title="Resolved This Month" value={stats?.resolvedThisMonth} border="border-l-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Recent Cases</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">ID</th>
                  <th className="px-6 py-3 font-medium">Location</th>
                  <th className="px-6 py-3 font-medium">Ward</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{c.id.substring(0, 8)}</td>
                    <td className="px-6 py-4">{c.location?.address || 'Unknown'}</td>
                    <td className="px-6 py-4">{c.ward_name || c.ward_id}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No cases found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Top Contractors</h2>
          </div>
          <div className="p-4 space-y-4">
            {contractors.map((c, i) => (
              <div key={i} className="p-4 rounded-lg border border-slate-100 bg-slate-50 flex flex-col gap-1">
                <div className="font-medium text-slate-800">{c.name || 'Contractor'}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1">
                  <span className="text-amber-500">★</span> {c.rating || '4.5'}
                </div>
              </div>
            ))}
            {contractors.length === 0 && (
              <div className="py-4 text-center text-slate-500 text-sm">No contractors found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, border }: { title: string; value?: number; border: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 border-l-4 ${border}`}>
      <h3 className="text-sm font-medium text-slate-500 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-slate-900">{value !== undefined ? value : '-'}</div>
    </div>
  );
}
