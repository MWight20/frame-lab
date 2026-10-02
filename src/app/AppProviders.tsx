import type { ReactNode } from 'react';
import { ThemeProvider } from '../features/theme/ThemeProvider';

/** Everything the app needs around it. Tests render through this too. */
export function AppProviders({ children, env }: { children: ReactNode; env?: 'default' | 'test' }) {
  return <ThemeProvider env={env}>{children}</ThemeProvider>;
}
