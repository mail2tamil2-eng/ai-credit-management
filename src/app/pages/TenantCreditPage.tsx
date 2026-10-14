import { useState } from 'react';
import { Download, AlertTriangle, Users, ShieldOff, Activity, MoreHorizontal, ChevronDown, X } from 'lucide-react';
import {
  Button, DataTable, Pagination, Modal, FormField, SearchBar,
  Tooltip, PageHeader, StatWidget, DropdownMenu, IconButton,
} from '../components/saas';
import { CreditStatusBadge } from '../components/CreditStatusBadge';
import type { TenantCredit, CreditStatus, Plan } from './creditTypes';
import { MOCK_TENANTS, MOCK_PLANS } from './creditTypes';
import CreditTransactionHistory from './CreditTransactionHistory';
import { CreditMonitoringContent } from './CreditMonitoringPage';

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

// ── Credit status labels ───────────────────────────────────────────────────────
const ALL_STATUSES: CreditStatus[] = ['active', 'low', 'critical', 'exhausted', 'negative'];
const STATUS_LABELS: Record<CreditStatus, string> = {
  active: 'Healthy', low: 'Low', critical: 'Critical', exhausted: 'Exhausted', negative: 'Negative',
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TenantCreditPage() {
  const [tenants] = useState<TenantCredit[]>(MOCK_TENANTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CreditStatus[]>([]);
  const [needsAttention, setNeedsAttention] = useState(false);
  const [tenantStatusFilter, setTenantStatusFilter] = useState<'all' | 'active' | 'suspended'>('active');
  const [page, setPage] = useState(1);
  const [changePlanTenant, setChangePlanTenant] = useState<TenantCredit | null>(null);
  const [topUpTenant, setTopUpTenant] = useState<TenantCredit | null>(null);
  const [historyTenant, setHistoryTenant] = useState<TenantCredit | null>(null);
  const [monitorTenant, setMonitorTenant] = useState<TenantCredit | null>(null);
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

  const hasFilters = statusFilter.length > 0 || needsAttention || tenantStatusFilter !== 'active';

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Credit Management"
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>Export CSV</Button>
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
                <div>
                  <p className="font-semibold text-[#111827] text-sm">{r.name}</p>
                  <p className={`text-xs mt-0.5 ${r.tenantStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {r.tenantStatus === 'active' ? 'Active account' : 'Suspended'}
                  </p>
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
              key: 'allocationStatus', header: 'Allocation',
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
                return (
                  <div className="flex items-center justify-end gap-1.5">
                    <Tooltip content={suspended ? 'Unavailable for suspended tenants' : 'Add credits to this tenant'}>
                      <Button variant="accent" size="sm" disabled={suspended}
                        onClick={() => setTopUpTenant(r)}>
                        Top-up
                      </Button>
                    </Tooltip>
                    <DropdownMenu
                      align="end"
                      trigger={
                        <IconButton variant="ghost" size="sm" label="More actions"
                          icon={<MoreHorizontal className="size-4" />} />
                      }
                      items={[
                        { type: 'label', label: 'Actions' },
                        { label: 'Change Plan', disabled: suspended, onSelect: () => setChangePlanTenant(r) },
                        { label: 'View Dashboard', onSelect: () => setMonitorTenant(r) },
                        { label: 'Transaction History', onSelect: () => setHistoryTenant(r) },
                      ]}
                    />
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
      {changePlanTenant && (
        <ChangePlanModal tenant={changePlanTenant} onClose={() => setChangePlanTenant(null)} />
      )}
      {topUpTenant && (
        <TopUpModal tenant={topUpTenant} onClose={() => setTopUpTenant(null)} />
      )}
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
