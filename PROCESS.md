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

## Round two: a real look, and a real direction

Once the core flow worked, the app still looked like an unstyled prototype and
did nothing the real Programs & Courses page didn't already do. I restyled it
with a contrast-checked palette
([`a2e6838`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/a2e6838c20da7992b91cd864a7c0e5c8c8eed782))
and added client-side catalog search
([`0bb4f84`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/0bb4f848b99e0dbe46bf022348faecf6d4a65eaa)).

The user then pushed on scope directly: the real ANU Master of Computing has
five specialisations you pick and enrol courses within, and the 9-course flat
catalog had no such structure. I checked the published crit-7 spec first —
it only asks for "a slice," with no fixed course list or specialisation
requirement — so this was a deliberate scope decision, not a spec obligation,
and I went through the same bottom-up order as round one: schema
([`93b6ae0`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/93b6ae06cb91a0444582513b8a5c25a72e65f052)),
seed data and query logic
([`4a203d4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/4a203d4624102b787cd22f3be879669cf8a3a052)),
the route
([`a8d2061`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/a8d2061c9a69a94ac956037098e614411bd05fdc)),
the UI
([`6225d54`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/6225d54fb940a561ca0c492f9abc114382656969)),
then tests
([`f9e3045`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/f9e3045574be0c9c15542afefc780f277d75cca7)).
The one design call that mattered: a chosen specialisation only *highlights*
its electives, it never hides the rest of the catalog — a direction's
elective can still be a prerequisite a course under another direction needs,
so hiding by direction would have hidden a course a student still needed.
