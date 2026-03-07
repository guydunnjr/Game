# Plain Terms (Desktop MVP)

A desktop-ready MVP that translates pasted legal text into simpler plain English (3rd-grade default), flags potentially disadvantageous clauses, shows source citations, and exports a report.

## What this version does

- Works locally with a deterministic lexicon engine.
- Accepts pasted Terms of Service text.
- Shows source ↔ simplified mapping side by side for every clause.
- Shows parent clauses and nested sub-clauses with bullet explanations.
- Supports an optional AI tie-in endpoint (if enabled) with local fallback.
- Flags common risky clauses (auto-renewal, arbitration, data sharing, unilateral changes, limited liability, account termination).
- Includes legal disclaimer at top and bottom of results.
- Exports markdown report with mappings, bullet explanations, risks, citations, and repeated disclaimer.
- Reads integrated reference corpus metadata from `data/reference_corpus/manifest.json`.

## Google Drive corpus integration (what I changed + what you need to do)

I could not download directly from your Google Drive link in this environment because outbound package/download access is restricted by a proxy policy. To keep moving, the app now includes a built-in corpus folder and manifest builder.

### Steps for you (Windows friendly)

1. Download your 203 MB corpus zip from Drive to your computer.
2. Unzip it.
3. Put all `.txt` files in `data/reference_corpus/files/` (subfolders are okay).
4. Run:

```bash
node scripts/build-corpus-manifest.mjs
```

5. Launch app (`npm start` for desktop, or static server for browser test).

The app will show how many integrated reference docs were loaded.


## Automatic manifest refresh on app open

When the desktop app opens, it now checks the corpus folder and compares:

- number of `.txt` files,
- total bytes,
- latest file modified time.

If nothing changed since last run, it **skips rebuilding** to avoid unnecessary rescans.
If anything changed, it rebuilds `data/reference_corpus/manifest.json` automatically.


## Where to put your corpus so I can use it

Put your corpus files here:

- `data/reference_corpus/files/`

You can keep nested folders. Just make sure each document is a `.txt` file.

After placing files, run:

```bash
npm run build-manifest
npm run build-lexicon-candidates
```

This writes:

- `data/reference_corpus/manifest.json` (corpus index)
- `data/lexicons/generated/candidate_terms.json` (AI-ready legal term candidates)

## Local browser run (quickest)

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Desktop EXE run (Windows)

### 1) Prerequisites

- Install Node.js LTS (includes npm): <https://nodejs.org>
- Windows machine for `.exe` build.

### 2) Install dependencies

```bash
npm install
```

### 3) Build reference manifest (optional manual run)

```bash
npm run build-manifest
```

If Bash gives you trouble on Windows, run the same script from Command Prompt:

```cmd
node scripts\build-corpus-manifest.mjs
```

### 4) Launch desktop app locally

```bash
npm start
```

### 5) Build portable `.exe`

```bash
npm run pack-win
```

Then open the generated app in `dist/`.


## AI lexicon workflow for your 90% target

To keep startup fast, do **not** preload all corpus text into the app UI. Instead:

1. Keep corpus files on disk in `data/reference_corpus/files/`.
2. Build candidate terms with `npm run build-lexicon-candidates`.
3. Use your AI process to convert top legal phrases into plain grade-3 terms.
4. Review and merge accepted mappings into `data/lexicons/legalese_to_grade3.json`.
5. Re-test against your benchmark set and track accuracy.

## Does this improve efficiency?

Yes, in two ways:

1. **Fast path:** the local lexicon translator avoids an external model call and returns results quickly.
2. **Smart fallback:** AI tie-in is optional; when AI is unavailable, the local translator still runs instantly.

This design usually lowers average translation latency and can lower compute/API costs when many clauses map cleanly through lexicon rules.

## In-depth explanation of steps 3, 4, and 5 (3rd-grade level)

- **Step 3 (build-manifest):**
  - Think of this like making a table of contents.
  - The app looks at all your ToS text files and writes a list so it can find them fast.

- **Step 4 (start app):**
  - This opens your app on your computer.
  - You can paste Terms text and click Analyze.

- **Step 5 (pack-win):**
  - This wraps your app into a Windows `.exe` file.
  - Then you can click the `.exe` and run it like a normal desktop app.

## Accuracy plan toward 90%

For deterministic + optional AI hybrid software, "90%" should be tracked against a benchmark set:

1. Build a benchmark corpus from your ToS docs.
2. Define expected outputs for:
   - clause splits,
   - plain-language rewrite correctness,
   - risk flag presence/absence,
   - clause citation correctness.
3. Add automated tests for parser + detector precision/recall.
4. Tune lexicon and regex patterns by failure category.
5. Report scorecard per release (precision, recall, F1, citation accuracy).

Without this benchmark + testing loop, a 90% claim is not reliable.

## Best production stack (aligned with your goals)

- **Desktop MVP:** Electron wrapper around deterministic local engine + optional AI endpoint tie-in.
- **Scalable platform (next):** Next.js (frontend) + FastAPI (analysis API) + Postgres/Supabase (history, accounts, billing).
- **Monetized premium tier:** AI-assisted deep analysis + extra reading levels and tones.

## Lexicon notes

- `data/lexicons/legalese_to_grade3.json`: legalese-to-plain mapping.
- `data/lexicons/grade3_preferred_terms.json`: grade-3 preferred words and sentence starters.

These files are designed for iterative tuning as you review output quality.
