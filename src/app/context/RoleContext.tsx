import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type AppRole = 'site-admin' | 'credit-manager';

export const ROLE_LABELS: Record<AppRole, string> = {
  'site-admin': 'Site Admin',
  'credit-manager': 'Credit Manager',
};

interface RoleContextValue {
  role: AppRole;
  setRole: (r: AppRole) => void;
}

export const RoleContext = createContext<RoleContextValue>({
  role: 'site-admin',
  setRole: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>('site-admin');
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}
