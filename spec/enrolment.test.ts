import { describe, expect, inject, it } from "vitest";

// Drives the running app over HTTP (the built server, a throwaway database —
// see global-setup.ts) to prove the crit's core promises: a course enrolled
// in persists across a reload, and the rules that make the dashboard worth
// using — seat capacity, prerequisites — are enforced server-side, not just
// hidden behind a disabled button.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

const page = () => fetch(baseUrl).then((res) => res.text());

// The dashboard renders the catalog inside `<ul class="catalog">`; the
// progress summary above it lists completed courses by name too, so we
// scope every lookup to the catalog to avoid matching that section instead.
function catalogCard(html: string, code: string): string {
  const catalog = html.slice(html.indexOf('class="catalog"'));
  const start = catalog.indexOf(`${code} —`);
  if (start === -1) throw new Error(`course ${code} not found in the catalog`);
  return catalog.slice(start, catalog.indexOf("</li>", start));
}

function courseId(html: string, code: string): number {
  const match = catalogCard(html, code).match(/name="courseId" value="(\d+)"/);
  if (!match) throw new Error(`no enrolment form found for ${code}`);
  return Number(match[1]);
}

async function ensureCompleted(code: string): Promise<void> {
  if (catalogCard(await page(), code).includes("Completed")) return;
  if (!catalogCard(await page(), code).includes("Enrolled")) {
    await post("/api/enrol", new URLSearchParams({ courseId: String(courseId(await page(), code)) }));
  }
  await post("/api/complete", new URLSearchParams({ courseId: String(courseId(await page(), code)) }));
}

describe("enrolment", () => {
  it("enrolling in an open, prerequisite-free course persists across a reload", async () => {
    const id = courseId(await page(), "COMP1100");

    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    expect(catalogCard(await page(), "COMP1100")).toContain("Enrolled");
  });

  it("rejects enrolling in a course that's already full", async () => {
    const id = courseId(await page(), "COMP3530");

    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("error=");
    expect(location).toContain("full");

    expect(catalogCard(await page(), "COMP3530")).not.toContain("Enrolled");
  });

  it("rejects enrolling without a completed prerequisite", async () => {
    const id = courseId(await page(), "COMP2100");

    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("prerequisites not met");

    expect(catalogCard(await page(), "COMP2100")).not.toContain("Enrolled");
  });

  it("completing prerequisites unlocks enrolling in the course that needs them", async () => {
    await ensureCompleted("COMP1100");
    await ensureCompleted("COMP1130");

    const id = courseId(await page(), "COMP2100");
    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    expect(res.headers.get("location")).toBe("/");

    expect(catalogCard(await page(), "COMP2100")).toContain("Enrolled");
  });
});
