import { useState } from 'react';
import { Outlet } from 'react-router';
import { BookOpen, CreditCard, BarChart3, LayoutDashboard } from 'lucide-react';
import { AppHeader, AppSidebar } from '../components/saas';
import { RoleContext, ROLE_LABELS } from '../context/RoleContext';
import type { AppRole } from '../context/RoleContext';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import axleMark from '../../imports/axle-mark.svg';

function RoleSwitcher({ role, onChange }: { role: AppRole; onChange: (r: AppRole) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 font-medium">Preview as:</span>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {(['site-admin', 'credit-manager'] as AppRole[]).map(r => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              role === r
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

function AICreditShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('credits');
  const [role, setRole] = useState<AppRole>('site-admin');

  const isCreditManager = role === 'credit-manager';
  const sidebarW = collapsed ? 64 : 220;

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="min-h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
        {/* Sidebar */}
        <div className="fixed left-0 top-0 z-30 h-screen">
          <AppSidebar
            groups={[{ label: 'AI Credit Management', items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'credits', label: 'Tenant Credits', icon: CreditCard },
              { id: 'plans', label: 'Plan Management', icon: BookOpen, disabled: isCreditManager },
              { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
            ]}]}
            activeId={active}
            onNavigate={setActive}
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
            actions={<RoleSwitcher role={role} onChange={setRole} />}
          />
        </div>

        {/* Main content */}
        <main
          style={{
            paddingTop: 80,
            marginLeft: sidebarW,
            transition: 'margin-left 200ms ease',
          }}
        >
          {children}
        </main>
      </div>
    </RoleContext.Provider>
  );
}

export default function AICreditLayout() {
  return (
    <AICreditShell>
      <Outlet />
    </AICreditShell>
  );
}
