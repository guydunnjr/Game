# Plain Terms (Desktop MVP)

A desktop-ready MVP that translates pasted legal text into simpler plain English (3rd-grade default), flags potentially disadvantageous clauses, shows source citations, and exports a report.

## What this version does (no AI required)

- Works fully locally with deterministic software rules.
- Accepts pasted Terms of Service text.
- Shows source ↔ simplified mapping side by side for every clause.
- Flags common risky clauses (auto-renewal, arbitration, data sharing, unilateral changes, limited liability, account termination).
- Includes legal disclaimer at top and bottom of results.
- Exports markdown report with mappings, risks, citations, and repeated disclaimer.

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

## Accuracy plan toward 90%

For deterministic (non-AI) software, "90%" should be tracked against a benchmark set:

1. Build a benchmark corpus of 100+ real ToS docs.
2. Define expected outputs for:
   - clause splits,
   - plain-language rewrite correctness,
   - risk flag presence/absence,
   - clause citation correctness.
3. Add automated tests for parser + detector precision/recall.
4. Tune rule dictionary and regex patterns by failure category.
5. Report scorecard per release (precision, recall, F1, citation accuracy).

Without this benchmark + testing loop, a 90% claim is not reliable.

## Best production stack (aligned with your goals)

- **Desktop MVP:** Electron wrapper around deterministic local engine (this repo).
- **Scalable platform (next):** Next.js (frontend) + FastAPI (analysis API) + Postgres/Supabase (history, accounts, billing).
- **Monetized premium tier:** AI-assisted deep analysis + extra reading levels and tones.

## What you need to provide next

To help finalize a truly testable/launchable desktop product, provide:

1. Your operating system target(s): Windows only, or also macOS/Linux.
2. A sample pack of ToS documents you care most about.
3. Your success metric definitions (what counts as a "correct" simplification and risk flag).
4. Branding assets (app name confirmation, logo, preferred colors).
5. Whether you want portable EXE only or installer-based setup too.
