# expo-pretext TODO

> Ordered by priority. P0 = next release, P1 = near-term, P2 = medium-term, P3 = long-term vision.

---

## P0 — v0.3.0 (ship-blocking)

### Port upstream performance fixes

All fixes address O(n^2) → O(n) regressions on long texts. Critical for AI chat where assistant messages can be 5k+ characters.

- [ ] Quadratic punctuation merges — `analysis.ts` [chenglou/pretext@30854d79]
- [ ] CJK keep-all merges linear — `analysis.ts` + `build.ts` [chenglou/pretext@eb3bbbe5]
- [ ] Degenerate breakable runs linear — `line-break.ts` [chenglou/pretext@39013c40]
- [ ] Restore cached prefix fits — `line-break.ts` [chenglou/pretext@2ff48ab8]
- [ ] Defer punctuation materialization — `analysis.ts` [chenglou/pretext@2148b904]
- [ ] Arabic no-space merges linear — `analysis.ts` [chenglou/pretext@4cb8b244]

### Core test coverage

The library's core algorithms have no automated tests. This is the biggest quality gap.

- [ ] `line-break.ts` — line-breaking edge cases (long words, zero-width spaces, soft hyphens)
- [ ] `analysis.ts` — text analysis, CJK detection, kinsoku rules, whitespace normalization
- [ ] `streaming.ts` — append detection, cache warming, state management
- [ ] Integration test: `prepare()` + `layout()` round-trip accuracy vs native `measureTextHeight`

---

## P1 — v0.4.0 (near-term, high impact)

### Expo Web support

3x audience expansion. Original Pretext already has Canvas measurement — port the web path back.

- [ ] Canvas API measurement backend for `prepare()`
- [ ] Web-compatible hooks (useTextHeight, useFlashListHeights)
- [ ] Unified API — same code works on iOS, Android, Web

### AI streaming optimization

The #1 use case deserves dedicated optimization.

- [ ] **Token-level incremental layout** — O(1) per token: "does this fit on the current line?" instead of full re-prepare
- [ ] **Height change diffing** — "which lines changed?" for minimal re-render in virtualized lists
- [ ] **Speculative layout** — predict final height while streaming, pre-position scroll

### React Native compatibility

- [ ] FlashList v2 — test `overrideItemLayout` contract with upcoming release
- [ ] Fabric / TurboModules — verify native bridge under new architecture
- [ ] Expo SDK 54 — compatibility testing when released

### Testing (extended)

- [ ] `rich-inline.ts` — inline flow layout with mixed fonts and atomic elements
- [ ] Hook tests with mocked native module (useTextHeight, useFlashListHeights, usePreparedText)
- [ ] `useFlashListHeights` batch API usage (currently measures one-by-one instead of using `measureHeights`)

---

## P2 — v0.5.0 (medium-term, differentiation)

### Animation & interactive layout

- [ ] **useAnimatedTextHeight** — Reanimated integration. Smooth height transitions for streaming, edit, expand/collapse. Old height → new height interpolation without layout jumps.
- [ ] **useObstacleLayout hook** — Promote Editorial Engine pattern to reusable hook: `useObstacleLayout(text, style, obstacles, width)`. Drag obstacle → text reflows at 60fps.
- [ ] **Collapsible sections** — Pre-compute heights for expanded + collapsed states. Animate between them.
- [ ] **Pinch-to-zoom text** — fontSize changes per gesture frame. `layout()` at 0.0002ms = 120+ layouts per frame at 60fps.

### Developer experience

- [ ] **Debug overlay** — `<PretextDebugOverlay>` showing predicted vs actual heights, cache hit/miss, timing per element
- [ ] **Snapshot testing** — `expectHeightSnapshot(texts, style, width)` for CI regression detection
- [ ] **Performance budget** — `prepare(text, style, { budgetMs: 5 })` — estimate fallback if native exceeds budget

### Engine improvements

- [ ] Android: investigate `TextPaint.breakText()` for more accurate line-break prediction
- [ ] iOS: explore `NSLayoutManager` vs `NSString.size` tradeoffs
- [ ] Hermes `Intl.Segmenter` — lightweight C++ fallback if spread-operator grapheme splitting bottlenecks
- [ ] Profile and optimize `prepare()` batch throughput (native-bound, 15ms/500 texts)

### API additions

- [ ] **Text fitting** — "What fontSize fits this text in this box?" Binary search over `layout()`
- [ ] **Text truncation prediction** — "Where to cut text to fit N lines?" Returns truncation index
- [ ] **Font metrics API** — ascender, descender, x-height, cap-height from native
- [ ] **Custom line break rules** — break at `/` in URLs, `.` in decimals, camelCase boundaries
- [ ] **Multi-bubble parallel streaming** — multiple AI responses streaming simultaneously

---

## P3 — v1.0+ (long-term vision)

### Camera & AR integration

Integration with `react-native-vision-camera` and `expo-camera` for real-time text overlay:

- [ ] **Object detection labels** — ML detects objects, text labels avoid overlapping via obstacle layout
- [ ] **Live translation overlay** — OCR → translate → fit in same bounding box. `prepare()` + `layout()` guarantees fit
- [ ] **AR text annotations** — text bubbles in 3D scene, obstacle layout prevents overlap as camera moves
- [ ] **AI live video analysis** — streaming commentary overlay on camera feed, pre-measured for smooth 30fps
- [ ] **Smart subtitle positioning** — face detection → obstacles, subtitles flow around faces

### Advanced streaming

- [ ] **Typewriter effect** — token-by-token reveal with pre-calculated line wrapping and final height skeleton
- [ ] **Text morphing** — animate line-by-line from "Thinking..." to final response, both heights pre-known
- [ ] **Text-around-video** — inline video plays, text flows around it, video resizes (PiP → full) with instant reflow
- [ ] **Code block syntax-aware height** — monospace with syntax highlighting wrapping accounted for

### Platform

- [ ] **iOS/Android reconciliation** — consistent-height mode across platforms
- [ ] **Dynamic Type / Accessibility** — detect system font scale changes, auto-invalidate caches
- [ ] **iPad split-screen / foldable** — optimized relayout batch on frequent width changes

---

## Principles (not tasks)

### Accuracy canaries

- The accuracy demo screen is the primary canary. Every release: PASS on all test widths.
- CJK is the most sensitive canary — native vs segment-sum diverges most here.
- Arabic, Georgian, Devanagari, Thai are secondary canaries.
- Emoji ZWJ sequences test grapheme boundary detection.

### Demo strategy

- AI chat demo = primary dogfood for the #1 use case.
- Editorial/obstacle demos = dogfood for rich line APIs.
- MarkdownRenderer is an example, not a library export.
- Add new demos only when they expose uncovered behavior.

### Engine principles

- Native measurement (TextKit/TextPaint) is ground truth. JS fallback is a safety net.
- Keep `layout()` simple and allocation-light. Rich features go through `prepareInlineFlow` / obstacle layout.
- `prepare()` is the bottleneck. Optimization effort targets batch throughput.

---

## Not worth doing

- Full markdown renderer in core — example demonstrates the pattern
- Measurement in `layout()` — prepare-once-layout-many is the contract
- Font loading/management — that's `expo-font`
- Text rendering — this library predicts dimensions, `<Text>` renders
- Cache tuning knobs in public API — current LRU is sufficient
- Pixel-perfect accuracy as product claim — "close enough for smooth virtualization"
- `onLayout` fallback reconciliation — the whole point is to avoid it

---

## Open design questions

- Whether `prepareStreaming` should carry forward line-break state for truly incremental layout
- Whether `{ whiteSpace: 'pre-wrap' }` should grow to handle configurable tab stops
- Whether obstacle layout should support arbitrary shapes beyond circles and rectangles
- Whether `measureNaturalWidth` should extend to rich inline flow
- Whether a `validateFont` utility should be exported
- Whether bidi rendering concerns (selection, cursor positioning) belong in scope
- Whether a diagnostic verify mode (JS vs native comparison) is worth having
