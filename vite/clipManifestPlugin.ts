import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const MODULE_ID = 'virtual:clip-manifest';
const RESOLVED_MODULE_ID = `\0${MODULE_ID}`;

/** Lists "<characterId>/<moveId>" for every public/clips/<characterId>/<moveId>.mp4. */
export function listClips(clipsDir: string): string[] {
  if (!existsSync(clipsDir)) return [];

  const clips: string[] = [];
  for (const entry of readdirSync(clipsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(path.join(clipsDir, entry.name))) {
      if (file.endsWith('.mp4')) clips.push(`${entry.name}/${file.slice(0, -'.mp4'.length)}`);
    }
  }
  return clips.sort();
}

/**
 * Provides `virtual:clip-manifest`: the list of clips in public/clips. The app uses it to
 * leave out the clip player for moves without a clip, instead of loading a missing file and
 * waiting for it to fail. In dev, adding or removing a clip reloads the page with a fresh list.
 */
export function clipManifestPlugin(): Plugin {
  let clipsDir = '';

  return {
    name: 'frame-lab:clip-manifest',

    configResolved(config) {
      clipsDir = path.join(config.publicDir, 'clips');
    },

    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_MODULE_ID : undefined;
    },

    load(id) {
      if (id !== RESOLVED_MODULE_ID) return undefined;
      return `export default ${JSON.stringify(listClips(clipsDir))};`;
    },

    configureServer(server) {
      function reloadIfClip(file: string) {
        const isClip = path.normalize(file).startsWith(clipsDir) && file.endsWith('.mp4');
        if (!isClip) return;
        const manifest = server.moduleGraph.getModuleById(RESOLVED_MODULE_ID);
        if (manifest) server.moduleGraph.invalidateModule(manifest);
        server.ws.send({ type: 'full-reload' });
      }

      server.watcher.add(clipsDir);
      server.watcher.on('add', reloadIfClip);
      server.watcher.on('unlink', reloadIfClip);
    },
  };
}
