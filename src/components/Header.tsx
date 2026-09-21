import { MapPinned, LayoutGrid, Users, FileBarChart } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutGrid, active: true },
  { label: 'Cases', icon: MapPinned, active: false },
  { label: 'Contractors', icon: Users, active: false },
  { label: 'Reports', icon: FileBarChart, active: false },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-base-border bg-base-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-600">
              <MapPinned className="h-4.5 w-4.5 text-teal-100" size={18} />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-navy-700">
              CivicFix <span className="text-teal-500">AI</span>
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-navy-50 text-navy-600'
                    : 'text-navy-400 hover:bg-base-bg hover:text-navy-600'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-navy-700">Priya Deshmukh</p>
            <p className="text-xs text-navy-400">Municipal Engineer</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-600">
            PD
          </div>
        </div>
      </div>
    </header>
  );
}
