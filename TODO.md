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

## P2 Remaining — v0.7.0

### Animation & interactive layout

- [ ] **useAnimatedTextHeight** — Reanimated integration. Smooth height transitions for streaming, edit, expand/collapse.
- [ ] **useObstacleLayout hook** — Promote Editorial Engine pattern to reusable hook. Drag obstacle → text reflows at 60fps.
- [ ] **Collapsible sections** — Pre-compute heights for expanded + collapsed states. Animate between them.
- [ ] **Pinch-to-zoom text** — fontSize changes per gesture frame. layout() at 0.0002ms = 120+ layouts per frame.

### Developer experience

- [ ] **Debug overlay** — `<PretextDebugOverlay>` showing predicted vs actual heights, cache hit/miss, timing
- [ ] **Snapshot testing** — `expectHeightSnapshot(texts, style, width)` for CI regression detection
- [ ] **Performance budget** — `prepare(text, style, { budgetMs: 5 })` — estimate fallback if native exceeds budget

### Engine improvements

- [ ] Android: investigate `TextPaint.breakText()` for more accurate line-break prediction
- [ ] iOS: explore `NSLayoutManager` vs `NSString.size` tradeoffs
- [ ] Hermes `Intl.Segmenter` — lightweight C++ fallback if spread-operator grapheme splitting bottlenecks
- [ ] Profile and optimize `prepare()` batch throughput (native-bound, 15ms/500 texts)

### Native API additions

- [ ] **Font metrics API** — ascender, descender, x-height, cap-height from native (iOS UIFont + Android Paint.FontMetrics)

---

## P3 — v1.0+ (long-term vision)

### Camera & AR integration

- [ ] **Object detection labels** — ML detects objects, text labels avoid overlapping via obstacle layout
- [ ] **Live translation overlay** — OCR → translate → fit in same bounding box
- [ ] **AR text annotations** — text bubbles in 3D scene, obstacle layout prevents overlap
- [ ] **AI live video analysis** — streaming commentary overlay on camera feed
- [ ] **Smart subtitle positioning** — face detection → obstacles, subtitles flow around faces

### Advanced streaming

- [ ] **Typewriter effect** — token-by-token reveal with pre-calculated line wrapping
- [ ] **Text morphing** — animate line-by-line from "Thinking..." to final response
- [ ] **Text-around-video** — inline video, text flows around, video resizes with instant reflow
- [ ] **Code block syntax-aware height** — monospace with syntax highlighting wrapping

### Platform

- [ ] **iOS/Android reconciliation** — consistent-height mode across platforms
- [ ] **Dynamic Type / Accessibility** — detect system font scale changes, auto-invalidate caches
- [ ] **iPad split-screen / foldable** — optimized relayout batch on frequent width changes

---

## Principles (not tasks)

- Accuracy demo = primary canary. Every release: PASS on all test widths.
- CJK most sensitive, Arabic/Georgian/Thai secondary canaries.
- AI chat demo = primary dogfood. Editorial demos = rich line API dogfood.
- Native measurement = ground truth. JS fallback = safety net.
- Keep layout() allocation-light. prepare() is the bottleneck.

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
- Whether obstacle layout should support arbitrary shapes
- Whether measureNaturalWidth should extend to rich inline flow
- Whether a validateFont utility should be exported
- Whether a diagnostic verify mode (JS vs native comparison) is worth having
