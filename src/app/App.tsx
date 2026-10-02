import { AppShell } from '@mantine/core';
import { CharacterPanel } from '../features/characters/CharacterPanel';
import { RosterDrawer } from '../features/characters/RosterDrawer';
import { AppHeader } from '../features/header/AppHeader';
import { MoveList } from '../features/moves/MoveList';
import { MoveViewer } from '../features/moves/MoveViewer';
import { TrajectoryLabPanel } from '../features/trajectory/TrajectoryLabPanel';
import { useSelectionStore } from '../state/selectionStore';
import classes from './App.module.css';

export function App() {
  const isLabOpen = useSelectionStore((state) => state.isTrajectoryLabOpen);

  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 250, breakpoint: 0 }} padding={0}>
      <AppShell.Header withBorder={false}>
        <AppHeader />
      </AppShell.Header>

      <AppShell.Navbar className={classes.navbar} withBorder={false}>
        <CharacterPanel />
        <MoveList />
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
