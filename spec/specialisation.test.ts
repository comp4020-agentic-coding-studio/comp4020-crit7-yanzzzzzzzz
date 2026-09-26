import { describe, expect, inject, it } from "vitest";

// Drives the running app over HTTP (the built server, a throwaway database —
// see global-setup.ts) to prove the specialisation-picker's core promise:
// the choice persists across a reload, and an unknown id is rejected
// server-side rather than trusted from the browser.
const baseUrl = inject("baseUrl");

const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

const page = () => fetch(baseUrl).then((res) => res.text());

function specialisationPanel(html: string): string {
  const start = html.indexOf('class="specialisation-grid"');
  if (start === -1) throw new Error("specialisation panel not found");
  return html.slice(start, html.indexOf("</section>", start));
}

function specialisationId(html: string, name: string): number {
  const panel = specialisationPanel(html);
  const start = panel.indexOf(`<h3>${name}</h3>`);
  if (start === -1) throw new Error(`specialisation ${name} not found`);
  const match = panel.slice(start).match(/name="specialisationId" value="(\d+)"/);
  if (!match) throw new Error(`no picker form found for ${name}`);
  return Number(match[1]);
}

describe("specialisation picker", () => {
  it("choosing a specialisation persists across a reload", async () => {
    const id = specialisationId(await page(), "Artificial Intelligence");

    const res = await post(
      "/api/choose-specialisation",
      new URLSearchParams({ specialisationId: String(id) }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    const panel = specialisationPanel(await page());
    expect(panel).toContain("Following ✓");
  });

  it("rejects an unknown specialisation id server-side", async () => {
    const res = await post(
      "/api/choose-specialisation",
      new URLSearchParams({ specialisationId: "999999" }),
    );
    const location = decodeURIComponent(res.headers.get("location") ?? "");
    expect(location).toContain("error=");
    expect(location).toContain("no such specialisation");
  });
});
