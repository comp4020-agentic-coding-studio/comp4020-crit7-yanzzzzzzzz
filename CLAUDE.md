# Working rules for this repo

- **Commit after every coherent change**, not in one lump at the end. Each
  commit should be something that could stand on its own in a review of the
  process (schema, then routes, then UI, then tests, then docs — not
  "various fixes").
- **Never edit the SQLite database by hand.** The schema in `src/lib/schema.ts`
  is ground truth; changes go through `pnpm db:generate` and a committed
  migration, per the comment at the top of that file.
- **Validate on the server, always.** Capacity and prerequisite checks are
  re-run in `src/lib/db.ts` on every enrol attempt — a disabled button in the
  browser is a UX hint, never the actual rule.
- **Typecheck (`pnpm typecheck`) before every commit that touches app code.**
  Run the full suite (`pnpm check`) before anything gets deployed or marked
  as done, not just typecheck.
- **Stay inside the picked slice.** This prototype is a single-student course
  enrolment dashboard — see README.md's "chose not to build" list before
  adding scope (accounts, timetables, catalog admin, etc.) back in.
- **Don't work around missing local setup.** If something needs a system
  change outside the repo (installing a compiler toolchain, setting git
  identity, `sudo`), ask rather than finding a workaround that skips
  verification.
