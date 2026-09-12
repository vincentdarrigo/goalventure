# BetterLife

A local-first, configurable fitness/habit-tracking mobile app: eating-window/fasting state, daily habit stacking, meal/calorie/protein logging, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode for travel days.

See `Health_Transformation_App_MVP_Claude_Code_Spec.docx` for the full product specification. See `AGENTS.md` for engineering conventions.

## Status

MVP in progress.

- **Phase 0 (bootstrap)** — done: Expo Router shell, TypeScript strict mode, NativeWind, ESLint, Jest.
- **Phase 1 (foundation)** — done: full Drizzle schema + first migration, on-device SQLite via `expo-sqlite`, a migration gate and profile gate in the root layout, Luxon date/time helpers (with DST-boundary tests), and an onboarding flow that writes a real `UserProfile` row.
- **Phase 2 (day types & schedule)** — done: CRUD for day types, the weekly schedule, and date overrides (Settings tab); a pure `resolveDayType`/`computeFastingState` domain layer (DST- and midnight-crossing-safe, with a "flexible/unrestricted" day kind alongside timed windows and hard fasts); the Today tab now shows the live eating-window/fasting state instead of a placeholder. Meal/hydration/activity logging, weekly budgets, and Travel/History are still unbuilt.

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

## Data & storage

SQLite on-device via `expo-sqlite`, database name `betterlife.db`, accessed through Drizzle ORM (`src/db/client.ts`). Schema lives in `src/db/schema.ts`; migrations are generated with `npx drizzle-kit generate` and committed under `src/db/migrations/`. The root layout runs pending migrations on launch and blocks navigation until they succeed. There's no reset/seed-demo-data UI yet — for now, uninstalling the app (or clearing app data) is the only way to start over.

## External services

None yet. The Travel/Wildcard feature's location-discovery adapter will default to a mocked implementation with no API key required; this section will document how to switch to a real provider once one exists.
