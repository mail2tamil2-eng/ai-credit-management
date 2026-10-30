import { useState } from 'react';
import { CreditFormPage } from '../components/CreditFormPage';
import { Plus, BookOpen, Users, CheckCircle2, ArchiveX, Pencil, Trash2, Ban, Power, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, DataTable, Pagination, Modal, FormField, TextInput, TextArea, SelectInput,
  PageHeader, StatWidget, SearchBar, IconButton, Tooltip,
} from '../components/saas';
import type { Plan, PlanInterval } from './creditTypes';
import { MOCK_PLANS } from './creditTypes';

const INTERVALS: PlanInterval[] = ['Monthly', 'Yearly'];

// ── Plan Create / Edit Page ───────────────────────────────────────────────────
function PlanFormPage({ onClose, initial, plans }: {
  onClose: (saved?: Plan) => void;
  initial?: Plan;
  plans: Plan[];
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [interval, setInterval] = useState<PlanInterval>(initial?.interval ?? 'Monthly');
  const [credits, setCredits] = useState(String(initial?.credits ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [confirmCredits, setConfirmCredits] = useState(false);
  const creditsNum = Number(credits);
  const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const duplicateName = !!name.trim() && plans.some(plan =>
    plan.id !== initial?.id && normalizeName(plan.name) === normalizeName(name));
  const valid = !!name.trim() && !duplicateName && Number.isFinite(creditsNum) && creditsNum > 0;

  function handleSave() {
    if (!valid) return;
    if (initial && creditsNum !== initial.credits && !confirmCredits) {
      setConfirmCredits(true);
      return;
    }
    onClose({
      id: initial?.id ?? `p${Date.now()}`,
      name: name.trim(),
      interval,
      credits: creditsNum,
      description: description.trim() || undefined,
      status: initial?.status ?? 'active',
      assignedTenants: initial?.assignedTenants ?? 0,
    });
  }

  const confirmation = initial && (
    <Modal open={confirmCredits} onOpenChange={setConfirmCredits} size="md" tone="warning"
      title="Confirm Credit Change"
      footer={<div className="flex w-full items-center justify-between">
        <Button variant="secondary" onClick={() => setConfirmCredits(false)}>Cancel</Button>
        <Button onClick={handleSave} disabled={!valid}>Confirm Changes</Button>
      </div>}>
      <div className="space-y-4">
        <p className="text-sm text-[#374151]">
          This plan is used by <strong>{initial.assignedTenants} tenants</strong>. The change applies from their next allocation.
        </p>
        <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] px-4 py-3 text-sm">
          <span className="font-medium text-[#374151]">Credits</span>
          <span className="font-semibold tabular-nums text-[#111827]">{initial.credits.toLocaleString()} → {creditsNum.toLocaleString()}</span>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
    <CreditFormPage
      onBack={() => onClose()}
      backLabel="Back to Plan Management"
      onSubmit={handleSave}
      title={initial ? `Edit Plan — ${initial.name}` : 'Create New Plan'}
      description="Configure the plan allocation, credits and description."
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onClose()}>Cancel</Button>
          <Button onClick={handleSave} disabled={!valid}>
            {initial ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      }
    >
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <FormField label="Plan Name" required hint="Must be unique across all plans"
          error={duplicateName ? 'A plan with this name already exists. Enter a different name.' : undefined}>
          {({ id, describedBy, invalid }) => (
            <TextInput id={id} aria-describedby={describedBy} invalid={invalid}
              value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Growth" />
          )}
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Allocation" required>
            {({ id }) => (
              <SelectInput id={id} value={interval}
                onChange={e => setInterval(e.target.value as PlanInterval)}
                options={INTERVALS.map(i => ({ value: i, label: i }))} />
            )}
          </FormField>
          <FormField label="Credits" required hint="Allocated each period">
            {({ id, describedBy, invalid }) => (
              <TextInput id={id} aria-describedby={describedBy} invalid={invalid}
                type="number" min={1} value={credits}
                onChange={e => setCredits(e.target.value)} placeholder="e.g. 5000" />
            )}
          </FormField>
        </div>

        {credits && creditsNum > 0 && (
          <div className="lg:col-span-2 rounded-xl bg-[#EBF3FF] px-4 py-2.5 text-sm flex items-center justify-between">
            <span className="text-[#6B7280]">Credits per {interval.toLowerCase()}</span>
            <span className="font-bold text-[#1565F0] text-base">{creditsNum.toLocaleString()}</span>
          </div>
        )}

        <FormField label="Description" className="lg:col-span-2">
          {({ id }) => (
            <TextArea id={id} rows={2} value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Short description (optional)" />
          )}
        </FormField>
      </div>
    </CreditFormPage>
    {confirmation}
    </>
  );
}

// ── Delete Blocked Modal ───────────────────────────────────────────────────────
function DeleteBlockedModal({ open, onClose, onDeactivate, plan }: {
  open: boolean;
  onClose: () => void;
  onDeactivate: () => void;
  plan: Plan | null;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
      title="Cannot Delete Plan" size="sm" tone="warning"
      footer={<div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {plan?.status === 'active' && <Button variant="secondary" onClick={onDeactivate}>Deactivate Instead</Button>}
      </div>}>
      <div className="space-y-3 text-sm text-[#374151]">
        <p>
          <strong>{plan?.name}</strong> is assigned to{' '}
          <strong>{plan?.assignedTenants} tenant{plan?.assignedTenants !== 1 ? 's' : ''}</strong>.
          Plans with active assignments cannot be deleted.
        </p>
        <p className="text-[#6B7280]">
          Deactivate the plan to prevent new sign-ups while keeping existing tenants unaffected.
        </p>
      </div>
    </Modal>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
function ConfirmDeleteModal({ open, onClose, onConfirm, plan }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  plan: Plan | null;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }}
      title="Delete Plan?" size="sm" tone="danger"
      footer={<div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Delete Plan</Button>
      </div>}>
      <p className="text-sm text-[#374151]">
        Are you sure you want to permanently delete <strong>{plan?.name}</strong>?
        This action cannot be undone.
      </p>
    </Modal>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PlanManagementPage() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [deleteBlockedPlan, setDeleteBlockedPlan] = useState<Plan | null>(null);
  const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
  const [togglePlan, setTogglePlan] = useState<Plan | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalTenants = plans.reduce((s, p) => s + p.assignedTenants, 0);
  const activePlans = plans.filter(p => p.status === 'active');
  const inactivePlans = plans.filter(p => p.status === 'inactive');

  const filtered = plans.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = statusFilter !== 'all' || search.trim() !== '';

  function handleCreate(saved?: Plan) {
    if (saved) {
      setPlans(p => [saved, ...p]);
      toast.success('Plan created', { description: `${saved.name} has been created.` });
    }
    setCreateOpen(false);
  }

  function handleEdit(saved?: Plan) {
    if (saved) {
      setPlans(p => p.map(x => x.id === saved.id ? saved : x));
      toast.success('Plan updated', { description: `${saved.name} has been updated.` });
    }
    setEditTarget(null);
  }

  function handleToggle(plan: Plan) {
    setPlans(p => p.map(x => x.id === plan.id
      ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' }
      : x));
    setTogglePlan(null);
    if (plan.status === 'active') {
      toast.success('Plan deactivated', { description: `${plan.name} is no longer available for new assignments.` });
    } else {
      toast.success('Plan activated', { description: `${plan.name} is now available for assignments.` });
    }
  }

  function handleDeleteClick(plan: Plan) {
    if (plan.assignedTenants > 0) { setDeleteBlockedPlan(plan); return; }
    setDeletePlan(plan);
  }

  function handleDeleteConfirm() {
    if (deletePlan) {
      setPlans(p => p.filter(x => x.id !== deletePlan.id));
      toast.success('Plan deleted', { description: `${deletePlan.name} has been deleted.` });
    }
    setDeletePlan(null);
  }

  if (createOpen) return <PlanFormPage onClose={handleCreate} plans={plans} />;
  if (editTarget) return <PlanFormPage onClose={handleEdit} initial={editTarget} plans={plans} />;

  return (
    <div className="px-8 py-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Plan Management"
        actions={
          <Button leftIcon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
            Create Plan
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatWidget label="Total Plans" value={plans.length} icon={BookOpen} tone="blue" />
        <StatWidget label="Active Plans" value={activePlans.length} icon={CheckCircle2} tone="green"
          hint={`${inactivePlans.length} inactive`} />
        <StatWidget label="Tenants Enrolled" value={totalTenants} icon={Users} tone="violet"
          hint="Across all active plans" />
        <StatWidget label="Inactive / Legacy" value={inactivePlans.length} icon={ArchiveX} tone="amber"
          hint={inactivePlans.length > 0 ? 'Consider removing' : 'None'} />
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5">

        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Search plans…"
          className="w-52 [&_input]:!h-9 [&_input]:!rounded-lg [&_input]:!border-gray-200 [&_input:hover]:!border-gray-300"
        />

        <div className="h-5 w-px bg-gray-200 shrink-0" />

        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all',
                statusFilter === s
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {s === 'all' ? 'All' : s === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {hasFilters && (
            <button
              onClick={() => { setStatusFilter('all'); setSearch(''); setPage(1); }}
              className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="size-3" />
              Clear all
            </button>
          )}
          <span className="text-xs text-gray-400 tabular-nums">
            {filtered.length} of {plans.length} plans
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
              key: 'name', header: 'Plan',
              cell: r => (
                <div>
                  <p className="font-semibold text-[#111827] text-sm">{r.name}</p>
                  {r.description && <p className="text-xs text-[#6B7280] mt-0.5">{r.description}</p>}
                </div>
              ),
            },
            {
              key: 'interval', header: 'Allocation Interval',
              cell: r => (
                <span className="rounded-full bg-[#EBF3FF] px-2.5 py-1 text-xs font-semibold text-[#1254C7]">
                  {r.interval}
                </span>
              ),
            },
            {
              key: 'credits', header: 'Credits', align: 'right',
              cell: r => (
                <div className="text-right">
                  <p className="font-bold text-[#111827] text-sm tabular-nums">{r.credits.toLocaleString()}</p>
                  <p className="text-[10px] text-[#9CA3AF]">per {r.interval.toLowerCase()}</p>
                </div>
              ),
            },
            {
              key: 'assignedTenants', header: 'Assigned Tenants', align: 'right',
              cell: r => (
                <div className="flex items-center justify-end gap-1.5">
                  {r.assignedTenants > 0
                    ? <span className="rounded-full bg-[#EBF3FF] px-2.5 py-0.5 text-xs font-semibold text-[#1254C7]">{r.assignedTenants} tenant{r.assignedTenants !== 1 ? 's' : ''}</span>
                    : <span className="text-xs text-[#9CA3AF]">None</span>}
                </div>
              ),
            },
            {
              key: 'status', header: 'Status',
              cell: r => (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`size-1.5 rounded-full ${r.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {r.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              ),
            },
            {
              key: 'actions' as keyof Plan, header: '', align: 'right',
              cell: r => (
                <div className="flex items-center justify-end gap-0.5">
                  <Tooltip content="Edit">
                    <IconButton variant="table" tone="primary" size="sm" label="Edit"
                      icon={<Pencil className="size-4" />}
                      onClick={() => setEditTarget(r)} />
                  </Tooltip>
                  <Tooltip content={r.status === 'active' ? 'Deactivate' : 'Activate'}>
                    <IconButton variant="table" tone={r.status === 'active' ? 'danger' : 'success'} size="sm"
                      label={r.status === 'active' ? 'Deactivate' : 'Activate'}
                      icon={r.status === 'active' ? <Ban className="size-4" /> : <Power className="size-4" />}
                      onClick={() => setTogglePlan(r)} />
                  </Tooltip>
                  <Tooltip content="Delete">
                    <IconButton variant="table" tone="danger" size="sm" label="Delete"
                      icon={<Trash2 className="size-4" />}
                      onClick={() => handleDeleteClick(r)} />
                  </Tooltip>
                </div>
              ),
            },
          ]}
          footer={
            <Pagination page={page} pageSize={pageSize} total={filtered.length}
              onPageChange={setPage} itemLabel="plans" />
          }
        />
      </div>

      {/* Modals */}
      {togglePlan && (
        <Modal open onOpenChange={open => { if (!open) setTogglePlan(null); }}
          title={togglePlan.status === 'active' ? 'Deactivate Plan?' : 'Activate Plan?'}
          size="sm" tone={togglePlan.status === 'active' ? 'warning' : undefined}
          footer={
            <div className="flex w-full items-center justify-between">
              <Button variant="secondary" onClick={() => setTogglePlan(null)}>Cancel</Button>
              <Button variant={togglePlan.status === 'active' ? 'danger' : 'primary'} onClick={() => handleToggle(togglePlan)}>
                {togglePlan.status === 'active' ? 'Deactivate Plan' : 'Activate Plan'}
              </Button>
            </div>
          }>
          <p className="text-sm text-[#374151]">
            {togglePlan.status === 'active'
              ? <>Deactivate <strong>{togglePlan.name}</strong>? It will no longer be available for new assignments. Existing tenants will keep their plan.</>
              : <>Activate <strong>{togglePlan.name}</strong>? It will become available for tenant assignments.</>}
          </p>
        </Modal>
      )}
      <DeleteBlockedModal open={!!deleteBlockedPlan} onClose={() => setDeleteBlockedPlan(null)}
        onDeactivate={() => { setTogglePlan(deleteBlockedPlan); setDeleteBlockedPlan(null); }} plan={deleteBlockedPlan} />
      <ConfirmDeleteModal open={!!deletePlan} onClose={() => setDeletePlan(null)} onConfirm={handleDeleteConfirm} plan={deletePlan} />
    </div>
  );
}
