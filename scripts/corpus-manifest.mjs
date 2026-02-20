import { promises as fs } from 'node:fs';
import path from 'node:path';

const referenceRoot = path.resolve('data/reference_corpus');
const corpusDir = path.join(referenceRoot, 'files');
const outputPath = path.join(referenceRoot, 'manifest.json');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!entry.name.toLowerCase().endsWith('.txt')) return [];
    return [full];
  }));
  return files.flat();
}

function toRelative(filePath) {
  return path.relative(referenceRoot, filePath).replace(/\\/g, '/');
}

async function collectCorpusStats(files) {
  const statList = await Promise.all(files.map(async (file) => {
    const s = await fs.stat(file);
    return {
      file,
      mtimeMs: Math.floor(s.mtimeMs),
      size: s.size
    };
  }));

  const lastModifiedMs = statList.reduce((max, s) => Math.max(max, s.mtimeMs), 0);
  const totalBytes = statList.reduce((total, s) => total + s.size, 0);

  return {
    fileCount: statList.length,
    totalBytes,
    lastModifiedMs
  };
}

export async function readManifest() {
  try {
    const raw = await fs.readFile(outputPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function buildManifest() {
  let files = [];
  try {
    files = await walk(corpusDir);
  } catch {
    files = [];
  }

  const docs = [];
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    docs.push({
      id: toRelative(file),
      title: path.basename(file, '.txt'),
      path: toRelative(file),
      excerpt: raw.slice(0, 220).replace(/\s+/g, ' ').trim()
    });
  }

  const stats = await collectCorpusStats(files);
  const manifest = {
    generatedAt: new Date().toISOString(),
    count: docs.length,
    stats,
    docs
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));

  return manifest;
}

export async function ensureManifestFresh() {
  let files = [];
  try {
    files = await walk(corpusDir);
  } catch {
    files = [];
  }

  const currentStats = await collectCorpusStats(files);
  const manifest = await readManifest();
  const previousStats = manifest?.stats;

  const unchanged = Boolean(previousStats)
    && previousStats.fileCount === currentStats.fileCount
    && previousStats.totalBytes === currentStats.totalBytes
    && previousStats.lastModifiedMs === currentStats.lastModifiedMs;

  if (unchanged) {
    return {
      updated: false,
      manifest,
      reason: 'No corpus changes detected.'
    };
  }

  const updatedManifest = await buildManifest();
  return {
    updated: true,
    manifest: updatedManifest,
    reason: 'Corpus changed, manifest rebuilt.'
  };
}

export const manifestPaths = {
  corpusDir,
  outputPath
};
