import { boolean, date, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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

// Finance data intentionally stores labels and masked descriptions only. Bank
// credentials, complete account numbers, and raw statements do not belong in
// this database. Values use integer cents to avoid floating-point money math.
export const financeSettings = pgTable('finance_settings', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => account.id),
  gamblingBlocked: boolean('gambling_blocked').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const financeAccount = pgTable('finance_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => account.id),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['checking', 'credit_card', 'loan', 'installment', 'cash', 'other'] }).notNull(),
  currentBalanceCents: integer('current_balance_cents').notNull().default(0),
  availableBalanceCents: integer('available_balance_cents'),
  creditLimitCents: integer('credit_limit_cents'),
  aprBasisPoints: integer('apr_basis_points'),
  minimumPaymentCents: integer('minimum_payment_cents'),
  dueDay: integer('due_day'),
  autopay: boolean('autopay').notNull().default(false),
  status: text('status', { enum: ['active', 'closed'] }).notNull().default('active'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cashflowItem = pgTable('cashflow_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => account.id),
  financeAccountId: uuid('finance_account_id').references(() => financeAccount.id),
  name: text('name').notNull(),
  direction: text('direction', { enum: ['income', 'expense'] }).notNull(),
  amountCents: integer('amount_cents').notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  category: text('category', {
    enum: [
      'income',
      'housing',
      'family',
      'debt',
      'subscription',
      'food',
      'transport',
      'health',
      'travel',
      'fun',
      'gambling',
      'other',
    ],
  }).notNull(),
  status: text('status', { enum: ['planned', 'pending', 'paid', 'paused', 'canceled'] })
    .notNull()
    .default('planned'),
  priority: text('priority', { enum: ['critical', 'required', 'flexible'] }).notNull().default('required'),
  autopay: boolean('autopay').notNull().default(false),
  notes: text('notes'),
  partnerDecision: text('partner_decision', { enum: ['unreviewed', 'approved', 'hold'] })
    .notNull()
    .default('unreviewed'),
  partnerNote: text('partner_note'),
  decidedByAccountId: uuid('decided_by_account_id').references(() => account.id),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
