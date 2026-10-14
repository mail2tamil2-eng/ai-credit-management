import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router';
import { CreditCard, BookOpen, BarChart3, LayoutDashboard } from 'lucide-react';
import logo from './imports/AXLE-Korp-LOGO__2_.jpg';
import { AppHeader, AppSidebar } from './app/components/saas';
import TenantCreditPage from './app/pages/TenantCreditPage';
import PlanManagementPage from './app/pages/PlanManagementPage';
import CreditMonitoringPage from './app/pages/CreditMonitoringPage';
import OrgCreditDashboardPage from './app/pages/OrgCreditDashboardPage';

const NAV_SITE_ADMIN = [
  { id: '/dashboard', label: 'Overview',         icon: LayoutDashboard },
  { id: '/credits',   label: 'Tenant Credits',   icon: CreditCard },
  { id: '/plans',     label: 'Plan Management',  icon: BookOpen },
  { id: '/monitoring',label: 'Monitoring',       icon: BarChart3 },
];

const NAV_ORG_ADMIN = [
  { id: '/org-credits', label: 'AI Credits',  icon: CreditCard },
];

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [role, setRole] = useState<'site' | 'org'>('site');
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const nav = role === 'site' ? NAV_SITE_ADMIN : NAV_ORG_ADMIN;

  return (
    <div className="flex h-screen bg-[#F9FAFB]" style={{ fontFamily: 'Nunito Sans, system-ui, sans-serif' }}>
      <AppSidebar
        groups={[
          { title: role === 'site' ? 'Site Admin' : 'Organisation', items: nav },
        ]}
        activeId={pathname}
        onNavigate={(id) => navigate(id)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(c => !c)}
        logo={<img src={logo} alt="Axle KORP" className="h-9 w-auto max-w-[160px] object-contain" />}
        logoMark={
          <span className="block size-9 overflow-hidden rounded-lg">
            <img src={logo} alt="Axle KORP" className="size-full object-cover object-left" />
          </span>
        }
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex gap-1 rounded-lg bg-white/10 p-0.5">
              <button onClick={() => { setRole('site'); navigate('/credits'); }}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${role === 'site' ? 'bg-white text-[#111827] shadow-sm' : 'text-white/70 hover:text-white'}`}>
                Site Admin
              </button>
              <button onClick={() => { setRole('org'); navigate('/org-credits'); }}
                className={`flex-1 rounded-md py-1 text-xs font-medium transition-all ${role === 'org' ? 'bg-white text-[#111827] shadow-sm' : 'text-white/70 hover:text-white'}`}>
                Org Admin
              </button>
            </div>
            <p className="text-center text-xs opacity-60">Powered by NOVACTECH</p>
          </div>
        }
        footerCollapsed={<b>NT</b>}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader
          userName={role === 'site' ? 'Site Admin' : 'Org Admin'}
          notificationCount={role === 'site' ? 4 : 1}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to={role === 'site' ? '/credits' : '/org-credits'} replace />} />
            <Route path="/dashboard" element={<Navigate to="/credits" replace />} />
            <Route path="/credits"    element={<TenantCreditPage />} />
            <Route path="/plans"      element={<PlanManagementPage />} />
            <Route path="/monitoring" element={<CreditMonitoringPage />} />
            <Route path="/org-credits" element={<OrgCreditDashboardPage balance={620} creditStatus="low" plan="Starter" nextAllocation="01 Nov 2026" tenantName="Sunrise Institute" />} />
            <Route path="*" element={<Navigate to="/credits" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
