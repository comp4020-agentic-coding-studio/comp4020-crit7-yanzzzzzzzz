import type { APIRoute } from "astro";
import { enrol } from "../../lib/db";

// A plain HTML form POSTs here with the course's id. Enrolment rules
// (capacity, prerequisites) are re-checked here, never trusted from a
// disabled button in the browser. On rejection we redirect back with the
// reason in the query string rather than throwing, so the dashboard can
// show it with no client-side JavaScript at all — the same no-JS-required
// POST + redirect pattern the starter's guestbook used.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  if (!Number.isInteger(courseId)) return redirect("/?error=no+such+course", 303);

  const result = enrol(courseId);
  if (!result.ok) return redirect(`/?error=${encodeURIComponent(result.reason)}`, 303);
  return redirect("/", 303);
};
