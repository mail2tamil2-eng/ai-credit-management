import { useState } from 'react';
import { Plus, Pencil, Trash2, PowerOff, Power } from 'lucide-react';
import { Button, DataTable, Pagination, Modal, FormField, PageHeader } from '../components/saas';
import type { Plan, PlanInterval } from './creditTypes';
import { MOCK_PLANS } from './creditTypes';

const INTERVALS: PlanInterval[] = ['Monthly', 'Yearly'];

function PlanModal({
  open, onClose, initial,
}: {
  open: boolean;
  onClose: (saved?: Plan) => void;
  initial?: Plan;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [interval, setInterval] = useState<PlanInterval>(initial?.interval ?? 'Monthly');
  const [credits, setCredits] = useState(String(initial?.credits ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');

  function handleSave() {
    if (!name.trim() || !credits || Number(credits) <= 0) return;
    onClose({
      id: initial?.id ?? `p${Date.now()}`,
      name: name.trim(),
      interval,
      credits: Number(credits),
      description,
      status: initial?.status ?? 'active',
      assignedTenants: initial?.assignedTenants ?? 0,
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      title={initial ? 'Edit Plan' : 'Create Plan'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onClose()}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !credits || Number(credits) <= 0}>
            {initial ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Plan Name" required hint="Must be unique">
          {({ id }) => (
            <input id={id}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Growth"
            />
          )}
        </FormField>
        <FormField label="Allocation Interval" required>
          {({ id }) => (
            <select id={id}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={interval}
              onChange={e => setInterval(e.target.value as PlanInterval)}
            >
              {INTERVALS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          )}
        </FormField>
        <FormField label="Credits" required hint="Credits allocated per interval">
          {({ id }) => (
            <input id={id}
              type="number"
              min={1}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0]"
              value={credits}
              onChange={e => setCredits(e.target.value)}
              placeholder="e.g. 5000"
            />
          )}
        </FormField>
        <FormField label="Description">
          {({ id }) => (
            <textarea id={id}
              rows={2}
              className="w-full rounded-lg border border-[#6B7280] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565F0] resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          )}
        </FormField>
      </div>
    </Modal>
  );
}

function DeleteBlockedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) onClose(); }} title="Cannot Delete Plan"
      footer={<div className="flex justify-end"><Button onClick={onClose}>OK</Button></div>}>
      <p className="text-sm text-[#374151]">
        This plan is assigned to tenants and cannot be deleted. Deactivate it instead.
      </p>
    </Modal>
  );
}

export default function PlanManagementPage() {
  const [plans, setPlans] = useState<Plan[]>(MOCK_PLANS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  function handleCreate(saved?: Plan) {
    if (saved) setPlans(p => [saved, ...p]);
    setCreateOpen(false);
  }

  function handleEdit(saved?: Plan) {
    if (saved) setPlans(p => p.map(x => x.id === saved.id ? saved : x));
    setEditTarget(null);
  }

  function handleToggle(plan: Plan) {
    setPlans(p => p.map(x => x.id === plan.id ? { ...x, status: x.status === 'active' ? 'inactive' : 'active' } : x));
  }

  function handleDelete(plan: Plan) {
    if (plan.assignedTenants > 0) { setDeleteBlocked(true); return; }
    setPlans(p => p.filter(x => x.id !== plan.id));
  }

  const paginated = plans.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="px-8 py-6">
      <PageHeader
        title="Plan Management"
        actions={<Button leftIcon={<Plus />} onClick={() => setCreateOpen(true)}>Create Plan</Button>}
      />

      <div className="mt-6">
        <DataTable
          rows={paginated}
          rowKey={r => r.id}
          columns={[
            { key: 'name', header: 'Plan Name' },
            { key: 'interval', header: 'Interval', cell: r => (
              <span className="rounded-full bg-[#EBF3FF] px-2.5 py-0.5 text-xs font-medium text-[#1254C7]">{r.interval}</span>
            )},
            { key: 'credits', header: 'Credits / Interval', align: 'right', cell: r => (
              <span className="font-semibold text-[#111827]">{r.credits.toLocaleString()}</span>
            )},
            { key: 'assignedTenants', header: 'Tenants', align: 'right' },
            { key: 'status', header: 'Status', cell: r => (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                <span className={`size-1.5 rounded-full ${r.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                {r.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            )},
            { key: 'actions' as keyof Plan, header: '', align: 'right', cell: r => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" leftIcon={<Pencil className="size-3.5" />} onClick={() => setEditTarget(r)}>Edit</Button>
                <Button variant="ghost" size="sm" leftIcon={r.status === 'active' ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                  onClick={() => handleToggle(r)}>
                  {r.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="sm" leftIcon={<Trash2 className="size-3.5 text-red-500" />}
                  className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(r)}>
                  Delete
                </Button>
              </div>
            )},
          ]}
          footer={<Pagination page={page} pageSize={pageSize} total={plans.length} onPageChange={setPage} itemLabel="plans" />}
        />
      </div>

      <PlanModal open={createOpen} onClose={handleCreate} />
      {editTarget && <PlanModal open onClose={handleEdit} initial={editTarget} />}
      <DeleteBlockedModal open={deleteBlocked} onClose={() => setDeleteBlocked(false)} />
    </div>
  );
}
