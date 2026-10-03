import { describe, expect, it } from 'vitest';
import { getStage } from '../data/stages';
import { simulateLaunch } from './simulateLaunch';

const FINAL_DESTINATION = getStage('final-destination');
const BATTLEFIELD = getStage('battlefield');
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
    // Offstage to the right, so there is no floor to come back down on.
    const result = simulateLaunch({
      knockback: 100,
      angle: 80,
      start: { x: 150, y: 60 },
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

  it('ends the flight when a tumbling victim comes back down on the stage', () => {
    const result = simulateLaunch({
      knockback: 100,
      angle: 80,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });
    expect(result.outcome).toMatchObject({
      type: 'lands',
      surfaceName: 'Main stage',
      landing: 'missed-tech',
    });
    if (result.outcome.type !== 'lands') return;
    expect(result.outcome.position.y).toBe(0);
    expect(result.path.at(-1)).toEqual(result.outcome.position);
    expect(result.path).toHaveLength(result.outcome.frame + 1);
  });

  it('reports a tech when the victim techs on landing', () => {
    const result = simulateLaunch({
      knockback: 100,
      angle: 80,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
      techOnLanding: true,
    });
    expect(result.outcome).toMatchObject({ type: 'lands', landing: 'tech' });
  });

  it("lets a victim who isn't tumbling just land, since they can't tech", () => {
    const result = simulateLaunch({
      knockback: 50,
      angle: 80,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
      techOnLanding: true,
    });
    expect(result.isTumble).toBe(false);
    expect(result.outcome).toMatchObject({ type: 'lands', landing: 'land' });
  });

  it('flies up through a platform and lands on it coming down', () => {
    // Under Battlefield's top platform (y 54.4), launched straight up.
    const result = simulateLaunch({
      knockback: 150,
      angle: 90,
      start: ORIGIN,
      victim: MARTH,
      stage: BATTLEFIELD,
    });
    expect(Math.max(...result.path.map((point) => point.y))).toBeGreaterThan(54.4);
    expect(result.outcome).toMatchObject({ type: 'lands', surfaceName: 'Top platform' });
  });

  it('falls past the stage when the victim is beyond its edge', () => {
    const result = simulateLaunch({
      knockback: 100,
      angle: 80,
      start: { x: 100, y: 10 },
      victim: MARTH,
      stage: FINAL_DESTINATION,
    });
    expect(result.outcome.type).not.toBe('lands');
  });

  it('lands a grounded tumbling victim straight away on a shallow downward hit', () => {
    // 5° below the floor is within the 10° that isn't reflected.
    const result = simulateLaunch({
      knockback: 120,
      angle: 355,
      start: ORIGIN,
      victim: MARTH,
      stage: FINAL_DESTINATION,
      isGrounded: true,
    });
    expect(result.outcome).toMatchObject({ type: 'lands', frame: 1, landing: 'missed-tech' });
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
