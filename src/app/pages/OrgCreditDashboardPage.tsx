import { useState } from 'react';
import { AlertTriangle, XCircle, Zap, Layers, TrendingUp, ChevronRight } from 'lucide-react';
import { Button, StatWidget, Modal } from '../components/saas';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { CreditStatus } from './creditTypes';
import { MOCK_TRANSACTIONS } from './creditTypes';

const ALERT_MESSAGES: Partial<Record<CreditStatus, { icon: typeof AlertTriangle; bg: string; text: string; border: string; msg: string }>> = {
  low: {
    icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200',
    msg: 'Your AI credit balance is running low. Please request a top-up or plan upgrade to avoid interruption.',
  },
  critical: {
    icon: AlertTriangle, bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200',
    msg: 'Your AI credit balance is critically low. AI features will stop when credits run out. Please request a top-up or plan upgrade now.',
  },
  exhausted: {
    icon: XCircle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200',
    msg: 'AI credits are exhausted and AI features are temporarily unavailable. Please request a top-up or plan upgrade.',
  },
  negative: {
    icon: XCircle, bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200',
    msg: 'AI credits are exhausted and AI features are temporarily unavailable. Please request a top-up or plan upgrade.',
  },
};

const FEATURES = [
  { name: 'AI Course Creation', credits: 850, requests: 17, pct: 62 },
  { name: 'AI Quiz Generator', credits: 300, requests: 30, pct: 22 },
  { name: 'Text Generation', credits: 230, requests: 92, pct: 17 },
];

const PLAN_MAX: Record<string, number> = {
  'Starter': 2000, 'Growth': 5000, 'Pro': 10000, 'Enterprise': 150000,
};

interface Props {
  balance?: number;
  creditStatus?: CreditStatus;
  plan?: string;
  nextAllocation?: string;
  tenantName?: string;
}

export default function OrgCreditDashboardPage({
  balance = 620,
  creditStatus = 'low',
  plan = 'Starter',
  nextAllocation = '01 Nov 2026',
  tenantName = 'Sunrise Institute',
}: Props) {
  const max = PLAN_MAX[plan] ?? 2000;
  const pct = Math.max(0, Math.min(100, (balance / max) * 100));
  const used = Math.max(0, max - balance);
  const alert = ALERT_MESSAGES[creditStatus];
  const [inactivateOpen, setInactivateOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const gaugeColor =
    creditStatus === 'active' ? '#15803D' :
    creditStatus === 'low' ? '#B45309' :
    creditStatus === 'critical' ? '#EA580C' : '#DC2626';

  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="px-8 py-6 max-w-4xl">
      {/* Alert Banner */}
      {alert && (
        <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${alert.bg} ${alert.border}`}>
          <alert.icon className={`mt-0.5 size-5 shrink-0 ${alert.text}`} />
          <div className="flex-1">
            <p className={`text-sm font-semibold ${alert.text}`}>
              {creditStatus === 'low' ? 'AI Credits Running Low' :
               creditStatus === 'critical' ? 'AI Credits Critically Low' : 'AI Credits Exhausted'}
            </p>
            <p className={`text-sm mt-0.5 ${alert.text} opacity-80`}>{alert.msg}</p>
          </div>
        </div>
      )}

      {/* Balance + Plan */}
      <div className="grid grid-cols-2 gap-6 rounded-2xl border border-[#E5E7EB] bg-white p-6">
        {/* Gauge */}
        <div className="flex flex-col items-center gap-3 border-r border-[#F3F4F6] pr-6">
          <h2 className="self-start text-sm font-semibold text-[#374151]">Available Balance</h2>
          <div className="relative size-44">
            <svg className="size-full -rotate-90" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="54" fill="none" stroke="#E5E7EB" strokeWidth="14" />
              <circle cx="64" cy="64" r="54" fill="none" stroke={gaugeColor} strokeWidth="14"
                strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[#111827]">{balance.toLocaleString()}</span>
              <span className="text-sm text-[#6B7280]">credits</span>
              <span className="mt-0.5 text-xs font-medium" style={{ color: gaugeColor }}>{pct.toFixed(0)}% remaining</span>
            </div>
          </div>
          <CreditStatusBadge status={creditStatus} />
          <p className="text-xs text-[#9CA3AF]">of {max.toLocaleString()} total credits</p>
        </div>

        {/* Plan info */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-[#374151]">Current Plan</h2>
          <div className="rounded-xl bg-[#F9FAFB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-[#111827]">{plan}</span>
              <span className="rounded-full bg-[#EBF3FF] px-2.5 py-0.5 text-xs font-medium text-[#1254C7]">Monthly</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Credits / Month</span>
              <span className="font-semibold">{max.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Next Allocation</span>
              <span className="font-medium text-[#374151]">{nextAllocation}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="soft" size="sm" onClick={() => setPlansOpen(true)}>
              View Available Plans <ChevronRight className="size-3.5" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setInactivateOpen(true)}>
              Inactivate Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatWidget label="Total Allocated" value={max.toLocaleString()} icon={Layers} tone="blue" />
        <StatWidget label="Credits Used" value={used.toLocaleString()} icon={Zap} tone="amber" />
        <StatWidget label="Total Requests" value="142" icon={TrendingUp} tone="pink" />
      </div>

      {/* Usage by feature */}
      <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-[#111827]">Usage by Feature</h3>
        <div className="space-y-3">
          {FEATURES.map(f => (
            <div key={f.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#374151]">{f.name}</span>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <span>{f.requests} requests</span>
                  <span className="font-semibold text-[#111827]">{f.credits.toLocaleString()} credits</span>
                  <span className="w-8 text-right">{f.pct}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-[#F3F4F6]">
                <div className="h-full rounded-full bg-[#1565F0]" style={{ width: `${f.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 rounded-2xl border border-[#E5E7EB] bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-[#111827]">Recent Activity</h3>
        <div className="divide-y divide-[#F3F4F6]">
          {MOCK_TRANSACTIONS.slice(0, 5).map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className={`size-8 rounded-full flex items-center justify-center ${t.credits > 0 ? 'bg-green-50' : 'bg-gray-100'}`}>
                  {t.credits > 0 ? <TrendingUp className="size-4 text-green-600" /> : <Zap className="size-4 text-[#6B7280]" />}
                </div>
                <div>
                  <p className="font-medium text-[#111827]">{t.description}</p>
                  <p className="text-xs text-[#9CA3AF]">{t.date}</p>
                </div>
              </div>
              <span className={`font-semibold ${t.credits > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inactivate confirmation */}
      <Modal open={inactivateOpen} onClose={() => setInactivateOpen(false)} title="Inactivate Plan"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setInactivateOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setInactivateOpen(false)}>Yes, Inactivate</Button>
          </div>
        }>
        <p className="text-sm text-[#374151]">
          Are you sure you want to inactivate the plan? Future AI credit allocations will stop.
          Existing available credits can continue to be used.
        </p>
      </Modal>

      {/* Plans list modal */}
      <Modal open={plansOpen} onClose={() => setPlansOpen(false)} title="Available Plans">
        <div className="space-y-3">
          {[
            { name: 'Starter', credits: 2000, interval: 'Monthly', current: plan === 'Starter' },
            { name: 'Growth', credits: 5000, interval: 'Monthly', current: plan === 'Growth' },
            { name: 'Pro', credits: 10000, interval: 'Monthly', current: plan === 'Pro' },
          ].map(p => (
            <div key={p.name} className={`rounded-xl border-2 p-4 ${p.current ? 'border-[#1565F0] bg-[#EBF3FF]' : 'border-[#E5E7EB]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#111827]">{p.name}</p>
                  <p className="text-sm text-[#6B7280]">{p.credits.toLocaleString()} credits · {p.interval}</p>
                </div>
                {p.current && <span className="rounded-full bg-[#1565F0] px-2.5 py-0.5 text-xs font-medium text-white">Current</span>}
              </div>
            </div>
          ))}
          <p className="text-xs text-[#9CA3AF] pt-1">Contact your administrator to request a plan change.</p>
        </div>
      </Modal>
    </div>
  );
}
