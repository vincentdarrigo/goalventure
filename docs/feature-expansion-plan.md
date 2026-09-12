# BetterLife — Feature Expansion: Supplements, Pantry, Meal Planning, Accountability Partner

## Context

The 9-phase MVP (per `docs/implementation-plan.md`, fully built) covers scheduling, fasting, habit-stack, meal logging, weekly budget, hydration, Travel/Wildcard, and history. The user wants to go further before handing UAT/front-end polish to Codex, driven by their own ideas (a personal "virtual pantry" of ingredients with real nutrition data, drag-and-drop meal planning) plus a formal spec from Gemini that reframes the split as: **Claude builds dynamic, parameter-driven infrastructure; Codex later injects one specific user's real data (weight goals, fasting schedule, supplement doses, partner check-in rules) as UAT seed data** — the same "configuration over hard-coding" law the MVP already follows, just extended to two new domains (supplements, accountability partners) neither of which existed before.

The user separately confirmed a real architectural fork: the accountability-partner feature will be a **real backend with accounts**, not a local-only share mechanism — meaning this repo gains its first server-side component. A location-service reuse question (their existing AI-Mazing-Race app) was investigated and came up empty (private repo, no GitHub access from this environment, and the live app's location features are behind a login WebFetch can't reach) — not blocking, since the user has explicitly deprioritized location work for now; revisit directly if/when we get there.

This plan covers four new subsystems, in the user's priority order for personal excitement (pantry/planning) balanced against build risk (supplements first — smaller, mirrors existing patterns closely, quick win before the bigger pantry/planning arc).

## Locked-in decisions

- **Accountability partner = real backend + accounts** (user's explicit choice over a local-only share mechanism).
- **Backend stack: TypeScript + Drizzle (Postgres dialect) + Fastify + Zod**, new Render Web Service + new Render Postgres, in the **same git repo** under `backend/` (Render `rootDir: backend`) — not a separate repo, not Django/FastAPI like the sibling apps. Reasoning: the endpoint surface is tiny with almost no business logic (heavy frameworks are net overhead here), it reuses Drizzle knowledge just built for the mobile app, and same-repo means the check-in-item/daily-summary payload types can be shared directly between mobile and backend without a published package.
- **Pairing, not email/password auth**: each install lazily creates an `{accountId, accountSecret}` via the backend, stored in SecureStore; short-lived invite codes handle both partner-pairing and multi-device access to one's own account (same primitive, different `purpose`). Real auth (password reset, verification email) is disproportionate infrastructure for a "one user + a handful of partners" system. Tradeoff to accept: losing the only device holding an `accountSecret` before ever linking a second device is unrecoverable — mitigated with a one-time "save this recovery code" screen at account creation, not a full recovery flow.
- **Nutrition data: USDA FoodData Central (FDC)**, free API key via `api.data.gov/signup` (email only, 1,000 req/hour). Client-side key for now (`EXPO_PUBLIC_USDA_FDC_API_KEY`) — the key has no billing behind it, so worst case is quota exhaustion, not cost/data exposure. Migrate to a backend proxy (with response caching) once the accountability backend exists anyway; not a pre-req for shipping Pantry. Open Food Facts (no auth needed at all) is a good later addition specifically for barcode/packaged-goods lookup, not required now.
- **Meal planning: tap-to-assign ships as the permanent, accessible baseline; drag-and-drop is a later, purely additive enhancement on the same write path**, not a replacement. Pure DnD isn't itself accessible (screen readers, switch control), so the tap flow stays in the product regardless of whether DnD ships.
- **Ingredients/meal-preset composition is additive**: a new `isComposed` boolean on `mealPreset` (default false) plus a new `mealPresetIngredient` join table. Existing flat-value presets are completely unaffected — zero migration of existing rows, zero behavior change unless a preset opts in.

## Schema conventions

All new soft-deletable entities use `archivedAt: text('archived_at')` (nullable), matching `dayType`/`mealPreset` exactly — not a new `isActive` boolean convention. All ordering columns are named `order` (not `sortOrder`), matching `routineStep.order`/`mealStackItem.order` exactly. Every new repository imports the client via `@/src/db/client` and gets a real `better-sqlite3` integration test, matching every existing repository.

## New service adapter: `src/services/nutrition-data/`

Exact same shape as `src/services/location-discovery/`: `types.ts`, `NutritionDataProvider` interface (`search`/`getDetail`), `MockNutritionDataProvider`, `UsdaFdcProvider` (USDA nutrient IDs 1008/1003/1004/1005/1079 → calories/protein/fat/carbs/fiber), `createNutritionDataProvider()` keyed off `EXPO_PUBLIC_NUTRITION_PROVIDER` + `EXPO_PUBLIC_USDA_FDC_API_KEY`.

## New domain logic: `src/domain/supplements/timing.ts`

Reconciles a supplement's `timing` flag against `FastingState`/clock time into a checklist item. Pure, unit-tested in Node, same as `fastingState.ts`/`nextStep.ts`.

## Backend (`backend/`, new Render service)

Minimal endpoint surface: `POST /accounts` (lazy creation), `POST /device-link-codes` + `/redeem` (multi-device + partner pairing share one primitive, distinguished by `purpose`), `POST /pairings/invite` + `/accept`, `GET /pairings`, `GET/PUT /check-in-items` (account-configured, never hardcoded field names), `POST /daily-summaries` (upsert `{date, payload: jsonb}`), `GET /accounts/:id/daily-summaries` (self or a confirmed partner). Postgres tables: `account`, `device_link_code`, `partnership`, `check_in_item`, `daily_summary`. Partner-facing view is a simple read-only web page, not a mobile-app install.

## Build order (each phase independently shippable/testable, same rigor as Phases 0–9)

10. **Supplements — core CRUD.** `supplement`/`supplementDose` migration + `supplementRepo.ts`, Settings > Supplements screen. — **DONE**
11. **Supplements — Today integration.** `src/domain/supplements/timing.ts`, `useTodaySupplements`, a Supplements checklist card on Today, take/skip/undo via `onceGuard` + `ensureDailySnapshot`.
12. **Pantry — data model + manual entry.** `ingredient` table + repo, manage-ingredients screen (manual only).
13. **Pantry — USDA FDC integration.** `src/services/nutrition-data/`, search-and-prefill, `.env.example`.
14. **Pantry — compose meal presets from ingredients.** `isComposed` + `mealPresetIngredient`, live-nutrition query, `foodLog` gains `sourceIngredientId`/`sourceStackId`.
15. **Meal Planning — data model + tap-to-assign.** `mealSlot` + `mealPlanEntry` + repos, weekly grid, tap-to-assign, `convertPlanEntryToLog`.
16. **Meal Planning — drag-and-drop.** `react-native-gesture-handler` promoted to a direct dependency, `Gesture.Pan()` + `useSharedValue`, drop-zone hit-testing. Timeboxed; Phase 15 alone is already shippable.
17. **Accountability — backend skeleton.** New Render Postgres + Web Service (`backend/`), `account`/`device_link_code`/`partnership`, a "Pair with a partner" screen.
18. **Accountability — configurable check-ins + summary push.** `check_in_item` CRUD, `daily_summary` upsert, manual push action.
19. **Accountability — partner web view.** Read-only web page gated by the partner's `accountSecret`.

**Explicitly deferred past this batch:** automatic background summary sync, push notifications to partners, Open Food Facts as a secondary/barcode nutrition source, multi-dose-per-day supplements, auto-deriving check-in values from local trackers. Location-module enhancements remain out of this batch per the user's own "not important yet."

## Verification

Every phase: `npm test`, `npm run typecheck`, `npm run lint`, `npx expo export --platform web`, then a commit. New repo/domain code gets the same real-SQLite integration-test treatment as existing repos. Backend (`backend/`) gets its own test suite once Phase 17 starts. Manual on-device checks remain the honest limit of verification from this environment (drag-and-drop, full account-pairing round trip).
