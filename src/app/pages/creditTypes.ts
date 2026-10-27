export type CreditStatus = 'active' | 'low' | 'critical' | 'exhausted' | 'negative';
export type AllocationStatus = 'active' | 'inactive';
export type TenantStatus = 'active' | 'suspended';
export type PlanInterval = 'Monthly' | 'Yearly';

export interface Plan {
  id: string;
  name: string;
  interval: PlanInterval;
  credits: number;
  description?: string;
  status: 'active' | 'inactive';
  assignedTenants: number;
}

export interface TenantCredit {
  id: string;
  name: string;
  tenantStatus: TenantStatus;
  plan?: string;
  nextAllocation?: string;
  pausedNextAllocation?: string;
  balance: number;
  creditStatus: CreditStatus;
  allocationStatus: AllocationStatus;
  rollover?: boolean;
  allowOrgAdminStopAllocation?: boolean;
  allocationStopReason?: string;
  lowThreshold?: number;
  criticalThreshold?: number;
  topUpReference?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Plan Allocation' | 'Top-up' | 'Usage' | 'Reversal';
  description: string;
  feature?: string;
  credits: number;
  balanceAfter: number;
  reference: string;
  performedBy: string;
}

export interface ActionRecord {
  id: string;
  date: string;
  action: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  reason?: string;
}

export const AVAILABLE_TENANTS = [
  'Pinnacle Education',
  'TechBridge Academy',
  'CloudLearn Institute',
  'Momentum Skills',
  'Nexus Learning',
  'Horizon Training',
  'BlueRidge Institute',
  'Catalyst Academy',
];

export const MOCK_PLANS: Plan[] = [
  { id: 'p1', name: 'Starter', interval: 'Monthly', credits: 2000, description: 'For small teams', status: 'active', assignedTenants: 3 },
  { id: 'p2', name: 'Growth', interval: 'Monthly', credits: 5000, description: 'For growing organisations', status: 'active', assignedTenants: 5 },
  { id: 'p3', name: 'Pro', interval: 'Monthly', credits: 10000, description: 'High-volume usage', status: 'active', assignedTenants: 2 },
  { id: 'p4', name: 'Enterprise', interval: 'Yearly', credits: 150000, description: 'Unlimited scale', status: 'active', assignedTenants: 1 },
  { id: 'p5', name: 'Basic (Legacy)', interval: 'Monthly', credits: 500, description: 'Deprecated', status: 'inactive', assignedTenants: 0 },
];

export const MOCK_TENANTS: TenantCredit[] = [
  { id: 't1', name: 'Nova Skills',          tenantStatus: 'active',    plan: 'Growth (Monthly)',   nextAllocation: '01 Nov 2026', balance: -140,  creditStatus: 'negative',  allocationStatus: 'active' },
  { id: 't2', name: 'Bright Minds',         tenantStatus: 'active',    plan: 'Starter (Monthly)',  nextAllocation: '01 Nov 2026', balance: 0,     creditStatus: 'exhausted', allocationStatus: 'active' },
  { id: 't3', name: 'Apex Learning',        tenantStatus: 'active',    plan: 'Pro (Monthly)',      nextAllocation: '01 Jan 2027', balance: 95,    creditStatus: 'critical',  allocationStatus: 'active' },
  { id: 't4', name: 'Sunrise Institute',    tenantStatus: 'active',    plan: 'Starter (Monthly)',  nextAllocation: '01 Nov 2026', balance: 620,   creditStatus: 'low',       allocationStatus: 'active', allowOrgAdminStopAllocation: true },
  { id: 't5', name: 'Greenfield Academy',   tenantStatus: 'active',    plan: 'Growth (Monthly)',   nextAllocation: '01 Nov 2026', balance: 8450,  creditStatus: 'active',    allocationStatus: 'active' },
  { id: 't6', name: 'Orbit Tech Academy',   tenantStatus: 'active',    plan: undefined,            nextAllocation: undefined,     balance: 0,     creditStatus: 'exhausted', allocationStatus: 'active' },
  { id: 't7', name: 'Vista Institute',      tenantStatus: 'suspended', plan: 'Starter (Monthly)',  nextAllocation: 'Paused',      balance: 310,   creditStatus: 'active',    allocationStatus: 'active' },
  { id: 't8', name: 'Elevate Corp',         tenantStatus: 'suspended', plan: undefined,            nextAllocation: undefined,     balance: 0,     creditStatus: 'exhausted', allocationStatus: 'active' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TX-001', date: '2026-10-12 14:32', type: 'Usage',          description: 'AI Course Creation',    feature: 'AI Course Creation',    credits: -50,   balanceAfter: 8450,  reference: 'Growth plan',    performedBy: 'System' },
  { id: 'TX-002', date: '2026-10-10 09:15', type: 'Usage',          description: 'AI Quiz Generation',    feature: 'AI Quiz Generator',     credits: -30,   balanceAfter: 8500,  reference: 'Growth plan',    performedBy: 'System' },
  { id: 'TX-003', date: '2026-10-01 00:00', type: 'Plan Allocation', description: 'Monthly allocation – Growth plan', feature: undefined,  credits: 5000,  balanceAfter: 8530,  reference: 'Growth plan',    performedBy: 'System' },
  { id: 'TX-004', date: '2026-09-15 11:20', type: 'Top-up',         description: 'Manual top-up by admin', feature: undefined,             credits: 2000,  balanceAfter: 3530,  reference: 'REF-20260915',   performedBy: 'Site Admin' },
  { id: 'TX-005', date: '2026-09-01 00:00', type: 'Plan Allocation', description: 'Monthly allocation – Growth plan', feature: undefined,  credits: 5000,  balanceAfter: 1530,  reference: 'Growth plan',    performedBy: 'System' },
];

export const MOCK_ACTIONS: ActionRecord[] = [
  { id: 'A-001', date: '2026-10-01 09:00', action: 'Plan Upgraded',    oldValue: 'Starter',      newValue: 'Growth',     performedBy: 'Site Admin', reason: 'Tenant requested upgrade' },
  { id: 'A-002', date: '2026-09-15 11:20', action: 'Top-up Added',     oldValue: '1,530',        newValue: '3,530',      performedBy: 'Site Admin', reason: 'REF-20260915' },
  { id: 'A-003', date: '2026-09-10 14:05', action: 'Threshold Changed', oldValue: 'Low: 20%',    newValue: 'Low: 25%',   performedBy: 'Site Admin', reason: 'Tenant request' },
  { id: 'A-004', date: '2026-08-01 00:00', action: 'Plan Assigned',    oldValue: '—',            newValue: 'Starter',    performedBy: 'Site Admin', reason: 'Initial setup' },
];
