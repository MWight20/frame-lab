/// <reference types="vite/client" />

/** The clips in public/clips as "<characterId>/<moveId>", from vite/clipManifestPlugin.ts. */
declare module 'virtual:clip-manifest' {
  const clips: readonly string[];
  export default clips;
}
