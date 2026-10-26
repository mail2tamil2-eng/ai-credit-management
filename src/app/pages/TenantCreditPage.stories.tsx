import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BookOpen, CreditCard, BarChart3, ChevronDown, ShieldCheck, UserCog } from 'lucide-react';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import { AppHeader, AppSidebar, DropdownMenu } from '../components/saas';
import TenantCreditPage from './TenantCreditPage';
import { RoleContext, ROLE_LABELS } from '../context/RoleContext';
import type { AppRole } from '../context/RoleContext';

function RoleDropdown({ role, onChange }: { role: AppRole; onChange: (r: AppRole) => void }) {
  return (
    <DropdownMenu
      align="end"
      trigger={
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-[#374151] shadow-sm transition-colors hover:bg-gray-50">
          {role === 'site-admin'
            ? <ShieldCheck className="size-4 text-[#1565F0]" />
            : <UserCog className="size-4 text-[#7C3AED]" />}
          {ROLE_LABELS[role]}
          <ChevronDown className="size-3.5 text-gray-400" />
        </button>
      }
      items={[
        { type: 'label', label: 'Switch Role' },
        { type: 'checkbox', label: 'Site Admin', checked: role === 'site-admin', onCheckedChange: () => onChange('site-admin') },
        { type: 'checkbox', label: 'Credit Manager', checked: role === 'credit-manager', onCheckedChange: () => onChange('credit-manager') },
      ]}
    />
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
          groups={[{ items: [
            { id: 'credits', label: 'Credit Management', icon: CreditCard },
            ...(!isCreditManager ? [
              { id: 'plans', label: 'Plan Management', icon: BookOpen },
              { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
            ] : []),
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
            actions={<RoleDropdown role={role} onChange={setRole} />}
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
