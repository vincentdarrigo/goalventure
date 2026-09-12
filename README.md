# BetterLife

A local-first, configurable fitness/habit-tracking mobile app: eating-window/fasting state, daily habit stacking, meal/calorie/protein logging, hydration tracking, weekly budget rollups, and a Travel/Wildcard mode for travel days.

See `Health_Transformation_App_MVP_Claude_Code_Spec.docx` for the full product specification. See `AGENTS.md` for engineering conventions.

## Status

MVP in progress. Phase 0 (project bootstrap) complete: Expo Router shell with four placeholder tabs (Today / Travel / History / Settings), TypeScript strict mode, NativeWind, ESLint, and Jest all wired and green. No persistence or domain logic yet.

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

Not yet implemented. Once persistence lands (Drizzle over `expo-sqlite`), this section will document the on-device database file location, how to reset/seed demo data, and the migration workflow.

## External services

None yet. The Travel/Wildcard feature's location-discovery adapter will default to a mocked implementation with no API key required; this section will document how to switch to a real provider once one exists.
