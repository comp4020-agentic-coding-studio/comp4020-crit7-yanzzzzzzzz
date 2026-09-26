import type { APIRoute } from "astro";
import { chooseSpecialisation } from "../../lib/db";

// A plain HTML form POSTs here with the specialisation's id. The id is
// re-validated against the specialisations table here, never trusted from
// the browser — same pattern as /api/enrol.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const specialisationId = Number(form.get("specialisationId"));
  if (!Number.isInteger(specialisationId)) {
    return redirect("/?error=no+such+specialisation", 303);
  }

  const result = chooseSpecialisation(specialisationId);
  if (!result.ok) return redirect(`/?error=${encodeURIComponent(result.reason)}`, 303);
  return redirect("/", 303);
};
