import { useState } from 'react';
import { Download, RotateCcw, AlertTriangle } from 'lucide-react';
import {
  Button, DataTable, Pagination, Modal, FormField, SearchBar, Tooltip, PageHeader,
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

  const isUpgrade = selected && tenant.balance > 0;
  const creditsImpact = selected
    ? (isUpgrade ? selected.credits - (MOCK_PLANS.find(p => tenant.plan?.startsWith(p.name))?.credits ?? 0) : 0)
    : 0;

  if (confirmed && selected) {
    return (
      <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Confirm Plan Change"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmed(false)}>Back</Button>
            <Button onClick={onClose}>Confirm</Button>
          </div>
        }>
        <div className="rounded-xl bg-[#F9FAFB] p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-[#6B7280]">Tenant</span><span className="font-medium">{tenant.name}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Current Plan</span><span>{tenant.plan ?? '—'}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">New Plan</span><span className="font-semibold text-[#1565F0]">{selected.name} ({selected.interval})</span></div>
          {creditsImpact > 0 && (
            <div className="flex justify-between"><span className="text-[#6B7280]">Credits Added Now</span><span className="font-semibold text-green-700">+{creditsImpact.toLocaleString()}</span></div>
          )}
          <div className="flex justify-between"><span className="text-[#6B7280]">Balance After</span><span className="font-semibold">{(tenant.balance + creditsImpact).toLocaleString()}</span></div>
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
        <div className="rounded-xl bg-[#EBF3FF] p-3 text-sm">
          <span className="text-[#6B7280]">Tenant: </span>
          <span className="font-semibold text-[#111827]">{tenant.name}</span>
          {tenant.plan && <><span className="mx-2 text-[#D1D5DB]">|</span><span className="text-[#6B7280]">Current Plan: </span><span className="font-medium">{tenant.plan}</span></>}
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
                    {selected?.id === p.id && <span className="size-4 rounded-full bg-[#1565F0] flex items-center justify-center"><span className="size-2 rounded-full bg-white" /></span>}
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
      <Modal open onOpenChange={(v) => { if (!v) onClose(); }} title="Confirm Top-up"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmed(false)}>Back</Button>
            <Button onClick={onClose}>Add Credits</Button>
          </div>
        }>
        <div className="rounded-xl bg-[#F9FAFB] p-4 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-[#6B7280]">Tenant</span><span className="font-medium">{tenant.name}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Current Balance</span><span>{tenant.balance.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[#6B7280]">Top-up Amount</span><span className="font-semibold text-green-700">+{amount.toLocaleString()}</span></div>
          <div className="h-px bg-[#E5E7EB]" />
          <div className="flex justify-between"><span className="font-semibold text-[#111827]">Balance After Top-up</span><span className="font-bold text-[#1565F0] text-base">{newBalance.toLocaleString()}</span></div>
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
        <div className="rounded-xl bg-[#EBF3FF] p-3 text-sm flex items-center justify-between">
          <div><span className="text-[#6B7280]">Tenant: </span><span className="font-semibold">{tenant.name}</span></div>
          <div><span className="text-[#6B7280]">Current Balance: </span><span className="font-semibold text-[#111827]">{tenant.balance.toLocaleString()}</span></div>
        </div>
        <FormField label="Credits to Add" required hint="Must be a positive number">
          {({ id }) => (
            <input id={id} type="number" min={1}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={credits} onChange={e => setCredits(e.target.value)} placeholder="e.g. 1000" />
          )}
        </FormField>
        {amount > 0 && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-green-700">Resulting Balance</span>
            <span className="font-bold text-green-800 text-base">{newBalance.toLocaleString()} credits</span>
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

// ── Main Page ──────────────────────────────────────────────────────────────────
const ALL_STATUSES: CreditStatus[] = ['active', 'low', 'critical', 'exhausted', 'negative'];
const STATUS_LABELS: Record<CreditStatus, string> = {
  active: 'Active', low: 'Low', critical: 'Critical', exhausted: 'Exhausted', negative: 'Negative',
};

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
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleStatus(s: CreditStatus) {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <div className="px-8 py-6">
      <PageHeader
        title="AI Credit Management"
        actions={
          <Button variant="secondary" leftIcon={<Download className="size-4" />}>Export CSV</Button>
        }
      />

      {/* Summary chips */}
      <div className="mt-4 flex gap-3">
        {[
          { label: 'Total Tenants', value: tenants.length, color: 'text-[#1565F0] bg-[#EBF3FF]' },
          { label: 'Needs Attention', value: needsCount, color: 'text-red-700 bg-red-50' },
          { label: 'Suspended', value: tenants.filter(t => t.tenantStatus === 'suspended').length, color: 'text-gray-600 bg-gray-100' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${s.color}`}>
            <span className="text-xl font-bold">{s.value}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tenant…" className="w-64" />
        <div className="flex gap-2">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => toggleStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${statusFilter.includes(s) ? 'border-[#1565F0] bg-[#EBF3FF] text-[#1254C7]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#93C5FD]'}`}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'suspended'] as const).map(s => (
            <button key={s} onClick={() => setTenantStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium border capitalize transition-all ${tenantStatusFilter === s ? 'border-[#1565F0] bg-[#EBF3FF] text-[#1254C7]' : 'border-[#E5E7EB] text-[#6B7280] hover:border-[#93C5FD]'}`}>
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setNeedsAttention(n => !n)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${needsAttention ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-[#E5E7EB] text-[#6B7280] hover:border-orange-300'}`}>
          <AlertTriangle className="size-3" />
          Needs Attention
        </button>
        {(statusFilter.length > 0 || needsAttention || tenantStatusFilter !== 'active') && (
          <button onClick={() => { setStatusFilter([]); setNeedsAttention(false); setTenantStatusFilter('active'); }}
            className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#374151]">
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="mt-5">
        <DataTable
          rows={paginated}
          rowKey={r => r.id}
          columns={[
            { key: 'name', header: 'Tenant', cell: r => (
              <div>
                <p className="font-semibold text-[#111827] text-sm">{r.name}</p>
                <p className={`text-xs mt-0.5 ${r.tenantStatus === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                  {r.tenantStatus === 'active' ? 'Active' : 'Suspended'}
                </p>
              </div>
            )},
            { key: 'plan', header: 'Plan', cell: r => r.plan
              ? <span className="text-sm text-[#374151]">{r.plan}</span>
              : <span className="text-xs text-[#9CA3AF]">—</span>
            },
            { key: 'nextAllocation', header: 'Next Allocation', cell: r => (
              <span className={`text-sm ${r.nextAllocation === 'Paused' ? 'text-amber-600 font-medium' : 'text-[#374151]'}`}>
                {r.nextAllocation ?? '—'}
              </span>
            )},
            { key: 'balance', header: 'Available Balance', align: 'right', cell: r => (
              <span className={`font-semibold text-sm ${r.balance < 0 ? 'text-red-700' : r.balance === 0 ? 'text-red-500' : 'text-[#111827]'}`}>
                {r.balance < 0 ? r.balance.toLocaleString() : r.balance.toLocaleString()}
              </span>
            )},
            { key: 'creditStatus', header: 'Credit Status', cell: r => <CreditStatusBadge status={r.creditStatus} /> },
            { key: 'allocationStatus', header: 'Allocation', cell: r => (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.allocationStatus === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {r.allocationStatus === 'active' ? 'Active' : 'Inactive'}
              </span>
            )},
            { key: 'actions' as keyof TenantCredit, header: '', cell: r => {
              const suspended = r.tenantStatus === 'suspended';
              return (
                <div className="flex gap-1 justify-end">
                  <Tooltip content="View monitoring dashboard">
                    <Button variant="ghost" size="sm" onClick={() => setMonitorTenant(r)}>Dashboard</Button>
                  </Tooltip>
                  <Tooltip content={suspended ? 'Unavailable for suspended tenants' : 'Change plan'}>
                    <Button variant="soft" size="sm" disabled={suspended} onClick={() => setChangePlanTenant(r)}>Change Plan</Button>
                  </Tooltip>
                  <Tooltip content={suspended ? 'Unavailable for suspended tenants' : 'Add credits'}>
                    <Button variant="accent" size="sm" disabled={suspended} onClick={() => setTopUpTenant(r)}>Top-up</Button>
                  </Tooltip>
                  <Button variant="ghost" size="sm" onClick={() => setHistoryTenant(r)}>History</Button>
                </div>
              );
            }},
          ]}
          footer={<Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} itemLabel="tenants" />}
        />
      </div>

      {changePlanTenant && <ChangePlanModal tenant={changePlanTenant} onClose={() => setChangePlanTenant(null)} />}
      {topUpTenant && <TopUpModal tenant={topUpTenant} onClose={() => setTopUpTenant(null)} />}
      {historyTenant && (
        <Modal open onOpenChange={(v) => { if (!v) setHistoryTenant(null); }} title={`Transaction History — ${historyTenant.name}`}>
          <CreditTransactionHistory tenantName={historyTenant.name} />
        </Modal>
      )}
      {monitorTenant && (
        <Modal open onOpenChange={(v) => { if (!v) setMonitorTenant(null); }} title={`Credit Dashboard — ${monitorTenant.name}`}>
          <CreditMonitoringContent tenant={monitorTenant} />
        </Modal>
      )}
    </div>
  );
}
