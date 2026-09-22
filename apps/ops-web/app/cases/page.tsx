"use client";

import { useEffect, useState } from "react";
import { getCases } from "@/lib/api";
import type { ApiCase } from "@/lib/types";

export default function CasesPage() {
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [cityFilter, setCityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCase, setSelectedCase] = useState<ApiCase | null>(null);

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

  const filteredCases = cases.filter(c => {
    if (cityFilter !== "All" && c.location?.address !== cityFilter) return false;
    if (statusFilter !== "All" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Cases</h1>
        <div className="flex gap-4">
          <select 
            value={cityFilter} onChange={e => setCityFilter(e.target.value)}
            className="border-slate-300 rounded-lg text-sm px-3 py-2 border bg-white"
          >
            <option value="All">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Thane">Thane</option>
            <option value="Navi Mumbai">Navi Mumbai</option>
          </select>
          <select 
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border-slate-300 rounded-lg text-sm px-3 py-2 border bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="REPAIRING">Repairing</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium">Case ID</th>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Severity</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCases.map(c => (
                <tr 
                  key={c.id} 
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{c.id.substring(0, 8)}</td>
                  <td className="px-6 py-4">{c.title}</td>
                  <td className="px-6 py-4 truncate max-w-[200px]">{c.location?.address}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.severity === 'High' ? 'bg-rose-100 text-rose-700' :
                      c.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {c.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      c.status === 'REPORTED' ? 'bg-slate-100 text-slate-700' :
                      c.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                      c.status === 'REPAIRING' ? 'bg-amber-100 text-amber-700' :
                      c.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                      c.status === 'NEEDS_REVIEW' ? 'bg-rose-100 text-rose-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCase && (
        <div className="absolute inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Case Details</h2>
            <button onClick={() => setSelectedCase(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto">
            <div>
              <div className="text-xs text-slate-500 mb-1">ID</div>
              <div className="font-medium">{selectedCase.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Title</div>
              <div className="font-medium">{selectedCase.title}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Description</div>
              <div className="text-sm">{selectedCase.description}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <div className="text-sm">{selectedCase.status}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Location</div>
              <div className="text-sm">{selectedCase.location?.address}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
