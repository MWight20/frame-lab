import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSelectionStore } from '../state/selectionStore';
import { renderWithProviders } from '../test/renderWithProviders';
import { App } from './App';

const initialState = useSelectionStore.getState();

beforeEach(() => {
  useSelectionStore.setState(initialState, true);
});

describe('App', () => {
  it('opens on Fox up smash with its frame data', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Up Smash' })).toBeInTheDocument();
    const frameData = screen.getByRole('region', { name: 'Frame data' });
    expect(within(frameData).getByText(/^7\W*–\W*17$/)).toBeInTheDocument();
    expect(within(frameData).getByText('41')).toBeInTheDocument();
  });

  it('switches moves from the move list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(screen.getByRole('button', { name: 'Neutral Air' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Neutral Air' })).toBeInTheDocument();
    expect(screen.getByText('Landing lag / L-cancel')).toBeInTheDocument();
  });

  it('picks a character from the roster drawer and closes it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getAllByRole('button', { name: 'Select character' })[0]!);
    const roster = screen.getByRole('complementary', { name: 'Roster' });
    await user.click(within(roster).getByRole('button', { name: 'Marth' }));

    expect(screen.queryByRole('complementary', { name: 'Roster' })).not.toBeInTheDocument();
    // Marth also has an up smash, so the selected move carries over.
    expect(screen.getByRole('heading', { level: 1, name: 'Up Smash' })).toBeInTheDocument();
    expect(screen.getByText('Marth, ground')).toBeInTheDocument();
  });

  it('explains how to import characters without data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Select character' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Peach (no data yet)' }));
    expect(screen.getByText(/npm run import:data -- --only peach/)).toBeInTheDocument();
  });

  it('hides and shows the Trajectory Lab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.getByRole('region', { name: 'Trajectory Lab' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Trajectory Lab' }));
    expect(screen.queryByRole('region', { name: 'Trajectory Lab' })).not.toBeInTheDocument();
  });
});
