import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  KanbanSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { initials } from '@/lib/utils';
import { classNames } from '@/lib/utils';

const NAV = [
  { to: '/app', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/jobs', label: 'Find jobs', icon: Briefcase },
  { to: '/app/applications', label: 'Applications', icon: KanbanSquare },
  { to: '/app/resumes', label: 'Resumes', icon: FileText },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="px-5 py-5">
        <Logo />
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              classNames(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-secondary-100">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary-100 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {initials(profile?.full_name)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-secondary-900 truncate">{profile?.full_name || 'User'}</p>
              <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-secondary-400" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl border border-secondary-200 bg-white shadow-lg py-1 animate-scale-in">
              <button
                onClick={() => { setMenuOpen(false); navigate('/app/settings'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-error-50"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-secondary-200 bg-white sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-secondary-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-white animate-slide-up">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-secondary-400 hover:text-secondary-900">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-secondary-200 h-14 flex items-center justify-between px-4">
          <button onClick={() => setMobileOpen(true)} className="text-secondary-600 hover:text-secondary-900">
            <Menu className="h-6 w-6" />
          </button>
          <Logo showText={false} size="sm" />
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-xs font-semibold">
            {initials(profile?.full_name)}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
