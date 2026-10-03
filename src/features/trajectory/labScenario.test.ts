import { describe, expect, it } from 'vitest';
import { getCharacterData } from '../../data/characters';
import { getStage } from '../../data/stages';
import { NEUTRAL_STICK } from '../../engine';
import {
  findStrongestHitbox,
  launchingHits,
  pickLaunchingHit,
  placeVictim,
  runLab,
  SURFACE_SNAP_DISTANCE,
  type LabInput,
} from './labScenario';

const fox = getCharacterData('fox')!;
const marth = getCharacterData('marth')!;
const finalDestination = getStage('final-destination');
const battlefield = getStage('battlefield');

function move(id: string) {
  return fox.moves.find((candidate) => candidate.id === id)!;
}

function labInput(overrides: Partial<LabInput> = {}): LabInput {
  const upSmash = move('usmash');
  return {
    move: upSmash,
    hitbox: upSmash.hits[0]!.hitboxes[0]!,
    victim: marth,
    victimPercent: 79,
    stage: finalDestination,
    placement: placeVictim({ x: 0, y: 0 }, finalDestination, 0),
    isCrouching: false,
    isAttackerFacingLeft: false,
    stick: NEUTRAL_STICK,
    staleUses: 0,
    techOnLanding: false,
    ...overrides,
  };
}

describe('placeVictim', () => {
  it('snaps a dragged point near the floor onto the main stage', () => {
    const placement = placeVictim({ x: 10, y: 3 }, finalDestination, SURFACE_SNAP_DISTANCE);
    expect(placement).toEqual({
      position: { x: 10, y: 0 },
      isGrounded: true,
      surfaceName: 'Main stage',
    });
  });

  it('snaps onto platforms and names them by position', () => {
    const top = placeVictim({ x: 0, y: 57 }, battlefield, SURFACE_SNAP_DISTANCE);
    const left = placeVictim({ x: -40, y: 25 }, battlefield, SURFACE_SNAP_DISTANCE);
    expect(top).toMatchObject({ position: { x: 0, y: 54.4 }, surfaceName: 'Top platform' });
    expect(left).toMatchObject({ position: { x: -40, y: 27.2 }, surfaceName: 'Left platform' });
  });

  it('leaves a point in the air airborne', () => {
    const placement = placeVictim({ x: 10, y: 40 }, finalDestination, SURFACE_SNAP_DISTANCE);
    expect(placement).toEqual({
      position: { x: 10, y: 40 },
      isGrounded: false,
      surfaceName: null,
    });
  });

  it('treats a point beside the stage as airborne, even at floor height', () => {
    const offstage = placeVictim({ x: 120, y: 0 }, finalDestination, SURFACE_SNAP_DISTANCE);
    expect(offstage.isGrounded).toBe(false);
  });

  it('only counts an exact match as grounded without a snap distance', () => {
    // Keyboard steps use no snapping, so one step up leaves the floor.
    expect(placeVictim({ x: 0, y: 1 }, finalDestination, 0).isGrounded).toBe(false);
    expect(placeVictim({ x: 0, y: 0 }, finalDestination, 0).isGrounded).toBe(true);
  });

  it('keeps the victim inside the blast zones', () => {
    const placement = placeVictim({ x: 999, y: 999 }, finalDestination, 0);
    expect(placement.position.x).toBeLessThan(finalDestination.blastZones.right);
    expect(placement.position.y).toBeLessThan(finalDestination.blastZones.top);
  });
});

describe('launchingHits and pickLaunchingHit', () => {
  it('finds nothing to launch in a grab or pummel', () => {
    expect(launchingHits(move('grab'))).toEqual([]);
    expect(launchingHits(move('pummel'))).toEqual([]);
  });

  it('uses the selected hit, falling back to the first', () => {
    const upSmash = move('usmash');
    expect(pickLaunchingHit(upSmash, 1).startFrame).toBe(10);
    expect(pickLaunchingHit(upSmash, 99).startFrame).toBe(7);
  });
});

describe('findStrongestHitbox', () => {
  it('picks the hitbox dealing the most knockback', () => {
    const tipper = marth.moves.find((candidate) => candidate.id === 'fsmash')!.hits[0]!;
    expect(findStrongestHitbox(tipper, fox, 50)?.name).toBe('id3');
  });
});

describe('runLab', () => {
  it('gives the same result both ways with a neutral stick', () => {
    const { noDi, withDi } = runLab(labInput());
    expect(withDi.hit.angle).toBe(noDi.hit.angle);
    expect(noDi.hit.outcome).toMatchObject({ type: 'ko', side: 'top' });
    expect(noDi.killPercent).toBe(79);
  });

  it('applies DI only to the DI result', () => {
    const { noDi, withDi } = runLab(labInput({ stick: { x: 1, y: 0 } }));
    expect(noDi.hit.angle).toBe(80);
    expect(withDi.hit.angle).toBeLessThan(80);
    expect(withDi.killPercent).toBe(88);
  });

  it('mirrors the launch when the attacker faces left', () => {
    const { noDi } = runLab(labInput({ isAttackerFacingLeft: true }));
    expect(noDi.hit.angle).toBe(100);
  });

  it('ignores crouch cancel for an airborne victim', () => {
    const airborne = placeVictim({ x: 0, y: 30 }, finalDestination, 0);
    const crouched = runLab(labInput({ placement: airborne, isCrouching: true }));
    const standing = runLab(labInput({ placement: airborne }));
    expect(crouched.noDi.hit.knockback).toBe(standing.noDi.hit.knockback);
  });

  it('uses the airborne Sakurai angle for a victim in the air', () => {
    const lateHit = move('usmash').hits[1]!.hitboxes[0]!;
    const airborne = placeVictim({ x: 0, y: 30 }, finalDestination, 0);
    const { noDi } = runLab(labInput({ hitbox: lateHit, placement: airborne }));
    expect(noDi.hit.angle).toBe(45);
  });

  it('uses weight 100 for throws', () => {
    const throwHitbox = move('uthrow').hits[0]!.hitboxes[0]!;
    const onFox = runLab(labInput({ move: move('uthrow'), hitbox: throwHitbox, victim: fox }));
    const onMarth = runLab(labInput({ move: move('uthrow'), hitbox: throwHitbox }));
    expect(onFox.noDi.hit.knockback).toBe(onMarth.noDi.hit.knockback);
  });
});
