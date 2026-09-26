import type { APIRoute } from "astro";
import { dropEnrolment } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  if (Number.isInteger(courseId)) dropEnrolment(courseId);
  return redirect("/", 303);
};
