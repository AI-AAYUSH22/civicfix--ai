"use client";

import { useEffect, useState } from "react";
import { getWorkOrders } from "@/lib/api";
import type { ApiWorkOrder } from "@/lib/types";

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<ApiWorkOrder[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkOrders();
        setOrders(data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Work Orders</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="px-6 py-3 font-medium">WO ID</th>
                <th className="px-6 py-3 font-medium">Case ID</th>
                <th className="px-6 py-3 font-medium">Contractor</th>
                <th className="px-6 py-3 font-medium">Ward</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Deadline</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map(wo => (
                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{wo.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 text-slate-500">{wo.case_id.substring(0, 8)}</td>
                  <td className="px-6 py-4">{wo.contractor_name || 'Unassigned'}</td>
                  <td className="px-6 py-4">{wo.ward_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      wo.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                      wo.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {wo.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {wo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {wo.deadline ? new Date(wo.deadline).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {!wo.contractor_id ? (
                      <button className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                        Assign Contractor
                      </button>
                    ) : (
                      <span className="text-slate-400 text-sm">Assigned</span>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-500">No work orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
