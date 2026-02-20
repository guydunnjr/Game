import { promises as fs } from 'node:fs';
import path from 'node:path';

const corpusDir = path.resolve('data/reference_corpus/files');
const outputPath = path.resolve('data/reference_corpus/manifest.json');

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

async function main() {
  let files = [];
  try {
    files = await walk(corpusDir);
  } catch {
    files = [];
  }

  const docs = [];
  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const relativePath = path.relative(path.resolve('data/reference_corpus'), file).replace(/\\/g, '/');
    docs.push({
      id: relativePath,
      title: path.basename(file, '.txt'),
      path: relativePath,
      excerpt: raw.slice(0, 220).replace(/\s+/g, ' ').trim()
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    count: docs.length,
    docs
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Wrote ${docs.length} docs -> ${outputPath}`);
}

main();
