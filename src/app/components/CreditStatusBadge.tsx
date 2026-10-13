import type { CreditStatus } from '../pages/creditTypes';

const configs: Record<CreditStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:    { label: 'Active',      bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
  low:       { label: 'Low Credit',  bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  critical:  { label: 'Critical',    bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  exhausted: { label: 'Exhausted',   bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
  negative:  { label: 'Negative',    bg: 'bg-red-100',   text: 'text-red-900',    dot: 'bg-red-700'    },
};

export function CreditStatusBadge({ status }: { status: CreditStatus }) {
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}

export function CreditStatusBadge_stories() { return null; }
