import { describe, expect, it } from 'vitest';
import { getStage } from '../data/stages';
import { simulateLaunch } from './simulateLaunch';

const FINAL_DESTINATION = getStage('final-destination');
const MARTH = { gravity: 0.085, fallSpeed: 2.2 };
const ORIGIN = { x: 0, y: 0 };

/** Fox up smash (clean) on Marth at 79%, which ikneedata reports as the first kill percent. */
const UP_SMASH_KILL = { knockback: 212.82951871657755, angle: 80 };

describe('simulateLaunch', () => {
  it('matches ikneedata’s positions frame by frame', () => {
    const result = simulateLaunch({
      ...UP_SMASH_KILL,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });

    // ikneedata rounds launch speed to 5 decimals, so allow a little drift.
    expect(result.path[1]!.x).toBeCloseTo(1.09986, 4);
    expect(result.path[1]!.y).toBeCloseTo(6.15265, 4);
    expect(result.path[3]!.y).toBeCloseTo(18.05226, 3);
  });

  it('reports a KO through the top blast zone', () => {
    const result = simulateLaunch({
      ...UP_SMASH_KILL,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });

    expect(result.hitstunFrames).toBe(85);
    expect(result.isTumble).toBe(true);
    expect(result.outcome).toMatchObject({ type: 'ko', side: 'top', frame: 69 });
    expect(result.path).toHaveLength(70);
  });

  it('reports where hitstun ends when the victim survives', () => {
    const result = simulateLaunch({
      knockback: 100,
      angle: 80,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });

    expect(result.outcome.type).toBe('survives');
    if (result.outcome.type !== 'survives') return;
    expect(result.outcome.hitstunEnd).toEqual(result.path[result.hitstunFrames]);
  });

  it('needs enough upward launch speed to KO through the top', () => {
    // Starting just under the top blast zone with an upward launch speed of about 2.3,
    // just short of the 2.4 needed: the victim crosses the line but isn't KO'd by it.
    const result = simulateLaunch({
      knockback: 90,
      angle: 60,
      start: { x: 0, y: 187.5 },
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });
    expect(result.path.some((point) => point.y > FINAL_DESTINATION.blastZones.top)).toBe(true);
    expect(result.outcome).not.toMatchObject({ side: 'top' });
  });

  it('reports KOs through the sides and bottom as soon as they are crossed', () => {
    const toTheLeft = simulateLaunch({
      knockback: 300,
      angle: 180,
      start: { x: -200, y: 50 },
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });
    const downward = simulateLaunch({
      knockback: 150,
      angle: 270,
      start: { x: 120, y: -100 },
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });

    expect(toTheLeft.outcome).toMatchObject({ type: 'ko', side: 'left' });
    expect(downward.outcome).toMatchObject({ type: 'ko', side: 'bottom' });
  });

  it('caps falling speed at the victim’s fall speed', () => {
    const result = simulateLaunch({
      knockback: 1,
      angle: 0,
      start: { x: 0, y: 100 },
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });
    // Without launch speed the drop per frame settles at exactly the fall speed.
    const steps = result.path.slice(1).map((point, index) => result.path[index]!.y - point.y);
    expect(Math.max(...steps)).toBeLessThanOrEqual(MARTH.fallSpeed + 1e-9);
  });

  it('bounces a tumbling grounded victim hit downward off the floor', () => {
    const result = simulateLaunch({
      knockback: 120,
      angle: 290,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
      isGrounded: true,
    });
    expect(result.path[1]!.y).toBeGreaterThan(0);
  });

  it('keeps a grounded victim on the floor for a flat hit', () => {
    const result = simulateLaunch({
      knockback: 30,
      angle: 0,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
      isGrounded: true,
    });
    expect(result.path.every((point) => point.y === 0)).toBe(true);
    expect(result.path.at(-1)!.x).toBeGreaterThan(0);
  });
});
