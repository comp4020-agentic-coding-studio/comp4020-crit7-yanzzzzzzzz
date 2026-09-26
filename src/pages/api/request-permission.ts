import type { APIRoute } from "astro";
import { requestPermission } from "../../lib/db";

// A plain HTML form POSTs here with the blocked course's id and an optional
// reason. Whether the course is actually blocked is re-checked server-side
// in requestPermission — a request only makes sense for a course a student
// is currently stuck on.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const reason = String(form.get("reason") ?? "");
  if (!Number.isInteger(courseId)) return redirect("/?error=no+such+course", 303);

  const result = requestPermission(courseId, reason);
  if (!result.ok) return redirect(`/?error=${encodeURIComponent(result.reason)}`, 303);
  return redirect("/", 303);
};
