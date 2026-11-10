// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  DIGEST_DASHBOARD_URL_PLACEHOLDER,
  DIGEST_EMAIL_SUBJECT,
  DIGEST_TEMPLATE_FILENAME,
  INTERCOM_ENV,
} from "~@idaho-th/trpc/intercom/intercom.constants";
import { IDAHO_TH_DASHBOARD_HOST } from "~@idaho-th/trpc/routes/common/hosts";

type TemplateModule = typeof import("../intercom.template");

const templateDirs: string[] = [];

/** A throwaway template dir; the module caches the file it reads. */
function stageTemplate(html: string): string {
  const dir = mkdtempSync(join(tmpdir(), "idaho-th-digest-"));
  writeFileSync(join(dir, DIGEST_TEMPLATE_FILENAME), html, "utf8");
  templateDirs.push(dir);
  return dir;
}

/** The template html is memoized per module instance, so reload each time. */
async function loadTemplateModule(): Promise<TemplateModule> {
  vi.resetModules();
  return import("../intercom.template");
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const dir of templateDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveDashboardUrl", () => {
  it.each(Object.entries(IDAHO_TH_DASHBOARD_HOST))(
    "resolves APP_ENV=%s to %s",
    async (appEnv, expected) => {
      vi.stubEnv("APP_ENV", appEnv);
      const { resolveDashboardUrl } = await loadTemplateModule();

      expect(resolveDashboardUrl()).toBe(expected);
    },
  );

  it.each([
    ["an unknown value", "sandbox"],
    ["an empty value", ""],
  ])("refuses to guess a URL for %s", async (_label, appEnv) => {
    vi.stubEnv("APP_ENV", appEnv);
    const { resolveDashboardUrl } = await loadTemplateModule();

    expect(() => resolveDashboardUrl()).toThrow(
      /APP_ENV must be one of staging, production/,
    );
  });
});

describe("buildDigestEmailContent", () => {
  it("substitutes the dashboard URL into the template", async () => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate(
        `<a href="${DIGEST_DASHBOARD_URL_PLACEHOLDER}">Open</a>` +
          `<img src="${DIGEST_DASHBOARD_URL_PLACEHOLDER}/logo.png">`,
      ),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    const content = buildDigestEmailContent("https://housing.example.com");

    expect(content.subject).toBe(DIGEST_EMAIL_SUBJECT);
    // Every occurrence is replaced, not just the first.
    expect(content.htmlBody).toBe(
      '<a href="https://housing.example.com">Open</a>' +
        '<img src="https://housing.example.com/logo.png">',
    );
    expect(content.htmlBody).not.toContain(DIGEST_DASHBOARD_URL_PLACEHOLDER);
  });

  it.each([
    ["a quote", 'https://x.test/"', "https://x.test/&quot;"],
    ["an apostrophe", "https://x.test/'", "https://x.test/&#39;"],
    ["a less-than", "https://x.test/<", "https://x.test/&lt;"],
    ["a greater-than", "https://x.test/>", "https://x.test/&gt;"],
    ["an ampersand", "https://x.test/?a=1&b=2", "https://x.test/?a=1&amp;b=2"],
  ])("escapes %s in the href", async (_label, url, expected) => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate(`<a href="${DIGEST_DASHBOARD_URL_PLACEHOLDER}">Open</a>`),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    expect(buildDigestEmailContent(url).htmlBody).toBe(
      `<a href="${expected}">Open</a>`,
    );
  });

  it("neutralises an attribute-breakout payload", async () => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate(`<a href="${DIGEST_DASHBOARD_URL_PLACEHOLDER}">Open</a>`),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    const htmlBody = buildDigestEmailContent(
      '"><script>alert(1)</script>',
    ).htmlBody;

    // The payload survives as text; it can no longer close the attribute or
    // open a tag.
    expect(htmlBody).not.toContain("<script>");
    expect(htmlBody).toContain("&quot;&gt;&lt;script&gt;");
  });

  it("escapes the ampersand before the entities it introduces", async () => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate(DIGEST_DASHBOARD_URL_PLACEHOLDER),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    // "&" is replaced first, so a literal "&quot;" is not double-decoded.
    expect(buildDigestEmailContent("&quot;").htmlBody).toBe("&amp;quot;");
  });

  it("defaults the URL to the APP_ENV dashboard host", async () => {
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate(DIGEST_DASHBOARD_URL_PLACEHOLDER),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    expect(buildDigestEmailContent().htmlBody).toBe(
      IDAHO_TH_DASHBOARD_HOST.production,
    );
  });

  it("refuses a template that lost its placeholder", async () => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      stageTemplate("<a href='https://hardcoded.example.com'>Open</a>"),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    // Sending a digest whose link cannot be substituted is worse than failing.
    expect(() => buildDigestEmailContent("https://x.test")).toThrow(
      /missing placeholder/,
    );
  });

  it("reads the template file only once", async () => {
    const dir = stageTemplate(DIGEST_DASHBOARD_URL_PLACEHOLDER);
    vi.stubEnv(INTERCOM_ENV.TEMPLATE_DIR, dir);
    const { buildDigestEmailContent } = await loadTemplateModule();

    buildDigestEmailContent("https://x.test");
    rmSync(dir, { recursive: true, force: true });

    // The cached html means a second build does not touch the filesystem.
    expect(() => buildDigestEmailContent("https://y.test")).not.toThrow();
  });

  it("reports a missing template directory clearly", async () => {
    vi.stubEnv(
      INTERCOM_ENV.TEMPLATE_DIR,
      join(tmpdir(), "idaho-th-digest-does-not-exist"),
    );
    const { buildDigestEmailContent } = await loadTemplateModule();

    expect(() => buildDigestEmailContent("https://x.test")).toThrow();
  });

  // With no configured directory the module searches three fixed locations
  // relative to cwd; stubbing cwd covers each without depending on where the
  // suite happens to run from.
  it.each([
    ["the container layout", ["intercom", "templates"], []],
    ["the monorepo root", ["apps", "@idaho-th", "intercom", "templates"], []],
    ["the server directory", ["intercom", "templates"], ["server"]],
  ])("finds the template via %s", async (_label, templatePath, cwdPath) => {
    const root = mkdtempSync(join(tmpdir(), "idaho-th-cwd-"));
    templateDirs.push(root);
    const templateDir = join(root, ...templatePath);
    mkdirSync(templateDir, { recursive: true });
    writeFileSync(
      join(templateDir, DIGEST_TEMPLATE_FILENAME),
      DIGEST_DASHBOARD_URL_PLACEHOLDER,
      "utf8",
    );
    const cwd = join(root, ...cwdPath);
    mkdirSync(cwd, { recursive: true });

    vi.stubEnv(INTERCOM_ENV.TEMPLATE_DIR, "");
    vi.spyOn(process, "cwd").mockReturnValue(cwd);
    const { buildDigestEmailContent } = await loadTemplateModule();

    expect(buildDigestEmailContent("https://x.test").htmlBody).toBe(
      "https://x.test",
    );
  });
});
