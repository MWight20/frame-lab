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
 * Only rendered for moves that have a clip (see data/clips.ts).
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
  // Quarter speed by default, so individual frames are easy to follow.
  const [speed, setSpeed] = useState('0.25');
  const [frame, setFrame] = useState<number | null>(null);
  const hasFailed = failedSrc === src;

  const reportFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const current = Math.floor(video.currentTime * FRAMES_PER_SECOND) + 1;
    setFrame(current);
    onFrameChange(current);
  }, [onFrameChange]);

  // While playing, read the video's position every animation frame.
  useEffect(() => {
    if (hasFailed || !isPlaying) return;
    let handle = requestAnimationFrame(function tick() {
      reportFrame();
      handle = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(handle);
  }, [hasFailed, isPlaying, reportFrame]);

  useEffect(() => {
    if (hasFailed) onFrameChange(null);
  }, [hasFailed, onFrameChange]);

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

  // The file is listed but wouldn't play: say so in one line rather than show an empty player.
  if (hasFailed) {
    return <p className={classes.note}>The clip for this move couldn&apos;t be loaded.</p>;
  }

  return (
    <>
      <div className={classes.clip}>
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
      </div>

      <div className={classes.controls}>
        <Button variant="default" onClick={() => stepFrames(-1)}>
          Previous frame
        </Button>
        <Button onClick={togglePlaying} miw={84}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button variant="default" onClick={() => stepFrames(1)}>
          Next frame
        </Button>
        <div className={classes.spacer} />
        <SegmentedControl
          aria-label="Playback speed"
          data={SPEED_OPTIONS}
          value={speed}
          onChange={setSpeed}
        />
      </div>

      <p className={classes.clipCredit}>
        Clip by{' '}
        <Anchor href={CLIP_CREDIT.url} target="_blank" rel="noreferrer" inherit>
          {CLIP_CREDIT.author}
        </Anchor>
      </p>
    </>
  );
}
