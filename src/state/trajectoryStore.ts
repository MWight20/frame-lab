import { create } from 'zustand';
import { getCharactersWithData } from '../data/characters';
import { NEUTRAL_STICK, type Point, type StickPosition } from '../engine';

/**
 * Trajectory Lab settings: who gets hit, at what percent, from where, and with what DI.
 * Kept apart from `selectionStore` because nothing outside the lab uses these. The stage
 * and the selected hit still come from `selectionStore`, since the move viewer shares them.
 */
interface TrajectoryState {
  victimId: string;
  /** The victim's percent before the hit, as shown on screen. */
  victimPercent: number;
  isCrouching: boolean;
  stick: StickPosition;
  /** A hitbox name from the selected hit, or null for the strongest one. */
  hitboxName: string | null;
  /** Where the victim stands when the hit lands, in game units. */
  victimPosition: Point;
  isAttackerFacingLeft: boolean;
  /** Times the move appears in the attacker's stale queue (0 to 9); 0 is fresh. */
  staleUses: number;
  /** Whether a tumbling victim techs when they land on the stage or a platform. */
  techOnLanding: boolean;

  selectVictim: (victimId: string) => void;
  setVictimPercent: (percent: number) => void;
  setCrouching: (isCrouching: boolean) => void;
  setStick: (stick: StickPosition) => void;
  selectHitbox: (hitboxName: string | null) => void;
  setVictimPosition: (position: Point) => void;
  setAttackerFacingLeft: (isFacingLeft: boolean) => void;
  resetVictimPosition: () => void;
  setStaleUses: (staleUses: number) => void;
  setTechOnLanding: (techOnLanding: boolean) => void;
}

/** Marth is the usual reference victim; fall back to whoever has data. */
const PREFERRED_VICTIM_ID = 'marth';

/** A mid-match percent, so the first path you see is long enough to read. */
const DEFAULT_PERCENT = 80;

export const CENTER_STAGE: Point = { x: 0, y: 0 };

function defaultVictimId(): string {
  const withData = getCharactersWithData();
  return (
    (withData.find((character) => character.id === PREFERRED_VICTIM_ID) ?? withData[0])?.id ??
    PREFERRED_VICTIM_ID
  );
}

export const useTrajectoryStore = create<TrajectoryState>()((set) => ({
  victimId: defaultVictimId(),
  victimPercent: DEFAULT_PERCENT,
  isCrouching: false,
  stick: NEUTRAL_STICK,
  hitboxName: null,
  victimPosition: CENTER_STAGE,
  isAttackerFacingLeft: false,
  staleUses: 0,
  techOnLanding: false,

  selectVictim: (victimId) => set({ victimId }),
  setVictimPercent: (victimPercent) => set({ victimPercent }),
  setCrouching: (isCrouching) => set({ isCrouching }),
  setStick: (stick) => set({ stick }),
  selectHitbox: (hitboxName) => set({ hitboxName }),
  setVictimPosition: (victimPosition) => set({ victimPosition }),
  setAttackerFacingLeft: (isAttackerFacingLeft) => set({ isAttackerFacingLeft }),
  resetVictimPosition: () => set({ victimPosition: CENTER_STAGE }),
  setStaleUses: (staleUses) => set({ staleUses }),
  setTechOnLanding: (techOnLanding) => set({ techOnLanding }),
}));
