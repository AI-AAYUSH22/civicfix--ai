"use client";

import { useEffect, useState } from "react";
import { getCases } from "@/lib/api";
import type { ApiCase } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [cases, setCases] = useState<ApiCase[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCases();
        setCases(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  // Compute status chart data
  const statusCounts = cases.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

  // Compute city chart data
  const cityCounts = cases.reduce((acc, c) => {
    const city = c.location?.address || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const cityData = Object.entries(cityCounts).map(([name, count]) => ({ name, count }));

  // Compute resolution rate
  const resolved = cases.filter(c => ['VERIFIED', 'VERIFIED_CLOSED', 'CLOSED', 'Resolved'].includes(c.status)).length;
  const resolutionRate = cases.length > 0 ? Math.round((resolved / cases.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-medium text-slate-500 mb-2">Overall Resolution Rate</h2>
        <div className="text-4xl font-bold text-teal-600">{resolutionRate}%</div>
        <p className="text-sm text-slate-500 mt-1">{resolved} out of {cases.length} cases resolved</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by Status</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by City</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData}>
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
