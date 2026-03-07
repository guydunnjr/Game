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

## Important change: corpus is now external to the app runtime

The app no longer builds or refreshes a corpus manifest at startup. Corpus processing is now an **offline workflow** used only to create and improve lexicons.

This keeps the desktop app faster and avoids heavy startup scans.

## Where you can put the corpus so I can use it to build lexicons

If you do not want Google Drive, any of these options work:

1. **In this repo directly (best for this environment):**
   - Put `.txt` files in `data/reference_corpus/files/`.
2. **A zip file copied into this repo:**
   - Example: `data/reference_corpus/corpus.zip` (then unzip into `files/`).
3. **GitHub repo (public or private):**
   - Share repo URL/path containing the text files.
4. **Cloud object storage link:**
   - AWS S3 pre-signed URL, Azure Blob SAS URL, or similar direct-download link.
5. **Local transfer into the project folder:**
   - Any method that results in files appearing under `data/reference_corpus/files/`.

## Offline lexicon-building workflow

After placing corpus files under `data/reference_corpus/files/`:

```bash
npm run build-lexicon-candidates
```

This writes:

- `data/lexicons/generated/candidate_terms.json`

Use that file as the input for AI-assisted mapping proposals, then merge approved mappings into:

- `data/lexicons/legalese_to_grade3.json`

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

### 3) Launch desktop app locally

```bash
npm start
```

### 4) Build portable `.exe`

```bash
npm run pack-win
```

Then open the generated app in `dist/`.

## Does this improve efficiency?

Yes:

1. The app does not scan a large corpus on startup anymore.
2. Corpus processing happens offline only when you choose to regenerate lexicon candidates.
3. Runtime stays focused on paste → analyze → export.
