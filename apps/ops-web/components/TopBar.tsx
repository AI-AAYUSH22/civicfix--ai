"use client";

import { useEffect, useState } from "react";
import { checkBackendHealth } from "@/lib/api";

export default function TopBar() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const check = async () => {
      const online = await checkBackendHealth();
      setIsOnline(online);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <h2 className="text-lg font-semibold text-slate-800">Municipal Operations Platform</h2>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Backend Status</span>
        <div
          className={`w-3 h-3 rounded-full ${
            isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500"
          }`}
          title={isOnline ? "Online" : "Offline"}
        />
      </div>
    </header>
  );
}
