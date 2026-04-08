# expo-pretext — v0.3.0 Roadmap

## Performance: Port upstream Pretext fixes (Apr 5-8)

All fixes address O(n^2) → O(n) regressions on long texts (10k+ chars).

- [ ] **Quadratic punctuation merges** — `analysis.ts`: track repeatable single-char runs structurally so identical merges stay O(1) instead of re-scanning. [chenglou/pretext@30854d79]
- [ ] **CJK keep-all merges linear** — `analysis.ts` + `layout.ts`: avoid re-scanning accumulated segments during keep-all CJK merging. [chenglou/pretext@eb3bbbe5]
- [ ] **Degenerate breakable runs linear** — `line-break.ts`: restructure breakable width accumulation to avoid quadratic loops. [chenglou/pretext@39013c40]
- [ ] **Restore cached prefix fits** — `line-break.ts`: fix cache miss regression in prefix fit calculations. [chenglou/pretext@2ff48ab8]
- [ ] **Defer punctuation materialization** — `analysis.ts`: delay string materialization for repeated punctuation until actually needed. [chenglou/pretext@2148b904]
- [ ] **Arabic no-space merges linear** — `analysis.ts`: keep Arabic script no-space punctuation merges O(1). [chenglou/pretext@4cb8b244]

## Testing

- [ ] Add tests for `line-break.ts` line-breaking algorithm
- [ ] Add tests for `analysis.ts` text analysis and CJK detection
- [ ] Add tests for `rich-inline.ts` inline flow layout
- [ ] Add tests for `streaming.ts` append optimization
- [ ] Add hook tests (useTextHeight, useFlashListHeights) with mocked native module

## Documentation

- [ ] Add CONTRIBUTING.md with architecture overview and pipeline diagram
- [ ] Add inline comments for complex algorithms in `analysis.ts` and `line-break.ts`
