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

import { z } from "zod";

import { logVertexResponseValidationFailure } from "~@idaho-th/trpc/routes/vertex/vertex.validationLog";

/** Recognizable placeholders — none of these may reach a log line. */
const PII_VALUES = [
  "Jane Doe",
  "jane@example.com",
  "123 Main St",
  "555-0100",
  "1990-01-01",
];

function buildLogger() {
  return { info: vi.fn(), debug: vi.fn() };
}

/**
 * Runs a payload through a schema and hands the failure to the subject, which
 * only ever receives a real ZodError this way.
 */
function logFailure(
  schema: z.ZodType,
  payload: Record<string, unknown>,
  sanitized: unknown = payload,
  userPrompt = "first line\nsecond line",
) {
  const parsed = schema.safeParse(sanitized);
  // A throw, not an expect: this narrows `parsed` so the subject below gets a
  // real ZodError, and a fixture that stopped failing is a broken fixture.
  if (parsed.success) {
    throw new Error("the fixture payload was expected to fail validation");
  }

  const logger = buildLogger();
  logVertexResponseValidationFailure(
    logger,
    userPrompt,
    payload,
    sanitized,
    parsed.error,
  );
  return { logger, metadata: logger.info.mock.calls[0]?.[1] };
}

describe("the PII contract", () => {
  it("logs no field value from a failing payload", () => {
    const schema = z.object({
      clientFullName: z.number(),
      email: z.number(),
      address: z.number(),
      phone: z.number(),
      dob: z.number(),
    });
    const payload = {
      clientFullName: PII_VALUES[0],
      email: PII_VALUES[1],
      address: PII_VALUES[2],
      phone: PII_VALUES[3],
      dob: PII_VALUES[4],
    };

    const { logger } = logFailure(schema, payload);

    const logged = JSON.stringify(logger.info.mock.calls);
    for (const value of PII_VALUES) {
      expect(logged).not.toContain(value);
    }
  });

  it("does not repeat the value Zod quotes in an invalid enum message", () => {
    const schema = z.object({ relation: z.enum(["Parent", "Sibling"]) });

    const { logger, metadata } = logFailure(schema, {
      relation: "Jane Q Public",
    });

    expect(metadata.validationIssues[0].message).toBe(
      "Invalid enum value. Expected 'Parent' | 'Sibling'",
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain("Jane");
  });

  it("logs value kinds and string lengths instead of values", () => {
    const schema = z.object({ clientFullName: z.number() });

    const { metadata } = logFailure(schema, { clientFullName: "Jane Doe" });

    expect(metadata.validationIssues).toEqual([
      expect.objectContaining({
        path: "clientFullName",
        rawValueKind: "string",
        rawStringLength: "Jane Doe".length,
        sanitizedValueKind: "string",
      }),
    ]);
  });

  it("truncates the prompt preview to its first line and 120 characters", () => {
    const schema = z.object({ a: z.number() });
    const firstLine = "x".repeat(200);

    const { metadata } = logFailure(
      schema,
      { a: "no" },
      { a: "no" },
      `${firstLine}\nsecond line with more text`,
    );

    expect(metadata.userPromptPreview).toBe("x".repeat(120));
    expect(metadata.userPromptPreview).not.toContain("second line");
  });

  it("falls back to a truncated whole prompt when there is no newline", () => {
    const schema = z.object({ a: z.number() });

    const { metadata } = logFailure(
      schema,
      { a: "no" },
      { a: "no" },
      "single line",
    );

    expect(metadata.userPromptPreview).toBe("single line");
  });
});

describe("value kind description", () => {
  it.each([
    ["null", null, "null"],
    ["an object", { nested: 1 }, "object"],
    ["a number", 7, "number"],
    ["a boolean", true, "boolean"],
    ["an absent field", undefined, "undefined"],
  ])("describes %s", (_label, value, expectedKind) => {
    const schema = z.object({ field: z.string() });

    const { metadata } = logFailure(schema, { field: value } as Record<
      string,
      unknown
    >);

    expect(metadata.validationIssues[0]).toMatchObject({
      rawValueKind: expectedKind,
    });
  });

  it("reports an array's length rather than its contents", () => {
    const schema = z.object({ field: z.string() });

    const { metadata } = logFailure(schema, {
      field: ["Jane Doe", "John Doe", "123 Main St"],
    });

    expect(metadata.validationIssues[0]).toMatchObject({
      rawValueKind: "array(length=3)",
    });
    expect(JSON.stringify(metadata)).not.toContain("Jane Doe");
  });

  it("resolves a path through a non-object to undefined", () => {
    const schema = z.object({ parent: z.object({ child: z.string() }) });

    // The issue path reaches parent.child, but parent is a string.
    const { metadata } = logFailure(schema, { parent: "Jane Doe" });

    expect(metadata.validationIssues[0]).toMatchObject({
      rawValueKind: "string",
    });
  });

  it("flags a string that sanitizing turned into null", () => {
    const schema = z.object({ field: z.string() });

    const { metadata } = logFailure(schema, { field: "N/A" }, { field: null });

    expect(metadata.validationIssues[0]).toMatchObject({
      rawValueKind: "string",
      sanitizedValueKind: "null",
      nullEquivalentSanitized: true,
    });
  });
});

describe("null field paths", () => {
  it("lists nested null paths without their sibling values", () => {
    const schema = z.object({ top: z.string() });

    const { metadata } = logFailure(
      schema,
      { top: 1, nested: { name: null, keep: "Jane Doe" } },
      { top: 1, nested: { name: null, keep: "Jane Doe" } },
    );

    expect(metadata.nullFieldPaths).toEqual(["nested.name"]);
  });

  it("indexes null entries inside arrays", () => {
    const schema = z.object({ top: z.string() });

    const { metadata } = logFailure(schema, {
      top: 1,
      items: [null, { name: null }, "John Doe"],
    });

    expect(metadata.nullFieldPaths).toEqual(["items[0]", "items[1].name"]);
  });

  it("lists every path for an all-null object", () => {
    const schema = z.object({ top: z.string() });

    const { metadata } = logFailure(schema, { top: null, other: null });

    expect(metadata.nullFieldPaths).toEqual(["top", "other"]);
  });

  it("is empty when nothing is null", () => {
    const schema = z.object({ top: z.string() });

    const { metadata } = logFailure(schema, { top: 1, other: "John Doe" });

    expect(metadata.nullFieldPaths).toEqual([]);
  });
});
