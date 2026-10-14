import { useState } from 'react';
import { TrendingUp, Zap, Layers, Users, AlertTriangle, CheckCircle2, ShieldOff, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button, StatWidget, PageHeader } from '../components/saas';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus } from './creditTypes';
import { MOCK_TENANTS, MOCK_TRANSACTIONS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';

// ── Constants ─────────────────────────────────────────────────────────────────
const GAUGE_COLORS: Record<CreditStatus, string> = {
  active: '#15803D', low: '#B45309', critical: '#EA580C', exhausted: '#DC2626', negative: '#7F1D1D',
};
const STATUS_BG: Record<CreditStatus, string> = {
  active: 'bg-green-500', low: 'bg-amber-500', critical: 'bg-orange-500', exhausted: 'bg-red-500', negative: 'bg-red-800',
};
const PLAN_MAX: Record<string, number> = {
  Starter: 2000, Growth: 5000, Pro: 10000, Enterprise: 150000,
};

// ── Gauge ─────────────────────────────────────────────────────────────────────
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
          <span className="text-xl font-bold tabular-nums leading-none text-[#111827]">{balance.toLocaleString()}</span>
          <span className="text-[11px] text-[#9CA3AF]">credits</span>
          <span className="mt-0.5 text-xs font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
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
  { name: 'AI Quiz Generator',  credits: 400, requests: 40 },
  { name: 'Text Generation',    credits: 300, requests: 120 },
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
                <span className="size-2 shrink-0 rounded-full" style={{ background: FEATURE_COLORS[i] }} />
                <span className="font-medium text-[#374151]">{f.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                <span>{f.requests} reqs</span>
                <span className="font-semibold tabular-nums text-[#111827]">{f.credits.toLocaleString()}</span>
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
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${t.credits > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
              {t.credits > 0 ? <TrendingUp className="size-3.5 text-green-600" /> : <Zap className="size-3.5 text-[#9CA3AF]" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#111827]">{t.description}</p>
              <p className="text-xs text-[#9CA3AF]">{t.date} · {t.performedBy}</p>
            </div>
          </div>
          <span className={`ml-3 shrink-0 text-sm font-semibold tabular-nums ${t.credits > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
          </span>
        </div>
      ))}
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
      <div className="flex gap-6 rounded-2xl bg-[#F9FAFB] p-5">
        <CreditGauge balance={tenant.balance} plan={tenant.plan} status={tenant.creditStatus} />
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <CreditStatusBadge status={tenant.creditStatus} />
            {tenant.tenantStatus === 'suspended' && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Suspended</span>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <InfoRow label="Current Plan"     value={tenant.plan ?? '—'} />
            <InfoRow label="Next Allocation"  value={tenant.nextAllocation ?? '—'} />
            <InfoRow label="Allocation"       value={tenant.allocationStatus === 'active' ? 'Active' : 'Inactive'}
              valueClass={tenant.allocationStatus === 'active' ? 'text-green-700 font-semibold' : 'text-gray-500'} />
          </div>
          <Button size="sm" variant="secondary" onClick={() => setShowHistory(true)}>View Full History</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatWidget label="Total Allocated" value={max.toLocaleString()}  icon={Layers}     tone="blue" />
        <StatWidget label="Credits Used"    value={used.toLocaleString()} icon={Zap}        tone="amber" />
        <StatWidget label="Transactions"    value={MOCK_TRANSACTIONS.length} icon={TrendingUp} tone="pink" />
      </div>

      <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#111827]">Usage by Feature</h3>
        <UsageByFeature />
      </div>

      <div className="rounded-2xl border border-[#F3F4F6] bg-white p-5">
        <h3 className="mb-1 text-sm font-semibold text-[#111827]">Recent Activity</h3>
        <RecentActivity />
      </div>
    </div>
  );
}

// ── Full Page ─────────────────────────────────────────────────────────────────
export default function CreditMonitoringPage() {
  const [selected, setSelected] = useState<TenantCredit | null>(null);

  const healthy   = MOCK_TENANTS.filter(t => t.creditStatus === 'active').length;
  const atRisk    = MOCK_TENANTS.filter(t => ['low', 'critical', 'exhausted', 'negative'].includes(t.creditStatus)).length;
  const suspended = MOCK_TENANTS.filter(t => t.tenantStatus === 'suspended').length;

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) return (
    <div className="px-8 py-6 space-y-5">
      {/* Back + tenant header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#1565F0] hover:underline">
          <ArrowLeft className="size-4" /> All Tenants
        </button>
        <CreditStatusBadge status={selected.creditStatus} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#111827]">{selected.name}</h2>
        <p className="text-sm text-[#9CA3AF]">{selected.plan ?? 'No plan assigned'}</p>
      </div>

      <CreditMonitoringContent key={selected.id} tenant={selected} />
    </div>
  );

  // ── Overview: tenant grid ─────────────────────────────────────────────────────
  return (
    <div className="px-8 py-6 space-y-6">
      <PageHeader title="Credit Monitoring" />

      {/* System KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatWidget label="Total Tenants"   value={MOCK_TENANTS.length} icon={Users}        tone="blue" />
        <StatWidget label="Healthy"         value={healthy}             icon={CheckCircle2} tone="green"  hint="Credits above threshold" />
        <StatWidget label="Needs Attention" value={atRisk}              icon={AlertTriangle} tone="amber" hint={atRisk > 0 ? 'Low / critical / exhausted' : 'None'} />
        <StatWidget label="Suspended"       value={suspended}           icon={ShieldOff}    tone="orange" />
      </div>

      {/* Tenant grid */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Select a tenant to view details
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MOCK_TENANTS.map(t => {
            const max = PLAN_MAX[t.plan?.split(' ')[0] ?? ''] ?? 5000;
            const pct = Math.max(0, Math.min(100, max > 0 ? (t.balance / max) * 100 : 0));
            const color = GAUGE_COLORS[t.creditStatus];
            const needsAttention = ['low', 'critical', 'exhausted', 'negative'].includes(t.creditStatus);

            return (
              <button key={t.id} onClick={() => setSelected(t)}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:border-[#1565F0] hover:shadow-md">

                {/* Top colour band */}
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                  style={{ background: color }} />

                {/* Name + suspended tag */}
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111827] group-hover:text-[#1565F0]">
                      {t.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#9CA3AF]">
                      {t.plan?.split(' ')[0] ?? 'No plan'}
                    </p>
                  </div>
                  {t.tenantStatus === 'suspended' && (
                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                      Suspended
                    </span>
                  )}
                </div>

                {/* Balance */}
                <div>
                  <p className={`text-2xl font-extrabold tabular-nums leading-none ${t.balance < 0 ? 'text-red-600' : 'text-[#111827]'}`}>
                    {t.balance.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9CA3AF]">credits remaining</p>
                </div>

                {/* Mini bar */}
                <div className="h-1.5 w-full rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: color }} />
                </div>

                {/* Status badge + chevron */}
                <div className="flex items-center justify-between">
                  <CreditStatusBadge status={t.creditStatus} />
                  <ChevronRight className={`size-4 transition-colors ${needsAttention ? 'text-amber-400' : 'text-gray-300 group-hover:text-[#1565F0]'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
