import { NavLink, Outlet } from 'react-router-dom';
import {
  Theater,
  Users,
  Calendar,
  Database,
  Menu,
  X,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/productions', label: '剧目管理', icon: Theater },
  { to: '/actors', label: '演员档案', icon: Users },
  { to: '/props-ledger', label: '道具台账', icon: ClipboardList },
  { to: '/scheduler', label: '排期工作台', icon: Calendar },
  { to: '/data', label: '数据管理', icon: Database },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-theater-pattern">
      <header className="sticky top-0 z-50 bg-theater-ink-800/95 backdrop-blur-md border-b border-theater-ink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-theater-burgundy-600 to-theater-burgundy-800 flex items-center justify-center shadow-theater-glow">
                <Theater className="w-6 h-6 text-theater-gold-400" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-semibold text-gradient-gold">
                  排练协调系统
                </h1>
                <p className="text-xs text-theater-ink-300 -mt-0.5">
                  Rehearsal Scheduler
                </p>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-theater-burgundy-700/60 text-theater-gold-300 border border-theater-burgundy-500/50'
                        : 'text-theater-parchment-300 hover:text-theater-parchment-100 hover:bg-theater-ink-700'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              className="md:hidden p-2 text-theater-parchment-300 hover:text-theater-parchment-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-theater-ink-600 bg-theater-ink-800 animate-fade-in">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-theater-burgundy-700/60 text-theater-gold-300'
                        : 'text-theater-parchment-300 hover:bg-theater-ink-700'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
