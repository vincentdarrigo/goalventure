# BetterLife

A local-first, configurable fitness/habit-tracking mobile app: eating-window/fasting state, daily habit stacking, meal/calorie/protein logging, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode for travel days.

See `Health_Transformation_App_MVP_Claude_Code_Spec.docx` for the full product specification. See `AGENTS.md` for engineering conventions.

## Status

MVP in progress.

- **Phase 0 (bootstrap)** — done: Expo Router shell, TypeScript strict mode, NativeWind, ESLint, Jest.
- **Phase 1 (foundation)** — done: full Drizzle schema + first migration, on-device SQLite via `expo-sqlite`, a migration gate and profile gate in the root layout, Luxon date/time helpers (with DST-boundary tests), and an onboarding flow that writes a real `UserProfile` row.
- **Phase 2 (day types & schedule)** — done: CRUD for day types, the weekly schedule, and date overrides (Settings tab); a pure `resolveDayType`/`computeFastingState` domain layer (DST- and midnight-crossing-safe, with a "flexible/unrestricted" day kind alongside timed windows and hard fasts); the Today tab now shows the live eating-window/fasting state instead of a placeholder.
- **Phase 3 (habit stack)** — done: routine-step CRUD nested under each day type in Settings, a pure `nextStep` resolver (skipped steps don't block progress, snoozed ones still count as outstanding), and a live checklist + "next action" banner on the Today tab.
- **Phase 4 (meal logging)** — done: meal preset and meal stack CRUD (Settings), one-tap logging from the Today tab with duplicate-tap protection (`onceGuard`), live calorie/protein progress, and off-window logging that flags rather than rejects. FoodLog rows snapshot their nutrition values at write time — editing or deleting a preset later never changes history (covered by a real SQLite integration test, not just a pure-function one; see "Testing" below).
- **Phase 6 (target snapshots & weekly budget)** — done: `dailyLogSnapshot` freezes a day's resolved targets the first time any activity (a meal or a routine-step completion) is logged for that date, so a later DayType/schedule edit never retroactively changes an already-touched day — verified with a real mid-week-target-change integration test. The Today tab now shows a live "This week" calorie budget card (snapshot-first, live `resolveDayType` for untouched days).
- **Phase 7 (hydration)** — done: quick-add (8/16/24 oz) plus a custom amount, tracked against the profile's daily goal, never clamped even past 100%. Activity logging, weight logging, Travel/Wildcard, and full History browsing are still unbuilt.

## Stack

Expo (React Native) + TypeScript + Expo Router + Drizzle ORM (`expo-sqlite`) + Luxon + Zustand + NativeWind + TanStack Query + Jest.

## Getting started

```sh
npm install
npm run start      # then choose a platform, or:
npm run ios
npm run android
npm run web
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm test` | Runs the Jest suite (domain logic in Node, everything else under `jest-expo`) |
| `npm run lint` | ESLint via `expo lint` |
| `npm run typecheck` | `tsc --noEmit` |

## Testing

Jest runs as two projects (see `jest.config.js`):

- **`node`** — pure domain logic (`src/domain/**`), shared utilities (`src/lib/**`), and repository integration tests (`src/db/**`). Repository tests run against a real, in-memory SQLite database via `better-sqlite3` (`src/db/testClient.ts`), with the actual committed migrations applied — not a hand-written mock. This is wired in through `jest.config.js`'s `moduleNameMapper`, which redirects `@/src/db/client` to the test client for this project only; app code always imports the real `expo-sqlite`-backed client and is unaffected.
- **`app`** — React Native component tests via `jest-expo` + React Native Testing Library, for `app/**/__tests__/**` (note the required `__tests__` subfolder — see `AGENTS.md`), `components/**`, and `src/**/*.test.tsx`. Nothing here yet touches the database directly; screens that do (most of them, via live-query hooks) aren't render-tested until a concrete need defines the right mock (planned for Phase 8's Travel-screen resilience test).

## Data & storage

SQLite on-device via `expo-sqlite`, database name `betterlife.db`, accessed through Drizzle ORM (`src/db/client.ts`). Schema lives in `src/db/schema.ts`; migrations are generated with `npx drizzle-kit generate` and committed under `src/db/migrations/`. The root layout runs pending migrations on launch and blocks navigation until they succeed. There's no reset/seed-demo-data UI yet — for now, uninstalling the app (or clearing app data) is the only way to start over.

## External services

None yet. The Travel/Wildcard feature's location-discovery adapter will default to a mocked implementation with no API key required; this section will document how to switch to a real provider once one exists.
