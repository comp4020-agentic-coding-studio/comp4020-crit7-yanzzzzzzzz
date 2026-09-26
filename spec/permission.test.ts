import { describe, expect, inject, it } from "vitest";

// Drives the running app over HTTP (the built server, a throwaway database —
// see global-setup.ts) to prove the permission-request flow's core promise:
// a blocked course can be asked for an exception, the convener's decision
// takes effect server-side, and it's never just a disabled button lifting.
//
// COMP8010/COMP8020 are dedicated always-full fixtures for this file — reusing
// spec/enrolment.test.ts's own always-full course (COMP3530) would race
// against its "stays not enrolled" assertion, since vitest runs spec files
// concurrently against one shared database.
const baseUrl = inject("baseUrl");

const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

const page = () => fetch(baseUrl).then((res) => res.text());

function catalogCard(html: string, code: string): string {
  const catalog = html.slice(html.indexOf('class="catalog"'));
  const start = catalog.indexOf(`${code} —`);
  if (start === -1) throw new Error(`course ${code} not found in the catalog`);
  return catalog.slice(start, catalog.indexOf("</li>", start));
}

function courseId(html: string, code: string): number {
  const match = catalogCard(html, code).match(/name="courseId" value="(\d+)"/);
  if (!match) throw new Error(`no enrol form found for ${code}`);
  return Number(match[1]);
}

function queueSection(html: string): string {
  const start = html.indexOf('id="permission-heading"');
  if (start === -1) throw new Error("permission queue heading not found");
  return html.slice(start, html.indexOf("</section>", start));
}

describe("permission requests", () => {
  it("an approved request lets the student enrol in an always-full course", async () => {
    let html = await page();
    const id = courseId(html, "COMP8010");
    expect(catalogCard(html, "COMP8010")).toContain("Request permission to enrol");

    await post(
      "/api/request-permission",
      new URLSearchParams({ courseId: String(id), reason: "Need it for my thesis" }),
    );

    html = await page();
    expect(catalogCard(html, "COMP8010")).toContain("waiting on the convener");
    expect(queueSection(html)).toContain("COMP8010");
    expect(queueSection(html)).toContain("Need it for my thesis");

    await post(
      "/api/decide-permission",
      new URLSearchParams({ courseId: String(id), decision: "approved" }),
    );

    html = await page();
    expect(queueSection(html)).not.toContain("COMP8010");
    expect(catalogCard(html, "COMP8010")).toContain("Permission granted");
    expect(catalogCard(html, "COMP8010")).not.toContain("disabled");

    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    expect(res.headers.get("location")).toBe("/");
    expect(catalogCard(await page(), "COMP8010")).toContain("Enrolled");
  });

  it("a denied request leaves the course blocked and rejects enrolling", async () => {
    const id = courseId(await page(), "COMP8020");

    await post("/api/request-permission", new URLSearchParams({ courseId: String(id) }));
    await post(
      "/api/decide-permission",
      new URLSearchParams({ courseId: String(id), decision: "denied" }),
    );

    const html = await page();
    expect(catalogCard(html, "COMP8020")).toContain("Permission denied");
    expect(catalogCard(html, "COMP8020")).toContain("Can't enrol");

    const res = await post("/api/enrol", new URLSearchParams({ courseId: String(id) }));
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("full");
    expect(catalogCard(await page(), "COMP8020")).not.toContain("Enrolled");
  });

  it("rejects requesting permission for a course that isn't blocked, and deciding with no pending request", async () => {
    const openId = courseId(await page(), "COMP1720");
    const res = await post(
      "/api/request-permission",
      new URLSearchParams({ courseId: String(openId) }),
    );
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("doesn't need permission");

    const decideRes = await post(
      "/api/decide-permission",
      new URLSearchParams({ courseId: String(openId), decision: "approved" }),
    );
    const decideLocation = decodeURIComponent(decideRes.headers.get("location") ?? "");
    expect(decideLocation).toContain("no pending permission request");
  });
});
