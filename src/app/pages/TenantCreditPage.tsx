import { useState } from 'react';
import { toast } from 'sonner';
import { Download, AlertTriangle, Users, ShieldOff, Activity, ChevronDown, X, Plus, Building2, Info, Pencil, PowerOff, Power, ArrowLeftRight, LayoutDashboard, Clock, ArrowLeft } from 'lucide-react';
import {
  Button, DataTable, Pagination, Modal, FormField, SearchBar,
  Tooltip, PageHeader, StatWidget, DropdownMenu, IconButton, TextInput, TextArea, SelectInput,
} from '../components/saas';
import { Switch } from '../components/ui/switch';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus, Plan } from './creditTypes';
import { MOCK_TENANTS, MOCK_PLANS, MOCK_TRANSACTIONS, AVAILABLE_TENANTS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';
import { CreditMonitoringContent } from './CreditMonitoringPage';
import { useRole } from '../context/RoleContext';


// ── Create Tenant Modal ────────────────────────────────────────────────────────
function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: TenantCredit) => void }) {
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [rollover, setRollover] = useState(true);
  const [topUp, setTopUp] = useState('');
  const [reference, setReference] = useState('');
  const [nameError, setNameError] = useState('');
  const [refError, setRefError] = useState('');
  const [lowThreshold, setLowThreshold] = useState('20');
  const [criticalThreshold, setCriticalThreshold] = useState('10');
  const [thresholdError, setThresholdError] = useState('');

  const activePlans = MOCK_PLANS.filter(p => p.status === 'active');
  const selectedPlan = activePlans.find(p => p.id === planId) ?? null;
  const planCredits = selectedPlan?.credits ?? 0;
  const extraCredits = Number(topUp) || 0;
  const openingBalance = planCredits + extraCredits;

  function deriveCreditStatus(balance: number, planCreds: number, lowPct = 0.20, critPct = 0.10): CreditStatus {
    if (balance === 0) return 'exhausted';
    if (planCreds > 0) {
      const pct = balance / planCreds;
      if (pct <= critPct) return 'critical';
      if (pct <= lowPct) return 'low';
    }
    return 'active';
  }

  function handleCreate() {
    let valid = true;
    if (!name.trim()) { setNameError('Tenant name is required'); valid = false; }
    if (extraCredits > 0 && !reference.trim()) { setRefError('Reference is required for top-up'); valid = false; }
    const lowVal = Number(lowThreshold);
    const critVal = Number(criticalThreshold);
    if (!lowVal || !critVal || critVal >= lowVal) {
      setThresholdError('Critical threshold must be less than Low threshold');
      valid = false;
    } else {
      setThresholdError('');
    }
    if (!valid) return;
    const tenant: TenantCredit = {
      id: `T-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: name.trim(),
      tenantStatus: 'active',
      plan: selectedPlan ? `${selectedPlan.name} (${selectedPlan.interval})` : undefined,
      nextAllocation: selectedPlan
        ? (selectedPlan.interval === 'Monthly' ? '01 Nov 2026' : '01 Oct 2027')
        : undefined,
      balance: openingBalance,
      creditStatus: deriveCreditStatus(openingBalance, planCredits, lowVal / 100, critVal / 100),
      allocationStatus: selectedPlan ? 'active' : 'inactive',
    };
    onCreated(tenant);
    onClose();
  }

  const planOptions = [
    { value: '', label: 'No plan' },
    ...activePlans.map(p => ({ value: p.id, label: `${p.name} (${p.interval}) — ${p.credits.toLocaleString()} credits` })),
  ];

  return (
    <Modal
      open
      onOpenChange={(v) => { if (!v) onClose(); }}
      title="Create Tenant Credits"
      description="Set up a new tenant with a plan and opening credit balance."
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button leftIcon={<Building2 className="size-4" />} onClick={handleCreate}>Create Tenant</Button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* Tenant name */}
        <FormField label="Tenant Name" required error={nameError}>
          {({ id }) => (
            <SelectInput
              id={id}
              value={name}
              options={[
                { value: '', label: 'Select a tenant' },
                ...AVAILABLE_TENANTS.map(t => ({ value: t, label: t })),
              ]}
              onChange={e => { setName(e.target.value); if (e.target.value) setNameError(''); }}
            />
          )}
        </FormField>

        {/* Plan */}
        <FormField label="Plan">
          {({ id }) => (
            <SelectInput id={id} value={planId} options={planOptions}
              onChange={e => setPlanId(e.target.value)} />
          )}
        </FormField>

        {/* Allocation info — only when a plan is chosen */}
        {selectedPlan && (
          <div className="flex items-center gap-2 rounded-lg bg-[#EBF3FF] px-3 py-2 text-xs text-[#1254C7]">
            <Info className="size-3.5 shrink-0" />
            <span>
              <span className="font-semibold">{selectedPlan.credits.toLocaleString()} credits</span>
              {' '}allocated immediately · next {selectedPlan.interval.toLowerCase()} on{' '}
              <span className="font-semibold">{selectedPlan.interval === 'Monthly' ? '01 Nov 2026' : '01 Oct 2027'}</span>
            </span>
          </div>
        )}

        {/* Rollover */}
        <div className="flex items-center justify-between">
          <label htmlFor="rollover-switch" className="text-[13px] font-semibold text-[#374151] cursor-pointer">
            Rollover unused credits
          </label>
          <Switch id="rollover-switch" checked={rollover} onCheckedChange={setRollover} />
        </div>

        <div className="h-px bg-[#F3F4F6]" />

        {/* Credit alert thresholds */}
        <div>
          <div className="flex gap-3">
            <FormField label="Low Credit Threshold">
              {({ id }) => (
                <div className="relative">
                  <TextInput
                    id={id} type="number" min={1} max={99}
                    value={lowThreshold}
                    onChange={e => { setLowThreshold(e.target.value); setThresholdError(''); }}
                    style={{ paddingRight: '2rem' }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6B7280]">%</span>
                </div>
              )}
            </FormField>
            <FormField label="Critical Threshold">
              {({ id }) => (
                <div className="relative">
                  <TextInput
                    id={id} type="number" min={1} max={99}
                    value={criticalThreshold}
                    onChange={e => { setCriticalThreshold(e.target.value); setThresholdError(''); }}
                    style={{ paddingRight: '2rem' }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6B7280]">%</span>
                </div>
              )}
            </FormField>
          </div>
          {thresholdError && <p className="mt-1.5 text-xs text-red-600">{thresholdError}</p>}
        </div>

        <div className="h-px bg-[#F3F4F6]" />

        {/* Top-up */}
        <FormField label="Top-up Credits" hint="Optional — added immediately on top of plan allocation.">
          {({ id }) => (
            <TextInput id={id} type="number" min={0} placeholder="e.g. 500"
              value={topUp} onChange={e => { setTopUp(e.target.value); if (!e.target.value) setRefError(''); }} />
          )}
        </FormField>

        {extraCredits > 0 && (
          <FormField label="Reference" required error={refError}>
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} aria-describedby={describedBy} invalid={invalid}
                placeholder="e.g. REF-20261022"
                value={reference} onChange={e => { setReference(e.target.value); if (e.target.value) setRefError(''); }} />
            )}
          </FormField>
        )}

        {/* Opening balance summary */}
        <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3">
          <span className="text-[13px] font-semibold text-[#374151]">Opening balance</span>
          <span className="text-base font-bold text-[#1565F0] tabular-nums">
            {openingBalance.toLocaleString()} <span className="text-xs font-semibold text-[#6B7280]">credits</span>
          </span>
        </div>

      </div>
    </Modal>
  );
}

// ── Edit Tenant Modal ─────────────────────────────────────────────────────────
function EditTenantModal({ tenant, onClose, onSave }: { tenant: TenantCredit; onClose: () => void; onSave: (updated: TenantCredit) => void }) {
  const [name, setName] = useState(tenant.name);
  const [nameError, setNameError] = useState('');

  function handleSave() {
    if (!name.trim()) { setNameError('Tenant name is required'); return; }
    onSave({ ...tenant, name: name.trim() });
    onClose();
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Edit Tenant" size="sm"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      }>
      <FormField label="Tenant Name" required error={nameError}>
        {({ id, describedBy, invalid }) => (
          <TextInput id={id} aria-describedby={describedBy} invalid={invalid}
            value={name} onChange={e => { setName(e.target.value); if (e.target.value) setNameError(''); }}
            placeholder="e.g. Acme Corporation" />
        )}
      </FormField>
    </Modal>
  );
}

// ── Change Plan Modal ──────────────────────────────────────────────────────────
function ChangePlanModal({ tenant, onClose }: { tenant: TenantCredit; onClose: () => void }) {
  const activePlans = MOCK_PLANS.filter(p => p.status === 'active' && p.name !== tenant.plan?.split(' ')[0]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const currentPlan = MOCK_PLANS.find(p => tenant.plan?.startsWith(p.name));
  const creditsImpact = selected ? Math.max(0, selected.credits - (currentPlan?.credits ?? 0)) : 0;

  if (confirmed && selected) {
    return (
      <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Confirm Plan Change" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmed(false)}>Back</Button>
            <Button onClick={onClose}>Confirm Change</Button>
          </div>
        }>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-[#F9FAFB] p-4 space-y-2.5">
            <Row label="Tenant" value={tenant.name} bold />
            <Row label="Current Plan" value={tenant.plan ?? '—'} />
            <Row label="New Plan" value={`${selected.name} (${selected.interval})`} blue />
            {creditsImpact > 0 && <Row label="Credits Added Now" value={`+${creditsImpact.toLocaleString()}`} green />}
            <div className="h-px bg-[#E5E7EB]" />
            <Row label="Balance After" value={(tenant.balance + creditsImpact).toLocaleString()} bold />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Change Plan"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={() => setConfirmed(true)}>Continue</Button>
        </div>
      }>
      <div className="space-y-4">
        <div className="rounded-xl bg-[#EBF3FF] px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-[#6B7280]">Tenant</span>
          <span className="font-semibold text-[#111827]">{tenant.name}</span>
          {tenant.plan && <span className="text-xs text-[#9CA3AF]">Current: {tenant.plan}</span>}
        </div>
        <FormField label="Select New Plan" required>
          {() => (
            <div className="space-y-2">
              {activePlans.map(p => (
                <button key={p.id} onClick={() => setSelected(p)}
                  className={`w-full rounded-xl border-2 p-3 text-left transition-all ${selected?.id === p.id ? 'border-[#1565F0] bg-[#EBF3FF]' : 'border-[#E5E7EB] hover:border-[#93C5FD]'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[#111827]">{p.name}</p>
                      <p className="text-xs text-[#6B7280]">{p.interval} · {p.credits.toLocaleString()} credits</p>
                    </div>
                    {selected?.id === p.id && (
                      <span className="size-5 rounded-full bg-[#1565F0] flex items-center justify-center">
                        <span className="size-2 rounded-full bg-white" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </FormField>
      </div>
    </Modal>
  );
}

// ── Top-up Modal ──────────────────────────────────────────────────────────────
function TopUpModal({ tenant, onClose }: { tenant: TenantCredit; onClose: () => void }) {
  const [credits, setCredits] = useState('');
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const amount = Number(credits);
  const newBalance = tenant.balance + amount;

  if (confirmed && amount > 0) {
    return (
      <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Confirm Top-up" size="sm" tone="success"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmed(false)}>Back</Button>
            <Button onClick={onClose}>Add Credits</Button>
          </div>
        }>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-[#F9FAFB] p-4 space-y-2.5">
            <Row label="Tenant" value={tenant.name} bold />
            <Row label="Current Balance" value={tenant.balance.toLocaleString()} />
            <Row label="Adding" value={`+${amount.toLocaleString()}`} green />
            <div className="h-px bg-[#E5E7EB]" />
            <Row label="New Balance" value={`${newBalance.toLocaleString()} credits`} bold blue />
          </div>
          {reference && <p className="text-xs text-[#6B7280]">Ref: {reference}</p>}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Add Credits (Top-up)"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={amount <= 0 || !reference.trim()} onClick={() => setConfirmed(true)}>Continue</Button>
        </div>
      }>
      <div className="space-y-4">
        <div className="rounded-xl bg-[#EBF3FF] px-4 py-3 text-sm flex items-center justify-between">
          <span className="text-[#6B7280]">Tenant</span>
          <span className="font-semibold text-[#111827]">{tenant.name}</span>
          <span className="text-xs text-[#9CA3AF]">Balance: {tenant.balance.toLocaleString()}</span>
        </div>
        <FormField label="Credits to Add" required hint="Enter a positive number">
          {({ id }) => (
            <input id={id} type="number" min={1}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={credits} onChange={e => setCredits(e.target.value)} placeholder="e.g. 1000" />
          )}
        </FormField>
        {amount > 0 && (
          <div className="rounded-lg bg-green-50 px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-green-700">Balance after top-up</span>
            <span className="font-bold text-green-800 text-base">{newBalance.toLocaleString()}</span>
          </div>
        )}
        <FormField label="Reference / Remarks" required hint="For traceability">
          {({ id }) => (
            <input id={id}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. REF-20261013" />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

// ── Small helper ──────────────────────────────────────────────────────────────
function Row({ label, value, bold, blue, green }: { label: string; value: string; bold?: boolean; blue?: boolean; green?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[#6B7280]">{label}</span>
      <span className={`text-right ${bold ? 'font-semibold text-[#111827]' : ''} ${blue ? 'text-[#1565F0]' : ''} ${green ? 'text-green-700' : ''}`}>{value}</span>
    </div>
  );
}

// ── Compact Site Admin detail view ────────────────────────────────────────────
const DETAIL_PLAN_MAX: Record<string, number> = {
  Starter: 2000, Growth: 5000, Pro: 10000, Enterprise: 150000,
};
const DETAIL_STATUS_COLORS: Record<CreditStatus, string> = {
  active: '#15803D', low: '#B45309', critical: '#EA580C', exhausted: '#DC2626', negative: '#7F1D1D',
};
const DETAIL_FEATURES = [
  { name: 'AI Course Creation', credits: 850 },
  { name: 'AI Quiz Generator', credits: 400 },
  { name: 'Text Generation', credits: 300 },
];
const DETAIL_FEATURE_COLORS = ['#1565F0', '#8B5CF6', '#059669'];

function TenantDetailView({ tenant, onBack, onViewHistory }: {
  tenant: TenantCredit;
  onBack: () => void;
  onViewHistory: () => void;
}) {
  const max = DETAIL_PLAN_MAX[tenant.plan?.split(' ')[0] ?? ''] ?? 5000;
  const used = Math.max(0, max - tenant.balance);
  const usedPct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const balancePct = max > 0 ? Math.max(0, Math.min(100, Math.round((tenant.balance / max) * 100))) : 0;
  const color = DETAIL_STATUS_COLORS[tenant.creditStatus];
  const totalFeatureCredits = DETAIL_FEATURES.reduce((a, b) => a + b.credits, 0);

  const stats = [
    { label: 'Total Allocated', value: max.toLocaleString() },
    { label: 'Credits Used', value: `${used.toLocaleString()} (${usedPct}%)` },
    { label: 'Plan', value: tenant.plan ?? '—' },
    { label: 'Next Allocation', value: tenant.nextAllocation ?? '—' },
    { label: 'Allocation Status', value: tenant.allocationStatus === 'active' ? 'Active' : 'Inactive', green: tenant.allocationStatus === 'active' },
    { label: 'Transactions', value: String(MOCK_TRANSACTIONS.length) },
  ] as const;

  return (
    <div className="px-8 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="truncate text-lg font-bold text-[#111827]">{tenant.name}</h2>
          <CreditStatusBadge status={tenant.creditStatus} />
          {tenant.tenantStatus === 'suspended' && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Suspended</span>
          )}
        </div>
        <button
          onClick={onViewHistory}
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#1565F0] hover:underline"
        >
          <Clock className="size-3.5" /> View History
        </button>
      </div>

      {/* Credit summary card */}
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-start gap-6">
          {/* Balance + linear bar */}
          <div className="min-w-[180px]">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Balance</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tabular-nums ${tenant.balance < 0 ? 'text-red-600' : 'text-[#111827]'}`}>
                {tenant.balance.toLocaleString()}
              </span>
              <span className="text-xs text-[#9CA3AF]">credits</span>
            </div>
            <div className="mt-2.5 h-2 rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${balancePct}%`, background: color }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-[#9CA3AF]">
              <span style={{ color }}>{balancePct}% remaining</span>
              <span>of {max.toLocaleString()}</span>
            </div>
          </div>

          <div className="h-14 w-px self-center shrink-0 bg-[#F3F4F6]" />

          {/* Stats grid */}
          <div className="grid flex-1 grid-cols-3 gap-x-6 gap-y-3">
            {stats.map(s => (
              <div key={s.label}>
                <p className="text-[11px] text-[#9CA3AF]">{s.label}</p>
                <p className={`text-sm font-semibold ${'green' in s && s.green ? 'text-green-700' : 'text-[#111827]'}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage + Activity — 2 columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Usage by Feature */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Usage by Feature</p>
          <div className="space-y-3">
            {DETAIL_FEATURES.map((f, i) => {
              const pct = Math.round((f.credits / totalFeatureCredits) * 100);
              return (
                <div key={f.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ background: DETAIL_FEATURE_COLORS[i] }} />
                      <span className="text-[#374151]">{f.name}</span>
                    </div>
                    <span className="tabular-nums">
                      <span className="font-semibold text-[#111827]">{f.credits.toLocaleString()}</span>
                      <span className="ml-1 text-[#9CA3AF]">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F3F4F6]">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: DETAIL_FEATURE_COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Recent Activity</p>
          <div>
            {MOCK_TRANSACTIONS.slice(0, 5).map((t, i) => (
              <div key={t.id}
                className={`flex items-center justify-between py-2 ${i < 4 ? 'border-b border-[#F9FAFB]' : ''}`}>
                <div className="mr-3 min-w-0">
                  <p className="truncate text-xs font-medium text-[#111827]">{t.description}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{t.date}</p>
                </div>
                <span className={`shrink-0 text-xs font-bold tabular-nums ${t.credits > 0 ? 'text-green-700' : 'text-red-500'}`}>
                  {t.credits > 0 ? `+${t.credits.toLocaleString()}` : t.credits.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <button onClick={onViewHistory}
            className="mt-2 text-xs font-medium text-[#1565F0] hover:underline">
            View full history →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Credit status labels ───────────────────────────────────────────────────────
const ALL_STATUSES: CreditStatus[] = ['active', 'low', 'critical', 'exhausted', 'negative'];
const STATUS_LABELS: Record<CreditStatus, string> = {
  active: 'Healthy', low: 'Low', critical: 'Critical', exhausted: 'Exhausted', negative: 'Negative',
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TenantCreditPage() {
  const { role } = useRole();
  const isSiteAdmin = role === 'site-admin';
  const [tenants, setTenants] = useState<TenantCredit[]>(MOCK_TENANTS);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CreditStatus[]>([]);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [page, setPage] = useState(1);
  const [editTenant, setEditTenant] = useState<TenantCredit | null>(null);
  const [changePlanTenant, setChangePlanTenant] = useState<TenantCredit | null>(null);
  const [topUpTenant, setTopUpTenant] = useState<TenantCredit | null>(null);
  const [historyTenant, setHistoryTenant] = useState<TenantCredit | null>(null);
  const [monitorTenant, setMonitorTenant] = useState<TenantCredit | null>(null);
  const [confirmToggleTenant, setConfirmToggleTenant] = useState<TenantCredit | null>(null);
  const [detailTenant, setDetailTenant] = useState<TenantCredit | null>(null);
  const pageSize = 10;

  const attention: CreditStatus[] = ['low', 'critical', 'exhausted', 'negative'];

  const filtered = tenants.filter(t => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tenantStatusFilter !== 'all' && t.tenantStatus !== tenantStatusFilter) return false;
    if (needsAttention && !attention.includes(t.creditStatus)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(t.creditStatus)) return false;
    return true;
  });

  const needsCount = tenants.filter(t => attention.includes(t.creditStatus)).length;
  const activeCount = tenants.filter(t => t.tenantStatus === 'active').length;
  const suspendedCount = tenants.filter(t => t.tenantStatus === 'suspended').length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleStatus(s: CreditStatus) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setPage(1);
  }

  const hasFilters = statusFilter.length > 0 || needsAttention || tenantStatusFilter !== 'all';

  if (detailTenant) {
    return (
      <>
        <TenantDetailView
          tenant={detailTenant}
          onBack={() => setDetailTenant(null)}
          onViewHistory={() => setHistoryTenant(detailTenant)}
        />
        {historyTenant && (
          <Modal open onOpenChange={(v) => { if (!v) setHistoryTenant(null); }}
            title={`Transaction History — ${historyTenant.name}`} size="lg">
            <CreditTransactionHistory tenantName={historyTenant.name} />
          </Modal>
        )}
      </>
    );
  }

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Credit Management"
        actions={
          <div className="flex items-center gap-2">
            {isSiteAdmin && (
              <Button variant="secondary" leftIcon={<Download className="size-4" />}>Export CSV</Button>
            )}
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setShowCreate(true)}>Create Tenant</Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatWidget label="Total Tenants" value={tenants.length} icon={Users} tone="blue" />
        <StatWidget label="Active Accounts" value={activeCount} icon={Activity} tone="green" />
        <StatWidget label="Needs Attention" value={needsCount} icon={AlertTriangle} tone="amber"
          hint={needsCount > 0 ? 'Low, critical or exhausted' : 'All credits healthy'} />
        <StatWidget label="Suspended" value={suspendedCount} icon={ShieldOff} tone="orange" />
      </div>

      {/* ── Filter toolbar ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5">

        {/* 1. Search */}
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Search tenants…"
          className="w-52 [&_input]:!h-9 [&_input]:!rounded-lg [&_input]:!border-gray-200 [&_input:hover]:!border-gray-300"
        />

        <div className="h-5 w-px bg-gray-200 shrink-0" />

        {/* 2. Account status — segmented control */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(['all', 'active', 'suspended'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setTenantStatusFilter(s); setPage(1); }}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all',
                tenantStatusFilter === s
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200 shrink-0" />

        {/* 3. Credit Health — dropdown (multi-select) */}
        <DropdownMenu
          align="start"
          trigger={
            <button className={[
              'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
              statusFilter.length > 0
                ? 'border-[#1565F0] bg-[#EBF3FF] text-[#1254C7]'
                : 'border-gray-200 bg-white text-[#374151] hover:border-gray-300 hover:bg-gray-50',
            ].join(' ')}>
              <span>Credit Health</span>
              {statusFilter.length > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-[#1565F0] text-[10px] font-bold text-white">
                  {statusFilter.length}
                </span>
              )}
              <ChevronDown className="size-3.5 text-gray-400" />
            </button>
          }
          items={ALL_STATUSES.map(s => ({
            type: 'checkbox' as const,
            label: STATUS_LABELS[s],
            checked: statusFilter.includes(s),
            onCheckedChange: (v: boolean) => {
              setStatusFilter(prev => v ? [...prev, s] : prev.filter(x => x !== s));
              setPage(1);
            },
          }))}
        />

        {/* 4. Needs Attention — toggle */}
        <button
          onClick={() => { setNeedsAttention(n => !n); setPage(1); }}
          className={[
            'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
            needsAttention
              ? 'border-orange-300 bg-orange-50 text-orange-700'
              : 'border-gray-200 bg-white text-[#374151] hover:border-orange-200 hover:text-orange-600',
          ].join(' ')}
        >
          <AlertTriangle className="size-3.5" />
          <span>Needs Attention</span>
          {needsCount > 0 && (
            <span className={[
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
              needsAttention ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600',
            ].join(' ')}>
              {needsCount}
            </span>
          )}
        </button>

        {/* 5. Right — result count + clear */}
        <div className="ml-auto flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={() => { setStatusFilter([]); setNeedsAttention(false); setTenantStatusFilter('active'); setPage(1); }}
              className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="size-3" />
              Clear all
            </button>
          )}
          <span className="text-xs text-gray-400 tabular-nums">
            {filtered.length} of {tenants.length} tenants
          </span>
        </div>

      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <DataTable
          rows={paginated}
          rowKey={r => r.id}
          columns={[
            {
              key: 'name', header: 'Tenant',
              cell: r => (
                <button className="text-left group" onClick={() => setDetailTenant(r)}>
                  <p className="font-semibold text-[#111827] text-sm group-hover:text-[#1565F0] transition-colors">{r.name}</p>
                  <p className={`text-xs mt-0.5 ${r.tenantStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {r.tenantStatus === 'active' ? 'Active account' : 'Suspended'}
                  </p>
                </button>
              ),
            },
            {
              key: 'plan', header: 'Plan',
              cell: r => r.plan
                ? <span className="rounded-full bg-[#EBF3FF] px-2.5 py-1 text-xs font-semibold text-[#1254C7]">{r.plan}</span>
                : <span className="text-xs text-[#9CA3AF]">No plan</span>,
            },
            {
              key: 'balance', header: 'Balance', align: 'right',
              cell: r => (
                <span className={`font-bold text-sm tabular-nums ${r.balance < 0 ? 'text-red-700' : r.balance === 0 ? 'text-red-500' : 'text-[#111827]'}`}>
                  {r.balance.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'creditStatus', header: 'Credit Health',
              cell: r => <CreditStatusBadge status={r.creditStatus} />,
            },
            {
              key: 'nextAllocation', header: 'Next Allocation',
              cell: r => (
                <span className={`text-sm ${r.nextAllocation === 'Paused' ? 'font-medium text-amber-600' : 'text-[#374151]'}`}>
                  {r.nextAllocation ?? '—'}
                </span>
              ),
            },
            {
              key: 'allocationStatus', header: 'Allocation Status',
              cell: r => (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.allocationStatus === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`size-1.5 rounded-full ${r.allocationStatus === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {r.allocationStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'actions' as keyof TenantCredit, header: '', align: 'right',
              cell: r => {
                const suspended = r.tenantStatus === 'suspended';
                if (!isSiteAdmin) return null;
                return (
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip content={suspended ? 'Unavailable for suspended tenants' : 'Top-up Credits'}>
                      <IconButton variant="ghost" size="sm" label="Top-up" disabled={suspended}
                        icon={<Plus className="size-4 text-[#1565F0]" />}
                        onClick={() => setTopUpTenant(r)} />
                    </Tooltip>
                    <Tooltip content="Edit">
                      <IconButton variant="ghost" size="sm" label="Edit"
                        icon={<Pencil className="size-4" />}
                        onClick={() => setEditTenant(r)} />
                    </Tooltip>
                    <Tooltip content={suspended ? 'Change Plan unavailable' : 'Change Plan'}>
                      <IconButton variant="ghost" size="sm" label="Change Plan" disabled={suspended}
                        icon={<ArrowLeftRight className="size-4" />}
                        onClick={() => setChangePlanTenant(r)} />
                    </Tooltip>
                    <Tooltip content="View Dashboard">
                      <IconButton variant="ghost" size="sm" label="View Dashboard"
                        icon={<LayoutDashboard className="size-4" />}
                        onClick={() => setMonitorTenant(r)} />
                    </Tooltip>
                    <Tooltip content="Transaction History">
                      <IconButton variant="ghost" size="sm" label="Transaction History"
                        icon={<Clock className="size-4" />}
                        onClick={() => setHistoryTenant(r)} />
                    </Tooltip>
                    <Tooltip content={suspended ? 'Activate' : 'Deactivate'}>
                      <IconButton variant="ghost" size="sm"
                        label={suspended ? 'Activate' : 'Deactivate'}
                        icon={suspended ? <Power className="size-4 text-green-600" /> : <PowerOff className="size-4 text-red-400" />}
                        onClick={() => setConfirmToggleTenant(r)} />
                    </Tooltip>
                  </div>
                );
              },
            },
          ]}
          footer={
            <Pagination page={page} pageSize={pageSize} total={filtered.length}
              onPageChange={setPage} itemLabel="tenants" />
          }
        />
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => { setTenants(prev => [t, ...prev]); toast.success('Tenant created', { description: `${t.name} has been added.` }); }}
        />
      )}
      {editTenant && (
        <EditTenantModal
          tenant={editTenant}
          onClose={() => setEditTenant(null)}
          onSave={(updated) => { setTenants(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditTenant(null); toast.success('Tenant updated', { description: `${updated.name} has been saved.` }); }}
        />
      )}
      {changePlanTenant && (
        <ChangePlanModal tenant={changePlanTenant} onClose={() => { setChangePlanTenant(null); toast.success('Plan updated', { description: `${changePlanTenant.name}'s plan has been changed.` }); }} />
      )}
      {topUpTenant && (
        <TopUpModal tenant={topUpTenant} onClose={() => { setTopUpTenant(null); toast.success('Credits added', { description: `Top-up applied to ${topUpTenant.name}.` }); }} />
      )}

      {/* Activate / Deactivate confirmation */}
      {confirmToggleTenant && (() => {
        const isSuspended = confirmToggleTenant.tenantStatus === 'suspended';
        return (
          <Modal
            open
            onOpenChange={(v) => { if (!v) setConfirmToggleTenant(null); }}
            title={isSuspended ? 'Activate Tenant?' : 'Deactivate Tenant?'}
            size="sm"
            tone={isSuspended ? undefined : 'warning'}
            footer={
              <div className="flex w-full items-center justify-between">
                <Button variant="secondary" onClick={() => setConfirmToggleTenant(null)}>Cancel</Button>
                <Button
                  variant={isSuspended ? undefined : 'danger'}
                  onClick={() => {
                    const newStatus = isSuspended ? 'active' : 'suspended';
                    setTenants(prev => prev.map(t => t.id === confirmToggleTenant.id ? { ...t, tenantStatus: newStatus } : t));
                    setConfirmToggleTenant(null);
                    if (isSuspended) {
                      toast.success('Tenant activated', { description: `${confirmToggleTenant.name} is now active.` });
                    } else {
                      toast.warning('Tenant deactivated', { description: `${confirmToggleTenant.name} has been suspended.` });
                    }
                  }}
                >
                  {isSuspended ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            }
          >
            <p className="text-sm text-[#374151]">
              {isSuspended
                ? <>Are you sure you want to activate <strong>{confirmToggleTenant.name}</strong>? Their plan allocation will resume.</>
                : <>Are you sure you want to deactivate <strong>{confirmToggleTenant.name}</strong>? Their plan allocation will be paused.</>}
            </p>
          </Modal>
        );
      })()}
      {historyTenant && (
        <Modal open onOpenChange={(v) => { if (!v) setHistoryTenant(null); }}
          title={`Transaction History — ${historyTenant.name}`} size="lg">
          <CreditTransactionHistory tenantName={historyTenant.name} />
        </Modal>
      )}
      {monitorTenant && (
        <Modal open onOpenChange={(v) => { if (!v) setMonitorTenant(null); }}
          title={`Credit Dashboard — ${monitorTenant.name}`} size="xl">
          <CreditMonitoringContent tenant={monitorTenant} />
        </Modal>
      )}
    </div>
  );
}
