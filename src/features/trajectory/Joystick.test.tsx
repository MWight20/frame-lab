import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import type { StickPosition } from '../../engine';
import { renderWithProviders } from '../../test/renderWithProviders';
import { Joystick } from './Joystick';

/** Holds the stick value like a real parent would, so the readout updates. */
function ControlledJoystick({ initial = { x: 0, y: 0 } }: { initial?: StickPosition }) {
  const [value, setValue] = useState(initial);
  return <Joystick value={value} onChange={setValue} />;
}

function getPad() {
  return screen.getByRole('application', { name: 'DI stick' });
}

/** jsdom has no layout, so give the pad a 200 × 200 px box at the origin. */
function giveLayout(element: Element) {
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 }) as DOMRect;
}

describe('Joystick', () => {
  it('starts at neutral and shows the raw values', () => {
    renderWithProviders(<ControlledJoystick />);
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('x 0 · y 0')).toBeInTheDocument();
  });

  it('nudges with the arrow keys when focused', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledJoystick />);

    getPad().focus();
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(screen.getByText('0°')).toBeInTheDocument();
    expect(screen.getByText('x 32 · y 0')).toBeInTheDocument();

    await user.keyboard('{Shift>}{ArrowUp}{/Shift}');
    expect(screen.getByText('x 32 · y 1')).toBeInTheDocument();
  });

  it('notes when a tilt is too small to count as DI', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledJoystick />);

    getPad().focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByText('in deadzone')).toBeInTheDocument();
  });

  it('returns to neutral with the reset button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledJoystick initial={{ x: 1, y: 0 }} />);

    await user.click(screen.getByRole('button', { name: 'Reset to neutral' }));
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('follows a drag and springs back to neutral on release when Hold position is off', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ControlledJoystick />);
    const pad = getPad();
    giveLayout(pad);

    await user.click(screen.getByRole('switch', { name: 'Hold position' }));

    // Full tilt is 80 of the 100 units from center, so 80 px right of center at 200 px wide.
    fireEvent.pointerDown(pad, { clientX: 180, clientY: 100, pointerId: 1 });
    expect(screen.getByText('x 80 · y 0')).toBeInTheDocument();

    fireEvent.pointerMove(pad, { clientX: 100, clientY: 20, pointerId: 1 });
    expect(screen.getByText('x 0 · y 80')).toBeInTheDocument();

    fireEvent.pointerUp(pad, { pointerId: 1 });
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('keeps its position on release, because Hold position starts on', () => {
    renderWithProviders(<ControlledJoystick />);
    const pad = getPad();
    giveLayout(pad);

    expect(screen.getByRole('switch', { name: 'Hold position' })).toBeChecked();
    fireEvent.pointerDown(pad, { clientX: 180, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(pad, { pointerId: 1 });
    expect(screen.getByText('x 80 · y 0')).toBeInTheDocument();
  });
});
