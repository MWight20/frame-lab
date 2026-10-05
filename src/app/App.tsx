import { AppShell } from '@mantine/core';
import { CharacterPanel } from '../features/characters/CharacterPanel';
import { RosterDrawer } from '../features/characters/RosterDrawer';
import { AppHeader, MOVE_LIST_ID } from '../features/header/AppHeader';
import { PhoneSettings } from '../features/header/PhoneSettings';
import { MoveList } from '../features/moves/MoveList';
import { MoveViewer } from '../features/moves/MoveViewer';
import { TrajectoryLabPanel } from '../features/trajectory/TrajectoryLabPanel';
import { useSelectionStore } from '../state/selectionStore';
import classes from './App.module.css';
import { useIsPhone } from './useIsPhone';

export function App() {
  const isLabOpen = useSelectionStore((state) => state.isTrajectoryLabOpen);
  const isMoveListOpen = useSelectionStore((state) => state.isMoveListOpen);
  const isPhone = useIsPhone();

  return (
    <AppShell
      header={{ height: 64 }}
      // Below `sm` the navbar becomes a full-width panel behind the header's menu button.
      navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !isMoveListOpen } }}
      padding={0}
    >
      <AppShell.Header withBorder={false}>
        <AppHeader isCompact={isPhone} />
      </AppShell.Header>

      <AppShell.Navbar id={MOVE_LIST_ID} className={classes.navbar} withBorder={false}>
        <CharacterPanel />
        <MoveList />
        {isPhone && <PhoneSettings />}
      </AppShell.Navbar>

      <AppShell.Main className={classes.main}>
        <div className={classes.workArea} data-lab-open={isLabOpen}>
          <MoveViewer />
          {isLabOpen && <TrajectoryLabPanel />}
        </div>
      </AppShell.Main>

      <RosterDrawer />
    </AppShell>
  );
}
