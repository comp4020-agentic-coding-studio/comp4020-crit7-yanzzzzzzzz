# Process overview

## What I built

A single-student course enrolment dashboard: one card per course showing
seats left, prerequisite status against what's actually completed, and an
inline enrol/drop/complete action, backed by server-side capacity and
prerequisite checks. `README.md` covers what it is and what good looks like
here.

## How I got here

I worked the stack bottom-up so each commit stood on a real, checkable layer
below it. Schema first —
[`1797696`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/17976968b99285ff5d6b9f1f8686875bd5092e7c)
replaced the guestbook's `messages` table with courses/prerequisites/enrolments
and the enrol/drop/complete/progress helpers in `db.ts`, using two migrations
instead of `drizzle-kit`'s interactive rename prompt, which needs a TTY this
environment doesn't have. Routes came next
([`6201993`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/6201993c9bc0632df2fa61dc89df9cf83be3cb4c)),
then the UI itself
([`00c02c4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/00c02c425fe51e951e9f9e7ae038316fda0b0e2e)).

I knew it was right because I replaced the guestbook's HTTP-level spec with
my own contract tests
([`86de11c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/86de11c4273f77afbd8b5da349a4e4b3b602de19)):
an enrolment survives a reload, capacity and prerequisite rejections happen
server-side (not just a disabled button), and completing a prerequisite
unlocks the course that needed it. Running that suite caught a real gap: the
UI was omitting the enrol form entirely for full or prereq-missing courses,
which made the button's *absence* the actual gate rather than the server
check —
[`1ce5c86`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/1ce5c86f45af6ed7698fdc24501759a713aa335a)
fixed that by always rendering the form and disabling the button as a hint
only. Docs
([`62a067c`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/62a067cd2ecba844231b9bdf84617c62a1c5d120))
came last, once the app matched what they claim.
