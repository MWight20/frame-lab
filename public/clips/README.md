# Move clips

Each clip goes in a folder named after the character id, with the move id as the file name:

```
public/clips/fox/usmash.mp4
public/clips/marth/fsmash.mp4
```

Character ids are in `src/data/roster.json`. Move ids are the `id` fields in
`src/data/characters/<character>.json` (for example `jab1`, `ftilt`, `usmash`, `nair`,
`upb`, `fthrow`). Characters with imported data have an `EXPECTED_CLIPS.md` in their folder
listing every file name to use.

## Clip format

- MP4 (H.264), no audio track needed, 60 fps.
- The first frame of the clip should be frame 1 of the move, and the clip should end on the
  move's last frame. The player counts frames from the start of the file, so this keeps the
  frame counter and the highlighted frame in the strip matching the game.
- Use the same framing and zoom for every clip if you can.

To cut one loop out of a longer Dolphin frame dump:

```bash
ffmpeg -i framedump.avi -ss 1.20 -frames:v 41 -vf "crop=720:540:120:0,scale=960:-2" \
  -an -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart usmash.mp4
```

`-ss` is where the move starts and `-frames:v` is the move's total frame count. Adjust
`crop` to your framing.
