import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  sourceUrl: text('source_url'),
  content: text('content').notNull(),
  lastPosition: integer('last_position').notNull().default(0),
  lastReadAt: timestamp('last_read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const words = pgTable('words', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').references(() => documents.id, {
    onDelete: 'set null',
  }),
  word: text('word').notNull(),
  contextSentence: text('context_sentence').notNull(),
  meaning: text('meaning').notNull(),
  phonetic: text('phonetic'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  wordId: uuid('word_id')
    .notNull()
    .references(() => words.id, { onDelete: 'cascade' }),
  easeFactor: real('ease_factor').notNull().default(2.5),
  intervalDays: integer('interval_days').notNull().default(0),
  repetitions: integer('repetitions').notNull().default(0),
  nextReviewAt: timestamp('next_review_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Word = typeof words.$inferSelect;
export type NewWord = typeof words.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
