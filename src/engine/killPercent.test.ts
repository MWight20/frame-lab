import { describe, expect, it } from 'vitest';
import { getCharacterData } from '../data/characters';
import { getStage } from '../data/stages';
import type { Hitbox } from '../data/types';
import { findKillPercent, type HitScenario } from './killPercent';

/**
 * Regression cases against ikneedata. Each expected percent came from running ikneedata's
 * own calculatormaths.js (October 2026) with: NTSC, victim standing at (0, 0), no DI unless
 * stated, no SDI or ASDI, fresh moves, attacker facing right. "Kill percent" is the lowest
 * whole percent before the hit that KOs.
 */

const fox = getCharacterData('fox')!;
const marth = getCharacterData('marth')!;

function victim(character: typeof fox) {
  return { ...character.attributes };
}

function hitbox(character: typeof fox, moveId: string, hitIndex: number, hitboxName: string) {
  const move = character.moves.find((candidate) => candidate.id === moveId)!;
  return move.hits[hitIndex]!.hitboxes.find((candidate) => candidate.name === hitboxName)!;
}

function scenario(hit: Hitbox, target: typeof fox, overrides: Partial<HitScenario> = {}) {
  return {
    hitbox: hit,
    victim: victim(target),
    stage: getStage('final-destination'),
    start: { x: 0, y: 0 },
    isGrounded: true,
    ...overrides,
  } satisfies HitScenario;
}

const foxUpSmashClean = hitbox(fox, 'usmash', 0, 'id0');
const foxUpSmashLate = hitbox(fox, 'usmash', 1, 'id0');
const marthForwardSmashTipper = hitbox(marth, 'fsmash', 0, 'id3');

describe('kill percents match ikneedata', () => {
  it('uses the expected hitbox data', () => {
    expect(foxUpSmashClean).toMatchObject({ damage: 18, angle: 80, baseKnockback: 30 });
    expect(foxUpSmashLate).toMatchObject({ damage: 13, angle: 361, baseKnockback: 10 });
    expect(marthForwardSmashTipper).toMatchObject({ damage: 20, angle: 361, baseKnockback: 80 });
  });

  it('Fox up smash on Marth, Final Destination, no DI: 79%', () => {
    expect(findKillPercent(scenario(foxUpSmashClean, marth))).toBe(79);
  });

  it('Fox up smash on Fox: 86%', () => {
    expect(findKillPercent(scenario(foxUpSmashClean, fox))).toBe(86);
  });

  it('Fox up smash on Marth holding DI right (away from the angle): 88%', () => {
    expect(findKillPercent(scenario(foxUpSmashClean, marth, { stick: { x: 1, y: 0 } }))).toBe(88);
  });

  it('Fox up smash on Marth holding DI left (toward vertical): 78%', () => {
    expect(findKillPercent(scenario(foxUpSmashClean, marth, { stick: { x: -1, y: 0 } }))).toBe(78);
  });

  it('Fox up smash on a crouching Marth: 142%', () => {
    expect(findKillPercent(scenario(foxUpSmashClean, marth, { isCrouching: true }))).toBe(142);
  });

  it('Fox up smash on Marth, Battlefield: 82%', () => {
    const battlefield = getStage('battlefield');
    expect(findKillPercent(scenario(foxUpSmashClean, marth, { stage: battlefield }))).toBe(82);
  });

  it('Fox late up smash (Sakurai angle) on Marth: 139%', () => {
    expect(findKillPercent(scenario(foxUpSmashLate, marth))).toBe(139);
  });

  it('Marth tipper forward smash (Sakurai angle) on Fox: 66%', () => {
    expect(findKillPercent(scenario(marthForwardSmashTipper, fox))).toBe(66);
  });

  it('Marth tipper forward smash on Marth: 72%', () => {
    expect(findKillPercent(scenario(marthForwardSmashTipper, marth))).toBe(72);
  });
});
