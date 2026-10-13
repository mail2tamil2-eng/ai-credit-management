import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button, DataTable, Pagination } from '../components/saas';
import { MOCK_TRANSACTIONS, MOCK_ACTIONS } from './creditTypes';
import type { Transaction, ActionRecord } from './creditTypes';

function TransactionTypeChip({ type }: { type: Transaction['type'] }) {
  const styles: Record<string, string> = {
    'Plan Allocation': 'bg-blue-50 text-blue-700',
    'Top-up': 'bg-green-50 text-green-700',
    'Usage': 'bg-gray-100 text-gray-600',
    'Reversal': 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

function TransactionTab() {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const rows = MOCK_TRANSACTIONS.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" leftIcon={<Download className="size-3.5" />}>Export CSV</Button>
      </div>
      <DataTable
        rows={rows}
        rowKey={r => r.id}
        columns={[
          { key: 'id', header: 'ID', cell: r => <span className="font-mono text-xs text-[#6B7280]">{r.id}</span> },
          { key: 'date', header: 'Date & Time', cell: r => <span className="text-sm">{r.date}</span> },
          { key: 'type', header: 'Type', cell: r => <TransactionTypeChip type={r.type} /> },
          { key: 'description', header: 'Description' },
          { key: 'credits', header: 'Credits', align: 'right', cell: r => (
            <span className={`font-semibold text-sm ${r.credits > 0 ? 'text-green-700' : 'text-red-600'}`}>
              {r.credits > 0 ? `+${r.credits.toLocaleString()}` : r.credits.toLocaleString()}
            </span>
          )},
          { key: 'balanceAfter', header: 'Balance After', align: 'right', cell: r => (
            <span className="text-sm font-medium text-[#111827]">{r.balanceAfter.toLocaleString()}</span>
          )},
          { key: 'performedBy', header: 'By' },
        ]}
        footer={<Pagination page={page} pageSize={pageSize} total={MOCK_TRANSACTIONS.length} onPageChange={setPage} itemLabel="transactions" />}
      />
    </div>
  );
}

function ActionTab() {
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const rows = MOCK_ACTIONS.slice((page - 1) * pageSize, page * pageSize);

  return (
    <DataTable
      rows={rows}
      rowKey={r => r.id}
      columns={[
        { key: 'date', header: 'Date & Time', cell: r => <span className="text-sm">{r.date}</span> },
        { key: 'action', header: 'Action', cell: r => <span className="font-medium text-sm text-[#111827]">{r.action}</span> },
        { key: 'oldValue', header: 'Old Value', cell: r => <span className="text-sm text-[#6B7280]">{r.oldValue}</span> },
        { key: 'newValue', header: 'New Value', cell: r => <span className="text-sm text-[#374151]">{r.newValue}</span> },
        { key: 'performedBy', header: 'By' },
        { key: 'reason', header: 'Reason / Remarks', cell: r => <span className="text-sm text-[#6B7280]">{r.reason ?? '—'}</span> },
      ]}
      footer={<Pagination page={page} pageSize={pageSize} total={MOCK_ACTIONS.length} onPageChange={setPage} itemLabel="actions" />}
    />
  );
}

export default function CreditTransactionHistory({ tenantName }: { tenantName?: string }) {
  const [tab, setTab] = useState<'transactions' | 'actions'>('transactions');

  return (
    <div className="space-y-4">
      {tenantName && (
        <p className="text-sm text-[#6B7280]">Showing history for <span className="font-semibold text-[#111827]">{tenantName}</span></p>
      )}
      <div className="flex gap-1 rounded-xl bg-[#F3F4F6] p-1 w-fit">
        {(['transactions', 'actions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'}`}>
            {t === 'transactions' ? 'Transaction History' : 'Action History'}
          </button>
        ))}
      </div>
      {tab === 'transactions' ? <TransactionTab /> : <ActionTab />}
    </div>
  );
}
