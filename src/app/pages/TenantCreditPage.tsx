import { useState, useRef } from 'react';
import { CreditFormPage } from '../components/CreditFormPage';
import { toast } from 'sonner';
import { Download, AlertTriangle, Users, Layers, Zap, Activity, ChevronDown, ChevronRight, X, Plus, Info, Pencil, Ban, Power, ArrowLeft } from 'lucide-react';
import {
  Button, Checkbox, DataTable, Pagination, Modal, FormField, SearchBar,
  Tooltip, PageHeader, StatWidget, DropdownMenu, IconButton, TextInput, TextArea, SelectInput,
} from '../components/saas';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus } from './creditTypes';
import { MOCK_TENANTS, MOCK_PLANS, MOCK_TRANSACTIONS, AVAILABLE_TENANTS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';
import { ORG_ADMIN_TENANT_ID, useRole } from '../context/RoleContext';


// ── Assign / Edit Tenant Page ────────────────────────────────────────────────────────
export function TenantCreditsFormPage({ tenant, onClose, onSave }: { tenant?: TenantCredit; onClose: () => void; onSave: (t: TenantCredit) => void | Promise<void> }) {
  const currentPlan = MOCK_PLANS.find(p => tenant?.plan === `${p.name} (${p.interval})`);
  const suspended = tenant?.tenantStatus === 'suspended';
  const [name, setName] = useState(tenant?.name ?? '');
  const [planId, setPlanId] = useState(currentPlan?.id ?? '');
  const [rollover, setRollover] = useState(tenant?.rollover ?? true);
  const [allowOrgAdminStopAllocation, setAllowOrgAdminStopAllocation] = useState(tenant?.allowOrgAdminStopAllocation ?? false);
  const [topUp, setTopUp] = useState('');
  const [reference, setReference] = useState('');
  const [nameError, setNameError] = useState('');
  const [refError, setRefError] = useState('');
  const [lowThreshold, setLowThreshold] = useState(String(tenant?.lowThreshold ?? 20));
  const [criticalThreshold, setCriticalThreshold] = useState(String(tenant?.criticalThreshold ?? 10));
  const [thresholdError, setThresholdError] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [saveError, setSaveError] = useState('');
  const [topUpError, setTopUpError] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const activePlans = MOCK_PLANS.filter(p => p.status === 'active' || p.id === currentPlan?.id);
  const selectedPlan = activePlans.find(p => p.id === planId) ?? null;
  const planCredits = selectedPlan?.credits ?? 0;
  const extraCredits = Number(topUp);
  const validTopUp = Number.isFinite(extraCredits) && extraCredits >= 0;
  // Preserve the existing demo schedule; display and payload share one value.
  const nextAllocation = tenant && planId === (currentPlan?.id ?? '') ? tenant.nextAllocation
    : selectedPlan ? (selectedPlan.interval === 'Monthly' ? '01 Nov 2026' : '01 Oct 2027') : undefined;
  const planChanged = planId !== (currentPlan?.id ?? '');
  const creditsAdded = tenant ? (planChanged ? Math.max(0, planCredits - (currentPlan?.credits ?? 0)) : 0) : planCredits;
  const openingBalance = (tenant?.balance ?? 0) + creditsAdded + extraCredits;
  const changeType = !planChanged ? 'No Change' : !selectedPlan ? 'Plan Removed'
    : !currentPlan ? 'Initial Assignment' : planCredits > currentPlan.credits ? 'Upgrade'
    : planCredits < currentPlan.credits ? 'Downgrade' : 'Plan Change';
  const changeTone = changeType === 'Upgrade' || changeType === 'Initial Assignment'
    ? 'bg-green-50 text-green-700' : changeType === 'Downgrade' || changeType === 'Plan Removed'
    ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600';

  const impactSummary = (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="text-[#6B7280]">Change Type</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${changeTone}`}>{changeType}</span>
        </div>
        <div><span className="mr-1.5 text-[#9CA3AF]">Effective</span><span className="font-medium text-[#374151]">Immediately</span></div>
      </div>
      <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Credits added now</p>
          <p className="text-base font-bold tabular-nums text-green-700">+{validTopUp && !topUpError ? (creditsAdded + extraCredits).toLocaleString() : '?'}</p>
        </div>
        <div className="h-8 w-px bg-[#E5E7EB]" />
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Balance after</p>
          <p className="text-base font-bold tabular-nums text-[#1565F0]">{validTopUp && !topUpError && Number.isFinite(openingBalance) ? openingBalance.toLocaleString() : '?'}</p>
        </div>
      </div>
      {extraCredits > 0 && <p className="text-xs text-[#6B7280]">Includes {extraCredits.toLocaleString()} top-up credits.</p>}
      {(changeType === 'Downgrade' || changeType === 'Plan Removed') && <p className="text-xs text-amber-700">Existing credits are retained. No credits are removed.</p>}
    </div>
  );

  function deriveCreditStatus(balance: number, planCreds: number, lowPct = 0.20, critPct = 0.10): CreditStatus {
    if (balance < 0) return 'negative';
    if (balance === 0) return 'exhausted';
    if (planCreds > 0) {
      const pct = balance / planCreds;
      if (pct <= critPct) return 'critical';
      if (pct <= lowPct) return 'low';
    }
    return 'active';
  }

  async function handleSave() {
    if (suspended || savingRef.current) return;
    setSaveError('');
    let valid = true;
    if (!name.trim()) { setNameError('Tenant name is required'); valid = false; }
    if (extraCredits > 0 && !reference.trim()) { setRefError('Reference is required for top-up'); valid = false; }
    const lowVal = Number(lowThreshold);
    const critVal = Number(criticalThreshold);
    if (!Number.isFinite(lowVal) || !Number.isFinite(critVal) || lowVal <= 0 || lowVal >= 100 || critVal <= 0 || critVal >= lowVal) {
      setThresholdError('Enter percentages greater than 0 and less than 100. Critical must be lower than Low.');
      valid = false;
    } else {
      setThresholdError('');
    }
    if (!validTopUp || topUpError || !Number.isFinite(openingBalance)) {
      setTopUpError('Enter a valid, non-negative top-up amount.');
      valid = false;
    }
    if (!valid) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    if (tenant && !reviewing) { setReviewing(true); return; }
    const updatedTenant: TenantCredit = {
      ...tenant,
      id: tenant?.id ?? `T-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: name.trim(),
      tenantStatus: tenant?.tenantStatus ?? 'active',
      plan: selectedPlan ? `${selectedPlan.name} (${selectedPlan.interval})` : undefined,
      nextAllocation: suspended ? 'Paused' : nextAllocation,
      balance: openingBalance,
      creditStatus: deriveCreditStatus(openingBalance, planCredits, lowVal / 100, critVal / 100),
      allocationStatus: tenant && !planChanged ? tenant.allocationStatus : selectedPlan ? 'active' : 'inactive',
      rollover,
      allowOrgAdminStopAllocation,
      lowThreshold: lowVal,
      criticalThreshold: critVal,
      topUpReference: extraCredits > 0 ? reference.trim() : tenant?.topUpReference,
    };
    savingRef.current = true;
    setSaving(true);
    try {
      await onSave(updatedTenant);
      onClose();
    } catch {
      setSaveError('Unable to save tenant credits. Your entries are preserved. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const planOptions = [
    { value: '', label: 'No plan' },
    ...activePlans.map(p => ({ value: p.id, label: `${p.name} (${p.interval}) — ${p.credits.toLocaleString()} credits` })),
  ];

  if (reviewing && tenant) return (
    <CreditFormPage busy={saving} noValidate onBack={() => setReviewing(false)} backLabel="Back to Edit Tenant Credits" onSubmit={handleSave} title="Confirm Plan Change"
      footer={<div className="flex w-full flex-wrap items-center justify-between gap-3">
        <Button disabled={saving} variant="secondary" onClick={() => setReviewing(false)}>Back</Button>
        <Button loading={saving} loadingText="Saving�" type="submit">Confirm</Button>
      </div>}>
      <div className="space-y-4">
        {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
        <p className="text-sm text-[#374151]">Confirm the following changes for <strong>{tenant.name}</strong>?</p>
        <div className="space-y-2 rounded-lg border border-[#E5E7EB] p-3">
          <Row label="Current Plan" value={tenant.plan ?? 'No plan assigned'} />
          <Row label="New Plan" value={selectedPlan ? `${selectedPlan.name} (${selectedPlan.interval})` : 'No plan'} bold />
        </div>
        {impactSummary}
        <div className="space-y-2 text-sm">
          <Row label="Rollover unused credits" value={rollover ? 'On' : 'Off'} />
          <Row label="Org Admin can stop allocation" value={allowOrgAdminStopAllocation ? 'Yes' : 'No'} />
          <Row label="Low / Critical thresholds" value={`${lowThreshold}% / ${criticalThreshold}%`} />
          {extraCredits > 0 && <Row label="Reference" value={reference} />}
        </div>
      </div>
    </CreditFormPage>
  );

  return (
    <CreditFormPage busy={saving} noValidate
      onBack={onClose}
      backLabel="Back to Credit Management"
      onSubmit={handleSave}
      title={tenant ? "Edit Tenant Credits — " + tenant.name : "Assign Tenant Credits"}
      description={tenant ? "Update tenant details, plan and credit settings." : "Choose a tenant, allocate credits and configure credit alerts."}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button disabled={saving} variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} loadingText="Saving�" disabled={suspended}>{tenant ? "Review & Confirm" : "Assign Tenant"}</Button>
        </div>
      }
    >
      <div ref={formRef} className="tenant-allocation-form">
      {saveError && <p role="alert" className="mb-4 text-sm text-red-700">{saveError}</p>}
      <div className="allocation-columns grid items-start gap-6">
        <section aria-labelledby="tenant-plan-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="tenant-plan-heading" className="text-sm font-semibold text-[#111827]">Plan and credits</h3>
            {tenant && (
              <span className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs">
                <span className="text-[#6B7280]">Current plan:</span>
                <span className="font-semibold text-[#374151]">{tenant.plan ?? 'No plan assigned'}</span>
              </span>
            )}
          </div>
        <div className={`allocation-fields grid items-start gap-4 ${tenant ? "allocation-fields-edit" : ""}`}>
        {/* Tenant name */}
        {!tenant && <FormField label="Tenant Name" required error={nameError}>
          {({ id, describedBy, invalid }) => (
            <SelectInput
              aria-required="true" aria-describedby={describedBy} invalid={invalid}
              id={id}
              value={name}
              options={[
                { value: '', label: 'Select a tenant' },
                ...AVAILABLE_TENANTS.map(t => ({ value: t, label: t })),
              ]}
              onChange={e => { setName(e.target.value); if (e.target.value) setNameError(''); }}
            />
          )}
        </FormField>}


        {/* Plan */}

        <FormField label={tenant ? 'New Plan' : 'Plan'}>
          {({ id }) => (
            <SelectInput id={id} value={planId} options={planOptions} disabled={suspended}
              onChange={e => setPlanId(e.target.value)} />
          )}
        </FormField>
        {<FormField label="Top-up Credits" error={topUpError} hint="Optional. Added to the plan allocation immediately.">
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} aria-describedby={describedBy} invalid={invalid} type="number" step="any" min={0} disabled={suspended} placeholder="e.g. 500"
              value={topUp} onChange={e => { setTopUp(e.target.value); setTopUpError(e.target.validity.badInput || !Number.isFinite(Number(e.target.value)) || Number(e.target.value) < 0 ? 'Enter a valid, non-negative top-up amount.' : ''); if (!e.target.value) setRefError(''); }} />
          )}
        </FormField>}
        </div>


        {extraCredits > 0 && (
          <FormField label="Reference" required error={refError}>
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} aria-required="true" aria-describedby={describedBy} invalid={invalid}
                placeholder="e.g. REF-20261022"
                value={reference} onChange={e => { setReference(e.target.value); if (e.target.value) setRefError(''); }} />
            )}
          </FormField>
        )}


        {/* Allocation info — only when a plan is chosen */}
        {tenant ? impactSummary : selectedPlan && (
          <div className="flex items-center gap-2 rounded-lg bg-[#EBF3FF] px-3 py-2 text-xs text-[#1254C7]">
            <Info className="size-3.5 shrink-0" />
            <span>
              Effective upon saving. Next allocation: {nextAllocation}.
            </span>
          </div>
        )}


        {/* Opening balance summary */}
        {!tenant && <section aria-labelledby="opening-balance-title" className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 id="opening-balance-title" className="text-sm font-semibold text-[#374151]">Opening balance</h3>
            <output aria-live="polite" aria-atomic="true" className="text-base font-bold text-[#1565F0] tabular-nums">
              {validTopUp && !topUpError && Number.isFinite(openingBalance) ? openingBalance.toLocaleString() : '�'} <span className="text-sm font-normal text-[#6B7280]">credits</span>
            </output>
          </div>
          <p className="sr-only">{planCredits.toLocaleString()} plan credits + {validTopUp && !topUpError ? extraCredits.toLocaleString() : '�'} top-up credits</p>
        </section>}

        </section>
        <div className="space-y-6">
        <section aria-labelledby="tenant-allocation-heading" className="space-y-4 border-t border-[#E5E7EB] pt-5">
          <h3 id="tenant-allocation-heading" className="text-sm font-semibold text-[#111827]">Allocation settings</h3>
        <div className="allocation-settings-row grid items-center gap-4">
        {/* Rollover */}
        <div className="flex items-center gap-3">
          <label htmlFor="rollover-switch" className="text-[13px] font-semibold text-[#374151] cursor-pointer">
            Rollover unused credits
          </label>
          <Switch id="rollover-switch" checked={rollover} onCheckedChange={setRollover}
            className="data-[state=checked]:bg-[#1565F0]" />
        </div>

        <Checkbox label="Allow Org Admin to Deactivate Plan"
          className="[&>span:last-child]:text-[#374151] [&>span:last-child]:font-normal"
          checked={allowOrgAdminStopAllocation} onChange={setAllowOrgAdminStopAllocation} />
        </div>
        </section>
        <section aria-labelledby="tenant-alerts-heading" className="space-y-3 border-t border-[#E5E7EB] pt-5">
          <h3 id="tenant-alerts-heading" className="text-sm font-semibold text-[#111827]">Credit alerts</h3>
        {/* Credit alert thresholds */}
        <div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Low Credit Threshold">
              {({ id }) => (
                <div className="relative">
                  <TextInput
                    id={id} type="number" step="any" invalid={!!thresholdError}
                    value={lowThreshold}
                    aria-describedby={thresholdError ? "credit-threshold-help credit-threshold-error" : "credit-threshold-help"}
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
                    id={id} type="number" step="any" invalid={!!thresholdError}
                    value={criticalThreshold}
                    aria-describedby={thresholdError ? "credit-threshold-help credit-threshold-error" : "credit-threshold-help"}
                    onChange={e => { setCriticalThreshold(e.target.value); setThresholdError(''); }}
                    style={{ paddingRight: '2rem' }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[#6B7280]">%</span>
                </div>
              )}
            </FormField>
          </div>
          <p id="credit-threshold-help" className="mt-2 text-xs leading-relaxed text-[#6B7280]">
            Alerts notify the Credit Manager and Org Admin when credits reach the configured thresholds.
          </p>
          {thresholdError && <p id="credit-threshold-error" role="alert" className="mt-1.5 text-xs text-red-600">{thresholdError}</p>}
        </div>
        </section>
        </div>
      </div>
      </div>
    </CreditFormPage>
  );
}

// ── Top-up Modal ──────────────────────────────────────────────────────────────
function TopUpFormPage({ tenant, onClose, onConfirm }: { tenant: TenantCredit; onClose: () => void; onConfirm: (amount: number, reference: string) => void }) {
  const [credits, setCredits] = useState('');
  const [reference, setReference] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const amount = Number(credits);
  const newBalance = tenant.balance + amount;
  const valid = Number.isFinite(amount) && amount > 0 && Number.isFinite(newBalance) && !!reference.trim();

  if (confirmed && amount > 0) {
    return (
      <CreditFormPage onBack={() => setConfirmed(false)} backLabel="Back to Top-up" onSubmit={() => { if (valid) onConfirm(amount, reference.trim()); }} title="Confirm Top-up" description="Review the credit adjustment before confirming."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmed(false)}>Back</Button>
            <Button disabled={!valid} onClick={() => { if (valid) onConfirm(amount, reference.trim()); }}>Add Credits</Button>
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
      </CreditFormPage>
    );
  }

  return (
    <CreditFormPage onBack={onClose} backLabel="Back to Credit Management" onSubmit={() => { if (valid) setConfirmed(true); }} title="Add Credits (Top-up)" description="Add credits to the tenant balance and record a reference for the adjustment."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button disabled={!valid} onClick={() => setConfirmed(true)}>Continue</Button>
        </div>
      }>
      <div className="grid items-start gap-5 md:grid-cols-2">
        <dl className="md:col-span-2 flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <dt className="text-xs text-[#6B7280]">Tenant</dt>
            <dd className="mt-1 text-base font-semibold text-[#111827]">{tenant.name}</dd>
          </div>
          <div className="text-right">
            <dt className="text-xs text-[#6B7280]">Current balance</dt>
            <dd className={`mt-1 text-base font-semibold tabular-nums ${tenant.balance < 0 ? 'text-red-600' : 'text-[#111827]'}`}>
              {tenant.balance.toLocaleString()} <span className="text-xs font-normal text-[#6B7280]">credits</span>
            </dd>
          </div>
        </dl>
        <FormField label="Credits to Add" required hint="Enter a positive number">
          {({ id }) => (
            <TextInput id={id} type="number" min={1}
              value={credits} onChange={e => setCredits(e.target.value)} placeholder="e.g. 1000" />
          )}
        </FormField>
        <FormField label="Reference / Remarks" required hint="For traceability">
          {({ id }) => (
            <TextInput id={id}
              value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. REF-20261013" />
          )}
        </FormField>
        {amount > 0 && (
          <div className="md:col-span-2 rounded-lg bg-green-50 px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="text-green-700">Balance after top-up</span>
            <span className="font-bold text-green-800 text-base">{newBalance.toLocaleString()}</span>
          </div>
        )}
      </div>
    </CreditFormPage>
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

// Prototype activity rows from the supplied reference.
const ORG_RECENT_ACTIVITY = [
  {
    "id": "activity-0",
    "date": "22 Sept, 14:17",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.66
  },
  {
    "id": "activity-1",
    "date": "22 Sept, 14:16",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.83
  },
  {
    "id": "activity-2",
    "date": "22 Sept, 14:16",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.88
  },
  {
    "id": "activity-3",
    "date": "22 Sept, 14:15",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.87
  },
  {
    "id": "activity-4",
    "date": "22 Sept, 14:14",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.88
  },
  {
    "id": "activity-5",
    "date": "22 Sept, 14:14",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.82
  },
  {
    "id": "activity-6",
    "date": "22 Sept, 14:13",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.77
  },
  {
    "id": "activity-7",
    "date": "22 Sept, 14:13",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.68
  },
  {
    "id": "activity-8",
    "date": "22 Sept, 14:13",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.63
  },
  {
    "id": "activity-9",
    "date": "22 Sept, 14:12",
    "user": "Company Manager",
    "module": "Roleplay",
    "feature": "Chat",
    "credits": 0.67
  }
];

function TenantDetailView({ tenant, onBack, onStopAllocation }: {
  tenant: TenantCredit;
  onBack?: () => void;
  onStopAllocation?: (reason: string) => void;
}) {
  const [confirmStop, setConfirmStop] = useState(false);
  const isOrgAdmin = useRole().role === 'org-admin';
  const [historyTab, setHistoryTab] = useState('activity');
  const [stopReason, setStopReason] = useState('');
  const canStop = !!onStopAllocation && !!tenant.allowOrgAdminStopAllocation
    && !!tenant.plan && tenant.allocationStatus === 'active' && tenant.tenantStatus === 'active';
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
      <div className="flex flex-wrap items-center gap-3">
        {onBack && <button
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#374151] transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="size-3.5" /> Back
        </button>}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className="truncate text-lg font-bold text-[#111827]">{tenant.name}</h2>
          <CreditStatusBadge status={tenant.creditStatus} />
          {tenant.tenantStatus === 'suspended' && (
            <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Suspended</span>
          )}
        </div>
      {onStopAllocation && (
        <div className="ml-auto shrink-0">
          <Tooltip content={!tenant.allowOrgAdminStopAllocation
            ? 'Your credit manager has not enabled this permission'
            : tenant.allocationStatus === 'inactive' ? 'Credit allocation is already inactive'
            : 'Stop future credit allocations'}>
            <Button variant="secondary" leftIcon={<Ban className="size-4" />}
              disabled={!canStop} onClick={() => { setStopReason(''); setConfirmStop(true); }}>
              Inactivate Plan
            </Button>
          </Tooltip>
        </div>
      )}
      </div>
      {confirmStop && canStop && (
        <Modal open title="Inactivate Plan?" size="sm" tone="warning"
          onOpenChange={open => { if (!open) setConfirmStop(false); }}
          footer={<div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmStop(false)}>Cancel</Button>
            <Button variant="danger" disabled={!stopReason.trim()} onClick={() => {
              onStopAllocation?.(stopReason.trim());
              setConfirmStop(false);
            }}>Inactivate Plan</Button>
          </div>}>
          <div className="space-y-4">
            <p className="text-sm text-[#374151]">Are you sure you want to inactivate the plan? <strong>Future AI credit allocations will stop.</strong> Existing available credits can continue to be used.</p>
            <FormField label="Reason / Remarks" required>
              {({ id }) => <TextArea id={id} rows={3} value={stopReason}
                onChange={event => setStopReason(event.target.value)} placeholder="Enter reason" />}
            </FormField>
          </div>
        </Modal>
      )}

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
      <div className={isOrgAdmin ? "space-y-4" : "grid grid-cols-2 gap-4"}>
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
        {!isOrgAdmin && <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
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
        </div>}
      </div>

      <section aria-label="Tenant history" className="rounded-xl border border-[#E5E7EB] bg-white p-4">
        {isOrgAdmin ? (
          <Tabs value={historyTab} onValueChange={setHistoryTab} className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList aria-label="Credit activity and history" className="bg-[#F3F4F6]">
              <TabsTrigger value="activity" className="px-4 data-[state=active]:shadow-sm">Recent Activity</TabsTrigger>
              <TabsTrigger value="transactions" className="px-4 data-[state=active]:shadow-sm">Transaction History</TabsTrigger>
            </TabsList>
            {historyTab === 'activity' && (
              <Button variant="secondary" size="sm" leftIcon={<Download className="size-3.5" />}>Export CSV</Button>
            )}
            </div>
            <TabsContent value="activity">
            <DataTable rows={ORG_RECENT_ACTIVITY} rowKey={row => row.id} density="compact" columns={[
              { key: 'date', header: 'Date' },
              { key: 'user', header: 'User' },
              { key: 'module', header: 'Module' },
              { key: 'feature', header: 'Feature' },
              { key: 'credits', header: 'Credits', align: 'right', cell: row => <span className="rounded-full bg-cyan-700 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">{row.credits.toFixed(2)}</span> },
            ]} />

            </TabsContent>
            <TabsContent value="transactions">
              <CreditTransactionHistory showSummary={false} showTitle={false} showToolbar={false} />
            </TabsContent>
          </Tabs>
        ) : <CreditTransactionHistory showSummary={false} />}
      </section>
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
  const [topUpTenant, setTopUpTenant] = useState<TenantCredit | null>(null);
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
  const creditTotals = tenants.reduce((totals, tenant) => {
    const allocated = MOCK_PLANS.find(plan => tenant.plan === `${plan.name} (${plan.interval})`)?.credits ?? 0;
    return {
      allocated: totals.allocated + allocated,
      used: totals.used + Math.max(0, allocated - tenant.balance),
    };
  }, { allocated: 0, used: 0 });
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleStatus(s: CreditStatus) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setPage(1);
  }

  const hasFilters = statusFilter.length > 0 || needsAttention || tenantStatusFilter !== 'all';

  if (role === 'org-admin') {
    const ownTenant = tenants.find(t => t.id === ORG_ADMIN_TENANT_ID);
    if (!ownTenant) return <p className="p-8 text-sm text-gray-600">No tenant is assigned to your account.</p>;
    return <TenantDetailView key={`org-${ownTenant.id}`} tenant={ownTenant} onStopAllocation={reason => {
      if (!ownTenant.allowOrgAdminStopAllocation || !ownTenant.plan || ownTenant.tenantStatus !== 'active' || ownTenant.allocationStatus !== 'active' || !reason.trim()) return;
      setTenants(previous => previous.map(t => t.id === ownTenant.id
        ? { ...t, allocationStatus: 'inactive', pausedNextAllocation: t.nextAllocation, nextAllocation: 'Paused', allocationStopReason: reason }
        : t));
      toast.success('Plan inactivated', { description: 'Future credit allocations have stopped. Your existing credits remain available.' });
    }} />;
  }

  if (isSiteAdmin && showCreate) return <TenantCreditsFormPage
    onClose={() => setShowCreate(false)}
    onSave={t => { setTenants(prev => [t, ...prev]); setPage(1); toast.success('Tenant created', { description: t.name + ' has been added.' }); }} />;
  if (editTenant) return <TenantCreditsFormPage tenant={editTenant}
    onClose={() => setEditTenant(null)}
    onSave={updated => { setTenants(prev => prev.map(t => t.id === updated.id ? updated : t)); setEditTenant(null); toast.success('Tenant updated', { description: updated.name + ' has been saved.' }); }} />;

  if (topUpTenant) return (
        <TopUpFormPage tenant={topUpTenant} onClose={() => setTopUpTenant(null)}
          onConfirm={(amount, reference) => {
            if (!Number.isFinite(amount) || amount <= 0 || !reference.trim() || topUpTenant.tenantStatus !== 'active') return;
            setTenants(previous => previous.map(tenant => {
              if (tenant.id !== topUpTenant.id) return tenant;
              const balance = tenant.balance + amount;
              const planCredits = MOCK_PLANS.find(plan => tenant.plan === `${plan.name} (${plan.interval})`)?.credits ?? 0;
              const percentage = planCredits > 0 ? balance / planCredits * 100 : Infinity;
              const creditStatus: CreditStatus = balance < 0 ? 'negative' : balance === 0 ? 'exhausted'
                : percentage <= (tenant.criticalThreshold ?? 10) ? 'critical'
                : percentage <= (tenant.lowThreshold ?? 20) ? 'low' : 'active';
              return { ...tenant, balance, creditStatus, topUpReference: reference };
            }));
            toast.success('Credits added', { description: `${amount.toLocaleString()} credits added to ${topUpTenant.name}.` });
            setTopUpTenant(null);
          }} />
  );


  if (detailTenant) {
    return <TenantDetailView tenant={detailTenant} onBack={() => setDetailTenant(null)} />;
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
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setShowCreate(true)}>Assign Tenant</Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatWidget label="Total Tenants" value={tenants.length} icon={Users} tone="blue" />
        <StatWidget label="Active Accounts" value={activeCount} icon={Activity} tone="green" />
        <StatWidget label="Total Allocated" value={creditTotals.allocated.toLocaleString()} icon={Layers} tone="blue" />
        <StatWidget label="Total Credits Used" value={creditTotals.used.toLocaleString()} icon={Zap} tone="amber"
          hint="Estimated from plan credits and balances" />
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
                <div className="flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    aria-label={`View credit details for ${r.name}`}
                    className="group inline-flex items-center gap-1 rounded text-left text-sm font-semibold text-[#1254C7] cursor-pointer hover:text-[#0E43A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1565F0] focus-visible:ring-offset-2"
                    onClick={() => setDetailTenant(r)}
                  >
                    <span className="underline decoration-[#93C5FD] underline-offset-4 group-hover:decoration-current">{r.name}</span>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0" />
                  </button>
                  <span
                    aria-label={`Account status: ${r.tenantStatus}`}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${r.tenantStatus === 'active' ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200' : 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200'}`}
                  >
                    <span aria-hidden="true" className={`size-1.5 rounded-full ${r.tenantStatus === 'active' ? 'bg-emerald-600' : 'bg-gray-400'}`} />
                    {r.tenantStatus === 'active' ? 'Active' : 'Suspended'}
                  </span>
                </div>
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
                const allocationInactive = r.allocationStatus === 'inactive';
                return (
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip content={suspended ? 'Unavailable for suspended tenants' : 'Top-up Credits'}>
                      <IconButton variant="table" tone="primary" size="sm" label="Top-up" disabled={suspended}
                        icon={<Plus className="size-4" />}
                        onClick={() => setTopUpTenant(r)} />
                    </Tooltip>
                    <Tooltip content={suspended ? 'Edit unavailable for suspended tenants' : 'Edit/change plan'}>
                      <IconButton variant="table" tone="primary" size="sm" label="Edit/change plan" disabled={suspended}
                        icon={<Pencil className="size-4" />}
                        onClick={() => setEditTenant(r)} />
                    </Tooltip>
                    <Tooltip content={allocationInactive ? 'Activate Allocation' : 'Deactivate Allocation'}>
                      <IconButton variant="table" tone={allocationInactive ? 'success' : 'danger'} size="sm"
                        label={allocationInactive ? 'Activate Allocation' : 'Deactivate Allocation'}
                        icon={allocationInactive ? <Power className="size-4" /> : <Ban className="size-4" />}
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
      {/* Activate / Deactivate confirmation */}
      {confirmToggleTenant && (() => {
        const isInactive = confirmToggleTenant.allocationStatus === 'inactive';
        return (
          <Modal
            open
            onOpenChange={(v) => { if (!v) setConfirmToggleTenant(null); }}
            title={isInactive ? 'Activate Credit Allocation?' : 'Deactivate Credit Allocation?'}
            size="sm"
            tone={isInactive ? undefined : 'warning'}
            footer={
              <div className="flex w-full items-center justify-between">
                <Button variant="secondary" onClick={() => setConfirmToggleTenant(null)}>Cancel</Button>
                <Button
                  variant={isInactive ? undefined : 'danger'}
                  onClick={() => {
                    const newStatus = isInactive ? 'active' : 'inactive';
                    setTenants(prev => prev.map(t => t.id === confirmToggleTenant.id ? { ...t, allocationStatus: newStatus,
                      pausedNextAllocation: isInactive ? undefined : t.nextAllocation,
                      nextAllocation: isInactive ? (t.pausedNextAllocation ?? (t.plan ? (t.plan.includes('(Yearly)') ? '01 Oct 2027' : '01 Nov 2026') : undefined)) : 'Paused'
                    } : t));
                    setConfirmToggleTenant(null);
                    if (isInactive) {
                      toast.success('Credit allocation activated', { description: `Future credit allocations for ${confirmToggleTenant.name} will resume.` });
                    } else {
                      toast.success('Credit allocation deactivated', { description: `Future allocations for ${confirmToggleTenant.name} are paused. Existing credits remain available.` });
                    }
                  }}
                >
                  {isInactive ? 'Activate' : 'Deactivate'}
                </Button>
              </div>
            }
          >
            <p className="text-sm text-[#374151]">
              {isInactive
                ? <>Are you sure you want to resume credit allocation for <strong>{confirmToggleTenant.name}</strong>?</>
                : <>Are you sure you want to stop credit allocation for <strong>{confirmToggleTenant.name}</strong>? Future allocations will pause. Existing credits remain available.</>}
            </p>
          </Modal>
        );
      })()}
    </div>
  );
}
