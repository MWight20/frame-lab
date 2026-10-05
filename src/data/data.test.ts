import { describe, expect, it } from 'vitest';
import {
  getCharacterData,
  getRosterWithData,
  groupMovesByCategory,
  hasCharacterData,
  loadCharacterData,
  ROSTER,
} from './characters';
import { STAGES } from './stages';

const importedCharacters = ROSTER.map((entry) => getCharacterData(entry.id)).filter(
  (character) => character !== undefined,
);

describe('roster', () => {
  it('has all 26 characters with unique ids', () => {
    expect(ROSTER).toHaveLength(26);
    expect(new Set(ROSTER.map((entry) => entry.id)).size).toBe(26);
  });
});

describe('loading character data', () => {
  it('knows which characters have data without loading them', () => {
    expect(hasCharacterData('fox')).toBe(true);
    expect(hasCharacterData('not-imported')).toBe(false);
    expect(getRosterWithData().map((entry) => entry.id)).toEqual(ROSTER.map((entry) => entry.id));
  });

  it('loads each character once and caches it', async () => {
    const first = await loadCharacterData('marth');
    const second = await loadCharacterData('marth');
    expect(first?.name).toBe('Marth');
    expect(second).toBe(first);
    expect(getCharacterData('marth')).toBe(first);
  });

  it('resolves to undefined for a character without data', async () => {
    await expect(loadCharacterData('not-imported')).resolves.toBeUndefined();
    expect(getCharacterData('not-imported')).toBeUndefined();
  });
});

describe('imported character data', () => {
  it('includes the sample characters', () => {
    expect(importedCharacters.map((character) => character.id)).toEqual(
      expect.arrayContaining(['fox', 'marth']),
    );
  });

  it('matches known values for Fox', () => {
    const fox = getCharacterData('fox')!;
    expect(fox.attributes).toEqual({
      weight: 75,
      gravity: 0.23,
      fallSpeed: 2.8,
      fastFallSpeed: 3.4,
    });
    const usmash = fox.moves.find((move) => move.id === 'usmash')!;
    expect(usmash.firstActiveFrame).toBe(7);
    expect(usmash.totalFrames).toBe(41);
    expect(usmash.hits[0]?.hitboxes[0]?.damage).toBe(18);
  });

  it.each(importedCharacters.map((character) => [character.name, character] as const))(
    '%s has sensible frame data',
    (_name, character) => {
      expect(character.attributes.weight).toBeGreaterThan(0);
      expect(character.attributes.gravity).toBeGreaterThan(0);
      expect(character.attributes.gravity).toBeLessThan(1); // catches fall speed in the wrong field

      for (const move of character.moves) {
        if (move.firstActiveFrame !== null && move.lastActiveFrame !== null) {
          expect(move.lastActiveFrame, move.id).toBeGreaterThanOrEqual(move.firstActiveFrame);
        }
        for (const hit of move.hits) {
          if (hit.startFrame !== null && hit.endFrame !== null) {
            expect(hit.endFrame, move.id).toBeGreaterThanOrEqual(hit.startFrame);
          }
        }
      }
    },
  );

  it('keeps moves in category order', () => {
    const fox = getCharacterData('fox')!;
    const categories = groupMovesByCategory(fox.moves).map((group) => group.category);
    expect(categories).toEqual(['ground', 'aerial', 'special', 'grab']);
  });
});

describe('stages', () => {
  it.each(STAGES.map((stage) => [stage.name, stage] as const))(
    '%s fits inside its blast zones',
    (_name, stage) => {
      const { left, right, top, bottom } = stage.blastZones;
      expect(left).toBeLessThan(-stage.edgeX);
      expect(right).toBeGreaterThan(stage.edgeX);
      expect(bottom).toBeLessThan(0);
      for (const platform of stage.platforms) {
        expect(platform.left).toBeLessThan(platform.right);
        expect(platform.y).toBeGreaterThan(0);
        expect(platform.y).toBeLessThan(top);
        expect(platform.left).toBeGreaterThan(left);
        expect(platform.right).toBeLessThan(right);
      }
    },
  );
});
