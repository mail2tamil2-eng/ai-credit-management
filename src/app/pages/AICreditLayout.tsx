import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { BookOpen, CreditCard, BarChart3, ShieldCheck, UserCog, ChevronDown, Check } from 'lucide-react';
import { AppHeader, AppSidebar } from '../components/saas';
import { Toaster } from '../components/ui/sonner';
import { useRole, ROLE_LABELS } from '../context/RoleContext';
import type { AppRole } from '../context/RoleContext';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import axleMark from '../../imports/axle-mark.svg';

const NAV_ROUTES: Record<string, string> = {
  credits: '/ai-credits',
  plans: '/ai-credits/plans',
  monitoring: '/ai-credits/monitoring',
};

function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#374151] shadow-sm transition-colors hover:bg-gray-50"
      >
        {role === 'site-admin'
          ? <ShieldCheck className="size-4 text-[#1565F0]" />
          : <UserCog className="size-4 text-[#7C3AED]" />}
        {ROLE_LABELS[role]}
        <ChevronDown className="size-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
          <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-gray-400">
            Switch Role
          </p>
          {(['site-admin', 'credit-manager'] as AppRole[]).map(r => (
            <button
              key={r}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-[#374151] hover:bg-gray-50"
              onClick={() => { setRole(r); setOpen(false); }}
            >
              {r === 'site-admin'
                ? <ShieldCheck className="size-4 text-[#1565F0]" />
                : <UserCog className="size-4 text-[#7C3AED]" />}
              <span className="flex-1 text-left">{ROLE_LABELS[r]}</span>
              {role === r && <Check className="size-4 text-[#1565F0]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AICreditLayout() {
  const { role } = useRole();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCreditManager = role === 'credit-manager';
  const sidebarW = collapsed ? 64 : 220;

  const activeId = location.pathname.startsWith('/ai-credits/monitoring')
    ? 'monitoring'
    : location.pathname.startsWith('/ai-credits/plans')
    ? 'plans'
    : 'credits';

  // Credit managers don't have Tenant Credits access — redirect to monitoring
  useEffect(() => {
    if (isCreditManager && location.pathname === '/ai-credits') {
      navigate('/ai-credits/plans', { replace: true });
    }
  }, [isCreditManager, location.pathname, navigate]);

  function handleNavigate(id: string) {
    const route = NAV_ROUTES[id];
    if (route) navigate(route);
  }

  const sidebarItems = isCreditManager
    ? [
        { id: 'plans', label: 'Plan Management', icon: BookOpen },
        { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
      ]
    : [
        { id: 'plans', label: 'Plan Management', icon: BookOpen },
        { id: 'credits', label: 'Tenant Credits', icon: CreditCard },
      ];

  return (
    <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div className="fixed left-0 top-0 z-30 h-screen">
        <AppSidebar
          groups={[{ items: sidebarItems }]}
          activeId={activeId}
          onNavigate={handleNavigate}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(c => !c)}
          logo={<img src={logo} alt="Axle KORP" className="h-9 w-auto max-w-[160px] object-contain" />}
          logoMark={<img src={axleMark} alt="Axle KORP" className="size-9 object-contain" />}
          footer={<>Powered by <b>NOVACTECH</b></>}
          footerCollapsed={<b>NT</b>}
        />
      </div>

      {/* Header */}
      <div
        className="fixed top-0 right-0 z-20"
        style={{ left: sidebarW, transition: 'left 200ms ease' }}
      >
        <AppHeader
          userName={ROLE_LABELS[role]}
          userRole={isCreditManager ? 'Credit Manager' : 'Site Admin'}
          notificationCount={4}
          actions={<RoleSwitcher />}
        />
      </div>

      {/* Main content */}
      <main style={{ paddingTop: 80, marginLeft: sidebarW, transition: 'margin-left 200ms ease' }}>
        <Outlet />
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}
