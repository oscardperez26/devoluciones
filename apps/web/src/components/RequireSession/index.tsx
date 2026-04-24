import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useWizardStore } from '@/store/wizard.store';

export default function RequireSession({ children }: { children: ReactNode }) {
  const sessionToken = useWizardStore((s) => s.sessionToken);
  if (!sessionToken) return <Navigate to="/" replace />;
  return <>{children}</>;
}
