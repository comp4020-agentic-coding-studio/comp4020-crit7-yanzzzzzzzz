import type { APIRoute } from "astro";
import { completeEnrolment } from "../../lib/db";

// Simulates finishing a course — there's no term clock in this slice, so
// this is how an enrolled course becomes a completed one, which is what
// unlocks any course that lists it as a prerequisite.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  if (Number.isInteger(courseId)) completeEnrolment(courseId);
  return redirect("/", 303);
};
