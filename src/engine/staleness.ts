import { STALE_QUEUE_WEIGHTS } from './constants';

/** How many recent uses the stale queue holds. Older uses no longer count. */
export const STALE_QUEUE_LENGTH = STALE_QUEUE_WEIGHTS.length;

/**
 * The damage multiplier for a move used `recentUses` times among the attacker's last 9
 * moves that connected. Assumes those uses are the most recent ones (the move was used
 * that many times in a row), which is the usual case to check: 0 uses is fresh (1.0) and
 * 9 uses is fully stale (0.55).
 */
export function staleMultiplier(recentUses: number): number {
  const uses = Math.min(Math.max(Math.floor(recentUses), 0), STALE_QUEUE_LENGTH);
  let multiplier = 1;
  for (let position = 0; position < uses; position += 1) {
    multiplier -= STALE_QUEUE_WEIGHTS[position]!;
  }
  return multiplier;
}

/** The damage a hit actually deals after staleness. The game keeps the fraction. */
export function staledDamage(damage: number, recentUses: number): number {
  return damage * staleMultiplier(recentUses);
}
