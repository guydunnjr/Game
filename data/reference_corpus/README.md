# Reference Corpus Folder

Place your Terms of Service `.txt` files in `data/reference_corpus/files/`.

Then run:

```bash
node scripts/build-corpus-manifest.mjs
```

This creates `data/reference_corpus/manifest.json`, which the app reads to show integrated reference coverage.
