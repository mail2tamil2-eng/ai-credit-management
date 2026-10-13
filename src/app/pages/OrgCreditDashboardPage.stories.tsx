import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CreditCard, LayoutDashboard, Settings } from 'lucide-react';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import { AppHeader, AppSidebar } from '../components/saas';
import OrgCreditDashboardPage from './OrgCreditDashboardPage';

function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('credits');
  return (
    <div className="flex h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
      <AppSidebar
        groups={[{ label: 'Organisation', items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'credits', label: 'AI Credits', icon: CreditCard },
          { id: 'settings', label: 'Settings', icon: Settings },
        ]}]}
        activeId={active} onNavigate={setActive} collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(c => !c)}
        logo={<img src={logo} alt="Axle KORP" className="h-9 w-auto max-w-[160px] object-contain" />}
        logoMark={<span className="block size-9 overflow-hidden rounded-lg"><img src={logo} alt="Axle KORP" className="size-full object-cover object-left" /></span>}
        footer={<>Sunrise Institute</>} footerCollapsed={<b>SI</b>}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader userName="Org Admin" notificationCount={1} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

const meta = {
  title: 'AI Credits/Org Admin Credit Dashboard',
  component: OrgCreditDashboardPage,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <Shell><Story /></Shell>],
} satisfies Meta<typeof OrgCreditDashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveBalance: Story = {
  args: { balance: 8450, creditStatus: 'active', plan: 'Growth', nextAllocation: '01 Nov 2026', tenantName: 'Greenfield Academy' },
};
export const LowCredit: Story = {
  args: { balance: 620, creditStatus: 'low', plan: 'Starter', nextAllocation: '01 Nov 2026', tenantName: 'Sunrise Institute' },
};
export const Critical: Story = {
  args: { balance: 95, creditStatus: 'critical', plan: 'Pro', nextAllocation: '01 Jan 2027', tenantName: 'Apex Learning' },
};
export const Exhausted: Story = {
  args: { balance: 0, creditStatus: 'exhausted', plan: 'Starter', nextAllocation: '01 Nov 2026', tenantName: 'Bright Minds' },
};
export const Negative: Story = {
  args: { balance: -140, creditStatus: 'negative', plan: 'Growth', nextAllocation: '01 Nov 2026', tenantName: 'Nova Skills' },
};
