import { AboutButton } from './AboutDialog';
import { ThemeSelect } from './ThemeSelect';
import classes from './AppHeader.module.css';

/**
 * The header's theme picker and About button, for phones, where the header has no room
 * for them. Shown at the bottom of the move list panel.
 */
export function PhoneSettings() {
  return (
    <section className={classes.phoneSettings} aria-label="Settings">
      <ThemeSelect inHeader={false} />
      <AboutButton inHeader={false} />
    </section>
  );
}
