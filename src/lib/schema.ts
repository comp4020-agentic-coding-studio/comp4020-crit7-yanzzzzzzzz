import { sql } from "drizzle-orm";
import { int, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.
export const courses = sqliteTable(
  "courses",
  {
    id: int().primaryKey({ autoIncrement: true }),
    code: text().notNull(),
    title: text().notNull(),
    units: int().notNull(),
    capacity: int().notNull(),
  },
  (t) => [unique().on(t.code)],
);

// Self-referencing: a course's prerequisites are other rows in `courses`.
export const prerequisites = sqliteTable(
  "prerequisites",
  {
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    requiresId: int("requires_id")
      .notNull()
      .references(() => courses.id),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.requiresId] })],
);

// One row per course a student has taken on. No student_id: this prototype
// is a single-student dashboard, the same no-auth scope as the starter it
// replaces — see README for that call.
export const enrolments = sqliteTable("enrolments", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id),
  status: text().notNull(), // "enrolled" | "completed"
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Course = typeof courses.$inferSelect;
export type Enrolment = typeof enrolments.$inferSelect;
