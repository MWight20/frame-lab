import { describe, expect, it } from 'vitest';
import { findLanding } from './stageCollision';

const MAIN_STAGE = { name: 'Main stage', y: 0, left: -50, right: 50 };
const PLATFORM = { name: 'Top platform', y: 30, left: -10, right: 10 };
const SURFACES = [MAIN_STAGE, PLATFORM];

describe('findLanding', () => {
  it('finds where a falling path meets a surface', () => {
    const contact = findLanding({ x: 0, y: 2 }, { x: 4, y: -2 }, SURFACES);
    expect(contact?.surface.name).toBe('Main stage');
    expect(contact?.position).toEqual({ x: 2, y: 0 });
  });

  it('ignores surfaces crossed while moving up', () => {
    expect(findLanding({ x: 0, y: 28 }, { x: 0, y: 32 }, SURFACES)).toBeNull();
  });

  it('ignores a crossing beside the surface', () => {
    expect(findLanding({ x: 20, y: 31 }, { x: 20, y: 29 }, SURFACES)).toBeNull();
  });

  it('picks the higher surface when one frame crosses two', () => {
    const contact = findLanding({ x: 0, y: 35 }, { x: 0, y: -5 }, SURFACES);
    expect(contact?.surface.name).toBe('Top platform');
  });

  it('counts starting exactly on a surface and moving down as landing', () => {
    expect(findLanding({ x: 0, y: 0 }, { x: 1, y: -1 }, SURFACES)?.surface.name).toBe('Main stage');
  });
});
