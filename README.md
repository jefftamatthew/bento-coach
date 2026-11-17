# Bento Coach

Snap a photo of your meal and Bento Coach:

- splits it into dishes (great at 便當, 自助餐 trays, night-market food, bubble tea),
- estimates calories, protein, carbs and fat for each one,
- **coaches you** with 1–2 small, local changes to make the meal fit your day better, such as "add a 滷蛋: +7g protein" or "switch to 微糖: −60 kcal".

Meals are saved in a daily log in your browser, sorted into breakfast, lunch, dinner and snacks. You can flip back through earlier days, log a meal you forgot, and open any meal to see how much of your day it covered. Each scan's advice takes into account what you've already eaten that day.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env.local` and put in your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Run `npm run dev` and open http://localhost:3000

## Demo mode (no API key)

If `ANTHROPIC_API_KEY` isn't set, every scan returns one of three sample meals from `lib/demo.ts`, marked with a "Demo result" banner. This lets you click through the whole flow before you have a key. Set `DEMO_MODE=1` in `.env.local` to force demo mode even when a key is set, for example during a presentation with bad Wi-Fi.

## Using a phone camera

Browsers only allow camera access over HTTPS (or on `localhost`). To test on a phone:

- **Same Wi-Fi:** run `npm run dev:https`, then open `https://<your-computer-ip>:3000` on the phone and accept the certificate warning.
- **Deploy:** push to GitHub and import it into Vercel, adding `ANTHROPIC_API_KEY` as an environment variable.

If the camera isn't available, use **Upload photo**, which on phones also opens the camera.

## How it works

| Part | File |
|---|---|
| Daily dashboard (date strip, goal ring, meal-type tabs, meal cards, goal presets) | `app/page.tsx` |
| Meal detail (photo, share of daily goal, coach tip, dishes) | `app/meal/[id]/page.tsx` |
| Camera capture / upload, result + coach | `app/scan/page.tsx`, `components/*` |
| Server route calling Claude vision (key stays on the server) | `app/api/analyze/route.ts` |
| Prompt (Taiwanese-food expertise + coaching rules) | `lib/prompt.ts` |
| Structured output schema (zod) | `lib/schema.ts` |
| Daily log in `localStorage` | `lib/storage.ts` |

Photos are resized to 1024px in the browser before upload. The server sends them to `claude-opus-5-5` with a zod schema, so the response is always valid JSON with dishes, macros, a verdict and suggestions.

Numbers are estimates from a photo, not medical advice.
