# Goalventure — Agent Instructions

Read `Health_Transformation_App_MVP_Claude_Code_Spec.docx` before making product/behavior decisions — it is the product source of truth. This file covers engineering conventions.

## What this is

A local-first, configurable fitness/habit-tracking mobile app (Expo/React Native): eating-window/fasting state, a daily habit stack, meal/calorie/protein logging via presets, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode. Core law: **configuration over hard-coding** — personal targets (weight goals, day types, windows, calorie/protein targets) are editable app data, never compiled-in constants. The core MVP (all 9 phases) is built; see README.md's Status section for what's done and the known gaps deferred beyond it.

## Stack

Expo + TypeScript (strict) + Expo Router (file-based routing) + Drizzle ORM over `expo-sqlite` (real, committed migrations via drizzle-kit) + Luxon (all date/time math) + Zustand (ephemeral UI state only — nothing has needed it yet; all state so far is either DB-backed live queries or local component state) + NativeWind (Tailwind for RN) + TanStack Query (external service-adapter calls only, not local DB reads) + Jest/`jest-expo` + React Native Testing Library.

## Structure & conventions

- `app/` — Expo Router screens only. No business logic.
- `src/domain/` — pure TypeScript, **zero** `react`/`react-native`/`expo-*`/`src/db` imports. Day-type resolution, fasting-state math, budget/macro/hydration calculations, etc. This is what makes the hardest logic (DST, midnight-crossing windows, snapshot preservation) fast and unit-testable in Node.
- `src/db/` — Drizzle schema, client, migrations, and one repository per entity. Repositories are the only layer allowed to import both `domain` and Drizzle. Every repository imports the client via `@/src/db/client` (not a relative path) — this is required for the test-client swap below to work.
- `src/services/` — replaceable service adapters (e.g. location discovery) behind an interface, with a `Mock...Provider` as the default/only MVP implementation.
- `src/hooks/` — glue: compose `domain` + repositories into React (live-query wrappers, `useFastingState`, etc.). Hooks call repositories, never `db`/`schema` directly.
- `src/stores/`, `src/components/`, `src/lib/` — UI-state, presentational components, shared utilities.
- **Tests colocated inside `app/` must live in an `__tests__/` subfolder** (e.g. `app/(tabs)/__tests__/index.test.tsx`), not as a sibling `*.test.tsx` file — Expo Router treats any other file under `app/` as a route, and a `.test.tsx` file left as a direct sibling gets exported as a real route.
- Full architecture, schema, and phased build plan (including per-phase addenda on deviations and gotchas): `docs/implementation-plan.md` (original 9-phase MVP, complete) and `docs/feature-expansion-plan.md` (supplements, pantry, meal planning, accountability-partner backend — in progress).

## Testing

- Jest runs as two projects (`jest.config.js`): **`node`** (`src/domain/**`, `src/lib/**`, `src/db/**`) and **`app`** (`app/**/__tests__/**`, `components/**`, `src/**/*.test.tsx`, via `jest-expo` + React Native Testing Library).
- Both projects redirect `@/src/db/client` to `src/db/testClient.ts` — a real in-memory SQLite database via `better-sqlite3` (pure Node, no Expo runtime needed) with the actual committed migrations applied. Repository *and* component tests run against genuine SQL, not a hand-written mock. Call `resetTestDb()` in `beforeEach` for isolation — it disables FK enforcement for the clear only, since `sqlite_master`'s table order isn't dependency-safe.
- The `app` project also needs `__mocks__/expo-sqlite.js`: `drizzle-orm`'s `useLiveQuery` imports `addDatabaseChangeListener` directly from `expo-sqlite`, independent of the client swap above. The mock is a no-op subscription, so a rendered screen's *initial* live-query load works but won't react to writes made elsewhere in the same test — assert against the database (a repository query) instead of an expected re-render.
- `npm test` runs with `--forceExit` (TanStack Query's GC timers otherwise keep the process alive after the suite finishes — not a real leak).
- RNTL v14: `render`, `fireEvent`, and `act` are all async — always `await` them, or the state update they trigger silently doesn't flush before your next assertion.

## Commands

- `npm run start` / `npm run ios` / `npm run android` / `npm run web` — run the app
- `npm test` — Jest (see Testing above)
- `npm run lint` — ESLint (`expo lint`)
- `npm run typecheck` — `tsc --noEmit` (strict mode)

Run `npm test`, `npm run lint`, and `npm run typecheck` after any non-trivial change. Also run `npx expo export --platform web` after larger changes (schema, routing, provider wiring) — it exercises the full Metro bundler + static-render pipeline end to end and has caught real issues (missing resolver config, broken routes) that unit tests don't touch. Clean up its `dist/`/`.expo/` output afterward; neither is meant to be committed.

## Backend (`backend/`)

A separate Node/TypeScript project living under this repo (Render `rootDir: backend`), for the accountability-partner feature — **not** part of the Expo app above. Its own `package.json`/`tsconfig.json`/`eslint.config.js`/`vitest.config.ts`; none of the commands above apply to it. Stack: Fastify + Drizzle ORM (Postgres dialect, `node-postgres`) + Zod + Vitest, with `@electric-sql/pglite` (embedded WASM Postgres) backing `db/testClient.ts`'s `createTestDb()` for tests — mirrors the mobile app's real-database-not-a-mock testing philosophy, but as a fresh-instance-per-call factory rather than a module-level singleton. Route-registration functions (`registerAccountRoutes`, etc.) are generic over Drizzle's `PgDatabase<TQueryResult, typeof schema>` so the same code takes either the real or test database with no separate type alias needed. Run `npm test` / `npm run typecheck` / `npm run lint` from inside `backend/`, independent of the app's own verification suite — a change to one rarely requires re-verifying the other, since they share no build step or test runner. Full design notes and current deploy status: `docs/feature-expansion-plan.md`'s Phase 17 addendum.
