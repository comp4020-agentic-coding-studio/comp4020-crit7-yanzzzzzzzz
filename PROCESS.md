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

## Round three: an escape hatch for a blocked course

Next feedback: a blocked course card was a dead end, and the real system's
answer — email the convener for a permission code — deserved modeling too,
not just complaining about. Same bottom-up order again: schema
([`6e1f0eb`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/6e1f0ebd252f6ec7a335fe33d8362dc1b8134f42)),
backend logic
([`b8c780a`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/b8c780ad1e815c5f14499b6a7abf8b2ff5433475)),
routes
([`f033601`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/f033601f12cdbd85a94c36d5a760f17f9dee4319)),
UI
([`4211696`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/4211696c6176d4b866bc463dd342973bd75adefb)),
then tests
([`b44c44f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-yanzzzzzzzz/commit/b44c44f50178dbdcfe263a6530475e3185a377e6)).

There's still no login for a second "convener" role — a queue panel on the
same single-user page models both sides of the same request instead. Testing
it needed two new always-full fixture courses rather than reusing the
existing one (`COMP3530`): vitest runs spec files concurrently against one
shared database, so a test in this new file enrolling into `COMP3530` would
race `spec/enrolment.test.ts`'s own assertion that it never gets enrolled.
