import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AppProviders } from '../app/AppProviders';

/** Renders with the app's providers in Mantine's test mode (no transitions or portals). */
export function renderWithProviders(ui: ReactElement) {
  return render(<AppProviders env="test">{ui}</AppProviders>);
}
