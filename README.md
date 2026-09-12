# BetterLife

A local-first, configurable fitness/habit-tracking mobile app: eating-window/fasting state, daily habit stacking, meal/calorie/protein logging, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode for travel days.

See `Health_Transformation_App_MVP_Claude_Code_Spec.docx` for the full product specification. See `AGENTS.md` for engineering conventions.

## Status

Core MVP complete (Phases 0–9 of `docs/implementation-plan.md`). Summary of what's built:

- **Foundation**: Expo Router shell, TypeScript strict mode, NativeWind, ESLint, Jest; full Drizzle schema + committed migrations over on-device SQLite (`expo-sqlite`); a migration gate + profile gate in the root layout; onboarding that writes a real `UserProfile` (no hard-coded personal values anywhere).
- **Scheduling & fasting**: day types, the weekly schedule, and one-off date overrides (Settings), resolved by a pure `resolveDayType`/`computeFastingState` domain layer — DST-safe, midnight-crossing-safe, with a "flexible/unrestricted" day kind (Travel/Wildcard, Game Day) alongside timed windows and hard fasts. The Today tab shows the live eating/fasting state and countdown.
- **Habit stack**: routine steps per day type, a pure `nextStep` resolver (skips don't block progress), a live checklist + "next action" banner on Today.
- **Meal logging**: meal preset and meal stack CRUD, one-tap logging with duplicate-tap protection (`onceGuard`), live calorie/protein progress, off-window logging that flags rather than rejects. FoodLog rows snapshot nutrition at write time — editing/deleting a preset never rewrites history.
- **Weekly budget**: `dailyLogSnapshot` freezes a day's resolved targets the first time any activity is logged for that date, so a later DayType/schedule edit never retroactively changes an already-touched day. The Today tab shows a live "This week" calorie budget card.
- **Hydration**: quick-add (8/16/24 oz) plus a custom amount, never clamped past 100% of goal.
- **Travel/Wildcard**: a mockable `LocationDiscoveryProvider` adapter (no API key required), a one-day override control that never touches the recurring weekly schedule, and a manual "I ate this" fallback verified — by a real component test forcing the discovery adapter to fail — to keep working when discovery is down.
- **History & weight**: a 14-day rolling list plus a day-detail view to review and delete meal/hydration entries (aggregates recalculate live) and log/delete a same-day weight entry; an explicit empty state for a zero-log date.
- **Data reset**: Settings > Data can wipe all on-device data for development/QA, which reactively drops the app back to onboarding.

**Feature expansion in progress** (`docs/feature-expansion-plan.md`, Phases 10–19): supplements, a virtual pantry with overridable nutrition data, drag-and-drop meal planning, and a real backend for accountability-partner sharing.
- **Phase 10 (supplements — core CRUD)** — done: `supplement`/`supplementDose` schema, a repo following the same query-builder/write-function split as every other entity, and a Settings > Supplements screen. No dose-tracking or Today integration yet — that's Phase 11.

**Known gaps, deliberately deferred beyond the original MVP pass** (see `docs/implementation-plan.md`'s Phase 9 addendum for the full reasoning):
- No activity/exercise session logging (the `activityLog` table exists in the schema; workout *completion* is tracked via the habit-stack routine step, but duration/notes/distance aren't captured anywhere yet).
- No "load a demo/example profile" seed flow — onboarding only supports entering a real profile by hand.
- No real GPS integration for Travel discovery (a fixed placeholder location is used); no real discovery provider (mock only).
- Editing a logged meal/hydration entry means delete-and-relog, not in-place field editing.
- No push notifications/reminders; the fasting countdown is foreground-only.

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
- **`app`** — React Native component tests via `jest-expo` + React Native Testing Library, for `app/**/__tests__/**` (note the required `__tests__` subfolder — see `AGENTS.md`), `components/**`, and `src/**/*.test.tsx`. Uses the same `better-sqlite3` swap as the `node` project, so screens render against a real database. `drizzle-orm`'s `useLiveQuery` also imports `addDatabaseChangeListener` directly from `expo-sqlite` (independent of which `db` instance it watches), which needs a native binding Jest doesn't have — `__mocks__/expo-sqlite.js` stubs it as a no-op subscription. That means `useLiveQuery`'s *initial* load works in tests, but it won't react to writes made elsewhere during the same test (better-sqlite3 has no equivalent to SQLite's native update hook) — assert against the database directly (a repository query) rather than an expected UI re-render.
- `npm test` runs with `--forceExit`: TanStack Query's internal garbage-collection timers keep the process alive after the suite finishes otherwise (a well-known interaction, not a leak in this app's code).

## Data & storage

SQLite on-device via `expo-sqlite`, database name `betterlife.db`, accessed through Drizzle ORM (`src/db/client.ts`). Data lives in the app's sandboxed storage (standard iOS/Android app-data location managed by `expo-sqlite` — not user-accessible without a debug build/simulator file browser), so it is local-only, single-device, and not included in this MVP's scope for cloud backup. Schema lives in `src/db/schema.ts`; migrations are generated with `npx drizzle-kit generate` and committed under `src/db/migrations/`. The root layout runs pending migrations on launch and blocks navigation until they succeed.

To start over during development or QA, use **Settings > Data > Reset all data** (`src/db/reset.ts`) — it clears every table and the app reactively drops back to onboarding, no reinstall needed. There is no "load a demo profile" seed flow; onboarding only supports entering a real profile by hand (see Status above).

## External services

The Travel/Wildcard screen's nearby-food and nearby-movement suggestions go through `src/services/location-discovery/`, an interface (`LocationDiscoveryProvider`) with a mocked default implementation (canned fixtures, simulated latency, no API key or network required). Set `EXPO_PUBLIC_DISCOVERY_PROVIDER` to switch providers once a real one exists — the Travel screen and its hooks never need to change either way. Location itself is a fixed placeholder for now; real GPS integration (via `expo-location` and its permission flow) isn't built yet.
