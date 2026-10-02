import { useState } from 'react';
import classes from './characters.module.css';

interface CharacterIconProps {
  characterId: string;
  /** Used for the fallback letter; the icon itself is decorative. */
  name: string;
  size: number;
  isHighlighted?: boolean;
}

/**
 * Shows public/icons/characters/<characterId>.png. Until that file exists, it shows the
 * character's first letter instead, so the app works before any icons are added.
 */
export function CharacterIcon({
  characterId,
  name,
  size,
  isHighlighted = false,
}: CharacterIconProps) {
  const src = `${import.meta.env.BASE_URL}icons/characters/${characterId}.png`;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = failedSrc === src;

  return (
    <span
      className={classes.icon}
      data-highlighted={isHighlighted || undefined}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      aria-hidden="true"
    >
      {showFallback ? (
        name.charAt(0)
      ) : (
        <img src={src} alt="" width={size} height={size} onError={() => setFailedSrc(src)} />
      )}
    </span>
  );
}
