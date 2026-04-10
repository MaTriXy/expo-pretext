# expo-pretext TODO

> Ordered by priority. Checked items are shipped.

---

## ~~P0 — v0.3.x (DONE)~~ ✅

- [x] 8 upstream O(n²)→O(n) perf fixes ported
- [x] 220→270 automated tests, all core modules covered

## ~~P1 — v0.4.0-0.5.0 (DONE)~~ ✅

- [x] Token-level streaming API (getLastLineWidth, measureTokenWidth, useStreamingLayout)
- [x] useFlashListHeights batch pre-warming via measureHeights
- [x] FlashList 2.3.1 + RN 0.79 Fabric + Expo SDK 53 verified
- [x] Expo Web support (Canvas + Intl.Segmenter backend)

## ~~P2 API Additions — v0.6.0 (DONE)~~ ✅

- [x] fitFontSize — binary search for optimal font size in a box
- [x] truncateText — truncate to N lines with ellipsis
- [x] customBreakRules — callback to override line break opportunities
- [x] useMultiStreamLayout — parallel AI streaming hook

---

## Tier 1: AI Chat Experience — v0.6.1–v0.6.2

> Primary use case. AI chat apps need these immediately.

### v0.6.1 — Upstream JS triage + Typewriter effect

- [ ] Triage upstream #120 (rich-inline CJK overflow) — check if exists in our `rich-inline.ts`
- [ ] Triage upstream #121 (layoutNextLine mismatch) — check against our `layout.ts`
- [ ] Triage upstream #119 (skip no-op merges) — check against our `analysis.ts`
- [ ] Triage upstream #105 (currency symbol line-break) — check against our `analysis.ts`
- [ ] **Typewriter effect** — `useTypewriterLayout` hook. Token-by-token reveal with pre-calculated line wrapping. Extends `useStreamingLayout` + `layoutWithLines()`.

### v0.6.2 — Code block height prediction

- [ ] **Code block syntax-aware height** — `measureCodeBlockHeight()` utility. Monospace font + `whiteSpace: 'pre-wrap'` + optional language-aware break rules. First: investigate if `prepare()` with monospace style already works.

---

## Tier 2: Flagship Demos — v0.6.3–v0.6.5 → v0.7.0

> Community demand. Wow factor and adoption drivers.

### v0.6.3 — useObstacleLayout hook + Text morphing

- [ ] **useObstacleLayout hook** — Promote `layoutColumn()` to React hook with memoization + optional Gesture Handler drag. `layoutColumn()` is 100% functional (193 lines), hook wraps it.
- [ ] **Text morphing** — `useTextMorphing` hook. Animate line-by-line from "Thinking..." to final response. Uses `layoutWithLines()` for both states, interpolates between line sets.

### v0.6.4 — useAnimatedTextHeight + Collapsible sections

- [ ] **useAnimatedTextHeight** — Reanimated `SharedValue<number>` wrapping `layout()`. Smooth height transitions. New optional peer dep: `react-native-reanimated`.
- [ ] **Collapsible sections** — `useCollapsibleHeight` hook. Pre-compute expanded + collapsed heights, animate between with Reanimated.

### v0.6.5 — Pinch-to-zoom text

- [ ] **Pinch-to-zoom text** — `usePinchToZoomText` hook. fontSize changes per gesture frame. layout() at 0.0002ms = 120+ layouts per frame. First on React Native (web equivalent `pinch-type` has 104 stars).

### v0.7.0 — Animation & AI Suite Release

- [ ] Version bump, README update, CHANGELOG, demo app updates

---

## Tier 3: Production Readiness — v0.7.1–v0.7.3

> Real-world app requirements for App Store / Play Store shipping.

### v0.7.1 — Dynamic Type / Accessibility

- [ ] **Dynamic Type / Accessibility** — `PixelRatio.getFontScale()` listener + `clearCache()` + auto re-prepare. WCAG compliance. `pretext-a11y` exists in ecosystem.

### v0.7.2 — iOS/Android reconciliation + native investigation

- [ ] **iOS/Android reconciliation** — consistent-height mode across platforms. Merges: Android `TextPaint.breakText()` investigation + iOS `NSLayoutManager` tradeoffs. Goal: cross-platform normalization via `engine-profile.ts`.

### v0.7.3 — Font metrics API

- [ ] **Font metrics API** — ascender, descender, x-height, cap-height from native (iOS UIFont + Android Paint.FontMetrics). Web fallback via Canvas `measureText()`.

---

## Tier 4: DX & Optimization — v0.7.4 → v0.8.0

> Developer experience for adopters.

### v0.7.4 — Developer tools

- [ ] **Debug overlay** — `<PretextDebugOverlay>` showing predicted vs actual heights, cache hit/miss, timing
- [ ] **Snapshot testing** — `expectHeightSnapshot(texts, style, width)` for CI regression detection
- [ ] **Performance budget** — `prepare(text, style, { budgetMs: 5 })` — estimate fallback if native exceeds budget

### v0.8.0 — Production Ready Release

- [ ] Full audit, version bump, documentation update

---

## Tier 5: Engine Optimization — v0.8.x

- [ ] Profile and optimize `prepare()` batch throughput (native-bound, 15ms/500 texts)
- [ ] Hermes `Intl.Segmenter` — lightweight C++ fallback if spread-operator grapheme splitting bottlenecks
- [ ] iPad split-screen / foldable — optimized relayout batch on frequent width changes

---

## Excluded (application-layer, not library)

- ~~Object detection labels~~ — ML model integration, not text layout
- ~~Live translation overlay~~ — OCR + translation, not text layout
- ~~AR text annotations~~ — 3D scene management, not text layout
- ~~AI live video analysis~~ — video processing, not text layout
- ~~Smart subtitle positioning~~ — face detection is external; obstacle layout already supports rect obstacles
- ~~Text-around-video~~ — niche; obstacle layout already handles rect obstacles

---

## Principles (not tasks)

- Accuracy demo = primary canary. Every release: PASS on all test widths.
- CJK most sensitive, Arabic/Georgian/Thai secondary canaries.
- AI chat demo = primary dogfood. Editorial demos = rich line API dogfood.
- Native measurement = ground truth. JS fallback = safety net.
- Keep layout() allocation-light. prepare() is the bottleneck.
- Never blindly port upstream web fixes — our native backends differ fundamentally.
- Each task: analyze code → implement → audit → test → verify → commit → next.

## Not worth doing

- Full markdown renderer in core
- Measurement in layout()
- Font loading/management (expo-font's job)
- Text rendering (RN Text's job)
- Cache tuning knobs in public API
- Pixel-perfect accuracy as product claim
- onLayout fallback reconciliation

## Open design questions

- Whether prepareStreaming should carry forward line-break state
- Whether whiteSpace: 'pre-wrap' should handle configurable tab stops
- Whether obstacle layout should support arbitrary shapes (upstream #99)
- Whether measureNaturalWidth should extend to rich inline flow
- Whether a validateFont utility should be exported
- Whether a diagnostic verify mode (JS vs native comparison) is worth having
- Whether typewriter and morphing hooks need a shared animation primitive
