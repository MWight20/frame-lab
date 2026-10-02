import { Anchor, Button, SegmentedControl } from '@mantine/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CLIP_CREDIT } from '../../data/credits';
import classes from './moves.module.css';

const FRAMES_PER_SECOND = 60;
const SPEED_OPTIONS = [
  { value: '0.25', label: '¼×' },
  { value: '0.5', label: '½×' },
  { value: '1', label: '1×' },
];

interface MoveClipProps {
  characterId: string;
  moveId: string;
  moveName: string;
  totalFrames: number | null;
  /** Called with the frame on screen (1-based) whenever it changes, or null without a clip. */
  onFrameChange: (frame: number | null) => void;
}

/**
 * Plays public/clips/<characterId>/<moveId>.mp4 on a loop, with frame-by-frame controls.
 * Clips are expected to start on the move's first frame (see public/clips/README.md).
 * Without a clip file, it shows where to put one.
 */
export function MoveClip({
  characterId,
  moveId,
  moveName,
  totalFrames,
  onFrameChange,
}: MoveClipProps) {
  const src = `${import.meta.env.BASE_URL}clips/${characterId}/${moveId}.mp4`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState('1');
  const [frame, setFrame] = useState<number | null>(null);
  const hasClip = failedSrc !== src;

  const reportFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const current = Math.floor(video.currentTime * FRAMES_PER_SECOND) + 1;
    setFrame(current);
    onFrameChange(current);
  }, [onFrameChange]);

  // While playing, read the video's position every animation frame.
  useEffect(() => {
    if (!hasClip || !isPlaying) return;
    let handle = requestAnimationFrame(function tick() {
      reportFrame();
      handle = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(handle);
  }, [hasClip, isPlaying, reportFrame]);

  useEffect(() => {
    if (!hasClip) onFrameChange(null);
  }, [hasClip, onFrameChange]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = Number(speed);
  }, [speed, src]);

  function togglePlaying() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function stepFrames(amount: number) {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const next = video.currentTime + amount / FRAMES_PER_SECOND;
    // Aim for the middle of the frame so rounding never lands on its neighbour.
    const frameIndex = Math.floor(Math.max(0, Math.min(next, duration)) * FRAMES_PER_SECOND);
    video.currentTime = (frameIndex + 0.5) / FRAMES_PER_SECOND;
    reportFrame();
  }

  return (
    <>
      <div className={classes.clip}>
        {hasClip ? (
          <>
            <video
              key={src}
              ref={videoRef}
              src={src}
              autoPlay
              loop
              muted
              playsInline
              aria-label={`${moveName} clip`}
              onError={() => setFailedSrc(src)}
              onSeeked={reportFrame}
            />
            {frame !== null && (
              <span className={classes.frameBadge}>
                Frame {frame}
                {totalFrames ? ` of ${totalFrames}` : ''}
              </span>
            )}
          </>
        ) : (
          <p className={classes.clipPlaceholder}>
            No clip yet. Add one at{' '}
            <code>
              public/clips/{characterId}/{moveId}.mp4
            </code>
          </p>
        )}
      </div>

      <div className={classes.controls}>
        <Button variant="default" disabled={!hasClip} onClick={() => stepFrames(-1)}>
          Previous frame
        </Button>
        <Button disabled={!hasClip} onClick={togglePlaying} miw={84}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button variant="default" disabled={!hasClip} onClick={() => stepFrames(1)}>
          Next frame
        </Button>
        <div className={classes.spacer} />
        <SegmentedControl
          aria-label="Playback speed"
          data={SPEED_OPTIONS}
          value={speed}
          onChange={setSpeed}
          disabled={!hasClip}
        />
      </div>

      {hasClip && (
        <p className={classes.clipCredit}>
          Clip by{' '}
          <Anchor href={CLIP_CREDIT.url} target="_blank" rel="noreferrer" inherit>
            {CLIP_CREDIT.author}
          </Anchor>
        </p>
      )}
    </>
  );
}
