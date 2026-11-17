# Bento Coach: Design

Bento Coach is a phone-first tool for checking a meal in the 30 seconds before you eat it. You're standing at a 自助餐 counter or holding a 便當 with one hand. The UI should feel like a friend who knows food glancing at your tray: warm, quick, specific. It shouldn't look like a fitness tracker or a medical chart.

## Design Read

Reading this as: a phone-first meal checker for people eating out in Taiwan, in a warm paper-and-food-colors language, dial ENERGY 2 / RHYTHM 1 / MOTION 2.

- **ENERGY 2:** friendly and warm (cream paper, food colors, one big number per screen), but it's a tool you use standing at a counter, not a poster.
- **RHYTHM 1:** screens stay predictable on purpose. The same card shapes repeat so the user always knows where kcal, macros and actions are.
- **MOTION 2:** transitions only where values change (ring and bar fills) plus press feedback. Nothing moves on its own.

## Personality

- **Warm, not clinical.** Cream paper background, rounded cards, food-colored macros. No sterile white or gray dashboards.
- **Local, not generic.** Taiwanese food names (滷蛋, 微糖, 三寶飯) appear as-is, next to English. They're content, not decoration.
- **Honest about uncertainty.** Every number comes from a photo estimate. Confidence levels, the "±20%" note and the demo banner stay visible and are never styled away.
- **Calm about going over.** Going over a goal is shown in orange (warn), never red, and never with alarm language. The coach suggests the next small change; it doesn't scold.

## Color

All colors are CSS tokens in `app/globals.css`, exposed to Tailwind (`bg-card`, `text-muted`, etc.). Never hard-code hex values in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#f7f3ec` | `#141816` | Page background (warm cream) |
| `card` | `#ffffff` | `#1d2320` | Cards, list rows, secondary buttons |
| `ink` | `#1f2a24` | `#edf0ee` | Body text, kcal numbers |
| `muted` | `#5d6762` | `#9aa49f` | Secondary text, labels, timestamps |
| `line` | `#e6dfd3` | `#2d3531` | Borders, dividers, empty ring track |
| `accent` | `#2f7d4f` | `#5cbf85` | Primary action, progress, coach card |
| `accent-ink` | `#266a42` | `#5cbf85` | Green **text** (coach label, high confidence, edited values) |
| `accent-hover` | `#24633e` | `#7dd3a0` | Primary button hover (darker in light, lighter in dark) |
| `on-accent` | `#ffffff` | `#0f1a14` | Text on a filled `accent` background |
| `accent-soft` | `#e3f1e8` | `#1f3529` | Coach card background, selected state |
| `warn` | `#d9692b` | `#f08a4f` | Over-goal ring, low confidence (fills and borders only) |
| `warn-ink` | `#a8481a` | `#f08a4f` | Warn-colored **text** |
| `warn-soft` | `#fbe9de` | `#3a2619` | Error and demo banners |

### Macro colors

Each macro has one color everywhere: rings, bars, chips, the stat grid and dish rows. Never swap or reuse them for anything else.

| Macro | Fill (bars, rings) | Text on light | Dark mode |
|---|---|---|---|
| Protein | `#c2452d` | `#c2452d` | `#e06a52` |
| Carbs | `#d9a32b` | `#8a6414` | `#e8bd55` |
| Fat | `#4a7bb7` | `#3f6ea8` | `#78a3d9` |

The bright fill colors are fine for bars and rings but too light for small text. For words and numbers, use the ink tokens: `var(--protein-ink)`, `var(--carbs-ink)`, `var(--fat-ink)`.

### Contrast (checked with antislop's contrast tool)

Text must reach 4.5:1. Rule of thumb: `text-*` classes use an `-ink` token or `ink`/`muted`; plain `accent`, `warn` and macro fills are for backgrounds, borders, bars and rings.

These pairs failed and were fixed:

| Pair | Before | After |
|---|---|---|
| `muted` on `bg` | `#6b7570`: 4.31:1 | `#5d6762`: 5.3:1 |
| Carbs text on white | `#d9a32b`: 2.28:1 | `#8a6414`: 5.37:1 |
| Fat text on white | `#4a7bb7`: 4.37:1 | `#3f6ea8`: 5.24:1 |
| Warn text on `warn-soft` | `#d9692b`: 2.97:1 | `#a8481a`: 4.94:1 |
| Green text on `accent-soft` | `#2f7d4f`: 4.32:1 | `#266a42`: 5.59:1 |
| `muted` on a `line` pill | 4.43:1 | Pill is now outlined on `card` instead |
| White on `accent` in dark mode | `#ffffff` on `#5cbf85`: 2.27:1 | `on-accent #0f1a14`: 7.85:1 |

White on `accent` in light mode (5.04:1) and protein on white (5.02:1) already passed.

### Theme

The app follows the phone's light/dark setting and has no in-app toggle. People open it for 30 seconds at a time, often in a bright food court or a dim night market, and the phone setting already matches where they are. A toggle would add a control to every screen for something they set once. Both themes must pass every contrast check above.

## Type

- **Geist Sans** for everything, **Geist Mono** only for code (env var names in the demo banner). Reason: the app is mostly numbers read at a glance, and Geist has clear, even tabular figures and a plain Latin face that sits quietly next to the system CJK font. The warmth comes from the color and copy, not the typeface. If the brand ever needs a typographic voice, add a display face for the page title only and keep Geist for numbers.
- Chinese characters fall back to the system CJK font (PingFang TC / Noto Sans TC). Don't load a separate CJK web font; it's several MB.
- All numbers use `tabular-nums` so kcal and grams don't jump around as they change.
- Scale: page title `text-3xl font-bold`, meal name `text-2xl font-bold`, section heading `text-lg font-semibold`, body `text-base`, metadata `text-xs text-muted`. No uppercase or wide-tracked labels. Section labels are sentence case and semibold ("Coach", "What we see"), with any instructions in a muted line under them.

## Layout

- Single column, `max-w-md`, `px-4`. Designed at 375px wide first; on desktop it's the same column, centered. No desktop-only layouts.
- Cards: `rounded-3xl`, `border border-line`, `bg-card`, `p-4` or `p-5`. Items inside cards are `rounded-2xl`. Buttons and chips are `rounded-full`.
- Shadows only on the macro ring card and the primary button (`shadow-sm` / `shadow-md`). Everything else uses borders.
- Vertical rhythm: `space-y-5` or `space-y-6` between sections.
- The primary action ("Scan a meal", "Save to today") is full width or the wider of two buttons, and sits within thumb reach.

## Components

- **Buttons:** `btn-primary` (filled green, for the one main action per screen) and `btn-secondary` (outlined card) live in `globals.css`. Both show a pointer cursor, a hover state (darker fill or green border) and a press state (`scale(0.98)`). Disabled buttons fade to 50% and show `not-allowed`. Every focusable element gets a 2px green `focus-visible` outline.
- **Scan result total:** kcal is the one large number (`text-5xl`); protein, carbs and fat sit smaller to its right. Nothing else on the screen competes with it.
- **Loading:** while saved data loads, numbers show "–" and the meal list says "Loading today's meals…". Never show an empty state ("Nothing logged yet", full ring) before the data has been read.

- **Macro ring:** kcal remaining in the center; protein/carbs/fat bars beside it. Turns `warn` when over, and the label switches to "kcal over".
- **Coach card:** `accent-soft` background, a short verdict in `text-lg font-semibold`, then at most 2 numbered suggestions. Each suggestion shows its macro change as colored chips (`+7g protein`, `−60 kcal`).
- **Dish rows:** English name, then the local name in `muted` (marked `lang="zh-Hant"` so screen readers pronounce it in Mandarin), then portion, then the macro line, then a confidence pill (high = `accent-soft` fill, medium = outlined, low = `warn-soft` fill).
- **Banners:** `warn-soft` background with `warn-ink` text, for errors, "No food spotted", and the demo result.
- **Tap targets:** at least 44×44px (`min-h-11`, `h-11 w-11`). When a control should look smaller, like the 28px portion stepper, keep the visual size and grow the touch area with `relative after:absolute after:-inset-2`.

## Motion

- Ring and bars animate their fill over 700ms when values change. That's the main moment of feedback, so keep it.
- Buttons press down slightly (`active:scale-[0.98]`).
- While analyzing: the photo pulses and a spinner shows with plain text ("Reading your plate…"). No skeleton screens or progress bars that pretend to know the time left.
- Respect `prefers-reduced-motion` with `motion-reduce:` classes: no pulse, no ring or bar animation. The spinner stays, since it's the only sign that work is happening.

## Writing

- Short, plain, second person: "Nothing logged yet. Snap your breakfast, a 便當, or that bubble tea."
- Suggestions are concrete local swaps with a number, never general advice ("eat more vegetables").
- No hype ("AI-powered", "smart", "revolutionary"), no exclamation marks, and no health claims. The app says "estimate", not "accurate".
- No emoji in the UI. Food names in Chinese carry the local flavor; emoji would only decorate.

## Avoid

- Gradients, glassmorphism, glowing borders, sparkle or "AI" icons.
- Red for "bad" food or going over. Food isn't good or bad here.
- Invented social proof or stats ("10,000 meals scanned").
- Gamification: streaks, badges, confetti.
- Dense nutrition-label tables. Four numbers (kcal, P, C, F) are enough.
