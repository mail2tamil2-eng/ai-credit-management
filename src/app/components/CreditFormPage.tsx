import { useEffect, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './saas';
import './CreditFormPage.css';

export function CreditFormPage({ title, description, onBack, backLabel = 'Back', onSubmit, footer, children, busy = false, noValidate = false }: {
  busy?: boolean;
  noValidate?: boolean;
  title: string;
  description?: string;
  onBack: () => void;
  backLabel?: string;
  onSubmit: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => { window.scrollTo({ top: 0 }); }, [title]);
  return <div className="credit-form-page px-4 py-4 sm:px-6">
    <div className="w-full space-y-4">
      <Button disabled={busy} variant="ghost" size="sm" leftIcon={<ArrowLeft className="size-4" />} onClick={onBack}>{backLabel}</Button>
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-[#6B7280]">{description}</p>}
      </header>
      <form noValidate={noValidate} aria-busy={busy} className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
        <fieldset disabled={busy} className="min-w-0 p-5 sm:p-6">{children}</fieldset>
        <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-5 py-3 sm:px-6">{footer}</div>
      </form>
    </div>
  </div>;
}
