import type { APIRoute } from "astro";
import { decidePermission } from "../../lib/db";

// Models the convener's side of the same request: one of two submit buttons
// on the same queue entry posts here with "approved" or "denied".
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const decision = form.get("decision");
  if (!Number.isInteger(courseId) || (decision !== "approved" && decision !== "denied")) {
    return redirect("/?error=invalid+decision", 303);
  }

  const result = decidePermission(courseId, decision);
  if (!result.ok) return redirect(`/?error=${encodeURIComponent(result.reason)}`, 303);
  return redirect("/", 303);
};
