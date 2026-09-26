# Crit 7 reflection

**What was the breakthrough that moved the work forward?**

Writing the contract tests before trusting the UI. Once `enrolment.test.ts`
drove the built server over HTTP instead of eyeballing the page, it exposed
that the enrol form was missing entirely for full or prerequisite-missing
courses — meaning the server's capacity/prerequisite check was never actually
reachable from those cards, even though `db.ts` enforced it correctly. A
disabled-looking button and an *absent* button look the same to a person
skimming the page, but only one of them proves the server check runs. Seeing
the gap only showed up once a test tried to submit that form and had nowhere
to click.

**What did this work change about who I want to be as a software developer?**

It sharpened a habit I want to keep: treat "the server rejects this" as a
claim that needs a request that actually reaches the server, not an inference
from what the client happens to render. It's tempting to read a disabled
button and conclude the rule is enforced, but the button is UX, not the rule.
The fix here was small — always render the form, gate only the button — but
finding it required distrusting my own UI code enough to drive it externally.
I want to keep defaulting to that: write the test that hits the real boundary
(HTTP, not component state) before believing a validation rule is actually
load-bearing, especially in a prototype small enough that skipping it feels
harmless.
