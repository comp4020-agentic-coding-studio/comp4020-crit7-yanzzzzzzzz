# Course enrolment dashboard

ANU's own course enrolment (Programs & Courses / ISIS) makes you check a
course's seats, its prerequisites and your own completed courses in three
different places, then enrol in a fourth. This is the version I wish
existed: one page that shows a course's seats and prerequisite status
against what you've actually completed, and lets you enrol, drop or mark a
course complete right there — no separate system, no guessing.

## What good looks like here

Four things about the real system are the actual annoyance, so they're the
four things this prototype fixes:

- **you can't tell if a course is full** until you try to enrol — here,
  every course card shows seats left, computed from the courses actually
  enrolled in.
- **enrolling means leaving the page** you were just reading about the
  course — here it's a button on the same card.
- **prerequisites are stated, not checked** against what you've done — here
  each course lists its prerequisites and whether you've completed them,
  and enrolling is rejected server-side if you haven't.
- **there's no view of what's left** — a progress section totals completed
  units against a program requirement, and lists what you've finished.
- **there's no sense of direction** — the real Master of Computing has five
  specialisations (Artificial Intelligence, Computational Foundations,
  Computer Systems, Information and Human-Centred Computing, Software
  Engineering) and picking one is how you know which electives are actually
  for you — here it's a panel above the catalog, and matching courses are
  highlighted rather than buried in a separate page.

I chose not to build:

- **accounts or multiple students.** This is a single-student dashboard —
  the same scope the starter's guestbook had. A capacity number is still
  meaningful without a second student: the seeded catalog includes a course
  that's already full, standing in for seats other students have taken.
- **real terms or a clock.** There's no notion of a current term or a
  session actually running; "completing" a course is a deliberate action
  (mark it complete) rather than something that happens when a term ends.
- **timetable/session clash checking.** A real pain point, but a different
  slice — this one is about what you can enrol in, not when it's on.
- **catalog or specialisation administration.** The course list and the five
  specialisations are both a fixed seed applied once at boot; adding or
  editing either isn't a flow this prototype offers. Choosing a
  specialisation only highlights its electives in the catalog — it never
  hides a course, since an elective under one direction can still be a
  prerequisite a course under another direction needs.

Server-side validation is the one thing I treat as non-negotiable rather
than a judgement call: a course being full or a prerequisite being unmet is
re-checked on the server on every enrol attempt, never assumed from a
disabled button in the browser.
