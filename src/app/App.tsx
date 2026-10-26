import { AppShell } from '@mantine/core';
import { CharacterPanel } from '../features/characters/CharacterPanel';
import { RosterDrawer } from '../features/characters/RosterDrawer';
import { AppHeader, MOVE_LIST_ID } from '../features/header/AppHeader';
import { PhoneSettings } from '../features/header/PhoneSettings';
import { MoveList } from '../features/moves/MoveList';
import { MoveViewer } from '../features/moves/MoveViewer';
import { TrajectoryLabTray } from '../features/trajectory/TrajectoryLabPanel';
import { useSelectionStore } from '../state/selectionStore';
import classes from './App.module.css';
import { useIsPhone } from './useIsPhone';

const NAVBAR_WIDTH = 250;

export function App() {
  const isMoveListOpen = useSelectionStore((state) => state.isMoveListOpen);
  const isPhone = useIsPhone();

  return (
    <AppShell
      header={{ height: 64 }}
      // Below `sm` the navbar becomes a full-width panel behind the header's menu button.
      navbar={{ width: NAVBAR_WIDTH, breakpoint: 'sm', collapsed: { mobile: !isMoveListOpen } }}
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
        <div className={classes.workArea}>
          <MoveViewer />
        </div>
      </AppShell.Main>

      <RosterDrawer />
      {/* The tray covers everything but the move list; on phones, the whole screen. */}
      <TrajectoryLabTray width={isPhone ? '100%' : `calc(100% - ${NAVBAR_WIDTH}px)`} />
    </AppShell>
  );
}
