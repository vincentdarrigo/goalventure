# BetterLife — Agent Instructions

Read `Health_Transformation_App_MVP_Claude_Code_Spec.docx` before making product/behavior decisions — it is the product source of truth. This file covers engineering conventions.

## What this is

A local-first, configurable fitness/habit-tracking mobile app (Expo/React Native): eating-window/fasting state, a daily habit stack, meal/calorie/protein logging via presets, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode. Core law: **configuration over hard-coding** — personal targets (weight goals, day types, windows, calorie/protein targets) are editable app data, never compiled-in constants.

## Stack

Expo + TypeScript (strict) + Expo Router (file-based routing) + Drizzle ORM over `expo-sqlite` (real, committed migrations via drizzle-kit) + Luxon (all date/time math) + Zustand (ephemeral UI state only) + NativeWind (Tailwind for RN) + TanStack Query (external service-adapter calls only, not local DB reads) + Jest/`jest-expo` + React Native Testing Library.

## Structure & conventions

- `app/` — Expo Router screens only. No business logic.
- `src/domain/` — pure TypeScript, **zero** `react`/`react-native`/`expo-*`/`src/db` imports. Day-type resolution, fasting-state math, budget/macro/hydration calculations, etc. This is what makes the hardest logic (DST, midnight-crossing windows, snapshot preservation) fast and unit-testable in Node.
- `src/db/` — Drizzle schema, client, migrations, and one repository per entity. Repositories are the only layer allowed to import both `domain` and Drizzle.
- `src/services/` — replaceable service adapters (e.g. location discovery) behind an interface, with a `Mock...Provider` as the default/only MVP implementation.
- `src/stores/`, `src/hooks/`, `src/components/`, `src/lib/` — UI-state, React glue, presentational components, shared utilities.
- **Tests colocated inside `app/` must live in an `__tests__/` subfolder** (e.g. `app/(tabs)/__tests__/index.test.tsx`), not as a sibling `*.test.tsx` file — Expo Router treats any other file under `app/` as a route, and a `.test.tsx` file left as a direct sibling gets exported as a real route.
- Full architecture, schema, and phased build plan: `docs/implementation-plan.md`. Keep its phase checklist current as work lands.

## Commands

- `npm run start` / `npm run ios` / `npm run android` / `npm run web` — run the app
- `npm test` — Jest (multi-project: `src/domain/**` under Node, everything else under `jest-expo`)
- `npm run lint` — ESLint (`expo lint`)
- `npm run typecheck` — `tsc --noEmit` (strict mode)

Run `npm test`, `npm run lint`, and `npm run typecheck` after any non-trivial change.
