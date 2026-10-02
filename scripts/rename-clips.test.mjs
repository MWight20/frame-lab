import { describe, expect, it } from 'vitest';
import { parseClipName, planFolder } from './rename-clips.mjs';

describe('parseClipName', () => {
  it('maps plain clip-pack names to move ids', () => {
    expect(parseClipName('uSmash')).toEqual({ moveId: 'usmash', variant: '' });
    expect(parseClipName('AirNB')).toEqual({ moveId: 'aneutralb', variant: '' });
    expect(parseClipName('fTiltHi')).toEqual({ moveId: 'uaft', variant: '' });
    expect(parseClipName('rollForw')).toEqual({ moveId: 'rollforward', variant: '' });
  });

  it('turns anything after the move into a hyphenated variant', () => {
    expect(parseClipName('fSmashHi')).toEqual({ moveId: 'fsmash', variant: 'hi' });
    expect(parseClipName('downBSleepyBoulder')).toEqual({
      moveId: 'downb',
      variant: 'sleepy-boulder',
    });
    expect(parseClipName('AirSideB-NOFx')).toEqual({ moveId: 'asideb', variant: 'nofx' });
  });

  it('uses FightCore ids for Dancing Blade parts', () => {
    expect(parseClipName('sideB-part3upB')).toEqual({ moveId: 'sideb3up', variant: '' });
  });

  it('leaves names that are already move ids unchanged', () => {
    expect(parseClipName('usmash')).toEqual({ moveId: 'usmash', variant: '' });
  });

  it('returns null for names with no matching move', () => {
    expect(parseClipName('stillThrow')).toBeNull();
  });
});

describe('planFolder', () => {
  it('promotes the middle forward smash angle when there is no plain clip', () => {
    const { renames } = planFolder(['fSmashHi.mp4', 'fSmashMid.mp4', 'fSmashLow.mp4']);
    expect(renames).toContainEqual({ from: 'fSmashMid.mp4', to: 'fsmash.mp4' });
    expect(renames).toContainEqual({ from: 'fSmashHi.mp4', to: 'fsmash-hi.mp4' });
  });

  it('leaves clips that would collide alone', () => {
    const { renames, collisions } = planFolder(['rollback.mp4', 'rolllBack.mp4', 'nAir.mp4']);
    expect(renames).toEqual([{ from: 'nAir.mp4', to: 'nair.mp4' }]);
    expect(collisions).toHaveLength(1);
  });
});
