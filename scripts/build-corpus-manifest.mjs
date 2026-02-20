import { buildManifest, manifestPaths } from './corpus-manifest.mjs';

const manifest = await buildManifest();
console.log(`Wrote ${manifest.count} docs -> ${manifestPaths.outputPath}`);
