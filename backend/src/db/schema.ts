import { date, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayName: text('display_name').notNull(),
  accountSecretHash: text('account_secret_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const deviceLinkCode = pgTable('device_link_code', {
  code: text('code').primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => account.id),
  purpose: text('purpose', { enum: ['partner_pair', 'device_link'] }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const partnership = pgTable(
  'partnership',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id), // the tracked user
    partnerAccountId: uuid('partner_account_id')
      .notNull()
      .references(() => account.id), // the viewer
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('partnership_account_partner_unique').on(t.accountId, t.partnerAccountId)]
);

// An account's own configured set of check-in fields — never a hardcoded
// list of field names, per the app's "configuration over hard-coding" law.
// `key` is immutable once created (it's what a daily_summary payload keys
// on); `valueType` is likewise fixed after creation so an existing key's
// historical payload values don't silently change shape. Removing an item
// archives it rather than deleting it, so past daily_summary rows that still
// reference its key stay interpretable.
export const checkInItem = pgTable(
  'check_in_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    key: text('key').notNull(),
    label: text('label').notNull(),
    valueType: text('value_type', { enum: ['boolean', 'number', 'text'] }).notNull(),
    order: integer('order').notNull().default(0),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('check_in_item_account_key_unique').on(t.accountId, t.key)]
);

// One row per account per date; `payload` is a free-form JSON object keyed
// by whatever check_in_item keys existed when it was submitted — the server
// never needs to know the item shape to store or serve it back.
export const dailySummary = pgTable(
  'daily_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    date: date('date', { mode: 'string' }).notNull(),
    payload: jsonb('payload').notNull().$type<Record<string, boolean | number | string>>(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('daily_summary_account_date_unique').on(t.accountId, t.date)]
);
