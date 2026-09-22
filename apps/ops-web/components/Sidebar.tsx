"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AlertCircle, CheckSquare, ClipboardList, BarChart3, Map } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: AlertCircle },
  { href: "/verification", label: "AI Verification", icon: CheckSquare },
  { href: "/work-orders", label: "Work Orders", icon: ClipboardList },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/wards", label: "Wards", icon: Map },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[240px] h-screen bg-[#172033] text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight text-teal-400">CivicFix</h1>
        <p className="text-xs text-slate-400 mt-1">Ops Center</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-600/20 text-teal-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
