import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { type Course, type Enrolment, courses, enrolments, prerequisites } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

export type { Course, Enrolment };

// A representative program total, so "what's left" has something to be left
// out of. There's no real program/degree record in this slice — see README.
export const REQUIRED_UNITS = 96;

// A student's own catalog admin is out of scope for this slice (see README),
// so the catalog is a fixed seed applied once at boot, mirroring a chunk of
// a real COMP program's prerequisite chain.
const SEED_COURSES: { code: string; title: string; units: number; capacity: number }[] = [
  { code: "COMP1100", title: "Introduction to Programming and Algorithms", units: 6, capacity: 3 },
  { code: "COMP1130", title: "Introduction to Software Engineering", units: 6, capacity: 3 },
  { code: "COMP2100", title: "Software Design Methodologies", units: 6, capacity: 2 },
  { code: "COMP2600", title: "Formal Methods for Software Engineering", units: 6, capacity: 2 },
  { code: "COMP3600", title: "Algorithms", units: 6, capacity: 1 },
  { code: "COMP4020", title: "Agentic Coding Studio", units: 6, capacity: 1 },
  { code: "COMP1720", title: "Art and Interaction Design", units: 6, capacity: 3 },
  { code: "COMP2550", title: "Studio Habits of Mind", units: 6, capacity: 3 },
  { code: "COMP3530", title: "Advanced Computer Networks", units: 6, capacity: 0 },
];

// [course, prerequisite] pairs — a course needs every prerequisite listed
// against it completed before it can be enrolled in.
const SEED_PREREQS: [course: string, requires: string][] = [
  ["COMP2100", "COMP1100"],
  ["COMP2100", "COMP1130"],
  ["COMP2600", "COMP2100"],
  ["COMP3600", "COMP2600"],
  ["COMP4020", "COMP2100"],
];

function seedCatalog(): void {
  if (db.select().from(courses).limit(1).all().length > 0) return;

  const byCode = new Map<string, number>();
  for (const course of SEED_COURSES) {
    const row = db.insert(courses).values(course).returning({ id: courses.id }).get();
    byCode.set(course.code, row.id);
  }
  for (const [code, requiresCode] of SEED_PREREQS) {
    const courseId = byCode.get(code);
    const requiresId = byCode.get(requiresCode);
    if (courseId && requiresId) {
      db.insert(prerequisites).values({ courseId, requiresId }).run();
    }
  }
}

seedCatalog();

export type EnrolmentState = "none" | "enrolled" | "completed";

export type CourseView = Course & {
  seatsLeft: number;
  state: EnrolmentState;
  prerequisites: { code: string; title: string; met: boolean }[];
  prereqsMet: boolean;
};

export function listCourses(): CourseView[] {
  const allCourses = db.select().from(courses).all();
  const allEnrolments = db.select().from(enrolments).all();
  const allPrereqs = db.select().from(prerequisites).all();

  const byId = new Map(allCourses.map((c) => [c.id, c]));
  const enrolmentByCourse = new Map(allEnrolments.map((e) => [e.courseId, e]));
  const completedCourseIds = new Set(
    allEnrolments.filter((e) => e.status === "completed").map((e) => e.courseId),
  );
  const enrolledCounts = new Map<number, number>();
  for (const e of allEnrolments) {
    if (e.status === "enrolled") {
      enrolledCounts.set(e.courseId, (enrolledCounts.get(e.courseId) ?? 0) + 1);
    }
  }

  return allCourses.map((course): CourseView => {
    const requires = allPrereqs
      .filter((p) => p.courseId === course.id)
      .map((p) => byId.get(p.requiresId))
      .filter((c): c is Course => c !== undefined);
    const enrolment = enrolmentByCourse.get(course.id);
    return {
      ...course,
      seatsLeft: course.capacity - (enrolledCounts.get(course.id) ?? 0),
      state: enrolment ? (enrolment.status as EnrolmentState) : "none",
      prerequisites: requires.map((r) => ({
        code: r.code,
        title: r.title,
        met: completedCourseIds.has(r.id),
      })),
      prereqsMet: requires.every((r) => completedCourseIds.has(r.id)),
    };
  });
}

export type EnrolResult = { ok: true } | { ok: false; reason: string };

export function enrol(courseId: number): EnrolResult {
  const course = listCourses().find((c) => c.id === courseId);
  if (!course) return { ok: false, reason: "no such course" };
  if (course.state !== "none") return { ok: false, reason: `already ${course.state} in ${course.code}` };
  if (!course.prereqsMet) {
    const missing = course.prerequisites.filter((p) => !p.met).map((p) => p.code);
    return { ok: false, reason: `prerequisites not met for ${course.code}: ${missing.join(", ")}` };
  }
  if (course.seatsLeft <= 0) return { ok: false, reason: `${course.code} is full` };

  db.insert(enrolments).values({ courseId, status: "enrolled" }).run();
  return { ok: true };
}

export function dropEnrolment(courseId: number): void {
  db.delete(enrolments)
    .where(and(eq(enrolments.courseId, courseId), eq(enrolments.status, "enrolled")))
    .run();
}

export function completeEnrolment(courseId: number): void {
  db.update(enrolments)
    .set({ status: "completed" })
    .where(and(eq(enrolments.courseId, courseId), eq(enrolments.status, "enrolled")))
    .run();
}

export function progress(): { completedUnits: number; requiredUnits: number; completed: Course[] } {
  const all = listCourses();
  const completed = all.filter((c) => c.state === "completed");
  return {
    completedUnits: completed.reduce((sum, c) => sum + c.units, 0),
    requiredUnits: REQUIRED_UNITS,
    completed,
  };
}
