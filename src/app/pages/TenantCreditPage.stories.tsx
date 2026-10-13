import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BookOpen, CreditCard, BarChart3, LayoutDashboard } from 'lucide-react';
import logo from '../../imports/AXLE-Korp-LOGO__2_.jpg';
import { AppHeader, AppSidebar } from '../components/saas';
import TenantCreditPage from './TenantCreditPage';

function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState('credits');
  return (
    <div className="flex h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
      <AppSidebar
        groups={[{ label: 'AI Credit Management', items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'credits', label: 'Tenant Credits', icon: CreditCard },
          { id: 'plans', label: 'Plan Management', icon: BookOpen },
          { id: 'monitoring', label: 'Monitoring', icon: BarChart3 },
        ]}]}
        activeId={active} onNavigate={setActive} collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(c => !c)}
        logo={<img src={logo} alt="Axle KORP" className="h-9 w-auto max-w-[160px] object-contain" />}
        logoMark={<span className="block size-9 overflow-hidden rounded-lg"><img src={logo} alt="Axle KORP" className="size-full object-cover object-left" /></span>}
        footer={<>Powered by <b>NOVACTECH</b></>} footerCollapsed={<b>NT</b>}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader userName="Site Admin" notificationCount={4} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
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
