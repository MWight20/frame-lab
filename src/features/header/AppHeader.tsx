import { Burger, Switch } from '@mantine/core';
import { useSelectionStore } from '../../state/selectionStore';
import { AboutButton } from './AboutDialog';
import { ThemeSelect } from './ThemeSelect';
import classes from './AppHeader.module.css';

/**
 * The logo is a finished image with its own colors and dark panel, so it is served from
 * public/brand/ rather than drawn with theme tokens. All three themes have a dark header,
 * which it was designed to sit on.
 */
const LOGO_SRC = `${import.meta.env.BASE_URL}brand/frame-lab-melee-logo.svg`;

export const MOVE_LIST_ID = 'move-list-panel';

interface AppHeaderProps {
  /**
   * The phone layout: a menu button for the move list, a smaller logo and the lab switch.
   * The theme picker and About move into the move list panel (see PhoneSettings).
   */
  isCompact: boolean;
}

export function AppHeader({ isCompact }: AppHeaderProps) {
  return (
    // AppShell.Header is already the page's <header> landmark, so this is a plain div.
    <div className={classes.header} data-compact={isCompact || undefined}>
      {isCompact && <MoveListButton />}
      <img className={classes.logo} src={LOGO_SRC} alt="Frame Lab for Melee 1.02" />
      {!isCompact && <ThemeSelect inHeader />}
      <TrajectoryLabSwitch isCompact={isCompact} />
      {!isCompact && <AboutButton />}
    </div>
  );
}

/** Opens and closes the collapsed move list on phones. */
function MoveListButton() {
  const isOpen = useSelectionStore((state) => state.isMoveListOpen);
  const toggle = useSelectionStore((state) => state.toggleMoveList);

  return (
    <Burger
      opened={isOpen}
      onClick={toggle}
      size="sm"
      color="var(--fl-header-text)"
      aria-label={isOpen ? 'Hide move list' : 'Show move list'}
      aria-expanded={isOpen}
      aria-controls={MOVE_LIST_ID}
    />
  );
}

function TrajectoryLabSwitch({ isCompact }: { isCompact: boolean }) {
  const isOpen = useSelectionStore((state) => state.isTrajectoryLabOpen);
  const setOpen = useSelectionStore((state) => state.setTrajectoryLabOpen);

  return (
    <Switch
      label="Trajectory Lab"
      labelPosition="left"
      size="md"
      checked={isOpen}
      onChange={(event) => setOpen(event.currentTarget.checked)}
      // On phones the label is hidden to save space but still read by screen readers.
      classNames={{ label: isCompact ? classes.visuallyHidden : classes.switchLabel }}
    />
  );
}
