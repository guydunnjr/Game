import { promises as fs } from 'node:fs';
import path from 'node:path';

const corpusDir = path.resolve('data/reference_corpus/files');
const outDir = path.resolve('data/lexicons/generated');
const outPath = path.join(outDir, 'candidate_terms.json');

const STOP = new Set([
  'the','and','for','with','that','this','from','have','will','your','you','our','are','not','any','all','may','can','use','using','into','out','such','their','they','them','these','those','been','being','under','than','then','but','its','also','other','more','most','must','shall'
]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    if (!entry.name.toLowerCase().endsWith('.txt')) return [];
    return [full];
  }));
  return nested.flat();
}

function tokenize(text) {
  return text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 6 && !STOP.has(w));
}

function bump(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function topEntries(map, limit = 300) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

async function main() {
  let files = [];
  try {
    files = await walk(corpusDir);
  } catch {
    files = [];
  }

  const unigram = new Map();
  const bigram = new Map();

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const tokens = tokenize(raw);
    tokens.forEach((tok, i) => {
      bump(unigram, tok);
      if (i < tokens.length - 1) {
        bump(bigram, `${tok} ${tokens[i + 1]}`);
      }
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceDocCount: files.length,
    instructions: [
      'Feed top terms/phrases into your AI process to propose legalese->grade3 mappings.',
      'Review outputs manually before merging into data/lexicons/legalese_to_grade3.json.'
    ],
    topSingleTerms: topEntries(unigram, 250),
    topPhrases: topEntries(bigram, 250)
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote lexicon candidates from ${files.length} docs -> ${outPath}`);
}

main();
