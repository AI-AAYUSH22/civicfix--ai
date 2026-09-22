"use client";

import { useEffect, useState } from "react";
import { getWards } from "@/lib/api";

export default function WardsPage() {
  const [wards, setWards] = useState<any[]>([]);
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await getWards();
        setWards(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const filteredWards = wards.filter(w => cityFilter === "All" || w.city === cityFilter);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Wards</h1>
        <div className="flex gap-2 p-1 bg-slate-200 rounded-lg">
          {["All", "Mumbai", "Thane", "Navi Mumbai"].map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                cityFilter === city
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 flex-1 overflow-y-auto content-start">
        {filteredWards.map(ward => (
          <div key={ward.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{ward.name}</h2>
              <p className="text-sm text-slate-500">{ward.city}</p>
            </div>
            <div className="flex justify-between items-end mt-auto">
              <span className="text-sm font-medium text-slate-500">Pending Issues</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                ward.pendingCount > 50 ? 'bg-rose-100 text-rose-700' :
                ward.pendingCount > 20 ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {ward.pendingCount || 0}
              </span>
            </div>
          </div>
        ))}
        {filteredWards.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
            No wards found for selected city.
          </div>
        )}
      </div>
    </div>
  );
}
