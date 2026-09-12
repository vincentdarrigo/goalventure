import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const userProfile = sqliteTable('user_profile', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timezone: text('timezone').notNull(),
  currentWeight: real('current_weight'),
  targetWeight: real('target_weight'),
  hydrationGoalOz: real('hydration_goal_oz').notNull().default(100),
  alcoholRule: text('alcohol_rule'),
  units: text('units', { enum: ['imperial', 'metric'] })
    .notNull()
    .default('imperial'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const dayType = sqliteTable('day_type', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  eatingWindowStart: text('eating_window_start'), // "HH:mm"; null = no eating window (fast day)
  eatingWindowEnd: text('eating_window_end'), // "HH:mm"; end <= start means the window crosses midnight
  isFastDay: integer('is_fast_day', { mode: 'boolean' }).notNull().default(false),
  calorieTarget: integer('calorie_target').notNull(),
  proteinTarget: integer('protein_target').notNull(),
  notes: text('notes'),
  archivedAt: text('archived_at'), // soft-delete: historical FKs (snapshots, routine steps) must stay valid
});

export const weeklySchedule = sqliteTable('weekly_schedule', {
  weekday: integer('weekday').primaryKey(), // Luxon convention: 1 = Monday .. 7 = Sunday
  dayTypeId: integer('day_type_id')
    .notNull()
    .references(() => dayType.id),
});

export const dateOverride = sqliteTable(
  'date_override',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(), // 'YYYY-MM-DD' in the profile's timezone
    overrideDayTypeId: integer('override_day_type_id')
      .notNull()
      .references(() => dayType.id),
    reason: text('reason'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => [uniqueIndex('date_override_date_unique').on(t.date)]
);

export const routineStep = sqliteTable('routine_step', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dayTypeId: integer('day_type_id')
    .notNull()
    .references(() => dayType.id),
  label: text('label').notNull(),
  scheduledTime: text('scheduled_time'), // "HH:mm"; null = anytime
  order: integer('order').notNull(),
  category: text('category'),
  defaultHydrationOz: real('default_hydration_oz'),
});

export const routineCompletion = sqliteTable(
  'routine_completion',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    routineStepId: integer('routine_step_id')
      .notNull()
      .references(() => routineStep.id),
    status: text('status', { enum: ['pending', 'completed', 'skipped', 'snoozed'] }).notNull(),
    completedAt: text('completed_at'), // stored separately from the planned scheduledTime
  },
  (t) => [uniqueIndex('routine_completion_date_step_unique').on(t.date, t.routineStepId)]
);

export const mealPreset = sqliteTable('meal_preset', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  calories: integer('calories').notNull(),
  proteinG: real('protein_g').notNull(),
  servingDescription: text('serving_description'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  archivedAt: text('archived_at'),
});

export const mealStack = sqliteTable('meal_stack', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const mealStackItem = sqliteTable('meal_stack_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mealStackId: integer('meal_stack_id')
    .notNull()
    .references(() => mealStack.id, { onDelete: 'cascade' }),
  mealPresetId: integer('meal_preset_id')
    .notNull()
    .references(() => mealPreset.id),
  order: integer('order').notNull(),
  quantity: real('quantity').notNull().default(1),
});

export const foodLog = sqliteTable(
  'food_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dateTime: text('date_time').notNull(), // absolute UTC instant, ISO 8601
    sourcePresetId: integer('source_preset_id').references(() => mealPreset.id, {
      onDelete: 'set null',
    }),
    description: text('description').notNull(),
    calories: integer('calories').notNull(), // snapshotted at write time — never re-joined for display
    proteinG: real('protein_g').notNull(), // snapshotted at write time
    mealSlot: text('meal_slot'),
    loggedOutsideWindow: integer('logged_outside_window', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(current_timestamp)`),
  },
  (t) => [index('food_log_date_time_idx').on(t.dateTime)]
);

export const hydrationLog = sqliteTable(
  'hydration_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dateTime: text('date_time').notNull(),
    ounces: real('ounces').notNull(), // never clamped, even above the daily goal
    sourceLabel: text('source_label'),
  },
  (t) => [index('hydration_log_date_time_idx').on(t.dateTime)]
);

export const activityLog = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateTime: text('date_time').notNull(),
  type: text('type').notNull(),
  durationMinutes: integer('duration_minutes'),
  notes: text('notes'),
  distance: real('distance'),
});

export const weightLog = sqliteTable(
  'weight_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    weight: real('weight').notNull(),
  },
  (t) => [uniqueIndex('weight_log_date_unique').on(t.date)]
);

export const appSetting = sqliteTable('app_setting', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }),
});

// The mid-week-target-change fix: written once, the first time any activity is
// logged for a calendar date, freezing what resolveDayType() produced at that
// moment. Later edits to dayType/weeklySchedule never retroactively change a
// day that already has data — see docs/implementation-plan.md.
export const dailyLogSnapshot = sqliteTable('daily_log_snapshot', {
  date: text('date').primaryKey(),
  resolvedDayTypeId: integer('resolved_day_type_id')
    .notNull()
    .references(() => dayType.id),
  dayTypeName: text('day_type_name').notNull(),
  eatingWindowStart: text('eating_window_start'),
  eatingWindowEnd: text('eating_window_end'),
  isFastDay: integer('is_fast_day', { mode: 'boolean' }).notNull(),
  calorieTarget: integer('calorie_target').notNull(),
  proteinTarget: integer('protein_target').notNull(),
  sourceOverrideId: integer('source_override_id').references(() => dateOverride.id),
  capturedAt: text('captured_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});
