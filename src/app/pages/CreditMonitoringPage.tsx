import { useState } from 'react';
import { TrendingUp, Zap, Layers, Users, AlertTriangle, CheckCircle2, ShieldOff, ArrowLeft } from 'lucide-react';
import { Button, StatWidget, PageHeader } from '../components/saas';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus } from './creditTypes';
import { MOCK_TENANTS, MOCK_TRANSACTIONS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';

// ── Gauge ──────────────────────────────────────────────────────────────────────
const GAUGE_COLORS: Record<CreditStatus, string> = {
  active: '#15803D', low: '#B45309', critical: '#EA580C', exhausted: '#DC2626', negative: '#7F1D1D',
};
const PLAN_MAX: Record<string, number> = {
  Starter: 2000, Growth: 5000, Pro: 10000, Enterprise: 150000,
};

function CreditGauge({ balance, plan, status }: { balance: number; plan?: string; status: CreditStatus }) {
  const max = PLAN_MAX[plan?.split(' ')[0] ?? ''] ?? 5000;
  const pct = Math.max(0, Math.min(100, max > 0 ? (balance / max) * 100 : 0));
  const color = GAUGE_COLORS[status];
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center">
      <div className="relative size-40">
        <svg className="size-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="54" fill="none" stroke="#F3F4F6" strokeWidth="14" />
          <circle cx="64" cy="64" r="54" fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xl font-bold text-[#111827] tabular-nums leading-none">
            {balance.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#9CA3AF]">credits</span>
          <span className="text-xs font-semibold mt-0.5" style={{ color }}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[#9CA3AF]">of {max.toLocaleString()} allocated</p>
    </div>
  );
}

// ── Usage by Feature ──────────────────────────────────────────────────────────
const FEATURE_COLORS = ['#1565F0', '#8B5CF6', '#059669'];
const FEATURES = [
  { name: 'AI Course Creation', credits: 850, requests: 17 },
  { name: 'AI Quiz Generator', credits: 400, requests: 40 },
  { name: 'Text Generation', credits: 300, requests: 120 },
];

function UsageByFeature() {
  const total = FEATURES.reduce((a, b) => a + b.credits, 0);
  return (
    <div className="space-y-3.5">
      {FEATURES.map((f, i) => {
        const pct = Math.round((f.credits / total) * 100);
        return (
          <div key={f.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full shrink-0" style={{ background: FEATURE_COLORS[i] }} />
                <span className="font-medium text-[#374151]">{f.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                <span>{f.requests} reqs</span>
                <span className="font-semibold text-[#111827] tabular-nums">{f.credits.toLocaleString()}</span>
                <span className="w-7 text-right font-medium" style={{ color: FEATURE_COLORS[i] }}>{pct}%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: FEATURE_COLORS[i] }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent Activity ───────────────────────────────────────────────────────────
function RecentActivity() {
  return (
    <div className="divide-y divide-[#F9FAFB]">
      {MOCK_TRANSACTIONS.slice(0, 5).map(t => (
        <div key={t.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${t.credits > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
              {t.credits > 0
                ? <TrendingUp className="size-3.5 text-green-600" />
                : <Zap className="size-3.5 text-[#9CA3AF]" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#111827] truncate">{t.description}</p>
              <p className="text-xs text-[#9CA3AF]">{t.date} · {t.performedBy}</p>
            </div>
          </div>
          <span className={`text-sm font-semibold tabular-nums shrink-0 ml-3 ${t.credits > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Monitoring Detail (reused in modal from TenantCreditPage) ─────────────────
export function CreditMonitoringContent({ tenant }: { tenant: TenantCredit }) {
  const [showHistory, setShowHistory] = useState(false);
  const max = PLAN_MAX[tenant.plan?.split(' ')[0] ?? ''] ?? 5000;
  const used = Math.max(0, max - tenant.balance);

  if (showHistory) return (
    <div>
      <button onClick={() => setShowHistory(false)}
        className="mb-4 flex items-center gap-1.5 text-sm text-[#1565F0] hover:underline">
        <ArrowLeft className="size-3.5" /> Back to Dashboard
      </button>
      <CreditTransactionHistory tenantName={tenant.name} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Gauge row */}
      <div className="flex gap-6 rounded-2xl bg-[#F9FAFB] p-5">
        <CreditGauge balance={tenant.balance} plan={tenant.plan} status={tenant.creditStatus} />
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditStatusBadge status={tenant.creditStatus} />
            {tenant.tenantStatus === 'suspended' && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                Suspended
              </span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <InfoRow label="Current Plan" value={tenant.plan ?? '—'} />
            <InfoRow label="Next Allocation" value={tenant.nextAllocation ?? '—'} />
            <InfoRow label="Allocation"
              value={tenant.allocationStatus === 'active' ? 'Active' : 'Inactive'}
              valueClass={tenant.allocationStatus === 'active' ? 'text-green-700 font-semibold' : 'text-gray-500'} />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowHistory(true)}>
            View Full History
          </Button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <StatWidget label="Total Allocated" value={max.toLocaleString()} icon={Layers} tone="blue" />
        <StatWidget label="Credits Used" value={used.toLocaleString()} icon={Zap} tone="amber" />
        <StatWidget label="Transactions" value={MOCK_TRANSACTIONS.length} icon={TrendingUp} tone="pink" />
      </div>

      {/* Usage by feature */}
      <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#111827]">Usage by Feature</h3>
        <UsageByFeature />
      </div>

      {/* Recent activity */}
      <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-[#111827]">Recent Activity</h3>
        <RecentActivity />
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6B7280]">{label}</span>
      <span className={`text-right font-medium text-[#111827] ${valueClass ?? ''}`}>{value}</span>
    </div>
  );
}

// ── Tenant selector card ──────────────────────────────────────────────────────
function TenantCard({ tenant, selected, onClick }: {
  tenant: TenantCredit;
  selected: boolean;
  onClick: () => void;
}) {
  const max = PLAN_MAX[tenant.plan?.split(' ')[0] ?? ''] ?? 5000;
  const pct = Math.max(0, Math.min(100, max > 0 ? (tenant.balance / max) * 100 : 0));
  const color = GAUGE_COLORS[tenant.creditStatus];

  return (
    <button
      onClick={onClick}
      className={`relative flex w-48 shrink-0 flex-col gap-2 rounded-2xl border-2 p-4 text-left transition-all
        ${selected
          ? 'border-[#1565F0] bg-[#EBF3FF] shadow-md'
          : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'}`}
    >
      {/* Status dot top-right */}
      <span className="absolute right-3 top-3 size-2.5 rounded-full"
        style={{ background: color }} aria-hidden />

      <div className="pr-4">
        <p className={`text-sm font-bold leading-tight truncate ${selected ? 'text-[#1254C7]' : 'text-[#111827]'}`}>
          {tenant.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">
          {tenant.plan?.split(' ')[0] ?? 'No plan'}
        </p>
      </div>

      <p className={`text-xl font-extrabold tabular-nums leading-none ${tenant.balance < 0 ? 'text-red-600' : selected ? 'text-[#1254C7]' : 'text-[#111827]'}`}>
        {tenant.balance.toLocaleString()}
        <span className="ml-1 text-xs font-normal text-[#9CA3AF]">cr</span>
      </p>

      {/* Mini progress bar */}
      <div className="h-1.5 w-full rounded-full bg-[#E5E7EB]">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }} />
      </div>

      <CreditStatusBadge status={tenant.creditStatus} />

      {tenant.tenantStatus === 'suspended' && (
        <span className="absolute bottom-3 right-3 text-[10px] font-semibold text-gray-400">
          Suspended
        </span>
      )}
    </button>
  );
}

// ── Full Page ─────────────────────────────────────────────────────────────────
export default function CreditMonitoringPage() {
  const [selected, setSelected] = useState<TenantCredit>(MOCK_TENANTS[0]);

  const healthy  = MOCK_TENANTS.filter(t => t.creditStatus === 'active').length;
  const atRisk   = MOCK_TENANTS.filter(t => ['low', 'critical', 'exhausted', 'negative'].includes(t.creditStatus)).length;
  const suspended = MOCK_TENANTS.filter(t => t.tenantStatus === 'suspended').length;

  // Sort: needs-attention first, healthy next, suspended last
  const sorted = [...MOCK_TENANTS].sort((a, b) => {
    const rank = (t: TenantCredit) =>
      t.tenantStatus === 'suspended' ? 2 : t.creditStatus === 'active' ? 1 : 0;
    return rank(a) - rank(b);
  });

  return (
    <div className="px-8 py-6 space-y-6">
      <PageHeader title="Credit Monitoring" />

      {/* System-wide KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatWidget label="Total Tenants"    value={MOCK_TENANTS.length} icon={Users}        tone="blue" />
        <StatWidget label="Healthy"          value={healthy}             icon={CheckCircle2} tone="green"  hint="Credits above threshold" />
        <StatWidget label="Needs Attention"  value={atRisk}              icon={AlertTriangle} tone="amber" hint={atRisk > 0 ? 'Low, critical or exhausted' : 'None'} />
        <StatWidget label="Suspended"        value={suspended}           icon={ShieldOff}    tone="orange" />
      </div>

      {/* Tenant selector — horizontal scroll */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Select Tenant
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sorted.map(t => (
            <TenantCard key={t.id} tenant={t}
              selected={selected.id === t.id}
              onClick={() => setSelected(t)} />
          ))}
        </div>
      </div>

      {/* Detail panel — full width */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-[#111827]">{selected.name}</h2>
            <p className="text-xs text-[#9CA3AF]">{selected.plan ?? 'No plan assigned'}</p>
          </div>
          <CreditStatusBadge status={selected.creditStatus} />
        </div>
        <div className="p-6">
          <CreditMonitoringContent key={selected.id} tenant={selected} />
        </div>
      </div>
    </div>
  );
}
