import { useMediaQuery } from '@mantine/hooks';

/**
 * Below Mantine's `sm` breakpoint (48em, 768px) the app switches to its phone layout: the
 * move list collapses behind a menu button and the header drops to its essentials. Keep
 * this in step with the AppShell's navbar breakpoint, which also uses `sm`.
 */
const PHONE_QUERY = '(max-width: 47.99em)';

export function useIsPhone(): boolean {
  // Read the query on the first render, so phones don't flash the desktop layout first.
  return useMediaQuery(PHONE_QUERY, false, { getInitialValueInEffect: false });
}
