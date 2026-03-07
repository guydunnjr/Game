# Reference Corpus Folder (Offline Use)

Place your Terms of Service `.txt` files in `data/reference_corpus/files/`.

In this version, corpus files are **not** loaded or scanned by the app at startup.
They are used only for offline lexicon candidate generation:

```bash
npm run build-lexicon-candidates
```
