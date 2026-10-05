import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSelectionStore } from '../state/selectionStore';
import { useTrajectoryStore } from '../state/trajectoryStore';
import { renderWithProviders } from '../test/renderWithProviders';
import { App } from './App';

const initialState = useSelectionStore.getState();
const initialTrajectoryState = useTrajectoryStore.getState();

beforeEach(() => {
  useSelectionStore.setState(initialState, true);
  useTrajectoryStore.setState(initialTrajectoryState, true);
});

describe('App', () => {
  it('opens on Fox up smash with its frame data', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Up Smash' })).toBeInTheDocument();
    const frameData = screen.getByRole('region', { name: 'Frame data' });
    expect(within(frameData).getByText(/^7\W*–\W*17$/)).toBeInTheDocument();
    expect(within(frameData).getByText('41')).toBeInTheDocument();
  });

  it('links to the source code and credits the data in the About dialog', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(screen.getByRole('button', { name: 'About' }));

    const dialog = screen.getByRole('dialog', { name: 'About Frame Lab' });
    expect(within(dialog).getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/MWight20/frame-lab',
    );
    expect(within(dialog).getByRole('link', { name: 'GNU GPL v3.0 or later' })).toBeVisible();
    expect(within(dialog).getByRole('link', { name: 'FightCore frame-data' })).toBeVisible();
    expect(within(dialog).getByText(/not affiliated with or endorsed by Nintendo/)).toBeVisible();
  });

  it('plays clips at quarter speed by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByRole('radio', { name: '¼×' })).toBeChecked();
  });

  it('leaves out the clip player for a move without a clip, but keeps its frame data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.getByLabelText('Up Smash clip')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Forward Throw' }));
    expect(screen.getByText('No clip')).toBeInTheDocument();
    expect(screen.queryByLabelText('Forward Throw clip')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next frame' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Frame data' })).toBeInTheDocument();
  });

  it('plays a variant clip, and says which, for a move with only variants', () => {
    useSelectionStore.setState({ characterId: 'samus', moveId: 'neutralb' });
    renderWithProviders(<App />);
    const clip = screen.getByLabelText('Charge Shot clip');
    expect(clip).toHaveAttribute('src', expect.stringMatching(/samus\/neutralb-uncharged\.mp4$/));
    expect(screen.getByText('Clip: uncharged')).toBeInTheDocument();
  });

  it('names the selected stage in full next to the Trajectory Lab title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    const lab = screen.getByRole('region', { name: 'Trajectory Lab' });
    expect(within(lab).getByText('Final Destination', { selector: 'span' })).toBeInTheDocument();

    await user.click(within(lab).getByRole('radio', { name: 'BF' }));
    expect(within(lab).getByText('Battlefield', { selector: 'span' })).toBeInTheDocument();
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

  it('loads any roster character, now that the whole roster is imported', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Select character' })[0]!);
    await user.click(screen.getByRole('button', { name: 'Peach' }));
    expect(screen.getByRole('navigation', { name: 'Peach moves' })).toBeInTheDocument();
  });

  it('explains how to import a character without data', () => {
    // Every roster character has data today, so use an id that was never imported.
    useSelectionStore.setState({ characterId: 'not-imported' });
    renderWithProviders(<App />);
    expect(screen.getByText(/npm run import:data -- --only not-imported/)).toBeInTheDocument();
  });

  it('hides and shows the Trajectory Lab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.getByRole('region', { name: 'Trajectory Lab' })).toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Trajectory Lab' }));
    expect(screen.queryByRole('region', { name: 'Trajectory Lab' })).not.toBeInTheDocument();
  });
});

describe('Trajectory Lab', () => {
  function card(name: string) {
    return within(screen.getByRole('region', { name }));
  }

  it('shows where the hit sends the victim, with and without DI', () => {
    renderWithProviders(<App />);
    // Fox up smash on Marth at 80%, center of Final Destination.
    expect(card('No DI').getByText(/KO through the top blast zone/)).toBeInTheDocument();
    expect(card('No DI').getByText('79%')).toBeInTheDocument();
    expect(card('With this DI').getByText('80.0°')).toBeInTheDocument();
  });

  it('updates the result when the percent changes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    const percent = screen.getByLabelText('Victim percent (before the hit)');
    await user.clear(percent);
    await user.type(percent, '10');
    // At 10% the up smash doesn't KO; Marth comes back down on Final Destination.
    expect(card('No DI').getByText(/^Lands on the main stage, frame \d+/)).toBeInTheDocument();
  });

  it('shows the staled damage and the tech in the results', async () => {
    const user = userEvent.setup();
    // Low enough that the up smash brings Marth back down on the stage instead of KOing.
    useTrajectoryStore.setState({ victimPercent: 10 });
    renderWithProviders(<App />);
    const stale = screen.getByLabelText('Stale uses');
    await user.clear(stale);
    await user.type(stale, '3');
    // Fox up smash deals 18%; used 3 times in a row it deals 18 × 0.76.
    expect(card('No DI').getByText('13.68%')).toBeInTheDocument();
    expect(card('No DI').getByText(/\(missed tech\)$/)).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /Tech on landing/ }));
    expect(card('No DI').getByText(/\(techs\)$/)).toBeInTheDocument();
  });

  it('changes the DI result when the stick moves', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    screen.getByRole('application', { name: 'DI stick' }).focus();
    await user.keyboard('{ArrowRight>10/}');
    expect(card('No DI').getByText('80.0°')).toBeInTheDocument();
    expect(card('With this DI').queryByText('80.0°')).not.toBeInTheDocument();
  });

  it('moves the victim with the arrow keys and resets to center stage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    expect(screen.getByText(/grounded on the main stage/)).toBeInTheDocument();

    screen.getByRole('application', { name: 'Victim position' }).focus();
    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(screen.getByText('Victim at x 0.0, y 10.0, airborne')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Crouch cancel/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Reset to center stage' }));
    expect(screen.getByText(/grounded on the main stage/)).toBeInTheDocument();
  });

  it('explains why a grab has nothing to launch', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await user.click(screen.getByRole('button', { name: 'Grab' }));
    expect(screen.getByText(/Grab doesn't launch anyone/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'No DI' })).not.toBeInTheDocument();
  });
});

describe('phone layout', () => {
  // The test setup's matchMedia never matches; make the phone query match instead.
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('max-width'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves the theme picker and About into the move list panel', () => {
    renderWithProviders(<App />);
    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('button', { name: 'About' })).not.toBeInTheDocument();

    const settings = screen.getByRole('region', { name: 'Settings' });
    expect(within(settings).getByText('Theme', { selector: 'label' })).toBeInTheDocument();
    expect(within(settings).getByRole('button', { name: 'About' })).toBeInTheDocument();
    // The lab switch keeps its name even though its label is hidden on screen.
    expect(within(header).getByRole('switch', { name: 'Trajectory Lab' })).toBeInTheDocument();
  });

  it('opens the move list from the menu button and closes it after picking a move', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(screen.getByRole('button', { name: 'Show move list' }));
    expect(screen.getByRole('button', { name: 'Hide move list' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Neutral Air' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Neutral Air' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show move list' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
