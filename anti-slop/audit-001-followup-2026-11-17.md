# antislop audit 001: follow-up

Date: 2026-11-17
Approved: all 12 findings from `audit-001-2026-11-17.md`
Branch: `docs/design-md` (not committed)

## What changed

| # | Finding | Fix | Files |
|---|---|---|---|
| 1 | White on green fails in dark mode (2.27:1) | New `on-accent` token: white in light (5.04:1), `#0f1a14` in dark (7.85:1). Used by every filled green button and the coach step numbers | `globals.css`, `page.tsx`, `scan/page.tsx`, `CoachCard.tsx` |
| 2 | No pointer cursor | Base rule: pointer on enabled buttons, links, labels, summary, select; `not-allowed` on disabled buttons | `globals.css` |
| 3 | No hover or press states | `btn-primary` (darker or lighter fill on hover, press shrink) and `btn-secondary` (green border on hover, press shrink) on every main control. Goal presets get a green border on hover and `aria-pressed`. Delete buttons get a tinted circle on hover, the dish name underlines, "Reset today" underlines, and the shutter grows slightly | `globals.css`, `page.tsx`, `scan/page.tsx`, `CameraCapture.tsx`, `DishList.tsx` |
| 4 | Rename field hides focus, label not visible | Global 2px green `focus-visible` outline. The rename field drops `outline-none` and has a visible label: "Dish name (Enter to save, Esc to cancel)" | `globals.css`, `DishList.tsx` |
| 5 | Wrong empty state on load | Before saved data is read: ring and bars show "–", the caption says "Loading today…", the list says "Loading today's meals…", and the goal button says "Goal" | `page.tsx`, `MacroRing.tsx` |
| 6 | Decorative emoji | Removed 📷 and 🍱. Owner approved dropping them ("Fix all 12"); `DESIGN.md` now says no emoji | `page.tsx`, `CoachCard.tsx`, `DESIGN.md` |
| 7 | Uppercase wide-tracked labels | "Coach" and "What we see" are now sentence-case headings; the instruction moved to a muted line below | `CoachCard.tsx`, `scan/page.tsx` |
| 8 | Geist had no reason | Kept Geist and wrote the reason in `DESIGN.md`: clear tabular figures for a numbers-first app, quiet next to the CJK system font. Warmth comes from color and copy | `DESIGN.md` |
| 9 | No dials | Design Read added: ENERGY 2 / RHYTHM 1 / MOTION 2, with a reason for each | `DESIGN.md` |
| 10 | No focal number | Scan result: kcal is one 48px number, with protein, carbs and fat in a smaller row beside it (`<dl>`) | `scan/page.tsx` |
| 11 | Theme reason missing | `DESIGN.md` explains why the app follows the phone's theme instead of a toggle | `DESIGN.md` |
| 12 | Chinese names read as English | `lang="zh-Hant"` on dish local names | `DishList.tsx` |

## Delivery Gate

### Block 1: Hard Gate

- **R-02 PASS:** searched `app/` and `components/` for `—`; none.
- **R-03 PASS:** at 375px, page width is 375 with no horizontal scroll on Today and Scan; delete buttons measure 44x44.
- **R-17, R-36, R-38 PASS:** numbers are photo estimates labeled "Real values can differ by 20% or more"; the demo result is labeled as a sample.
- **R-18, R-24, R-28 PASS:** no testimonials, navbar or FAQ.
- **R-23 PASS:** no generated logo or avatars; the product name is text.
- **R-25 PASS:** every text pair passes in both themes (contrast tool results in `DESIGN.md`). Measured in the browser: dark Save button `rgb(15,26,20)` on `rgb(92,191,133)`; light Scan button white on `#2f7d4f`.
- **R-26 PASS:** every control has a real action (see R-35).
- **R-27 PASS:** Today has loading ("Loading today's meals…", verified in the server-rendered HTML), empty ("Nothing logged yet") and data states. Scan has analyzing, error (Try again / Retake), no-food and result states.
- **R-32 PASS:** Tab moved focus to "Goal: Maintain" with a 2px solid green outline; the rename field opens focused with the same outline; Enter saves and Esc cancels.
- **R-33 PASS:** all changes are in source files; no patch scripts.
- **R-34 PASS:** no toggle; the app follows the system theme and both themes were checked.
- **R-35 PASS:** `npm run lint` clean, `npm run build` succeeded, no console errors. Click-through, element by element:
  - Goal button opens the goal panel.
  - Lose weight preset sets "Goal: Lose weight", ring 1700, `aria-pressed=true`.
  - Maintain preset restores the goal.
  - Scan a meal goes to `/scan`.
  - Upload photo (test image) shows the analyzing state, then the demo result.
  - Rename shows the labeled field; "Steamed rice" + Enter renames the dish.
  - More (+) changes kcal 945 → 1120 (1½×); reset returns it to 945.
  - Remove (×) takes the list from 5 dishes to 4.
  - Save to today returns to `/` with the meal listed and the ring at 1505 kcal left.
  - Delete (×) on Today removes the meal.
- **R-37 PASS:** `DESIGN.md` gives direction, including the dials.
- **R-39 PASS:** pointer cursor computed on Goal, Upload and Save; hover rules for `btn-primary` and `btn-secondary` are present in the served stylesheet; every icon button has an `aria-label`; the meal photo has alt text and thumbnails use `alt=""`; the rename field has a visible label; reduced motion turns off the pulse and the ring and bar animation; `<html lang="en">` with `zh-Hant` on Chinese names, a `<title>`, `header` and `main` landmarks, and one `h1` per page.
- **R-40 PASS:** images sized by CSS or `aspect-ratio`; no third-party scripts. No performance numbers reported (not measured).

### Block 2: Purpose-Gate

- **R-01, R-07, R-10, R-13 PASS:** no gradients, background patterns, glass or glow.
- **R-04 PASS:** no emoji. The remaining glyphs (←, ×, ✎, −, +) are functional controls with accessible names.
- **R-06 PASS:** no uppercase or wide tracking; Geist's reason is written in `DESIGN.md`.
- **R-08, R-09 PASS:** no decorative arrows; the confidence pill marks a real state.
- **R-12 PASS:** shadows only on the ring card and the two primary capture controls, with the reason in `DESIGN.md`.
- **R-14, R-22 PASS:** no feature cards or illustrations.
- **R-19 PASS:** motion matches MOTION 2: value transitions and press feedback only, with no loops except the analyzing spinner (shown only while waiting).

### Block 3: Liveliness

- Dials declared: ENERGY 2 / RHYTHM 1 / MOTION 2.
- Output matches the dials: same card shapes on every screen (RHYTHM 1); motion only on value change and press (MOTION 2).
- Focal points: Today, the kcal-left ring; Scan result, the 48px kcal number.
- Whitespace is structural: section spacing separates the total, coach, dishes and actions.
- One accent: green, for progress, the primary action and the coach.
- Identity motif: the three fixed macro colors plus Chinese dish names beside English.
- Design Read is in `DESIGN.md`.

### Block 4: Craftsmanship & Quality Locks

- **C-1 to C-5 PASS:** see the Hard Gate and Liveliness evidence above.
- **R-05, R-11, R-14 PASS:** no template layout. The radius system is cards 3xl, inner 2xl, inputs lg, buttons and chips full.
- **R-15, R-16 PASS:** CTAs are "Scan a meal" and "Save to today"; no buzzwords.
- **R-20, R-21, R-29, R-30, R-31 PASS:** reasons for color, theme, type, layout and motion are written in `DESIGN.md`.

## Not verified

- **Hover, visually:** hover states were confirmed in the served CSS. The browser pane wasn't drawing during most of the run, so I couldn't hover with a real pointer.
- **Clicks:** some were triggered from inside the page (`element.click()`) after two pointer clicks missed for the same reason. Each still ran the real handler and was checked by its result.
- **Camera capture:** camera access is blocked in the test browser. The upload path was tested instead.
- **"Reset today" and "Try again":** "Reset today" (opens a confirm dialog) and the error state's "Try again" were checked by reading the code, not clicked.
