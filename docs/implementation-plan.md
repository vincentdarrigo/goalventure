# BetterLife — Health Transformation App MVP

## Context

The user handed off a detailed product/build spec (`Health_Transformation_App_MVP_Claude_Code_Spec.docx`, now read in full) for a configurable fitness/habit-tracking app: daily eating-window/fasting state, a repeatable habit stack, meal/calorie/protein logging via presets, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode with a mockable local-discovery adapter. The spec's core law is **configuration over hard-coding** — a specific personal plan (265lb→200lb, 100oz water, four day types with specific windows/targets) is given only as realistic seed data, never as compiled-in application logic.

The user chose to build this as a **React Native / Expo mobile app** (not web), and is open to modern tooling rather than mirroring the two sibling projects (Predictrix, thinkio-engine), which are both web stacks anyway. A survey of those siblings surfaced one directly reusable pattern — Predictrix's `football_data_provider.py`, an ABC-based adapter isolating the app from a specific data vendor — which maps cleanly onto this app's required "replaceable service adapter" for location/nutrition discovery. Neither sibling has real DB migrations, which this project will do better on from day one via Drizzle.

The project folder is currently empty except for the spec file. This plan defines the stack, folder structure, schema, and a 9-phase build order so implementation can proceed in small, independently-testable slices per the spec's own instruction to "work in small testable slices" and "stop to surface material product/architecture conflicts."

## Stack Decisions

- **Expo + TypeScript (strict)** with **Expo Router** (file-based routing)
- **Drizzle ORM over `expo-sqlite`**, with `drizzle-kit`-generated, committed migrations (a deliberate improvement over both sibling projects, neither of which has real migrations)
- **Luxon** for all date/time math — required for correct DST and midnight-crossing handling, which the spec calls out explicitly as edge cases
- **Zustand** for ephemeral UI state only; persisted domain data lives in SQLite and is read via Drizzle live-queries, never duplicated into a store
- **NativeWind** (Tailwind for RN) for styling
- **TanStack Query** used *only* for the external location-discovery adapter (loading/error/retry/caching, easy mock↔real swap) — local SQLite reads bypass it
- **Jest (`jest-expo`)** as the test runner, split so pure domain logic runs under a fast Node project and RN components under `jest-expo`; **React Native Testing Library** for the handful of components where it adds real value
- Service adapters modeled directly on Predictrix's `football_data_provider.py`: an interface + a `Mock...Provider` default implementation, so a real vendor can be dropped in later without touching UI code
- No backend, no cloud, no Postgres/Render for this MVP — fully local-first, per the spec's explicit scope boundary
- Root `CLAUDE.md`/`AGENTS.md` (agent-facing: stack, conventions, run/test commands) and `README.md` (human-facing: setup, scripts, SQLite file location, seed/reset, mock-vs-real provider switch), matching both siblings' documentation discipline

## Project Structure

```
BetterLife/
  app/                              # Expo Router screens only — no business logic
    _layout.tsx                     # DB open+migrate gate, QueryClientProvider, SafeAreaProvider
    (tabs)/
      _layout.tsx                   # Today | Travel | History | Settings
      index.tsx                     # Today dashboard
      travel.tsx
      history.tsx
      settings/                     # profile, day-types, weekly-schedule, overrides,
                                     # routines/[dayTypeId], meal-presets, meal-stacks, data (seed/reset)
    log-food.tsx                    # modal
    log-weight.tsx                  # modal
    onboarding/                     # "Start blank" vs "Load demo profile"
    +not-found.tsx

  src/
    domain/                         # PURE TypeScript — no react/react-native imports, unit-tested in Node
      types.ts
      day-type/resolveDayType.ts (+ .test.ts)
      fasting/fastingState.ts (+ .test.ts)
      routine/nextStep.ts (+ .test.ts)
      nutrition/macros.ts (+ .test.ts)
      budget/weeklyBudget.ts (+ .test.ts)
      hydration/hydration.ts (+ .test.ts)
      weight/weightChange.ts
      util/onceGuard.ts (+ .test.ts)   # duplicate-tap protection

    db/
      client.ts                     # openDatabaseSync + drizzle()
      schema.ts                     # all tables + relations
      migrate.ts
      migrations/                   # drizzle-kit output — committed, reviewed
      repositories/                 # one per entity; the only layer importing both domain + drizzle
      seed/
        demoProfile.ts              # spec Section-2 numbers live ONLY here
        seedRunner.ts

    services/location-discovery/
      types.ts
      LocationDiscoveryProvider.ts
      MockLocationDiscoveryProvider.ts
      index.ts                      # provider factory, env-driven
      fixtures.ts

    stores/                         # Zustand — UI state only
    hooks/                          # glue: domain + repos -> React (live-query wrappers, useFastingState, etc.)
    components/                     # today/ meals/ hydration/ travel/ settings/ shared/
    lib/datetime.ts                 # Luxon helpers (anchorTimeToDate, etc.), env.ts, constants.ts

  drizzle.config.ts, babel.config.js, metro.config.js, tailwind.config.js, app.config.ts
  tsconfig.json (strict), jest.config.js (multi-project), jest.setup.ts
  .env.example, CLAUDE.md, README.md
```

**Separation rule**: `src/domain/**` may only import Luxon and its own siblings — never `react-native`, `expo-*`, or `src/db/**`. This is what keeps the day-type resolver, fasting-state machine, budget math, and snapshot logic fast, isolated, Node-testable units. `src/db/repositories/**` is the only layer allowed to import both `domain` and Drizzle/`expo-sqlite`.

> **Addendum (discovered in Phase 0):** any test file colocated inside `app/` must live in an `__tests__/` subfolder (e.g. `app/(tabs)/__tests__/index.test.tsx`), never as a direct sibling `*.test.tsx`. Expo Router's file-based routing scans every file under `app/` as a potential route, and a sibling `.test.tsx` file gets exported as a real route (confirmed via `expo export --platform web`). `__tests__/` folders are excluded from route scanning. `jest.config.js`'s `testMatch` for the `app` project reflects this.

## Schema Design (Drizzle, SQLite dialect)

Key tables (full column lists to be written directly into `src/db/schema.ts`):

- `userProfile` — timezone, currentWeight, targetWeight, hydrationGoalOz, alcoholRule, units (single row)
- `dayType` — name, eatingWindowStart/End ("HH:mm", null = fast), isFastDay, calorieTarget, proteinTarget, notes, `archivedAt` (soft-delete — historical FKs must stay valid)
- `weeklySchedule` — weekday (1–7) → dayTypeId
- `dateOverride` — date (unique), overrideDayTypeId, reason
- `routineStep` — dayTypeId, label, scheduledTime, order, category, defaultHydrationOz
- `routineCompletion` — (date, routineStepId) unique, status (pending/completed/skipped/snoozed), completedAt stored separately from scheduledTime
- `mealPreset` — name, calories, proteinG, servingDescription, tags (json), archivedAt
- `mealStack` / `mealStackItem` — reusable logging shortcuts; totals computed **live** by joining current `mealPreset` rows (a Stack is a template, not a historical log, so it does *not* get the anti-mutation treatment)
- `foodLog` — dateTime (absolute UTC instant), sourcePresetId (nullable, `onDelete: set null`), description, **calories/proteinG snapshotted at write time** (never re-joined), mealSlot, `loggedOutsideWindow` boolean
- `hydrationLog` — dateTime, ounces, sourceLabel — never clamped, even above goal
- `activityLog`, `weightLog` (date unique), `appSetting` (key/json value)
- `dailyLogSnapshot` — **the mid-week-target-change fix**: `date` (PK), resolvedDayTypeId + copied name/window/targets, sourceOverrideId. Written once via `ensureDailySnapshot()` (`onConflictDoNothing` on date) the first time *any* activity is logged for a date, freezing what `resolveDayType()` produced at that moment. History/weekly-budget reads prefer the snapshot when present; fall back to a live `resolveDayType()` for untouched past days and all future days — so edits to `DayType`/`WeeklySchedule` never retroactively change a day that already has data, but freely apply everywhere else.

`foodLogRepo.logFood()` composes this: call `ensureDailySnapshot()`, compute `isWithinEatingWindow()` from the resolved day type, then insert with calories/proteinG copied verbatim from the preset (or manual entry) rather than a live FK join — so editing or deleting a `mealPreset` later never mutates history.

## Day-Type & Fasting-State Resolver

Dates are calendar-date strings; weekday derivation is pure calendar math (DST-immune). Only wall-clock arithmetic *within* a day touches DST, and that's delegated entirely to Luxon's zone-aware `DateTime` — every boundary is built via `DateTime.fromISO(date, { zone }).set({ hour, minute })`, never manual UTC-offset math.

```ts
// src/domain/day-type/resolveDayType.ts
export function resolveDayType(isoDate, weeklySchedule, overrides, dayTypesById): ResolvedDayType {
  const override = overrides.find(o => o.date === isoDate);
  if (override) return { date: isoDate, dayType: dayTypesById[override.overrideDayTypeId], source: 'override', sourceOverrideId: override.id };
  const weekday = DateTime.fromISO(isoDate).weekday;
  const dayTypeId = weeklySchedule[weekday];
  if (!dayTypeId) throw new UnconfiguredWeekdayError(weekday);
  return { date: isoDate, dayType: dayTypesById[dayTypeId], source: 'schedule' };
}
```

A `DateOverride` is a separate table the resolver only *reads* — writing one is structurally incapable of touching `weeklySchedule`, which is how "one-off override never corrupts the recurring template" gets solved by data modeling rather than resolver discipline.

`computeFastingState(now, today: ResolvedDayType, tomorrow: ResolvedDayType)` in `src/domain/fasting/fastingState.ts` handles: fast days (countdown to tomorrow's real window, not a fixed 24h), midnight-crossing windows (`if (end <= start) end = end.plus({days:1})`, handled generically, no special-casing), and before/during/after-window countdowns — always operating on zoned Luxon `DateTime`s so DST transitions resolve correctly by construction. `isWithinEatingWindow(at, resolved)` reuses the same boundary logic for the "logged outside window" flag.

## Service Adapter (Location Discovery)

Modeled directly on `football_data_provider.py`'s interface/implementation split:

```ts
// src/services/location-discovery/LocationDiscoveryProvider.ts
export interface LocationDiscoveryProvider {
  findHighProteinFood(location: GeoPoint, options: DiscoveryQueryOptions): Promise<FoodVenueResult[]>;
  findMovementDestinations(location: GeoPoint, options: DiscoveryQueryOptions): Promise<MovementDestinationResult[]>;
}
```

`MockLocationDiscoveryProvider` (fixtures + simulated latency) is the only MVP implementation; `createLocationDiscoveryProvider()` picks it via `EXPO_PUBLIC_DISCOVERY_PROVIDER`, defaulting to mock, so a real vendor (Google Places/Yelp/Foursquare) is a future new class, never a UI change. The Travel screen renders `DiscoveryList` (TanStack Query state) and `ManualLogFallback` (plain, always-mounted logging form) as unconditional siblings — so discovery failure never blocks manual tracking, per FR-08's acceptance criterion.

## Seed / Demo Data Strategy

`src/db/seed/demoProfile.ts` holds the spec's Section-2 numbers (the actual personal plan) as plain data — nothing in `src/domain/**` or `src/db/schema.ts` imports it. Onboarding offers "Start from scratch" vs "Load demo profile"; `seedRunner.applySeedProfile()` is also reachable from Settings > Data for repeat QA resets. Jest unit tests use their own small fixtures, decoupled from product copy.

## Phased Build Plan

Each phase is independently runnable/testable before moving on.

1. **Bootstrap** — Expo TS template, Expo Router, strict tsconfig, ESLint/Prettier, NativeWind, Jest+jest-expo with one smoke test, `CLAUDE.md`/`README.md` skeletons. *Verify*: app boots, `npm test` passes, `tsc --noEmit` clean. — **DONE**
2. **Foundation** — tab shell; full `schema.ts` + first migration; `db/migrate.ts` gate in root layout; `lib/datetime.ts`; `userProfileRepo` + onboarding writing a profile. *Verify*: Jest for datetime helpers; manual restart-persistence check.
3. **Day-type & schedule + resolver** — CRUD for `dayType`/`weeklySchedule`/`dateOverride`; `resolveDayType`/`fastingState`; Today's eating-window card wired live. *Verify*: exhaustive resolver/fasting-state Jest suite (override precedence, midnight-crossing, DST-pinned instants); manual live-update check.
4. **Habit stack** — `routineStep`/`routineCompletion` repos + editor; `nextStep.ts`; checklist + next-action banner on Today. *Verify*: Jest for ordering/tie-breaks/all-done; manual per-date isolation check.
5. **Meal presets & food logging** — preset/stack CRUD; `foodLogRepo.logFood` with snapshotting; `onceGuard` for duplicate taps; outside-window flagging; Today's meal grid + macro progress. *Verify*: Jest for macros + snapshot-independence + onceGuard; manual edit-preset-after-logging check.
6. **Target snapshot + weekly budget** — `dailyLogSnapshot` + `ensureDailySnapshot` wired into every write repo; `weeklyBudget.ts`; History reads snapshot-first. *Verify*: the mid-week-target-change scenario end-to-end, both in Jest and manually.
7. **Hydration** — `hydrationLog` repo + quick-add config; `hydration.ts` (no clamping). *Verify*: Jest for over-goal math; manual over-goal display check.
8. **Travel/Wildcard + discovery adapter** — override-based day-type switch; provider interface + mock + TanStack Query hooks; Travel screen with always-available manual fallback. *Verify*: RTL test forcing provider rejection; manual override-doesn't-corrupt-schedule check.
9. **Weight log, polish, history editing, empty states, docs hardening** — `weightLog` + `weightChange.ts`; History edit/delete with live recalculation; empty states for fresh profile and zero-log dates; fill remaining edge-case tests; finalize `CLAUDE.md`/`README.md`. *Verify*: full `npm test` green, `tsc --noEmit` clean, full manual walkthrough from fresh install.

## Testing Plan — Edge Cases from the Spec

| Edge case | Covered by |
|---|---|
| Midnight-crossing windows | `fastingState`/`isWithinEatingWindow` synthetic 20:00–04:00 DayType tests |
| DST transitions | `fastingState` tests pinned to real US transition dates |
| Override never corrupts recurring schedule | `resolveDayType` test: override one Tuesday, assert the next Tuesday is unaffected |
| Logging outside window never rejects | `logFood` inserts with `loggedOutsideWindow: true` before/after window |
| Mid-week target change preserves history | snapshot test: log Monday, change target, assert Monday frozen / Tuesday fresh |
| Preset edit/delete doesn't mutate logs | mutate/delete preset after logging, assert `foodLog` row unchanged |
| Duplicate-tap protection | `onceGuard` fake-timer double-fire test |
| Hydration over-goal never clamped | `hydration.ts` sum > goal test |
| Travel screen resilience | RTL: provider rejects → manual fallback still logs |
| Empty states | fresh-DB → onboarding route; zero-log date → `EmptyState`, no crash |

## Assumptions Flagged (proceeding with these; will adjust if wrong)

- Pin a specific stable Expo SDK at kickoff (`npx expo install --fix`) and verify the `drizzle-orm`/`drizzle-kit`/`expo-sqlite` version triangle before generating the first migration — this driver combination is newer surface area than Prisma/SQLAlchemy.
- Travel/Wildcard gets a permanent 4th tab for MVP simplicity, even though it's realistically relevant ~1 day/week.
- Logs store an absolute UTC instant, always rendered in the *current* profile timezone (not the zone active at logging time) — simplest correct default; can revisit if multi-timezone travel history turns out to matter.
- `userProfile` stays a soft singleton (`LIMIT 1` query) rather than a hard-enforced single row.
- `onceGuard` duplicate-tap protection is generalized to hydration/routine taps too, not just meal logging.
- No push notifications/background tasks in this MVP — fasting countdown is foreground-only.

## Verification

- `npm test` (Jest, multi-project: domain logic under Node, components under `jest-expo`) after every phase.
- `npx tsc --noEmit` clean throughout (strict mode).
- `npx expo start` manual walkthrough on each phase's specific check above.
- End of Phase 9: full fresh-install walkthrough — onboarding → load demo profile → exercise Today/Travel/History/Settings → force-quit and relaunch to confirm persistence.
