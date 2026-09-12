import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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
