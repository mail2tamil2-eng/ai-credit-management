import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BookOpen, CreditCard, BarChart3, LayoutDashboard } from 'lucide-react';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import { AppHeader, AppSidebar } from '../components/saas';
import TenantCreditPage from './TenantCreditPage';
import { RoleProvider, RoleContext, ROLE_LABELS } from '../context/RoleContext';
import type { AppRole } from '../context/RoleContext';

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

function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('credits');
  const [role, setRole] = useState<AppRole>('site-admin');

  const isCreditManager = role === 'credit-manager';

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="flex h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
        <AppSidebar
          groups={[{ label: 'AI Credit Management', items: [
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'credits', label: 'Tenant Credits', icon: CreditCard },
            { id: 'plans', label: 'Plan Management', icon: BookOpen, disabled: isCreditManager },
            { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
          ]}]}
          activeId={active} onNavigate={setActive} collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(c => !c)}
          logo={<img src={logo} alt="Axle KORP" className="h-9 w-auto max-w-[160px] object-contain" />}
          logoMark={<span className="block size-9 overflow-hidden rounded-lg"><img src={logo} alt="Axle KORP" className="size-full object-cover object-left" /></span>}
          footer={<>Powered by <b>NOVACTECH</b></>} footerCollapsed={<b>NT</b>}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            userName={ROLE_LABELS[role]}
            userRole={isCreditManager ? 'Credit Manager' : 'Site Admin'}
            notificationCount={4}
            actions={<RoleSwitcher role={role} onChange={setRole} />}
          />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}

const meta = {
  title: 'AI Credits/Tenant Credit Management',
  component: TenantCreditPage,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <Shell><Story /></Shell>],
} satisfies Meta<typeof TenantCreditPage>;

export default meta;
export const Default: StoryObj<typeof meta> = {};
