import { useState } from 'react';
import { TrendingUp, Zap, Layers, Users } from 'lucide-react';
import { Button, StatWidget, PageHeader } from '../components/saas';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus } from './creditTypes';
import { MOCK_TENANTS, MOCK_TRANSACTIONS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';

// ── Credit Gauge ───────────────────────────────────────────────────────────────
const GAUGE_COLORS: Record<CreditStatus, string> = {
  active: '#15803D', low: '#B45309', critical: '#EA580C', exhausted: '#DC2626', negative: '#7F1D1D',
};
const PLAN_MAX: Record<string, number> = {
  'Starter': 2000, 'Growth': 5000, 'Pro': 10000, 'Enterprise': 150000,
};

function CreditGauge({ balance, plan, status }: { balance: number; plan?: string; status: CreditStatus }) {
  const planName = plan?.split(' ')[0];
  const max = planName ? (PLAN_MAX[planName] ?? 5000) : 5000;
  const pct = Math.max(0, Math.min(100, max > 0 ? (balance / max) * 100 : 0));
  const color = GAUGE_COLORS[status];
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative size-44">
        <svg className="size-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="54" fill="none" stroke="#E5E7EB" strokeWidth="14" />
          <circle cx="64" cy="64" r="54" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#111827]">{balance < 0 ? balance.toLocaleString() : balance.toLocaleString()}</span>
          <span className="text-xs text-[#6B7280]">credits</span>
          <span className="text-xs font-medium mt-0.5" style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-[#6B7280]">of {max.toLocaleString()} total</p>
      </div>
    </div>
  );
}

// ── Usage by Feature ───────────────────────────────────────────────────────────
const FEATURES = [
  { name: 'AI Course Creation', credits: 850, requests: 17 },
  { name: 'AI Quiz Generator', credits: 400, requests: 40 },
  { name: 'Text Generation', credits: 300, requests: 120 },
];

function UsageByFeature() {
  const total = FEATURES.reduce((a, b) => a + b.credits, 0);
  return (
    <div className="space-y-3">
      {FEATURES.map(f => {
        const pct = Math.round((f.credits / total) * 100);
        return (
          <div key={f.name} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#374151]">{f.name}</span>
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <span>{f.requests} requests</span>
                <span className="font-semibold text-[#111827]">{f.credits.toLocaleString()} credits</span>
                <span className="w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full bg-[#1565F0] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent Activity ─────────────────────────────────────────────────────────────
function RecentActivity() {
  return (
    <div className="divide-y divide-[#F3F4F6]">
      {MOCK_TRANSACTIONS.slice(0, 5).map(t => (
        <div key={t.id} className="flex items-center justify-between py-3 text-sm">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-full flex items-center justify-center ${t.credits > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
              {t.credits > 0 ? <TrendingUp className="size-4 text-green-600" /> : <Zap className="size-4 text-[#6B7280]" />}
            </div>
            <div>
              <p className="font-medium text-[#111827]">{t.description}</p>
              <p className="text-xs text-[#9CA3AF]">{t.date} · {t.performedBy}</p>
            </div>
          </div>
          <span className={`font-semibold ${t.credits > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Monitoring Content (exported for modal use) ────────────────────────────────
export function CreditMonitoringContent({ tenant }: { tenant: TenantCredit }) {
  const [showHistory, setShowHistory] = useState(false);
  const planName = tenant.plan?.split(' ')[0];
  const max = planName ? (PLAN_MAX[planName] ?? 5000) : 5000;
  const used = max - tenant.balance;

  if (showHistory) return (
    <div>
      <button onClick={() => setShowHistory(false)} className="mb-4 text-sm text-[#1565F0] hover:underline">← Back to Dashboard</button>
      <CreditTransactionHistory tenantName={tenant.name} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Gauge + Plan */}
      <div className="flex gap-6 rounded-2xl bg-[#F9FAFB] p-5">
        <CreditGauge balance={tenant.balance} plan={tenant.plan} status={tenant.creditStatus} />
        <div className="flex-1 space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <CreditStatusBadge status={tenant.creditStatus} />
            {tenant.tenantStatus === 'suspended' && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">Suspended</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Current Plan</span>
              <span className="font-semibold text-[#111827]">{tenant.plan ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Next Allocation</span>
              <span className="font-medium text-[#374151]">{tenant.nextAllocation ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Allocation Status</span>
              <span className={tenant.allocationStatus === 'active' ? 'text-green-700 font-medium' : 'text-gray-500'}>
                {tenant.allocationStatus === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="secondary" onClick={() => setShowHistory(true)}>View History</Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatWidget label="Total Allocated" value={max.toLocaleString()} icon={Layers} tone="blue" />
        <StatWidget label="Credits Used" value={Math.max(0, used).toLocaleString()} icon={Zap} tone="amber" />
        <StatWidget label="Transactions" value={MOCK_TRANSACTIONS.length} icon={TrendingUp} tone="pink" />
      </div>

      {/* Usage by feature */}
      <div className="rounded-2xl border border-[#E5E7EB] p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#111827]">Usage by Feature</h3>
        <UsageByFeature />
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-[#E5E7EB] p-5">
        <h3 className="mb-2 text-sm font-semibold text-[#111827]">Recent Activity</h3>
        <RecentActivity />
      </div>
    </div>
  );
}

// ── Full Page ──────────────────────────────────────────────────────────────────
export default function CreditMonitoringPage() {
  const [selected, setSelected] = useState<TenantCredit>(MOCK_TENANTS[0]);

  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Credit Monitoring"
        subtitle="Per-tenant AI credit usage and allocation details"
        actions={
          <div className="flex items-center gap-2">
            <Users className="size-4 text-[#6B7280]" />
            <select
              className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={selected.id}
              onChange={e => setSelected(MOCK_TENANTS.find(t => t.id === e.target.value)!)}>
              {MOCK_TENANTS.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        }
      />
      <div className="mt-6 max-w-3xl">
        <CreditMonitoringContent tenant={selected} />
      </div>
    </div>
  );
}
